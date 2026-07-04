#!/bin/bash
# Mum's Kitchen — Printer Bridge
# Double-click in Finder to start.
# To auto-start on login: System Settings → General → Login Items → add this file.

cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
  osascript -e 'display alert "Node.js not found" message "Please install Node.js from https://nodejs.org" as critical'
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Mum's Kitchen — Printer Bridge"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Polls: https://mumskitchentranmere.com.au/api/printer/poll"
echo "  Printer: /dev/tty.TSP100-K8110 (Bluetooth)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node printer-bridge.js
