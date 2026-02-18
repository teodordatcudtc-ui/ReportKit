import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 50);

  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!agency) return NextResponse.json({ reports: [] });

  const { data: clientIds } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('agency_id', agency.id);
  const ids = (clientIds ?? []).map((c) => c.id);
  if (ids.length === 0) return NextResponse.json({ reports: [] });

  const { data: reports, error } = await getSupabaseAdmin()
    .from('reports')
    .select(`
      id,
      client_id,
      report_date_start,
      report_date_end,
      pdf_url,
      status,
      created_at,
      clients ( client_name )
    `)
    .in('client_id', ids)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: reports ?? [] });
}
