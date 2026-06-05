'use client';
import { useState, useEffect } from 'react';
import { MenuCard } from '@/components/menu/MenuCard';
import { useCartStore } from '@/lib/cartStore';
import { ShoppingBag, Truck, CheckCircle } from 'lucide-react';
const CATS = [{ id:'all',label:'All' },{ id:'snack',label:'Snacks' },{ id:'rice-bowl',label:'Rice Bowls' },{ id:'noodle',label:'Noodles & Rice' },{ id:'bibimbap',label:'Bibimbap' },{ id:'soup',label:'Soups' },{ id:'fried-chicken',label:'Fried Chicken' },{ id:'side',label:'Sides' }];
export default function OrderPage() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [cat, setCat] = useState('all');
  const { orderType, setOrderType } = useCartStore();
  useEffect(() => {
    setLoading(true);
    fetch(`/api/menu${cat !== 'all' ? `?category=${cat}` : ''}`).then(r=>r.json()).then(d=>{setItems(Array.isArray(d)?d:[]); setLoading(false);});
  }, [cat]);
  const btn = (active: boolean): React.CSSProperties => ({ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'16px', borderRadius:'14px', border:`2px solid ${active?'var(--red-korean)':'var(--stone-light)'}`, background:active?'#fdf0ee':'white', cursor:'pointer', transition:'all 0.15s', fontFamily:'Outfit, sans-serif', color:'var(--brown-dark)', fontSize:'14px', fontWeight:active?600:400 });
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)', paddingTop:'68px' }}>
      <div style={{ background:'var(--brown-dark)', padding:'40px 24px' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
          <h1 className="font-display" style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:700, color:'white', marginBottom:'6px' }}>Order Online</h1>
          <p style={{ fontSize:'14px', color:'rgba(232,224,213,0.6)', marginBottom:'24px' }}>Choose your order type, then build your order.</p>
          <div style={{ display:'flex', gap:'12px', maxWidth:'600px' }}>
            <button style={btn(orderType==='takeaway')} onClick={()=>setOrderType('takeaway')}><ShoppingBag size={18} /><div><div>Takeaway</div><div style={{fontSize:'11px',opacity:0.6}}>Pick up at the restaurant</div></div>{orderType==='takeaway'&&<CheckCircle size={16} color="var(--red-korean)" />}</button>
            <button style={btn(orderType==='delivery')} onClick={()=>setOrderType('delivery')}><Truck size={18} /><div><div>Delivery</div><div style={{fontSize:'11px',opacity:0.6}}>To your door (+$4.99)</div></div>{orderType==='delivery'&&<CheckCircle size={16} color="var(--red-korean)" />}</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'28px' }}>
          {CATS.map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{ padding:'7px 16px', borderRadius:'20px', border:'1.5px solid', borderColor:cat===c.id?'var(--red-korean)':'var(--stone-light)', background:cat===c.id?'var(--red-korean)':'white', color:cat===c.id?'white':'var(--brown-mid)', fontSize:'12px', fontWeight:500, cursor:'pointer', transition:'all 0.15s', fontFamily:'Outfit, sans-serif' }}>{c.label}</button>)}
        </div>
        {loading ? <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:'20px' }}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{ borderRadius:'16px', height:'280px' }} />)}</div>
        : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px,1fr))', gap:'20px' }}>{items.map(item=><MenuCard key={item._id} item={item} />)}</div>}
      </div>
    </div>
  );
}
