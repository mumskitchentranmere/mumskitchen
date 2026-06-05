import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { rateLimit, LIMITS } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.review);
  if (limited) return limited;
  try {
    const { name, email, phone, message } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const resendKey = process.env.RESEND_API_KEY;
    const toEmail   = process.env.NEXT_PUBLIC_RESTAURANT_EMAIL || 'mumskitchentranmere@gmail.com';
    if (!resendKey) return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from:    'Contact Form <noreply@mumskitchen.com.au>',
      to:      toEmail,
      reply_to: email,
      subject: `New contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'not provided'}\n\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Failed to send message' }, { status: 500 }); }
}
