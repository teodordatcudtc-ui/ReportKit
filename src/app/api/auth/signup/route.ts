import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 characters'),
  name: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstMessage = Object.values(fieldErrors).flat()[0];
      return NextResponse.json(
        { error: typeof firstMessage === 'string' ? firstMessage : 'Invalid email or password' },
        { status: 400 }
      );
    }
    const { email, password, name } = parsed.data;

    const { data: existing } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error } = await getSupabaseAdmin()
      .from('users')
      .insert({ email, name: name ?? null, password_hash })
      .select('id, email, name')
      .single();

    if (error) {
      console.error('Signup DB error:', error);
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error('Signup error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
