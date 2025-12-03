import React, { useMemo } from 'react';
import { Trade, AccountInfo, OpenPosition } from '../types';


interface TradeJournalProps {
  trades: Trade[];
  accountInfo: AccountInfo | null;
  openPositions: OpenPosition[];
  onDisconnect: () => void;
}

const TradeJournal: React.FC<TradeJournalProps> = ({ trades, accountInfo, openPositions, onDisconnect }) => {

  // Statistics
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.profit > 0).length;
    const losses = trades.filter(t => t.profit <= 0).length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
    const totalPnL = trades.reduce((acc, t) => acc + t.profit + t.commission + t.swap, 0);

    return { totalTrades, wins, losses, winRate, totalPnL };
  }, [trades]);

  const totalFloatingPnL = useMemo(() => {
    return openPositions.reduce((acc, p) => acc + p.profit + p.swap, 0);

  }, [openPositions]);



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

            {accountInfo && (
              <>
                <span className="mx-2">•</span>
                <span className={`font-bold ${accountInfo.isReal ? 'text-yellow-400' : 'text-blue-400'}`}>
                  {accountInfo.isReal ? 'REAL' : 'DEMO'}
                </span>
                <span className="mx-2">•</span>
                <span>{accountInfo.server}</span>
                <span className="mx-2">•</span>
                <span>1:{accountInfo.leverage}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="px-5 py-2.5 bg-card-input text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors font-medium"
        >
          Disconnect
        </button>
      </div>

      {/* Account Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Account Info */}
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Account</p>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{accountInfo?.name || 'Account'}</h3>
            <p className="text-sm text-gray-500 font-mono">{accountInfo?.login || '---'} ({accountInfo?.isReal ? 'Real' : 'Demo'})</p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20 font-bold">{accountInfo?.currency || 'USD'}</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 font-bold">1:{accountInfo?.leverage || '---'}</span>
            </div>
          </div>
        </div>

        {/* Balance & Equity */}
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg hover:border-gray-700 transition-all duration-300">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Balance</p>
              <p className="text-2xl font-bold text-white tracking-tight">${accountInfo?.balance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="w-full h-px bg-gray-800/50 my-3"></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Equity</p>
              <p className="text-2xl font-bold text-blue-400 tracking-tight">${accountInfo?.equity?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Margin Stats */}
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg hover:border-gray-700 transition-all duration-300">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Margin Used</p>
              <p className="text-2xl font-bold text-white tracking-tight">${((accountInfo?.equity || 0) - (accountInfo?.balance || 0) + totalFloatingPnL).toFixed(2)}</p>
            </div>
            <div className="w-full h-px bg-gray-800/50 my-3"></div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Free Margin</p>
              <p className="text-2xl font-bold text-green-400 tracking-tight">${accountInfo?.equity?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Margin Level */}
        <div className="bg-gradient-to-br from-card to-gray-900 p-6 rounded-xl border border-gray-800/60 shadow-lg relative overflow-hidden flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-blue-500/5"></div>
          <div className="relative z-10 text-center w-full">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Margin Level</p>
            <p className="text-4xl font-bold text-white mb-4">100%</p>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* OPEN POSITIONS SECTION */}
      {openPositions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Open Positions
            </h2>
            <div className={`text-lg font-bold px-4 py-1 rounded border ${totalFloatingPnL >= 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              Floating: {totalFloatingPnL >= 0 ? '+' : ''}${totalFloatingPnL.toFixed(2)}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-blue-500/20 overflow-hidden shadow-lg shadow-blue-900/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-blue-900/20 text-blue-200">
                    <th className="p-3 font-medium pl-6">Ticket</th>
                    <th className="p-3 font-medium">Symbol</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium text-right">Volume</th>
                    <th className="p-3 font-medium text-right">Open Price</th>
                    <th className="p-3 font-medium text-right">Current</th>
                    <th className="p-3 font-medium text-right pr-6">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {openPositions.map((pos) => (
                    <tr key={pos.ticket} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3 text-gray-500 font-mono text-xs pl-6">#{pos.ticket}</td>
                      <td className="p-3 font-bold text-white">{pos.symbol}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${pos.type === 'Buy' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-300">{pos.lots}</td>
                      <td className="p-3 text-right text-gray-400 font-mono">{pos.openPrice}</td>
                      <td className="p-3 text-right text-white font-mono">{pos.currentPrice}</td>
                      <td className="p-3 text-right text-gray-500 text-xs">${pos.swap.toFixed(2)}</td>
                      <td className={`p-3 text-right font-bold pr-6 ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-6 rounded-xl border border-gray-800/60 shadow-lg">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Net Profit (Closed)</p>
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
                      <div>{new Date(trade.openTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
