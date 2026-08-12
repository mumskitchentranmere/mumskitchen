'use client';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Clock, Phone, Mail, Search, Download, Filter, Check, X, Printer, ChevronDown, ChevronUp, BellRing } from 'lucide-react';

function playRingtone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;
    const beep = (start: number, dur: number, freq: number, vol = 0.38) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    };
    // Ascending triple beep × 2 (like a doorbell chime)
    beep(t + 0.00, 0.13, 880);
    beep(t + 0.20, 0.13, 1108);
    beep(t + 0.40, 0.25, 1318);
    beep(t + 0.85, 0.13, 880);
    beep(t + 1.05, 0.13, 1108);
    beep(t + 1.25, 0.35, 1318);
    setTimeout(() => ctx.close().catch?.(() => {}), 2500);
  } catch {}
}
import toast from 'react-hot-toast';

const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
const SC: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#f97316',
  ready: '#22c55e', 'out-for-delivery': '#8b5cf6', delivered: '#16a34a', cancelled: '#ef4444',
};

function downloadCSV(orders: any[]) {
  const header = ['Order ID', 'Date', 'Customer', 'Phone', 'Email', 'Status', 'Payment', 'Type', 'Items', 'Total (AUD)', 'Pickup Time', 'Instructions'];
  const rows = orders.map(o => [
    o._id.slice(-6).toUpperCase(),
    new Date(o.createdAt).toLocaleString('en-AU'),
    o.customerName, o.customerPhone || '', o.customerEmail || '',
    o.status, o.paymentStatus, o.orderType,
    (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('; '),
    (o.total || 0).toFixed(2), o.pickupTime || '', o.specialInstructions || '',
  ]);
  const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── ESC/POS builder (runs in browser, mirrors printer-bridge.js) ──────────────
function buildEscPos(order: any): Uint8Array {
  const chunks: Uint8Array[] = [];
  const enc = new TextEncoder();
  const W = 42;
  const cmd  = (...b: number[]) => chunks.push(new Uint8Array(b));
  const txt  = (s: string) => chunks.push(enc.encode(s.replace(/[^\x20-\x7E]/g, '?')));
  const lf   = () => cmd(0x0A);
  const feed = (n = 1) => { for (let i = 0; i < n; i++) lf(); };
  const init  = () => cmd(0x1B, 0x40);
  const cut   = () => cmd(0x1D, 0x56, 0x41, 0x03);
  const align = (a: 'L'|'C'|'R') => cmd(0x1B, 0x61, {L:0,C:1,R:2}[a]);
  const bold  = (on: boolean) => cmd(0x1B, 0x45, on ? 1 : 0);
  const size  = (w: number, h: number) => cmd(0x1D, 0x21, ((w-1)<<4)|(h-1));
  const line  = (s: string) => { txt(s); lf(); };
  const div   = (ch = '-') => line(ch.repeat(W));
  const row   = (l: string, r: string) => {
    const gap = W - l.length - r.length;
    line((l + (gap > 0 ? ' '.repeat(gap) : ' ') + r).slice(0, W));
  };

  const id   = String(order._id || '').slice(-6).toUpperCase();
  const type = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
  const now  = new Date();
  const date = now.toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric' });
  const time = now.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' });

  init();
  align('C'); size(2,2); bold(true);  line("MUM'S KITCHEN"); size(1,1); bold(false);
  align('C'); line('Tranmere SA 5073'); feed();
  align('C'); bold(true); line(`ORDER #${id}`); bold(false);
  align('C'); line(`${date}  ${time}`);
  div('=');
  align('C'); bold(true); size(1,2); line(type); size(1,1); bold(false);
  align('L'); line(`Customer: ${order.customerName || ''}`);
  if (order.tableNumber)     { bold(true); line(`Table:    ${order.tableNumber}`); bold(false); }
  if (order.customerPhone)   line(`Phone:    ${order.customerPhone}`);
  if (order.pickupTime)      line(`Pickup:   ${order.pickupTime}`);
  if (order.deliveryAddress) line(`Address:  ${order.deliveryAddress}`);
  div('-');
  for (const item of (order.items || [])) {
    align('L'); bold(true);
    row(`${item.quantity}x ${item.name}`, `$${((item.price||0)*(item.quantity||1)).toFixed(2)}`);
    bold(false);
  }
  div('-');
  if (order.subtotal != null && order.deliveryFee) {
    row('Subtotal', `$${(order.subtotal||0).toFixed(2)}`);
    row('Delivery', `$${(order.deliveryFee||0).toFixed(2)}`);
    div('-');
  }
  bold(true); size(1,2); row('TOTAL', `$${(order.total||0).toFixed(2)} AUD`); size(1,1); bold(false);
  div('=');
  if (order.specialInstructions) {
    align('L'); bold(true); line('SPECIAL INSTRUCTIONS:'); bold(false);
    line(order.specialInstructions); div('-');
  }
  align('C'); line('Thank you!'); feed(4); cut();

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

// ── Receipt printer ───────────────────────────────────────────────────────────
// 1st try: RawBT on Android (http://localhost:7778/rawbt) — direct, no bridge
// 2nd try: server polling route (/api/printer/print) — for Mac bridge fallback
async function silentPrint(order: any): Promise<boolean> {
  // Try RawBT (Android tablet with RawBT app installed)
  try {
    const escpos = buildEscPos(order);
    const ok = await Promise.resolve()
      .then(() => fetch('http://localhost:7778/rawbt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body:    escpos.buffer as ArrayBuffer,
      }))
      .then(r => r.ok)
      .catch(() => false);
    if (ok) return true;
  } catch {}
  // Fallback: server-side polling bridge
  return Promise.resolve()
    .then(() => fetch('/api/printer/print', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(order),
    }))
    .then(r => r.ok)
    .catch(() => false);
}

async function printReceipt(order: any) {
  const tid = toast.loading('Sending to printer…');
  const ok  = await silentPrint(order);
  if (ok) {
    toast.success('Printed!', { id: tid });
  } else {
    toast.error('Printer offline — is the bridge running?', { id: tid });
  }
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ o, updating, capturing, onUpdate, onCapture }: {
  o: any;
  updating: string | null;
  capturing: string | null;
  onUpdate: (id: string, status: string) => void;
  onCapture: (id: string, action: 'accept' | 'reject') => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAuthorized = o.paymentStatus === 'authorized';
  const isPaid       = o.paymentStatus === 'paid';
  const isTerminal   = o.status === 'delivered' || o.status === 'cancelled';

  return (
    <div style={{ background: 'white', borderRadius: '16px', border: isAuthorized ? '2px solid #f97316' : '1px solid var(--stone-light)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      {/* Urgent stripe for authorized orders */}
      {isAuthorized && (
        <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse-dot 1s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', letterSpacing: '0.03em' }}>AWAITING YOUR CONFIRMATION — Card authorized</span>
        </div>
      )}

      <div style={{ padding: '18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="order-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--brown-mid)', background: 'var(--stone-light)', padding: '2px 7px', borderRadius: '5px' }}>
                #{o._id.slice(-6).toUpperCase()}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600, background: SC[o.status] + '20', color: SC[o.status], textTransform: 'capitalize' }}>
                {o.status}
              </span>
              <span style={{ fontSize: '11px', background: 'var(--stone-light)', color: 'var(--brown-mid)', padding: '2px 8px', borderRadius: '8px', textTransform: 'capitalize' }}>
                {o.orderType === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
              </span>
              {o.orderType === 'dinein' && o.tableNumber && (
                <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  Table {o.tableNumber}
                </span>
              )}
              {o.paymentStatus === 'authorized' && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600, background: '#fff7ed', color: '#ea580c' }}>💳 Authorized</span>}
              {o.paymentStatus === 'paid'       && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>✓ Paid</span>}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '4px' }}>{o.customerName}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: 'var(--brown-mid)' }}>
              {o.customerPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} /> {o.customerPhone}</span>}
              {o.customerEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} /> {o.customerEmail}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {new Date(o.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            {o.pickupTime && <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '3px' }}>🕐 Pickup: {o.pickupTime}</div>}
            {o.specialInstructions && <div style={{ fontSize: '12px', color: '#92400e', marginTop: '3px', fontStyle: 'italic', background: '#fef3c7', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>"{o.specialInstructions}"</div>}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--red-korean)' }}>${o.total?.toFixed(2)}</div>
            <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>AUD</div>
          </div>
        </div>

        {/* Items — collapsible */}
        <div style={{ background: '#f9f5f0', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
          <button onClick={() => setExpanded(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)' }}>
              {(o.items || []).length} item{(o.items || []).length !== 1 ? 's' : ''}
              {!expanded && <span style={{ fontWeight: 400, marginLeft: '6px' }}>— {(o.items || []).slice(0, 2).map((i: any) => `${i.quantity}× ${i.name}`).join(', ')}{(o.items || []).length > 2 ? '…' : ''}</span>}
            </span>
            {expanded ? <ChevronUp size={13} color="var(--brown-mid)" /> : <ChevronDown size={13} color="var(--brown-mid)" />}
          </button>
          {expanded && (
            <div style={{ padding: '0 12px 10px', borderTop: '1px solid var(--stone-light)' }}>
              {(o.items || []).map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < o.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div>
                      <span style={{ color: 'var(--brown-dark)', fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: 'var(--brown-mid)', fontSize: '11px', marginLeft: '5px' }}>× {item.quantity}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--brown-mid)', flexShrink: 0, fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accept / Reject for authorized orders */}
        {isAuthorized && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onCapture(o._id, 'accept')}
              disabled={capturing === o._id}
              style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: capturing === o._id ? '#86efac' : '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 16px', cursor: capturing === o._id ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', transition: 'background 0.15s' }}
            >
              <Check size={15} /> Accept &amp; Charge
            </button>
            <button
              onClick={() => onCapture(o._id, 'reject')}
              disabled={capturing === o._id}
              style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: capturing === o._id ? '#fca5a5' : '#ef4444', color: 'white', border: 'none', borderRadius: '10px', padding: '11px 16px', cursor: capturing === o._id ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', transition: 'background 0.15s' }}
            >
              <X size={15} /> Reject &amp; Release
            </button>
          </div>
        )}

        {/* Status progression + print */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ALL_STATUSES.map(s => {
            const isCancelLocked = s === 'cancelled' && isPaid;
            const isDisabled = updating === o._id || isCancelLocked || (isTerminal && o.status !== s);
            return (
              <button
                key={s}
                onClick={() => !isTerminal && onUpdate(o._id, s)}
                disabled={isDisabled}
                title={isCancelLocked ? 'Cannot cancel a paid order' : isTerminal && o.status !== s ? 'Order is finalised' : undefined}
                style={{
                  padding: '5px 11px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: o.status === s ? SC[s] : isDisabled ? '#e5e7eb' : 'var(--stone-light)',
                  background: o.status === s ? SC[s] + '20' : 'white',
                  color: o.status === s ? SC[s] : isDisabled ? '#d1d5db' : 'var(--brown-mid)',
                  fontSize: '11px', fontWeight: o.status === s ? 700 : 400,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif', textTransform: 'capitalize',
                  opacity: isDisabled && o.status !== s ? 0.4 : 1,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {s}
              </button>
            );
          })}
          <button
            onClick={() => printReceipt(o)}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Poppins, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}
            title="Print receipt (uses system printer — Star TSP100 or any connected printer)"
          >
            <Printer size={12} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders,       setOrders]      = useState<any[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [search,       setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payFilter,    setPayFilter]   = useState('all');
  const [dateFrom,     setDateFrom]    = useState('');
  const [dateTo,       setDateTo]      = useState('');
  const [updating,     setUpdating]    = useState<string | null>(null);
  const [capturing,    setCapturing]   = useState<string | null>(null);
  const [alertActive,   setAlertActive]  = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [togglingDineIn, setTogglingDineIn] = useState(false);

  const seenOrderIds   = useRef<Set<string>>(new Set());
  const isFirstLoad    = useRef(true);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRing = useCallback(() => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
    setAlertActive(false);
    setNewOrderCount(0);
  }, []);

  const startRing = useCallback((count: number) => {
    playRingtone();
    setAlertActive(true);
    setNewOrderCount(c => c + count);
    if (!ringIntervalRef.current) {
      ringIntervalRef.current = setInterval(playRingtone, 2_000);
    }
  }, []);

  const load = useCallback(() =>
    Promise.resolve()
      .then(() => fetch('/api/orders'))
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: any[]) => {
        const data = Array.isArray(d) ? d : [];
        setOrders(data);
        setLoading(false);

        // Orders that need the admin's attention
        const needsAction = data.filter(o =>
          o.status === 'pending' || o.paymentStatus === 'authorized'
        );

        if (isFirstLoad.current) {
          data.forEach(o => seenOrderIds.current.add(o._id));
          isFirstLoad.current = false;
          if (needsAction.length > 0) startRing(needsAction.length);
          return;
        }

        // New orders that arrived since last poll
        const brandNew = needsAction.filter(o => !seenOrderIds.current.has(o._id));
        data.forEach(o => seenOrderIds.current.add(o._id));

        if (brandNew.length > 0) {
          startRing(brandNew.length);
          brandNew.forEach(o => silentPrint(o));
        } else if (needsAction.length === 0) {
          stopRing();
        }
      })
      .catch(() => setLoading(false)),
  [startRing, stopRing]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    fetch('/api/settings').then(r => r.json()).then(d => { if (typeof d.dineInEnabled === 'boolean') setDineInEnabled(d.dineInEnabled); });
    return () => { clearInterval(interval); stopRing(); };
  }, [load, stopRing]);

  const toggleDineIn = async () => {
    setTogglingDineIn(true);
    const next = !dineInEnabled;
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dineInEnabled: next }) });
    setDineInEnabled(next);
    setTogglingDineIn(false);
    toast.success(next ? 'Dine-in orders enabled' : 'Dine-in orders paused');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (payFilter    !== 'all' && o.paymentStatus !== payFilter) return false;
      if (dateFrom && new Date(o.createdAt) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(o.createdAt) > new Date(dateTo + 'T23:59:59')) return false;
      if (q && !o.customerName?.toLowerCase().includes(q) && !o.customerEmail?.toLowerCase().includes(q) && !o.customerPhone?.includes(q) && !o._id.includes(q)) return false;
      return true;
    });
  }, [orders, search, statusFilter, payFilter, dateFrom, dateTo]);

  const filteredRevenue = filtered.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total || 0), 0);
  const pendingCount    = orders.filter(o => o.paymentStatus === 'authorized').length;

  const update = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
    setUpdating(null);
  };

  const capture = async (orderId: string, action: 'accept' | 'reject') => {
    setCapturing(orderId);
    try {
      const order = orders.find(o => o._id === orderId);
      const res   = await fetch('/api/payments/capture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, action }) });
      const data  = await res.json();
      if (res.ok) {
        if (action === 'accept') {
          toast.success('Order accepted — payment captured!');
          if (order) printReceipt(order);
        } else {
          toast.success('Order rejected — payment released.');
        }
        load();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error — try again');
    }
    setCapturing(null);
  };

  const inp: React.CSSProperties = {
    background: 'white', border: '1px solid var(--stone-light)', borderRadius: '8px',
    padding: '7px 10px', fontSize: '13px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Poppins, sans-serif',
  };

  return (
    <div>
      {/* ── New-order alert banner ─────────────────────────────── */}
      {alertActive && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderRadius: '14px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BellRing size={22} color="white" style={{ animation: 'ring-bell 0.5s ease-in-out infinite alternate', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>
              {newOrderCount} new order{newOrderCount !== 1 ? 's' : ''} need attention!
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
              Ringing every 20 seconds until all pending orders are handled.
            </div>
          </div>
          <button
            onClick={stopRing}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: 'white', borderRadius: '9px', padding: '7px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Orders</h1>
            {pendingCount > 0 && (
              <span style={{ background: '#f97316', color: 'white', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px', animation: 'pulse-badge 1.4s ease-in-out infinite' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginTop: '2px' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== orders.length && ` (${orders.length} total)`}
            {filteredRevenue > 0 && <> · Revenue: <strong style={{ color: '#22c55e' }}>${filteredRevenue.toFixed(2)} AUD</strong></>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Dine-in toggle */}
          <button
            onClick={toggleDineIn}
            disabled={togglingDineIn}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: dineInEnabled ? '#dcfce7' : '#fee2e2',
              border: `1.5px solid ${dineInEnabled ? '#16a34a' : '#dc2626'}`,
              borderRadius: '10px', padding: '8px 14px',
              cursor: togglingDineIn ? 'wait' : 'pointer',
              fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600,
              color: dineInEnabled ? '#15803d' : '#dc2626',
              transition: 'all 0.2s',
              opacity: togglingDineIn ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '15px' }}>🍽️</span>
            Dine-in
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '34px', height: '18px', borderRadius: '9px',
              background: dineInEnabled ? '#16a34a' : '#dc2626',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', width: '12px', height: '12px', borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                left: dineInEnabled ? '18px' : '4px',
              }} />
            </span>
            {dineInEnabled ? 'ON' : 'OFF'}
          </button>

          <button onClick={() => downloadCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '16px 18px', border: '1px solid var(--stone-light)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
          <Filter size={13} color="var(--brown-mid)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-mid)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Name, email, phone, ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, width: '100%', paddingLeft: '28px', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inp}>
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
          <select value={payFilter} onChange={e => setPayFilter(e.target.value)} style={inp}>
            <option value="all">All Payments</option>
            <option value="authorized">Authorized</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
          <span style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />
          {(search || statusFilter !== 'all' || payFilter !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setPayFilter('all'); setDateFrom(''); setDateTo(''); }}
              style={{ background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--brown-mid)', fontFamily: 'Poppins, sans-serif' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--brown-mid)' }}>Loading orders…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)' }}>
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </div>
          ) : filtered.map(o => (
            <OrderCard
              key={o._id}
              o={o}
              updating={updating}
              capturing={capturing}
              onUpdate={update}
              onCapture={capture}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          50%       { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(249,115,22,0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        @keyframes ring-bell {
          from { transform: rotate(-22deg); }
          to   { transform: rotate(22deg); }
        }
      `}</style>
    </div>
  );
}
