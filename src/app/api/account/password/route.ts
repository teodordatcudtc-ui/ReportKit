import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getPasswordIssues } from '@/lib/security/password';
import { rateLimit } from '@/lib/security/rateLimit';
import { getClientIp } from '@/lib/security/request';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const rl = rateLimit(`account:password:${userId}:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const msg = fieldErrors.currentPassword?.[0] ?? fieldErrors.newPassword?.[0] ?? 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const pwIssues = getPasswordIssues(parsed.data.newPassword);
  if (pwIssues.length > 0) {
    return NextResponse.json({ error: `Password: ${pwIssues[0]}` }, { status: 400 });
  }

  const { data: user, error: userErr } = await getSupabaseAdmin()
    .from('users')
    .select('id, password_hash')
    .eq('id', userId)
    .single();
  if (userErr || !user?.password_hash) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid password' }, { status: 400 });

  const password_hash = await bcrypt.hash(parsed.data.newPassword, 10);
  const { error: updateErr } = await getSupabaseAdmin()
    .from('users')
    .update({ password_hash })
    .eq('id', userId);

  if (updateErr) {
    console.error('Update password error:', updateErr);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

