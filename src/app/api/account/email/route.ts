import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rateLimit';
import { getClientIp } from '@/lib/security/request';

const schema = z.object({
  email: z.string().trim().email('Invalid email'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const rl = rateLimit(`account:email:${userId}:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const msg = fieldErrors.email?.[0] ?? fieldErrors.currentPassword?.[0] ?? 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const newEmail = parsed.data.email.toLowerCase();

  // verify current password
  const { data: user, error: userErr } = await getSupabaseAdmin()
    .from('users')
    .select('id, email, name, password_hash')
    .eq('id', userId)
    .single();
  if (userErr || !user?.password_hash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 400 });

  if (newEmail === user.email) {
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  }

  const { data: existing } = await getSupabaseAdmin().from('users').select('id').eq('email', newEmail).single();
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const { data: updated, error: updateErr } = await getSupabaseAdmin()
    .from('users')
    .update({ email: newEmail })
    .eq('id', userId)
    .select('id, email, name')
    .single();

  if (updateErr) {
    console.error('Update email error:', updateErr);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ user: updated });
}

