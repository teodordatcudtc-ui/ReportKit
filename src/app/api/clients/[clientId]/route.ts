import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

async function canAccessClient(userId: string, clientId: string): Promise<boolean> {
  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (!agency) return false;
  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('agency_id', agency.id)
    .single();
  return !!client;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { clientId } = await params;
  if (!(await canAccessClient(session.user.id, clientId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const { data: client, error } = await getSupabaseAdmin()
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error || !client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: tokens } = await getSupabaseAdmin()
    .from('api_tokens')
    .select('platform, account_id')
    .eq('client_id', clientId);
  const { data: reports } = await getSupabaseAdmin()
    .from('reports')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    ...client,
    tokens: tokens ?? [],
    reports: reports ?? [],
  });
}
