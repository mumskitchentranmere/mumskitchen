import Link from 'next/link';
import { ChefHat, Phone, MapPin, Clock, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{ background: 'var(--brown-dark)', color: 'var(--stone-light)', marginTop: '80px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', background: 'var(--red-korean)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChefHat size={18} color="white" />
              </div>
              <div>
                <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Mum's Kitchen</div>
                <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tranmere · Korean Cuisine</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'rgba(232,224,213,0.7)' }}>Authentic Korean dishes freshly prepared to order in the heart of Tranmere, South Australia.</p>
            <p style={{ fontSize: '11px', color: 'rgba(232,224,213,0.4)', marginTop: '12px' }}>ABN 61 615 671 935</p>
          </div>
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Navigate</h3>
            {[['Menu', '/menu'], ['Order Online', '/order'], ['Book a Table', '/dine-in'], ['Contact', '/contact']].map(([label, href]) => (
              <div key={href} style={{ marginBottom: '8px' }}>
                <Link href={href} style={{ fontSize: '14px', color: 'rgba(232,224,213,0.7)', textDecoration: 'none' }}>{label}</Link>
              </div>
            ))}
          </div>
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Find Us</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <MapPin size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '13px', color: 'rgba(232,224,213,0.7)' }}>66 Reid Avenue<br />Tranmere SA 5073</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <Phone size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`} style={{ fontSize: '13px', color: 'rgba(232,224,213,0.7)', textDecoration: 'none' }}>
                {process.env.NEXT_PUBLIC_RESTAURANT_PHONE}
              </a>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Mail size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <a href="mailto:mumskitchentranmere@gmail.com" style={{ fontSize: '12px', color: 'rgba(232,224,213,0.7)', textDecoration: 'none' }}>mumskitchentranmere@gmail.com</a>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '16px' }}>Hours</h3>
            {[['Mon – Thu', '11:30am – 9:30pm'], ['Fri – Sat', '11:30am – 10:30pm'], ['Sunday', '12:00pm – 9:00pm']].map(([day, hrs]) => (
              <div key={day} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
                <Clock size={12} color="var(--gold)" />
                <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.5)', minWidth: '70px' }}>{day}</span>
                <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.7)' }}>{hrs}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(232,224,213,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.4)' }}>© 2025 Mum's Kitchen. All rights reserved.</span>
          <span style={{ fontSize: '12px', color: 'rgba(232,224,213,0.4)' }}>Tranmere, South Australia 🇦🇺</span>
        </div>
      </div>
    </footer>
  );
}
