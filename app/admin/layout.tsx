import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, UtensilsCrossed, Columns3, ShoppingBag, Calendar, ChefHat, Star } from 'lucide-react';

const NAV = [
  { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/menu',     label: 'Menu Items', icon: UtensilsCrossed },
  { href: '/admin/tables',   label: 'Tables',     icon: Columns3 },
  { href: '/admin/orders',   label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/bookings', label: 'Bookings',   icon: Calendar },
  { href: '/admin/reviews',  label: 'Reviews',    icon: Star },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') redirect('/login');
  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '68px', background: 'var(--cream)', fontFamily: 'Outfit, sans-serif' }}>
      <aside style={{ width: '220px', background: 'var(--brown-dark)', position: 'fixed', left: 0, top: '68px', bottom: 0, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <ChefHat size={18} color="var(--gold)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em' }}>ADMIN PANEL</span>
        </div>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', color: 'rgba(232,224,213,0.7)', transition: 'all 0.15s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.07)'; el.style.color = 'white'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'rgba(232,224,213,0.7)'; }}>
            <Icon size={15} />{label}
          </Link>
        ))}
      </aside>
      <main style={{ flex: 1, marginLeft: '220px', padding: '28px 32px', overflowY: 'auto' }}>{children}</main>
    </div>
  );
}
