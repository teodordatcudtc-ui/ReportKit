import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getValidAccessToken, fetchGoogleAdsData } from '@/lib/google-ads';
import { fetchMetaAdsData } from '@/lib/meta-ads';

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

/** Demo date pentru preview când nu există date reale */
function getDemoSummary() {
  return {
    totals: { spend: 12450, impressions: 89200, conversions: 318 },
    topClientsBySpend: [
      { client_id: 'demo-1', client_name: 'Client Premium SRL', spend: 5200 },
      { client_id: 'demo-2', client_name: 'Brand Digital', spend: 3100 },
      { client_id: 'demo-3', client_name: 'Shop Online', spend: 2150 },
      { client_id: 'demo-4', client_name: 'Startup XYZ', spend: 1200 },
      { client_id: 'demo-5', client_name: 'Local Business', spend: 800 },
    ],
    clientsWithoutReport: [
      { client_id: 'demo-a', client_name: 'Client fără raport 1' },
      { client_id: 'demo-b', client_name: 'Client fără raport 2' },
    ],
    isDemo: true,
  };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStart = searchParams.get('date_start') || getMonthRange().start;
  const dateEnd = searchParams.get('date_end') || getMonthRange().end;

  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!agency) {
    return NextResponse.json({ ...getDemoSummary(), date_start: dateStart, date_end: dateEnd });
  }

  const { data: clients } = await getSupabaseAdmin()
    .from('clients')
    .select('id, client_name')
    .eq('agency_id', agency.id);
  if (!clients?.length) {
    return NextResponse.json({ ...getDemoSummary(), date_start: dateStart, date_end: dateEnd });
  }

  const clientIds = clients.map((c) => c.id);
  const { data: tokens } = await getSupabaseAdmin()
    .from('api_tokens')
    .select('*')
    .in('client_id', clientIds);

  const totals = { spend: 0, impressions: 0, conversions: 0 };
  const clientSpends: { client_id: string; client_name: string; spend: number }[] = [];

  for (const client of clients) {
    const clientTokens = (tokens ?? []).filter((t) => t.client_id === client.id);
    const googleToken = clientTokens.find((t) => t.platform === 'google_ads');
    const metaToken = clientTokens.find((t) => t.platform === 'meta_ads');

    let spend = 0,
      impressions = 0,
      conversions = 0;

    if (googleToken?.access_token && googleToken?.account_id) {
      let accessToken = googleToken.access_token;
      if (googleToken.refresh_token) {
        try {
          accessToken = await getValidAccessToken(googleToken.access_token, googleToken.refresh_token);
        } catch {}
      }
      try {
        const data = await fetchGoogleAdsData(googleToken.account_id, accessToken, dateStart, dateEnd);
        spend += data.cost_micros / 1_000_000;
        impressions += data.impressions;
        conversions += data.conversions;
      } catch {}
    }
    if (metaToken?.access_token && metaToken?.account_id) {
      try {
        const data = await fetchMetaAdsData(metaToken.account_id, metaToken.access_token, dateStart, dateEnd);
        spend += data.spend;
        impressions += data.impressions;
        conversions += data.conversions;
      } catch {}
    }

    totals.spend += spend;
    totals.impressions += impressions;
    totals.conversions += conversions;
    clientSpends.push({ client_id: client.id, client_name: client.client_name, spend });
  }

  const topClientsBySpend = [...clientSpends]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .filter((c) => c.spend > 0);

  const { data: reportsInPeriod } = await getSupabaseAdmin()
    .from('reports')
    .select('client_id')
    .in('client_id', clientIds)
    .eq('status', 'completed')
    .lte('report_date_start', dateEnd)
    .gte('report_date_end', dateStart);
  const reportedIds = new Set((reportsInPeriod ?? []).map((r) => r.client_id));
  const clientsWithoutReport = clients
    .filter((c) => !reportedIds.has(c.id))
    .map((c) => ({ client_id: c.id, client_name: c.client_name }));

  const hasRealData = totals.spend > 0 || totals.impressions > 0 || totals.conversions > 0;
  const body = {
    totals: { spend: Math.round(totals.spend * 100) / 100, impressions: totals.impressions, conversions: totals.conversions },
    topClientsBySpend: topClientsBySpend.length ? topClientsBySpend : getDemoSummary().topClientsBySpend,
    clientsWithoutReport: clientsWithoutReport.length ? clientsWithoutReport : getDemoSummary().clientsWithoutReport,
    isDemo: !hasRealData,
    date_start: dateStart,
    date_end: dateEnd,
  };

  return NextResponse.json(body);
}
