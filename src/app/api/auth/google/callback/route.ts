import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { OAuth2Client } from 'google-auth-library';

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
    return NextResponse.redirect(new URL(`/clients/${clientId}?error=google_token`, req.url));
  }
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL(`/clients/${clientId}?error=google_token`, req.url));
  }

  let customerId: string | null = null;
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${tokens.access_token}`,
    };
    if (devToken) headers['developer-token'] = devToken;
    const res = await fetch('https://googleads.googleapis.com/v16/customers:listAccessibleCustomers', {
      method: 'GET',
      headers,
    });
    const data = (await res.json()) as { resourceNames?: string[] };
    const ids = data?.resourceNames ?? [];
    if (ids.length >= 1) {
      customerId = ids[0].replace('customers/', '');
    }
  } catch {
    customerId = null;
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : null;
  await getSupabaseAdmin().from('api_tokens').upsert(
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
  await getSupabaseAdmin()
    .from('clients')
    .update({ google_ads_connected: true })
    .eq('id', clientId);

  return NextResponse.redirect(new URL(`/clients/${clientId}?success=google_connected`, req.url));
}
