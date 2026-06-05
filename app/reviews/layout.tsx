import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description:
    "See what our customers say about Mum's Kitchen Tranmere. Read authentic reviews and share your own dining experience.",
  alternates: { canonical: '/reviews' },
  openGraph: {
    url:         '/reviews',
    title:       "Customer Reviews | Mum's Kitchen Tranmere",
    description: "Read what our customers say about Mum's Kitchen Tranmere.",
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
