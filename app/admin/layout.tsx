import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'admin') redirect('/login');
  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '68px', background: 'var(--cream)', fontFamily: 'Outfit, sans-serif' }}>
      <AdminSidebar />
      <main style={{ flex: 1, marginLeft: '220px', padding: '28px 32px', overflowY: 'auto' }}>{children}</main>
    </div>
  );
}
