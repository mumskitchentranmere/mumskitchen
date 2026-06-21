'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', paddingTop: '68px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '64px', marginBottom: '8px' }}>⚠️</div>
        <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '12px' }}>Something went wrong</h1>
        <p style={{ fontSize: '15px', color: 'var(--brown-mid)', marginBottom: '10px', lineHeight: 1.6 }}>
          We hit an unexpected error. Please try again — if the problem persists, give us a call.
        </p>
        {error.digest && (
          <p style={{ fontSize: '11px', color: 'var(--brown-mid)', fontFamily: 'monospace', marginBottom: '28px' }}>
            Error ID: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{ background: 'var(--red-korean)', color: 'white', padding: '13px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
            Try Again
          </button>
          <a href="/" style={{ background: 'var(--brown-dark)', color: 'white', padding: '13px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Go Home
          </a>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginTop: '24px' }}>
          Need help? Call <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202'}`} style={{ color: 'var(--red-korean)', fontWeight: 600, textDecoration: 'none' }}>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202'}</a>
        </p>
      </div>
    </div>
  );
}
