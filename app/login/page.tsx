'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      router.replace(role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await signIn('credentials', { email, password, redirect: false });
    if (r?.error) { toast.error('Invalid email or password'); setLoading(false); return; }
    toast.success('Welcome back!');
    // router.push handled by useEffect above
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const inp: React.CSSProperties = { width: '100%', background: 'white', border: '1.5px solid var(--stone-light)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: 'var(--brown-dark)', outline: 'none', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' };

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--brown-mid)', fontSize: '14px' }}>Loading…</div>
    </div>
  );

  if (status === 'authenticated') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--red-korean)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ChefHat size={26} color="white" />
          </div>
          <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brown-dark)' }}>Welcome Back</h1>
          <p style={{ fontSize: '14px', color: 'var(--brown-mid)', marginTop: '6px' }}>Sign in to Mum's Kitchen</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', border: '1px solid var(--stone-light)', boxShadow: '0 4px 24px rgba(44,26,14,0.06)' }}>

          {/* Google Sign In */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
            <>
              <button onClick={handleGoogle} disabled={googleLoading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 500, cursor: googleLoading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', marginBottom: '20px' }}>
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--stone-light)' }} />
                <span style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>or sign in with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--stone-light)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="you@example.com" />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, paddingRight: '42px' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--brown-mid)', marginTop: '16px' }}>
            No account? <Link href="/register" style={{ color: 'var(--red-korean)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
