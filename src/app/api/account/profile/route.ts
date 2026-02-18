import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getToken } from 'next-auth/jwt';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rateLimit';
import { getClientIp } from '@/lib/security/request';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name too long'),
});

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const rl = rateLimit(`account:profile:${userId}:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('users')
    .update({ name: parsed.data.name })
    .eq('id', userId)
    .select('id, email, name')
    .single();

  if (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

