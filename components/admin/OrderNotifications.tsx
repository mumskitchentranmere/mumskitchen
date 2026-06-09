'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, X, ChefHat } from 'lucide-react';

type IncomingOrder = {
  _id: string;
  customerName: string;
  orderType: string;
  total: number;
  items: { name: string; quantity: number }[];
};

function playOrderSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    // Uber Eats-style double-chime
    const pairs = [[880, 0], [1100, 0.13], [880, 0.28], [1320, 0.4]];
    pairs.forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const s = t + delay;
      gain.gain.setValueAtTime(0, s);
      gain.gain.linearRampToValueAtTime(0.4, s + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, s + 0.22);
      osc.start(s);
      osc.stop(s + 0.25);
    });
  } catch {}
}

export function OrderNotifications() {
  const [queue,   setQueue]   = useState<IncomingOrder[]>([]);
  const [visible, setVisible] = useState<IncomingOrder | null>(null);
  const router    = useRouter();
  const pathname  = usePathname();
  const esRef     = useRef<EventSource | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/orders/stream');
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_order' && Array.isArray(msg.orders)) {
          const incoming: IncomingOrder[] = msg.orders;
          playOrderSound();
          setQueue(q => [...q, ...incoming]);
          setVisible(incoming[0]);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setVisible(null), 10_000);
        }
      } catch {}
    };

    es.onerror = () => {};

    return () => {
      es.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(null);
  };

  const goToOrders = () => {
    dismiss();
    setQueue([]);
    router.push('/admin/orders');
  };

  const unread = queue.length;

  return (
    <>
      {/* Floating badge — bottom-left when not on orders page */}
      {unread > 0 && pathname !== '/admin/orders' && (
        <button
          onClick={goToOrders}
          style={{
            position: 'fixed', bottom: '24px', left: '16px',
            zIndex: 60,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--red-korean)', color: 'white',
            border: 'none', borderRadius: '14px',
            padding: '11px 18px', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700,
            boxShadow: '0 4px 24px rgba(192,57,43,0.55)',
            animation: 'notif-pulse 1.4s ease-in-out infinite',
          }}
        >
          <ShoppingBag size={16} />
          {unread} new order{unread > 1 ? 's' : ''}
          <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '8px', padding: '1px 7px', fontSize: '12px' }}>{unread}</span>
        </button>
      )}

      {/* Toast notification card */}
      {visible && (
        <div
          style={{
            position: 'fixed', bottom: '80px', left: '16px',
            zIndex: 61,
            background: 'white',
            borderRadius: '18px',
            width: '300px',
            boxShadow: '0 12px 40px rgba(44,26,14,0.22)',
            fontFamily: 'Outfit, sans-serif',
            animation: 'slide-in-left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            overflow: 'hidden',
          }}
        >
          {/* Coloured header */}
          <div style={{ background: 'linear-gradient(135deg, var(--brown-dark), var(--brown-mid))', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 1s ease-in-out infinite', flexShrink: 0 }} />
              <ChefHat size={15} color="var(--gold)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', letterSpacing: '0.02em' }}>New Order!</span>
            </div>
            <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: '0', display: 'flex', lineHeight: 1 }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '3px' }}>
              {visible.customerName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{visible.orderType === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}</span>
              <span style={{ fontWeight: 700, color: 'var(--red-korean)' }}>${visible.total?.toFixed(2)} AUD</span>
            </div>

            {/* Item list */}
            <div style={{ background: '#f9f5f0', borderRadius: '10px', padding: '8px 10px', marginBottom: '12px', fontSize: '12px', color: 'var(--brown-dark)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(visible.items || []).slice(0, 4).map((item, i) => (
                <span key={i}>{item.quantity}× {item.name}</span>
              ))}
              {(visible.items || []).length > 4 && <span style={{ color: 'var(--brown-mid)' }}>+{visible.items.length - 4} more…</span>}
            </div>

            <button
              onClick={goToOrders}
              style={{ width: '100%', background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '11px', padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <ShoppingBag size={14} /> View &amp; Confirm →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(192,57,43,0.55); }
          50%       { transform: scale(1.04); box-shadow: 0 4px 32px rgba(192,57,43,0.75); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes slide-in-left {
          from { transform: translateX(-110%) scale(0.92); opacity: 0; }
          to   { transform: translateX(0) scale(1);     opacity: 1; }
        }
      `}</style>
    </>
  );
}
