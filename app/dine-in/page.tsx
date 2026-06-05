'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
const SLOTS = ['11:30','12:00','12:30','13:00','13:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00'];
const DEPOSIT_PP = 10;
export default function DineInPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1); const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [partySize, setPartySize] = useState(2);
  const [tables, setTables] = useState<any[]>([]); const [sel, setSel] = useState<any>(null); const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: session?.user?.name||'', email: session?.user?.email||'', phone:'', requests:'' });
  const deposit = partySize * DEPOSIT_PP;
  const today = new Date().toISOString().split('T')[0];
  const inp: React.CSSProperties = { width:'100%', background:'white', border:'1.5px solid var(--stone-light)', borderRadius:'12px', padding:'11px 14px', fontSize:'14px', color:'var(--brown-dark)', outline:'none', fontFamily:'Outfit, sans-serif', boxSizing:'border-box' };
  const search = async () => {
    if (!date||!time) { toast.error('Please select date and time'); return; }
    setLoading(true);
    const r = await fetch(`/api/tables?date=${date}&time=${time}&partySize=${partySize}`);
    setTables(await r.json()); setStep(2); setLoading(false);
  };
  const confirm = async () => {
    if (!sel) { toast.error('Please select a table'); return; }
    if (!form.name||!form.email||!form.phone) { toast.error('Please fill all contact fields'); return; }
    setLoading(true);
    const r = await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ customerName:form.name, customerEmail:form.email, customerPhone:form.phone, tableId:sel._id, tableNumber:sel.tableNumber, date, time, partySize, specialRequests:form.requests, depositAmount:deposit }) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error||'Booking failed'); setLoading(false); return; }
    toast.success('Booking confirmed!'); setStep(3); setLoading(false);
  };
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', paddingTop:'68px' }}>
      <div style={{ background:'var(--brown-dark)', padding:'56px 24px', textAlign:'center' }}>
        <h1 className="font-display" style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:700, color:'white', marginBottom:'8px' }}>Book a Table</h1>
        <p style={{ fontSize:'15px', color:'rgba(232,224,213,0.6)' }}>Reserve your table at Mum's Kitchen — 66 Reid Avenue, Tranmere</p>
      </div>
      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'40px 24px' }}>
        {/* Progress */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'36px' }}>
          {['Find Tables','Select Table','Confirmed'].map((s,i)=>(
            <div key={s} style={{ display:'flex', alignItems:'center', flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, background:step>i+1?'var(--gold)':step===i+1?'var(--red-korean)':'var(--stone-light)', color:step>=i+1?'white':'var(--brown-mid)', flexShrink:0 }}>{step>i+1?'✓':i+1}</div>
                <span style={{ fontSize:'12px', fontWeight:step===i+1?600:400, color:step===i+1?'var(--brown-dark)':'var(--brown-mid)', whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i<2&&<div style={{ flex:1, height:'1px', background:step>i+1?'var(--gold)':'var(--stone-light)', margin:'0 8px' }} />}
            </div>
          ))}
        </div>

        {step===1&&(
          <div style={{ background:'white', borderRadius:'20px', padding:'28px', border:'1px solid var(--stone-light)' }}>
            <h2 className="font-display" style={{ fontSize:'24px', fontWeight:600, color:'var(--brown-dark)', marginBottom:'24px' }}>When would you like to visit?</h2>
            <div style={{ marginBottom:'20px' }}><label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}><Calendar size={13}/>Date</label><input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} style={inp} /></div>
            <div style={{ marginBottom:'20px' }}><label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}><Clock size={13}/>Time</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>{SLOTS.map(t=><button key={t} onClick={()=>setTime(t)} style={{ padding:'8px 4px', borderRadius:'8px', border:'1.5px solid', borderColor:time===t?'var(--red-korean)':'var(--stone-light)', background:time===t?'var(--red-korean)':'white', color:time===t?'white':'var(--brown-mid)', fontSize:'12px', cursor:'pointer', fontFamily:'Outfit, sans-serif', fontWeight:time===t?600:400 }}>{t}</button>)}</div>
            </div>
            <div style={{ marginBottom:'24px' }}><label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'flex', alignItems:'center', gap:'5px', marginBottom:'8px' }}><Users size={13}/>Party Size</label>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <button onClick={()=>setPartySize(Math.max(1,partySize-1))} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'var(--stone-light)', border:'none', cursor:'pointer', fontSize:'18px', fontFamily:'Outfit, sans-serif' }}>-</button>
                <span style={{ fontSize:'24px', fontWeight:700, color:'var(--brown-dark)', minWidth:'30px', textAlign:'center' }}>{partySize}</span>
                <button onClick={()=>setPartySize(Math.min(12,partySize+1))} style={{ width:'36px', height:'36px', borderRadius:'10px', background:'var(--stone-light)', border:'none', cursor:'pointer', fontSize:'18px', fontFamily:'Outfit, sans-serif' }}>+</button>
                <span style={{ fontSize:'13px', color:'var(--brown-mid)' }}>guests · ${deposit} deposit</span>
              </div>
            </div>
            <button onClick={search} disabled={loading||!date||!time} style={{ width:'100%', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:loading||!date||!time?'not-allowed':'pointer', opacity:loading||!date||!time?0.6:1, fontFamily:'Outfit, sans-serif' }}>{loading?'Searching…':'Find Available Tables'}</button>
          </div>
        )}

        {step===2&&(
          <div>
            <button onClick={()=>setStep(1)} style={{ background:'none', border:'none', color:'var(--brown-mid)', fontSize:'13px', cursor:'pointer', marginBottom:'16px', fontFamily:'Outfit, sans-serif' }}>← Back</button>
            <h2 className="font-display" style={{ fontSize:'24px', fontWeight:600, color:'var(--brown-dark)', marginBottom:'6px' }}>Available Tables</h2>
            <p style={{ fontSize:'13px', color:'var(--brown-mid)', marginBottom:'20px' }}>{date} at {time} · {partySize} guests</p>
            {tables.length===0?<div style={{ background:'white', borderRadius:'16px', padding:'40px', textAlign:'center', border:'1px solid var(--stone-light)' }}><AlertCircle size={32} color="var(--brown-mid)" style={{ margin:'0 auto 12px' }} /><p style={{ color:'var(--brown-mid)' }}>No tables available for this slot. Please try another time.</p></div>
            :<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px' }}>
              {tables.map(t=><button key={t._id} onClick={()=>setSel(t)} style={{ padding:'16px', borderRadius:'14px', border:`2px solid ${sel?._id===t._id?'var(--red-korean)':'var(--stone-light)'}`, background:sel?._id===t._id?'#fdf0ee':'white', cursor:'pointer', textAlign:'left', fontFamily:'Outfit, sans-serif' }}>
                <div className="font-display" style={{ fontSize:'26px', fontWeight:700, color:'var(--red-korean)' }}>Table {t.tableNumber}</div>
                <div style={{ fontSize:'12px', color:'var(--brown-mid)', marginTop:'4px' }}>{t.floor} · Seats {t.capacity}</div>
                {sel?._id===t._id&&<CheckCircle size={16} color="var(--red-korean)" style={{ marginTop:'8px' }} />}
              </button>)}
            </div>}
            {sel&&<div style={{ background:'white', borderRadius:'16px', padding:'20px', border:'1px solid var(--stone-light)' }}>
              <h3 style={{ fontSize:'16px', fontWeight:600, color:'var(--brown-dark)', marginBottom:'16px' }}>Your Contact Details</h3>
              {([['Full Name *','name','text'],['Email *','email','email'],['Phone *','phone','tel']] as [string,string,string][]).map(([label,field,type])=>(
                <div key={field} style={{ marginBottom:'14px' }}><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>{label}</label><input type={type} value={(form as any)[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} style={inp} /></div>
              ))}
              <div style={{ marginBottom:'16px' }}><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Special Requests</label><textarea value={form.requests} onChange={e=>setForm(f=>({...f,requests:e.target.value}))} rows={2} style={{...inp, resize:'none'}} /></div>
              <button onClick={confirm} disabled={loading} style={{ width:'100%', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:loading?'wait':'pointer', fontFamily:'Outfit, sans-serif' }}>{loading?'Confirming…':`Confirm Booking (Table ${sel.tableNumber})`}</button>
            </div>}
          </div>
        )}

        {step===3&&(
          <div style={{ background:'white', borderRadius:'20px', padding:'48px 32px', textAlign:'center', border:'1px solid var(--stone-light)' }}>
            <div style={{ width:'60px', height:'60px', background:'#e8f5e9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}><CheckCircle size={30} color="#2e7d32" /></div>
            <h2 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'var(--brown-dark)', marginBottom:'8px' }}>Booking Confirmed!</h2>
            <p style={{ color:'var(--brown-mid)', marginBottom:'4px' }}>Table <strong>{sel?.tableNumber}</strong> is reserved for you</p>
            <p style={{ color:'var(--brown-mid)', marginBottom:'4px' }}>{date} at {time} · {partySize} guests</p>
            <p style={{ fontSize:'13px', color:'var(--brown-mid)', marginBottom:'32px' }}>Confirmation sent to {form.email}</p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center' }}>
              <a href="/" style={{ background:'var(--brown-dark)', color:'white', padding:'12px 24px', borderRadius:'12px', textDecoration:'none', fontSize:'14px', fontWeight:600 }}>Back to Home</a>
              <a href="/dashboard" style={{ background:'var(--stone-light)', color:'var(--brown-dark)', padding:'12px 24px', borderRadius:'12px', textDecoration:'none', fontSize:'14px', fontWeight:500 }}>My Bookings</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
