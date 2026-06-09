import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { OrderNotifications } from '@/components/admin/OrderNotifications';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') redirect('/login');
  return (
    <div className="admin-layout" style={{ background: 'var(--cream)', fontFamily: 'Outfit, sans-serif' }}>
      <AdminSidebar />
      <OrderNotifications />
      <main className="admin-main">{children}</main>
    </div>
  );
}
