import React, { useState } from 'react';
import ConnectForm from './components/ConnectForm';
import TradeJournal from './components/TradeJournal';
import { Trade } from './types';

const App: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = (fetchedTrades: Trade[]) => {
    setTrades(fetchedTrades);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setTrades([]);
    setIsConnected(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"></div>
      </div>

      {isConnected ? (
        <TradeJournal trades={trades} onDisconnect={handleDisconnect} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <ConnectForm onConnect={handleConnect} />
        </div>
      )}
    </div>
  );
};

export default App;