'use client';
import { useState, useEffect } from 'react';
import { MenuCard } from '@/components/menu/MenuCard';
import { ShoppingBag } from 'lucide-react';

const CUISINES = [
  { id: 'all',         label: 'All',        flag: '🍽️' },
  { id: 'korean',      label: 'Korean',      flag: '🇰🇷' },
  { id: 'bangladeshi', label: 'Bangladeshi', flag: '🇧🇩' },
];

const SUBCATS: Record<string, { id: string; label: string }[]> = {
  korean: [
    { id: 'all',           label: 'All Korean' },
    { id: 'snack',         label: 'Snacks' },
    { id: 'rice-bowl',     label: 'Rice Bowls' },
    { id: 'noodle',        label: 'Noodles & Rice' },
    { id: 'bibimbap',      label: 'Bibimbap' },
    { id: 'soup',          label: 'Soups' },
    { id: 'fried-chicken', label: 'Fried Chicken' },
    { id: 'side',          label: 'Sides' },
    { id: 'drink',         label: 'Drinks' },
    { id: 'set-menu',      label: 'Set Menu' },
  ],
  bangladeshi: [
    { id: 'all',               label: 'All Bangladeshi' },
    { id: 'bangladeshi-main',  label: 'Mains' },
    { id: 'bangladeshi-snack', label: 'Snacks' },
    { id: 'biryani',           label: 'Biryani' },
    { id: 'curry',             label: 'Curry' },
    { id: 'drink',             label: 'Drinks' },
    { id: 'set-menu',          label: 'Set Menu' },
  ],
};

export default function OrderPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cuisine, setCuisine] = useState('all');
  const [cat,     setCat]     = useState('all');

  const selectCuisine = (c: string) => { setCuisine(c); setCat('all'); };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cuisine !== 'all') params.set('cuisine', cuisine);
    if (cat !== 'all')     params.set('category', cat);
    const q = params.toString() ? `?${params}` : '';
    fetch(`/api/menu${q}`)
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, [cuisine, cat]);

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: '20px', border: '1.5px solid',
    borderColor: active ? 'var(--red-korean)' : 'var(--stone-light)',
    background: active ? 'var(--red-korean)' : 'white',
    color: active ? 'white' : 'var(--brown-mid)',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>

      {/* Header */}
      <div style={{ background: 'var(--brown-dark)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <ShoppingBag size={22} color="var(--gold)" />
            <h1 className="font-display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: 'white' }}>Takeaway Order</h1>
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
                transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
                boxShadow: cuisine === c.id ? '0 4px 14px rgba(192,57,43,0.25)' : 'none',
              }}>
              <span style={{ fontSize: '16px' }}>{c.flag}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Level 2 — Subcategories */}
        {cuisine !== 'all' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', borderLeft: '3px solid var(--red-korean)', paddingLeft: '12px' }}>
            {SUBCATS[cuisine].map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={tabBtn(cat === c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {cuisine === 'all' && <div style={{ marginBottom: '12px' }} />}

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
              {items.map(item => <MenuCard key={item._id} item={item} />)}
            </div>
        }
      </div>
    </div>
  );
}
