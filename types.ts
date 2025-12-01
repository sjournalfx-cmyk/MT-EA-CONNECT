export interface Trade {
  ticket: number;
  symbol: string;
  type: 'Buy' | 'Sell';
  openTime: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  lots: number;
  profit: number;
  commission: number;
  swap: number;
}

export interface ConnectionConfig {
  server: string;
  login: string;
  password: string;
  deductFees: boolean;
  isCentAccount: boolean;
  notificationPreference: string;
}

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  grade: string;
}