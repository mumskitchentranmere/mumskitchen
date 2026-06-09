'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { Plus, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import toast from 'react-hot-toast';

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  halal:          { bg: '#e8f5e9', color: '#2e7d32' },
  vegan:          { bg: '#e8f5e9', color: '#388e3c' },
  vegetarian:     { bg: '#f1f8e9', color: '#558b2f' },
  spicy:          { bg: '#fbe9e7', color: '#bf360c' },
  'gluten-free':  { bg: '#e3f2fd', color: '#1565c0' },
};

const FALLBACK = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600';

export function MenuCard({ item }: { item: any }) {
  const addItem = useCartStore(s => s.addItem);
  const [imgIndex,      setImgIndex]      = useState(0);
  const [selectedSize,  setSelectedSize]  = useState<any>(item.sizes?.[0] || null);
  const [showReview,    setShowReview]    = useState(false);

  const generalImages = item.images?.length ? item.images : [item.primaryImage || FALLBACK];
  const activePrice   = selectedSize ? selectedSize.price : item.price;

  // Show size-specific image if the selected size has one, otherwise show the gallery
  const sizeImage     = selectedSize?.image || null;
  const displayImages = sizeImage ? [sizeImage] : generalImages;
  const activeIndex   = sizeImage ? 0 : imgIndex;

  const handleSizeSelect = (sz: any) => {
    setSelectedSize(sz);
    setImgIndex(0); // reset gallery index when switching sizes
  };

  const handleAdd = () => {
    const cartImage = selectedSize?.image || generalImages[imgIndex] || FALLBACK;
    addItem({
      id:       item._id + (selectedSize?.label || ''),
      name:     item.name + (selectedSize ? ` (${selectedSize.label})` : ''),
      price:    activePrice,
      quantity: 1,
      image:    cartImage,
      category: item.category,
    });
    toast.success('Added to cart!', { icon: '🍽️' });
    window.dispatchEvent(new Event('open-cart'));
  };

  return (
    <>
      <div
        style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--stone-light)', transition: 'all 0.25s ease' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 32px rgba(44,26,14,0.12)'; el.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}
      >
        {/* Image area */}
        <div style={{ position: 'relative', height: '190px', background: 'var(--stone-light)', overflow: 'hidden' }}>
          <img
            key={sizeImage || generalImages[imgIndex]}
            src={displayImages[activeIndex]}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.target as HTMLElement).style.transform = 'scale(1)'}
          />

          {/* Gallery nav — only shown when no size-specific image is active */}
          {!sizeImage && generalImages.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgIndex(i => (i - 1 + generalImages.length) % generalImages.length); }} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgIndex(i => (i + 1) % generalImages.length); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={14} />
              </button>
              <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                {generalImages.map((_: string, i: number) => (
                  <div key={i} style={{ width: i === imgIndex ? '16px' : '6px', height: '6px', borderRadius: '3px', background: i === imgIndex ? 'white' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }} />
                ))}
              </div>
            </>
          )}

          {/* Size image indicator */}
          {sizeImage && selectedSize?.label && (
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(44,26,14,0.75)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backdropFilter: 'blur(4px)' }}>
              {selectedSize.label}
            </div>
          )}

          {!item.isAvailable && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'rgba(192,57,43,0.9)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>Unavailable</span>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 16px' }}>
          <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '3px', lineHeight: 1.3 }}>{item.name}</h3>

          {item.reviewCount > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <StarRating rating={item.avgRating} size={12} showNumber count={item.reviewCount} />
            </div>
          )}

          <p style={{ fontSize: '12px', color: 'var(--brown-mid)', lineHeight: 1.5, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>

          {item.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
              {item.tags.map((tag: string) => (
                <span key={tag} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', fontWeight: 500, textTransform: 'capitalize', background: TAG_STYLES[tag]?.bg || 'var(--stone-light)', color: TAG_STYLES[tag]?.color || 'var(--brown-mid)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Size selector — shows size image on hover/select */}
          {item.sizes?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {item.sizes.map((sz: any) => {
                const isActive = selectedSize?.label === sz.label;
                return (
                  <button key={sz.label} onClick={() => handleSizeSelect(sz)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', border: '1.5px solid', borderColor: isActive ? 'var(--red-korean)' : 'var(--stone-light)', background: isActive ? '#fbe9e7' : 'transparent', fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: isActive ? 'var(--red-korean)' : 'var(--brown-mid)', transition: 'all 0.15s' }}>
                    {sz.image && (
                      <img src={sz.image} alt={sz.label} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover', border: isActive ? '1px solid var(--red-korean)' : '1px solid var(--stone-light)' }} />
                    )}
                    {sz.label} · ${sz.price}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>
                ${activePrice?.toFixed(2)}
              </span>
              <button onClick={() => setShowReview(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--brown-mid)', marginTop: '2px', padding: 0, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Star size={10} /> Rate this dish
              </button>
            </div>
            <button onClick={handleAdd} disabled={!item.isAvailable}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: item.isAvailable ? 'var(--brown-dark)' : 'var(--stone-light)', color: item.isAvailable ? 'white' : 'var(--brown-mid)', border: 'none', borderRadius: '10px', padding: '8px 16px', cursor: item.isAvailable ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => { if (item.isAvailable) (e.currentTarget as HTMLElement).style.background = 'var(--red-korean)'; }}
              onMouseLeave={e => { if (item.isAvailable) (e.currentTarget as HTMLElement).style.background = 'var(--brown-dark)'; }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

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
