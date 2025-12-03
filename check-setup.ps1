# TradeSync Journal - Setup Verification

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "TradeSync Journal - Setup Check" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " [OK] Found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host " [FAIL] Not found! Please install Node.js from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -NoNewline
try {
    $npmVersion = npm --version
    Write-Host " [OK] Found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host " [FAIL] Not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
Write-Host "Checking dependencies..." -NoNewline
if (Test-Path "node_modules") {
    Write-Host " [OK] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host " [WARNING] Dependencies not installed" -ForegroundColor Yellow
    Write-Host "  Run: npm install" -ForegroundColor Yellow
}

# Check server.js exists
Write-Host "Checking server.js..." -NoNewline
if (Test-Path "server.js") {
    Write-Host " [OK] EA Bridge server found" -ForegroundColor Green
} else {
    Write-Host " [FAIL] server.js not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Status Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "[OK] Ready to run!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start testing EA Bridge:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Terminal 1 (Server):" -ForegroundColor Yellow
    Write-Host "  node server.js" -ForegroundColor White
    Write-Host ""
    Write-Host "Terminal 2 (App):" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "See EA_BRIDGE_TESTING.md for full testing guide" -ForegroundColor Gray
} else {
    Write-Host "[WARNING] Please install dependencies first:" -ForegroundColor Yellow
    Write-Host "  npm install" -ForegroundColor White
}

Write-Host ""
