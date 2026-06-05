'use client';
import { useState, useEffect, useCallback } from 'react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { StarRating } from '@/components/reviews/StarRating';
import { PenLine, Filter, SortDesc, ChevronLeft, ChevronRight } from 'lucide-react';

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
