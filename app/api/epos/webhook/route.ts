import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { mapEposProductToMenuItem } from '@/lib/eposnow';

/**
 * POST /api/epos/webhook
 *
 * Receives real-time events from Epos Now when things change on your POS.
 * Set this URL in Epos Now Back Office → Settings → Webhooks:
 *   https://yourdomain.com/api/epos/webhook
 *
 * Events handled:
 *   product.updated  → update price/name/availability on website
 *   product.created  → add new item to website
 *   product.deleted  → mark as unavailable on website (don't delete, keep history)
 *   stock.updated    → toggle isAvailable based on stock level
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { EventType, Data } = body;

    // Optional: verify webhook signature if Epos Now provides one
    // const sig = req.headers.get('x-eposnow-signature');

    await connectDB();

    switch (EventType) {

      case 'product.updated': {
        const product = Data;
        const mapped  = mapEposProductToMenuItem(product);
        const existing = await MenuItem.findOne({ eposProductId: product.Id });

        if (existing) {
          await MenuItem.findByIdAndUpdate(existing._id, {
            name:          mapped.name,
            price:         mapped.price,
            isAvailable:   mapped.isAvailable,
            eposUpdatedAt: new Date(),
          });
          console.log(`[Epos Webhook] Updated product: ${product.Name} (ID: ${product.Id})`);
        }
        break;
      }

      case 'product.created': {
        const product  = Data;
        const mapped   = mapEposProductToMenuItem(product);
        const existing = await MenuItem.findOne({ eposProductId: product.Id });

        if (!existing) {
          await MenuItem.create({
            ...mapped,
            description:     `${mapped.name} — add a description in your admin panel.`,
            richDescription: '',
            images:          [],
            primaryImage:    '',
            tags:            [],
            isFeatured:      false,
            sortOrder:       0,
            syncedFromEpos:  true,
          });
          console.log(`[Epos Webhook] Created product: ${product.Name} (ID: ${product.Id})`);
        }
        break;
      }

      case 'product.deleted': {
        const product = Data;
        // Don't hard delete — just mark unavailable to keep order history intact
        await MenuItem.findOneAndUpdate(
          { eposProductId: product.Id },
          { isAvailable: false, eposUpdatedAt: new Date() }
        );
        console.log(`[Epos Webhook] Disabled deleted product ID: ${product.Id}`);
        break;
      }

      case 'stock.updated': {
        const { ProductId, StockLevel } = Data;
        // Mark unavailable if stock hits zero
        const isAvailable = StockLevel > 0;
        await MenuItem.findOneAndUpdate(
          { eposProductId: ProductId },
          { isAvailable, eposUpdatedAt: new Date() }
        );
        console.log(`[Epos Webhook] Stock update for product ${ProductId}: level=${StockLevel}, available=${isAvailable}`);
        break;
      }

      case 'price.updated': {
        const { ProductId, NewPrice } = Data;
        await MenuItem.findOneAndUpdate(
          { eposProductId: ProductId },
          { price: parseFloat(NewPrice), eposUpdatedAt: new Date() }
        );
        console.log(`[Epos Webhook] Price updated for product ${ProductId}: $${NewPrice}`);
        break;
      }

      default:
        console.log(`[Epos Webhook] Unhandled event type: ${EventType}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, event: EventType });

  } catch (e: any) {
    console.error('[Epos Webhook] Error:', e.message);
    // Still return 200 — if we return error, Epos Now will keep retrying
    return NextResponse.json({ received: true, error: e.message });
  }
}
