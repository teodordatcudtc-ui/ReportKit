/** Chei pentru campurile din raportul PDF – folosite în Setari agenție și la generare PDF */
export const GOOGLE_REPORT_KEYS = [
  'impressions',
  'clicks',
  'cost',
  'ctr',
  'conversions',
  'avg_cpc',
  'quality_score',
  'impression_share',
  'search_impression_share',
  'top_of_page_rate',
  'device_breakdown',
  'geographic_performance',
  'roas',
  'conversion_value',
  'cpa',
] as const;

export const META_REPORT_KEYS = [
  'impressions',
  'clicks',
  'spend',
  'ctr',
  'conversions',
  'cpc',
  'reach',
  'frequency',
  'link_clicks',
  'cpm',
  'engagement_rate',
  'video_views',
  'video_p25',
  'video_p50',
  'video_p100',
] as const;

export const REPORT_CHART_KEYS = ['device_breakdown', 'performance_trend'] as const;

export const GOOGLE_LABELS: Record<GoogleReportKey, string> = {
  impressions: 'Impresii',
  clicks: 'Click-uri',
  cost: 'Cheltuieli',
  ctr: 'CTR',
  conversions: 'Conversii',
  avg_cpc: 'CPC mediu',
  quality_score: 'Quality Score',
  impression_share: 'Impression Share',
  search_impression_share: 'Search Impression Share',
  top_of_page_rate: 'Top of page rate',
  device_breakdown: 'Performanță pe device (Mobil/Desktop)',
  geographic_performance: 'Performanță geografică',
  roas: 'ROAS (Return on Ad Spend)',
  conversion_value: 'Valoare conversii',
  cpa: 'Cost per conversie (CPA)',
};

export const META_LABELS: Record<MetaReportKey, string> = {
  impressions: 'Impresii',
  clicks: 'Click-uri',
  spend: 'Cheltuieli',
  ctr: 'CTR',
  conversions: 'Conversii',
  cpc: 'CPC',
  reach: 'Reach',
  frequency: 'Frecvență',
  link_clicks: 'Link clicks',
  cpm: 'CPM',
  engagement_rate: 'Rata de engagement',
  video_views: 'Vizionări video',
  video_p25: 'Video 25% vizionat',
  video_p50: 'Video 50% vizionat',
  video_p100: 'Video 100% vizionat',
};

export const CHART_LABELS: Record<ReportChartKey, string> = {
  device_breakdown: 'Grafic performanță pe device',
  performance_trend: 'Grafic evoluție (impresii/cheltuieli)',
};

export type GoogleReportKey = (typeof GOOGLE_REPORT_KEYS)[number];
export type MetaReportKey = (typeof META_REPORT_KEYS)[number];
export type ReportChartKey = (typeof REPORT_CHART_KEYS)[number];

export interface ReportSettings {
  google?: Partial<Record<GoogleReportKey, boolean>>;
  meta?: Partial<Record<MetaReportKey, boolean>>;
  charts?: Partial<Record<ReportChartKey, boolean>>;
}

const defaultGoogle: Record<GoogleReportKey, boolean> = {
  impressions: true,
  clicks: true,
  cost: true,
  ctr: true,
  conversions: true,
  avg_cpc: true,
  quality_score: true,
  impression_share: true,
  search_impression_share: true,
  top_of_page_rate: true,
  device_breakdown: true,
  geographic_performance: true,
  roas: true,
  conversion_value: true,
  cpa: true,
};

const defaultMeta: Record<MetaReportKey, boolean> = {
  impressions: true,
  clicks: true,
  spend: true,
  ctr: true,
  conversions: true,
  cpc: true,
  reach: true,
  frequency: true,
  link_clicks: true,
  cpm: true,
  engagement_rate: true,
  video_views: true,
  video_p25: true,
  video_p50: true,
  video_p100: true,
};

const defaultCharts: Record<ReportChartKey, boolean> = {
  device_breakdown: true,
  performance_trend: true,
};

export function getDefaultReportSettings(): ReportSettings {
  return { google: { ...defaultGoogle }, meta: { ...defaultMeta }, charts: { ...defaultCharts } };
}

export function normalizeReportSettings(raw: unknown): ReportSettings {
  if (raw == null) return getDefaultReportSettings();
  let o: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      o = (JSON.parse(raw) as Record<string, unknown>) ?? {};
    } catch {
      return getDefaultReportSettings();
    }
  } else if (typeof raw === 'object' && raw !== null) {
    o = raw as Record<string, unknown>;
  } else {
    return getDefaultReportSettings();
  }
  const google =
    o.google && typeof o.google === 'object'
      ? { ...defaultGoogle, ...(o.google as Record<string, boolean>) }
      : defaultGoogle;
  const meta =
    o.meta && typeof o.meta === 'object'
      ? { ...defaultMeta, ...(o.meta as Record<string, boolean>) }
      : defaultMeta;
  const charts =
    o.charts && typeof o.charts === 'object'
      ? { ...defaultCharts, ...(o.charts as Record<string, boolean>) }
      : defaultCharts;
  return { google, meta, charts };
}

export function isGoogleKeyEnabled(settings: ReportSettings, key: GoogleReportKey): boolean {
  return settings.google?.[key] !== false;
}

export function isMetaKeyEnabled(settings: ReportSettings, key: MetaReportKey): boolean {
  return settings.meta?.[key] !== false;
}

export function isChartEnabled(settings: ReportSettings, key: ReportChartKey): boolean {
  return settings.charts?.[key] !== false;
}
