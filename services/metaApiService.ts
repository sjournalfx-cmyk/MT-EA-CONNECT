
import { Trade } from '../types';

const BASE_URL = 'https://mt-provisioning-api-v1.agrium.io';
const STATS_URL = 'https://mt-client-api-v1.agrium.io';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Helper to handle API errors
const fetchWithAuth = async (url: string, token: string, options: RequestInit = {}) => {
  const headers = {
    'auth-token': token,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${response.statusText}`);
  }
  return response.json();
};

export const connectAndFetchHistory = async (
  token: string, 
  login: string, 
  password: string, 
  server: string
): Promise<Trade[]> => {
  
  let accountId: string | null = null;

  try {
    // 1. Check if account already exists to avoid duplicates
    console.log("Checking existing accounts...");
    const accounts = await fetchWithAuth(`${BASE_URL}/users/current/accounts`, token);
    
    accountId = accounts.find((a: any) => a.login === login && a.server === server)?.id;

    // 2. Create Account if not exists
    if (!accountId) {
      console.log("Creating cloud account...");
      const newAccount = await fetchWithAuth(`${BASE_URL}/users/current/accounts`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: `TradeSync-${login}`,
          type: 'cloud',
          login,
          password,
          server,
          platform: 'mt5',
          magic: 1000,
          quoteStreamingIntervalInSeconds: 2.5
        })
      });
      accountId = newAccount.id;
    }

    if (!accountId) throw new Error("Failed to resolve Account ID");

    // 3. Deploy Account
    console.log(`Account ID: ${accountId}. Deploying...`);
    await fetchWithAuth(`${BASE_URL}/users/current/accounts/${accountId}/deploy`, token, {
      method: 'POST'
    }).catch(e => {
      // Ignore error if already deployed
      if (!e.message.includes('already deployed')) throw e;
    });

    // 4. Poll for Connection (Max 60 seconds)
    console.log("Waiting for connection...");
    let attempts = 0;
    let connected = false;
    while (attempts < 30) {
      const acc = await fetchWithAuth(`${BASE_URL}/users/current/accounts/${accountId}`, token);
      if (acc.state === 'DEPLOYED' && acc.connectionStatus === 'CONNECTED') {
        connected = true;
        break;
      }
      await sleep(2000);
      attempts++;
    }

    if (!connected) {
      throw new Error("Timeout waiting for MT5 connection. Please check credentials.");
    }

    // 5. Fetch History
    console.log("Fetching history...");
    // Default to last 90 days
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 90);
    
    const historyUrl = `${STATS_URL}/users/current/accounts/${accountId}/history-orders/time/${startTime.toISOString()}/${new Date().toISOString()}`;
    
    const historyData = await fetchWithAuth(historyUrl, token);
    
    // 6. Map to our App's Type
    const trades: Trade[] = historyData.historyOrders
      .filter((order: any) => order.type === 'ORDER_TYPE_BUY' || order.type === 'ORDER_TYPE_SELL') // Filter non-trades
      .map((order: any) => ({
        ticket: parseInt(order.id),
        symbol: order.symbol,
        type: order.type === 'ORDER_TYPE_BUY' ? 'Buy' : 'Sell',
        openTime: order.openTime,
        closeTime: order.doneTime,
        openPrice: order.openPrice,
        closePrice: order.price,
        lots: order.volume,
        profit: order.profit || 0,
        commission: 0, // MetaApi usually separates deals/orders, simplified here
        swap: 0
      }))
      .sort((a: any, b: any) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());

    return trades;

  } catch (error) {
    console.error("MetaApi Error:", error);
    throw error;
  } finally {
    // 7. CRITICAL: Undeploy to save costs (On-Demand Model)
    if (accountId) {
      console.log("Undeploying account to save costs...");
      // We don't await this so the UI updates immediately
      fetchWithAuth(`${BASE_URL}/users/current/accounts/${accountId}/undeploy`, token, {
        method: 'POST'
      }).catch(err => console.warn("Failed to undeploy:", err));
    }
  }
};
