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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStart = searchParams.get('date_start') || getMonthRange().start;
  const dateEnd = searchParams.get('date_end') || getMonthRange().end;

  const emptySummary = {
    totals: { spend: 0, impressions: 0, conversions: 0 },
    topClientsBySpend: [] as { client_id: string; client_name: string; spend: number }[],
    clientsWithoutReport: [] as { client_id: string; client_name: string }[],
    date_start: dateStart,
    date_end: dateEnd,
  };

  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!agency) return NextResponse.json(emptySummary);

  const { data: clients } = await getSupabaseAdmin()
    .from('clients')
    .select('id, client_name')
    .eq('agency_id', agency.id);
  if (!clients?.length) return NextResponse.json(emptySummary);

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

    const canFetchGoogle =
      googleToken?.access_token &&
      (googleToken?.account_id || process.env.GOOGLE_ADS_MOCK_DATA === 'true');
    if (canFetchGoogle) {
      let accessToken = googleToken.access_token;
      if (googleToken.refresh_token) {
        try {
          accessToken = await getValidAccessToken(googleToken.access_token, googleToken.refresh_token);
        } catch {}
      }
      const customerId = googleToken.account_id || '0';
      try {
        const data = await fetchGoogleAdsData(customerId, accessToken, dateStart, dateEnd);
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

  // Rapoarte care se suprapun cu perioada [dateStart, dateEnd]: report_date_start <= dateEnd ȘI report_date_end >= dateStart
  const { data: reportsInPeriod } = await getSupabaseAdmin()
    .from('reports')
    .select('client_id, report_date_start, report_date_end')
    .in('client_id', clientIds)
    .eq('status', 'completed');
  const allReports = reportsInPeriod ?? [];
  const reportedIds = new Set<string>();
  for (const r of allReports) {
    const start = (r as { report_date_start?: string }).report_date_start ?? '';
    const end = (r as { report_date_end?: string }).report_date_end ?? '';
    const overlaps = start <= dateEnd && end >= dateStart;
    if (overlaps) reportedIds.add((r as { client_id: string }).client_id);
  }
  const clientsWithoutReport = clients
    .filter((c) => !reportedIds.has(c.id))
    .map((c) => ({ client_id: c.id, client_name: c.client_name }));

  return NextResponse.json({
    totals: { spend: Math.round(totals.spend * 100) / 100, impressions: totals.impressions, conversions: totals.conversions },
    topClientsBySpend,
    clientsWithoutReport,
    date_start: dateStart,
    date_end: dateEnd,
  });
}
