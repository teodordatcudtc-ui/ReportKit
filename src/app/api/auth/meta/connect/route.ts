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
  const origin = new URL(req.url).origin;
  const appId = process.env.META_APP_ID;
  if (!appId) {
    const dest = clientId ? `/clients/${clientId}?error=meta_not_configured` : '/dashboard/agency?error=meta_not_configured';
    return NextResponse.redirect(new URL(dest, origin));
  }
  const redirectUri = `${origin}/api/auth/meta/callback`;
  const stateObj: { client_id?: string; agency?: boolean } = clientId ? { client_id: clientId } : { agency: true };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  const scope = 'public_profile,business_management,ads_management';
  const url = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  return NextResponse.redirect(url);
}
