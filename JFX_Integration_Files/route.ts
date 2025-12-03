import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin'; // You'll need to ensure this exists
import { z } from 'zod';

// --- Validation Schemas (Same as before) ---
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

export async function POST(req: NextRequest) {
    try {
        // 1. Security: Check for Sync Key
        // The EA sends this in the header
        const syncKey = req.headers.get('sync-key');

        if (!syncKey) {
            return NextResponse.json({ error: 'Missing sync-key header' }, { status: 401 });
        }

        // 2. Validate Payload
        const body = await req.json();
        const validation = PayloadSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Invalid payload', 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const { trades, account, openPositions } = validation.data;

        // 3. Find User by Sync Key
        // We assume you have a 'users' collection where a document has a field 'eaSyncKey' == syncKey
        // OR you can store the key in a separate 'api_keys' collection.
        // For this example, let's assume 'ea_sessions' collection keyed by syncKey.
        
        const sessionRef = adminDb.collection('ea_sessions').doc(syncKey);
        
        // Optional: Check if key exists/is active before writing
        // const doc = await sessionRef.get();
        // if (!doc.exists) return NextResponse.json({ error: 'Invalid key' }, { status: 403 });

        // 4. Save to Firestore
        await sessionRef.set({
            trades,
            account,
            openPositions: openPositions || [],
            lastUpdated: Date.now(),
            lastIp: req.headers.get('x-forwarded-for') || 'unknown'
        }, { merge: true });

        console.log(`✅ Webhook received for key ${syncKey}: ${trades.length} trades`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
