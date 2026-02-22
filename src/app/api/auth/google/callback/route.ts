import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { OAuth2Client } from 'google-auth-library';
import { canUseAsManagerAccount } from '@/lib/google-ads';

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
  let debugReason: string | null = null;
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${tokens.access_token}` };
    if (devToken) headers['developer-token'] = devToken;
    const res = await fetch('https://googleads.googleapis.com/v20/customers:listAccessibleCustomers', {
      method: 'GET',
      headers,
    });
    const text = await res.text();
    let data: { resourceNames?: string[]; error?: { message?: string; code?: number } };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      console.error('[Google OAuth] listAccessibleCustomers non-JSON response:', res.status, text.slice(0, 400));
      managerCustomerId = null;
      debugReason = 'api_non_json';
      data = {};
    }
    if (debugReason === null) {
      if (!res.ok) {
        console.error('[Google OAuth] listAccessibleCustomers failed:', res.status, JSON.stringify(data));
        debugReason = `api_${res.status}`;
      } else {
        const rawIds = data?.resourceNames ?? [];
        const ids = rawIds.map((r) => String(r).replace('customers/', '').replace(/-/g, ''));
        console.error('[Google OAuth] listAccessibleCustomers ids:', ids.length, ids.slice(0, 5));
        if (ids.length === 0) {
          debugReason = 'empty_list';
        } else {
          for (const id of ids) {
            const ok = await canUseAsManagerAccount(id, tokens.access_token!);
            if (ok) {
              managerCustomerId = id;
              console.error('[Google OAuth] using manager id:', id);
              break;
            }
          }
          if (!managerCustomerId) {
            console.error('[Google OAuth] no id passed canUseAsManagerAccount, tried:', ids);
            debugReason = 'no_valid_manager';
          }
        }
      }
    }
  } catch (e) {
    console.error('[Google OAuth] listAccessibleCustomers error:', e);
    managerCustomerId = null;
    debugReason = 'exception';
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
      const debug = debugReason ? `&debug=${encodeURIComponent(debugReason)}` : '';
      return NextResponse.redirect(new URL(`/dashboard/agency?error=no_google_ads_account${debug}`, req.url));
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
