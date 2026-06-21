'use client';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

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
