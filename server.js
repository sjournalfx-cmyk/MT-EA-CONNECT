// server.js – Robust backend for JFX EA
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import dotenv from 'dotenv';

// 9. Environment Configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.resolve(process.env.DATA_FILE || 'trade_data.json');
const LOG_FILE = path.resolve(process.env.LOG_FILE || 'server.log');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// 7. Server Logging System
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    logStream.write(logMessage + '\n');
}

// 1. Data Persistence
let tradeStore = {};
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            tradeStore = JSON.parse(data);
            log(`Loaded data from ${DATA_FILE}`);
        } catch (err) {
            log(`Error loading data: ${err.message}`, 'ERROR');
            tradeStore = {};
        }
    }
}
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tradeStore, null, 2));
    } catch (err) {
        log(`Error saving data: ${err.message}`, 'ERROR');
    }
}

// Load data on startup
loadData();

// 2. Payload Validation Schema
const TradeSchema = z.object({
    ticket: z.number(),
    symbol: z.string(),
    type: z.string(),
    openTime: z.string(),
    closeTime: z.string().optional(),
    profit: z.number(),
    commission: z.number(),
    swap: z.number(),
    lots: z.number(),
    openPrice: z.number(),
    closePrice: z.number().optional(),
});

const AccountSchema = z.object({
    login: z.number(),
    name: z.string(),
    server: z.string(),
    currency: z.string(),
    leverage: z.number(),
    balance: z.number(),
    equity: z.number(),
    isReal: z.boolean().or(z.string().transform(val => val === 'true')),
});

const OpenPositionSchema = z.object({
    ticket: z.number(),
    symbol: z.string(),
    type: z.string(),
    openTime: z.string(),
    openPrice: z.number(),
    currentPrice: z.number(),
    sl: z.number(),
    tp: z.number(),
    lots: z.number(),
    swap: z.number(),
    profit: z.number(),
    comment: z.string().optional(),
});

const PayloadSchema = z.object({
    trades: z.array(TradeSchema),
    account: AccountSchema.nullable().optional(),
    openPositions: z.array(OpenPositionSchema).optional(),
});

// 4. Rate Limiting (Simple In-Memory)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5');

function rateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip);
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);

    if (recentRequests.length >= MAX_REQUESTS) {
        log(`Rate limit exceeded for IP: ${ip}`, 'WARN');
        return res.status(429).json({ error: 'Too many requests' });
    }

    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
    next();
}

// Apply rate limiting to webhook
app.post('/api/webhook', rateLimiter, (req, res) => {
    const syncKey = req.headers['sync-key'] || 'default_user';

    // Validate Payload
    const validation = PayloadSchema.safeParse(req.body);

    if (!validation.success) {
        log(`Validation failed for key ${syncKey}: ${validation.error.message}`, 'ERROR');
        return res.status(400).json({ error: 'Invalid payload', details: validation.error.format() });
    }

    const { trades, account, openPositions } = validation.data;

    log(`📥 Webhook: ${trades.length} trades, ${openPositions?.length || 0} positions for ${syncKey}`);

    // 3. Smart Polling Support (Timestamping)
    tradeStore[syncKey] = {
        trades,
        account,
        openPositions: openPositions || [],
        lastUpdated: Date.now() // Use timestamp for delta checks
    };

    saveData(); // Persist to disk
    res.sendStatus(200);
});

// Polling Endpoint
app.get('/api/trades/:syncKey', (req, res) => {
    const { syncKey } = req.params;
    const lastClientUpdate = parseInt(req.query.lastUpdated || '0');

    const data = tradeStore[syncKey];

    if (!data) {
        return res.status(404).json({ success: false, message: 'No data yet' });
    }

    // 3. Smart Polling: Return 304 if no changes
    if (data.lastUpdated <= lastClientUpdate) {
        return res.status(304).send(); // Not Modified
    }

    res.json({ success: true, ...data });
});

app.listen(PORT, '0.0.0.0', () => {
    log(`🚀 Server robustly running on http://0.0.0.0:${PORT}`);
    log(`👉 Webhook: http://127.0.0.1:${PORT}/api/webhook`);
});
