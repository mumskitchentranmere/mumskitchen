#!/usr/bin/env node
/**
 * Mum's Kitchen — Printer Bridge
 *
 * Run this on the restaurant tablet via Termux:
 *   node printer-bridge.js
 *
 * Two endpoints:
 *   POST /print  — body is raw hex (legacy / Cloudflare tunnel path)
 *   POST /order  — body is JSON order object; bridge builds the receipt itself
 *
 * The /order endpoint means the browser can print instantly without a
 * server roundtrip — the same way Uber Eats works (local device, local printer).
 */

const net   = require('net');
const http  = require('http');
const https = require('https');
const fs    = require('fs');

const PRINTER_TTY    = process.env.PRINTER_TTY    || '/dev/cu.TSP100-K8110';
const PRINTER_HOST   = process.env.PRINTER_IP     || '192.168.1.102';
const PRINTER_PORT   = parseInt(process.env.PRINTER_PORT  || '9100', 10);
const BRIDGE_PORT    = parseInt(process.env.BRIDGE_PORT   || '9102', 10);
const POLL_URL       = process.env.POLL_URL       || 'https://mumskitchentranmere.com.au/api/printer/poll';
const PRINTER_API_KEY = process.env.PRINTER_API_KEY || '';
const POLL_INTERVAL  = parseInt(process.env.POLL_INTERVAL || '4000', 10);

// ── ESC/POS builder (mirrors the server-side Receipt class) ──────────────────
const LINE_WIDTH = 42;

class Receipt {
  constructor() { this.chunks = []; }
  cmd(...b)  { this.chunks.push(Buffer.from(b)); return this; }
  txt(s)     { this.chunks.push(Buffer.from(s.replace(/[^\x20-\x7E]/g, '?'), 'ascii')); return this; }
  lf()       { return this.cmd(0x0A); }
  feed(n=1)  { for (let i=0;i<n;i++) this.lf(); return this; }
  init()     { return this.cmd(0x1B, 0x40); }
  cut()      { return this.cmd(0x1D, 0x56, 0x41, 0x03); }
  align(a)   { return this.cmd(0x1B, 0x61, {L:0,C:1,R:2}[a]); }
  bold(on)   { return this.cmd(0x1B, 0x45, on ? 1 : 0); }
  size(w,h)  { return this.cmd(0x1D, 0x21, ((w-1)<<4)|(h-1)); }
  line(s)    { return this.txt(s).lf(); }
  divider(ch='-', w=LINE_WIDTH) { return this.line(ch.repeat(w)); }
  row(left, right, w=LINE_WIDTH) {
    const gap = w - left.length - right.length;
    return this.line((left + (gap>0?' '.repeat(gap):' ') + right).slice(0,w));
  }
  build() { return Buffer.concat(this.chunks); }
}

function buildReceipt(order) {
  const r         = new Receipt();
  const id        = String(order._id || '').slice(-6).toUpperCase();
  const typeLabel = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
  const now       = new Date();
  const date      = now.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' });
  const time      = now.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });

  r.init();
  r.align('C').size(2,2).bold(true).line("MUM'S KITCHEN").size(1,1).bold(false);
  r.align('C').line('Tranmere SA 5073').feed();
  r.align('C').bold(true).line(`ORDER #${id}`).bold(false);
  r.align('C').line(`${date}  ${time}`);
  r.divider('=');
  r.align('C').bold(true).size(1,2).line(typeLabel).size(1,1).bold(false);
  r.align('L').line(`Customer: ${order.customerName || ''}`);
  if (order.tableNumber)     r.bold(true).line(`Table:    ${order.tableNumber}`).bold(false);
  if (order.customerPhone)   r.line(`Phone:    ${order.customerPhone}`);
  if (order.pickupTime)      r.line(`Pickup:   ${order.pickupTime}`);
  if (order.deliveryAddress) r.line(`Address:  ${order.deliveryAddress}`);
  r.divider('-');

  for (const item of (order.items || [])) {
    r.align('L').bold(true)
     .row(`${item.quantity}x ${item.name}`, `$${((item.price||0)*(item.quantity||1)).toFixed(2)}`)
     .bold(false);
  }
  r.divider('-');

  if (order.subtotal != null && order.deliveryFee) {
    r.row('Subtotal', `$${(order.subtotal  ||0).toFixed(2)}`);
    r.row('Delivery', `$${(order.deliveryFee||0).toFixed(2)}`);
    r.divider('-');
  }
  r.bold(true).size(1,2)
   .row('TOTAL', `$${(order.total||0).toFixed(2)} AUD`)
   .size(1,1).bold(false);
  r.divider('=');

  if (order.specialInstructions) {
    r.align('L').bold(true).line('SPECIAL INSTRUCTIONS:').bold(false);
    r.line(order.specialInstructions);
    r.divider('-');
  }
  r.align('C').line('Thank you!').feed(4).cut();
  return r.build();
}

// ── Send to printer via TCP (LAN printer on port 9100) ───────────────────────
function sendToPrinter(data) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: PRINTER_HOST, port: PRINTER_PORT });
    socket.setTimeout(6000);
    socket.on('connect', () => socket.write(data, () => socket.end()));
    socket.on('close',   resolve);
    socket.on('error',   reject);
    socket.on('timeout', () => { socket.destroy(); reject(new Error('Printer timed out')); });
  });
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',          '*');
  res.setHeader('Access-Control-Allow-Methods',         'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',         'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end('Method Not Allowed'); return; }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    try {
      let data;

      if (req.url === '/order') {
        // New path: JSON order → build ESC/POS locally
        const order = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        data = buildReceipt(order);
      } else {
        // Legacy path: raw hex forwarded from server or tunnel
        const hex = Buffer.concat(chunks).toString('utf8').trim();
        data = Buffer.from(hex, 'hex');
      }

      await sendToPrinter(data);
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Printed`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

// ── Poll Hostinger for pending print jobs ────────────────────────────────────
function fetchJob() {
  return new Promise((resolve) => {
    const opts = {
      method:  'GET',
      headers: PRINTER_API_KEY ? { 'x-printer-key': PRINTER_API_KEY } : {},
    };
    const req = (POLL_URL.startsWith('https') ? https : http).request(POLL_URL, opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(body));
        } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
    req.end();
  });
}

async function pollLoop() {
  try {
    const order = await fetchJob();
    if (order && order._id) {
      console.log(`[${new Date().toLocaleTimeString()}] 🖨  Printing order #${String(order._id).slice(-6).toUpperCase()}`);
      try {
        await sendToPrinter(buildReceipt(order));
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Printed`);
      } catch (e) {
        console.error(`[${new Date().toLocaleTimeString()}] ❌ Print failed: ${e.message}`);
      }
    }
  } catch {}
  setTimeout(pollLoop, POLL_INTERVAL);
}

// ── Raw TCP server on port 9100 (for Lightspeed POS) ─────────────────────────
const RAW_PORT = parseInt(process.env.RAW_PORT || '9100', 10);
const rawServer = net.createServer((socket) => {
  const chunks = [];
  socket.on('data', c => chunks.push(c));
  socket.on('end', async () => {
    if (chunks.length === 0) return;
    const data = Buffer.concat(chunks);
    console.log(`[${new Date().toLocaleTimeString()}] 🖨  RAW print job (${data.length} bytes) from Lightspeed`);
    try {
      await sendToPrinter(data);
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Printed (Lightspeed)`);
    } catch (e) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`);
    }
  });
  socket.on('error', () => {});
});

server.listen(BRIDGE_PORT, '127.0.0.1', () => {
  rawServer.listen(RAW_PORT, '0.0.0.0', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log("  Mum's Kitchen — Printer Bridge");
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const printerDesc = fs.existsSync(PRINTER_TTY)
      ? `BT serial  ${PRINTER_TTY}`
      : `TCP        ${PRINTER_HOST}:${PRINTER_PORT} (BT port not found)`;
    console.log(`  Printer:  ${printerDesc}`);
    console.log(`  HTTP:     http://localhost:${BRIDGE_PORT}  (web app)`);
    console.log(`  TCP 9100: 0.0.0.0:${RAW_PORT}             (Lightspeed POS)`);
    console.log(`  Polling:  ${POLL_URL} every ${POLL_INTERVAL}ms`);
    console.log('  Ready. Orders auto-print when they arrive.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    setTimeout(pollLoop, 2000);
  });
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${BRIDGE_PORT} is already in use. Is another copy running?\n`);
  } else {
    console.error('\n❌ Server error:', e.message, '\n');
  }
  process.exit(1);
});
