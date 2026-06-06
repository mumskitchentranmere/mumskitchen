'use client';
import { useState } from 'react';
import { Phone, MapPin, Clock, Mail, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' }); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) { setSent(true); toast.success('Message sent!'); } else { toast.error('Failed to send message. Please call or email us directly.'); }
    setLoading(false);
  };
  const inp: React.CSSProperties = { width:'100%', background:'white', border:'1.5px solid var(--stone-light)', borderRadius:'12px', padding:'11px 14px', fontSize:'14px', color:'var(--brown-dark)', outline:'none', fontFamily:'Outfit, sans-serif', boxSizing:'border-box' };
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', paddingTop:'68px' }}>
      <div style={{ background:'var(--brown-dark)', padding:'56px 24px', textAlign:'center' }}>
        <h1 className="font-display" style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:700, color:'white', marginBottom:'8px' }}>Get in Touch</h1>
        <p style={{ fontSize:'15px', color:'rgba(232,224,213,0.6)' }}>We'd love to hear from you</p>
      </div>
      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'48px 24px' }}>
        <div className="contact-grid">
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`} style={{ display:'flex', alignItems:'center', gap:'14px', background:'var(--red-korean)', color:'white', borderRadius:'16px', padding:'18px 20px', textDecoration:'none' }}>
              <div style={{ width:'40px', height:'40px', background:'rgba(255,255,255,0.15)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Phone size={20}/></div>
              <div><div style={{ fontWeight:600, fontSize:'15px' }}>Call Us Now</div><div style={{ fontSize:'13px', opacity:0.8 }}>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE}</div></div>
            </a>
            {[
              { icon:<MapPin size={18}/>, label:'Address', body:'66 Reid Avenue\nTranmere SA 5073' },
              { icon:<Mail size={18}/>, label:'Email', body:'mumskitchentranmere@gmail.com' },
            ].map(c=>(
              <div key={c.label} style={{ display:'flex', gap:'14px', background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)' }}>
                <div style={{ width:'36px', height:'36px', background:'#fdf0ee', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--red-korean)' }}>{c.icon}</div>
                <div><div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--brown-mid)', marginBottom:'4px' }}>{c.label}</div><div style={{ fontSize:'13px', color:'var(--brown-dark)', whiteSpace:'pre-line' }}>{c.body}</div></div>
              </div>
            ))}
            <div style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)' }}>
              <div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}><div style={{ width:'36px', height:'36px', background:'#fdf0ee', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--red-korean)', flexShrink:0 }}><Clock size={18}/></div><div style={{ fontSize:'11px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--brown-mid)', paddingTop:'10px' }}>Hours</div></div>
              {[['Monday','Closed'],['Tue – Thu','5:00 pm – 10:00 pm'],['Fri – Sun','10:00 am – 3:00 pm, 5:00 pm – 10:00 pm']].map(([d,h])=>(
                <div key={d} style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'4px 0', borderBottom:'1px solid var(--stone-light)' }}>
                  <span style={{ color:'var(--brown-mid)' }}>{d}</span><span style={{ fontWeight:500, color:'var(--brown-dark)' }}>{h}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            {sent?<div style={{ background:'white', borderRadius:'16px', padding:'48px', textAlign:'center', border:'1px solid var(--stone-light)', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:'56px', height:'56px', background:'#e8f5e9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'16px' }}><CheckCircle size={28} color="#2e7d32"/></div>
              <h2 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--brown-dark)', marginBottom:'8px' }}>Message Sent!</h2>
              <p style={{ color:'var(--brown-mid)', marginBottom:'20px' }}>We'll get back to you within 24 hours.</p>
              <button onClick={()=>{setSent(false);setForm({name:'',email:'',phone:'',message:''})} } style={{ background:'var(--stone-light)', border:'none', borderRadius:'10px', padding:'10px 20px', cursor:'pointer', fontSize:'13px', fontFamily:'Outfit, sans-serif' }}>Send Another</button>
            </div>:(
              <form onSubmit={handleSubmit} style={{ background:'white', borderRadius:'16px', padding:'28px', border:'1px solid var(--stone-light)' }}>
                <h2 className="font-display" style={{ fontSize:'24px', fontWeight:600, color:'var(--brown-dark)', marginBottom:'20px' }}>Send Us a Message</h2>
                <div className="contact-name-email">
                  {([['Your Name *','name','text'],['Email *','email','email']] as [string,string,string][]).map(([l,f,t])=>(
                    <div key={f}><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>{l}</label><input type={t} required value={(form as any)[f]} onChange={e=>setForm(ff=>({...ff,[f]:e.target.value}))} style={inp}/></div>
                  ))}
                </div>
                <div style={{ marginBottom:'14px' }}><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Phone</label><input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={inp}/></div>
                <div style={{ marginBottom:'20px' }}><label style={{ fontSize:'12px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'5px' }}>Message *</label><textarea required rows={5} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} style={{...inp,resize:'none'}} placeholder="How can we help?"/></div>
                <button type="submit" disabled={loading} style={{ width:'100%', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:loading?'wait':'pointer', fontFamily:'Outfit, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <Send size={16}/>{loading?'Sending…':'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
