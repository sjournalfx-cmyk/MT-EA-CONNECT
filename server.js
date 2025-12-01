
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Enable CORS so your React app can poll this server
app.use(cors());

// Parse JSON bodies (Big limit for large history)
app.use(bodyParser.json({ limit: '10mb' }));

// In-memory store for trades (Simulating a database)
const tradeStore = {};

// 1. WEBHOOK: Receives data from MetaTrader 5 EA
app.post('/api/webhook', (req, res) => {
    const syncKey = req.headers['sync-key'];
    const trades = req.body;

    if (!syncKey) {
        return res.status(400).send("Missing Sync-Key header");
    }

    console.log(`Received ${trades.length} trades for key: ${syncKey}`);
    
    // Store data
    tradeStore[syncKey] = trades;
    
    res.status(200).send("Data received");
});

// 2. POLLING: Frontend asks "Do you have data for Key X?"
app.get('/api/trades/:syncKey', (req, res) => {
    const { syncKey } = req.params;
    const trades = tradeStore[syncKey];

    if (trades) {
        res.json({ success: true, trades });
    } else {
        res.status(404).json({ success: false, message: "No data yet" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👉 Set your EA Webhook URL to: http://localhost:${PORT}/api/webhook`);
});
