'use client';
import { useEffect, useState, useMemo } from 'react';
import { Clock, Phone, Search, Download, Filter } from 'lucide-react';

const ALL_STATUSES = ['pending','confirmed','preparing','ready','out-for-delivery','delivered','cancelled'];
const SC: Record<string,string> = {
  pending:'#f59e0b', confirmed:'#3b82f6', preparing:'#f97316',
  ready:'#22c55e', 'out-for-delivery':'#8b5cf6', delivered:'#16a34a', cancelled:'#ef4444',
};

function downloadCSV(orders: any[]) {
  const header = ['Order ID','Date','Customer','Phone','Email','Status','Payment','Type','Items','Total (AUD)','Pickup Time','Instructions'];
  const rows = orders.map(o => [
    o._id.slice(-6).toUpperCase(),
    new Date(o.createdAt).toLocaleString('en-AU'),
    o.customerName,
    o.customerPhone || '',
    o.customerEmail || '',
    o.status,
    o.paymentStatus,
    o.orderType,
    (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join('; '),
    (o.total || 0).toFixed(2),
    o.pickupTime || '',
    o.specialInstructions || '',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const [orders,      setOrders]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payFilter,   setPayFilter]   = useState('all');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [updating,    setUpdating]    = useState<string | null>(null);

  const load = () => {
    fetch('/api/orders').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

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

  const update = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
    setUpdating(null);
  };

  const inp: React.CSSProperties = {
    background: 'white', border: '1px solid var(--stone-light)', borderRadius: '8px',
    padding: '7px 10px', fontSize: '13px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Outfit, sans-serif',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Orders</h1>
          <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''} shown
            {filtered.length !== orders.length && ` (${orders.length} total)`}
            {filteredRevenue > 0 && ` · Revenue: `}
            {filteredRevenue > 0 && <strong style={{ color: '#22c55e' }}>${filteredRevenue.toFixed(2)} AUD</strong>}
          </p>
        </div>
        <button
          onClick={() => downloadCSV(filtered)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '16px 18px', border: '1px solid var(--stone-light)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Filter size={13} color="var(--brown-mid)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-mid)' }} />
            <input
              type="text" placeholder="Name, email, phone, order ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inp, width: '100%', paddingLeft: '28px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inp}>
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Payment */}
          <select value={payFilter} onChange={e => setPayFilter(e.target.value)} style={inp}>
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Date range */}
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
          <span style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />

          {(search || statusFilter !== 'all' || payFilter !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); setPayFilter('all'); setDateFrom(''); setDateTo(''); }}
              style={{ background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--brown-mid)', fontFamily: 'Outfit, sans-serif' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Orders list */}
      {loading ? <p style={{ color: 'var(--brown-mid)' }}>Loading…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', padding: '48px', textAlign: 'center', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)' }}>
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </div>
          ) : filtered.map(o => (
            <div key={o._id} style={{ background: 'white', borderRadius: '14px', padding: '18px', border: '1px solid var(--stone-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--brown-mid)', marginBottom: '2px' }}>#{o._id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)' }}>{o.customerName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--brown-mid)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Phone size={11} />{o.customerPhone}
                    {o.customerEmail && <span>· {o.customerEmail}</span>}
                    <Clock size={11} />
                    {new Date(o.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  {o.pickupTime && <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '2px' }}>🕐 Pickup: {o.pickupTime}</div>}
                  {o.specialInstructions && <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '2px', fontStyle: 'italic' }}>"{o.specialInstructions}"</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', background: 'var(--stone-light)', color: 'var(--brown-mid)', padding: '3px 8px', borderRadius: '8px', textTransform: 'capitalize' }}>{o.orderType}</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, background: SC[o.status] + '20', color: SC[o.status], textTransform: 'capitalize' }}>{o.status}</span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, background: o.paymentStatus === 'paid' ? '#dcfce7' : '#fef2f2', color: o.paymentStatus === 'paid' ? '#16a34a' : '#ef4444' }}>
                    {o.paymentStatus === 'paid' ? '✓ Paid' : o.paymentStatus}
                  </span>
                  <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${o.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ background: '#f9f5f0', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px' }}>
                {o.items?.map((item: any, i: number) => (
                  <div key={i} style={{ color: 'var(--brown-dark)', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {item.name}</span>
                    <span style={{ color: 'var(--brown-mid)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Status buttons */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {ALL_STATUSES.map(s => (
                  <button key={s} onClick={() => update(o._id, s)}
                    disabled={updating === o._id}
                    style={{ padding: '5px 11px', borderRadius: '8px', border: '1.5px solid', borderColor: o.status === s ? SC[s] : 'var(--stone-light)', background: o.status === s ? SC[s] + '20' : 'white', color: o.status === s ? SC[s] : 'var(--brown-mid)', fontSize: '11px', fontWeight: 500, cursor: updating === o._id ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', textTransform: 'capitalize', opacity: updating === o._id && o.status !== s ? 0.6 : 1 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
