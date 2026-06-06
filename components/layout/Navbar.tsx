'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/lib/cartStore';
import { ShoppingBag, Menu, X, Phone, User, LogOut, ChefHat, LayoutDashboard } from 'lucide-react';

export function Navbar() {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { data: session }       = useSession();
  const itemCount               = useCartStore(s => s.itemCount());
  const pathname                = usePathname();

  // Only go transparent on the homepage — other pages have light backgrounds
  const isHero      = pathname === '/';
  const transparent = isHero && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    // Set initial state in case page is already scrolled on mount
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu & user dropdown on route change
  useEffect(() => { setOpen(false); setUserMenu(false); }, [pathname]);

  const links = [
    { href: '/menu',    label: 'Menu' },
    { href: '/order',   label: 'Order Online' },
    { href: '/contact', label: 'Contact' },
    { href: '/reviews', label: 'Reviews' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const linkColor    = transparent ? 'rgba(232,224,213,0.85)' : 'var(--brown-mid)';
  const activeColor  = transparent ? 'white' : 'var(--brown-dark)';
  const brandColor   = transparent ? 'white' : 'var(--brown-dark)';
  const subColor     = transparent ? 'rgba(232,224,213,0.6)' : 'var(--brown-accent)';

  return (
    <>
      <nav style={{
        position:     'fixed',
        top: 0, left: 0, right: 0,
        zIndex:       50,
        background:   transparent ? 'transparent' : 'rgba(250,247,242,0.97)',
        backdropFilter: transparent ? 'none' : 'blur(16px)',
        borderBottom: transparent ? 'none' : '1px solid rgba(168,130,90,0.15)',
        transition:   'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* ── Brand ── */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Image
              src={transparent ? '/logo-with-bg.png' : '/logo.png'}
              alt="Mum's Kitchen"
              width={44}
              height={44}
              style={{ objectFit: 'contain', transition: 'opacity 0.3s ease' }}
              priority
            />
            <div>
              <div className="font-display" style={{ fontSize: '19px', fontWeight: 700, color: brandColor, lineHeight: 1.1, transition: 'color 0.3s ease' }}>
                Mum's Kitchen
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: subColor, transition: 'color 0.3s ease' }}>
                Tranmere · Authentic Korean
              </div>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="nav-links">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  textDecoration: 'none',
                  fontSize:       '13.5px',
                  fontWeight:     isActive(l.href) ? 600 : 500,
                  color:          isActive(l.href) ? activeColor : linkColor,
                  padding:        '6px 14px',
                  borderRadius:   '8px',
                  background:     isActive(l.href) ? (transparent ? 'rgba(255,255,255,0.12)' : 'rgba(44,26,14,0.06)') : 'transparent',
                  transition:     'all 0.2s ease',
                  letterSpacing:  '0.01em',
                  position:       'relative',
                }}
              >
                {l.label}
                {isActive(l.href) && (
                  <span style={{
                    position:     'absolute',
                    bottom:       '-1px',
                    left:         '50%',
                    transform:    'translateX(-50%)',
                    width:        '18px',
                    height:       '2px',
                    borderRadius: '2px',
                    background:   'var(--red-korean)',
                  }} />
                )}
              </Link>
            ))}
          </div>

          {/* ── Right actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* Phone icon — desktop only */}
            <a
              href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`}
              title={process.env.NEXT_PUBLIC_RESTAURANT_PHONE}
              className="nav-links"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width:          '36px',
                height:         '36px',
                borderRadius:   '9px',
                border:         `1px solid ${transparent ? 'rgba(255,255,255,0.2)' : 'var(--stone-light)'}`,
                color:          transparent ? 'rgba(232,224,213,0.9)' : 'var(--brown-mid)',
                textDecoration: 'none',
                transition:     'all 0.2s ease',
              }}
            >
              <Phone size={15} />
            </a>

            {/* Cart button */}
            <button
              onClick={() => window.dispatchEvent(new Event('open-cart'))}
              style={{
                position:    'relative',
                background:  transparent ? 'rgba(255,255,255,0.12)' : 'var(--brown-dark)',
                border:      `1px solid ${transparent ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                borderRadius: '9px',
                padding:     '7px 13px',
                cursor:      'pointer',
                display:     'flex',
                alignItems:  'center',
                gap:         '5px',
                color:       'white',
                fontSize:    '13px',
                fontWeight:  500,
                transition:  'all 0.2s ease',
              }}
            >
              <ShoppingBag size={15} />
              <span className="nav-links">Cart</span>
              {itemCount > 0 && (
                <span style={{
                  position:       'absolute',
                  top:            '-6px',
                  right:          '-6px',
                  minWidth:       '18px',
                  height:         '18px',
                  padding:        '0 4px',
                  background:     'var(--red-korean)',
                  borderRadius:   '9px',
                  fontSize:       '10px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontWeight:     700,
                }}>
                  {itemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {session ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenu(v => !v)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    background:   transparent ? 'rgba(255,255,255,0.12)' : 'var(--stone-light)',
                    border:       `1px solid ${transparent ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                    borderRadius: '20px',
                    padding:      '6px 12px',
                    cursor:       'pointer',
                    fontSize:     '13px',
                    fontWeight:   500,
                    color:        transparent ? 'white' : 'var(--brown-dark)',
                    transition:   'all 0.2s ease',
                  }}
                >
                  <User size={14} />
                  <span className="nav-links">{session.user?.name?.split(' ')[0]}</span>
                </button>

                {userMenu && (
                  <>
                    <div onClick={() => setUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                    <div style={{
                      position:  'absolute',
                      right:     0,
                      top:       '46px',
                      background:'white',
                      border:    '1px solid var(--stone-light)',
                      borderRadius: '14px',
                      boxShadow: '0 12px 40px rgba(44,26,14,0.14)',
                      overflow:  'hidden',
                      minWidth:  '190px',
                      zIndex:    99,
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--stone-light)', background: '#faf7f2' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brown-dark)' }}>{session.user?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginTop: '2px' }}>{session.user?.email}</div>
                      </div>
                      <Link href="/dashboard" onClick={() => setUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 16px', textDecoration: 'none', color: 'var(--brown-dark)', fontSize: '13px' }}>
                        <LayoutDashboard size={14} color="var(--brown-mid)" /> My Dashboard
                      </Link>
                      {(session.user as any)?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 16px', textDecoration: 'none', color: 'var(--red-korean)', fontSize: '13px', fontWeight: 600, borderTop: '1px solid var(--stone-light)' }}>
                          <ChefHat size={14} /> Admin Panel
                        </Link>
                      )}
                      <button onClick={() => { signOut(); setUserMenu(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 16px', background: 'none', border: 'none', borderTop: '1px solid var(--stone-light)', cursor: 'pointer', color: '#e74c3c', fontSize: '13px', textAlign: 'left', fontFamily: 'inherit' }}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="nav-links"
                style={{ background: 'var(--red-korean)', color: 'white', padding: '7px 18px', borderRadius: '20px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="show-mobile"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: transparent ? 'white' : 'var(--brown-dark)', padding: '4px', transition: 'color 0.3s ease' }}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <div style={{
          overflow:   'hidden',
          maxHeight:  open ? '600px' : '0',
          transition: 'max-height 0.35s ease',
          background: 'var(--warm-white)',
          borderTop:  open ? '1px solid var(--stone-light)' : 'none',
        }}>
          <div style={{ padding: '8px 16px 20px' }}>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  padding:        '13px 8px',
                  borderBottom:   '1px solid var(--stone-light)',
                  textDecoration: 'none',
                  fontSize:       '15px',
                  fontWeight:     isActive(l.href) ? 600 : 400,
                  color:          isActive(l.href) ? 'var(--brown-dark)' : 'var(--brown-mid)',
                }}
              >
                {l.label}
                {isActive(l.href) && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--red-korean)' }} />}
              </Link>
            ))}

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brown-mid)', textDecoration: 'none', fontSize: '14px', padding: '4px 8px' }}
              >
                <Phone size={15} color="var(--red-korean)" /> {process.env.NEXT_PUBLIC_RESTAURANT_PHONE}
              </a>

              {session ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href="/dashboard" onClick={() => setOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--stone-light)', borderRadius: '10px', textDecoration: 'none', color: 'var(--brown-dark)', fontSize: '13px', fontWeight: 500 }}>
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <button onClick={() => { signOut(); setOpen(false); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#fef2f2', borderRadius: '10px', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit' }}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: 'var(--red-korean)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
        }
        @media (max-width: 900px) {
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
