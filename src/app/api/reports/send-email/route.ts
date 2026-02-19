import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { sendReportByResend } from '@/lib/send-report-email-resend';

const bodySchema = z.object({
  report_id: z.string().uuid(),
  to_email: z.string().email(),
  from_email: z.string().email().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'to_email obligatoriu, report_id valid' }, { status: 400 });

  const { report_id, to_email, from_email } = parsed.data;

  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 });

  const { data: report, error: reportErr } = await getSupabaseAdmin()
    .from('reports')
    .select('id, client_id, report_date_start, report_date_end, pdf_url')
    .eq('id', report_id)
    .single();
  if (reportErr || !report?.pdf_url) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id, client_name')
    .eq('id', report.client_id)
    .eq('agency_id', agency.id)
    .single();
  if (!client) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

  let pdfBuffer: Buffer;
  try {
    const res = await fetch(report.pdf_url);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const ab = await res.arrayBuffer();
    pdfBuffer = Buffer.from(ab);
  } catch (e) {
    console.error('Fetch PDF error:', e);
    return NextResponse.json({ error: 'Nu s-a putut descarca PDF-ul raportului.' }, { status: 500 });
  }

  try {
    await sendReportByResend({
      to: to_email,
      replyTo: from_email ?? undefined,
      subject: `Raport performanta ${client.client_name} – ${report.report_date_start} / ${report.report_date_end}`,
      clientName: client.client_name,
      pdfBuffer,
      filename: `raport_${report.client_id}_${report.report_date_start}_${report.report_date_end}.pdf`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Eroare la trimitere email';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
