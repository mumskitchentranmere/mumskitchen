'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, ChefHat, Star, Users, Clock, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/admin',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/menu',       label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/admin/orders',     label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/reviews',    label: 'Reviews',    icon: Star },
  { href: '/admin/employees',  label: 'Employees',  icon: Users },
  { href: '/admin/timesheets', label: 'Timesheets', icon: Clock },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="admin-hamburger"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle admin menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

      <aside className={`admin-sidebar${open ? ' open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <ChefHat size={18} color="var(--gold)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em' }}>ADMIN PANEL</span>
          {/* Close button inside sidebar on mobile */}
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,224,213,0.5)', padding: '2px', display: 'none', alignItems: 'center' }}
            className="admin-sidebar-close"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="admin-nav-link"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', textDecoration: 'none',
                fontSize: '13px', transition: 'all 0.15s',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? 'white' : 'rgba(232,224,213,0.7)',
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon size={15} />{label}
            </Link>
          );
        })}
        <style>{`
          .admin-nav-link:hover {
            background: rgba(255,255,255,0.07) !important;
            color: white !important;
          }
        `}</style>
      </aside>
    </>
  );
}
