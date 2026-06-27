'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Phone, MapPin, Clock, Star } from 'lucide-react';


function FeaturedReviews() {
  const [reviews, setReviews] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetch('/api/reviews?featured=true&type=restaurant&limit=3')
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => { });
  }, []);
  if (reviews.length === 0) return null;
  return (
    <section style={{ padding: '72px 24px', background: 'var(--cream)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--red-korean)', marginBottom: '10px' }}>What Guests Say</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, color: 'var(--brown-dark)' }}>Featured Reviews</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {reviews.map((r: any) => (
            <div key={r._id} style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)' }}>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={i < r.rating ? '#C8922A' : '#E8E0D5'} stroke="#C8922A" strokeWidth="1" />
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--brown-mid)', lineHeight: 1.7, marginBottom: '12px', fontStyle: 'italic' }}>"{r.body?.slice(0, 160)}{r.body?.length > 160 ? '…' : ''}"</p>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brown-dark)' }}>— {r.customerName}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a href="/reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1.5px solid var(--brown-accent)', color: 'var(--brown-accent)', padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            Read All Reviews →
          </a>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/menu?featured=true').then(r => r.json()).then(d => setFeatured(Array.isArray(d) ? d : [])).catch(() => { });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2C1A0E 0%, #4A2210 40%, #6B3A1F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: '68px' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', pointerEvents: 'none' }}>
          <span className="font-display" style={{ fontSize: 'clamp(100px, 18vw, 260px)', fontWeight: 700, color: 'rgba(200,146,42,0.06)', whiteSpace: 'nowrap', userSelect: 'none', lineHeight: 1 }}>한국 요리</span>
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 clamp(16px, 5vw, 24px)', maxWidth: '800px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(200,146,42,0.15)', border: '1px solid rgba(200,146,42,0.3)', color: '#E8B84B', fontSize: '12px', fontWeight: 500, padding: '6px 16px', borderRadius: '20px', marginBottom: '28px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <Star size={11} fill="currentColor" /> Tranmere's Authentic Korean Kitchen
          </div>
          <h1 className="font-display" style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 700, color: 'white', lineHeight: 1.05, marginBottom: '8px' }}>Mum's</h1>
          <h1 className="font-display" style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 700, color: '#C8922A', lineHeight: 1.05, marginBottom: '28px', fontStyle: 'italic' }}>Kitchen</h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(232,224,213,0.8)', lineHeight: 1.7, marginBottom: '40px', maxWidth: '540px', margin: '0 auto 40px' }}>
            Korean traditional authentic food, freshly prepared to order. Fried Chicken, Bibimbap, Rice Bowls, Soups & more delicious dishes.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/order" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--red-korean)', color: 'white', padding: '14px 32px', borderRadius: '14px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
              Order Online <ArrowRight size={17} />
            </Link>
            <Link href="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '14px 32px', borderRadius: '14px', textDecoration: 'none', fontSize: '15px', fontWeight: 500, backdropFilter: 'blur(8px)' }}>
              View Menu
            </Link>
          </div>
          <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '56px', flexWrap: 'wrap' }}>
            {['🕐 Open Tue–Sun', '📍 Tranmere SA', '✨ Freshly made'].map(label => (
              <span key={label} style={{ fontSize: '13px', color: 'rgba(232,224,213,0.55)' }}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Quick order strip */}
      <section style={{ background: 'var(--brown-dark)', padding: '0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }} className="order-strip">
          {[{ icon: '🥡', title: 'Order Online', desc: 'Order & pick up fresh', href: '/order' }, { icon: '📋', title: 'Full Menu', desc: 'Browse all our dishes', href: '/menu' }, { icon: '📞', title: 'Call to Order', desc: 'Speak to us directly', href: 'tel:+61406878202' }].map(s => (
            <Link key={s.title} href={s.href} style={{ padding: '28px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
              <span style={{ fontSize: '28px' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(232,224,213,0.5)' }}>{s.desc}</div>
              </div>
              <ArrowRight size={14} color="rgba(200,146,42,0.7)" style={{ marginLeft: 'auto' }} />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured dishes */}
      {featured.length > 0 && (
        <section style={{ padding: 'clamp(40px,6vw,80px) clamp(12px,4vw,24px)', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--red-korean)', marginBottom: '10px' }}>Freshly Prepared</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, color: 'var(--brown-dark)' }}>Chef's Favourites</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 'clamp(12px,2vw,20px)' }}>
            {featured.slice(0, 6).map((item: any) => (
              <div key={item._id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--stone-light)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', overflow: 'hidden', background: 'var(--stone-light)', flexShrink: 0 }}>
                  {(item.primaryImage || item.images?.[0]) && (
                    <img src={item.primaryImage || item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>{item.name}</h3>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--red-korean)', flex: 1, marginBottom: '12px' }}>from ${item.price.toFixed(2)}</p>
                  <Link href="/order" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', background: 'var(--red-korean)', color: 'white', padding: '8px 16px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
                    Order Now <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link href="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--brown-accent)', color: 'var(--brown-accent)', padding: '12px 28px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              View Full Menu <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}

      {/* About */}
      <section style={{ background: 'var(--warm-white)', padding: 'clamp(40px,6vw,80px) clamp(12px,4vw,24px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="about-grid">
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--red-korean)', marginBottom: '12px' }}>About Us</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: 'var(--brown-dark)', lineHeight: 1.2, marginBottom: '20px' }}>Korean Traditional Authentic Food</h2>
            <p style={{ fontSize: '15px', color: 'var(--brown-mid)', lineHeight: 1.8, marginBottom: '16px' }}>
              At Mum's Kitchen in Tranmere, every dish is freshly prepared to order using authentic Korean recipes and traditional flavours. From crispy Korean Fried Chicken to warming Jjigae stews, we bring the heart of Korean home cooking to Adelaide.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--brown-mid)', lineHeight: 1.8, marginBottom: '32px' }}>
              Dine in, takeaway, or get delivery right to your door.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brown-dark)', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                <Phone size={15} /> Call to Order
              </a>
              <Link href="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1.5px solid var(--stone-light)', color: 'var(--brown-dark)', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                See Menu <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[['🍗', 'Korean Fried Chicken', 'Wings, Drumsticks, Boneless'], ['🍲', 'Bibimbap', 'Beef, Spicy, Vegetable'], ['🍜', 'Rice Bowls', 'Bulgogi, Spicy, Mild Chicken'], ['🥘', 'Soups & Stews', 'Kimchi Jjigae, Doenjang']].map(([icon, title, desc]) => (
              <div key={title} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid var(--stone-light)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Featured Reviews Strip */}
      <FeaturedReviews />

      {/* Contact Strip */}
      <section style={{ background: 'var(--brown-dark)', padding: '56px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
          {[
            { icon: <MapPin size={22} color="#C8922A" />, title: 'Address', body: '66 Reid Avenue\nTranmere SA 5073' },
            { icon: <Phone size={22} color="#C8922A" />, title: 'Phone', body: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202' },
            { icon: <Clock size={22} color="#C8922A" />, title: 'Hours', body: 'Tue–Thu: 5–10 pm\nFri–Sun: 10 am–3 pm · 5–10 pm\nMon: Closed' },
          ].map(c => (
            <div key={c.title}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>{c.icon}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8922A', marginBottom: '8px' }}>{c.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(232,224,213,0.7)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
// Note: Featured reviews section injected via client component below
