export type Trade = {
  ticket: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  openTime: string;
  closeTime: string;
  profit: number;
  commission: number;
  swap: number;
  lots: number;
  openPrice: number;
  closePrice: number;
};

export type AccountInfo = {
  login: number;
  name: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  isReal: boolean;
};

export type OpenPosition = {
  ticket: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  openTime: string;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  lots: number;
  swap: number;
  profit: number;
  comment?: string;
};