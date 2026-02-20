import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function getAgencyId(userId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data?.id ?? null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  let stateObj: { client_id?: string; agency?: boolean } = {};
  try {
    stateObj = stateParam ? JSON.parse(Buffer.from(stateParam, 'base64url').toString()) : {};
  } catch {}
  const clientId = stateObj.client_id ?? '';
  const isAgencyFlow = Boolean(stateObj.agency);

  if (!code) {
    const dest = isAgencyFlow ? '/dashboard/agency?error=oauth_failed' : '/clients?error=oauth_failed';
    return NextResponse.redirect(new URL(dest, req.url));
  }
  if (!isAgencyFlow && !clientId) {
    return NextResponse.redirect(new URL('/clients?error=oauth_failed', req.url));
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/meta/callback`;
  const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.META_APP_SECRET}&code=${code}`;
  let accessToken: string;
  try {
    const res = await fetch(tokenUrl);
    const data = (await res.json()) as { access_token?: string; error?: { message: string } };
    if (data.error || !data.access_token) {
      console.error('Meta token error:', data);
      const dest = isAgencyFlow ? '/dashboard/agency?error=meta_token' : `/clients/${clientId}?error=meta_token`;
      return NextResponse.redirect(new URL(dest, req.url));
    }
    accessToken = data.access_token;
  } catch (e) {
    console.error('Meta token exchange error:', e);
    const dest = isAgencyFlow ? '/dashboard/agency?error=meta_token' : `/clients/${clientId}?error=meta_token`;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${accessToken}`;
  let longLivedToken = accessToken;
  try {
    const llRes = await fetch(longLivedUrl);
    const llData = (await llRes.json()) as { access_token?: string };
    if (llData.access_token) longLivedToken = llData.access_token;
  } catch {}

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);
  const supabase = getSupabaseAdmin();

  if (isAgencyFlow) {
    const agencyId = await getAgencyId(session.user.id);
    if (!agencyId) {
      return NextResponse.redirect(new URL('/dashboard/agency?error=no_agency', req.url));
    }
    let adAccounts: { id: string; name?: string }[] = [];
    try {
      const adAccountsRes = await fetch(
        `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(longLivedToken)}`
      );
      const adAccountsData = (await adAccountsRes.json()) as {
        data?: { id: string; name?: string }[];
        error?: { message: string };
      };
      adAccounts = adAccountsData?.data ?? [];
    } catch {}
    await supabase.from('agency_tokens').upsert(
      {
        agency_id: agencyId,
        platform: 'meta_ads',
        access_token: longLivedToken,
        refresh_token: null,
        token_expires_at: expiresAt.toISOString(),
        account_id: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agency_id,platform' }
    );
    for (const acc of adAccounts) {
      const adAccountId = acc.id?.startsWith('act_') ? acc.id : `act_${acc.id}`;
      const name = acc.name ?? adAccountId;
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', agencyId)
        .eq('meta_ad_account_id', adAccountId)
        .limit(1)
        .single();
      if (existing) continue;
      const { data: byName } = await supabase
        .from('clients')
        .select('id')
        .eq('agency_id', agencyId)
        .ilike('client_name', name)
        .limit(1)
        .single();
      if (byName?.id) {
        await supabase.from('clients').update({ meta_ad_account_id: adAccountId, meta_ads_connected: true }).eq('id', byName.id);
      } else {
        await supabase.from('clients').insert({
          agency_id: agencyId,
          client_name: name,
          meta_ad_account_id: adAccountId,
          meta_ads_connected: true,
        });
      }
    }
    return NextResponse.redirect(new URL('/dashboard/agency?success=meta_connected', req.url));
  }

  let accountId: string | null = null;
  try {
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const adAccountsData = (await adAccountsRes.json()) as { data?: { id: string }[]; error?: { message: string } };
    const accounts = adAccountsData?.data ?? [];
    if (accounts.length >= 1) {
      accountId = accounts[0].id?.startsWith('act_') ? accounts[0].id : `act_${accounts[0].id}`;
    }
  } catch {
    accountId = null;
  }

  await supabase.from('api_tokens').upsert(
    {
      client_id: clientId,
      platform: 'meta_ads',
      access_token: longLivedToken,
      refresh_token: null,
      token_expires_at: expiresAt.toISOString(),
      account_id: accountId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,platform' }
  );
  await supabase.from('clients').update({ meta_ads_connected: true, meta_ad_account_id: accountId }).eq('id', clientId);

  return NextResponse.redirect(new URL(`/clients/${clientId}?success=meta_connected`, req.url));
}
