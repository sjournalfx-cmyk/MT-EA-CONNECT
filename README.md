# TradeSync Journal - MetaTrader 5 Trading Journal

A professional trading journal app that connects to MetaTrader 5 to fetch and analyze your trade history using Gemini AI.

![TradeSync Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Features

- **Real-time MT5 Connection** - Connect directly to your MetaTrader 5 terminal via custom EA bridge
- **HTML Import** - Upload MT5 HTML reports for instant analysis  
- **AI-Powered Insights** - Get personalized coaching and performance analysis using Google's Gemini AI
- **Beautiful Analytics** - Visualize your trading performance with interactive charts
- **Trade History** - Comprehensive trade log with detailed metrics
- **Dark Mode UI** - Premium, modern interface with smooth animations

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org)
- **MetaTrader 5** (Optional - for live connection)
- **Gemini API Key** - [Get one for free](https://ai.google.dev/)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API Key

1. Open the `.env.local` file in the root directory
2. Replace `your-api-key-here` with your actual Gemini API key:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

> **Get your API key**: Visit [https://ai.google.dev/](https://ai.google.dev/) to create a free Gemini API key

### 3. Run the Application

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## 🔌 MetaTrader 5 Connection Methods

### Method 1: EA Bridge (Real-time Sync)

1. **Start the Local Server**
   - Navigate to the project root
   - Run `node server.js` in a separate terminal
   - Server will run on `http://localhost:3001`

2. **Download Custom EA**
   - Open the app in your browser
   - Click "Download JFX JOURNAL BRIDGE.mq5"
   - Place the file in: `MT5/MQL5/Experts/`

3. **Configure MT5**
   - In MT5, go to: `Tools > Options > Expert Advisors`
   - Check "Allow WebRequest for listed URLs"
   - Add: `http://localhost:3001/api/webhook`

4. **Attach EA**
   - Drag the EA onto any chart
   - Click "Start Listening" in the web app
   - Your trades will sync automatically!

### Method 2: HTML Report Import (No Connection Required)

1. In MT5, go to: `View > Toolbox > History`
2. Right-click and select "Save as Report"
3. Save as HTML format
4. Drag and drop the HTML file into the app

## 🎯 Using the App

### Dashboard Overview
- **Net Profit** - Total profit/loss across all trades
- **Win Rate** - Percentage of winning trades
- **Total Trades** - Number of closed positions
- **Average Trade** - Average profit per trade

### AI Coaching
Click the "Get AI Coaching" button to receive:
- 📊 Performance summary
- ✅ Trading strengths
- ⚠️ Areas for improvement
- 📈 Letter grade rating

### Charts
- **Equity Curve** - Visual representation of your cumulative profit over time
- **Trade Table** - Detailed breakdown of every trade

## 📁 Project Structure

```
MT-EA-CONNECT/
├── components/
│   ├── ConnectForm.tsx      # Connection interface
│   └── TradeJournal.tsx     # Main journal dashboard
├── services/
│   ├── geminiService.ts     # AI analysis integration
│   ├── mockMT5Service.ts    # MT5 data parsing
│   └── mql5Script.ts        # EA code generator
├── App.tsx                  # Main app component
├── index.tsx               # Entry point
├── types.ts                # TypeScript definitions
├── server.js               # Local webhook server
└── .env.local              # Environment variables
```

## 🔧 Troubleshooting

### App won't start
- Ensure Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again
- Check that port 3000 is not in use

### EA connection fails
- Verify the local server is running (`node server.js`)
- Check that `http://localhost:3001/api/webhook` is in MT5's allowed URLs list
- Ensure the Sync Key matches in both the EA and web app

### AI Analysis not working
- Verify your `GEMINI_API_KEY` is set correctly in `.env.local`
- Check your API key is active at [https://ai.google.dev/](https://ai.google.dev/)
- Restart the dev server after changing environment variables

### HTML Import fails
- Ensure you're uploading an MT5 HTML report (not CSV or other formats)
- The report must contain closed trades (not just open positions)

## 🌐 Deployment

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` folder, ready to deploy to any static hosting service.

## 🔐 Security Notes

- **Local Only**: The EA bridge runs on localhost for security
- **API Keys**: Never commit your `.env.local` file
- **HTTPS**: Use HTTPS in production to protect API keys

## 📝 License

Copyright 2024, TradeSync App

## 🤝 Support

For issues or questions:
- View in AI Studio: [https://ai.studio/apps/drive/1DVDfWFJ-1D4qFbHuymoME6CXma-9v4jB](https://ai.studio/apps/drive/1DVDfWFJ-1D4qFbHuymoME6CXma-9v4jB)

---

**Happy Trading! 📈**
