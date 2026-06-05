'use client';

interface StarRatingProps {
  rating: number;      // e.g. 4.3
  max?: number;        // default 5
  size?: number;       // px
  showNumber?: boolean;
  count?: number;
}

export function StarRating({ rating, max = 5, size = 16, showNumber = false, count }: StarRatingProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: max }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i)); // 0, 0.5, or 1
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <defs>
                <linearGradient id={`star-${i}-${size}`}>
                  <stop offset={`${fill * 100}%`} stopColor="#C8922A" />
                  <stop offset={`${fill * 100}%`} stopColor="#E8E0D5" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={`url(#star-${i}-${size})`}
                stroke="#C8922A"
                strokeWidth="1"
              />
            </svg>
          );
        })}
      </div>
      {showNumber && (
        <span style={{ fontSize: size * 0.875, fontWeight: 600, color: 'var(--brown-dark)' }}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span style={{ fontSize: size * 0.75, color: 'var(--brown-mid)' }}>
          ({count})
        </span>
      )}
    </div>
  );
}

// Interactive star picker for writing reviews
interface StarPickerProps {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}

export function StarPicker({ value, onChange, size = 32 }: StarPickerProps) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.1s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
        >
          <svg width={size} height={size} viewBox="0 0 24 24">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={star <= value ? '#C8922A' : '#E8E0D5'}
              stroke={star <= value ? '#C8922A' : '#D0C8C0'}
              strokeWidth="1"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
