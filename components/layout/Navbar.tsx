'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/lib/cartStore';
import { ShoppingBag, Menu, X, Phone, User, LogOut, ChefHat, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { data: session } = useSession();
  const itemCount = useCartStore(s => s.itemCount());

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '/menu', label: 'Menu' },
    { href: '/order', label: 'Order Online' },
    { href: '/dine-in', label: 'Book a Table' },
    { href: '/contact', label: 'Contact' },
    { href: '/reviews', label: 'Reviews' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: scrolled ? 'rgba(250,247,242,0.97)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(168,130,90,0.2)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', background: 'var(--red-korean)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat size={20} color="white" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.1 }}>Mum's Kitchen</div>
            <div style={{ fontSize: '10px', color: 'var(--brown-accent)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tranmere · Authentic Korean</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden-mobile">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ textDecoration: 'none', fontSize: '14px', fontWeight: 500, color: 'var(--brown-mid)', letterSpacing: '0.02em', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--red-korean)'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--brown-mid)'}
            >{l.label}</Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="tel:+61XXXXXXXX" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--brown-mid)', textDecoration: 'none' }} className="hidden-mobile">
            <Phone size={13} /> Call Us
          </a>
          {/* Cart */}
          <button onClick={() => window.dispatchEvent(new Event('open-cart'))} style={{ position: 'relative', background: 'var(--brown-dark)', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '13px', fontWeight: 500 }}>
            <ShoppingBag size={16} />
            {itemCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: 'var(--red-korean)', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{itemCount}</span>
            )}
          </button>

          {/* User */}
          {session ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenu(!userMenu)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--stone-light)', border: 'none', borderRadius: '20px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--brown-dark)' }}>
                <User size={14} /> {session.user?.name?.split(' ')[0]}
              </button>
              {userMenu && (
                <div style={{ position: 'absolute', right: 0, top: '42px', background: 'white', border: '1px solid var(--stone-light)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(44,26,14,0.12)', overflow: 'hidden', minWidth: '180px', zIndex: 100 }}>
                  <Link href="/dashboard" onClick={() => setUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', textDecoration: 'none', color: 'var(--brown-dark)', fontSize: '13px', borderBottom: '1px solid var(--stone-light)' }}>
                    <LayoutDashboard size={14} /> My Dashboard
                  </Link>
                  {(session.user as any)?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', textDecoration: 'none', color: 'var(--red-korean)', fontSize: '13px', fontWeight: 600, borderBottom: '1px solid var(--stone-light)' }}>
                      <ChefHat size={14} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { signOut(); setUserMenu(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '13px', textAlign: 'left' }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" style={{ background: 'var(--red-korean)', color: 'white', padding: '8px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 500 }} className="hidden-mobile">
              Sign In
            </Link>
          )}
          <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-dark)' }} className="show-mobile">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ background: 'var(--warm-white)', borderTop: '1px solid var(--stone-light)', padding: '16px 24px 24px' }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 0', borderBottom: '1px solid var(--stone-light)', textDecoration: 'none', fontSize: '16px', fontWeight: 500, color: 'var(--brown-dark)' }}>{l.label}</Link>
          ))}
          {!session && <Link href="/login" onClick={() => setOpen(false)} style={{ display: 'block', marginTop: '16px', background: 'var(--red-korean)', color: 'white', padding: '12px', borderRadius: '12px', textDecoration: 'none', textAlign: 'center', fontWeight: 600 }}>Sign In</Link>}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
