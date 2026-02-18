import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

async function getAgencyId(userId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data?.id ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  if (!agencyId) return NextResponse.json({ clients: [] });

  const { data: clients, error } = await getSupabaseAdmin()
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clientIds = (clients ?? []).map((c) => c.id);
  const { data: reports } = clientIds.length
    ? await getSupabaseAdmin()
        .from('reports')
        .select('client_id, report_date_end, pdf_url, created_at')
        .in('client_id', clientIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    : { data: [] };
  const lastReportByClient: Record<string, { date: string; pdf_url: string }> = {};
  for (const r of reports ?? []) {
    if (!lastReportByClient[r.client_id]) {
      lastReportByClient[r.client_id] = {
        date: r.report_date_end,
        pdf_url: r.pdf_url ?? '',
      };
    }
  }

  const withLastReport = (clients ?? []).map((c) => ({
    ...c,
    last_report: lastReportByClient[c.id] ?? null,
  }));
  return NextResponse.json({ clients: withLastReport });
}

const createSchema = z.object({ client_name: z.string().min(1) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  if (!agencyId) return NextResponse.json({ error: 'Create an agency first' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid client name' }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from('clients')
    .insert({
      agency_id: agencyId,
      client_name: parsed.data.client_name,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
