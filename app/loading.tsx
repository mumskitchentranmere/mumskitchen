export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '68px', fontFamily: 'Outfit, sans-serif', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--red-korean)', animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--brown-mid)', letterSpacing: '0.05em' }}>Loading…</p>
      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); opacity: 0.4; }
          to   { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
