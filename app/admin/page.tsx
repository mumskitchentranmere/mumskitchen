'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ShoppingBag, UtensilsCrossed, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b', confirmed: '#3b82f6', preparing: '#f97316',
  ready:     '#22c55e', delivered: '#16a34a', cancelled:  '#ef4444',
};

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px', paddingBottom: '0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '9px', color: 'var(--brown-mid)', fontWeight: 600, opacity: d.value > 0 ? 1 : 0.4 }}>
            {d.value > 0 ? `$${d.value >= 100 ? (d.value / 100).toFixed(0) + 'h' : d.value.toFixed(0)}` : ''}
          </div>
          <div
            style={{
              width: '100%', borderRadius: '5px 5px 0 0',
              height: `${Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0)}px`,
              background: d.value > 0 ? 'var(--red-korean)' : 'var(--stone-light)',
              minHeight: '2px', transition: 'height 0.3s',
            }}
          />
          <div style={{ fontSize: '9px', color: 'var(--brown-mid)', whiteSpace: 'nowrap', textAlign: 'center' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function getDailyRevenue(orders: any[]) {
  const days: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[d.toISOString().split('T')[0]] = 0;
  }
  orders.filter(o => o.paymentStatus === 'paid').forEach(o => {
    const d = new Date(o.createdAt).toISOString().split('T')[0];
    if (d in days) days[d] += o.total || 0;
  });
  return Object.entries(days).map(([date, revenue]) => ({
    label: new Date(date + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }).replace(' ', '\n'),
    value: Math.round(revenue * 100) / 100,
  }));
}

function getTopItems(orders: any[]) {
  const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.filter(o => o.paymentStatus === 'paid').forEach(o => {
    (o.items || []).forEach((item: any) => {
      if (!counts[item.name]) counts[item.name] = { name: item.name, qty: 0, revenue: 0 };
      counts[item.name].qty += item.quantity || 0;
      counts[item.name].revenue += (item.price || 0) * (item.quantity || 0);
    });
  });
  return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
}

function getStatusBreakdown(orders: any[]) {
  const counts: Record<string, number> = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  return counts;
}

function getRevenuePeriods(orders: any[]) {
  const paid = orders.filter(o => o.paymentStatus === 'paid');
  const now = new Date();
  const startOf = (daysAgo: number) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(0,0,0,0); return d; };
  const sum = (from: Date) => paid.filter(o => new Date(o.createdAt) >= from).reduce((s, o) => s + (o.total || 0), 0);
  return { today: sum(startOf(0)), week: sum(startOf(7)), month: sum(startOf(30)), all: paid.reduce((s, o) => s + (o.total || 0), 0) };
}

export default function AdminDashboard() {
  const [orders,     setOrders]     = useState<any[]>([]);
  const [menuCount,  setMenuCount]  = useState(0);
  const [eposStatus, setEposStatus] = useState<any>(null);
  const [syncing,    setSyncing]    = useState(false);
  const [loading,    setLoading]    = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, eposRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/menu'),
        fetch('/api/epos/sync'),
      ]);
      if (!ordersRes.ok || !menuRes.ok) throw new Error('Failed to load dashboard data');
      const [ordersData, menuData] = await Promise.all([ordersRes.json(), menuRes.json()]);
      const epos = eposRes.ok ? await eposRes.json() : null;
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMenuCount(Array.isArray(menuData) ? menuData.length : 0);
      setEposStatus(epos);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const syncEpos = async () => {
    setSyncing(true);
    try {
      const res  = await fetch('/api/epos/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); loadStats(); }
      else toast.error(data.error || 'Sync failed');
    } catch { toast.error('Sync failed — check Epos Now token'); }
    setSyncing(false);
  };

  const seedDB = async () => {
    if (!confirm('This will reset all menu items. Are you sure?')) return;
    const res  = await fetch('/api/seed', { method: 'POST' });
    const data = await res.json();
    toast.success(data.message || 'Seeded!');
    loadStats();
  };

  const dailyRevenue = getDailyRevenue(orders);
  const topItems     = getTopItems(orders);
  const statusCounts = getStatusBreakdown(orders);
  const periods      = getRevenuePeriods(orders);
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const summaryCards = [
    { label: 'Total Orders',   value: orders.length,             color: '#3b82f6' },
    { label: 'Menu Items',     value: menuCount,                  color: '#ec4899' },
    { label: 'Today Revenue',  value: `$${periods.today.toFixed(2)}`,  color: '#f97316' },
    { label: 'All-time Sales', value: `$${periods.all.toFixed(2)}`,    color: '#a855f7' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brown-dark)' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>Mum's Kitchen — Tranmere SA</p>
      </div>

      {/* Epos Now Sync */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: eposStatus?.syncedProductCount > 0 ? '#22c55e' : '#f59e0b' }} />
              Epos Now Sync
            </h2>
            {eposStatus ? (
              <p style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>
                {eposStatus.syncedProductCount} products synced
                {eposStatus.lastSyncedAt && ` · Last sync: ${new Date(eposStatus.lastSyncedAt).toLocaleString('en-AU')}`}
              </p>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>Add EPOSNOW_API_TOKEN to .env.local to enable sync</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={syncEpos} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 18px', cursor: syncing ? 'wait' : 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'Outfit, sans-serif', opacity: syncing ? 0.7 : 1 }}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button onClick={seedDB} style={{ background: 'var(--stone-light)', color: 'var(--brown-dark)', border: 'none', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif' }}>
              Seed Menu
            </button>
          </div>
        </div>
        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fffbeb', borderRadius: '10px', fontSize: '12px', color: '#92400e', border: '1px solid #fde68a' }}>
          💡 Sync pulls product names, prices and availability from Epos Now. Descriptions, images and tags you set here are never overwritten. Online orders are automatically pushed to Epos Now POS after payment — your kitchen printer will receive a docket.
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid var(--stone-light)' }}>
            <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginBottom: '6px' }}>{c.label}</div>
            <div className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: c.color }}>{loading ? '…' : c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue periods */}
      <div className="admin-grid-3">
        {[
          { label: 'This Week',  value: periods.week },
          { label: 'This Month', value: periods.month },
          { label: 'All Time',   value: periods.all },
        ].map(p => (
          <div key={p.label} style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '1px solid var(--stone-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DollarSign size={20} color="#a855f7" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{p.label}</div>
              <div className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: '#a855f7' }}>{loading ? '…' : `$${p.value.toFixed(2)}`}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid-2-1">
        {/* Revenue chart — last 14 days */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="var(--red-korean)" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)' }}>Revenue — Last 14 Days</h2>
          </div>
          {loading ? <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-mid)', fontSize: '13px' }}>Loading…</div>
            : <BarChart data={dailyRevenue.map(d => ({ label: d.label, value: d.value }))} />}
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--brown-mid)', textAlign: 'right' }}>
            Total (14d): <strong style={{ color: 'var(--red-korean)' }}>${dailyRevenue.reduce((s, d) => s + d.value, 0).toFixed(2)} AUD</strong>
          </div>
        </div>

        {/* Orders by status */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '14px' }}>Orders by Status</h2>
          {loading ? <p style={{ color: 'var(--brown-mid)', fontSize: '13px' }}>Loading…</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[status] || '#6b7280', flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--brown-dark)', textTransform: 'capitalize' }}>{status}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: STATUS_COLORS[status] || '#6b7280', background: (STATUS_COLORS[status] || '#6b7280') + '15', padding: '2px 8px', borderRadius: '8px' }}>{count}</span>
                </div>
              ))}
              {Object.keys(statusCounts).length === 0 && <p style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>No orders yet</p>}
            </div>
          )}
        </div>
      </div>

      {/* Top items + Recent orders */}
      <div className="admin-grid-2">
        {/* Top items */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <UtensilsCrossed size={16} color="var(--red-korean)" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)' }}>Top 5 Items (by qty)</h2>
          </div>
          {loading ? <p style={{ color: 'var(--brown-mid)', fontSize: '13px' }}>Loading…</p>
            : topItems.length === 0 ? <p style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>No paid orders yet</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topItems.map((item, i) => {
                  const pct = Math.round((item.qty / topItems[0].qty) * 100);
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--brown-dark)', fontWeight: 500, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '10px', color: 'var(--brown-mid)', marginRight: '5px' }}>#{i + 1}</span>{item.name}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>{item.qty} sold · <span style={{ color: '#22c55e', fontWeight: 600 }}>${item.revenue.toFixed(0)}</span></span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--stone-light)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--red-korean)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Recent orders */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={16} color="var(--red-korean)" />
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)' }}>Recent Orders</h2>
            </div>
            <Link href="/admin/orders" style={{ fontSize: '12px', color: 'var(--red-korean)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {loading ? <p style={{ color: 'var(--brown-mid)', fontSize: '13px' }}>Loading…</p>
            : recentOrders.length === 0 ? <p style={{ color: 'var(--brown-mid)', fontSize: '13px' }}>No orders yet</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recentOrders.map(o => (
                  <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--stone-light)', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--brown-mid)', fontFamily: 'monospace', fontSize: '11px' }}>#{o._id?.slice(-6).toUpperCase()}</span>
                      <div style={{ color: 'var(--brown-dark)', fontWeight: 500, fontSize: '12px' }}>{o.customerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ background: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status], padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, textTransform: 'capitalize', marginBottom: '2px' }}>{o.status}</div>
                      <div className="font-display" style={{ fontWeight: 700, color: 'var(--red-korean)', fontSize: '13px' }}>${o.total?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
