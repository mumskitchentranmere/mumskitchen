#!/bin/bash
# Mum's Kitchen — Printer Bridge Setup (macOS)
# Run once: chmod +x setup-printer/mac.sh && ./setup-printer/mac.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_PATH="$(which node 2>/dev/null || echo '')"

echo ""
echo "=========================================="
echo "  Mum's Kitchen - Printer Bridge Setup"
echo "  macOS"
echo "=========================================="

[ -z "$NODE_PATH" ] && echo "ERROR: Node.js not found. Install from https://nodejs.org" && exit 1

echo "  Bridge: $SCRIPT_DIR/printer-bridge.js"
echo ""

# Install PM2
echo "Installing PM2..."
npm install -g pm2

cd "$SCRIPT_DIR"
pm2 start printer-bridge.js --name mumskitchen-printer 2>/dev/null || true
pm2 save

# macOS LaunchAgent auto-start
pm2 startup | tail -1 | bash 2>/dev/null || true
pm2 save

echo ""
echo "=========================================="
echo "  Done! Bridge running + auto-start set."
echo "=========================================="
echo ""
echo "  pm2 status                    — check status"
echo "  pm2 logs mumskitchen-printer  — view logs"
echo "  pm2 stop mumskitchen-printer  — stop"
echo ""
echo "=========================================="
echo "  STEP 2: Cloudflare Tunnel"
echo "=========================================="
echo ""
echo "  Install cloudflared:"
echo "  brew install cloudflared"
echo "  (or download from https://github.com/cloudflare/cloudflared/releases)"
echo ""
echo "  Then run:"
echo "  cloudflared tunnel --url http://localhost:9102"
echo ""
echo "  Copy the https://xxxxx.trycloudflare.com URL and add to"
echo "  Hostinger environment variables:"
echo "  PRINTER_BRIDGE_URL=https://xxxxx.trycloudflare.com"
echo ""
echo "  For a permanent URL, set up a named Cloudflare tunnel."
echo ""
