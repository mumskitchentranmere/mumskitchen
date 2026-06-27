'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { Plus, ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import toast from 'react-hot-toast';

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  halal:         { bg: '#dcfce7', color: '#15803d' },
  vegan:         { bg: '#dcfce7', color: '#166534' },
  vegetarian:    { bg: '#d1fae5', color: '#065f46' },
  spicy:         { bg: '#fee2e2', color: '#b91c1c' },
  'gluten-free': { bg: '#dbeafe', color: '#1d4ed8' },
};

const FALLBACK = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600';

export function MenuCard({ item, discount = 0 }: { item: any; discount?: number }) {
  const addItem = useCartStore(s => s.addItem);
  const [imgIndex,     setImgIndex]     = useState(0);
  const [selectedSize, setSelectedSize] = useState<any>(item.sizes?.[0] || null);
  const [showReview,   setShowReview]   = useState(false);
  const [adding,       setAdding]       = useState(false);

  const generalImages   = item.images?.length ? item.images : [item.primaryImage || FALLBACK];
  const activePrice     = selectedSize ? selectedSize.price : item.price;
  const discountedPrice = discount > 0
    ? Math.round(activePrice * (1 - discount / 100) * 100) / 100
    : activePrice;

  const sizeImage     = selectedSize?.image || null;
  const displayImages = sizeImage ? [sizeImage] : generalImages;
  const activeIndex   = sizeImage ? 0 : imgIndex;

  const handleSizeSelect = (sz: any) => { setSelectedSize(sz); setImgIndex(0); };

  const handleAdd = () => {
    if (!item.isAvailable) return;
    const cartImage = selectedSize?.image || generalImages[imgIndex] || FALLBACK;
    setAdding(true);
    addItem({
      id:            item._id + (selectedSize?.label || ''),
      name:          item.name + (selectedSize ? ` (${selectedSize.label})` : ''),
      price:         discountedPrice,
      originalPrice: discount > 0 ? activePrice : undefined,
      quantity:      1,
      image:         cartImage,
      category:      item.category,
    });
    toast.success(`${item.name} added!`, { icon: '🍽️' });
    window.dispatchEvent(new Event('open-cart'));
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <>
      <div
        style={{
          background: 'white',
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 2px 8px rgba(44,26,14,0.06)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 10px 36px rgba(44,26,14,0.13)';
          el.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = '0 2px 8px rgba(44,26,14,0.06)';
          el.style.transform = 'none';
        }}
      >
        {/* ── Image ─────────────────────────────── */}
        <div className="menu-card-img" style={{ position: 'relative', height: '175px', background: '#f3ede6', overflow: 'hidden', flexShrink: 0 }}>
          <img
            key={displayImages[activeIndex]}
            src={displayImages[activeIndex]}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(44,26,14,0.4) 0%, transparent 50%)', pointerEvents: 'none' }} />

          {/* Gallery nav */}
          {!sizeImage && generalImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgIndex(i => (i - 1 + generalImages.length) % generalImages.length); }}
                style={{ position: 'absolute', left: '7px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <ChevronLeft size={13} color="#3b1f0e" />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgIndex(i => (i + 1) % generalImages.length); }}
                style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                <ChevronRight size={13} color="#3b1f0e" />
              </button>
              <div style={{ position: 'absolute', bottom: '7px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                {generalImages.map((_: string, i: number) => (
                  <div key={i} style={{ width: i === imgIndex ? '16px' : '5px', height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.9)', opacity: i === imgIndex ? 1 : 0.45, transition: 'all 0.2s' }} />
                ))}
              </div>
            </>
          )}

          {/* Badges — top left */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '4px' }}>
            {discount > 0 && (
              <span style={{ background: 'var(--red-korean)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                {discount}% OFF
              </span>
            )}
            {item.sizes?.length > 1 && (
              <span style={{ background: 'rgba(44,26,14,0.72)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
                Multiple sizes
              </span>
            )}
          </div>

          {/* Size label when size has its own image */}
          {sizeImage && selectedSize?.label && (
            <div style={{ position: 'absolute', bottom: '7px', left: '8px', background: 'rgba(44,26,14,0.72)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
              {selectedSize.label}
            </div>
          )}

          {/* Unavailable */}
          {!item.isAvailable && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(192,57,43,0.92)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                Unavailable
              </span>
            </div>
          )}
        </div>

        {/* ── Content ───────────────────────────── */}
        <div className="menu-card-body" style={{ padding: '13px 15px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Name row + Rate button */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <h3 className="font-display menu-card-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.25, margin: 0 }}>
              {item.name}
            </h3>
            <button
              onClick={() => setShowReview(true)}
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '3px 7px', cursor: 'pointer', fontSize: '10px', color: 'var(--brown-mid)', fontFamily: 'Poppins, sans-serif', transition: 'border-color 0.15s, color 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brown-dark)'; (e.currentTarget as HTMLElement).style.color = 'var(--brown-dark)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--brown-mid)'; }}
            >
              <Star size={9} /> Rate
            </button>
          </div>

          {/* Rating */}
          {item.reviewCount > 0 && (
            <div style={{ marginBottom: '5px' }}>
              <StarRating rating={item.avgRating} size={11} showNumber count={item.reviewCount} />
            </div>
          )}

          {/* Description */}
          <p style={{ fontSize: '11px', color: 'var(--brown-mid)', lineHeight: 1.55, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '9px' }}>
              {item.tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: 600, textTransform: 'capitalize', background: TAG_STYLES[tag]?.bg || 'var(--stone-light)', color: TAG_STYLES[tag]?.color || 'var(--brown-mid)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Size selector */}
          {item.sizes?.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {item.sizes.map((sz: any) => {
                const isActive = selectedSize?.label === sz.label;
                return (
                  <button key={sz.label} onClick={() => handleSizeSelect(sz)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', border: `1.5px solid ${isActive ? 'var(--red-korean)' : 'rgba(0,0,0,0.1)'}`, background: isActive ? '#fff1f0' : '#fafafa', fontSize: '11px', fontWeight: isActive ? 700 : 500, cursor: 'pointer', color: isActive ? 'var(--red-korean)' : 'var(--brown-mid)', transition: 'all 0.15s' }}>
                    {sz.image && <img src={sz.image} alt={sz.label} style={{ width: '14px', height: '14px', borderRadius: '3px', objectFit: 'cover' }} />}
                    {sz.label} <span style={{ color: isActive ? 'var(--red-korean)' : '#bbb', fontWeight: 600 }}>${sz.price}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Price + Add to Cart (same line) ─── */}
          <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span className="font-display menu-card-price" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--red-korean)', letterSpacing: '-0.01em' }}>
                ${discountedPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span style={{ fontSize: '12px', color: '#bbb', textDecoration: 'line-through' }}>
                  ${activePrice.toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!item.isAvailable || adding}
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: item.isAvailable ? (adding ? 'var(--red-korean)' : 'var(--brown-dark)') : 'var(--stone-light)',
                color: item.isAvailable ? 'white' : 'var(--brown-mid)',
                border: 'none', borderRadius: '10px',
                padding: '9px 16px',
                cursor: item.isAvailable ? 'pointer' : 'not-allowed',
                fontSize: '12px', fontWeight: 700,
                fontFamily: 'Poppins, sans-serif',
                transition: 'background 0.2s, transform 0.15s',
                transform: adding ? 'scale(0.95)' : 'scale(1)',
              }}
              onMouseEnter={e => { if (item.isAvailable && !adding) (e.currentTarget as HTMLElement).style.background = 'var(--red-korean)'; }}
              onMouseLeave={e => { if (item.isAvailable && !adding) (e.currentTarget as HTMLElement).style.background = 'var(--brown-dark)'; }}
            >
              {adding ? <ShoppingCart size={13} /> : <Plus size={13} />}
              {adding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {showReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowReview(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <ReviewForm type="dish" menuItemId={item._id} menuItemName={item.name} onSuccess={() => setShowReview(false)} onCancel={() => setShowReview(false)} />
          </div>
        </div>
      )}
    </>
  );
}
