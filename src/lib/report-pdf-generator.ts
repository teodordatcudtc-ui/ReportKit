import type { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPDF, type GoogleMetrics, type MetaMetrics } from '@/lib/report-pdf';
import { getValidAccessToken, fetchGoogleAdsData } from '@/lib/google-ads';
import { fetchMetaAdsData } from '@/lib/meta-ads';

export async function generateReportPdfBuffer(
  supabase: SupabaseClient,
  params: { agencyId: string; clientId: string; dateStart: string; dateEnd: string }
): Promise<{ buffer: Buffer; clientName: string; agencyName: string }> {
  const { agencyId, clientId, dateStart, dateEnd } = params;

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('client_name, google_ads_connected, meta_ads_connected')
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .single();
  if (clientErr || !client) throw new Error('Client not found');

  const { data: agency, error: agencyErr } = await supabase
    .from('agencies')
    .select('agency_name, logo_url, primary_color, website_url, contact_email, contact_phone')
    .eq('id', agencyId)
    .single();
  if (agencyErr || !agency) throw new Error('Agency not found');

  const { data: tokens } = await supabase.from('api_tokens').select('*').eq('client_id', clientId);
  const googleToken = (tokens ?? []).find((t: { platform: string }) => t.platform === 'google_ads');
  const metaToken = (tokens ?? []).find((t: { platform: string }) => t.platform === 'meta_ads');

  const reportData: { google?: GoogleMetrics; meta?: MetaMetrics } = {};

  const zeroGoogleMetrics: GoogleMetrics = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    ctr: 0,
    conversions: 0,
    avg_cpc: 0,
  };

  const zeroGoogleAdsRaw = {
    impressions: 0,
    clicks: 0,
    cost_micros: 0,
    conversions: 0,
    ctr: 0,
    average_cpc: 0,
  };

  if (client.google_ads_connected) {
    if (googleToken?.access_token) {
      const canFetchGoogle =
        googleToken.account_id || process.env.GOOGLE_ADS_MOCK_DATA === 'true';
      let googleMetrics = zeroGoogleAdsRaw;
      try {
        let accessToken = googleToken.access_token;
        if (googleToken.refresh_token) {
          try {
            accessToken = await getValidAccessToken(googleToken.access_token, googleToken.refresh_token);
          } catch {}
        }
        const customerId = googleToken.account_id || '0';
        if (canFetchGoogle) {
          googleMetrics = await fetchGoogleAdsData(customerId, accessToken, dateStart, dateEnd);
        }
        reportData.google = {
          impressions: googleMetrics.impressions,
          clicks: googleMetrics.clicks,
          cost: googleMetrics.cost_micros / 1_000_000,
          ctr: googleMetrics.ctr,
          conversions: googleMetrics.conversions,
          avg_cpc: googleMetrics.average_cpc / 1_000_000,
        };
      } catch {
        reportData.google = zeroGoogleMetrics;
      }
    } else {
      reportData.google = zeroGoogleMetrics;
    }
  }

  if (metaToken?.access_token && metaToken?.account_id) {
    const metaMetrics = await fetchMetaAdsData(metaToken.account_id, metaToken.access_token, dateStart, dateEnd);
    reportData.meta = {
      impressions: metaMetrics.impressions,
      clicks: metaMetrics.clicks,
      spend: metaMetrics.spend,
      ctr: metaMetrics.ctr,
      conversions: metaMetrics.conversions,
      cpc: metaMetrics.cpc,
    };
  }

  const agencyInfo = {
    agency_name: agency.agency_name,
    logo_url: agency.logo_url ?? null,
    primary_color: agency.primary_color ?? '#3B82F6',
    website_url: agency.website_url ?? null,
    contact_email: agency.contact_email ?? null,
    contact_phone: agency.contact_phone ?? null,
  };

  const pdfElement = React.createElement(ReportPDF, {
    data: reportData,
    agencyInfo,
    clientInfo: { client_name: client.client_name },
    dateStart,
    dateEnd,
  });
  const buf = await renderToBuffer(pdfElement as Parameters<typeof renderToBuffer>[0]);
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return { buffer, clientName: client.client_name, agencyName: agency.agency_name };
}
