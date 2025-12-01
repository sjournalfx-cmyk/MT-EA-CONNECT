import { Trade } from '../types';

// Browser-based apps cannot directly connect to MT5 via TCP/Sockets due to security protocols.
// This service provides two modes:
// 1. Simulation (Demo): Generates realistic mock data.
// 2. Real Data (Import): Parses MT4/MT5 HTML Reports so users can use their actual history.

export const fetchTradeHistory = async (loginId: string): Promise<Trade[]> => {
  // Simulate network delay for "Connecting..." UX
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const symbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'US30', 'BTCUSD', 'NAS100'];
  const trades: Trade[] = [];
  const now = new Date();

  // Generate 50 realistic mock trades
  for (let i = 0; i < 50; i++) {
    const isWin = Math.random() > 0.45; // 55% win rate simulation
    const type = Math.random() > 0.5 ? 'Buy' : 'Sell';
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    // Time logic
    const closeDate = new Date(now.getTime() - i * 1000 * 60 * 60 * (Math.random() * 24));
    const durationMinutes = Math.floor(Math.random() * 120) + 5;
    const openDate = new Date(closeDate.getTime() - durationMinutes * 60 * 1000);

    // Price logic
    let openPrice = 0;
    if (symbol === 'XAUUSD') openPrice = 2000 + Math.random() * 50;
    else if (symbol === 'US30') openPrice = 34000 + Math.random() * 500;
    else if (symbol === 'BTCUSD') openPrice = 65000 + Math.random() * 1000;
    else if (symbol === 'NAS100') openPrice = 15000 + Math.random() * 200;
    else openPrice = 1.05 + Math.random() * 0.1;

    const move = (openPrice * 0.002) * (Math.random() * 2); // 0.2% move approx
    let closePrice = isWin 
      ? (type === 'Buy' ? openPrice + move : openPrice - move)
      : (type === 'Buy' ? openPrice - move : openPrice + move);

    // Rounding
    openPrice = Number(openPrice.toFixed(5));
    closePrice = Number(closePrice.toFixed(5));

    const lots = Number((Math.random() * 1 + 0.1).toFixed(2));
    
    // Rough PnL calc (simplified for visual realism)
    let rawProfit = Math.abs(closePrice - openPrice) * 100000 * lots;
    if (['XAUUSD', 'US30', 'BTCUSD', 'NAS100'].includes(symbol)) {
       rawProfit = Math.abs(closePrice - openPrice) * lots;
       if(symbol === 'US30' || symbol === 'NAS100') rawProfit *= 1; // Index multiplier often 1 or 10
    }
    
    const profit = isWin ? rawProfit : -rawProfit;

    trades.push({
      ticket: 1000000 + i,
      symbol,
      type,
      openTime: openDate.toISOString(),
      closeTime: closeDate.toISOString(),
      openPrice,
      closePrice,
      lots,
      profit: Number(profit.toFixed(2)),
      commission: -3.5,
      swap: Math.random() > 0.8 ? -1.5 : 0,
    });
  }

  return trades.sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());
};

// Parser for MT4/MT5 HTML Reports
export const parseMT5Report = (htmlContent: string): Trade[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  const trades: Trade[] = [];

  // Logic to iterate rows and extract trade data
  // MT5 HTML reports usually have specific structures. This is a heuristic parser.
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    if (cells.length < 13) continue;

    // Basic heuristic: check if it looks like a trade row
    // Ticket | Open Time | Type | Size | Item | Price | S/L | T/P | Close Time | Price | Commission | Swap | Profit
    const ticket = parseInt(cells[0].innerText.trim());
    if (isNaN(ticket)) continue;

    const typeStr = cells[2].innerText.trim().toLowerCase();
    if (typeStr !== 'buy' && typeStr !== 'sell') continue;

    const openTimeStr = cells[1].innerText.trim(); // Format often YYYY.MM.DD HH:MM:SS
    const closeTimeStr = cells[8].innerText.trim();

    // Skip open positions (no close time)
    if (!closeTimeStr) continue;

    try {
        const symbol = cells[4].innerText.trim();
        const lots = parseFloat(cells[3].innerText.trim());
        const openPrice = parseFloat(cells[5].innerText.trim());
        const closePrice = parseFloat(cells[9].innerText.trim());
        const commission = parseFloat(cells[10].innerText.trim()) || 0;
        const swap = parseFloat(cells[11].innerText.trim()) || 0;
        const profit = parseFloat(cells[12].innerText.trim());

        // Simple date parser assuming standard MT5 format YYYY.MM.DD HH:MM
        const parseDate = (d: string) => new Date(d.replace(/\./g, '-')).toISOString();

        trades.push({
            ticket,
            symbol,
            type: typeStr === 'buy' ? 'Buy' : 'Sell',
            openTime: parseDate(openTimeStr),
            closeTime: parseDate(closeTimeStr),
            openPrice,
            closePrice,
            lots,
            commission,
            swap,
            profit
        });
    } catch (e) {
        console.warn("Failed to parse row", row, e);
    }
  }

  return trades.sort((a, b) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime());
};