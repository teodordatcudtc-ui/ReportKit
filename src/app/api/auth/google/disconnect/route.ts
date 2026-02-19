import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function canAccessClient(userId: string, clientId: string): Promise<boolean> {
  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (!agency) return false;
  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('agency_id', agency.id)
    .single();
  return !!client;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  const formData = await req.formData().catch(() => new FormData());
  const clientId = formData.get('client_id')?.toString() ?? '';
  if (!clientId) {
    return NextResponse.redirect(new URL('/clients?error=missing_client', req.url));
  }
  if (!(await canAccessClient(session.user.id, clientId))) {
    return NextResponse.redirect(new URL('/clients?error=forbidden', req.url));
  }

  await getSupabaseAdmin()
    .from('api_tokens')
    .delete()
    .eq('client_id', clientId)
    .eq('platform', 'google_ads');

  await getSupabaseAdmin()
    .from('clients')
    .update({ google_ads_connected: false })
    .eq('id', clientId);

  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/clients/${clientId}?success=google_disconnected`, url.origin));
}
