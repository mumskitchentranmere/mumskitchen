#!/bin/bash
# Mum's Kitchen — Printer Bridge Auto-Start Setup
# Run this script ONCE on the restaurant Mac.
# After that, the printer bridge starts automatically on every login
# and restarts itself if it ever crashes — no manual action needed.
#
# Usage:
#   chmod +x setup-printer-autostart.sh
#   ./setup-printer-autostart.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE_PATH="$(which node 2>/dev/null || echo '')"
PLIST_NAME="com.mumskitchen.printer"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"
LOG_DIR="$HOME/Library/Logs/MumsKitchen"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mum's Kitchen — Printer Auto-Start Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Node.js
if [ -z "$NODE_PATH" ]; then
  echo ""
  echo "❌ Node.js not found."
  echo "   Install it from https://nodejs.org and run this script again."
  exit 1
fi

echo "  Node.js : $NODE_PATH"
echo "  Bridge  : $SCRIPT_DIR/printer-bridge.js"
echo "  Logs    : $LOG_DIR/printer-bridge.log"
echo ""

# Create log directory
mkdir -p "$LOG_DIR"

# Write the LaunchAgent plist
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$PLIST_NAME</string>

  <key>ProgramArguments</key>
  <array>
    <string>$NODE_PATH</string>
    <string>$SCRIPT_DIR/printer-bridge.js</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$SCRIPT_DIR</string>

  <!-- Start on login and keep alive (restart on crash) -->
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>

  <!-- Log output for debugging -->
  <key>StandardOutPath</key>
  <string>$LOG_DIR/printer-bridge.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/printer-bridge-error.log</string>
</dict>
</plist>
PLIST

# Unload any previous version, then load the new one
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load   "$PLIST_PATH"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Done! Printer bridge is now running."
echo "     It will auto-start on every login."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  To check status : launchctl list | grep mumskitchen"
echo "  To view logs    : tail -f $LOG_DIR/printer-bridge.log"
echo "  To stop service : launchctl unload $PLIST_PATH"
echo ""
