'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Calendar, User, Clock, Star, PenLine } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';
import { ReviewForm } from '@/components/reviews/ReviewForm';

const SC: Record<string,string> = { pending:'#f59e0b',confirmed:'#3b82f6',preparing:'#f97316',ready:'#22c55e',delivered:'#22c55e',cancelled:'#ef4444',completed:'#22c55e' };

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders'|'bookings'|'reviews'>('orders');
  const [loading, setLoading]   = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/reviews?limit=100&status=all').then(r => r.json()),
    ]).then(([o, b, rv]) => {
      setOrders(Array.isArray(o) ? o : []);
      setBookings(Array.isArray(b) ? b : []);
      const allReviews = (rv.reviews || []) as any[];
      setMyReviews(allReviews.filter((r: any) => r.customerEmail === session?.user?.email));
      setLoading(false);
    });
  }, [status]);

  if (status === 'loading' || loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'68px', color:'var(--brown-mid)' }}>Loading…</div>
  );

  const badge = (s: string): React.CSSProperties => ({ fontSize:'11px', padding:'3px 9px', borderRadius:'10px', fontWeight:600, background: SC[s] + '20', color: SC[s] });

  const TABS = [
    { id: 'orders',   label: 'Orders',   icon: ShoppingBag, count: orders.length },
    { id: 'bookings', label: 'Bookings', icon: Calendar,    count: bookings.length },
    { id: 'reviews',  label: 'My Reviews', icon: Star,      count: myReviews.length },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', paddingTop:'68px' }}>
      {/* Header */}
      <div style={{ background:'var(--brown-dark)', padding:'40px 24px' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ width:'50px', height:'50px', background:'rgba(200,146,42,0.2)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <User size={24} color="var(--gold)"/>
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, color:'white' }}>My Dashboard</h1>
              <p style={{ fontSize:'13px', color:'rgba(232,224,213,0.6)' }}>{session?.user?.email}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'12px', marginTop:'20px', flexWrap:'wrap' }}>
            {[['Orders', orders.length, '#3b82f6'], ['Bookings', bookings.length, '#22c55e'], ['Reviews', myReviews.length, '#C8922A']].map(([l,v,c])=>(
              <div key={String(l)} style={{ background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 20px', textAlign:'center' }}>
                <div className="font-display" style={{ fontSize:'24px', fontWeight:700, color: String(c) }}>{v}</div>
                <div style={{ fontSize:'11px', color:'rgba(232,224,213,0.5)', marginTop:'2px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'28px 24px' }}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'24px', flexWrap:'wrap' }}>
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id as any)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'20px', border:'1.5px solid', borderColor: tab===id ? 'var(--red-korean)' : 'var(--stone-light)', background: tab===id ? 'var(--red-korean)' : 'white', color: tab===id ? 'white' : 'var(--brown-mid)', fontSize:'13px', fontWeight:500, cursor:'pointer', fontFamily:'Outfit, sans-serif' }}>
              <Icon size={14} /> {label} ({count})
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === 'orders' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--brown-mid)' }}>
                <ShoppingBag size={36} style={{ margin:'0 auto 12px', opacity:0.2 }}/>
                <p>No orders yet</p>
                <a href="/order" style={{ color:'var(--red-korean)', textDecoration:'none', fontSize:'13px' }}>Order now →</a>
              </div>
            ) : orders.map(o => (
              <div key={o._id} style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:500, color:'var(--brown-mid)', marginBottom:'2px' }}>#{o._id.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize:'12px', color:'var(--brown-mid)', display:'flex', alignItems:'center', gap:'4px' }}>
                    <Clock size={11}/>{new Date(o.createdAt).toLocaleDateString('en-AU',{dateStyle:'medium'})}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'12px', background:'var(--stone-light)', color:'var(--brown-mid)', padding:'3px 8px', borderRadius:'8px', textTransform:'capitalize' }}>{o.orderType}</span>
                  <span style={badge(o.status)}>{o.status}</span>
                  <span className="font-display" style={{ fontSize:'18px', fontWeight:700, color:'var(--red-korean)' }}>${o.total?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {bookings.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--brown-mid)' }}>
                <Calendar size={36} style={{ margin:'0 auto 12px', opacity:0.2 }}/>
                <p>No bookings yet</p>
                <a href="/dine-in" style={{ color:'var(--red-korean)', textDecoration:'none', fontSize:'13px' }}>Book a table →</a>
              </div>
            ) : bookings.map(b => (
              <div key={b._id} style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
                <div>
                  <div className="font-display" style={{ fontSize:'20px', fontWeight:700, color:'var(--brown-dark)' }}>Table {b.tableNumber}</div>
                  <div style={{ fontSize:'12px', color:'var(--brown-mid)' }}>{b.date} at {b.time} · {b.partySize} guests</div>
                </div>
                <span style={badge(b.status)}>{b.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:600, color:'var(--brown-dark)' }}>Your Reviews</h2>
              <button onClick={() => setShowWriteReview(true)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'var(--brown-dark)', color:'white', border:'none', borderRadius:'10px', padding:'8px 16px', cursor:'pointer', fontSize:'13px', fontWeight:500, fontFamily:'Outfit, sans-serif' }}>
                <PenLine size={13}/> Write Review
              </button>
            </div>
            {myReviews.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--brown-mid)' }}>
                <Star size={36} style={{ margin:'0 auto 12px', opacity:0.2 }}/>
                <p>You haven't written any reviews yet</p>
                <button onClick={() => setShowWriteReview(true)} style={{ background:'none', border:'none', color:'var(--red-korean)', cursor:'pointer', fontSize:'13px', fontFamily:'Outfit, sans-serif', marginTop:'8px' }}>Write your first review →</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {myReviews.map(r => (
                  <div key={r._id} style={{ background:'white', borderRadius:'14px', padding:'16px', border:'1px solid var(--stone-light)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                      <div>
                        <StarRating rating={r.rating} size={14} />
                        <div style={{ fontSize:'14px', fontWeight:600, color:'var(--brown-dark)', marginTop:'4px' }}>{r.title}</div>
                        {r.menuItemName && <div style={{ fontSize:'11px', color:'var(--brown-mid)' }}>re: {r.menuItemName}</div>}
                      </div>
                      <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'8px', fontWeight:600, background: r.status==='approved'?'#f0fdf4':r.status==='rejected'?'#fef2f2':'#fef3c7', color: r.status==='approved'?'#16a34a':r.status==='rejected'?'#dc2626':'#92400e' }}>{r.status}</span>
                    </div>
                    <p style={{ fontSize:'13px', color:'var(--brown-mid)', lineHeight:1.6 }}>{r.body}</p>
                    {r.adminReply && (
                      <div style={{ marginTop:'10px', background:'#faf7f2', borderLeft:'3px solid var(--gold)', padding:'10px 12px', borderRadius:'0 8px 8px 0', fontSize:'12px' }}>
                        <strong style={{ color:'var(--brown-accent)' }}>Mum's Kitchen replied:</strong> {r.adminReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Write review modal */}
      {showWriteReview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(44,26,14,0.55)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={() => setShowWriteReview(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <ReviewForm type="restaurant" onSuccess={() => { setShowWriteReview(false); }} onCancel={() => setShowWriteReview(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
