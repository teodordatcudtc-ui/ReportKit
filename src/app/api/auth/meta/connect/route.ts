import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  if (!clientId) {
    return NextResponse.redirect(new URL('/clients?error=missing_client', req.url));
  }
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.redirect(new URL(`/clients/${clientId}?error=meta_not_configured`, req.url));
  }
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/meta/callback`;
  const state = Buffer.from(JSON.stringify({ client_id: clientId })).toString('base64url');
  const scope = 'ads_read,business_management';
  const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  return NextResponse.redirect(url);
}
