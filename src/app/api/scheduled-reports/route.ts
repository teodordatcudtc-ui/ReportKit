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
    .single();
  return data ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agency = await getAgency(session.user.id);
  if (!agency) return NextResponse.json({ scheduled: [] });
  const limits = getPlanLimit(agency.plan);
  if (!limits.scheduledEmail) return NextResponse.json({ scheduled: [] });

  const { data: rows, error } = await getSupabaseAdmin()
    .from('scheduled_reports')
    .select('id, client_id, send_to_email, from_email, next_send_at, last_sent_at, created_at')
    .eq('agency_id', agency.id)
    .order('next_send_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clientIds = Array.from(new Set((rows ?? []).map((r) => r.client_id)));
  const { data: clients } = clientIds.length
    ? await getSupabaseAdmin().from('clients').select('id, client_name').in('id', clientIds)
    : { data: [] };
  const clientMap = Object.fromEntries((clients ?? []).map((c) => [c.id, c.client_name]));

  const scheduled = (rows ?? []).map((r) => ({
    id: r.id,
    client_id: r.client_id,
    client_name: clientMap[r.client_id] ?? '',
    send_to_email: r.send_to_email,
    from_email: r.from_email ?? null,
    next_send_at: r.next_send_at,
    last_sent_at: r.last_sent_at,
    created_at: r.created_at,
  }));
  return NextResponse.json({ scheduled });
}

const createSchema = z.object({
  client_id: z.string().uuid(),
  send_to_email: z.string().email(),
  from_email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agency = await getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 400 });
  const limits = getPlanLimit(agency.plan);
  if (!limits.scheduledEmail) {
    return NextResponse.json(
      { error: 'Trimitere programata pe email e disponibila doar la planul Professional sau Agency.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'client_id si send_to_email invalide' }, { status: 400 });

  const { client_id, send_to_email, from_email } = parsed.data;
  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', client_id)
    .eq('agency_id', agency.id)
    .single();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const now = new Date();
  const nextSend = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: row, error } = await getSupabaseAdmin()
    .from('scheduled_reports')
    .upsert(
      { agency_id: agency.id, client_id, send_to_email, from_email: from_email ?? null, frequency: 'monthly', next_send_at: nextSend.toISOString() },
      { onConflict: 'agency_id,client_id' }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(row);
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const agency = await getAgency(session.user.id);
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 400 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const parsed = deleteSchema.safeParse({ id });
  if (!parsed.success) return NextResponse.json({ error: 'id invalid' }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from('scheduled_reports')
    .delete()
    .eq('id', parsed.data.id)
    .eq('agency_id', agency.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
