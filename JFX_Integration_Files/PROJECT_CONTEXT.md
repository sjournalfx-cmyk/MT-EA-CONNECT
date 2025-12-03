# MT-EA-CONNECT: Project Context & Documentation

## 1. Project Overview
**MT-EA-CONNECT** is a bridge application designed to synchronize trading data from **MetaTrader 5 (MT5)** to a web application in real-time. It consists of an Expert Advisor (EA) running on MT5 and a web backend that receives the data.

**Goal:** To allow users to view their live trading performance, open positions, and account metrics on a modern web dashboard (JFX Journal).

## 2. Core Features (v2.0)
The project has recently been upgraded to v2.0 with the following capabilities:

### A. Smart Delta Sync
- **Efficiency:** The EA only sends data when changes are detected (new trades, closed positions, equity shifts).
- **Logic:** Tracks `lastSyncedTradeCount`, `lastSyncedPositionCount`, and balance/equity thresholds.
- **Benefit:** Reduces network traffic by ~90%.

### B. Robust Retry System
- **Reliability:** If the server is offline, the EA saves data to a local file (`EA_Queue_default_user.txt`).
- **Recovery:** Automatically retries sending queued data every 5 seconds until successful.
- **Benefit:** Zero data loss during network outages.

### C. On-Chart Status Panel
- **UX:** Displays a visual panel on the MT5 chart showing connection status (Green/Red), ping, and last sync time.

## 3. Architecture & Migration

We are currently migrating from a standalone "Local Node Server" architecture to a "Serverless Next.js + Firebase" architecture.

### Old Architecture (Standalone)
- **Backend:** Express.js (`server.js`) running locally on port 3001.
- **Database:** Local JSON file (`trade_data.json`).
- **Frontend:** React App (`App.tsx`) polling the local server.

### New Architecture (Integrated)
- **Backend:** Next.js API Route (`/api/ea-webhook`).
- **Database:** Firebase Firestore (Cloud Database).
- **Frontend:** Next.js Dashboard Page (Real-time Firestore listeners).

## 4. Data Schemas

The system syncs three main types of data:

### Account Info
```typescript
interface AccountInfo {
  login: number;
  name: string;
  server: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  isReal: boolean;
}
```

### Trade History (Closed Trades)
```typescript
interface Trade {
  ticket: number;
  symbol: string;
  type: string; // "Buy" or "Sell"
  openTime: string;
  closeTime: string;
  profit: number;
  commission: number;
  swap: number;
  lots: number;
  openPrice: number;
  closePrice: number;
}
```

### Open Positions (Live)
```typescript
interface OpenPosition {
  ticket: number;
  symbol: string;
  type: string;
  openTime: string;
  openPrice: number;
  currentPrice: number;
  sl: number; // Stop Loss
  tp: number; // Take Profit
  lots: number;
  swap: number;
  profit: number; // Floating profit
}
```

## 5. Integration Files
We have prepared a folder `JFX_Integration_Files` containing the code for the New Architecture:

1.  **`route.ts`**: The Next.js API handler.
    -   **Role:** Receives POST requests from MT5.
    -   **Action:** Validates data using Zod and saves it to Firestore collection `ea_sessions/{syncKey}`.
    -   **Security:** Checks for `sync-key` header.

2.  **`page.tsx`**: The Frontend Dashboard Component.
    -   **Role:** Displays connection instructions and live data.
    -   **Action:** Listens to `ea_sessions/{syncKey}` in Firestore using `onSnapshot`.
    -   **UX:** Shows "Live Connected" status and updates UI instantly.

## 6. User Workflow (The "Happy Path")
1.  User logs into JFX Journal Web App.
2.  User navigates to "Connect MT5".
3.  User sees their unique **Sync Key** (e.g., `user_123`).
4.  User downloads the **JFX Journal Bridge EA**.
5.  User installs EA in MT5 and enters the **Sync Key**.
6.  **Done!** Data starts flowing to the web dashboard immediately.

## 7. Developer Notes for AI Agent
-   **Firebase Admin:** The API route requires `firebase-admin` to be initialized server-side.
-   **Firestore Rules:** Ensure Firestore rules allow the frontend to *read* the `ea_sessions` collection.
-   **Hardcoded URL:** The EA should be compiled with the production API URL hardcoded (e.g., `https://jfx-journal.com/api/ea-webhook`) so users don't have to type it.
