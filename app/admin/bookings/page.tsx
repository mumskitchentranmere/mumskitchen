'use client';
import { useEffect, useState } from 'react';
const SC: Record<string,string> = { pending:'#f59e0b',confirmed:'#3b82f6',cancelled:'#ef4444',completed:'#22c55e','no-show':'#9ca3af' };
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = () => fetch('/api/bookings').then(r=>r.json()).then(d=>{setBookings(Array.isArray(d)?d:[]); setLoading(false);});
  useEffect(()=>{load();},[]);
  const update = async (id: string, status: string) => { await fetch(`/api/bookings/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status }) }); load(); };
  return (
    <div>
      <div style={{ marginBottom:'24px' }}><h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--brown-dark)' }}>Bookings</h1><p style={{ fontSize:'13px', color:'var(--brown-mid)' }}>{bookings.length} total bookings</p></div>
      {loading?<p style={{color:'var(--brown-mid)'}}>Loading…</p>:(
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {bookings.length===0?<div style={{ background:'white', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1px solid var(--stone-light)', color:'var(--brown-mid)' }}>No bookings yet</div>
          :bookings.map(b=>(
            <div key={b._id} style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--brown-dark)' }}>{b.customerName}</div>
                <div style={{ fontSize:'12px', color:'var(--brown-mid)' }}>{b.customerEmail} · {b.customerPhone}</div>
                <div style={{ fontSize:'13px', color:'var(--brown-dark)', marginTop:'4px' }}>Table {b.tableNumber} · {b.date} at {b.time} · {b.partySize} guests</div>
                {b.specialRequests&&<div style={{ fontSize:'11px', color:'var(--brown-mid)', marginTop:'2px' }}>Note: {b.specialRequests}</div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'8px', fontWeight:600, background:SC[b.status]+'20', color:SC[b.status] }}>{b.status}</span>
                {['confirmed','completed','cancelled','no-show'].map(s=><button key={s} onClick={()=>update(b._id,s)} style={{ padding:'4px 10px', borderRadius:'7px', border:'1px solid var(--stone-light)', background:b.status===s?'var(--stone-light)':'white', color:'var(--brown-mid)', fontSize:'11px', cursor:'pointer', fontFamily:'Poppins, sans-serif', textTransform:'capitalize' }}>{s}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
