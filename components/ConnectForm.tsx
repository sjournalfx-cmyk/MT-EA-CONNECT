
import React, { useState, useRef, useEffect } from 'react';
import { Trade } from '../types';
import { parseMT5Report } from '../services/mockMT5Service';
import { generateMQL5Code } from '../services/mql5Script';

interface ConnectFormProps {
  onConnect: (trades: Trade[]) => void;
}

const SERVER_CODE = `const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Allow React to fetch data
app.use(cors());
// Support large payloads
app.use(bodyParser.json({ limit: '10mb' }));

const tradeStore = {};

// 1. Receives data from MetaTrader 5
app.post('/api/webhook', (req, res) => {
    const syncKey = req.headers['sync-key'];
    const trades = req.body;
    
    if (!syncKey) return res.status(400).send("Missing Header");
    
    console.log(\`Received \${trades.length} trades for key: \${syncKey}\`);
    tradeStore[syncKey] = trades;
    res.status(200).send("Data received");
});

// 2. React App Polls this endpoint
app.get('/api/trades/:syncKey', (req, res) => {
    const { syncKey } = req.params;
    const trades = tradeStore[syncKey];
    
    if (trades) res.json({ success: true, trades });
    else res.status(404).json({ success: false });
});

app.listen(PORT, () => {
    console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});`;

const ConnectForm: React.FC<ConnectFormProps> = ({ onConnect }) => {
  // -- EA Bridge State --
  const [syncKey, setSyncKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3001/api/webhook');
  const [isWaitingForBridge, setIsWaitingForBridge] = useState(false);
  const [showServerGuide, setShowServerGuide] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  
  // -- General UI State --
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load token on mount
  useEffect(() => {
    setSyncKey(`sk_${Math.random().toString(36).substring(2, 10)}`);
  }, []);

  // Polling Logic for EA Bridge
  useEffect(() => {
    let interval: any;
    
    if (isWaitingForBridge) {
        // Construct the polling URL. If webhook is .../api/webhook, we poll .../api/trades/:key
        const baseUrl = webhookUrl.replace('/webhook', ''); 
        const pollUrl = `${baseUrl}/trades/${syncKey}`;
        
        console.log(`Polling for data at: ${pollUrl}`);
        
        interval = setInterval(async () => {
            try {
                const res = await fetch(pollUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.trades && data.trades.length > 0) {
                        // Data Found! Stop polling.
                        clearInterval(interval);
                        setIsWaitingForBridge(false);
                        
                        // Map fields just in case
                        const mappedTrades = data.trades.map((t: any) => ({
                            ...t,
                            // Ensure numeric types
                            ticket: Number(t.ticket),
                            openPrice: Number(t.openPrice),
                            closePrice: Number(t.closePrice),
                            lots: Number(t.lots),
                            profit: Number(t.profit),
                            commission: Number(t.commission || 0),
                            swap: Number(t.swap || 0),
                        }));
                        
                        onConnect(mappedTrades);
                    }
                }
            } catch (e) {
                // Ignore connection errors while polling (server might not be up yet)
            }
        }, 3000); // Poll every 3 seconds
    }
    
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isWaitingForBridge, webhookUrl, syncKey, onConnect]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SERVER_CODE);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  const handleDownloadEA = () => {
    const code = generateMQL5Code(syncKey, webhookUrl);
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "TradeSync_Bridge.mq5";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleStartBridgeListener = () => {
    setIsWaitingForBridge(true);
  };

  // --- File Upload Logic ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const trades = parseMT5Report(text);
        if (trades.length > 0) {
          onConnect(trades);
        } else {
          alert("No valid trades found in HTML report.");
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-12 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center shadow-lg">
          <span className="font-bold text-white text-lg">5</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Connect MetaTrader 5</h1>
          <p className="text-gray-400 text-sm">Sync your history via local bridge or import files.</p>
        </div>
      </div>
      
      {/* --- EA BRIDGE CONTENT --- */}
      <div className="animate-fade-in bg-[#15171E] rounded-xl border border-gray-800 p-8 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                  <h2 className="text-xl font-bold text-white mb-4">EA Bridge Setup</h2>
                  <p className="text-sm text-gray-400 mb-6">
                    This method connects your MetaTrader terminal to this app via a local secure webhook.
                  </p>
                  
                  {/* Setup Steps */}
                  <div className="space-y-6">
                      {/* Step 1: Server Config */}
                      <div className="bg-gray-800/20 border border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                              <label className="text-xs font-bold text-gray-400 block uppercase">1. Backend URL (Receiver)</label>
                              <button 
                                  onClick={() => setShowServerGuide(!showServerGuide)}
                                  className="text-xs text-accent hover:text-white underline font-medium"
                              >
                                  {showServerGuide ? 'Hide Instructions' : 'How to set up server?'}
                              </button>
                          </div>
                          
                          <input 
                              type="text" 
                              className="w-full bg-black/40 border border-gray-600 rounded p-2 text-sm text-green-400 font-mono"
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              placeholder="http://localhost:3001/api/webhook"
                          />

                          {/* COLLAPSIBLE SERVER INSTRUCTIONS */}
                          {showServerGuide && (
                              <div className="mt-4 p-4 bg-black/60 rounded border border-gray-700 text-sm animate-fade-in">
                                  <p className="font-bold text-white mb-3">Local Server Setup Guide</p>
                                  <ol className="list-decimal list-inside space-y-4 text-gray-400 text-xs">
                                      <li>
                                          Install <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-accent underline">Node.js</a> if not installed.
                                      </li>
                                      <li>
                                          Create a folder, open terminal in it, and run:
                                          <div className="bg-gray-900 border border-gray-700 p-2 rounded mt-1 font-mono text-gray-300 select-all">
                                              npm init -y && npm install express cors body-parser
                                          </div>
                                      </li>
                                      <li>
                                          Create a file named <code className="text-white">server.js</code> and paste this code:
                                          <div className="relative mt-1">
                                              <pre className="bg-gray-900 border border-gray-700 p-3 rounded font-mono text-[10px] text-green-400 overflow-x-auto max-h-40">
                                                  {SERVER_CODE}
                                              </pre>
                                              <button 
                                                  onClick={handleCopyCode}
                                                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded shadow"
                                              >
                                                  {copyFeedback || 'Copy'}
                                              </button>
                                          </div>
                                      </li>
                                      <li>
                                          Run the server:
                                          <div className="bg-gray-900 border border-gray-700 p-2 rounded mt-1 font-mono text-gray-300 select-all">
                                              node server.js
                                          </div>
                                      </li>
                                  </ol>
                              </div>
                          )}
                      </div>

                      <div className="flex gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center font-bold border border-gray-700">2</span>
                          <div>
                              <p className="font-bold text-gray-200 mb-1">Download Custom EA</p>
                              <p className="text-sm text-gray-400 mb-2">Generates an EA locked to your unique Sync Key.</p>
                              <button onClick={handleDownloadEA} className="flex items-center gap-2 text-accent hover:text-white transition-colors text-xs font-bold border border-accent/30 hover:bg-accent/10 px-3 py-1.5 rounded">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                  Download TradeSync_Bridge.mq5
                              </button>
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center font-bold border border-gray-700">3</span>
                          <div>
                              <p className="font-bold text-gray-200 mb-1">MT5 Settings</p>
                              <p className="text-sm text-gray-400">
                                  Go to <span className="text-white">Tools &gt; Options &gt; Expert Advisors</span>. Check "Allow WebRequest" and add:
                              </p>
                              <code className="block mt-2 bg-gray-950 p-2 rounded text-xs text-green-400 font-mono overflow-x-auto whitespace-nowrap">{webhookUrl}</code>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[400px]">
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-accent/5"></div>
                  
                  {isWaitingForBridge ? (
                       <div className="flex flex-col items-center z-10 py-8 animate-fade-in">
                           <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                              <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
                              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                           </div>
                           <h3 className="text-xl font-bold text-white mb-2">Listening for Data...</h3>
                           <p className="text-sm text-gray-500 max-w-xs mb-6">
                              Attach the EA to any chart in MT5. We are polling your server at:
                           </p>
                           <div className="bg-black/50 px-3 py-1.5 rounded text-[10px] font-mono text-gray-400 mb-4 border border-gray-800">
                               {webhookUrl.replace('/webhook', '')}/trades/{syncKey}
                           </div>
                           
                           <button onClick={() => setIsWaitingForBridge(false)} className="px-4 py-2 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors">
                              Cancel
                           </button>
                       </div>
                  ) : (
                      <div className="w-full z-10">
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Your Sync Key</p>
                           <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 flex items-center justify-between group cursor-pointer hover:border-gray-600 transition-colors" onClick={() => navigator.clipboard.writeText(syncKey)}>
                               <code className="text-xl font-mono text-green-400 tracking-wide">{syncKey}</code>
                               <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                           </div>
                           
                           <button 
                              onClick={handleStartBridgeListener}
                              className="w-full py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-3 hover:shadow-lg hover:border-gray-500 group"
                          >
                              <svg className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              Start Listening
                           </button>
                           <p className="text-[10px] text-gray-600 mt-4">Make sure your local server is running first!</p>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Footer / Drag Drop Area */}
      <div 
        className={`mt-8 border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActive ? 'border-accent bg-accent/5' : 'border-gray-800 hover:border-gray-700 bg-card/30'}`}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".html,.htm" 
            onChange={handleFileChange} 
        />
        <p className="text-gray-400 font-medium">Or import existing data</p>
        <p className="text-sm text-gray-500 mt-2">Drag & Drop your <b>MT5 History Report (HTML)</b> here to analyze without connecting.</p>
      </div>
    </div>
  );
};

export default ConnectForm;
