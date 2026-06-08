'use client';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ShoppingBag, CreditCard, CheckCircle, Lock, Printer, MapPin, Phone, Mail, Download, UtensilsCrossed, Package } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const RESTAURANT = {
  name:    "Mum's Kitchen",
  tagline: 'Authentic Korean & Bangladeshi Cuisine',
  address: '66 Reid Avenue, Tranmere SA 5073',
  phone:   process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202',
  email:   process.env.NEXT_PUBLIC_RESTAURANT_EMAIL || 'mumskitchentranmere@gmail.com',
  halal:   true,
};

// ── Opening hours check ──────────────────────────────────────────────────────
const HOURS: Record<number, { open: number; close: number }[]> = {
  0: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }],
  1: [],
  2: [{ open: 17*60, close: 22*60 }],
  3: [{ open: 17*60, close: 22*60 }],
  4: [{ open: 17*60, close: 22*60 }],
  5: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }],
  6: [{ open: 10*60, close: 15*60 }, { open: 17*60, close: 22*60 }],
};

function fmtMin(m: number) {
  const h = Math.floor(m / 60); const mn = m % 60;
  const ap = h >= 12 ? 'pm' : 'am'; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${mn ? `:${String(mn).padStart(2,'0')}` : ''}${ap}`;
}

function periodsToMap(periods: any[]): Record<number, { open: number; close: number }[]> {
  const map: Record<number, { open: number; close: number }[]> = { 0:[],1:[],2:[],3:[],4:[],5:[],6:[] };
  for (const p of periods) {
    const day = p.open?.day; if (day == null) continue;
    const ot = p.open?.time ?? '0000'; const ct = p.close?.time ?? '2359';
    map[day].push({ open: parseInt(ot.slice(0,2))*60+parseInt(ot.slice(2)), close: parseInt(ct.slice(0,2))*60+parseInt(ct.slice(2)) });
  }
  for (const d of Object.values(map)) d.sort((a,b)=>a.open-b.open);
  return map;
}

function getOpenStatus(hours: Record<number, { open: number; close: number }[]>) {
  const now = new Date(); const day = now.getDay(); const mins = now.getHours()*60+now.getMinutes();
  const today = hours[day] ?? [];
  for (const s of today) {
    if (mins >= s.open && mins < s.close) {
      const left = s.close - mins;
      return { isOpen: true, label: left <= 60 ? `Open · Closes in ${left} min` : `Open · Closes ${fmtMin(s.close)}` };
    }
  }
  const later = today.find(s => s.open > mins);
  if (later) return { isOpen: false, label: `Closed · Opens ${fmtMin(later.open)} today` };
  const DN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for (let i = 1; i <= 7; i++) {
    const next = hours[(day+i)%7];
    if (next?.length) {
      const name = DN[(day+i)%7];
      return { isOpen: false, label: i===1 ? `Closed · Opens ${fmtMin(next[0].open)} tomorrow` : `Closed · Opens ${name} ${fmtMin(next[0].open)}` };
    }
  }
  return { isOpen: false, label: 'Currently closed' };
}

// ── Stripe PayForm ────────────────────────────────────────────────────────────
function PayForm({ clientSecret, total, onSuccess }: { clientSecret: string; total: number; onSuccess: () => void }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const r = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    });
    if (r.error) { toast.error(r.error.message || 'Payment failed'); setLoading(false); return; }
    if (r.paymentIntent?.status === 'succeeded') onSuccess();
    else setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <div style={{ background: '#f9f5f0', border: '1.5px solid var(--stone-light)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
        <CardElement options={{ style: { base: { color: '#2C1A0E', fontSize: '15px', fontFamily: 'Outfit, sans-serif', '::placeholder': { color: '#a08060' } } } }} />
      </div>
      <button type="submit" disabled={!stripe || loading}
        style={{ width: '100%', background: loading ? '#6B3A1F' : 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
        <Lock size={16} /> {loading ? 'Processing payment…' : `Pay $${total.toFixed(2)} AUD`}
      </button>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--brown-mid)', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <Lock size={10} /> Secured by Stripe · Your card details are never stored
      </p>
    </form>
  );
}

// ── Main Checkout Page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const [step, setStep]             = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading]       = useState(false);
  const [orderType, setOrderType]   = useState<'takeaway' | 'dinein'>('takeaway');
  const [form, setForm]             = useState({ name: '', email: '', phone: '', pickupTime: '', instructions: '' });
  const [savedOrder, setSavedOrder] = useState<any>(null);
  const [orderDate]                 = useState(new Date());
  const [isOpen, setIsOpen]         = useState<boolean | null>(null);
  const [openLabel, setOpenLabel]   = useState('');
  const hoursRef = useRef(HOURS);

  const orderTotal = total();

  // Check opening hours on mount + every minute
  useEffect(() => {
    const tick = () => {
      const { isOpen, label } = getOpenStatus(hoursRef.current);
      setIsOpen(isOpen);
      setOpenLabel(label);
    };
    fetch('/api/places')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.opening_hours?.periods?.length) {
          hoursRef.current = periodsToMap(data.opening_hours.periods);
        }
        tick();
      })
      .catch(() => tick());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0 && step < 3) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '68px' }}>
      <div style={{ textAlign: 'center' }}>
        <ShoppingBag size={48} color="var(--brown-mid)" style={{ marginBottom: '16px', opacity: 0.3 }} />
        <h2 className="font-display" style={{ fontSize: '24px', color: 'var(--brown-dark)', marginBottom: '8px' }}>Your cart is empty</h2>
        <p style={{ fontSize: '14px', color: 'var(--brown-mid)', marginBottom: '16px' }}>Add some items before checking out.</p>
        <a href="/menu" style={{ background: 'var(--red-korean)', color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600, padding: '10px 24px', borderRadius: '10px' }}>Browse Menu →</a>
      </div>
    </div>
  );

  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) { toast.error('Please enter a valid email address'); return; }
    if (!isOpen) { toast.error('We are currently closed. Please order during opening hours.'); return; }

    setLoading(true);
    try {
      const or = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:        form.name.trim(),
          customerEmail:       form.email.trim().toLowerCase(),
          customerPhone:       form.phone.trim(),
          orderType,
          items:               items.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
          subtotal:            orderTotal,
          deliveryFee:         0,
          total:               orderTotal,
          pickupTime:          form.pickupTime,
          specialInstructions: form.instructions.trim(),
        }),
      });
      const order = await or.json();
      if (!or.ok) { toast.error(order.error || 'Failed to create order'); setLoading(false); return; }

      setSavedOrder(order);

      const pr = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderTotal, metadata: { type: 'order', orderId: order._id } }),
      });
      const data = await pr.json();
      if (!pr.ok || !data.clientSecret) { toast.error(data.error || 'Failed to initialise payment'); setLoading(false); return; }

      setClientSecret(data.clientSecret);
      setStep(2);
    } catch {
      toast.error('Network error — please try again');
    }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'white', border: '1.5px solid var(--stone-light)',
    borderRadius: '12px', padding: '11px 14px', fontSize: '14px',
    color: 'var(--brown-dark)', outline: 'none', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box',
  };

  // Receipt data
  const receiptItems    = savedOrder?.items ?? [];
  const receiptTotal    = savedOrder?.total ?? orderTotal;
  const receiptSubtotal = savedOrder?.subtotal ?? orderTotal;
  const orderId         = savedOrder?._id ? savedOrder._id.slice(-6).toUpperCase() : '';
  const gst             = receiptTotal / 11;
  const exGst           = receiptTotal - gst;

  const orderTypeLabel  = (savedOrder?.orderType ?? orderType) === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway';

  // Download receipt as self-contained HTML file
  const downloadReceipt = () => {
    const receiptEl = document.getElementById('print-receipt');
    if (!receiptEl) return;
    const cssVars = `
      :root {
        --brown-dark:#2C1A0E; --brown-mid:#6B3A1F; --brown-accent:#A8825A;
        --red-korean:#C0392B; --gold:#C8922A; --cream:#FAF7F2;
        --stone-light:#EDE3D8; --warm-white:#FAF7F2;
      }
    `;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Receipt #${orderId} — Mum's Kitchen</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#FAF7F2;font-family:Outfit,Arial,sans-serif;padding:24px;max-width:680px;margin:0 auto}
    .font-display{font-family:Outfit,Arial,sans-serif}
    ${cssVars}
  </style>
</head>
<body>${receiptEl.outerHTML}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mumskitchen-receipt-${orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 24px' }}>

        {step < 3 && (
          <h1 className="font-display" style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '32px' }}>Checkout</h1>
        )}

        <div className="checkout-grid">
          <div>
            {/* Step indicator */}
            {step < 3 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', alignItems: 'center' }}>
                {['Your Details', 'Payment'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, background: step > i + 1 ? '#16a34a' : step === i + 1 ? 'var(--red-korean)' : 'var(--stone-light)', color: step >= i + 1 ? 'white' : 'var(--brown-mid)' }}>
                        {step > i + 1 ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--brown-dark)' : 'var(--brown-mid)' }}>{s}</span>
                    </div>
                    {i < 1 && <div style={{ flex: 1, height: '2px', background: step > 1 ? '#16a34a' : 'var(--stone-light)', margin: '0 10px', borderRadius: '2px' }} />}
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <form onSubmit={handleDetails} style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid var(--stone-light)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} color="var(--red-korean)" /> Your Details
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '22px' }}>We'll use these to prepare your order and send your receipt.</p>

                {/* ── Closed banner ── */}
                {isOpen === false && (
                  <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', flexShrink: 0, marginTop: '4px' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', marginBottom: '3px' }}>We're currently closed</div>
                      <div style={{ fontSize: '12px', color: '#b91c1c' }}>{openLabel} · Please come back during opening hours to place an order.</div>
                    </div>
                  </div>
                )}

                {/* ── Order type selector ── */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {([
                      { value: 'takeaway', label: 'Takeaway', icon: Package, emoji: '🥡', desc: 'Pick up your order' },
                      { value: 'dinein',   label: 'Dine-in',  icon: UtensilsCrossed, emoji: '🍽️', desc: 'Eat at the restaurant' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOrderType(opt.value)}
                        style={{
                          flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                          border: `2px solid ${orderType === opt.value ? 'var(--red-korean)' : 'var(--stone-light)'}`,
                          background: orderType === opt.value ? '#fdf0ee' : 'white',
                          textAlign: 'center', transition: 'all 0.15s', fontFamily: 'Outfit, sans-serif',
                        }}
                      >
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{opt.emoji}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: orderType === opt.value ? 'var(--red-korean)' : 'var(--brown-dark)', marginBottom: '2px' }}>{opt.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Customer fields ── */}
                {([
                  ['Full Name *', 'name', 'text', 'Your full name'],
                  ['Email Address *', 'email', 'email', 'For your order receipt'],
                  ['Phone Number *', 'phone', 'tel', 'In case we need to contact you'],
                ] as [string, string, string, string][]).map(([label, field, type, hint]) => (
                  <div key={field} style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                    <input type={type} required placeholder={hint}
                      value={(form as any)[field]}
                      onChange={e => setForm(ff => ({ ...ff, [field]: e.target.value }))}
                      style={inp} />
                  </div>
                ))}

                {orderType === 'takeaway' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Preferred Pickup Time <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                    <input type="time" value={form.pickupTime}
                      onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))}
                      style={inp} />
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Special Instructions <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <textarea rows={2} value={form.instructions}
                    onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                    placeholder="Allergies, no spicy, extra sauce…"
                    style={{ ...inp, resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={loading || isOpen === false}
                  title={isOpen === false ? 'Ordering is only available during opening hours' : undefined}
                  style={{ width: '100%', background: isOpen === false ? '#9ca3af' : loading ? '#6B3A1F' : 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: (loading || isOpen === false) ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                  {isOpen === false
                    ? <><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} /> Ordering unavailable — we're closed</>
                    : <><CreditCard size={16} /> {loading ? 'Creating order…' : 'Continue to Payment'}</>
                  }
                </button>
                {isOpen === false && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--brown-mid)', marginTop: '8px' }}>
                    {openLabel}
                  </p>
                )}
              </form>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && clientSecret && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid var(--stone-light)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="var(--red-korean)" /> Secure Payment
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '20px' }}>Your card details are encrypted and never stored.</p>

                {/* Mini order summary at payment step */}
                <div style={{ background: '#f9f5f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    Order for {form.name} · {orderType === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
                  </div>
                  {items.slice(0, 3).map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-dark)', marginBottom: '3px' }}>
                      <span>{i.quantity}× {i.name}</span>
                      <span>${(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {items.length > 3 && <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '3px' }}>…and {items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}</div>}
                  <div style={{ borderTop: '1px solid var(--stone-light)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--brown-dark)' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--red-korean)' }}>${orderTotal.toFixed(2)} AUD</span>
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#C0392B', fontFamily: 'Outfit, sans-serif' } } }}>
                  <PayForm
                    clientSecret={clientSecret}
                    total={orderTotal}
                    onSuccess={() => { clearCart(); setStep(3); toast.success('Order placed! Your receipt is below.'); }}
                  />
                </Elements>
                <button onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--brown-mid)', fontSize: '13px', cursor: 'pointer', marginTop: '14px', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← Back to details
                </button>
              </div>
            )}

            {/* ── Step 3: Receipt / Tax Invoice ── */}
            {step === 3 && (
              <div>
                {/* Success banner */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid var(--stone-light)', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ width: '68px', height: '68px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={34} color="#16a34a" />
                  </div>
                  <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Order Confirmed!</h2>
                  <p style={{ color: 'var(--brown-mid)', fontSize: '15px', marginBottom: '6px' }}>
                    Thank you, <strong style={{ color: 'var(--brown-dark)' }}>{form.name}</strong>!{' '}
                    {orderType === 'dinein' ? 'Your dine-in order is being prepared.' : 'Your takeaway order is being prepared.'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--brown-mid)' }}>
                    A receipt has been sent to <strong>{form.email}</strong>
                  </p>
                </div>

                {/* ── Receipt / Tax Invoice ── */}
                <div id="print-receipt" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--stone-light)', overflow: 'hidden', marginBottom: '20px' }}>

                  {/* Receipt header */}
                  <div style={{ background: 'var(--brown-dark)', padding: '24px 28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div>
                        <div className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: '#C8922A', letterSpacing: '0.02em' }}>{RESTAURANT.name}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.7)', marginTop: '3px', letterSpacing: '0.04em' }}>{RESTAURANT.tagline}</div>
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={10} /> {RESTAURANT.address}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={10} /> {RESTAURANT.phone}
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.6)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={10} /> {RESTAURANT.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', color: 'rgba(232,224,213,0.45)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Tax Invoice</div>
                        <div className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: 'white', fontFamily: 'monospace', letterSpacing: '0.05em' }}>#{orderId}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.5)', marginTop: '4px' }}>
                          {orderDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.5)' }}>
                          {orderDate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt body */}
                  <div style={{ padding: '24px 28px' }}>

                    {/* Customer + order meta grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
                      <div style={{ background: '#faf7f2', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Bill To</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brown-dark)' }}>{form.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '2px' }}>{form.email}</div>
                        <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '2px' }}>{form.phone}</div>
                      </div>
                      <div style={{ background: '#faf7f2', borderRadius: '10px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Order Details</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'var(--red-korean)' }}>{orderTypeLabel}</div>
                        {orderType === 'takeaway' && form.pickupTime && (
                          <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '3px' }}>Pickup: {form.pickupTime}</div>
                        )}
                        <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          <Lock size={9} /> Paid · Stripe
                        </div>
                      </div>
                    </div>

                    {/* Items table */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', padding: '8px 10px', background: 'var(--brown-dark)', borderRadius: '8px 8px 0 0', fontSize: '10px', fontWeight: 700, color: 'rgba(232,224,213,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <span>Item</span>
                        <span style={{ textAlign: 'right' }}>Unit Price</span>
                        <span style={{ textAlign: 'right', minWidth: '72px' }}>Amount</span>
                      </div>
                      {receiptItems.map((item: any, i: number) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', padding: '10px 10px', background: i % 2 === 0 ? '#fefcf9' : 'white', borderBottom: '1px solid #f0ebe4', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brown-dark)' }}>{item.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--brown-mid)', marginLeft: '8px' }}>× {item.quantity}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--brown-mid)', textAlign: 'right', whiteSpace: 'nowrap' }}>${item.price.toFixed(2)}</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brown-dark)', textAlign: 'right', minWidth: '72px', whiteSpace: 'nowrap' }}>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div style={{ background: '#faf7f2', borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '6px' }}>
                        <span>Subtotal (excl. GST)</span><span>${exGst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '6px' }}>
                        <span>GST (10%)</span><span>${gst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '12px' }}>
                        <span>Delivery</span><span style={{ color: '#16a34a', fontWeight: 600 }}>Free</span>
                      </div>
                      <div style={{ borderTop: '1.5px solid var(--stone-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brown-dark)' }}>Total Paid</span>
                          <div style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '1px' }}>GST included: ${gst.toFixed(2)}</div>
                        </div>
                        <span className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--red-korean)' }}>${receiptTotal.toFixed(2)} AUD</span>
                      </div>
                    </div>

                    {form.instructions && (
                      <div style={{ marginTop: '14px', background: '#fdf0ee', borderLeft: '3px solid var(--red-korean)', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: '12px', color: 'var(--brown-dark)' }}>
                        <strong>Special instructions:</strong> {form.instructions}
                      </div>
                    )}

                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--stone-light)', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--brown-dark)' }}>{RESTAURANT.name}</strong> · {RESTAURANT.address}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '6px' }}>
                        {RESTAURANT.phone} · {RESTAURANT.email}
                      </div>
                      <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                        🌿 All meat 100% Halal certified
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brown-mid)', marginTop: '8px' }}>Thank you for your order!</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                    <Printer size={16} /> Print Receipt
                  </button>
                  <button onClick={downloadReceipt}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                    <Download size={16} /> Download Receipt
                  </button>
                  <a href="/menu"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--red-korean)', color: 'white', padding: '12px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                    <ShoppingBag size={15} /> Order More
                  </a>
                  <a href="/"
                    style={{ display: 'flex', alignItems: 'center', background: 'var(--stone-light)', color: 'var(--brown-dark)', padding: '12px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
                    Go Home
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Sticky order summary sidebar (steps 1 & 2) */}
          {step < 3 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px', border: '1px solid var(--stone-light)', position: 'sticky', top: '84px', alignSelf: 'flex-start' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '4px' }}>Order Summary</h2>
              <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '16px' }}>
                {items.length} item{items.length !== 1 ? 's' : ''} · {orderType === 'dinein' ? '🍽️ Dine-in' : '🥡 Takeaway'}
              </div>

              {/* Open status badge */}
              {isOpen !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', padding: '7px 10px', borderRadius: '10px', background: isOpen ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${isOpen ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}` }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOpen ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isOpen ? '#15803d' : '#dc2626' }}>{openLabel}</span>
                </div>
              )}

              <div style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '16px' }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', fontSize: '13px', gap: '8px' }}>
                    <div>
                      <span style={{ color: 'var(--brown-dark)', fontWeight: 500 }}>{i.quantity}× {i.name}</span>
                      <div style={{ fontSize: '11px', color: 'var(--brown-mid)' }}>${i.price.toFixed(2)} each</div>
                    </div>
                    <span style={{ color: 'var(--brown-mid)', flexShrink: 0 }}>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--stone-light)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '4px' }}>
                  <span>GST (incl.)</span><span>${(orderTotal / 11).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brown-dark)' }}>Total</span>
                  <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${orderTotal.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '4px', textAlign: 'right' }}>AUD · GST included</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 28px;
          align-items: flex-start;
        }
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr; }
        }
        @media print {
          * { visibility: hidden !important; }
          #print-receipt,
          #print-receipt * { visibility: visible !important; }
          #print-receipt {
            position: fixed !important;
            top: 0 !important; left: 0 !important; right: 0 !important;
            width: 100% !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          body { background: white !important; margin: 0 !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
