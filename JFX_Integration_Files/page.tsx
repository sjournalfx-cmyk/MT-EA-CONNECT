'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // Ensure this points to your client-side firebase config
import { doc, onSnapshot } from 'firebase/firestore';
import { Trade, AccountInfo, OpenPosition } from '@/types'; // You might need to move types.ts to your app

// --- Types (If you don't have them imported) ---
// interface Trade { ... }
// interface AccountInfo { ... }
// interface OpenPosition { ... }

export default function EAConnectPage() {
    // In a real app, you'd get this from the logged-in user's profile
    // For now, we can let them generate one or use a static one for testing
    const [syncKey, setSyncKey] = useState<string>('default_user');

    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        if (!syncKey) return;

        // Real-time Listener
        const unsub = onSnapshot(doc(db, "ea_sessions", syncKey), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setAccountInfo(data.account);
                setOpenPositions(data.openPositions || []);
                setTrades(data.trades || []);
                setLastUpdated(data.lastUpdated);
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        });

        return () => unsub();
    }, [syncKey]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">MT5 Live Connection</h1>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isConnected ? '● Live Connected' : '○ Waiting for Data'}
                </div>
            </div>

            {/* Connection Instructions */}
            <div className="bg-[#1E2029] p-6 rounded-xl border border-gray-800 shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Connect Your MT5 Account</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Link your MetaTrader 5 account to view your live trades and stats here.
                            No technical skills required.
                        </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download EA
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    {/* Step 1 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <h4 className="text-white font-medium mb-1">Install the EA</h4>
                        <p className="text-xs text-gray-400">Download the file and save it to your MT5 Experts folder. Refresh MT5 and drag it onto any chart.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <h4 className="text-white font-medium mb-1">Enter Your Key</h4>
                        <p className="text-xs text-gray-400">In the EA settings, paste this unique key:</p>
                        <div className="mt-2 flex items-center gap-2">
                            <code className="bg-black/50 border border-gray-700 px-2 py-1 rounded text-blue-400 font-mono text-sm select-all">{syncKey}</code>
                            <button className="text-xs text-gray-500 hover:text-white" onClick={() => navigator.clipboard.writeText(syncKey)}>Copy</button>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-0 w-6 h-6 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <h4 className="text-white font-medium mb-1">That's It!</h4>
                        <p className="text-xs text-gray-400">The status above will turn <span className="text-green-400">Green</span> when connected. You can close this page and your trades will still sync.</p>
                    </div>
                </div>
            </div>

            {/* Live Data Dashboard */}
            {isConnected && accountInfo && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#1E2029] p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-sm">Balance</div>
                        <div className="text-2xl font-bold text-white">${accountInfo.balance.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#1E2029] p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-sm">Equity</div>
                        <div className="text-2xl font-bold text-white">${accountInfo.equity.toFixed(2)}</div>
                    </div>
                    <div className="bg-[#1E2029] p-4 rounded-lg border border-gray-800">
                        <div className="text-gray-400 text-sm">Open Positions</div>
                        <div className="text-2xl font-bold text-white">{openPositions.length}</div>
                    </div>
                </div>
            )}

            {/* Open Positions Table */}
            {openPositions.length > 0 && (
                <div className="bg-[#1E2029] rounded-lg border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 font-semibold text-gray-200">Open Positions</div>
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#16181D] text-gray-500">
                            <tr>
                                <th className="p-3">Symbol</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Lots</th>
                                <th className="p-3">Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {openPositions.map((pos) => (
                                <tr key={pos.ticket} className="border-b border-gray-800/50">
                                    <td className="p-3 text-white font-medium">{pos.symbol}</td>
                                    <td className={`p-3 ${pos.type === 'Buy' ? 'text-green-400' : 'text-red-400'}`}>{pos.type}</td>
                                    <td className="p-3">{pos.lots}</td>
                                    <td className={`p-3 font-bold ${pos.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${pos.profit.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
