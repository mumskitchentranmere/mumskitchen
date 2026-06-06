import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, UploadSchema } from '@/lib/validation';

function extractPublicId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('cloudinary.com')) return null;
    const match = u.pathname.match(/\/image\/upload\/(?:v\d+\/)?(.+)/);
    if (!match) return null;
    return match[1].replace(/\.[^.]+$/, '');
  } catch { return null; }
}

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
  } catch (err) {
    console.error('[Upload POST]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
    const publicId = extractPublicId(url);
    if (!publicId) return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    await deleteImage(publicId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Upload DELETE]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
