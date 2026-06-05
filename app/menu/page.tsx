'use client';
import { useState, useEffect } from 'react';
import { MenuCard } from '@/components/menu/MenuCard';
import { Search } from 'lucide-react';

const CATS = [
  { id:'all', label:'All' }, { id:'snack', label:'Snacks & Street Food' },
  { id:'rice-bowl', label:'Rice Bowls' }, { id:'noodle', label:'Noodles & Rice' },
  { id:'bibimbap', label:'Bibimbap' }, { id:'soup', label:'Soups & Stews' },
  { id:'fried-chicken', label:'Korean Fried Chicken' }, { id:'side', label:'Side Dishes' },
];

export default function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = cat !== 'all' ? `?category=${cat}` : '';
    fetch(`/api/menu${q}`).then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, [cat]);

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.description || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      {/* Header */}
      <div style={{ background: 'var(--brown-dark)', padding: '56px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '10px' }}>Korean Traditional Authentic Food</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Our Menu</h1>
        <p style={{ fontSize: '15px', color: 'rgba(232,224,213,0.65)', fontStyle: 'italic' }}>Freshly prepared to order · All meat 100% Halal</p>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '24px' }}>
          <Search size={16} color="var(--brown-mid)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..." style={{ width: '100%', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', padding: '11px 14px 11px 40px', fontSize: '14px', color: 'var(--brown-dark)', outline: 'none' }} />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1.5px solid', borderColor: cat === c.id ? 'var(--red-korean)' : 'var(--stone-light)', background: cat === c.id ? 'var(--red-korean)' : 'white', color: cat === c.id ? 'white' : 'var(--brown-mid)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: '16px', height: '280px' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--brown-mid)' }}>No dishes found. Try adjusting your search.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {filtered.map(item => <MenuCard key={item._id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
