import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { auth } from '@/lib/auth';

// PUT — admin approves/rejects/replies, or user votes helpful
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await connectDB();
    const session = await auth();
    const body = await req.json();
    const { action } = body;

    if (action === 'helpful') {
      // Any user can mark helpful — use IP + userId as fingerprint
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const fingerprint = (session?.user as any)?.id || ip;
      const review = await Review.findById(id);
      if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if (review.helpfulVoters.includes(fingerprint)) {
        // Toggle off
        review.helpfulVoters = review.helpfulVoters.filter((v: string) => v !== fingerprint);
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      } else {
        review.helpfulVoters.push(fingerprint);
        review.helpfulVotes += 1;
      }
      await review.save();
      return NextResponse.json({ helpfulVotes: review.helpfulVotes });
    }

    // Admin-only actions
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update: any = {};
    if (action === 'approve')  { update.status = 'approved'; }
    if (action === 'reject')   { update.status = 'rejected'; }
    if (action === 'feature')  { update.featured = true; }
    if (action === 'unfeature'){ update.featured = false; }
    if (action === 'reply') {
      update.adminReply   = body.reply;
      update.adminReplyAt = new Date();
    }
    if (body.status)  update.status  = body.status;
    if (body.featured !== undefined) update.featured = body.featured;

    const review = await Review.findByIdAndUpdate(id, update, { new: true });
    if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If just approved a dish review, trigger rating update
    if (update.status === 'approved' && review.type === 'dish') {
      await review.save(); // triggers post-save hook
    }

    return NextResponse.json(review);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — admin only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    await Review.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
