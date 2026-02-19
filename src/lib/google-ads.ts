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
}

/** Date mock pentru testare când nu ai campanii reale. Setează GOOGLE_ADS_MOCK_DATA=true în .env.local */
function getMockGoogleAdsMetrics(dateStart: string, dateEnd: string): GoogleAdsMetrics {
  const days = Math.max(1, Math.ceil((new Date(dateEnd).getTime() - new Date(dateStart).getTime()) / 86400000));
  const impressions = 12000 * days;
  const clicks = 340 * days;
  const costMicros = 85_000_000 * days; // 85 RON
  const conversions = 12 * days;
  return {
    impressions,
    clicks,
    cost_micros: costMicros,
    conversions,
    ctr: clicks / impressions,
    average_cpc: costMicros / clicks,
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
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
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
      ctr?: string;
      averageCpc?: string;
    };
  };
  const data = (await res.json()) as { results?: Row[] };
  const results = data.results ?? [];
  let impressions = 0,
    clicks = 0,
    costMicros = 0,
    conversions = 0,
    ctr = 0,
    averageCpc = 0;
  for (const row of results) {
    const m = row.metrics;
    if (m) {
      impressions += Number(m.impressions ?? 0);
      clicks += Number(m.clicks ?? 0);
      costMicros += Number(m.costMicros ?? 0);
      conversions += Number(m.conversions ?? 0);
      ctr += Number(m.ctr ?? 0);
      averageCpc += Number(m.averageCpc ?? 0);
    }
  }
  const count = results.length || 1;
  return {
    impressions,
    clicks,
    cost_micros: costMicros,
    conversions,
    ctr: count > 0 ? ctr / count : 0,
    average_cpc: count > 0 ? averageCpc / count : 0,
  };
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
