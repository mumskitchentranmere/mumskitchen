'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, ShoppingBag, ChefHat, Star, Users, Clock } from 'lucide-react';

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

  return (
    <aside style={{ width: '220px', background: 'var(--brown-dark)', position: 'fixed', left: 0, top: '68px', bottom: 0, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <ChefHat size={18} color="var(--gold)" />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em' }}>ADMIN PANEL</span>
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
  );
}
