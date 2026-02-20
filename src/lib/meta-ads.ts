export interface MetaAdsMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  conversions: number;
  cpc: number;
  /** Reach (persoane unice) */
  reach?: number;
  /** Frecvență medie */
  frequency?: number;
  /** Link clicks (doar click-uri pe link) */
  link_clicks?: number;
  /** Cost per 1000 impresii (CPM) */
  cpm?: number;
  /** Engagement rate (%) */
  engagement_rate?: number;
  /** Video views (25% sau 3s) */
  video_views?: number;
  /** Video 25% vizionat */
  video_p25?: number;
  /** Video 50% vizionat */
  video_p50?: number;
  /** Video 100% vizionat */
  video_p100?: number;
}

export async function fetchMetaAdsData(
  adAccountId: string,
  accessToken: string,
  dateStart: string,
  dateEnd: string
): Promise<MetaAdsMetrics> {
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const fields =
    'impressions,clicks,spend,ctr,actions,cpc,reach,frequency,cpm,action_values';
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
        reach?: string;
        frequency?: string;
        cpm?: string;
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
      conversions = 0,
      reach = 0,
      frequency = 0,
      cpm = 0,
      linkClicks = 0,
      engagement = 0,
      videoViews = 0,
      videoP25 = 0,
      videoP50 = 0,
      videoP100 = 0;
    for (const row of rows) {
      impressions += Number(row.impressions ?? 0);
      clicks += Number(row.clicks ?? 0);
      spend += Number(row.spend ?? 0);
      ctr += Number(row.ctr ?? 0);
      cpc += Number(row.cpc ?? 0);
      reach += Number(row.reach ?? 0);
      frequency += Number(row.frequency ?? 0);
      cpm += Number(row.cpm ?? 0);
      const actions = row.actions ?? [];
      for (const a of actions) {
        const val = Number(a.value ?? 0);
        if (
          a.action_type === 'purchase' ||
          a.action_type === 'lead' ||
          a.action_type === 'omni_purchase'
        ) {
          conversions += val;
        } else if (a.action_type === 'link_click') {
          linkClicks += val;
        } else if (a.action_type === 'post_engagement') {
          engagement += val;
        } else if (
          a.action_type === 'video_view' ||
          a.action_type === 'video_view_15s' ||
          a.action_type === 'video_view_3s'
        ) {
          videoViews += val;
        } else if (a.action_type === 'video_p25_watched_actions') {
          videoP25 += val;
        } else if (a.action_type === 'video_p50_watched_actions') {
          videoP50 += val;
        } else if (a.action_type === 'video_p100_watched_actions') {
          videoP100 += val;
        }
      }
    }
    const n = rows.length || 1;
    const out: MetaAdsMetrics = {
      impressions,
      clicks,
      spend,
      ctr: n > 0 ? ctr / n : 0,
      conversions,
      cpc: n > 0 ? cpc / n : 0,
    };
    if (reach > 0) out.reach = reach;
    if (frequency > 0) out.frequency = frequency / n;
    if (cpm > 0) out.cpm = cpm / n;
    if (linkClicks > 0) out.link_clicks = linkClicks;
    if (engagement > 0 || videoViews > 0) {
      out.engagement_rate = impressions > 0 ? ((engagement + videoViews) / impressions) * 100 : 0;
      out.video_views = videoViews;
    }
    if (videoP25 > 0) out.video_p25 = videoP25;
    if (videoP50 > 0) out.video_p50 = videoP50;
    if (videoP100 > 0) out.video_p100 = videoP100;
    return out;
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
