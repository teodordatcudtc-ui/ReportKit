import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const origin = new URL(req.url).origin;
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', origin));
  }
  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  if (!agency) {
    return NextResponse.redirect(new URL('/dashboard/agency?error=no_agency', origin));
  }
  await getSupabaseAdmin().from('agency_tokens').delete().eq('agency_id', agency.id).eq('platform', 'meta_ads');
  await getSupabaseAdmin()
    .from('clients')
    .update({ meta_ads_connected: false, meta_ad_account_id: null })
    .eq('agency_id', agency.id);
  return NextResponse.redirect(new URL('/dashboard/agency?success=meta_disconnected', origin));
}
