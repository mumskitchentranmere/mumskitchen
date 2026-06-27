#!/bin/bash
# Mum's Kitchen — Printer Bridge Launcher
# Double-click this file in Finder to start the printer bridge.
# To auto-start on login: System Settings → General → Login Items → add this file.

cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
  osascript -e 'display alert "Node.js not found" message "Please install Node.js from https://nodejs.org and try again." as critical'
  exit 1
fi

echo "Starting Mum'\''s Kitchen printer bridge..."
node printer-bridge.js
