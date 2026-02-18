import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  let clientId: string;
  try {
    clientId = state ? JSON.parse(Buffer.from(state, 'base64url').toString()).client_id : '';
  } catch {
    clientId = '';
  }
  if (!code || !clientId) {
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
      return NextResponse.redirect(new URL(`/clients/${clientId}?error=meta_token`, req.url));
    }
    accessToken = data.access_token;
  } catch (e) {
    console.error('Meta token exchange error:', e);
    return NextResponse.redirect(new URL(`/clients/${clientId}?error=meta_token`, req.url));
  }

  const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${accessToken}`;
  let longLivedToken = accessToken;
  try {
    const llRes = await fetch(longLivedUrl);
    const llData = (await llRes.json()) as { access_token?: string };
    if (llData.access_token) longLivedToken = llData.access_token;
  } catch {}

  let accountId: string | null = null;
  try {
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const adAccountsData = (await adAccountsRes.json()) as {
      data?: { id: string }[];
      error?: { message: string };
    };
    const accounts = adAccountsData?.data ?? [];
    if (accounts.length >= 1) {
      accountId = accounts[0].id;
    }
  } catch {
    accountId = null;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 60);
  await getSupabaseAdmin().from('api_tokens').upsert(
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
  await getSupabaseAdmin()
    .from('clients')
    .update({ meta_ads_connected: true })
    .eq('id', clientId);

  return NextResponse.redirect(new URL(`/clients/${clientId}?success=meta_connected`, req.url));
}
