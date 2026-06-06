'use client';
import { useState, useEffect, useCallback } from 'react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { StarRating } from '@/components/reviews/StarRating';
import { PenLine, Filter, SortDesc, ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest',  label: 'Lowest Rated' },
  { value: 'helpful', label: 'Most Helpful' },
];

export default function ReviewsPage() {
  const [data, setData]         = useState<any>({ reviews: [], stats: { avgRating: 0, total: 0, five: 0, four: 0, three: 0, two: 0, one: 0 }, pages: 1 });
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage]         = useState(1);
  const [filterRating, setFilterRating] = useState(0);  // 0 = all
  const [sort, setSort]         = useState('newest');
  const [googleData, setGoogleData] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'restaurant', page: String(page), limit: '8' });
      if (filterRating > 0) params.set('rating', String(filterRating));
      if (sort === 'highest') params.set('sort', 'rating_desc');
      if (sort === 'lowest')  params.set('sort', 'rating_asc');
      if (sort === 'helpful') params.set('sort', 'helpful_desc');
      const res  = await fetch(`/api/reviews?${params}`);
      const json = await res.json();
      setData({ ...json, reviews: json.reviews || [] });
    } catch { /* silent */ }
    setLoading(false);
  }, [page, filterRating, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/places').then(r => r.ok ? r.json() : null).then(d => {
      if (d && !d.error) setGoogleData(d);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      {/* Header */}
      <div style={{ background: 'var(--brown-dark)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Customer Reviews</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>What Our Guests Say</h1>
            {data.stats.total > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StarRating rating={data.stats.avgRating} size={20} showNumber count={data.stats.total} />
              </div>
            )}
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
            <PenLine size={16} /> Write a Review
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Rating summary */}
        {data.stats.total > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <RatingSummary stats={data.stats} />
          </div>
        )}

        {/* Filters + sort bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={13} color="var(--brown-mid)" />
            <span style={{ fontSize: '12px', color: 'var(--brown-mid)', fontWeight: 500 }}>Filter:</span>
          </div>
          {[0, 5, 4, 3, 2, 1].map(star => (
            <button key={star} onClick={() => { setFilterRating(star); setPage(1); }}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s', borderColor: filterRating === star ? 'var(--red-korean)' : 'var(--stone-light)', background: filterRating === star ? 'var(--red-korean)' : 'white', color: filterRating === star ? 'white' : 'var(--brown-mid)' }}>
              {star === 0 ? 'All' : `${star} ★`}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SortDesc size={13} color="var(--brown-mid)" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ background: 'white', border: '1px solid var(--stone-light)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: 'var(--brown-dark)', fontFamily: 'Outfit, sans-serif', outline: 'none', cursor: 'pointer' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Reviews grid */}
        {loading ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: '16px', height: '160px' }} />)}
          </div>
        ) : data.reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
            <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>No reviews yet</h3>
            <p style={{ color: 'var(--brown-mid)', marginBottom: '24px' }}>Be the first to share your experience!</p>
            <button onClick={() => setShowForm(true)} style={{ background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 28px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
              Write First Review
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {data.reviews.map((r: any) => <ReviewCard key={r._id} review={r} />)}
          </div>
        )}

        {/* Pagination */}
        {data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--stone-light)', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: data.pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1.5px solid', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', borderColor: page === i + 1 ? 'var(--red-korean)' : 'var(--stone-light)', background: page === i + 1 ? 'var(--red-korean)' : 'white', color: page === i + 1 ? 'white' : 'var(--brown-dark)' }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--stone-light)', background: 'white', cursor: page === data.pages ? 'not-allowed' : 'pointer', opacity: page === data.pages ? 0.4 : 1 }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Google Reviews section */}
      {googleData && googleData.reviews?.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 48px' }}>
          <div style={{ borderTop: '1px solid var(--stone-light)', paddingTop: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#4285f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>G</span>
                </div>
                <div>
                  <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '2px' }}>Google Reviews</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brown-dark)' }}>{googleData.rating?.toFixed(1)}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={13} fill={n <= Math.round(googleData.rating) ? '#f59e0b' : 'none'} color={n <= Math.round(googleData.rating) ? '#f59e0b' : '#d1d5db'} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>({googleData.user_ratings_total?.toLocaleString()} reviews)</span>
                  </div>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/place/?q=place_id:ChIJxX-fLjDJsGoR2Ss1GWbuWqcS`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#4285f4', textDecoration: 'none', padding: '8px 16px', border: '1.5px solid #4285f4', borderRadius: '10px', transition: 'all 0.2s' }}
              >
                View on Google <ExternalLink size={13} />
              </a>
            </div>

            {/* Google review cards */}
            <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {googleData.reviews.map((review: any, i: number) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '18px 20px', border: '1px solid var(--stone-light)', boxShadow: '0 1px 4px rgba(44,26,14,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <img src={review.profile_photo_url || '/logo.png'} alt={review.author_name} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brown-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.author_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{review.relative_time_description}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', flexShrink: 0 }}>
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={11} fill={n <= review.rating ? '#f59e0b' : 'none'} color={n <= review.rating ? '#f59e0b' : '#d1d5db'} />
                      ))}
                    </div>
                  </div>
                  {review.text && (
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--brown-mid)', margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                      {review.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Write review modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <ReviewForm type="restaurant" onSuccess={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
