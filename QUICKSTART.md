# 🚀 Quick Start Guide - TradeSync Journal

## ⚡ The "Zero-Config" Way

### Step 1: Run the App
Open your terminal in the project folder and run:
```bash
npm start
```
*This will automatically start both the backend server and the frontend app.*

### Step 2: Connect MetaTrader 5
1. In the app (http://localhost:5173 or 3000), click **"Download JFX JOURNAL BRIDGE.mq5"**.
2. Copy the downloaded file to your MT5 Experts folder:
   - `File > Open Data Folder` in MT5.
   - Go to `MQL5 > Experts`.
   - Paste the file there.
3. In MT5, go to `Tools > Options > Expert Advisors`.
4. Check **"Allow WebRequest for listed URLs"**.
5. Add this URL: `http://127.0.0.1:3001`
6. Click OK.

### Step 3: Start
1. Drag the **JFX JOURNAL BRIDGE** EA onto any chart.
2. Click **"Start Listening"** in the web app.
3. You are connected! 🚀

---

## ❓ Troubleshooting
- **"Listening..." forever?** Make sure the EA is running on a chart and "Algo Trading" is enabled in MT5 toolbar.
- **Server error?** Ensure you ran `npm start` (or `node server.js` if running manually).
