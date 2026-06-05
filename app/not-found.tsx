import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: '68px', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '80px', marginBottom: '8px' }}>🍜</div>
        <h1 className="font-display" style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 700, color: 'var(--red-korean)', lineHeight: 1, marginBottom: '16px' }}>404</h1>
        <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '12px' }}>Page Not Found</h2>
        <p style={{ fontSize: '15px', color: 'var(--brown-mid)', marginBottom: '32px', lineHeight: 1.6 }}>
          Looks like this dish isn't on our menu. The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ background: 'var(--brown-dark)', color: 'white', padding: '13px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Go Home
          </Link>
          <Link href="/order" style={{ background: 'var(--red-korean)', color: 'white', padding: '13px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}
