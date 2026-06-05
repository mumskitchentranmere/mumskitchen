'use client';
import { useState } from 'react';
import { StarRating } from './StarRating';
import { ThumbsUp, ShieldCheck, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface ReviewCardProps {
  review: any;
  showDishName?: boolean;
  onHelpful?: (id: string) => void;
}

export function ReviewCard({ review, showDishName = false, onHelpful }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulVotes || 0);
  const isLong = review.body?.length > 200;
  const displayBody = isLong && !expanded ? review.body.slice(0, 200) + '…' : review.body;

  const handleHelpful = async () => {
    setHelpfulClicked(!helpfulClicked);
    setHelpfulCount((c: number) => helpfulClicked ? c - 1 : c + 1);
    try {
      await fetch(`/api/reviews/${review._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'helpful' }),
      });
    } catch {}
    onHelpful?.(review._id);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(44,26,14,0.08)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${review.customerName.charCodeAt(0) * 7 % 360},50%,45%)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
            {review.customerName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)' }}>{review.customerName}</span>
              {review.verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#16a34a', background: '#f0fdf4', padding: '2px 7px', borderRadius: '8px', fontWeight: 500 }}>
                  <ShieldCheck size={10} /> Verified
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>{timeAgo(review.createdAt)}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <StarRating rating={review.rating} size={14} />
          {showDishName && review.menuItemName && (
            <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginTop: '3px' }}>re: {review.menuItemName}</div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '8px' }}>{review.title}</h4>

      {/* Body */}
      <p style={{ fontSize: '13px', color: 'var(--brown-mid)', lineHeight: 1.7, marginBottom: '10px' }}>{displayBody}</p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--red-korean)', fontSize: '12px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '10px' }}>
          {expanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Read more</>}
        </button>
      )}

      {/* Tags */}
      {review.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
          {review.tags.map((tag: string) => (
            <span key={tag} style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '10px', background: '#faf7f2', border: '1px solid var(--stone-light)', color: 'var(--brown-mid)', fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Review images */}
      {review.images?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {review.images.map((url: string, i: number) => (
            <img key={i} src={url} alt="" style={{ width: '72px', height: '72px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--stone-light)' }} />
          ))}
        </div>
      )}

      {/* Admin reply */}
      {review.adminReply && (
        <div style={{ background: '#faf7f2', borderLeft: '3px solid var(--gold)', borderRadius: '0 10px 10px 0', padding: '12px 14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brown-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mum's Kitchen Reply</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--brown-dark)', lineHeight: 1.6 }}>{review.adminReply}</p>
        </div>
      )}

      {/* Footer — helpful */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--stone-light)' }}>
        <button onClick={handleHelpful} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: helpfulClicked ? '#fdf0ee' : 'none', border: `1px solid ${helpfulClicked ? 'var(--red-korean)' : 'var(--stone-light)'}`, borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Outfit, sans-serif', color: helpfulClicked ? 'var(--red-korean)' : 'var(--brown-mid)', transition: 'all 0.15s' }}>
          <ThumbsUp size={13} fill={helpfulClicked ? 'currentColor' : 'none'} />
          Helpful {helpfulCount > 0 && `(${helpfulCount})`}
        </button>
        {review.featured && (
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gold)', background: '#fff8e6', padding: '3px 8px', borderRadius: '8px', border: '1px solid #fde68a' }}>⭐ Featured</span>
        )}
      </div>
    </div>
  );
}
