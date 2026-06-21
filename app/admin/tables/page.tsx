'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
export default function AdminTablesPage() {
  const [tables, setTables] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const load = () => fetch('/api/tables').then(r=>r.json()).then(d=>{setTables(Array.isArray(d)?d:[]); setLoading(false);});
  useEffect(()=>{load();},[]);
  const add = async () => {
    const num = prompt('Table number?'); if (!num) return;
    const cap = prompt('Capacity (2/4/6/8)?'); if (!cap) return;
    const floor = prompt('Floor (Ground/Upper/Outdoor)?') || 'Ground';
    await fetch('/api/tables',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tableNumber:parseInt(num),capacity:parseInt(cap),floor})});
    toast.success('Table added'); load();
  };
  const remove = async (id:string) => { if(!confirm('Delete table?')) return; await fetch(`/api/tables/${id}`,{method:'DELETE'}); toast.success('Deleted'); load(); };
  const toggleActive = async (t:any) => { await fetch(`/api/tables/${t._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isActive:!t.isActive})}); load(); };
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div><h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--brown-dark)' }}>Tables</h1><p style={{ fontSize:'13px', color:'var(--brown-mid)' }}>{tables.length} tables</p></div>
        <button onClick={add} style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--red-korean)', color:'white', border:'none', borderRadius:'12px', padding:'10px 18px', cursor:'pointer', fontFamily:'Poppins, sans-serif', fontSize:'13px', fontWeight:600 }}><Plus size={14}/>Add Table</button>
      </div>
      {loading?<p style={{color:'var(--brown-mid)'}}>Loading…</p>:(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'12px' }}>
          {tables.map(t=>(
            <div key={t._id} style={{ background:'white', borderRadius:'14px', padding:'16px', border:`2px solid ${t.isActive?'var(--stone-light)':'rgba(239,68,68,0.2)'}`, position:'relative', opacity:t.isActive?1:0.6 }}>
              <div className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--red-korean)', lineHeight:1 }}>T{t.tableNumber}</div>
              <div style={{ fontSize:'12px', color:'var(--brown-mid)', marginTop:'4px' }}>{t.floor}</div>
              <div style={{ fontSize:'12px', color:'var(--brown-mid)' }}>Seats {t.capacity}</div>
              <div style={{ display:'flex', gap:'6px', marginTop:'10px' }}>
                <button onClick={()=>toggleActive(t)} style={{ flex:1, padding:'5px', borderRadius:'7px', border:'1px solid var(--stone-light)', background:t.isActive?'#f0fdf4':'#fef2f2', color:t.isActive?'#16a34a':'#dc2626', fontSize:'11px', cursor:'pointer', fontFamily:'Poppins, sans-serif' }}>{t.isActive?'Active':'Off'}</button>
                <button onClick={()=>remove(t._id)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', cursor:'pointer' }}><Trash2 size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
