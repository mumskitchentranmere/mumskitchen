'use client';
import { useEffect, useState, useMemo } from 'react';
import { Clock, Phone, Mail, Search, Download, Filter, Check, X, Printer, ChevronDown, ChevronUp } from 'lucide-react';
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

// ── Receipt printer ───────────────────────────────────────────────────────────
// Opens a formatted 80mm receipt in a popup and triggers the system print
// dialog. Works with any printer connected to the OS (USB, network, etc.)
// including the Star TSP100III — no drivers or apps needed.
function printReceipt(order: any) {
  const typeLabel = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
  const time = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const id   = order._id.slice(-6).toUpperCase();

  const itemRows = (order.items || []).map((i: any) =>
    `<tr><td class="b">${i.quantity}&times; ${i.name}</td><td class="r">$${(i.price * i.quantity).toFixed(2)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt #${id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',Courier,monospace;font-size:13px;width:72mm;padding:3mm}
.c{text-align:center}.b{font-weight:bold}.r{text-align:right}
.xl{font-size:18px;font-weight:bold}.lg{font-size:15px;font-weight:bold}
hr{border:none;border-top:1px dashed #000;margin:5px 0}
table{width:100%;border-collapse:collapse}
td{padding:2px 0;vertical-align:top}
.footer{margin-top:8px}
@media print{@page{size:80mm auto;margin:0}body{padding:3mm;width:72mm}}
</style></head>
<body>
<div class="c xl">MUM'S KITCHEN</div>
<div class="c">Tranmere SA 5073</div>
<hr>
<div class="c b">ORDER #${id}</div>
<div class="c">${date}&nbsp;&nbsp;${time}</div>
<hr>
<div class="c lg">${typeLabel}</div>
<div>Customer: <b>${order.customerName}</b></div>
${order.customerPhone ? `<div>Phone: ${order.customerPhone}</div>` : ''}
${order.pickupTime     ? `<div>Pickup: ${order.pickupTime}</div>`  : ''}
${order.deliveryAddress ? `<div>Address: ${order.deliveryAddress}</div>` : ''}
<hr>
<table>${itemRows}</table>
<hr>
${order.subtotal != null && order.deliveryFee ? `
<table>
  <tr><td>Subtotal</td><td class="r">$${(order.subtotal||0).toFixed(2)}</td></tr>
  <tr><td>Delivery</td><td class="r">$${(order.deliveryFee||0).toFixed(2)}</td></tr>
</table>
<hr>` : ''}
<table><tr><td class="b lg">TOTAL</td><td class="r b lg">$${(order.total||0).toFixed(2)} AUD</td></tr></table>
<hr>
${order.specialInstructions ? `<div class="b">SPECIAL INSTRUCTIONS:</div><div>${order.specialInstructions}</div><hr>` : ''}
<div class="c footer">Thank you!</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const w = window.open('', '_blank', 'width=380,height=600,left=100,top=80');
  if (!w) {
    toast.error('Allow popups for this site to enable printing.');
    return;
  }
  w.document.write(html);
  w.document.close();
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--brown-mid)', background: 'var(--stone-light)', padding: '2px 7px', borderRadius: '5px' }}>
                #{o._id.slice(-6).toUpperCase()}
              </span>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: 600, background: SC[o.status] + '20', color: SC[o.status], textTransform: 'capitalize' }}>
                {o.status}
              </span>
              <span style={{ fontSize: '11px', background: 'var(--stone-light)', color: 'var(--brown-mid)', padding: '2px 8px', borderRadius: '8px', textTransform: 'capitalize' }}>
                {o.orderType === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
              </span>
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
            // Prevent cancelling a paid/confirmed order accidentally
            const isCancelLocked = s === 'cancelled' && isPaid;
            return (
              <button
                key={s}
                onClick={() => onUpdate(o._id, s)}
                disabled={updating === o._id || isCancelLocked}
                title={isCancelLocked ? 'Cannot cancel a paid order' : undefined}
                style={{
                  padding: '5px 11px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: o.status === s ? SC[s] : isCancelLocked ? '#e5e7eb' : 'var(--stone-light)',
                  background: o.status === s ? SC[s] + '20' : 'white',
                  color: o.status === s ? SC[s] : isCancelLocked ? '#d1d5db' : 'var(--brown-mid)',
                  fontSize: '11px', fontWeight: o.status === s ? 700 : 400,
                  cursor: (updating === o._id || isCancelLocked) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins, sans-serif', textTransform: 'capitalize',
                  opacity: updating === o._id && o.status !== s ? 0.5 : 1,
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

  const load = () =>
    fetch('/api/orders').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

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
        <button onClick={() => downloadCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 500 }}>
          <Download size={13} /> Export CSV
        </button>
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
      `}</style>
    </div>
  );
}
