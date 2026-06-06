'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en-AU">
      <body style={{ margin: 0, background: '#FAF7F2', fontFamily: 'Outfit, Arial, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#2C1A0E', marginBottom: '10px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#6B3A1F', marginBottom: '10px', lineHeight: 1.6 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: '11px', color: '#A0522D', fontFamily: 'monospace', marginBottom: '24px' }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{ background: '#C0392B', color: 'white', padding: '12px 26px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ background: '#2C1A0E', color: 'white', padding: '12px 26px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}
            >
              Go Home
            </a>
          </div>
          <p style={{ fontSize: '13px', color: '#A0522D', marginTop: '20px' }}>
            Need help? Call{' '}
            <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202'}`} style={{ color: '#C0392B', fontWeight: 600, textDecoration: 'none' }}>
              {process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202'}
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
