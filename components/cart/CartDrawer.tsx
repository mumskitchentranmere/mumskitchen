'use client';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore();
  useEffect(() => { const h = () => setOpen(true); window.addEventListener('open-cart', h); return () => window.removeEventListener('open-cart', h); }, []);

  const drawerStyle: React.CSSProperties = { position: 'fixed', top: 0, right: 0, height: '100%', width: '100%', maxWidth: '400px', background: 'var(--warm-white)', zIndex: 200, transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease', boxShadow: '-8px 0 40px rgba(44,26,14,0.15)', display: 'flex', flexDirection: 'column' };

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.4)', zIndex: 199, backdropFilter: 'blur(3px)' }} />}
      <div style={drawerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--stone-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--brown-accent)" />
            <span className="font-display" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--brown-dark)' }}>Your Order</span>
            {itemCount() > 0 && <span style={{ background: 'var(--red-korean)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{itemCount()}</span>}
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-mid)' }}><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--brown-mid)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '15px' }}>Your cart is empty</p>
            <Link href="/menu" onClick={() => setOpen(false)} style={{ color: 'var(--red-korean)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Browse our menu →</Link>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              <div style={{ background: 'var(--stone-light)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--brown-mid)' }}>Order type:</span>
                <span style={{ fontWeight: 600, color: 'var(--red-korean)' }}>🥡 Takeaway / 🍽️ Dine-in</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', background: 'white', borderRadius: '12px', padding: '12px', border: '1px solid var(--stone-light)' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brown-dark)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red-korean)' }}>${item.price.toFixed(2)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--stone-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                        <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--stone-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}><Trash2 size={14} /></button>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brown-dark)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--stone-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="font-display" style={{ fontSize: '20px', fontWeight: 600 }}>Total</span>
                <span className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--red-korean)' }}>${total().toFixed(2)}</span>
              </div>
              <Link href="/checkout" onClick={() => setOpen(false)} style={{ display: 'block', background: 'var(--brown-dark)', color: 'white', textAlign: 'center', padding: '14px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em' }}>
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
