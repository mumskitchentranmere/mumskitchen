import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Menu — Korean & Bangladeshi Dishes',
  description:
    "Explore Mum's Kitchen full menu. Korean fried chicken, Bibimbap, Bangladeshi curries, Biryani and more. All meat 100% Halal. Tranmere SA.",
  alternates: { canonical: '/menu' },
  openGraph: {
    url:         '/menu',
    title:       "Menu | Mum's Kitchen Tranmere",
    description: "Korean fried chicken, Bibimbap, Bangladeshi curries, Biryani and more. All Halal.",
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
