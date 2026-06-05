import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { auth } from '@/lib/auth';
import { eposGetAllProducts, mapEposProductToMenuItem } from '@/lib/eposnow';

/**
 * POST /api/epos/sync
 * Pulls all products from Epos Now and syncs them into MongoDB.
 *
 * Rules:
 *  - If product exists (matched by eposProductId) → update name, price, isAvailable ONLY
 *  - If product is new → create it with basic fields
 *  - NEVER overwrite: description, richDescription, images, tags, isFeatured, sortOrder
 *    (those are managed on the website side)
 *
 * Admin only. Also called by the cron job every 15 minutes.
 */
export async function POST(req: NextRequest) {
  try {
    // Allow both admin session AND internal cron calls with secret key
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const cronKey = searchParams.get('key');
    const isAdmin = (session?.user as any)?.role === 'admin';
    const isCron  = cronKey === process.env.SYNC_SECRET_KEY;

    if (!isAdmin && !isCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Pull all products from Epos Now
    const eposProducts = await eposGetAllProducts();

    if (!Array.isArray(eposProducts)) {
      return NextResponse.json({ error: 'Unexpected response from Epos Now', raw: eposProducts }, { status: 502 });
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const ep of eposProducts) {
      try {
        const mapped = mapEposProductToMenuItem(ep);
        const existing = await MenuItem.findOne({ eposProductId: ep.Id });

        if (existing) {
          // Update ONLY Epos-owned fields — never touch description/images/tags
          await MenuItem.findByIdAndUpdate(existing._id, {
            name:           mapped.name,
            price:          mapped.price,
            isAvailable:    mapped.isAvailable,
            eposUpdatedAt:  new Date(),
            syncedFromEpos: true,
            // Update category only if it hasn't been manually overridden
            ...(existing.syncedFromEpos ? { category: mapped.category } : {}),
          });
          results.updated++;
        } else {
          // New product from Epos — create with defaults, admin can enrich later
          await MenuItem.create({
            ...mapped,
            description:    `${mapped.name} — add a description in your admin panel.`,
            richDescription: '',
            images:         [],
            primaryImage:   '',
            tags:           [],
            isFeatured:     false,
            sortOrder:      0,
            syncedFromEpos: true,
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Product ${ep.Id} (${ep.Name}): ${err.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results,
      syncedAt: new Date().toISOString(),
    });

  } catch (e: any) {
    // Handle case where Epos Now token is not configured
    if (e.message?.includes('EPOSNOW_API_TOKEN')) {
      return NextResponse.json({ error: 'Epos Now API token not configured. Add EPOSNOW_API_TOKEN to your .env.local file.' }, { status: 503 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — check last sync status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const lastSynced = await MenuItem.findOne({ syncedFromEpos: true }).sort({ eposUpdatedAt: -1 }).select('eposUpdatedAt');
    const syncedCount = await MenuItem.countDocuments({ syncedFromEpos: true });
    return NextResponse.json({
      lastSyncedAt: lastSynced?.eposUpdatedAt || null,
      syncedProductCount: syncedCount,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
