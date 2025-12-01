import React, { useState, useMemo } from 'react';
import { Trade, AnalysisResult } from '../types';
import { analyzeJournal } from '../services/geminiService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

interface TradeJournalProps {
  trades: Trade[];
  onDisconnect: () => void;
}

const TradeJournal: React.FC<TradeJournalProps> = ({ trades, onDisconnect }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit <= 0).length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
    const totalPnL = trades.reduce((acc, t) => acc + t.profit + t.commission + t.swap, 0);
    
    // Calculate Equity Curve Data
    let runningBalance = 0;
    const equityCurve = trades
      .slice()
      .reverse() // Sort oldest first for chart
      .map((t, idx) => {
        runningBalance += (t.profit + t.commission + t.swap);
        return {
          trade: idx + 1,
          balance: Number(runningBalance.toFixed(2)),
          profit: t.profit,
          date: new Date(t.closeTime).toLocaleDateString()
        };
      });

    return { totalTrades, wins, losses, winRate, totalPnL, equityCurve };
  }, [trades]);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeJournal(trades);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Trading Performance</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>Connected to MetaTrader 5</span>
            <span className="mx-2">•</span>
            <span>{trades.length} Trades Synced</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAIAnalysis}
            disabled={analyzing}
            className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all shadow-lg shadow-purple-900/20 font-medium ${analyzing ? 'opacity-80' : ''}`}
          >
            {analyzing ? (
               <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            )}
            {analyzing ? 'Generating Insights...' : 'Get AI Coaching'}
          </button>
          <button 
            onClick={onDisconnect}
            className="px-5 py-2.5 bg-card-input text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Net Profit</p>
          <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Win Rate</p>
          <div className="flex items-baseline gap-2">
             <p className="text-3xl font-bold text-white">{stats.winRate}%</p>
             <span className="text-xs text-gray-500">({stats.wins}W / {stats.losses}L)</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Trades</p>
          <p className="text-3xl font-bold text-white">{stats.totalTrades}</p>
        </div>
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Avg Trade</p>
          <p className="text-3xl font-bold text-white">
            ${(stats.totalPnL / stats.totalTrades || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* AI Analysis Section (Conditional) */}
      {analysis && (
        <div className="mb-8 bg-[#1a1625] border border-purple-500/30 rounded-xl p-8 animate-fade-in relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/></svg>
              </span>
              AI Coach Report
            </h2>
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-lg text-lg font-bold shadow-lg">
              Grade: {analysis.grade}
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none relative z-10">
            <p className="text-gray-300 text-lg leading-relaxed mb-8 border-b border-gray-800 pb-6">
              {analysis.summary}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-green-500/5 p-6 rounded-xl border border-green-500/10">
                <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Strengths
                </h3>
                <ul className="space-y-3">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 text-gray-300">
                      <span className="text-green-500 mt-1.5">●</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/10">
                <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Improvements
                </h3>
                <ul className="space-y-3">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-3 text-gray-300">
                      <span className="text-red-500 mt-1.5">●</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[400px] mb-8 bg-card rounded-xl border border-gray-800 p-6 shadow-lg">
        <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-6">Cumulative Profit (Equity Curve)</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={stats.equityCurve}>
            <defs>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis dataKey="trade" hide />
            <YAxis 
              orientation="right" 
              tick={{fill: '#9CA3AF', fontSize: 12}} 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(val) => `$${val}`} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1E2029', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
            />
            <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPnL)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trade Table */}
      <div className="bg-card rounded-xl border border-gray-800 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-gray-800">
             <h3 className="text-gray-200 font-bold text-lg">Trade History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#1a1d26] text-gray-400">
                <th className="p-4 font-medium pl-6">Symbol</th>
                <th className="p-4 font-medium">Direction</th>
                <th className="p-4 font-medium">Opened</th>
                <th className="p-4 font-medium text-right">Entry</th>
                <th className="p-4 font-medium text-right">Exit</th>
                <th className="p-4 font-medium text-right">Size</th>
                <th className="p-4 font-medium text-right">Fees</th>
                <th className="p-4 font-medium text-right pr-6">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trades.map((trade) => {
                 const netPnL = trade.profit + trade.commission + trade.swap;
                 const isProfit = netPnL >= 0;
                 return (
                  <tr key={trade.ticket} className="hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-bold text-white pl-6">{trade.symbol}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${trade.type === 'Buy' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      <div className="font-medium text-gray-300">{new Date(trade.openTime).toLocaleDateString()}</div>
                      <div>{new Date(trade.openTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="p-4 text-right text-gray-300 font-mono">{trade.openPrice}</td>
                    <td className="p-4 text-right text-gray-300 font-mono">{trade.closePrice}</td>
                    <td className="p-4 text-right text-gray-300">{trade.lots}</td>
                    <td className="p-4 text-right text-gray-500 text-xs">
                      ${(trade.commission + trade.swap).toFixed(2)}
                    </td>
                    <td className={`p-4 text-right font-bold pr-6 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                      {isProfit ? '+' : ''}${netPnL.toFixed(2)}
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeJournal;