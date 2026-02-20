import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { getPlanLimit } from '@/lib/plans';
import { generateReportPdfBuffer } from '@/lib/report-pdf-generator';

const bodySchema = z.object({
  client_id: z.string().uuid(),
  date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  report_settings: z.record(z.string(), z.unknown()).optional(),
});

async function canAccessClient(userId: string, clientId: string): Promise<{ agencyId: string; plan: string | null } | null> {
  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id, plan')
    .eq('user_id', userId)
    .single();
  if (!agency) return null;
  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('agency_id', agency.id)
    .single();
  return client ? { agencyId: agency.id, plan: agency.plan ?? null } : null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { client_id, date_start, date_end, report_settings: bodyReportSettings } = parsed.data;
  const access = await canAccessClient(session.user.id, client_id);
  if (!access) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  const supabase = getSupabaseAdmin();
  const { data: clientRow } = await supabase.from('clients').select('report_settings').eq('id', client_id).single();
  const { data: agencyRow } = await supabase.from('agencies').select('report_settings').eq('id', access.agencyId).single();
  const reportSettingsOverride =
    bodyReportSettings ?? (clientRow?.report_settings as Record<string, unknown> | null) ?? (agencyRow?.report_settings as Record<string, unknown> | null);

  const limits = getPlanLimit(access.plan);
  if (limits.maxReportsPerMonth !== Infinity) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    const { data: clientIds } = await supabase
      .from('clients')
      .select('id')
      .eq('agency_id', access.agencyId);
    const ids = (clientIds ?? []).map((c) => c.id);
    const { count } = ids.length
      ? await supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .in('client_id', ids)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd + 'T23:59:59.999Z')
      : { count: 0 };
    if ((count ?? 0) >= limits.maxReportsPerMonth) {
      return NextResponse.json(
        { error: `Limita planului Free: maxim ${limits.maxReportsPerMonth} rapoarte/luna. Fa upgrade pentru mai multe.` },
        { status: 403 }
      );
    }
  }

  let pdfBuffer: Buffer;
  try {
    const result = await generateReportPdfBuffer(supabase, {
      agencyId: access.agencyId,
      clientId: client_id,
      dateStart: date_start,
      dateEnd: date_end,
      reportSettingsOverride: reportSettingsOverride ?? undefined,
    });
    pdfBuffer = result.buffer;
  } catch (e) {
    console.error('PDF generate error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to generate PDF' }, { status: 500 });
  }

  const uniqueId = crypto.randomUUID();
  const fileName = `${client_id}_${date_start}_${date_end}_${uniqueId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });
  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 });
  }
  const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
  const pdfUrl = urlData?.publicUrl ?? '';

  const { data: report, error: insertError } = await supabase
    .from('reports')
    .insert({
      client_id,
      report_date_start: date_start,
      report_date_end: date_end,
      pdf_url: pdfUrl,
      status: 'completed',
    })
    .select('id')
    .single();
  if (insertError) {
    console.error('Report insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    pdf_url: pdfUrl,
    report_id: report?.id,
  });
}
