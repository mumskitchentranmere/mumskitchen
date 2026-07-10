'use client';
import { useEffect, useState } from 'react';

const FALLBACK = [
  { day: 'Monday',             hrs: 'Closed' },
  { day: 'Tuesday – Thursday', hrs: '5:00 pm – 10:00 pm' },
  { day: 'Friday – Sunday',    hrs: '10:00 am – 3:00 pm  ·  5:00 pm – 10:00 pm' },
];

export function FooterHours() {
  const [rows, setRows] = useState(FALLBACK);

  useEffect(() => {
    fetch('/api/places')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // weekday_text from Google starts Monday: ["Monday: ...", "Tuesday: ...", ..., "Sunday: ..."]
        const texts: string[] | undefined = data?.opening_hours?.weekday_text;
        if (!texts?.length) return;

        const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const parsed = texts.map((t, i) => ({
          day: DAY_NAMES[i],
          hrs: t.replace(/^[^:]+:\s*/, ''),
        }));

        // Group consecutive days that share the same hours text
        const grouped: { day: string; hrs: string }[] = [];
        let i = 0;
        while (i < parsed.length) {
          let j = i;
          while (j + 1 < parsed.length && parsed[j + 1].hrs === parsed[i].hrs) j++;
          grouped.push({
            day: j > i ? `${parsed[i].day} – ${parsed[j].day}` : parsed[i].day,
            hrs: parsed[i].hrs,
          });
          i = j + 1;
        }
        setRows(grouped);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {rows.map(({ day, hrs }) => (
        <div key={day} style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(232,224,213,0.65)', marginBottom: '2px' }}>{day}</div>
          <div style={{ fontSize: '13px', color: hrs === 'Closed' ? 'rgba(232,224,213,0.6)' : 'rgba(232,224,213,0.9)', fontWeight: 500 }}>{hrs}</div>
        </div>
      ))}
    </>
  );
}
