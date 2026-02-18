import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  ReportPDF,
  type GoogleMetrics,
  type MetaMetrics,
} from '@/lib/report-pdf';
import { getValidAccessToken, fetchGoogleAdsData } from '@/lib/google-ads';
import { fetchMetaAdsData } from '@/lib/meta-ads';

const bodySchema = z.object({
  client_id: z.string().uuid(),
  date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

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
  const { client_id, date_start, date_end } = parsed.data;
  if (!(await canAccessClient(session.user.id, client_id))) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('client_name')
    .eq('id', client_id)
    .single();
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  let agency: { agency_name: string; logo_url: string | null; primary_color: string; website_url?: string | null; contact_email?: string | null; contact_phone?: string | null };
  const { data: agencyFull, error: agencyErr } = await getSupabaseAdmin()
    .from('agencies')
    .select('agency_name, logo_url, primary_color, website_url, contact_email, contact_phone')
    .eq('user_id', session.user.id)
    .single();
  if (agencyErr) {
    const { data: agencyBase } = await getSupabaseAdmin()
      .from('agencies')
      .select('agency_name, logo_url, primary_color')
      .eq('user_id', session.user.id)
      .single();
    if (!agencyBase) return NextResponse.json({ error: 'Agency not found' }, { status: 400 });
    agency = { ...agencyBase, website_url: null, contact_email: null, contact_phone: null };
  } else if (agencyFull) {
    agency = agencyFull as typeof agency;
  } else {
    return NextResponse.json({ error: 'Agency not found' }, { status: 400 });
  }

  const { data: tokens } = await getSupabaseAdmin()
    .from('api_tokens')
    .select('*')
    .eq('client_id', client_id);
  const googleToken = (tokens ?? []).find((t) => t.platform === 'google_ads');
  const metaToken = (tokens ?? []).find((t) => t.platform === 'meta_ads');

  const reportData: { google?: GoogleMetrics; meta?: MetaMetrics } = {};

  if (googleToken?.access_token && googleToken?.account_id) {
    let accessToken = googleToken.access_token;
    if (googleToken.refresh_token) {
      try {
        accessToken = await getValidAccessToken(
          googleToken.access_token,
          googleToken.refresh_token
        );
      } catch {}
    }
    const googleMetrics = await fetchGoogleAdsData(
      googleToken.account_id,
      accessToken,
      date_start,
      date_end
    );
    reportData.google = {
      impressions: googleMetrics.impressions,
      clicks: googleMetrics.clicks,
      cost: googleMetrics.cost_micros / 1_000_000,
      ctr: googleMetrics.ctr,
      conversions: googleMetrics.conversions,
      avg_cpc: googleMetrics.average_cpc / 1_000_000,
    };
  }

  if (metaToken?.access_token && metaToken?.account_id) {
    const metaMetrics = await fetchMetaAdsData(
      metaToken.account_id,
      metaToken.access_token,
      date_start,
      date_end
    );
    reportData.meta = {
      impressions: metaMetrics.impressions,
      clicks: metaMetrics.clicks,
      spend: metaMetrics.spend,
      ctr: metaMetrics.ctr,
      conversions: metaMetrics.conversions,
      cpc: metaMetrics.cpc,
    };
  }

  const pdfElement = React.createElement(ReportPDF, {
    data: reportData,
    agencyInfo: agency,
    clientInfo: client,
    dateStart: date_start,
    dateEnd: date_end,
  });
  let pdfBuffer: Buffer;
  try {
    // ReportPDF renders <Document> at root; renderToBuffer expects DocumentProps at type level
    const buf = await renderToBuffer(pdfElement as Parameters<typeof renderToBuffer>[0]);
    pdfBuffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  } catch (e) {
    console.error('PDF render error:', e);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }

  const fileName = `${client_id}_${date_start}_${date_end}.pdf`;
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from('reports')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to save PDF' }, { status: 500 });
  }
  const { data: urlData } = getSupabaseAdmin().storage.from('reports').getPublicUrl(fileName);
  const pdfUrl = urlData?.publicUrl ?? '';

  const { data: report, error: insertError } = await getSupabaseAdmin()
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
