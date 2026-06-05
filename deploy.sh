#!/bin/bash
# Mum's Kitchen — Hostinger deploy script
# Run this on the Hostinger server after uploading the zip

set -e

echo "=== Mum's Kitchen Deployment ==="

# 1. Check Node.js version
echo "Node version: $(node -v)"

# 2. Make sure .env.local exists
if [ ! -f ".env.local" ]; then
  echo "ERROR: .env.local not found. Upload it first."
  exit 1
fi

# 3. Verify key files exist
for f in server.js start.js polyfill-localstorage.cjs; do
  if [ ! -f "$f" ]; then
    echo "ERROR: $f not found. Re-upload the zip."
    exit 1
  fi
done

echo "All files present ✓"
echo "Starting server..."

# 4. Start the app
node start.js
