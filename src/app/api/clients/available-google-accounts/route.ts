import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getValidAccessToken, listGoogleAdsClientAccounts } from '@/lib/google-ads';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  if (!agency) return NextResponse.json({ accounts: [], has_connection: false });

  const { data: tokenRow } = await supabase
    .from('agency_tokens')
    .select('access_token, refresh_token, account_id')
    .eq('agency_id', agency.id)
    .eq('platform', 'google_ads')
    .single();
  if (!tokenRow?.access_token || !tokenRow?.account_id) {
    return NextResponse.json({ accounts: [], has_connection: false });
  }

  let accessToken = tokenRow.access_token;
  if (tokenRow.refresh_token) {
    try {
      accessToken = await getValidAccessToken(tokenRow.access_token, tokenRow.refresh_token);
    } catch {
      return NextResponse.json({ accounts: [], has_connection: true });
    }
  }

  const managerId = String(tokenRow.account_id).replace(/-/g, '');
  const allAccounts = await listGoogleAdsClientAccounts(managerId, accessToken);
  const { data: existingClients } = await supabase
    .from('clients')
    .select('google_ads_customer_id')
    .eq('agency_id', agency.id)
    .not('google_ads_customer_id', 'is', null);
  const existingIds = new Set(
    (existingClients ?? []).map((c) => String((c as { google_ads_customer_id: string }).google_ads_customer_id).replace(/-/g, ''))
  );
  const accounts = allAccounts.filter((a) => !existingIds.has(a.id));

  return NextResponse.json({ accounts, has_connection: true });
}
