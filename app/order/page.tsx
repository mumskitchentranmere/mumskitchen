'use client';
import { useState, useEffect } from 'react';
import { MenuCard } from '@/components/menu/MenuCard';
import { ShoppingBag } from 'lucide-react';

const CUISINES = [
  { id: 'korean',      label: 'Korean',       flag: '🇰🇷' },
  { id: 'bangladeshi', label: 'Bangladeshi',  flag: '🇧🇩' },
  { id: 'drinks',      label: 'Drinks',       flag: '🥤' },
];

const SUBCATS: Record<string, { id: string; label: string }[]> = {
  korean: [
    { id: 'snack',         label: 'Snacks' },
    { id: 'rice-bowl',     label: 'Rice Bowls' },
    { id: 'noodle',        label: 'Noodles & Rice' },
    { id: 'bibimbap',      label: 'Bibimbap' },
    { id: 'soup',          label: 'Soups' },
    { id: 'fried-chicken', label: 'Fried Chicken' },
    { id: 'side',          label: 'Sides' },
    { id: 'set-menu',      label: 'Set Menu' },
  ],
  bangladeshi: [
    { id: 'bangladeshi-main',  label: 'Mains' },
    { id: 'bangladeshi-snack', label: 'Snacks' },
    { id: 'biryani',           label: 'Biryani' },
    { id: 'curry',             label: 'Curry' },
    { id: 'set-menu',          label: 'Set Menu' },
  ],
};

export default function OrderPage() {
  const [items,        setItems]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [cuisine,      setCuisine]      = useState('korean');
  const [cat,          setCat]          = useState(SUBCATS.korean[0].id);
  const [catOrder,     setCatOrder]     = useState<string[]>([]);
  const [catDiscounts, setCatDiscounts] = useState<Record<string,number>>({});
  const [globalDisc,   setGlobalDisc]   = useState(0);
  const [activeCats,   setActiveCats]   = useState<string[]>([]);

  // Reset subcategory whenever cuisine changes — land on the first available subcategory
  const selectCuisine = (c: string) => {
    setCuisine(c);
    if (c === 'drinks') return;
    const opts = SUBCATS[c].filter(s => activeCats.length === 0 || activeCats.includes(s.id));
    setCat((opts[0] ?? SUBCATS[c][0]).id);
  };

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.categoryOrder?.length) setCatOrder(d.categoryOrder);
      if (d.categoryDiscounts)     setCatDiscounts(d.categoryDiscounts);
      if (d.globalDiscount != null) setGlobalDisc(Number(d.globalDiscount) || 0);
    });
    fetch('/api/menu/categories')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setActiveCats(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cuisine === 'drinks') {
      params.set('category', 'drink');
    } else {
      if (cuisine !== 'all') params.set('cuisine', cuisine);
      params.set('category', cat);
    }
    fetch(`/api/menu${params.toString() ? `?${params}` : ''}`)
      .then(r => r.json())
      .then(d => {
        setItems(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, [cuisine, cat]);

  const sortedSubcats = (cuis: string) => {
    const base = SUBCATS[cuis] ?? [];
    if (!catOrder.length) return base;
    return [...base].sort((a, b) => {
      const ai = catOrder.indexOf(a.id);
      const bi = catOrder.indexOf(b.id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '20px', border: '1.5px solid',
    borderColor: active ? 'var(--red-korean)' : 'var(--stone-light)',
    background: active ? 'var(--red-korean)' : 'white',
    color: active ? 'white' : 'var(--brown-mid)',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'Poppins, sans-serif',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>

      {/* Header */}
      <div style={{ background: 'var(--brown-dark)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ShoppingBag size={22} color="var(--gold)" />
            <h1 className="font-display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: 'white' }}>Order Online</h1>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(232,224,213,0.6)' }}>Add items to your cart, then proceed to checkout.</p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Level 1 — Cuisine */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {CUISINES.map(c => (
            <button key={c.id} onClick={() => selectCuisine(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 20px', borderRadius: '24px',
                border: `2px solid ${cuisine === c.id ? 'var(--red-korean)' : 'var(--stone-light)'}`,
                background: cuisine === c.id ? 'var(--red-korean)' : 'white',
                color: cuisine === c.id ? 'white' : 'var(--brown-dark)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'Poppins, sans-serif',
                boxShadow: cuisine === c.id ? '0 4px 14px rgba(192,57,43,0.25)' : 'none',
              }}>
              <span style={{ fontSize: '16px' }}>{c.flag}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Level 2 — Subcategories (hidden for Drinks tab) */}
        {cuisine !== 'drinks' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', borderLeft: '3px solid var(--red-korean)', paddingLeft: '12px' }}>
            {sortedSubcats(cuisine).filter(c => activeCats.length === 0 || activeCats.includes(c.id)).map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={tabBtn(cat === c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {cuisine === 'drinks' && <div style={{ marginBottom: '12px' }} />}

        {/* Grid */}
        {loading
          ? <div className="menu-grid">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: '16px', height: '280px' }} />)}
            </div>
          : items.length === 0
          ? <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--brown-mid)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</div>
              <p>No dishes found in this category yet.</p>
            </div>
          : <div className="menu-grid">
              {items.map(item => {
                const effectiveDiscount = item.discount > 0 ? item.discount : (catDiscounts[item.category] || globalDisc);
                return <MenuCard key={item._id} item={item} discount={effectiveDiscount} />;
              })}
            </div>
        }
      </div>
    </div>
  );
}
