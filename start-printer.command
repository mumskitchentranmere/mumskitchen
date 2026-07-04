#!/bin/bash
# Mum's Kitchen — Printer Bridge + Cloudflare Tunnel
# Double-click in Finder to start both services.
# To auto-start on login: System Settings → General → Login Items → add this file.

cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
  osascript -e 'display alert "Node.js not found" message "Please install Node.js from https://nodejs.org" as critical'
  exit 1
fi

if ! command -v cloudflared &> /dev/null; then
  osascript -e 'display alert "cloudflared not found" message "Run: brew install cloudflared" as critical'
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mum's Kitchen — Printer Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Bridge:  http://localhost:9102"
echo "  Tunnel:  https://printer.mumskitchentranmere.com.au"
echo "  Printer: 192.168.1.102:9100"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start bridge in background
node printer-bridge.js &
BRIDGE_PID=$!
echo "Bridge started (PID $BRIDGE_PID)"

# Give bridge a moment to start
sleep 1

# Start Cloudflare tunnel in foreground
echo "Starting Cloudflare tunnel..."
cloudflared tunnel run mumskitchen-printer

# If tunnel exits, kill the bridge too
kill $BRIDGE_PID 2>/dev/null
