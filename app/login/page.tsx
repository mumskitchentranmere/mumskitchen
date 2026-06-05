'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const r = await signIn('credentials', { email, password, redirect: false });
    if (r?.error) { toast.error('Invalid email or password'); setLoading(false); return; }
    toast.success('Welcome back!'); router.push('/dashboard'); router.refresh();
  };
  const inp: React.CSSProperties = { width:'100%', background:'white', border:'1.5px solid var(--stone-light)', borderRadius:'12px', padding:'12px 16px', fontSize:'14px', color:'var(--brown-dark)', outline:'none', fontFamily:'Outfit, sans-serif', boxSizing:'border-box' };
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'52px', height:'52px', background:'var(--red-korean)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><ChefHat size={26} color="white" /></div>
          <h1 className="font-display" style={{ fontSize:'32px', fontWeight:700, color:'var(--brown-dark)' }}>Welcome Back</h1>
          <p style={{ fontSize:'14px', color:'var(--brown-mid)', marginTop:'6px' }}>Sign in to Mum's Kitchen</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background:'white', borderRadius:'20px', padding:'32px', border:'1px solid var(--stone-light)', boxShadow:'0 4px 24px rgba(44,26,14,0.06)' }}>
          <div style={{ marginBottom:'18px' }}><label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'6px' }}>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} style={inp} placeholder="you@example.com" /></div>
          <div style={{ marginBottom:'24px' }}><label style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', display:'block', marginBottom:'6px' }}>Password</label>
            <div style={{ position:'relative' }}><input type={show?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)} style={{...inp, paddingRight:'42px'}} placeholder="••••••••" /><button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--brown-mid)' }}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'12px', padding:'14px', fontSize:'15px', fontWeight:600, cursor:loading?'wait':'pointer', fontFamily:'Outfit, sans-serif' }}>{loading?'Signing in…':'Sign In'}</button>
          <p style={{ textAlign:'center', fontSize:'13px', color:'var(--brown-mid)', marginTop:'16px' }}>No account? <Link href="/register" style={{ color:'var(--red-korean)', textDecoration:'none', fontWeight:500 }}>Create one</Link></p>
        </form>
      </div>
    </div>
  );
}
