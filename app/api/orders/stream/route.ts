import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export const dynamic = 'force-dynamic';

// Server-Sent Events — admin subscribes and gets notified of new pending orders.
// Polls DB every 5s and pushes events when new authorized orders arrive.
export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastChecked = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {}
      };

      // Confirm connection
      send({ type: 'connected' });

      const poll = async () => {
        try {
          await connectDB();
          const since = new Date(lastChecked.getTime() - 500);
          lastChecked = new Date();

          const newOrders = await Order.find({
            createdAt:     { $gt: since },
            paymentStatus: 'authorized',
          })
            .select('_id customerName orderType total items createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (newOrders.length > 0) {
            send({ type: 'new_order', orders: newOrders });
          }
        } catch {}
      };

      const pollInterval = setInterval(poll, 5_000);

      // Keep-alive heartbeat — prevents proxy/nginx from closing idle connection
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')); } catch {}
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
