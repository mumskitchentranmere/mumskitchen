#!/bin/bash
# Mum's Kitchen — Printer Bridge Setup (Linux)
# Run once: chmod +x setup-printer/linux.sh && sudo ./setup-printer/linux.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_PATH="$(which node 2>/dev/null || echo '')"
SERVICE_USER="${SUDO_USER:-$USER}"

echo ""
echo "=========================================="
echo "  Mum's Kitchen - Printer Bridge Setup"
echo "  Linux (systemd)"
echo "=========================================="

[ -z "$NODE_PATH" ] && echo "ERROR: Node.js not found. Install from https://nodejs.org" && exit 1

echo "  Bridge: $SCRIPT_DIR/printer-bridge.js"
echo "  User:   $SERVICE_USER"
echo ""

# Create systemd service
cat > /etc/systemd/system/mumskitchen-printer.service << EOF
[Unit]
Description=Mum's Kitchen Printer Bridge
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_PATH $SCRIPT_DIR/printer-bridge.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mumskitchen-printer
systemctl start  mumskitchen-printer

echo ""
echo "=========================================="
echo "  Done! Bridge running + auto-start set."
echo "=========================================="
echo ""
echo "  systemctl status mumskitchen-printer    — check status"
echo "  journalctl -u mumskitchen-printer -f    — view logs"
echo "  systemctl stop mumskitchen-printer      — stop"
echo ""
echo "=========================================="
echo "  STEP 2: Cloudflare Tunnel"
echo "=========================================="
echo ""
echo "  Install cloudflared:"
echo "  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared"
echo "  chmod +x /usr/local/bin/cloudflared"
echo ""
echo "  Run:"
echo "  cloudflared tunnel --url http://localhost:9102"
echo ""
echo "  Copy the https://xxxxx.trycloudflare.com URL and add to"
echo "  Hostinger environment variables:"
echo "  PRINTER_BRIDGE_URL=https://xxxxx.trycloudflare.com"
echo ""
