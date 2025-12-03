import React, { useState, useEffect } from 'react';
import ConnectForm from './components/ConnectForm';
import TradeJournal from './components/TradeJournal';
import ErrorBoundary from './components/ErrorBoundary';
import { Trade, AccountInfo, OpenPosition } from './types';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncKey, setSyncKey] = useState<string>('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [connectionHealth, setConnectionHealth] = useState<'good' | 'weak' | 'disconnected' | 'waiting'>('disconnected');
  const [lastError, setLastError] = useState<string>('');

  const handleConnect = (key: string) => {
    setSyncKey(key);
    setIsConnected(true);
    setConnectionHealth('waiting'); // Start in waiting state
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSyncKey('');
    setTrades([]);
    setAccountInfo(null);
    setOpenPositions([]);
    setConnectionHealth('disconnected');
    setLastUpdated(0);
  };

  // Polling Logic
  useEffect(() => {
    if (!isConnected || !syncKey) return;

    let consecutiveFailures = 0;
    const pollInterval = setInterval(async () => {
      try {
        // 3. Smart Polling: Send lastUpdated timestamp
        const response = await fetch(`http://localhost:3001/api/trades/${syncKey}?lastUpdated=${lastUpdated}`);

        if (response.status === 304) {
          // No changes, just update health
          setConnectionHealth('good');
          consecutiveFailures = 0;
          setLastError('');
          return;
        }

        if (response.status === 404) {
          // Server is reachable but no data yet
          setConnectionHealth('waiting');
          consecutiveFailures = 0;
          setLastError('');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTrades(data.trades);
            setAccountInfo(data.account);
            setOpenPositions(data.openPositions || []);
            setLastUpdated(data.lastUpdated);
            setConnectionHealth('good');
            consecutiveFailures = 0;
            setLastError('');
          }
        } else {
          consecutiveFailures++;
          setLastError(`Server Error: ${response.status}`);
        }
      } catch (error: any) {
        console.error("Polling error:", error);
        consecutiveFailures++;
        setLastError(`Network Error: ${error.message}`);
      }

      // 5. Connection Health Monitor
      if (consecutiveFailures > 2) {
        setConnectionHealth('weak');
      }
      if (consecutiveFailures > 5) {
        setConnectionHealth('disconnected');
      }

    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isConnected, syncKey, lastUpdated]);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"></div>
      </div>

      <ErrorBoundary>
        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <ConnectForm onConnect={handleConnect} />
          </div>
        ) : (
          <>
            {/* 5. Connection Health Indicator */}
            {connectionHealth === 'waiting' && (
              <div className="bg-blue-500/10 border-b border-blue-500/20 text-blue-400 text-center text-xs py-1 font-bold animate-pulse">
                ⏳ Connected to Server - Waiting for MT5 Data...
              </div>
            )}
            {connectionHealth === 'weak' && (
              <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-center text-xs py-1 font-bold animate-pulse">
                ⚠️ Weak Connection - Retrying...
              </div>
            )}
            {connectionHealth === 'disconnected' && (
              <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-center text-xs py-1 font-bold">
                ❌ Connection Lost - {lastError || 'Check Server'}
              </div>
            )}
            <TradeJournal
              trades={trades}
              accountInfo={accountInfo}
              openPositions={openPositions}
              onDisconnect={handleDisconnect}
            />
          </>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;