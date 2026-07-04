import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM       = "Mum's Kitchen <noreply@mumskitchentranmere.com.au>";
const PHONE      = process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+61406878202';
const SITE_URL   = (process.env.NEXTAUTH_URL || 'https://mumskitchentranmere.com.au').replace(/\/$/, '');
const LOGO_URL   = `${SITE_URL}/logo.png`;

interface OrderItem { name: string; price: number; quantity: number; }
interface OrderEmailData {
  orderId:      string;
  customerName: string;
  customerEmail:string;
  orderType:    string;
  items:        OrderItem[];
  subtotal:     number;
  deliveryFee:  number;
  total:        number;
  deliveryAddress?: string;
  pickupTime?:  string;
  specialInstructions?: string;
}

function orderHtml(d: OrderEmailData): string {
  const typeLabel = d.orderType === 'delivery' ? '🚚 Delivery' : d.orderType === 'dinein' ? '🍽️ Dine In' : '🥡 Takeaway';
  const rows = d.items.map(i =>
    `<tr>
      <td style="padding:8px 0;color:#2C1A0E;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:8px 0;color:#2C1A0E;font-size:14px;text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(44,26,14,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#2C1A0E;padding:24px 32px;text-align:center">
            <img src="${LOGO_URL}" alt="Mum's Kitchen" width="64" height="64" style="display:inline-block;margin-bottom:10px;object-fit:contain" />
            <div style="font-size:22px;font-weight:700;color:#C8922A;letter-spacing:0.03em">Mum's Kitchen</div>
            <div style="font-size:12px;color:rgba(232,224,213,0.6);margin-top:4px;letter-spacing:0.12em;text-transform:uppercase">Tranmere · Authentic Korean</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#2C1A0E">Order Received! ⏳</h1>
            <p style="margin:0 0 8px;font-size:14px;color:#6B3A1F">Hi ${d.customerName}, your order has been placed successfully.</p>
            <div style="background:#fef9ee;border:1.5px solid #f59e0b;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;font-weight:500">
              🕐 Your order is <strong>pending confirmation</strong> from the restaurant. We will send you another email once it is confirmed.
            </div>

            <!-- Order meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:12px;padding:14px 16px;margin-bottom:24px">
              <tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Order ID</td>
                <td style="font-size:12px;color:#2C1A0E;font-weight:700;text-align:right;font-family:monospace">#${d.orderId.slice(-6).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:8px">Order Type</td>
                <td style="font-size:12px;color:#2C1A0E;font-weight:600;text-align:right;padding-top:8px">${typeLabel}</td>
              </tr>
              ${d.deliveryAddress ? `<tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:8px">Deliver to</td>
                <td style="font-size:12px;color:#2C1A0E;text-align:right;padding-top:8px">${d.deliveryAddress}</td>
              </tr>` : ''}
              ${d.pickupTime ? `<tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:8px">Pickup Time</td>
                <td style="font-size:12px;color:#2C1A0E;text-align:right;padding-top:8px">${d.pickupTime}</td>
              </tr>` : ''}
            </table>

            <!-- Items -->
            <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#2C1A0E">Your Order</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E0D5">
              ${rows}
              <tr><td colspan="2" style="padding:0"><hr style="border:none;border-top:1px solid #E8E0D5;margin:4px 0"></td></tr>
              <tr>
                <td style="padding:6px 0;color:#6B3A1F;font-size:13px">Subtotal</td>
                <td style="padding:6px 0;color:#6B3A1F;font-size:13px;text-align:right">$${d.subtotal.toFixed(2)}</td>
              </tr>
              ${d.deliveryFee > 0 ? `<tr>
                <td style="padding:6px 0;color:#6B3A1F;font-size:13px">Delivery</td>
                <td style="padding:6px 0;color:#6B3A1F;font-size:13px;text-align:right">$${d.deliveryFee.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0 0;color:#2C1A0E;font-size:17px;font-weight:700">Total</td>
                <td style="padding:10px 0 0;color:#C0392B;font-size:18px;font-weight:700;text-align:right">$${d.total.toFixed(2)} AUD</td>
              </tr>
            </table>

            ${d.specialInstructions ? `
            <div style="margin-top:20px;background:#fdf0ee;border-left:3px solid #C0392B;padding:12px 14px;border-radius:0 8px 8px 0;font-size:13px;color:#2C1A0E">
              <strong>Special instructions:</strong> ${d.specialInstructions}
            </div>` : ''}

            <!-- CTA -->
            <div style="margin-top:28px;text-align:center">
              <p style="font-size:13px;color:#6B3A1F;margin:0 0 16px">Questions? Call or message us anytime.</p>
              <a href="tel:${PHONE}" style="display:inline-block;background:#2C1A0E;color:white;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600">${PHONE}</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#FAF7F2;padding:20px 32px;text-align:center;border-top:1px solid #E8E0D5">
            <p style="margin:0;font-size:12px;color:#A0522D">66 Reid Avenue, Tranmere SA 5073</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderReceived(data: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY is not set — email not sent');
    return;
  }
  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      data.customerEmail,
      subject: `Order Received #${data.orderId.slice(-6).toUpperCase()} — Pending Confirmation`,
      html:    orderHtml(data),
    });
    console.log('[Email] Order received sent to', data.customerEmail, '| id:', (result as any)?.data?.id, '| error:', (result as any)?.error);
  } catch (e) {
    console.error('[Email] sendOrderReceived failed:', e);
  }
}

export async function sendOrderConfirmed(data: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) return;
  const typeLabel = data.orderType === 'dinein' ? '🍽️ Dine In' : '🥡 Takeaway';
  const rows = data.items.map(i =>
    `<tr>
      <td style="padding:8px 0;color:#2C1A0E;font-size:14px">${i.quantity}× ${i.name}</td>
      <td style="padding:8px 0;color:#2C1A0E;font-size:14px;text-align:right">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(44,26,14,0.08)">
        <tr>
          <td style="background:#2C1A0E;padding:24px 32px;text-align:center">
            <img src="${LOGO_URL}" alt="Mum's Kitchen" width="64" height="64" style="display:inline-block;margin-bottom:10px;object-fit:contain" />
            <div style="font-size:22px;font-weight:700;color:#C8922A;letter-spacing:0.03em">Mum's Kitchen</div>
            <div style="font-size:12px;color:rgba(232,224,213,0.6);margin-top:4px;letter-spacing:0.12em;text-transform:uppercase">Tranmere · Authentic Korean</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#2C1A0E">Order Confirmed! 🎉</h1>
            <p style="margin:0 0 8px;font-size:14px;color:#6B3A1F">Hi ${data.customerName}, great news — your order has been confirmed!</p>
            <div style="background:#f0fdf4;border:1.5px solid #22c55e;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#15803d;font-weight:500">
              ✅ The restaurant has confirmed your order and is now preparing it.
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:12px;padding:14px 16px;margin-bottom:24px">
              <tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Order ID</td>
                <td style="font-size:12px;color:#2C1A0E;font-weight:700;text-align:right;font-family:monospace">#${data.orderId.slice(-6).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:8px">Order Type</td>
                <td style="font-size:12px;color:#2C1A0E;font-weight:600;text-align:right;padding-top:8px">${typeLabel}</td>
              </tr>
              ${data.pickupTime ? `<tr><td style="font-size:12px;color:#6B3A1F;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;padding-top:8px">Pickup Time</td><td style="font-size:12px;color:#2C1A0E;text-align:right;padding-top:8px">${data.pickupTime}</td></tr>` : ''}
            </table>
            <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#2C1A0E">Your Order</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E8E0D5">
              ${rows}
              <tr><td colspan="2"><hr style="border:none;border-top:1px solid #E8E0D5;margin:4px 0"></td></tr>
              <tr>
                <td style="padding:10px 0 0;color:#2C1A0E;font-size:17px;font-weight:700">Total</td>
                <td style="padding:10px 0 0;color:#C0392B;font-size:18px;font-weight:700;text-align:right">$${data.total.toFixed(2)} AUD</td>
              </tr>
            </table>
            <div style="margin-top:28px;text-align:center">
              <p style="font-size:13px;color:#6B3A1F;margin:0 0 16px">Questions? Call or message us anytime.</p>
              <a href="tel:${PHONE}" style="display:inline-block;background:#2C1A0E;color:white;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600">${PHONE}</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF7F2;padding:20px 32px;text-align:center;border-top:1px solid #E8E0D5">
            <p style="margin:0;font-size:12px;color:#A0522D">66 Reid Avenue, Tranmere SA 5073</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      data.customerEmail,
      subject: `Order Confirmed! #${data.orderId.slice(-6).toUpperCase()} — Mum's Kitchen`,
      html,
    });
    console.log('[Email] Order confirmed sent to', data.customerEmail, '| id:', (result as any)?.data?.id, '| error:', (result as any)?.error);
  } catch (e) {
    console.error('[Email] sendOrderConfirmed failed:', e);
  }
}

// refunded = true  → payment was already captured, Stripe refund has been issued
// refunded = false → payment was never charged (authorized then voided)
export async function sendOrderCancelled(data: OrderEmailData, refunded: boolean) {
  if (!process.env.RESEND_API_KEY) return;
  const id = data.orderId.slice(-6).toUpperCase();
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(44,26,14,0.08)">
        <tr>
          <td style="background:#2C1A0E;padding:24px 32px;text-align:center">
            <img src="${LOGO_URL}" alt="Mum's Kitchen" width="64" height="64" style="display:inline-block;margin-bottom:10px;object-fit:contain" />
            <div style="font-size:22px;font-weight:700;color:#C8922A">Mum's Kitchen</div>
            <div style="font-size:12px;color:rgba(232,224,213,0.6);margin-top:4px;letter-spacing:0.12em;text-transform:uppercase">Tranmere · Authentic Korean</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#2C1A0E">Order Cancelled ❌</h1>
            <p style="margin:0 0 16px;font-size:14px;color:#6B3A1F">Hi ${data.customerName}, unfortunately your order <strong>#${id}</strong> has been cancelled.</p>
            ${refunded
              ? `<div style="background:#f0fdf4;border:1.5px solid #22c55e;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#15803d;font-weight:500">
                  💳 A full refund of <strong>$${data.total.toFixed(2)} AUD</strong> has been processed and will appear in your account within 5–10 business days.
                </div>`
              : `<div style="background:#fef9ee;border:1.5px solid #f59e0b;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;font-weight:500">
                  ℹ️ You have <strong>not been charged</strong> for this order.
                </div>`
            }
            <p style="font-size:13px;color:#6B3A1F">We apologise for the inconvenience. If you have any questions, please call us.</p>
            <div style="margin-top:24px;text-align:center">
              <a href="tel:${PHONE}" style="display:inline-block;background:#2C1A0E;color:white;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600">${PHONE}</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#FAF7F2;padding:20px 32px;text-align:center;border-top:1px solid #E8E0D5">
            <p style="margin:0;font-size:12px;color:#A0522D">66 Reid Avenue, Tranmere SA 5073</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      data.customerEmail,
      subject: refunded
        ? `Order Cancelled & Refund Processed #${id} — Mum's Kitchen`
        : `Order Cancelled #${id} — Mum's Kitchen`,
      html,
    });
    console.log('[Email] Order cancelled sent to', data.customerEmail, '| id:', (result as any)?.data?.id, '| error:', (result as any)?.error);
  } catch (e) {
    console.error('[Email] sendOrderCancelled failed:', e);
  }
}

export async function sendOrderNotificationToRestaurant(data: OrderEmailData) {
  const restaurantEmail = process.env.NEXT_PUBLIC_RESTAURANT_EMAIL || 'mumskitchentranmere@gmail.com';
  if (!process.env.RESEND_API_KEY) return;
  try {
    const typeLabel = data.orderType === 'delivery' ? 'DELIVERY' : data.orderType === 'dinein' ? 'DINE IN' : 'TAKEAWAY';
    const itemList = data.items.map(i => `${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}`).join('\n');
    await resend.emails.send({
      from:    FROM,
      to:      restaurantEmail,
      subject: `🔔 New ${typeLabel} Order #${data.orderId.slice(-6).toUpperCase()} — $${data.total.toFixed(2)}`,
      text:    `New order received!\n\nOrder: #${data.orderId.slice(-6).toUpperCase()}\nType: ${typeLabel}\nCustomer: ${data.customerName} (${data.customerEmail})\n${data.deliveryAddress ? `Deliver to: ${data.deliveryAddress}\n` : ''}${data.pickupTime ? `Pickup time: ${data.pickupTime}\n` : ''}\nItems:\n${itemList}\n\nTotal: $${data.total.toFixed(2)} AUD\n${data.specialInstructions ? `\nSpecial instructions: ${data.specialInstructions}` : ''}`,
    });
  } catch (e) {
    console.error('[Email] Failed to send restaurant notification:', e);
  }
}
