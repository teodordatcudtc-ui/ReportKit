import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { OAuth2Client } from 'google-auth-library';
import { listGoogleAdsClientAccounts } from '@/lib/google-ads';

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
  const redirectUri = `${origin}/api/auth/google/callback`;
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  let tokens;
  try {
    const { tokens: t } = await oauth2Client.getToken(code);
    tokens = t;
  } catch (e) {
    console.error('Google token exchange error:', e);
    const dest = isAgencyFlow ? '/dashboard/agency?error=google_token' : `/clients/${clientId}?error=google_token`;
    return NextResponse.redirect(new URL(dest, req.url));
  }
  if (!tokens.access_token) {
    const dest = isAgencyFlow ? '/dashboard/agency?error=google_token' : `/clients/${clientId}?error=google_token`;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  let managerCustomerId: string | null = null;
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${tokens.access_token}` };
    if (devToken) headers['developer-token'] = devToken;
    const res = await fetch('https://googleads.googleapis.com/v16/customers:listAccessibleCustomers', {
      method: 'GET',
      headers,
    });
    const data = (await res.json()) as { resourceNames?: string[] };
    const ids = data?.resourceNames ?? [];
    if (ids.length >= 1) {
      managerCustomerId = ids[0].replace('customers/', '').replace(/-/g, '');
    }
  } catch {
    managerCustomerId = null;
  }

  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;
  const supabase = getSupabaseAdmin();

  if (isAgencyFlow) {
    const agencyId = await getAgencyId(session.user.id);
    if (!agencyId) {
      return NextResponse.redirect(new URL('/dashboard/agency?error=no_agency', req.url));
    }
    if (!managerCustomerId) {
      await supabase.from('agency_tokens').delete().eq('agency_id', agencyId).eq('platform', 'google_ads');
      return NextResponse.redirect(new URL('/dashboard/agency?error=no_google_ads_account', req.url));
    }
    await supabase.from('agency_tokens').upsert(
      {
        agency_id: agencyId,
        platform: 'google_ads',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        account_id: managerCustomerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agency_id,platform' }
    );
    if (devToken) {
      const clients = await listGoogleAdsClientAccounts(managerCustomerId, tokens.access_token);
      for (const c of clients) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('agency_id', agencyId)
          .eq('google_ads_customer_id', c.id)
          .limit(1)
          .single();
        if (existing) continue;
        const { data: byName } = await supabase
          .from('clients')
          .select('id')
          .eq('agency_id', agencyId)
          .ilike('client_name', c.descriptive_name)
          .limit(1)
          .single();
        if (byName?.id) {
          await supabase.from('clients').update({ google_ads_customer_id: c.id, google_ads_connected: true }).eq('id', byName.id);
        } else {
          await supabase.from('clients').insert({
            agency_id: agencyId,
            client_name: c.descriptive_name,
            google_ads_customer_id: c.id,
            google_ads_connected: true,
          });
        }
      }
    }
    return NextResponse.redirect(new URL('/dashboard/agency?success=google_connected', req.url));
  }

  const customerId = managerCustomerId;
  await supabase.from('api_tokens').upsert(
    {
      client_id: clientId,
      platform: 'google_ads',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: expiresAt,
      account_id: customerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'client_id,platform' }
  );
  await supabase.from('clients').update({ google_ads_connected: true, google_ads_customer_id: customerId }).eq('id', clientId);

  return NextResponse.redirect(new URL(`/clients/${clientId}?success=google_connected`, req.url));
}
