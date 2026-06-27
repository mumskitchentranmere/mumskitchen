#!/usr/bin/env node
/**
 * Mum's Kitchen — Printer Bridge
 *
 * Run this on the restaurant computer (the one on the same Wi-Fi as the printer):
 *   node printer-bridge.js
 *
 * It listens on http://localhost:9102 and forwards ESC/POS data to the
 * Star TSP100III at 192.168.1.102:9100 via raw TCP.
 *
 * Chrome allows http://localhost calls from HTTPS pages, so the hosted admin
 * site at mumskitchentranmere.com.au can reach this bridge without any
 * security warnings.
 *
 * To start automatically on Mac login:
 *   1. Open Automator → New Document → Application
 *   2. Add "Run Shell Script" → command: node /path/to/printer-bridge.js
 *   3. Save to ~/Applications and add to Login Items in System Settings
 */

const net  = require('net');
const http = require('http');

const PRINTER_HOST = process.env.PRINTER_IP   || '192.168.1.102';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const BRIDGE_PORT  = parseInt(process.env.BRIDGE_PORT  || '9102', 10);

function sendToPrinter(hexData) {
  return new Promise((resolve, reject) => {
    const data   = Buffer.from(hexData.trim(), 'hex');
    const socket = net.createConnection({ host: PRINTER_HOST, port: PRINTER_PORT });

    socket.setTimeout(6000);
    socket.on('connect', () => { socket.write(data, () => socket.end()); });
    socket.on('close',   resolve);
    socket.on('error',   reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Printer at ${PRINTER_HOST}:${PRINTER_PORT} timed out`));
    });
  });
}

const server = http.createServer((req, res) => {
  // Standard CORS + Chrome Private Network Access header (required since Chrome 115
  // for https:// pages calling http://localhost).
  res.setHeader('Access-Control-Allow-Origin',          '*');
  res.setHeader('Access-Control-Allow-Methods',         'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',         'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end('Method Not Allowed'); return; }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const hex = Buffer.concat(chunks).toString('utf8');
    try {
      await sendToPrinter(hex);
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Receipt printed`);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } catch (e) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(e.message);
    }
  });
});

server.listen(BRIDGE_PORT, '127.0.0.1', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log("  Mum's Kitchen — Printer Bridge");
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Bridge:  http://localhost:${BRIDGE_PORT}`);
  console.log(`  Printer: ${PRINTER_HOST}:${PRINTER_PORT}`);
  console.log('  Ready to print. Keep this window open.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${BRIDGE_PORT} is already in use.`);
    console.error('   Is another copy of printer-bridge.js already running?\n');
  } else {
    console.error('\n❌ Server error:', e.message, '\n');
  }
  process.exit(1);
});
