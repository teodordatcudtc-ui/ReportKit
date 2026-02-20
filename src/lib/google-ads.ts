import { OAuth2Client } from 'google-auth-library';

export async function getValidAccessToken(
  accessToken: string,
  refreshToken: string | null
): Promise<string> {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
  });
  const { credentials } = await client.refreshAccessToken();
  return credentials.access_token ?? accessToken;
}

export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  ctr: number;
  average_cpc: number;
  /** Quality Score (medie, de la keyword) – optional */
  quality_score?: number | null;
  /** Impression share (share of impressioni eligibile) */
  impression_share?: number | null;
  /** Search impression share */
  search_impression_share?: number | null;
  /** Top of page rate (search top impression share) */
  top_of_page_rate?: number | null;
  /** Valoare totală conversii (din API) */
  conversions_value?: number | null;
  /** ROAS = conversions_value / cost */
  roas?: number | null;
  /** Cost per conversie (CPA) = cost / conversions */
  cpa?: number | null;
}

export interface GoogleAdsDeviceRow {
  device: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
}

export interface GoogleAdsGeographicRow {
  country: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
}

/** Date mock pentru testare când nu ai campanii reale. Setează GOOGLE_ADS_MOCK_DATA=true în .env.local */
function getMockGoogleAdsMetrics(dateStart: string, dateEnd: string): GoogleAdsMetrics {
  const days = Math.max(1, Math.ceil((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000));
  const impressions = 12000 * days;
  const clicks = 340 * days;
  const costMicros = 85_000_000 * days; // 85 RON
  const conversions = 12 * days;
  const costRon = costMicros / 1_000_000;
  return {
    impressions,
    clicks,
    cost_micros: costMicros,
    conversions,
    ctr: impressions ? clicks / impressions : 0,
    average_cpc: clicks ? costMicros / clicks : 0,
    quality_score: 7.2,
    impression_share: 0.42,
    search_impression_share: 0.38,
    top_of_page_rate: 0.31,
    conversions_value: 425,
    roas: costRon ? 425 / costRon : null,
    cpa: conversions ? costRon / conversions : null,
  };
}

/** Zile mock pentru grafice (folosit doar când GOOGLE_ADS_MOCK_DATA=true) */
function getMockGoogleAdsDaily(dateStart: string, dateEnd: string): GoogleAdsDailyRow[] {
  const rows: GoogleAdsDailyRow[] = [];
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const variance = 0.7 + Math.random() * 0.6;
    rows.push({
      date,
      impressions: Math.round(12000 * variance),
      clicks: Math.round(340 * variance),
      cost_micros: Math.round(85_000_000 * variance),
      conversions: Math.round(12 * variance),
    });
  }
  return rows;
}

export async function fetchGoogleAdsData(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<GoogleAdsMetrics> {
  if (process.env.GOOGLE_ADS_MOCK_DATA === 'true') {
    return getMockGoogleAdsMetrics(dateStart, dateEnd);
  }
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!devToken) {
    return {
      impressions: 0,
      clicks: 0,
      cost_micros: 0,
      conversions: 0,
      ctr: 0,
      average_cpc: 0,
    };
  }
  /* Toate metricile exista in Google Ads API la campaign: impressions, clicks, cost_micros, conversions, ctr, average_cpc, search_impression_share, search_top_impression_share. Nu exista metrics.impression_share generic la campaign – folosim search_impression_share pentru campanii Search. */
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.search_impression_share,
      metrics.search_top_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
  `;
  const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Google Ads API error:', res.status, err);
    return {
      impressions: 0,
      clicks: 0,
      cost_micros: 0,
      conversions: 0,
      ctr: 0,
      average_cpc: 0,
    };
  }
  type Row = {
    metrics?: {
      impressions?: string;
      clicks?: string;
      costMicros?: string;
      conversions?: string;
      conversionsValue?: string;
      ctr?: string;
      averageCpc?: string;
      searchImpressionShare?: string;
      searchTopImpressionShare?: string;
    };
  };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  let impressions = 0,
    clicks = 0,
    costMicros = 0,
    conversions = 0,
    conversionsValue = 0,
    ctr = 0,
    averageCpc = 0,
    searchImpressionShareSum = 0,
    searchTopSum = 0,
    shareCount = 0;
  for (const row of results) {
    const m = row.metrics;
    if (m) {
      impressions += Number(m.impressions ?? 0);
      clicks += Number(m.clicks ?? 0);
      costMicros += Number(m.costMicros ?? 0);
      conversions += Number(m.conversions ?? 0);
      conversionsValue += Number(m.conversionsValue ?? 0);
      ctr += Number(m.ctr ?? 0);
      averageCpc += Number(m.averageCpc ?? 0);
      const sisVal = Number(m.searchImpressionShare ?? 0);
      const stVal = Number(m.searchTopImpressionShare ?? 0);
      if (!Number.isNaN(sisVal) && sisVal > 0) {
        searchImpressionShareSum += sisVal;
        shareCount++;
      }
      if (!Number.isNaN(stVal) && stVal > 0) {
        searchTopSum += stVal;
      }
    }
  }
  const count = results.length || 1;
  const costRon = costMicros / 1_000_000;
  const out: GoogleAdsMetrics = {
    impressions,
    clicks,
    cost_micros: costMicros,
    conversions,
    ctr: count > 0 ? ctr / count : 0,
    average_cpc: count > 0 ? averageCpc / count : 0,
  };
  if (shareCount > 0) {
    out.impression_share = searchImpressionShareSum / shareCount;
    out.search_impression_share = searchImpressionShareSum / shareCount;
    out.top_of_page_rate = searchTopSum / shareCount;
  }
  if (conversionsValue > 0) out.conversions_value = conversionsValue;
  if (costRon > 0) out.roas = conversionsValue / costRon;
  if (conversions > 0) out.cpa = costRon / conversions;
  return out;
}

export interface GoogleAdsDailyRow {
  date: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
}

export async function fetchGoogleAdsDaily(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<GoogleAdsDailyRow[]> {
  if (process.env.GOOGLE_ADS_MOCK_DATA === 'true') {
    return getMockGoogleAdsDaily(dateStart, dateEnd);
  }
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!devToken) return [];
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
  `;
  const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];
  type Row = {
    segments?: { date?: string };
    metrics?: {
      impressions?: string;
      clicks?: string;
      costMicros?: string;
      conversions?: string;
    };
  };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  const byDate: Record<string, GoogleAdsDailyRow> = {};
  for (const row of results) {
    const date = row.segments?.date ?? '';
    if (!date) continue;
    if (!byDate[date]) {
      byDate[date] = {
        date,
        impressions: 0,
        clicks: 0,
        cost_micros: 0,
        conversions: 0,
      };
    }
    const m = row.metrics;
    if (m) {
      byDate[date].impressions += Number(m.impressions ?? 0);
      byDate[date].clicks += Number(m.clicks ?? 0);
      byDate[date].cost_micros += Number(m.costMicros ?? 0);
      byDate[date].conversions += Number(m.conversions ?? 0);
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

/** Quality Score mediu (din keyword_view, ad_group_criterion.quality_info.quality_score). Revine null dacă nu e disponibil. */
export async function fetchGoogleAdsQualityScore(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<number | null> {
  if (process.env.GOOGLE_ADS_MOCK_DATA === 'true') return 7.2;
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!devToken) return null;
  const query = `
    SELECT ad_group_criterion.quality_info.quality_score
    FROM keyword_view
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
      AND ad_group_criterion.type = 'KEYWORD'
  `;
  const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return null;
  type Row = { adGroupCriterion?: { qualityInfo?: { qualityScore?: number } } };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  let sum = 0;
  let n = 0;
  for (const row of results) {
    const q = Number(row.adGroupCriterion?.qualityInfo?.qualityScore ?? 0);
    if (!Number.isNaN(q) && q > 0) {
      sum += q;
      n++;
    }
  }
  return n > 0 ? sum / n : null;
}

/** Performanță pe device (Mobil / Desktop / Tableta). */
export async function fetchGoogleAdsDeviceBreakdown(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<GoogleAdsDeviceRow[]> {
  if (process.env.GOOGLE_ADS_MOCK_DATA === 'true') {
    return [
      { device: 'MOBILE', impressions: 6000, clicks: 180, cost_micros: 40_000_000 },
      { device: 'DESKTOP', impressions: 5000, clicks: 140, cost_micros: 35_000_000 },
      { device: 'TABLET', impressions: 1000, clicks: 20, cost_micros: 10_000_000 },
    ];
  }
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!devToken) return [];
  const query = `
    SELECT
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
  `;
  const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];
  type Row = {
    segments?: { device?: string };
    metrics?: { impressions?: string; clicks?: string; costMicros?: string };
  };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  const byDevice: Record<string, GoogleAdsDeviceRow> = {};
  for (const row of results) {
    const device = row.segments?.device ?? 'UNKNOWN';
    if (!byDevice[device]) {
      byDevice[device] = { device, impressions: 0, clicks: 0, cost_micros: 0 };
    }
    const m = row.metrics;
    if (m) {
      byDevice[device].impressions += Number(m.impressions ?? 0);
      byDevice[device].clicks += Number(m.clicks ?? 0);
      byDevice[device].cost_micros += Number(m.costMicros ?? 0);
    }
  }
  return Object.values(byDevice).sort((a, b) => b.impressions - a.impressions);
}

/** Performanță pe țară (top geografic). */
export async function fetchGoogleAdsGeographic(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<GoogleAdsGeographicRow[]> {
  if (process.env.GOOGLE_ADS_MOCK_DATA === 'true') {
    return [
      { country: 'Romania', impressions: 10000, clicks: 280, cost_micros: 70_000_000 },
      { country: 'United States', impressions: 2000, clicks: 60, cost_micros: 15_000_000 },
    ];
  }
  const devToken = process.env.GOOGLE_DEVELOPER_TOKEN;
  if (!devToken) return [];
  const query = `
    SELECT
      segments.geoTargetCountry,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}'
  `;
  const url = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return [];
  type Row = {
    segments?: { geoTargetCountry?: string };
    metrics?: { impressions?: string; clicks?: string; costMicros?: string };
  };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  const byCountry: Record<string, GoogleAdsGeographicRow> = {};
  const countryNames: Record<string, string> = {
    RO: 'Romania',
    US: 'United States',
    GB: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
  };
  for (const row of results) {
    const code = (row.segments?.geoTargetCountry ?? 'XX').toUpperCase();
    const country = countryNames[code] ?? code;
    if (!byCountry[country]) {
      byCountry[country] = { country, impressions: 0, clicks: 0, cost_micros: 0 };
    }
    const m = row.metrics;
    if (m) {
      byCountry[country].impressions += Number(m.impressions ?? 0);
      byCountry[country].clicks += Number(m.clicks ?? 0);
      byCountry[country].cost_micros += Number(m.costMicros ?? 0);
    }
  }
  return Object.values(byCountry).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
}
