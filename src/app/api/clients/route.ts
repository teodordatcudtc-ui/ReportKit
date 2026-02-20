import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { getPlanLimit } from '@/lib/plans';

async function getAgency(userId: string): Promise<{ id: string; plan: string | null } | null> {
  const { data } = await getSupabaseAdmin()
    .from('agencies')
    .select('id, plan')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data ? { id: data.id, plan: data.plan ?? null } : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agency = await getAgency(session.user.id);
  if (!agency) return NextResponse.json({ clients: [] });
  const agencyId = agency.id;

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
        .select('client_id, pdf_url, created_at')
        .in('client_id', clientIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    : { data: [] };
  const lastReportByClient: Record<string, { date: string; pdf_url: string }> = {};
  for (const r of reports ?? []) {
    if (!lastReportByClient[r.client_id]) {
      const created = (r as { created_at: string }).created_at;
      lastReportByClient[r.client_id] = {
        date: created ? new Date(created).toLocaleDateString('ro-RO') : '',
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

const createSchema = z.object({
  client_name: z.string().min(1),
  google_ads_customer_id: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agency = await getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'Create an agency first' }, { status: 400 });

  const limits = getPlanLimit(agency.plan);
  const { count } = await getSupabaseAdmin()
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agency.id);
  if ((count ?? 0) >= limits.maxClients) {
    return NextResponse.json(
      { error: `Limita planului curent: maxim ${limits.maxClients} clienti. Fa upgrade pentru mai multi.` },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid client name' }, { status: 400 });

  const insert: { agency_id: string; client_name: string; google_ads_customer_id?: string; google_ads_connected?: boolean } = {
    agency_id: agency.id,
    client_name: parsed.data.client_name,
  };
  if (parsed.data.google_ads_customer_id) {
    insert.google_ads_customer_id = parsed.data.google_ads_customer_id;
    insert.google_ads_connected = true;
  }

  const { data, error } = await getSupabaseAdmin()
    .from('clients')
    .insert(insert)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
