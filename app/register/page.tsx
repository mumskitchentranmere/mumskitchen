'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(form.password)) { toast.error('Password must contain at least one uppercase letter'); return; }
    if (!/[0-9]/.test(form.password)) { toast.error('Password must contain at least one number'); return; }
    setLoading(true);
    const r = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error); setLoading(false); return; }
    toast.success('Account created!'); router.push('/login');
  };
  const inp: React.CSSProperties = { width:'100%', background:'white', border:'1.5px solid var(--stone-light)', borderRadius:'12px', padding:'12px 16px', fontSize:'14px', color:'var(--brown-dark)', outline:'none', fontFamily:'Poppins, sans-serif', boxSizing:'border-box' };
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'52px', height:'52px', background:'var(--red-korean)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><ChefHat size={26} color="white" /></div>
          <h1 className="font-display" style={{ fontSize:'32px', fontWeight:700, color:'var(--brown-dark)' }}>Create Account</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ background:'white', borderRadius:'20px', padding:'32px', border:'1px solid var(--stone-light)' }}>
          {([['Full Name','name','text','John Smith'],['Email','email','email','you@example.com'],['Phone (optional)','phone','tel','+61 4XX XXX XXX'],['Password','password','password','Min. 8 chars, uppercase & number']] as [string,string,string,string][]).map(([label,field,type,ph])=>(
            <div key={field} style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'6px' }}>{label}</label>
              <input type={type} required={field!=='phone'} value={(form as any)[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={ph} style={inp} />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{ width:'100%', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:loading?'wait':'pointer', fontFamily:'Poppins, sans-serif', marginTop:'8px' }}>{loading?'Creating…':'Create Account'}</button>
          <p style={{ textAlign:'center', fontSize:'13px', color:'var(--brown-mid)', marginTop:'16px' }}>Already registered? <Link href="/login" style={{ color:'var(--red-korean)', textDecoration:'none', fontWeight:500 }}>Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
