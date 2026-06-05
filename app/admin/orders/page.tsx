'use client';
import { useEffect, useState } from 'react';
import { Clock, Phone } from 'lucide-react';
const STATUS = ['pending','confirmed','preparing','ready','out-for-delivery','delivered','cancelled'];
const SC: Record<string,string> = { pending:'#f59e0b',confirmed:'#3b82f6',preparing:'#f97316',ready:'#22c55e','out-for-delivery':'#8b5cf6',delivered:'#16a34a',cancelled:'#ef4444' };
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = () => fetch('/api/orders').then(r=>r.json()).then(d=>{setOrders(Array.isArray(d)?d:[]); setLoading(false);});
  useEffect(()=>{load();},[]);
  const update = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status }) }); load();
  };
  return (
    <div>
      <div style={{ marginBottom:'24px' }}><h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--brown-dark)' }}>Orders</h1><p style={{ fontSize:'13px', color:'var(--brown-mid)' }}>{orders.length} total orders</p></div>
      {loading?<p style={{color:'var(--brown-mid)'}}>Loading…</p>:(
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {orders.length===0?<div style={{ background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid var(--stone-light)', color:'var(--brown-mid)' }}>No orders yet</div>
          :orders.map(o=>(
            <div key={o._id} style={{ background:'white', borderRadius:'14px', padding:'18px', border:'1px solid var(--stone-light)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'10px', marginBottom:'12px' }}>
                <div>
                  <div style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:600, color:'var(--brown-mid)', marginBottom:'2px' }}>#{o._id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize:'15px', fontWeight:600, color:'var(--brown-dark)' }}>{o.customerName}</div>
                  <div style={{ fontSize:'12px', color:'var(--brown-mid)', display:'flex', alignItems:'center', gap:'4px' }}><Phone size={11}/>{o.customerPhone} · <Clock size={11}/>{new Date(o.createdAt).toLocaleString('en-AU',{dateStyle:'short',timeStyle:'short'})}</div>
                  {o.deliveryAddress&&<div style={{ fontSize:'12px', color:'var(--brown-mid)', marginTop:'2px' }}>📍 {o.deliveryAddress}</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'11px', background:'var(--stone-light)', color:'var(--brown-mid)', padding:'3px 8px', borderRadius:'8px', textTransform:'capitalize' }}>{o.orderType}</span>
                  <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'8px', fontWeight:600, background:SC[o.status]+'20', color:SC[o.status] }}>{o.status}</span>
                  <span className="font-display" style={{ fontSize:'20px', fontWeight:700, color:'var(--red-korean)' }}>${o.total?.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ background:'#f9f5f0', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', fontSize:'12px' }}>
                {o.items?.map((item: any, i: number) => <div key={i} style={{ color:'var(--brown-dark)', padding:'2px 0' }}>{item.quantity}× {item.name} — ${(item.price*item.quantity).toFixed(2)}</div>)}
              </div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {STATUS.map(s=><button key={s} onClick={()=>update(o._id,s)} style={{ padding:'5px 12px', borderRadius:'8px', border:'1.5px solid', borderColor:o.status===s?SC[s]:'var(--stone-light)', background:o.status===s?SC[s]+'20':'white', color:o.status===s?SC[s]:'var(--brown-mid)', fontSize:'11px', fontWeight:500, cursor:'pointer', fontFamily:'Outfit, sans-serif', textTransform:'capitalize' }}>{s}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
