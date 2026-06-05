'use client';
import { StarRating } from './StarRating';

interface RatingSummaryProps {
  stats: {
    avgRating: number;
    total: number;
    five: number; four: number; three: number; two: number; one: number;
  };
}

export function RatingSummary({ stats }: RatingSummaryProps) {
  const bars = [
    { label: '5 ★', count: stats.five,  color: '#22c55e' },
    { label: '4 ★', count: stats.four,  color: '#84cc16' },
    { label: '3 ★', count: stats.three, color: '#f59e0b' },
    { label: '2 ★', count: stats.two,   color: '#f97316' },
    { label: '1 ★', count: stats.one,   color: '#ef4444' },
  ];

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--stone-light)', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Big number */}
      <div style={{ textAlign: 'center', minWidth: '120px' }}>
        <div className="font-display" style={{ fontSize: '64px', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1 }}>
          {stats.total > 0 ? stats.avgRating.toFixed(1) : '–'}
        </div>
        <StarRating rating={stats.avgRating} size={18} />
        <div style={{ fontSize: '13px', color: 'var(--brown-mid)', marginTop: '6px' }}>
          {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Bar breakdown */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        {bars.map(bar => {
          const pct = stats.total > 0 ? (bar.count / stats.total) * 100 : 0;
          return (
            <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--brown-mid)', minWidth: '28px', textAlign: 'right' }}>{bar.label}</span>
              <div style={{ flex: 1, height: '8px', background: 'var(--stone-light)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: bar.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--brown-mid)', minWidth: '20px' }}>{bar.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
