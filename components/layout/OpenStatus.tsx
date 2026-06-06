'use client';
import { useEffect, useState } from 'react';

const HOURS: Record<number, { open: number; close: number } | null> = {
  0: { open: 12 * 60,       close: 21 * 60 },       // Sun  12:00pm – 9:00pm
  1: { open: 11 * 60 + 30,  close: 21 * 60 + 30 },  // Mon  11:30am – 9:30pm
  2: { open: 11 * 60 + 30,  close: 21 * 60 + 30 },  // Tue
  3: { open: 11 * 60 + 30,  close: 21 * 60 + 30 },  // Wed
  4: { open: 11 * 60 + 30,  close: 21 * 60 + 30 },  // Thu
  5: { open: 11 * 60 + 30,  close: 22 * 60 + 30 },  // Fri  11:30am – 10:30pm
  6: { open: 11 * 60 + 30,  close: 22 * 60 + 30 },  // Sat
};

export function OpenStatus() {
  const [status, setStatus] = useState<'open' | 'closed' | null>(null);
  const [label, setLabel]   = useState('');

  useEffect(() => {
    const check = () => {
      const now     = new Date();
      const day     = now.getDay();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const h       = HOURS[day];

      if (!h) { setStatus('closed'); setLabel('Closed today'); return; }

      if (minutes >= h.open && minutes < h.close) {
        const minsLeft = h.close - minutes;
        if (minsLeft <= 60) {
          setLabel(`Closes in ${minsLeft} min`);
        } else {
          const closeH = Math.floor(h.close / 60);
          const closeM = h.close % 60;
          const ampm   = closeH >= 12 ? 'pm' : 'am';
          const h12    = closeH > 12 ? closeH - 12 : closeH;
          setLabel(`Open · Closes ${h12}${closeM ? `:${String(closeM).padStart(2,'0')}` : ''}${ampm}`);
        }
        setStatus('open');
      } else {
        // Find next open day
        for (let i = 1; i <= 7; i++) {
          const nextDay = (day + i) % 7;
          const next    = HOURS[nextDay];
          if (next) {
            const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][nextDay];
            const openH   = Math.floor(next.open / 60);
            const openM   = next.open % 60;
            const ampm    = openH >= 12 ? 'pm' : 'am';
            const h12     = openH > 12 ? openH - 12 : openH;
            setLabel(i === 1
              ? `Closed · Opens ${h12}${openM ? `:${String(openM).padStart(2,'0')}` : ''}${ampm} tomorrow`
              : `Closed · Opens ${dayName} ${h12}${openM ? `:${String(openM).padStart(2,'0')}` : ''}${ampm}`);
            break;
          }
        }
        setStatus('closed');
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status) return null;

  return (
    <div style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '6px',
      marginTop:    '12px',
      padding:      '5px 10px',
      borderRadius: '20px',
      background:   status === 'open' ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)',
      border:       `1px solid ${status === 'open' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
    }}>
      <span style={{
        width:        '7px',
        height:       '7px',
        borderRadius: '50%',
        background:   status === 'open' ? '#16a34a' : '#dc2626',
        flexShrink:   0,
      }} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: status === 'open' ? '#4ade80' : '#f87171' }}>
        {label}
      </span>
    </div>
  );
}
