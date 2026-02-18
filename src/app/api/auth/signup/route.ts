import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPasswordIssues, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/security/password';
import { rateLimit } from '@/lib/security/rateLimit';
import { getClientIp } from '@/lib/security/request';
import type { NextRequest } from 'next/server';

const signupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Min ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Max ${PASSWORD_MAX_LENGTH} characters`),
  name: z.string().min(1).optional(),
  website: z.string().optional(), // honeypot
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`signup:ip:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
    }

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
    const { email, password, name, website } = parsed.data;

    if (typeof website === 'string' && website.trim().length > 0) {
      // honeypot filled => likely bot
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const pwIssues = getPasswordIssues(password);
    if (pwIssues.length > 0) {
      return NextResponse.json({ error: `Password: ${pwIssues[0]}` }, { status: 400 });
    }

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
