'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { ShoppingBag, CreditCard, CheckCircle, Lock, Printer } from 'lucide-react';

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
        <Lock size={10} /> Secured by Stripe
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', pickupTime: '', instructions: '' });
  const [savedOrder, setSavedOrder] = useState<any>(null);
  const orderTotal = total();

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
    setLoading(true);
    const or = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: form.name, customerEmail: form.email, customerPhone: form.phone,
        orderType: 'takeaway',
        items: items.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        subtotal: orderTotal, deliveryFee: 0, total: orderTotal,
        pickupTime: form.pickupTime, specialInstructions: form.instructions,
      })
    });
    const order = await or.json();
    if (!or.ok) { toast.error(order.error || 'Failed to create order'); setLoading(false); return; }
    setSavedOrder(order);
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

  const receiptItems = savedOrder?.items ?? [];
  const receiptTotal = savedOrder?.total ?? orderTotal;
  const receiptSubtotal = savedOrder?.subtotal ?? orderTotal;
  const orderId = savedOrder?._id ? `#${savedOrder._id.slice(-6).toUpperCase()}` : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '68px' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '36px 24px' }}>
        <h1 className="font-display" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '32px' }}>Checkout</h1>

        <div className="checkout-grid">
          <div>
            {/* Steps */}
            {step < 3 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', alignItems: 'center' }}>
                {['Your Details', 'Payment'].map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, background: step > i + 1 ? '#2e7d32' : step === i + 1 ? 'var(--red-korean)' : 'var(--stone-light)', color: step >= i + 1 ? 'white' : 'var(--brown-mid)', flexShrink: 0 }}>{step > i + 1 ? '✓' : i + 1}</div>
                      <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--brown-dark)' : 'var(--brown-mid)' }}>{s}</span>
                    </div>
                    {i < 1 && <div style={{ flex: 1, height: '1px', background: step > 1 ? '#2e7d32' : 'var(--stone-light)', margin: '0 8px' }} />}
                  </div>
                ))}
              </div>
            )}

            {/* Step 1 — Details */}
            {step === 1 && (
              <form onSubmit={handleDetails} style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--stone-light)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} color="var(--red-korean)" /> Takeaway Details
                </h2>
                {([['Full Name *', 'name', 'text'], ['Email *', 'email', 'email'], ['Phone *', 'phone', 'tel']] as [string, string, string][]).map(([l, f, t]) => (
                  <div key={f} style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>{l}</label>
                    <input type={t} required value={(form as any)[f]} onChange={e => setForm(ff => ({ ...ff, [f]: e.target.value }))} style={inp} />
                  </div>
                ))}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Preferred Pickup Time (optional)</label>
                  <input type="time" value={form.pickupTime} onChange={e => setForm(f => ({ ...f, pickupTime: e.target.value }))} style={inp} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--brown-mid)', display: 'block', marginBottom: '5px' }}>Special Instructions (optional)</label>
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
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#C0392B', fontFamily: 'Outfit, sans-serif' } } }}>
                  <PayForm clientSecret={clientSecret} total={orderTotal} onSuccess={() => { clearCart(); setStep(3); toast.success('Order placed! 🎉'); }} />
                </Elements>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--brown-mid)', fontSize: '13px', cursor: 'pointer', marginTop: '12px', fontFamily: 'Outfit, sans-serif' }}>← Back to details</button>
              </div>
            )}

            {/* Step 3 — Receipt */}
            {step === 3 && (
              <div>
                {/* Success banner */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid var(--stone-light)', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={32} color="#2e7d32" />
                  </div>
                  <h2 className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '6px' }}>Order Confirmed!</h2>
                  <p style={{ color: 'var(--brown-mid)', fontSize: '14px', marginBottom: '4px' }}>Thank you, <strong>{form.name}</strong>!</p>
                  <p style={{ fontSize: '12px', color: 'var(--brown-mid)' }}>A confirmation email has been sent to <strong>{form.email}</strong></p>
                </div>

                {/* Receipt card */}
                <div id="print-receipt" style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--stone-light)', overflow: 'hidden', marginBottom: '16px' }}>
                  {/* Receipt header */}
                  <div style={{ background: 'var(--brown-dark)', padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="font-display" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.03em' }}>Mum's Kitchen</div>
                        <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.6)', marginTop: '2px' }}>Tranmere SA · Authentic Korean & Bangladeshi</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(232,224,213,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Order</div>
                        <div className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'white', fontFamily: 'monospace' }}>{orderId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Receipt body */}
                  <div style={{ padding: '20px 24px' }}>
                    {/* Customer info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Customer</div>
                        <div style={{ color: 'var(--brown-dark)', fontWeight: 500 }}>{form.name}</div>
                        <div style={{ color: 'var(--brown-mid)', fontSize: '12px' }}>{form.phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Order Type</div>
                        <div style={{ color: 'var(--red-korean)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>🥡 Takeaway</div>
                        {form.pickupTime && <div style={{ color: 'var(--brown-mid)', fontSize: '12px' }}>Pickup: {form.pickupTime}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Date & Time</div>
                        <div style={{ color: 'var(--brown-dark)', fontSize: '12px' }}>{new Date().toLocaleDateString('en-AU', { dateStyle: 'medium' })}</div>
                        <div style={{ color: 'var(--brown-mid)', fontSize: '12px' }}>{new Date().toLocaleTimeString('en-AU', { timeStyle: 'short' })}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Payment</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                          <Lock size={9} /> Paid · Stripe
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ borderTop: '1px dashed var(--stone-light)', marginBottom: '16px' }} />

                    {/* Items */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brown-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Items Ordered</div>
                      {receiptItems.map((item: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f0eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--stone-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--brown-dark)', flexShrink: 0 }}>{item.quantity}</div>
                            <span style={{ fontSize: '13px', color: 'var(--brown-dark)', fontWeight: 500 }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--brown-dark)', fontWeight: 500 }}>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div style={{ borderTop: '1px dashed var(--stone-light)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '6px' }}>
                        <span>Subtotal</span><span>${receiptSubtotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--brown-mid)', marginBottom: '12px' }}>
                        <span>Delivery</span><span>Free (Takeaway)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f9f5f0', borderRadius: '10px' }}>
                        <span className="font-display" style={{ fontSize: '17px', fontWeight: 600, color: 'var(--brown-dark)' }}>Total Paid</span>
                        <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${receiptTotal.toFixed(2)} AUD</span>
                      </div>
                    </div>

                    {form.instructions && (
                      <div style={{ marginTop: '14px', background: '#fdf0ee', borderLeft: '3px solid var(--red-korean)', padding: '10px 12px', borderRadius: '0 8px 8px 0', fontSize: '12px', color: 'var(--brown-dark)' }}>
                        <strong>Special instructions:</strong> {form.instructions}
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--brown-mid)', borderTop: '1px solid var(--stone-light)', paddingTop: '14px' }}>
                      <div>66 Reid Avenue, Tranmere SA 5073 · All meat 100% Halal</div>
                      <div style={{ marginTop: '4px' }}>Questions? Call us on <strong>+61 406 878 202</strong></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 22px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                    <Printer size={16} /> Print Receipt
                  </button>
                  <a href="/" style={{ display: 'flex', alignItems: 'center', background: 'var(--stone-light)', color: 'var(--brown-dark)', padding: '12px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Home</a>
                  <a href="/order" style={{ display: 'flex', alignItems: 'center', background: 'var(--stone-light)', color: 'var(--brown-dark)', padding: '12px 22px', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Order More</a>
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
                <span style={{ fontWeight: 600, color: 'var(--red-korean)' }}>🥡 Takeaway</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span className="font-display" style={{ fontSize: '18px', fontWeight: 600 }}>Total</span>
                  <span className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--red-korean)' }}>${orderTotal.toFixed(2)} AUD</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(#__next) { display: none !important; }
          #print-receipt {
            display: block !important;
            position: fixed;
            top: 0; left: 0; right: 0;
            padding: 0;
            border: none !important;
            border-radius: 0 !important;
          }
          body { background: white !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
