import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    "Get in touch with Mum's Kitchen Tranmere. Call, email or visit us at 66 Reid Avenue, Tranmere SA 5073. Open 7 days.",
  alternates: { canonical: '/contact' },
  openGraph: {
    url:         '/contact',
    title:       "Contact Us | Mum's Kitchen Tranmere",
    description: "Call, email or visit Mum's Kitchen at 66 Reid Avenue, Tranmere SA 5073.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
