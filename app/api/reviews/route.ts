import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Order } from '@/models/Order';
import { auth } from '@/lib/auth';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, CreateReviewSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === 'admin';
    const query: any = {};
    if (!isAdmin) query.status = 'approved';
    const status = searchParams.get('status'); if (status && isAdmin) query.status = status;
    const type = searchParams.get('type'); if (type) query.type = type;
    const menuItemId = searchParams.get('menuItemId'); if (menuItemId) query.menuItemId = menuItemId;
    if (searchParams.get('featured') === 'true') query.featured = true;
    const rating = parseInt(searchParams.get('rating') || '0');
    if (rating > 0) query.rating = rating;
    const sortParam = searchParams.get('sort') || 'newest';
    const sortObj: any =
      sortParam === 'rating_desc' ? { rating: -1, createdAt: -1 } :
      sortParam === 'rating_asc'  ? { rating:  1, createdAt: -1 } :
      sortParam === 'helpful_desc'? { helpfulVotes: -1, createdAt: -1 } :
      { createdAt: -1 };
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const [reviews, total] = await Promise.all([
      Review.find(query).sort(sortObj).skip((page-1)*limit).limit(limit).lean(),
      Review.countDocuments(query),
    ]);
    const stats = await Review.aggregate([
      { $match: { status: 'approved', type: 'restaurant' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 }, five: { $sum: { $cond: [{ $eq: ['$rating',5] },1,0] } }, four: { $sum: { $cond: [{ $eq: ['$rating',4] },1,0] } }, three: { $sum: { $cond: [{ $eq: ['$rating',3] },1,0] } }, two: { $sum: { $cond: [{ $eq: ['$rating',2] },1,0] } }, one: { $sum: { $cond: [{ $eq: ['$rating',1] },1,0] } } } },
    ]);
    return NextResponse.json({ reviews, total, page, pages: Math.ceil(total/limit), stats: stats[0] || { avgRating:0,total:0,five:0,four:0,three:0,two:0,one:0 } });
  } catch { return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.review);
  if (limited) return limited;
  try {
    await connectDB();
    const session = await auth();
    const raw = await req.json();
    const v = validateBody(CreateReviewSchema, raw);
    if (!v.data) return NextResponse.json({ error: v.error }, { status: 400 });
    const d = v.data;
    let customerName  = d.customerName  || 'Anonymous';
    let customerEmail = d.customerEmail || '';
    let verified = false;
    if (session?.user) {
      customerName  = session.user.name  || customerName;
      customerEmail = session.user.email || customerEmail;
      const anyOrder = await Order.findOne({ customerEmail, status: { $in: ['delivered','completed','ready'] } });
      if (anyOrder) verified = true;
      const existing = await Review.findOne({ customerEmail, type: d.type, ...(d.menuItemId ? { menuItemId: d.menuItemId } : {}) });
      if (existing) return NextResponse.json({ error: 'You have already reviewed this.' }, { status: 409 });
    }
    const review = await Review.create({ ...d, userId: (session?.user as any)?.id, customerName, customerEmail, verified, status: 'pending' });
    return NextResponse.json(review, { status: 201 });
  } catch { return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 }); }
}
