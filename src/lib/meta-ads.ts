export interface MetaAdsMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  conversions: number;
  cpc: number;
}

export async function fetchMetaAdsData(
  adAccountId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaAdsMetrics> {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const fields =
    'impressions,clicks,spend,ctr,actions,cpc';
  const url = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=${fields}&time_range=${JSON.stringify({
    since: dateStart,
    until: dateEnd,
  })}&access_token=${encodeURIComponent(accessToken)}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      data?: Array<{
        impressions?: string;
        clicks?: string;
        spend?: string;
        ctr?: string;
        cpc?: string;
        actions?: Array<{ action_type: string; value: string }>;
      }>;
      error?: { message: string };
    };
    if (data.error) {
      console.error('Meta Ads API error:', data.error);
      return defaultMetaMetrics();
    }
    const rows = data.data ?? [];
    let impressions = 0,
      clicks = 0,
      spend = 0,
      ctr = 0,
      cpc = 0,
      conversions = 0;
    for (const row of rows) {
      impressions += Number(row.impressions ?? 0);
      clicks += Number(row.clicks ?? 0);
      spend += Number(row.spend ?? 0);
      ctr += Number(row.ctr ?? 0);
      cpc += Number(row.cpc ?? 0);
      const actions = row.actions ?? [];
      for (const a of actions) {
        if (
          a.action_type === 'purchase' ||
          a.action_type === 'lead' ||
          a.action_type === 'omni_purchase'
        ) {
          conversions += Number(a.value ?? 0);
        }
      }
    }
    const n = rows.length || 1;
    return {
      impressions,
      clicks,
      spend,
      ctr: n > 0 ? ctr / n : 0,
      conversions,
      cpc: n > 0 ? cpc / n : 0,
    };
  } catch (e) {
    console.error('Meta Ads fetch error:', e);
    return defaultMetaMetrics();
  }
}

function defaultMetaMetrics(): MetaAdsMetrics {
  return {
    impressions: 0,
    clicks: 0,
    spend: 0,
    ctr: 0,
    conversions: 0,
    cpc: 0,
  };
}

export interface MetaAdsDailyRow {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export async function fetchMetaAdsDaily(
  adAccountId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaAdsDailyRow[]> {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const fields = 'impressions,clicks,spend,actions';
  const url = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=${fields}&time_range=${JSON.stringify({
    since: dateStart,
    until: dateEnd,
  })}&time_increment=1&access_token=${encodeURIComponent(accessToken)}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      data?: Array<{
        date_start?: string;
        impressions?: string;
        clicks?: string;
        spend?: string;
        actions?: Array<{ action_type: string; value: string }>;
      }>;
      error?: { message: string };
    };
    if (data.error || !data.data) return [];
    return data.data.map((row) => {
      let conversions = 0;
      for (const a of row.actions ?? []) {
        if (['purchase', 'lead', 'omni_purchase'].includes(a.action_type)) {
          conversions += Number(a.value ?? 0);
        }
      }
      return {
        date: row.date_start ?? '',
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        spend: Number(row.spend ?? 0),
        conversions,
      };
    }).filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}
