import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { rateLimit, LIMITS } from '@/lib/rateLimit';
import { validateBody, RegisterSchema } from '@/lib/validation';
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, LIMITS.register);
  if (limited) return limited;
  try {
    const raw = await req.json();
    const v = validateBody(RegisterSchema, raw);
    if (!v.data) return NextResponse.json({ error: v.error }, { status: 400 });
    await connectDB();
    if (await User.findOne({ email: v.data.email })) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    const user = await User.create({ name: v.data.name, email: v.data.email, password: await bcrypt.hash(v.data.password, 12), phone: v.data.phone, role: 'user' });
    return NextResponse.json({ message: 'Account created', userId: user._id });
  } catch { return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 }); }
}
