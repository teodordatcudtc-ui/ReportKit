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

export async function fetchGoogleAdsData(
  customerId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<GoogleAdsMetrics> {
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
