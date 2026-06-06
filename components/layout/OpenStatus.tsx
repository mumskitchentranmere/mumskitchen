'use client';
import { useEffect, useState } from 'react';

// Fallback hours — array per day supports split lunch/dinner sessions
// day 0=Sun … 6=Sat, times in minutes from midnight
const FALLBACK: Record<number, { open: number; close: number }[]> = {
  0: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }], // Sun  10am–3pm · 5–10pm
  1: [],                                                               // Mon  Closed
  2: [{ open: 17*60, close: 22*60 }],                                 // Tue  5–10pm
  3: [{ open: 17*60, close: 22*60 }],                                 // Wed
  4: [{ open: 17*60, close: 22*60 }],                                 // Thu
  5: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }], // Fri  10am–3pm · 5–10pm
  6: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }], // Sat
};

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`;
}

function periodsToMap(periods: any[]): Record<number, { open: number; close: number }[]> {
  const map: Record<number, { open: number; close: number }[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
  };
  for (const p of periods) {
    const day = p.open?.day;
    if (day == null) continue;
    const ot = p.open?.time  ?? '0000';
    const ct = p.close?.time ?? '2359';
    map[day].push({
      open:  parseInt(ot.slice(0, 2)) * 60 + parseInt(ot.slice(2)),
      close: parseInt(ct.slice(0, 2)) * 60 + parseInt(ct.slice(2)),
    });
  }
  for (const day of Object.values(map)) day.sort((a, b) => a.open - b.open);
  return map;
}

function computeStatus(hours: Record<number, { open: number; close: number }[]>) {
  const now     = new Date();
  const day     = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today   = hours[day] ?? [];

  // Currently inside a session?
  for (const s of today) {
    if (minutes >= s.open && minutes < s.close) {
      const left  = s.close - minutes;
      const label = left <= 60
        ? `Open · Closes in ${left} min`
        : `Open · Closes ${fmt(s.close)}`;
      return { status: 'open' as const, label };
    }
  }

  // Later session today?
  const later = today.find(s => s.open > minutes);
  if (later) {
    return { status: 'closed' as const, label: `Closed · Opens ${fmt(later.open)} today` };
  }

  // Next open day
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 1; i <= 7; i++) {
    const next = hours[(day + i) % 7];
    if (next?.length) {
      const name = DAYS[(day + i) % 7];
      const label = i === 1
        ? `Closed · Opens ${fmt(next[0].open)} tomorrow`
        : `Closed · Opens ${name} ${fmt(next[0].open)}`;
      return { status: 'closed' as const, label };
    }
  }
  return { status: 'closed' as const, label: 'Closed today' };
}

export function OpenStatus() {
  const [status, setStatus] = useState<'open' | 'closed' | null>(null);
  const [label,  setLabel]  = useState('');

  useEffect(() => {
    let hours = FALLBACK;
    let id: ReturnType<typeof setInterval>;

    const tick = () => {
      const { status, label } = computeStatus(hours);
      setStatus(status);
      setLabel(label);
    };

    fetch('/api/places')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.opening_hours?.periods?.length) {
          hours = periodsToMap(data.opening_hours.periods);
        }
        tick();
        id = setInterval(tick, 60_000);
      })
      .catch(() => { tick(); id = setInterval(tick, 60_000); });

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
        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
        background: status === 'open' ? '#16a34a' : '#dc2626',
      }} />
      <span style={{ fontSize: '12px', fontWeight: 600, color: status === 'open' ? '#4ade80' : '#f87171' }}>
        {label}
      </span>
    </div>
  );
}
