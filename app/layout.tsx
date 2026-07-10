import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from '@/components/providers/SessionProvider';

const BASE = (process.env.NEXTAUTH_URL || 'https://mumskitchentranmere.com.au').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE),

  title: {
    default: "Mum's Kitchen | Authentic Korean & Bangladeshi Cuisine — Tranmere SA",
    template: "%s | Mum's Kitchen Tranmere",
  },
  description:
    "Authentic Korean & Bangladeshi cuisine in Tranmere, South Australia. Order online for takeaway. Open 7 days. 66 Reid Avenue, Tranmere SA 5073.",
  keywords: [
    "Korean restaurant Tranmere",
    "Bangladeshi restaurant Adelaide",
    "Korean food Adelaide",
    "restaurant Tranmere",
    "Korean fried chicken Adelaide",
    "Bibimbap Adelaide",
    "takeaway Tranmere SA",
    "online food order Adelaide",
  ],
  authors:   [{ name: "Mum's Kitchen" }],
  creator:   "Mum's Kitchen",
  publisher: "Mum's Kitchen",

  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    type:        'website',
    locale:      'en_AU',
    url:         BASE,
    siteName:    "Mum's Kitchen",
    title:       "Mum's Kitchen | Authentic Korean & Bangladeshi Cuisine — Tranmere SA",
    description: "Authentic Korean & Bangladeshi cuisine in Tranmere. Order online for takeaway.",
    images: [
      {
        url:    '/og-image.jpg',
        width:  1200,
        height: 630,
        alt:    "Mum's Kitchen — Authentic Korean & Bangladeshi Cuisine Tranmere SA",
      },
    ],
  },

  twitter: {
    card:        'summary_large_image',
    title:       "Mum's Kitchen | Tranmere SA",
    description: "Authentic Korean & Bangladeshi cuisine. Order online for takeaway.",
    images:      ['/og-image.jpg'],
  },

  icons: {
    icon:      [{ url: '/favicon.ico' }, { url: '/logo.png', type: 'image/png' }],
    shortcut:  '/favicon.ico',
    apple:     '/logo.png',
  },

  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor:   '#2C1A0E',
  width:        'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type':    'Restaurant',
  name:       "Mum's Kitchen",
  description:"Authentic Korean & Bangladeshi cuisine in Tranmere, South Australia.",
  url:        BASE,
  telephone:  '+61406878202',
  email:      'mumskitchentranmere@gmail.com',
  address: {
    '@type':          'PostalAddress',
    streetAddress:    '66 Reid Avenue',
    addressLocality:  'Tranmere',
    addressRegion:    'SA',
    postalCode:       '5073',
    addressCountry:   'AU',
  },
  geo: {
    '@type':    'GeoCoordinates',
    latitude:   '-34.9179',
    longitude:  '138.6307',
  },
  image:              `${BASE}/og-image.jpg`,
  logo:               `${BASE}/logo.png`,
  servesCuisine:      ['Korean', 'Bangladeshi'],
  priceRange:         '$$',
  currenciesAccepted: 'AUD',
  paymentAccepted:    'Cash, Credit Card',
  hasMenu:            `${BASE}/menu`,
  acceptsReservations:'False',
  isAccessibleForFree: true,
  areaServed:         ['Tranmere', 'Adelaide', 'South Australia'],
  keywords:           'Korean restaurant, Bangladeshi restaurant, Korean fried chicken, Bibimbap, Biryani, Tranmere, Adelaide',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday'], opens: '17:00', closes: '22:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday','Saturday','Sunday'],     opens: '10:00', closes: '15:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday','Saturday','Sunday'],     opens: '17:00', closes: '22:00' },
  ],
  sameAs: [],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SessionProvider>
          <Toaster position="top-right" toastOptions={{ style: { background: '#2C1A0E', color: '#FAF7F2', border: '1px solid #6B3A1F', fontFamily: 'Poppins, sans-serif' } }} />
          <Navbar />
          <CartDrawer />
          <main>{children}</main>
          <div id="site-footer"><Footer /></div>
        </SessionProvider>
      </body>
    </html>
  );
}
