import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/printer/print
// Receives an order JSON from the admin panel and forwards it to the local
// printer bridge via the Cloudflare tunnel (PRINTER_BRIDGE_URL env var).
// The bridge builds ESC/POS and sends it over TCP to the Star TSP100III.
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

  const bridgeUrl = process.env.PRINTER_BRIDGE_URL;
  if (!bridgeUrl) {
    console.error('[Print] PRINTER_BRIDGE_URL is not set');
    return NextResponse.json({ error: 'Printer bridge not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(`${bridgeUrl}/order`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(order),
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      console.error('[Print] Bridge error:', res.status, msg);
      return NextResponse.json({ error: `Bridge error: ${msg}` }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[Print] Could not reach printer bridge:', e.message);
    return NextResponse.json({ error: 'Printer offline — check bridge is running' }, { status: 503 });
  }
}
