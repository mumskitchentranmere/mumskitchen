import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: "Mum's Kitchen | Authentic Korean Cuisine — Tranmere SA",
  description: "Authentic Korean cuisine in Tranmere, South Australia. Order online for takeaway or delivery, or book a table for dine-in. 66 Reid Avenue, Tranmere SA 5073.",
  keywords: "Korean restaurant Tranmere, Korean food Adelaide, Korean fried chicken Adelaide, Bibimbap Adelaide",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
          <Toaster position="top-right" toastOptions={{ style: { background: '#2C1A0E', color: '#FAF7F2', border: '1px solid #6B3A1F', fontFamily: 'Outfit, sans-serif' } }} />
          <Navbar />
          <CartDrawer />
          <main>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
