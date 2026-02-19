import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getValidAccessToken, fetchGoogleAdsData, fetchGoogleAdsDaily } from '@/lib/google-ads';
import { fetchMetaAdsData, fetchMetaAdsDaily } from '@/lib/meta-ads';

async function canAccessClient(userId: string, clientId: string): Promise<boolean> {
  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (!agency) return false;
  const { data: client } = await getSupabaseAdmin()
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('agency_id', agency.id)
    .single();
  return !!client;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { clientId } = await params;
  if (!(await canAccessClient(session.user.id, clientId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const dateStart = searchParams.get('date_start') ?? '';
  const dateEnd = searchParams.get('date_end') ?? '';
  if (!dateStart || !dateEnd) {
    return NextResponse.json({ error: 'date_start and date_end required (YYYY-MM-DD)' }, { status: 400 });
  }

  const { data: tokens } = await getSupabaseAdmin()
    .from('api_tokens')
    .select('*')
    .eq('client_id', clientId);

  const googleToken = tokens?.find((t) => t.platform === 'google_ads');
  const metaToken = tokens?.find((t) => t.platform === 'meta_ads');

  const result: {
    google?: {
      totals: { impressions: number; clicks: number; spend: number; conversions: number; ctr: number };
      daily: { date: string; impressions: number; clicks: number; spend: number; conversions: number }[];
    };
    meta?: {
      totals: { impressions: number; clicks: number; spend: number; conversions: number; ctr: number };
      daily: { date: string; impressions: number; clicks: number; spend: number; conversions: number }[];
    };
  } = {};

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
    const [totalsData, dailyRows] = await Promise.all([
      fetchGoogleAdsData(customerId, accessToken, dateStart, dateEnd),
      fetchGoogleAdsDaily(customerId, accessToken, dateStart, dateEnd),
    ]);
    result.google = {
      totals: {
        impressions: totalsData.impressions,
        clicks: totalsData.clicks,
        spend: totalsData.cost_micros / 1_000_000,
        conversions: totalsData.conversions,
        ctr: totalsData.ctr,
      },
      daily: dailyRows.map((r) => ({
        date: r.date,
        impressions: r.impressions,
        clicks: r.clicks,
        spend: r.cost_micros / 1_000_000,
        conversions: r.conversions,
      })),
    };
  }

  if (metaToken?.access_token && metaToken?.account_id) {
    const [totalsData, dailyRows] = await Promise.all([
      fetchMetaAdsData(metaToken.account_id, metaToken.access_token, dateStart, dateEnd),
      fetchMetaAdsDaily(metaToken.account_id, metaToken.access_token, dateStart, dateEnd),
    ]);
    result.meta = {
      totals: {
        impressions: totalsData.impressions,
        clicks: totalsData.clicks,
        spend: totalsData.spend,
        conversions: totalsData.conversions,
        ctr: totalsData.ctr,
      },
      daily: dailyRows.map((r) => ({
        date: r.date,
        impressions: r.impressions,
        clicks: r.clicks,
        spend: r.spend,
        conversions: r.conversions,
      })),
    };
  }

  return NextResponse.json(result);
}
