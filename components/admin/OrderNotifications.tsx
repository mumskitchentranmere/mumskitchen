'use client';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// Plays three ascending tones using the Web Audio API — no external file needed.
// AudioContext is created lazily and resumed each call to satisfy browser
// autoplay policy (requires at least one prior user interaction on the page).
function playOrderAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const ding = (freq: number, start: number, dur: number) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.5, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };

    const t = ctx.currentTime;
    ding(523.25, t,        0.45);   // C5
    ding(659.25, t + 0.22, 0.45);   // E5
    ding(783.99, t + 0.44, 0.65);   // G5
  } catch {}
}

export function OrderNotifications() {
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let active = true;

    const connect = () => {
      if (!active) return;
      es = new EventSource('/api/orders/stream');

      es.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'new_order' && Array.isArray(data.orders)) {
            playOrderAlert();
            for (const order of data.orders) {
              toast(
                `New order from ${order.customerName} — $${Number(order.total).toFixed(2)} AUD`,
                {
                  icon: '🔔',
                  duration: 8000,
                  style: { fontFamily: 'Poppins, sans-serif', fontWeight: 600 },
                }
              );
            }
          }
        } catch {}
      });

      es.onerror = () => {
        es?.close();
        es = null;
        if (active) {
          retryRef.current = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      active = false;
      es?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  return null;
}
