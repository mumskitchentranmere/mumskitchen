import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
export async function POST(req: NextRequest) {
  try {
    const { amount, metadata } = await req.json();
    const pi = await stripe.paymentIntents.create({ amount: Math.round(amount * 100), currency: 'aud', metadata, automatic_payment_methods: { enabled: true } });
    return NextResponse.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
