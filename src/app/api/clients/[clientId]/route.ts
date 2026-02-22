import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';

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

const patchSchema = z.object({
  report_settings: z.record(z.string(), z.unknown()).optional(),
  skip_report_modal: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { clientId } = await params;
  if (!(await canAccessClient(session.user.id, clientId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const updates: Record<string, unknown> = {};
  if (parsed.data.report_settings !== undefined) updates.report_settings = parsed.data.report_settings;
  if (parsed.data.skip_report_modal !== undefined) updates.skip_report_modal = parsed.data.skip_report_modal;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { clientId } = await params;
  if (!(await canAccessClient(session.user.id, clientId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const supabase = getSupabaseAdmin();
  await supabase.from('api_tokens').delete().eq('client_id', clientId);
  await supabase.from('reports').delete().eq('client_id', clientId);
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
