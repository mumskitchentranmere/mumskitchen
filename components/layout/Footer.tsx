import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail } from 'lucide-react';
import { OpenStatus } from './OpenStatus';
import { FooterHours } from './FooterHours';

export function Footer() {
  return (
    <footer style={{ background: 'var(--brown-dark)', color: 'var(--stone-light)', marginTop: '80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 24px 32px' }}>
        <div className="footer-grid">

          {/* Brand column */}
          <div>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              {/* Dark footer bg → use logo-with-bg so it's visible */}
              <Image src="/logo-with-bg.png" alt="Mum's Kitchen" width={52} height={52} style={{ objectFit: 'contain', borderRadius: '8px' }} />
              <div>
                <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Mum's Kitchen</div>
                <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tranmere · Korean Cuisine</div>
              </div>
            </Link>
            <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'rgba(232,224,213,0.65)' }}>
              Authentic Korean &amp; Bangladeshi dishes freshly prepared to order in Tranmere, South Australia. 100% Halal.
            </p>
            <OpenStatus />
          </div>

          {/* Navigate */}
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '18px' }}>Navigate</h3>
            {[
              ['Menu',         '/menu'],
              ['Order Online', '/order'],
              ['Contact',      '/contact'],
              ['Reviews',      '/reviews'],
            ].map(([label, href]) => (
              <div key={href} style={{ marginBottom: '10px' }}>
                <Link href={href} style={{ fontSize: '14px', color: 'rgba(232,224,213,0.65)', textDecoration: 'none' }}>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '18px' }}>Find Us</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <MapPin size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '13px', color: 'rgba(232,224,213,0.65)', lineHeight: 1.6 }}>
                66 Reid Avenue<br />Tranmere SA 5073
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <Phone size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`} style={{ fontSize: '13px', color: 'rgba(232,224,213,0.65)', textDecoration: 'none' }}>
                {process.env.NEXT_PUBLIC_RESTAURANT_PHONE}
              </a>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Mail size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <a href={`mailto:${process.env.NEXT_PUBLIC_RESTAURANT_EMAIL}`} style={{ fontSize: '13px', color: 'rgba(232,224,213,0.65)', textDecoration: 'none', wordBreak: 'break-all' }}>
                {process.env.NEXT_PUBLIC_RESTAURANT_EMAIL}
              </a>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '18px' }}>Opening Hours</h3>
            <FooterHours />
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(232,224,213,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.35)' }}>© {new Date().getFullYear()} Mum's Kitchen. All rights reserved.</span>
          <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.35)' }}>
            Designed &amp; developed by{' '}
            <a href="https://asrafuzzamankhan.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              Asrafuzzaman Khan
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
