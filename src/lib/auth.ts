import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rateLimit';

async function findOrCreateUserByEmail(email: string, name: string | null): Promise<{ id: string; email: string; name: string | null }> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.from('users').select('id, email, name').eq('email', email.toLowerCase()).single();
  if (existing) return existing;
  const { data: created, error } = await supabase
    .from('users')
    .insert({ email: email.toLowerCase(), name: name ?? null, password_hash: null })
    .select('id, email, name')
    .single();
  if (error) throw error;
  return created;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { scope: 'openid email profile' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (typeof (credentials as Record<string, unknown>)?.website === 'string') {
          const hp = String((credentials as Record<string, unknown>).website ?? '');
          if (hp.trim().length > 0) return null;
        }

        const headers = (req as unknown as { headers?: Record<string, string> })?.headers ?? {};
        const ip =
          (headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            headers['x-real-ip']?.trim() ||
            'unknown') ?? 'unknown';
        const emailKey = String(credentials.email).toLowerCase().trim();
        const rlIp = rateLimit(`signin:ip:${ip}`, { limit: 12, windowMs: 60_000 });
        const rlEmail = rateLimit(`signin:email:${emailKey}`, { limit: 8, windowMs: 60_000 });
        if (!rlIp.ok || !rlEmail.ok) return null;

        const { data: user, error } = await getSupabaseAdmin()
          .from('users')
          .select('id, email, name, password_hash')
          .eq('email', credentials.email)
          .single();
        if (error || !user?.password_hash) return null;
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        if (user.id) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        } else if (user.email && account?.provider === 'google') {
          const dbUser = await findOrCreateUserByEmail(user.email, user.name ?? null);
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name ?? undefined;
        }
      }
      if (trigger === 'update' && session?.user) {
        if (typeof session.user.name === 'string') token.name = session.user.name;
        if (typeof session.user.email === 'string') token.email = session.user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      if (session.user) {
        if (typeof token.name === 'string') session.user.name = token.name;
        if (typeof token.email === 'string') session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin',
  },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface User {
    id?: string;
  }
  interface Session {
    user: User & { id?: string };
  }
}
