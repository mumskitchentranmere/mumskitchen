'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ShoppingBag, CreditCard, CheckCircle, Lock, Printer, MapPin, Phone, Mail } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const RESTAURANT = {
  name:    "Mum's Kitchen",
  tagline: 'Authentic Korean & Bangladeshi Cuisine',
  address: '66 Reid Avenue, Tranmere SA 5073',
  phone:   process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202',
  email:   process.env.NEXT_PUBLIC_RESTAURANT_EMAIL || 'mumskitchentranmere@gmail.com',
  halal:   true,
};

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

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const [step, setStep]             = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading]       = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', phone: '', pickupTime: '', instructions: '' });
  const [savedOrder, setSavedOrder] = useState<any>(null);
  const [orderDate]                 = useState(new Date());

  const orderTotal = total();

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

    setLoading(true);
    try {
      const or = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:        form.name.trim(),
          customerEmail:       form.email.trim().toLowerCase(),
          customerPhone:       form.phone.trim(),
          orderType:           'takeaway',
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Preferred Pickup Time <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <input type="time" value={form.pickupTime}
                    onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))}
                    style={inp} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Special Instructions <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                  <textarea rows={2} value={form.instructions}
                    onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                    placeholder="Allergies, no spicy, extra sauce…"
                    style={{ ...inp, resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: loading ? '#6B3A1F' : 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '15px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                  <CreditCard size={16} /> {loading ? 'Creating order…' : 'Continue to Payment'}
                </button>
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
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Order for {form.name}</div>
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
                    Thank you, <strong style={{ color: 'var(--brown-dark)' }}>{form.name}</strong>! Your takeaway order is being prepared.
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
                      {/* Restaurant info */}
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

                      {/* Order number + label */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 600, color: 'var(--red-korean)' }}>🥡 Takeaway</div>
                        {form.pickupTime && (
                          <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginTop: '3px' }}>Pickup: {form.pickupTime}</div>
                        )}
                        <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          <Lock size={9} /> Paid · Stripe
                        </div>
                      </div>
                    </div>

                    {/* Items table */}
                    <div style={{ marginBottom: '18px' }}>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', padding: '8px 10px', background: 'var(--brown-dark)', borderRadius: '8px 8px 0 0', fontSize: '10px', fontWeight: 700, color: 'rgba(232,224,213,0.6)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <span>Item</span>
                        <span style={{ textAlign: 'right' }}>Unit Price</span>
                        <span style={{ textAlign: 'right', minWidth: '72px' }}>Amount</span>
                      </div>
                      {/* Rows */}
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
                        <span>Subtotal (excl. GST)</span>
                        <span>${exGst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '6px' }}>
                        <span>GST (10%)</span>
                        <span>${gst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '12px' }}>
                        <span>Delivery</span>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Free</span>
                      </div>
                      <div style={{ borderTop: '1.5px solid var(--stone-light)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div>
                          <span className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brown-dark)' }}>Total Paid</span>
                          <div style={{ fontSize: '10px', color: 'var(--brown-mid)', marginTop: '1px' }}>GST included: ${gst.toFixed(2)}</div>
                        </div>
                        <span className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--red-korean)' }}>${receiptTotal.toFixed(2)} AUD</span>
                      </div>
                    </div>

                    {/* Special instructions */}
                    {form.instructions && (
                      <div style={{ marginTop: '14px', background: '#fdf0ee', borderLeft: '3px solid var(--red-korean)', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: '12px', color: 'var(--brown-dark)' }}>
                        <strong>Special instructions:</strong> {form.instructions}
                      </div>
                    )}

                    {/* Receipt footer */}
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
              <div style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '16px' }}>{items.length} item{items.length !== 1 ? 's' : ''} · Takeaway</div>

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
