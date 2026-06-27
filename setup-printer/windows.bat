@echo off
setlocal
title Mum's Kitchen - Printer Bridge Setup

echo.
echo  ==========================================
echo   Mum's Kitchen - Printer Bridge Setup
echo   Windows
echo  ==========================================
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Node.js not found.
  echo  Install it from https://nodejs.org then run this again.
  pause & exit /b 1
)

cd /d "%~dp0\.."
echo  Bridge location: %cd%\printer-bridge.js
echo.

:: Install PM2 globally (cross-platform process manager)
echo  Installing PM2 process manager...
call npm install -g pm2 2>nul
if %errorlevel% neq 0 (
  echo  ERROR: Failed to install PM2. Try running as Administrator.
  pause & exit /b 1
)

:: Start the bridge
echo  Starting printer bridge...
call pm2 start printer-bridge.js --name mumskitchen-printer 2>nul
call pm2 save

:: Set up Windows auto-start
echo  Setting up auto-start on Windows login...
call pm2 startup
call pm2 save

echo.
echo  ==========================================
echo   Done! Printer bridge is running.
echo   It will auto-start on every Windows login.
echo  ==========================================
echo.
echo   To check status:  pm2 status
echo   To view logs:     pm2 logs mumskitchen-printer
echo   To stop:          pm2 stop mumskitchen-printer
echo.

:: Step 2 - Cloudflare Tunnel setup
echo  ==========================================
echo   STEP 2: Cloudflare Tunnel (required for
echo   printing from the hosted site)
echo  ==========================================
echo.
echo   1. Download cloudflared from:
echo      https://github.com/cloudflare/cloudflared/releases/latest
echo      (Download: cloudflared-windows-amd64.exe)
echo.
echo   2. Rename it to cloudflared.exe and put it in this folder:
echo      %cd%
echo.
echo   3. Run in a new terminal:
echo      cloudflared tunnel --url http://localhost:9102
echo.
echo   4. Copy the https://xxxxx.trycloudflare.com URL it shows
echo.
echo   5. Add it to Hostinger environment variables:
echo      PRINTER_BRIDGE_URL=https://xxxxx.trycloudflare.com
echo.
echo   For a PERMANENT URL (never changes), create a free Cloudflare
echo   account at cloudflare.com and follow the named tunnel guide.
echo.
pause
