'use client';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ShoppingBag, Truck, CreditCard, CheckCircle, Lock } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PayForm({ clientSecret, total, onSuccess }: { clientSecret: string; total: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const r = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! }
    });
    if (r.error) { toast.error(r.error.message || 'Payment failed'); setLoading(false); return; }
    if (r.paymentIntent?.status === 'succeeded') onSuccess();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <div style={{ background: '#f9f5f0', border: '1.5px solid var(--stone-light)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
        <CardElement options={{ style: { base: { color: '#2C1A0E', fontSize: '15px', fontFamily: 'Outfit, sans-serif', '::placeholder': { color: '#a08060' } } } }} />
      </div>
      <button type="submit" disabled={!stripe || loading} style={{ width: '100%', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Lock size={16} /> {loading ? 'Processing…' : `Pay $${total.toFixed(2)} AUD`}
      </button>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--brown-mid)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <Lock size={10} /> Secured by Stripe · Test card: 4242 4242 4242 4242
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, total, orderType, clearCart } = useCartStore();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', pickupTime: '', instructions: '' });
  const delivery = orderType === 'delivery' ? 4.99 : 0;
  const orderTotal = total() + delivery;

  useEffect(() => {
    if (session?.user) setForm(f => ({ ...f, name: session.user?.name || '', email: session.user?.email || '' }));
  }, [session]);

  if (items.length === 0 && step < 3) return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '68px' }}>
      <div style={{ textAlign: 'center' }}>
        <ShoppingBag size={48} color="var(--brown-mid)" style={{ marginBottom: '16px', opacity: 0.3 }} />
        <h2 className="font-display" style={{ fontSize: '24px', color: 'var(--brown-dark)', marginBottom: '8px' }}>Your cart is empty</h2>
        <a href="/menu" style={{ color: 'var(--red-korean)', textDecoration: 'none', fontSize: '14px' }}>Browse our menu →</a>
      </div>
    </div>
  );

  const handleDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) { toast.error('Please fill all required fields'); return; }
    if (orderType === 'delivery' && !form.address) { toast.error('Please enter delivery address'); return; }
    setLoading(true);
    const or = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: form.name, customerEmail: form.email, customerPhone: form.phone, orderType, items: items.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })), subtotal: total(), deliveryFee: delivery, total: orderTotal, deliveryAddress: form.address, pickupTime: form.pickupTime, specialInstructions: form.instructions })
    });
    const order = await or.json();
    if (!or.ok) { toast.error(order.error || 'Failed to create order'); setLoading(false); return; }
    const pr = await fetch('/api/payments/create-intent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: orderTotal, metadata: { type: 'order', orderId: order._id } })
    });
    const data = await pr.json();
    if (!pr.ok || !data.clientSecret) { toast.error(data.error || 'Failed to initialise payment'); setLoading(false); return; }
    setClientSecret(data.clientSecret);
    setStep(2);
    setLoading(false);
  };

  const inp: React.CSSProperties = { width: '100%', background: 'white', border: '1.5px solid var(--stone-light)', borderRadius: '12px', padding: '11px 14px', fontSize: '14px', color: 'var(--brown-dark)', outline: 'none', fontFamily: 'Outfit, sans-serif', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '36px 24px' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '32px' }}>Checkout</h1>

        <div className="checkout-grid">
          <div>
            {/* Steps */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', alignItems: 'center' }}>
              {['Details', 'Payment'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, background: step > i + 1 ? '#2e7d32' : step === i + 1 ? 'var(--red-korean)' : 'var(--stone-light)', color: step >= i + 1 ? 'white' : 'var(--brown-mid)', flexShrink: 0 }}>{step > i + 1 ? '✓' : i + 1}</div>
                    <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--brown-dark)' : 'var(--brown-mid)' }}>{s}</span>
                  </div>
                  {i < 1 && <div style={{ flex: 1, height: '1px', background: step > 1 ? '#2e7d32' : 'var(--stone-light)', margin: '0 8px' }} />}
                </div>
              ))}
            </div>

            {/* Step 1 — Details */}
            {step === 1 && (
              <form onSubmit={handleDetails} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--stone-light)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {orderType === 'delivery' ? <Truck size={18} color="var(--red-korean)" /> : <ShoppingBag size={18} color="var(--red-korean)" />}
                  {orderType === 'delivery' ? 'Delivery Details' : 'Takeaway Details'}
                </h2>
                {([['Full Name *', 'name', 'text'], ['Email *', 'email', 'email'], ['Phone *', 'phone', 'tel']] as [string, string, string][]).map(([l, f, t]) => (
                  <div key={f} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>{l}</label>
                    <input type={t} required value={(form as any)[f]} onChange={e => setForm(ff => ({ ...ff, [f]: e.target.value }))} style={inp} />
                  </div>
                ))}
                {orderType === 'delivery' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Delivery Address *</label>
                    <input type="text" required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Example St, Adelaide SA 5000" style={inp} />
                  </div>
                )}
                {orderType === 'takeaway' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Preferred Pickup Time</label>
                    <input type="time" value={form.pickupTime} onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))} style={inp} />
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Special Instructions</label>
                  <textarea rows={2} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Allergies, extra spicy, etc..." style={{ ...inp, resize: 'none' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CreditCard size={16} />{loading ? 'Processing…' : 'Continue to Payment'}
                </button>
              </form>
            )}

            {/* Step 2 — Payment */}
            {step === 2 && clientSecret && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--stone-light)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="var(--red-korean)" /> Secure Payment
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--brown-mid)', marginBottom: '16px' }}>Your card details are processed securely by Stripe.</p>
                <Elements stripe={stripePromise} options={{ clientSecret: clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#C0392B', fontFamily: 'Outfit, sans-serif' } } }}>
                  <PayForm clientSecret={clientSecret} total={orderTotal} onSuccess={() => { clearCart(); setStep(3); toast.success('Order placed! 🎉'); }} />
                </Elements>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--brown-mid)', fontSize: '13px', cursor: 'pointer', marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>← Back to details</button>
              </div>
            )}

            {/* Step 3 — Success */}
            {step === 3 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', border: '1px solid var(--stone-light)' }}>
                <div style={{ width: '60px', height: '60px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={30} color="#2e7d32" />
                </div>
                <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Order Placed!</h2>
                <p style={{ color: 'var(--brown-mid)', marginBottom: '4px' }}>Thank you, <strong>{form.name}</strong>!</p>
                <p style={{ fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '28px' }}>Confirmation sent to {form.email}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <a href="/" style={{ background: 'var(--brown-dark)', color: 'white', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Home</a>
                  {session && <a href="/dashboard" style={{ background: 'var(--stone-light)', color: 'var(--brown-dark)', padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Track Order</a>}
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {step < 3 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--stone-light)', position: 'sticky', top: '84px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '16px' }}>Order Summary</h2>
              <div style={{ background: 'var(--stone-light)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: 'var(--brown-mid)' }}>Order type:</span>
                <span style={{ fontWeight: 600, color: 'var(--red-korean)', textTransform: 'capitalize' }}>{orderType}</span>
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--brown-dark)' }}>{i.quantity}× {i.name}</span>
                    <span style={{ color: 'var(--brown-mid)' }}>${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--stone-light)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '4px' }}><span>Subtotal</span><span>${total().toFixed(2)}</span></div>
                {delivery > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '4px' }}><span>Delivery</span><span>${delivery.toFixed(2)}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 600 }}>Total</span>
                  <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${orderTotal.toFixed(2)} AUD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
