'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, X, Check, Upload, Images, Star, Search, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';

type SizeEntry = { label: string; price: string; image: string };

const DEFAULT_CATS = [
  'snack','rice-bowl','noodle','bibimbap','soup','fried-chicken',
  'side','drink','set-menu','bangladeshi-main','bangladeshi-snack','biryani','curry',
];

const EMPTY_SIZES: SizeEntry[] = [];
const EMPTY = {
  name: '', description: '', price: '', discount: '', category: 'snack', cuisine: 'korean',
  tags: '', images: [] as string[], primaryImage: '', isAvailable: true,
  isFeatured: false, sizes: EMPTY_SIZES,
};

// ── Per-size image manager ──────────────────────────────────────────────────
function SizeManager({ sizes, onChange }: { sizes: SizeEntry[]; onChange: (s: SizeEntry[]) => void }) {
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);

  const add    = () => onChange([...sizes, { label: '', price: '', image: '' }]);
  const remove = (i: number) => onChange(sizes.filter((_, j) => j !== i));
  const update = (i: number, field: keyof SizeEntry, value: string) => {
    const next = [...sizes];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const uploadImage = async (i: number, files: FileList) => {
    if (!files[0]) return;
    setUploading(i);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(files[0]);
      });
      const res  = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: [b64] }) });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || 'Upload failed');
      else if (data.urls?.[0]) { update(i, 'image', data.urls[0]); toast.success('Image uploaded'); }
    } catch { toast.error('Upload failed'); }
    setUploading(null);
    if (fileRefs.current[i]) fileRefs.current[i]!.value = '';
  };

  const inp: React.CSSProperties = {
    background: 'white', border: '1px solid var(--stone-light)', borderRadius: '8px',
    padding: '7px 10px', fontSize: '13px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', width: '100%',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sizes &amp; Per-Size Images
        </label>
        <button type="button" onClick={add} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          <Plus size={11} /> Add Size
        </button>
      </div>

      {sizes.length === 0 && (
        <p style={{ fontSize: '12px', color: 'var(--brown-mid)', fontStyle: 'italic', padding: '10px 12px', background: '#f9f5f0', borderRadius: '8px', border: '1px dashed var(--stone-light)' }}>
          No sizes — single price item. Click "Add Size" to create Small / Large variants with individual images.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sizes.map((sz, i) => (
          <div key={i} style={{ background: '#f9f5f0', borderRadius: '12px', padding: '14px', border: '1px solid var(--stone-light)' }}>
            {/* Name + Price row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--brown-mid)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Size Name</label>
                <input value={sz.label} onChange={e => update(i, 'label', e.target.value)} placeholder="e.g. Small" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--brown-mid)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>Price (AUD)</label>
                <input type="number" step="0.01" min="0" value={sz.price} onChange={e => update(i, 'price', e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder="0.00" style={inp} />
              </div>
              <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={13} />
              </button>
            </div>

            {/* Size image */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              {sz.image ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={sz.image} alt={sz.label || 'Size'} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '2px solid var(--red-korean)' }} />
                  <button type="button" onClick={() => update(i, 'image', '')} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '10px', border: '2px dashed var(--stone-light)', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: '3px' }}>
                  <Images size={16} color="var(--stone-light)" />
                  <span style={{ fontSize: '8px', color: 'var(--stone-light)', fontWeight: 600 }}>NO IMG</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginBottom: '6px', fontWeight: 600 }}>
                  Image for &quot;{sz.label || 'this size'}&quot;
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input ref={el => { fileRefs.current[i] = el; }} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && uploadImage(i, e.target.files)} />
                  <button type="button" onClick={() => fileRefs.current[i]?.click()} disabled={uploading === i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', cursor: uploading === i ? 'wait' : 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: 500, opacity: uploading === i ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                    <Upload size={10} /> {uploading === i ? 'Uploading…' : 'Upload'}
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--brown-mid)', flexShrink: 0 }}>or</span>
                  <input type="text" value={sz.image} onChange={e => update(i, 'image', e.target.value)} placeholder="Paste image URL…" style={{ ...inp, flex: 1, minWidth: '120px', fontSize: '11px', padding: '5px 8px' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Category drag-sort section ────────────────────────────────────────────────
function CategoryOrderPanel({ allCats, order, onSave }: {
  allCats: string[];
  order: string[];
  onSave: (o: string[]) => void;
}) {
  const merged = [...new Set([...order, ...allCats])];
  const [list, setList] = useState(merged);
  const [newCat, setNewCat] = useState('');
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    setList([...new Set([...order, ...allCats])]);
  }, [order, allCats]);

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...list];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setList(next);
  };
  const onDrop = () => { onSave(list); dragIdx.current = null; };

  const addCat = () => {
    const v = newCat.trim().toLowerCase().replace(/\s+/g, '-');
    if (!v || list.includes(v)) return;
    const next = [...list, v];
    setList(next);
    onSave(next);
    setNewCat('');
  };

  return (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--stone-light)', padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brown-dark)' }}>Category Order</h2>
          <p style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '2px' }}>Drag to reorder — customers see categories in this order</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCat()}
            placeholder="New category name…"
            style={{ border: '1px solid var(--stone-light)', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontFamily: 'Poppins, sans-serif', outline: 'none', width: '170px' }}
          />
          <button onClick={addCat} style={{ background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {list.map((cat, i) => (
          <div
            key={cat}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDrop={onDrop}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f9f5f0', border: '1px solid var(--stone-light)', borderRadius: '8px', padding: '6px 10px', cursor: 'grab', userSelect: 'none', fontSize: '12px', fontWeight: 500, color: 'var(--brown-dark)' }}
          >
            <GripVertical size={12} color="var(--brown-mid)" />
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMenuPage() {
  const [items,     setItems]    = useState<any[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [modal,     setModal]    = useState(false);
  const [editing,   setEditing]  = useState<any>(null);
  const [form,      setForm]     = useState<any>({ ...EMPTY, sizes: [] });
  const [uploading, setUploading] = useState(false);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('all');
  const [catOrder, setCatOrder] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    fetch('/api/menu').then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });

  useEffect(() => {
    load();
    fetch('/api/settings').then(r => r.json()).then(d => { if (d.categoryOrder?.length) setCatOrder(d.categoryOrder); });
  }, []);

  const saveOrder = (order: string[]) => {
    setCatOrder(order);
    fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryOrder: order }) })
      .then(() => toast.success('Category order saved'));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sizes: [] });
    setModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const sizes: SizeEntry[] = (item.sizes || []).map((s: any) => ({
      label: s.label || '',
      price: s.price?.toString() || '',
      image: s.image || '',
    }));
    setForm({
      ...item,
      price:    item.price?.toString() || '',
      discount: item.discount?.toString() ?? '0',
      tags:     (item.tags || []).join(', '),
      sizes,
      _newCat:  '',
    });
    setModal(true);
  };

  // Multi-image uploader (general)
  const handleImages = async (files: FileList) => {
    setUploading(true);
    try {
      const base64s: string[] = [];
      for (const f of Array.from(files)) {
        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
        });
        base64s.push(b64);
      }
      const r    = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: base64s }) });
      const data = await r.json();
      if (!r.ok) toast.error(data.error || 'Upload failed');
      else if (data.urls) {
        setForm((f: any) => ({ ...f, images: [...f.images, ...data.urls], primaryImage: f.primaryImage || data.urls[0] }));
        toast.success(`${data.urls.length} image(s) uploaded`);
      }
    } catch { toast.error('Upload failed — check your connection'); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = async (url: string, idx: number) => {
    setForm((f: any) => {
      const imgs = f.images.filter((_: string, j: number) => j !== idx);
      return { ...f, images: imgs, primaryImage: imgs[0] || '' };
    });
    if (url.includes('cloudinary.com')) {
      fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error('Item name is required'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { toast.error('Valid price is required'); return; }

    const sizes = (form.sizes as SizeEntry[])
      .filter(s => s.label?.trim())
      .map(s => ({ label: s.label.trim(), price: parseFloat(s.price) || 0, image: s.image || '' }));

    const body = {
      ...form,
      price:        parseFloat(form.price),
      discount:     Math.min(100, Math.max(0, parseFloat(form.discount) || 0)),
      tags:         form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      sizes,
      primaryImage: form.images[0] || form.primaryImage,
      _newCat:      undefined,
    };

    const url = editing ? `/api/menu/${editing._id}` : '/api/menu';
    const r   = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { toast.error('Failed to save'); return; }
    toast.success(editing ? 'Updated!' : 'Added!');
    setModal(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    toast.success('Deleted');
    load();
  };

  const toggle = async (item: any) => {
    await fetch(`/api/menu/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: !item.isAvailable }) });
    load();
  };

  const inp: React.CSSProperties = {
    width: '100%', background: '#f9f5f0', border: '1px solid var(--stone-light)',
    borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: 'var(--brown-dark)',
    outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box',
  };

  const allCats = [...new Set([...catOrder, ...DEFAULT_CATS, ...items.map((i: any) => i.category).filter(Boolean)])];

  const q = search.toLowerCase().trim();
  const filtered = items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false;
    if (!q) return true;
    return (
      i.name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      (i.tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)' }}>Menu Items</h1>
          <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* Category drag-sort */}
      <CategoryOrderPanel allCats={allCats} order={catOrder} onSave={saveOrder} />

      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-mid)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by name, category, description, tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inp, background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', paddingLeft: '36px', paddingRight: search ? '34px' : '14px', fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)', display: 'flex', padding: '2px' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ ...inp, width: 'auto', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', paddingLeft: '12px', fontSize: '13px', flex: '0 1 180px' }}
        >
          <option value="all">All Categories</option>
          {allCats.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || catFilter !== 'all') && (
          <button onClick={() => { setSearch(''); setCatFilter('all'); }} style={{ background: 'none', border: '1px solid var(--stone-light)', borderRadius: '12px', padding: '0 14px', cursor: 'pointer', fontSize: '12px', color: 'var(--brown-mid)', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
            Clear
          </button>
        )}
      </div>

      {/* Result count */}
      {(search || catFilter !== 'all') && (
        <p style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '10px' }}>
          {filtered.length === 0
            ? 'No items match'
            : <>{filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}</>}
        </p>
      )}

      {/* Mobile card list */}
      {!loading && (
        <div className="menu-card-list">
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--brown-mid)', fontSize: '13px', padding: '32px 0' }}>
              {search ? 'No items match your search' : 'No menu items yet'}
            </p>
          )}
          {filtered.map(item => (
            <div key={item._id} className="menu-list-item">
              {/* Row 1: image + name/desc + toggle */}
              <div className="menu-list-row1">
                {item.primaryImage ? (
                  <img src={item.primaryImage} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--stone-light)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="menu-list-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {item.name}
                    {item.isFeatured && <Star size={11} color="#C8922A" fill="#C8922A" />}
                  </div>
                  <div className="menu-list-desc">{item.description}</div>
                  <div className="menu-list-cat" style={{ marginTop: '2px' }}>{item.category}</div>
                </div>
                <button onClick={() => toggle(item)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: item.isAvailable ? '#22c55e' : 'var(--stone-light)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: item.isAvailable ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </button>
              </div>
              {/* Row 2: price + actions */}
              <div className="menu-list-row2">
                <div>
                  {item.sizes?.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {item.sizes.map((s: any) => (
                        <span key={s.label} style={{ fontSize: '12px', color: 'var(--red-korean)', fontWeight: 700 }}>
                          {s.label} ${s.price?.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="menu-list-price">${item.price?.toFixed(2)}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(item)} style={{ padding: '7px 14px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}>
                    <Edit size={12} /> Edit
                  </button>
                  <button onClick={() => remove(item._id)} style={{ padding: '7px 10px', background: 'none', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {loading ? <p style={{ color: 'var(--brown-mid)' }}>Loading…</p> : (
        <div className="table-scroll menu-table-wrap" style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--stone-light)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
            <thead style={{ background: '#f9f5f0' }}>
              <tr>
                {['Item', 'Category', 'Price / Sizes', 'Available', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--brown-mid)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item._id} style={{ borderTop: '1px solid var(--stone-light)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.primaryImage && (
                        <img src={item.primaryImage} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--brown-dark)' }}>{item.name}</span>
                          {item.isFeatured && <Star size={11} color="#C8922A" fill="#C8922A" />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--brown-mid)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--brown-mid)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{item.category}</td>
                  <td style={{ padding: '12px 14px' }}>
                    {item.sizes?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {item.sizes.map((s: any) => (
                          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {s.image && <img src={s.image} alt={s.label} style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />}
                            <span style={{ fontSize: '12px', color: 'var(--brown-dark)', fontWeight: 500 }}>{s.label}</span>
                            <span style={{ fontSize: '12px', color: 'var(--red-korean)', fontWeight: 700 }}>${s.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, color: 'var(--red-korean)' }}>${item.price?.toFixed(2)}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => toggle(item)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: item.isAvailable ? '#22c55e' : 'var(--stone-light)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '3px', left: item.isAvailable ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                    </button>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => openEdit(item)} style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--stone-light)', borderRadius: '8px', cursor: 'pointer', color: 'var(--brown-mid)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'Poppins, sans-serif' }}>
                        <Edit size={12} /> Edit
                      </button>
                      <button onClick={() => remove(item._id)} style={{ padding: '6px', background: 'none', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--brown-mid)', fontSize: '13px' }}>{search ? 'No items match your search' : 'No menu items yet'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px,3vw,16px)' }} onClick={() => setModal(false)}>
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px,4vw,28px)', width: '100%', maxWidth: '600px', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brown-dark)' }}>
                {editing ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {/* ── Section: General Images ── */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                General Food Images
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'flex-end' }}>
                {form.images?.map((url: string, i: number) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: i === 0 ? '2.5px solid var(--red-korean)' : '2px solid var(--stone-light)' }} />
                    <button onClick={() => removeImage(url, i)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                    {i === 0 && <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', background: 'var(--red-korean)', color: 'white', fontSize: '8px', padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>Main</div>}
                  </div>
                ))}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && handleImages(e.target.files)} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width: '64px', height: '64px', borderRadius: '10px', border: '2px dashed var(--stone-light)', background: '#f9f5f0', cursor: uploading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', color: 'var(--brown-mid)', fontSize: '10px', fontFamily: 'Poppins, sans-serif' }}>
                  {uploading ? <span style={{ fontSize: '9px' }}>…</span> : <><Upload size={14} /><span>Upload</span></>}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="Or paste image URL…" id="img-url-inp" style={{ ...inp, flex: 1, fontSize: '12px' }} />
                <button onClick={() => { const v = (document.getElementById('img-url-inp') as HTMLInputElement)?.value?.trim(); if (v) { setForm((f: any) => ({ ...f, images: [...f.images, v], primaryImage: f.primaryImage || v })); (document.getElementById('img-url-inp') as HTMLInputElement).value = ''; } }} style={{ background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>Add</button>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--brown-mid)', marginTop: '5px' }}>First image = main display. Upload multiple photos.</p>
            </div>

            {/* ── Section: Core fields ── */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Item Name *</label>
              <input type="text" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Spicy Beef Bulgogi" style={inp} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Description</label>
              <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inp, resize: 'none' }} placeholder="Short description shown on menu card" />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))} placeholder="halal, spicy, vegan, vegetarian, gluten-free" style={inp} />
            </div>

            {/* Price / Discount / Cuisine row */}
            <div className="admin-form-3" style={{ marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Base Price (AUD) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder="0.00" style={inp} />
                <p style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '3px' }}>Used when no sizes defined</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Discount (%)</label>
                <input type="number" step="1" min="0" max="100" value={form.discount ?? ''} onChange={e => setForm((f: any) => ({ ...f, discount: e.target.value }))} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder="0" style={inp} />
                <p style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '3px' }}>Item-level discount (0 = none)</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Cuisine</label>
                <select value={form.cuisine} onChange={e => setForm((f: any) => ({ ...f, cuisine: e.target.value }))} style={inp}>
                  {['korean', 'bangladeshi', 'both'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Category row with inline new-category creator */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Category</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={allCats.includes(form.category) ? form.category : '__new__'}
                  onChange={e => { if (e.target.value !== '__new__') setForm((f: any) => ({ ...f, category: e.target.value })); }}
                  style={{ ...inp, flex: 1 }}
                >
                  {allCats.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ New category…</option>
                </select>
                <input
                  type="text"
                  placeholder="Type new category"
                  value={form._newCat ?? ''}
                  onChange={e => setForm((f: any) => ({ ...f, _newCat: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const v = (form._newCat ?? '').trim().toLowerCase().replace(/\s+/g, '-');
                      if (v) { saveOrder([...allCats, v]); setForm((f: any) => ({ ...f, category: v, _newCat: '' })); }
                    }
                  }}
                  style={{ ...inp, width: '160px', flexShrink: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = (form._newCat ?? '').trim().toLowerCase().replace(/\s+/g, '-');
                    if (v) { saveOrder([...allCats, v]); setForm((f: any) => ({ ...f, category: v, _newCat: '' })); }
                  }}
                  style={{ background: 'var(--red-korean)', color: 'white', border: 'none', borderRadius: '10px', padding: '0 12px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
              <p style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '3px' }}>Type a new name and press Add to create a custom category</p>
            </div>

            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {([['isAvailable', 'Available on menu'], ['isFeatured', 'Featured on homepage']] as [string, string][]).map(([field, label]) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', cursor: 'pointer', color: 'var(--brown-dark)' }}>
                  <input type="checkbox" checked={form[field]} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.checked }))} style={{ accentColor: 'var(--red-korean)', width: '15px', height: '15px' }} />
                  {label}
                </label>
              ))}
            </div>

            {/* ── Section: Sizes with per-size images ── */}
            <div style={{ borderTop: '1px solid var(--stone-light)', paddingTop: '20px', marginBottom: '20px' }}>
              <SizeManager
                sizes={form.sizes || []}
                onChange={sizes => setForm((f: any) => ({ ...f, sizes }))}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={save} style={{ flex: 1, background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                <Check size={15} /> Save Item
              </button>
              <button onClick={() => setModal(false)} style={{ flex: 1, background: 'var(--stone-light)', color: 'var(--brown-dark)', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
