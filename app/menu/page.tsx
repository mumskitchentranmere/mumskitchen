'use client';
import { useState, useEffect } from 'react';
import { MenuCard } from '@/components/menu/MenuCard';
import { Search } from 'lucide-react';

const CUISINES = [
  { id: 'all',         label: 'All',         flag: '🍽️' },
  { id: 'korean',      label: 'Korean',       flag: '🇰🇷' },
  { id: 'bangladeshi', label: 'Bangladeshi',  flag: '🇧🇩' },
];

const SUBCATS: Record<string, { id: string; label: string }[]> = {
  korean: [
    { id: 'all',           label: 'All Korean' },
    { id: 'snack',         label: 'Snacks & Street Food' },
    { id: 'rice-bowl',     label: 'Rice Bowls' },
    { id: 'noodle',        label: 'Noodles & Rice' },
    { id: 'bibimbap',      label: 'Bibimbap' },
    { id: 'soup',          label: 'Soups & Stews' },
    { id: 'fried-chicken', label: 'Fried Chicken' },
    { id: 'side',          label: 'Sides' },
    { id: 'drink',         label: 'Drinks' },
    { id: 'set-menu',      label: 'Set Menu' },
  ],
  bangladeshi: [
    { id: 'all',                label: 'All Bangladeshi' },
    { id: 'bangladeshi-main',   label: 'Mains' },
    { id: 'bangladeshi-snack',  label: 'Snacks' },
    { id: 'biryani',            label: 'Biryani' },
    { id: 'curry',              label: 'Curry' },
    { id: 'drink',              label: 'Drinks' },
    { id: 'set-menu',           label: 'Set Menu' },
  ],
};

export default function MenuPage() {
  const [items,    setItems]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [cuisine,  setCuisine]  = useState('all');
  const [cat,      setCat]      = useState('all');
  const [search,   setSearch]   = useState('');
  const [discount, setDiscount] = useState(0);

  // Fetch discount — fresh every time (no-cache) and re-fetch when tab regains focus
  const fetchDiscount = () =>
    fetch('/api/settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setDiscount(Number(d.globalDiscount) || 0))
      .catch(() => {});

  useEffect(() => {
    fetchDiscount();
    window.addEventListener('focus', fetchDiscount);
    return () => window.removeEventListener('focus', fetchDiscount);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset subcategory whenever cuisine changes
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

  const filtered = items.filter(i =>
    !search ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '20px', border: '1.5px solid',
    borderColor: active ? 'var(--red-korean)' : 'var(--stone-light)',
    background: active ? 'var(--red-korean)' : 'white',
    color: active ? 'white' : 'var(--brown-mid)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      {/* Header */}
      <div style={{ background: 'var(--brown-dark)', padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>
          Authentic · Halal · Freshly Made
        </p>
        <h1 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Our Menu</h1>
        <p style={{ fontSize: '15px', color: 'rgba(232,224,213,0.65)', fontStyle: 'italic' }}>Freshly prepared to order · All meat 100% Halal</p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '28px' }}>
          <Search size={16} color="var(--brown-mid)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..."
            style={{ width: '100%', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', padding: '11px 14px 11px 40px', fontSize: '14px', color: 'var(--brown-dark)', outline: 'none' }} />
        </div>

        {/* Level 1 — Cuisine selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {CUISINES.map(c => (
            <button key={c.id} onClick={() => selectCuisine(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 22px', borderRadius: '24px',
                border: `2px solid ${cuisine === c.id ? 'var(--red-korean)' : 'var(--stone-light)'}`,
                background: cuisine === c.id ? 'var(--red-korean)' : 'white',
                color: cuisine === c.id ? 'white' : 'var(--brown-dark)',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
                boxShadow: cuisine === c.id ? '0 4px 14px rgba(192,57,43,0.25)' : 'none',
              }}>
              <span style={{ fontSize: '18px' }}>{c.flag}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Level 2 — Subcategory tabs (only when a cuisine is selected) */}
        {cuisine !== 'all' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', paddingLeft: '4px', borderLeft: '3px solid var(--red-korean)', paddingTop: '4px', paddingBottom: '4px' }}>
            {SUBCATS[cuisine].map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={tabBtn(cat === c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Spacer when no subcategory bar */}
        {cuisine === 'all' && <div style={{ marginBottom: '12px' }} />}

        {/* Discount banner */}
        {discount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, var(--red-korean), #e74c3c)', borderRadius: '14px', padding: '14px 20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '22px' }}>🏷️</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{discount}% OFF everything today!</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Discount automatically applied to all items at checkout</div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="menu-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: '16px', height: '280px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--brown-mid)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍽️</div>
            <p>No dishes found. Try a different category or search term.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filtered.map(item => <MenuCard key={item._id} item={item} discount={discount} />)}
          </div>
        )}
      </div>
    </div>
  );
}
