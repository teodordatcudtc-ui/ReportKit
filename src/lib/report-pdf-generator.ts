import type { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPDF, type GoogleMetrics, type MetaMetrics, type DailyTrendRow } from '@/lib/report-pdf';
import {
  getValidAccessToken,
  fetchGoogleAdsData,
  fetchGoogleAdsQualityScore,
  fetchGoogleAdsDeviceBreakdown,
  fetchGoogleAdsGeographic,
  fetchGoogleAdsDaily,
} from '@/lib/google-ads';
import { fetchMetaAdsData, fetchMetaAdsDaily } from '@/lib/meta-ads';
import { normalizeReportSettings } from '@/lib/report-settings';

export async function generateReportPdfBuffer(
  supabase: SupabaseClient,
  params: {
    agencyId: string;
    clientId: string;
    dateStart: string;
    dateEnd: string;
    /** Override: setari raport (din client sau din body la generare); daca lipseste, se foloseste agency.report_settings */
    reportSettingsOverride?: unknown;
  }
): Promise<{ buffer: Buffer; clientName: string; agencyName: string }> {
  const { agencyId, clientId, dateStart, dateEnd, reportSettingsOverride } = params;

  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('client_name, google_ads_connected, meta_ads_connected, google_ads_customer_id, meta_ad_account_id, report_settings')
    .eq('id', clientId)
    .eq('agency_id', agencyId)
    .single();
  if (clientErr || !client) throw new Error('Client not found');

  const { data: agency, error: agencyErr } = await supabase
    .from('agencies')
    .select('agency_name, logo_url, primary_color, website_url, contact_email, contact_phone, report_settings')
    .eq('id', agencyId)
    .single();
  if (agencyErr || !agency) throw new Error('Agency not found');

  const reportSettings = normalizeReportSettings(
    reportSettingsOverride ?? (client as { report_settings?: unknown }).report_settings ?? agency.report_settings ?? null
  );

  const { data: agencyTokens } = await supabase.from('agency_tokens').select('*').eq('agency_id', agencyId);
  const agencyGoogle = (agencyTokens ?? []).find((t: { platform: string }) => t.platform === 'google_ads');
  const agencyMeta = (agencyTokens ?? []).find((t: { platform: string }) => t.platform === 'meta_ads');

  const { data: clientTokens } = await supabase.from('api_tokens').select('*').eq('client_id', clientId);
  const clientGoogle = (clientTokens ?? []).find((t: { platform: string }) => t.platform === 'google_ads');
  const clientMeta = (clientTokens ?? []).find((t: { platform: string }) => t.platform === 'meta_ads');

  const googleToken =
    client.google_ads_customer_id && agencyGoogle
      ? { ...agencyGoogle, account_id: client.google_ads_customer_id }
      : clientGoogle;
  const metaToken =
    client.meta_ad_account_id && agencyMeta
      ? { ...agencyMeta, account_id: client.meta_ad_account_id }
      : clientMeta;

  const reportData: { google?: GoogleMetrics; meta?: MetaMetrics } = {};
  let googleDeviceBreakdown: { device: string; impressions: number; clicks: number; cost_micros: number }[] = [];
  let googleGeographicBreakdown: { country: string; impressions: number; clicks: number; cost_micros: number }[] = [];
  const dailyTrendByDate: Record<string, DailyTrendRow> = {};

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
          const [qs, deviceRows, geoRows, dailyRows] = await Promise.all([
            fetchGoogleAdsQualityScore(customerId, accessToken, dateStart, dateEnd),
            fetchGoogleAdsDeviceBreakdown(customerId, accessToken, dateStart, dateEnd),
            fetchGoogleAdsGeographic(customerId, accessToken, dateStart, dateEnd),
            fetchGoogleAdsDaily(customerId, accessToken, dateStart, dateEnd),
          ]);
          if (qs != null) (googleMetrics as Record<string, unknown>).quality_score = qs;
          googleDeviceBreakdown = deviceRows;
          googleGeographicBreakdown = geoRows;
          for (const row of dailyRows) {
            const key = row.date;
            if (!dailyTrendByDate[key]) {
              dailyTrendByDate[key] = { date: key, impressions: 0, spend: 0 };
            }
            dailyTrendByDate[key].impressions += row.impressions;
            dailyTrendByDate[key].spend += row.cost_micros / 1_000_000;
          }
        }
        reportData.google = {
          impressions: googleMetrics.impressions,
          clicks: googleMetrics.clicks,
          cost: googleMetrics.cost_micros / 1_000_000,
          ctr: googleMetrics.ctr,
          conversions: googleMetrics.conversions,
          avg_cpc: googleMetrics.average_cpc / 1_000_000,
        };
        const g = googleMetrics as import('@/lib/google-ads').GoogleAdsMetrics;
        if (g.impression_share != null) reportData.google.impression_share = g.impression_share;
        if (g.search_impression_share != null) reportData.google.search_impression_share = g.search_impression_share;
        if (g.top_of_page_rate != null) reportData.google.top_of_page_rate = g.top_of_page_rate;
        if (g.quality_score != null) reportData.google.quality_score = g.quality_score;
        if (g.conversions_value != null) reportData.google.conversion_value = g.conversions_value;
        if (g.roas != null) reportData.google.roas = g.roas;
        if (g.cpa != null) reportData.google.cpa = g.cpa;
      } catch {
        reportData.google = zeroGoogleMetrics;
      }
    } else {
      reportData.google = zeroGoogleMetrics;
    }
  }

  if (metaToken?.access_token && metaToken?.account_id) {
    const [metaMetrics, metaDailyRows] = await Promise.all([
      fetchMetaAdsData(metaToken.account_id, metaToken.access_token, dateStart, dateEnd),
      fetchMetaAdsDaily(metaToken.account_id, metaToken.access_token, dateStart, dateEnd),
    ]);
    reportData.meta = {
      impressions: metaMetrics.impressions,
      clicks: metaMetrics.clicks,
      spend: metaMetrics.spend,
      ctr: metaMetrics.ctr,
      conversions: metaMetrics.conversions,
      cpc: metaMetrics.cpc,
    };
    if (metaMetrics.reach != null) reportData.meta.reach = metaMetrics.reach;
    if (metaMetrics.frequency != null) reportData.meta.frequency = metaMetrics.frequency;
    if (metaMetrics.link_clicks != null) reportData.meta.link_clicks = metaMetrics.link_clicks;
    if (metaMetrics.cpm != null) reportData.meta.cpm = metaMetrics.cpm;
    if (metaMetrics.engagement_rate != null) reportData.meta.engagement_rate = metaMetrics.engagement_rate;
    if (metaMetrics.video_views != null) reportData.meta.video_views = metaMetrics.video_views;
    if (metaMetrics.video_p25 != null) reportData.meta.video_p25 = metaMetrics.video_p25;
    if (metaMetrics.video_p50 != null) reportData.meta.video_p50 = metaMetrics.video_p50;
    if (metaMetrics.video_p100 != null) reportData.meta.video_p100 = metaMetrics.video_p100;
    for (const row of metaDailyRows) {
      const key = row.date;
      if (!dailyTrendByDate[key]) {
        dailyTrendByDate[key] = { date: key, impressions: 0, spend: 0 };
      }
      dailyTrendByDate[key].impressions += row.impressions;
      dailyTrendByDate[key].spend += row.spend;
    }
  }

  const dailyTrend = Object.values(dailyTrendByDate).sort((a, b) => a.date.localeCompare(b.date));

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
    reportSettings,
    googleDeviceBreakdown: googleDeviceBreakdown.length > 0 ? googleDeviceBreakdown : undefined,
    googleGeographicBreakdown: googleGeographicBreakdown.length > 0 ? googleGeographicBreakdown : undefined,
    dailyTrend: dailyTrend.length > 0 ? dailyTrend : undefined,
    agencyInfo,
    clientInfo: { client_name: client.client_name },
    dateStart,
    dateEnd,
  });
  const buf = await renderToBuffer(pdfElement as Parameters<typeof renderToBuffer>[0]);
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return { buffer, clientName: client.client_name, agencyName: agency.agency_name };
}
