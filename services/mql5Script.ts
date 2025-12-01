
export const generateMQL5Code = (syncKey: string, backendUrl: string) => `//+------------------------------------------------------------------+
//|                                                    TradeSync.mq5 |
//|                                  Copyright 2024, TradeSync App   |
//|                                       https://www.tradesync.app  |
//+------------------------------------------------------------------+
#property copyright "TradeSync"
#property link      "https://www.tradesync.app"
#property version   "1.00"
#property strict

// --- INPUT PARAMETERS ---
input string SyncKey = "${syncKey}"; // Auto-filled from Web App
input string BackendUrl = "${backendUrl}"; // Your Backend URL

// --- GLOBALS ---
datetime lastSyncTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(SyncKey == "")
     {
      Alert("Error: Sync Key is missing.");
      return(INIT_FAILED);
     }
     
   // Check WebRequest Permission
   if(!TerminalInfoInteger(TERMINAL_COMMUNITY_ACCOUNT))
     {
      Print("Note: Ensure 'Allow WebRequest' is enabled for ", BackendUrl);
     }
     
   // Perform initial sync immediately
   SyncHistory();
   
   // Set timer to sync every 60 seconds (Updates trade list)
   EventSetTimer(60); 
   
   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

void OnTimer()
  {
   SyncHistory();
  }

//+------------------------------------------------------------------+
//| Main Sync Logic                                                  |
//+------------------------------------------------------------------+
void SyncHistory()
  {
   // Select History for last 90 days
   datetime fromDate = TimeCurrent() - (90 * 24 * 60 * 60); 
   datetime toDate = TimeCurrent();
   
   if(!HistorySelect(fromDate, toDate))
     {
      Print("Failed to select history.");
      return;
     }
     
   int totalDeals = HistoryDealsTotal();
   string jsonPayload = "[";
   int count = 0;
   
   // Loop through history deals
   for(int i = 0; i < totalDeals; i++)
     {
      ulong ticket = HistoryDealGetTicket(i);
      long type = HistoryDealGetInteger(ticket, DEAL_TYPE);
      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      
      // Filter for Exit deals (Closing trades)
      if(entry != DEAL_ENTRY_OUT && entry != DEAL_ENTRY_OUT_BY) continue;
      if(type != DEAL_TYPE_BUY && type != DEAL_TYPE_SELL) continue;
      
      double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double volume = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      string symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double closePrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
      long time = HistoryDealGetInteger(ticket, DEAL_TIME);
      
      // Note: Getting exact Open Time/Price requires matching DEAL_ENTRY_IN.
      // For this bridge, we send CloseTime as OpenTime placeholder to ensure valid JSON structure.
      // The frontend will treat openTime as closeTime if identical.
      
      string timeStr = TimeToString(time, TIME_DATE|TIME_MINUTES);
      
      // Format JSON object
      string tradeObj = StringFormat(
         "{\\"ticket\\":%d,\\"symbol\\":\\"%s\\",\\"type\\":\\"%s\\",\\"openTime\\":\\"%s\\",\\"closeTime\\":\\"%s\\",\\"profit\\":%.2f,\\"commission\\":%.2f,\\"swap\\":%.2f,\\"lots\\":%.2f,\\"openPrice\\":0.0,\\"closePrice\\":%.5f}",
         ticket,
         symbol,
         type == DEAL_TYPE_BUY ? "Buy" : "Sell",
         timeStr, // Using close time as fallback for open time
         timeStr, 
         profit,
         comm,
         swap,
         volume,
         closePrice
      );
      
      if(count > 0) jsonPayload += ",";
      jsonPayload += tradeObj;
      count++;
     }
     
   jsonPayload += "]";
   
   // Send to Server
   char data[];
   StringToCharArray(jsonPayload, data, 0, StringLen(jsonPayload));
   
   char result[];
   string resultHeaders;
   string headers = "Content-Type: application/json\\r\\nSync-Key: " + SyncKey + "\\r\\n";
   
   Print("Sending " + IntegerToString(count) + " trades to " + BackendUrl);
   int res = WebRequest("POST", BackendUrl, headers, 5000, data, data, resultHeaders);
   
   if(res == 200)
     {
      Print("Sync Successful.");
     }
   else
     {
      Print("Sync Failed. Error: ", res);
      if(res == 5203) Print("Error 5203: URL not allowed in Options > Expert Advisors.");
     }
  }
`;
