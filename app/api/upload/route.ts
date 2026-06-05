import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, UploadSchema } from '@/lib/validation';
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.upload);
  if (limited) return limited;
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const raw = await req.json();
    const v = validateBody(UploadSchema, raw);
    if (!v.data) return NextResponse.json({ error: v.error }, { status: 400 });
    const urls = await Promise.all(v.data.images.map((b64: string) => uploadImage(b64)));
    return NextResponse.json({ urls });
  } catch { return NextResponse.json({ error: 'Upload failed' }, { status: 500 }); }
}
