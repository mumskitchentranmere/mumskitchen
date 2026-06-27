import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Online — Takeaway',
  description:
    "Order Korean & Bangladeshi food online from Mum's Kitchen Tranmere. Quick pickup, no delivery fee. Ready in minutes.",
  alternates: { canonical: '/order' },
  openGraph: {
    url:         '/order',
    title:       "Order Online — Takeaway | Mum's Kitchen Tranmere",
    description: "Order your favourite Korean & Bangladeshi dishes online. Fast pickup.",
  },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
