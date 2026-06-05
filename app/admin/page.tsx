'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, CheckCircle, AlertCircle, Clock, ShoppingBag, Calendar, UtensilsCrossed, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats]         = useState<any>({});
  const [eposStatus, setEposStatus] = useState<any>(null);
  const [syncing, setSyncing]     = useState(false);
  const [loading, setLoading]     = useState(true);

  const loadStats = async () => {
    try {
      const [ordersRes, bookingsRes, menuRes, eposRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/bookings'),
        fetch('/api/menu'),
        fetch('/api/epos/sync'),
      ]);
      const [orders, bookings, menu] = await Promise.all([ordersRes.json(), bookingsRes.json(), menuRes.json()]);
      const epos = eposRes.ok ? await eposRes.json() : null;
      const revenue = Array.isArray(orders) ? orders.filter((o:any) => o.paymentStatus === 'paid').reduce((s:number,o:any) => s + (o.total||0), 0) : 0;
      setStats({ orders: Array.isArray(orders) ? orders.length : 0, bookings: Array.isArray(bookings) ? bookings.length : 0, menu: Array.isArray(menu) ? menu.length : 0, revenue, recentOrders: Array.isArray(orders) ? orders.slice(0,5) : [] });
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

  const SC: Record<string,string> = { pending:'#f59e0b',confirmed:'#3b82f6',preparing:'#f97316',ready:'#22c55e',delivered:'#22c55e',cancelled:'#ef4444' };

  const cards = [
    { label:'Total Orders',    value: stats.orders,   color:'#3b82f6', icon: ShoppingBag },
    { label:'Total Bookings',  value: stats.bookings, color:'#22c55e', icon: Calendar },
    { label:'Menu Items',      value: stats.menu,     color:'#ec4899', icon: UtensilsCrossed },
    { label:'Revenue (Paid)',  value: `$${(stats.revenue||0).toFixed(2)}`, color:'#a855f7', icon: Star },
  ];

  return (
    <div>
      <div style={{ marginBottom:'28px' }}>
        <h1 className="font-display" style={{ fontSize:'32px', fontWeight:700, color:'var(--brown-dark)' }}>Dashboard</h1>
        <p style={{ fontSize:'13px', color:'var(--brown-mid)' }}>Mum's Kitchen — Tranmere SA</p>
      </div>

      {/* Epos Now Sync Panel */}
      <div style={{ background:'white', borderRadius:'16px', padding:'20px', border:'1px solid var(--stone-light)', marginBottom:'24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ fontSize:'15px', fontWeight:600, color:'var(--brown-dark)', marginBottom:'4px', display:'flex', alignItems:'center', gap:'6px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: eposStatus?.syncedProductCount > 0 ? '#22c55e' : '#f59e0b' }} />
              Epos Now Sync
            </h2>
            {eposStatus ? (
              <p style={{ fontSize:'12px', color:'var(--brown-mid)' }}>
                {eposStatus.syncedProductCount} products synced
                {eposStatus.lastSyncedAt && ` · Last sync: ${new Date(eposStatus.lastSyncedAt).toLocaleString('en-AU')}`}
              </p>
            ) : (
              <p style={{ fontSize:'12px', color:'var(--brown-mid)' }}>Add EPOSNOW_API_TOKEN to .env.local to enable sync</p>
            )}
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={syncEpos} disabled={syncing} style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'10px', padding:'9px 18px', cursor:syncing?'wait':'pointer', fontSize:'13px', fontWeight:500, fontFamily:'Outfit, sans-serif', opacity:syncing?0.7:1 }}>
              <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
            <button onClick={seedDB} style={{ background:'var(--stone-light)', color:'var(--brown-dark)', border:'none', borderRadius:'10px', padding:'9px 14px', cursor:'pointer', fontSize:'12px', fontFamily:'Outfit, sans-serif' }}>
              Seed Menu
            </button>
          </div>
        </div>
        <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fffbeb', borderRadius:'10px', fontSize:'12px', color:'#92400e', border:'1px solid #fde68a' }}>
          💡 Sync pulls product names, prices and availability from Epos Now. Descriptions, images and tags you set here are never overwritten.
        </div>
      </div>

      {/* Stat cards */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'14px', marginBottom:'28px' }}>
          {cards.map(c => (
            <div key={c.label} style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)' }}>
              <div style={{ fontSize:'11px', color:'var(--brown-mid)', marginBottom:'6px' }}>{c.label}</div>
              <div className="font-display" style={{ fontSize:'28px', fontWeight:700, color:c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent orders */}
      <div style={{ background:'white', borderRadius:'16px', padding:'20px', border:'1px solid var(--stone-light)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:600, color:'var(--brown-dark)' }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ fontSize:'12px', color:'var(--red-korean)', textDecoration:'none' }}>View all →</Link>
        </div>
        {stats.recentOrders?.length === 0 ? (
          <p style={{ color:'var(--brown-mid)', fontSize:'13px' }}>No orders yet</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {stats.recentOrders?.map((o:any) => (
              <div key={o._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--stone-light)', fontSize:'13px' }}>
                <span style={{ color:'var(--brown-mid)', fontFamily:'monospace' }}>#{o._id?.slice(-6).toUpperCase()}</span>
                <span style={{ color:'var(--brown-dark)' }}>{o.customerName}</span>
                <span style={{ textTransform:'capitalize', color:'var(--brown-mid)' }}>{o.orderType}</span>
                <span style={{ background:SC[o.status]+'20', color:SC[o.status], padding:'2px 8px', borderRadius:'8px', fontWeight:600 }}>{o.status}</span>
                <span className="font-display" style={{ fontWeight:700, color:'var(--red-korean)' }}>${o.total?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
