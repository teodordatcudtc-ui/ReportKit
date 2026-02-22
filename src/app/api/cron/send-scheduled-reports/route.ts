import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateReportPdfBuffer } from '@/lib/report-pdf-generator';
import { sendReportByResend } from '@/lib/send-report-email-resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
/** Folosim Node runtime ca să evităm limite de header pe Edge (400 Request Header Too Large) */
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? '';
  const authHeader = req.headers.get('authorization');
  let keyParam: string | null = null;
  try {
    const url = new URL(req.url);
    keyParam = url.searchParams.get('key')?.trim() ?? null;
  } catch {
    const q = req.url.includes('?') ? req.url.split('?')[1] : '';
    keyParam = new URLSearchParams(q).get('key')?.trim() ?? null;
  }
  const authorizedByHeader = secret.length > 0 && authHeader === `Bearer ${secret}`;
  const authorizedByKey = secret.length > 0 && keyParam !== null && keyParam === secret;
  if (secret.length > 0 && !authorizedByHeader && !authorizedByKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: due, error: fetchErr } = await supabase
    .from('scheduled_reports')
    .select('id, agency_id, client_id, send_to_email, from_email')
    .lte('next_send_at', now);
  if (fetchErr) {
    console.error('Cron send-scheduled-reports fetch:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!due?.length) return NextResponse.json({ sent: 0, total: 0, message: 'No reports due' });

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const dateStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().slice(0, 10);
  const dateEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().slice(0, 10);

  const errors: { id: string; to: string; error: string }[] = [];
  let sent = 0;
  for (const row of due) {
    try {
      const { buffer, clientName } = await generateReportPdfBuffer(supabase, {
        agencyId: row.agency_id,
        clientId: row.client_id,
        dateStart,
        dateEnd,
      });

      await sendReportByResend({
        to: row.send_to_email,
        replyTo: row.from_email ?? undefined,
        subject: `Raport performanta ${clientName} – ${dateStart} / ${dateEnd}`,
        clientName,
        pdfBuffer: buffer,
        filename: `raport_${row.client_id}_${dateStart}_${dateEnd}.pdf`,
      });

      const nextSend = new Date();
      nextSend.setMonth(nextSend.getMonth() + 1);
      nextSend.setDate(1);
      await supabase
        .from('scheduled_reports')
        .update({ last_sent_at: new Date().toISOString(), next_send_at: nextSend.toISOString() })
        .eq('id', row.id);
      sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Cron send report failed for', row.id, message, e);
      errors.push({ id: row.id, to: row.send_to_email ?? '', error: message });
    }
  }

  return NextResponse.json({
    sent,
    total: due.length,
    ...(errors.length ? { errors } : {}),
  });
}
