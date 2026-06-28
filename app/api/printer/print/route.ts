import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { PrintJob } from '@/models/PrintJob';

export const dynamic = 'force-dynamic';

// ── ESC/POS builder ───────────────────────────────────────────────────────────
const LINE_WIDTH = 42;

class Receipt {
  private chunks: Buffer[] = [];

  private cmd(...b: number[]) { this.chunks.push(Buffer.from(b)); return this; }
  private txt(s: string)      { this.chunks.push(Buffer.from(s.replace(/[^\x20-\x7E]/g, '?'), 'ascii')); return this; }

  lf()                              { return this.cmd(0x0A); }
  feed(n = 1)                       { for (let i = 0; i < n; i++) this.lf(); return this; }
  init()                            { return this.cmd(0x1B, 0x40); }
  cut()                             { return this.cmd(0x1D, 0x56, 0x41, 0x03); }
  align(a: 'L' | 'C' | 'R')        { return this.cmd(0x1B, 0x61, { L: 0, C: 1, R: 2 }[a]); }
  bold(on: boolean)                 { return this.cmd(0x1B, 0x45, on ? 1 : 0); }
  size(w: 1 | 2, h: 1 | 2)         { return this.cmd(0x1D, 0x21, ((w - 1) << 4) | (h - 1)); }
  line(s: string)                   { return this.txt(s).lf(); }
  divider(ch = '-', w = LINE_WIDTH) { return this.line(ch.repeat(w)); }

  row(left: string, right: string, w = LINE_WIDTH) {
    const gap    = w - left.length - right.length;
    const padded = left + (gap > 0 ? ' '.repeat(gap) : ' ') + right;
    return this.line(padded.slice(0, w));
  }

  build() { return Buffer.concat(this.chunks); }
}

function buildReceipt(order: any): Buffer {
  const r         = new Receipt();
  const id        = String(order._id || '').slice(-6).toUpperCase();
  const typeLabel = order.orderType === 'dinein' ? 'DINE-IN' : 'TAKEAWAY';
  const now       = new Date();
  const date      = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const time      = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  r.init();
  r.align('C').size(2, 2).bold(true).line("MUM'S KITCHEN").size(1, 1).bold(false);
  r.align('C').line('Tranmere SA 5073').feed();
  r.align('C').bold(true).line(`ORDER #${id}`).bold(false);
  r.align('C').line(`${date}  ${time}`);
  r.divider('=');
  r.align('C').bold(true).size(1, 2).line(typeLabel).size(1, 1).bold(false);
  r.align('L').line(`Customer: ${order.customerName || ''}`);
  if (order.tableNumber)     r.bold(true).line(`Table:    ${order.tableNumber}`).bold(false);
  if (order.customerPhone)   r.line(`Phone:    ${order.customerPhone}`);
  if (order.pickupTime)      r.line(`Pickup:   ${order.pickupTime}`);
  if (order.deliveryAddress) r.line(`Address:  ${order.deliveryAddress}`);
  r.divider('-');

  for (const item of (order.items || [])) {
    r.align('L').bold(true)
     .row(`${item.quantity}x ${item.name}`, `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`)
     .bold(false);
  }
  r.divider('-');

  if (order.subtotal != null && order.deliveryFee) {
    r.row('Subtotal', `$${(order.subtotal   || 0).toFixed(2)}`);
    r.row('Delivery', `$${(order.deliveryFee || 0).toFixed(2)}`);
    r.divider('-');
  }
  r.bold(true).size(1, 2)
   .row('TOTAL', `$${(order.total || 0).toFixed(2)} AUD`)
   .size(1, 1).bold(false);
  r.divider('=');

  if (order.specialInstructions) {
    r.align('L').bold(true).line('SPECIAL INSTRUCTIONS:').bold(false);
    r.line(order.specialInstructions);
    r.divider('-');
  }
  r.align('C').line('Thank you!').feed(4).cut();

  return r.build();
}

// ── Route ─────────────────────────────────────────────────────────────────────
// Queues the job in MongoDB. The printer polls /api/cloudprint and picks it up.
export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let order: any;
  try {
    order = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!order?._id) {
    return NextResponse.json({ error: 'order._id is required' }, { status: 400 });
  }

  const receipt = buildReceipt(order);
  const hex     = receipt.toString('hex');

  await connectDB();
  await PrintJob.create({ hex });
  return NextResponse.json({ queued: true });
}
