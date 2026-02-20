import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('client_id');
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const clientIdEnv = process.env.GOOGLE_CLIENT_ID;
  if (!clientIdEnv) {
    const dest = clientId ? `/clients/${clientId}?error=google_not_configured` : '/dashboard/agency?error=google_not_configured';
    return NextResponse.redirect(new URL(dest, origin));
  }
  const stateObj: { client_id?: string; agency?: boolean } = clientId
    ? { client_id: clientId }
    : { agency: true };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientIdEnv);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return NextResponse.redirect(url.toString());
}
