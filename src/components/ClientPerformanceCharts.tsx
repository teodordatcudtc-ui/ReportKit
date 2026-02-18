'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

export interface DailyRow {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

export interface PlatformMetrics {
  totals: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    ctr: number;
  };
  daily: DailyRow[];
}

interface ClientPerformanceChartsProps {
  google?: PlatformMetrics;
  meta?: PlatformMetrics;
  dateStart?: string;
  dateEnd?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
}

function mergeDaily(google: DailyRow[], meta: DailyRow[]): { date: string; google?: DailyRow; meta?: DailyRow }[] {
  const byDate: Record<string, { date: string; google?: DailyRow; meta?: DailyRow }> = {};
  for (const r of google) {
    byDate[r.date] = { ...byDate[r.date], date: r.date, google: r };
  }
  for (const r of meta) {
    byDate[r.date] = { ...byDate[r.date], date: r.date, meta: r };
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

export function ClientPerformanceCharts({ google, meta }: ClientPerformanceChartsProps) {
  const hasGoogle = google && (google.totals.impressions > 0 || google.totals.clicks > 0 || google.totals.spend > 0);
  const hasMeta = meta && (meta.totals.impressions > 0 || meta.totals.clicks > 0 || meta.totals.spend > 0);
  const hasData = hasGoogle || hasMeta;

  const totals = {
    impressions: (google?.totals.impressions ?? 0) + (meta?.totals.impressions ?? 0),
    clicks: (google?.totals.clicks ?? 0) + (meta?.totals.clicks ?? 0),
    spend: (google?.totals.spend ?? 0) + (meta?.totals.spend ?? 0),
    conversions: (google?.totals.conversions ?? 0) + (meta?.totals.conversions ?? 0),
    ctr: 0,
  };
  if (totals.impressions > 0) totals.ctr = (totals.clicks / totals.impressions) * 100;

  const merged = mergeDaily(google?.daily ?? [], meta?.daily ?? []);
  const chartData = merged.map(({ date, google: g, meta: m }) => ({
    date: formatDate(date),
    fullDate: date,
    impressions: (g?.impressions ?? 0) + (m?.impressions ?? 0),
    impressionsGoogle: g?.impressions ?? 0,
    impressionsMeta: m?.impressions ?? 0,
    clicks: (g?.clicks ?? 0) + (m?.clicks ?? 0),
    clicksGoogle: g?.clicks ?? 0,
    clicksMeta: m?.clicks ?? 0,
    spend: (g?.spend ?? 0) + (m?.spend ?? 0),
    spendGoogle: g?.spend ?? 0,
    spendMeta: m?.spend ?? 0,
    conversions: (g?.conversions ?? 0) + (m?.conversions ?? 0),
  }));

  const isConnectedNoData = (google && !hasGoogle) || (meta && !hasMeta);
  if (!hasData) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center space-y-3">
        {isConnectedNoData ? (
          <>
            <p className="text-slate-700 font-medium">Contul este conectat corect.</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Nu există campanii sau cheltuieli în perioada selectată. Pentru un client care are reclame active pe Google Ads sau Meta Ads, aici vor apărea impresii, click-uri, cheltuieli și graficele live – același cod folosește API-urile oficiale și returnează date reale.
            </p>
            <p className="text-slate-400 text-xs">
              Poți verifica și în Graph API Explorer (Meta) sau Google Ads API pentru același interval.
            </p>
          </>
        ) : (
          <p className="text-slate-500 text-sm">
            Nu există date pentru perioada selectată. Conectează Google Ads sau Meta Ads și alege un interval cu campanii active.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impresii</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {totals.impressions.toLocaleString('ro-RO')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Click-uri</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {totals.clicks.toLocaleString('ro-RO')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cheltuieli</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {totals.spend.toFixed(2)} €
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Conversii</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {totals.conversions.toLocaleString('ro-RO')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">CTR</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {totals.ctr.toFixed(2)}%
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Impresii pe zi</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(value: number | undefined) => [value != null ? value.toLocaleString('ro-RO') : '0', '']}
                  labelFormatter={(_, payload) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate && formatDate((payload[0] as { payload: { fullDate: string } }).payload.fullDate)}
                />
                {hasGoogle && (
                  <Area type="monotone" dataKey="impressionsGoogle" name="Google Ads" stackId="1" stroke="#4285f4" fill="#4285f4" fillOpacity={0.4} />
                )}
                {hasMeta && (
                  <Area type="monotone" dataKey="impressionsMeta" name="Meta Ads" stackId="1" stroke="#0668e1" fill="#0668e1" fillOpacity={0.4} />
                )}
                {!hasGoogle && !hasMeta && (
                  <Area type="monotone" dataKey="impressions" name="Impresii" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                )}
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Cheltuieli pe zi</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(v) => `${v} €`} />
                <Tooltip
                  formatter={(value: number | undefined) => [`${Number(value ?? 0).toFixed(2)} €`, '']}
                  labelFormatter={(_, payload) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate && formatDate((payload[0] as { payload: { fullDate: string } }).payload.fullDate)}
                />
                {hasGoogle && (
                  <Line type="monotone" dataKey="spendGoogle" name="Google Ads" stroke="#4285f4" strokeWidth={2} dot={false} />
                )}
                {hasMeta && (
                  <Line type="monotone" dataKey="spendMeta" name="Meta Ads" stroke="#0668e1" strokeWidth={2} dot={false} />
                )}
                {!hasGoogle && !hasMeta && (
                  <Line type="monotone" dataKey="spend" name="Cheltuieli" stroke="#3b82f6" strokeWidth={2} dot={false} />
                )}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Click-uri pe zi</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value: number | undefined) => [value != null ? value.toLocaleString('ro-RO') : '0', '']}
                  labelFormatter={(_, payload) => (payload?.[0] as { payload?: { fullDate?: string } })?.payload?.fullDate && formatDate((payload[0] as { payload: { fullDate: string } }).payload.fullDate)}
                />
                {hasGoogle && (
                  <Line type="monotone" dataKey="clicksGoogle" name="Google Ads" stroke="#4285f4" strokeWidth={2} dot={false} />
                )}
                {hasMeta && (
                  <Line type="monotone" dataKey="clicksMeta" name="Meta Ads" stroke="#0668e1" strokeWidth={2} dot={false} />
                )}
                {!hasGoogle && !hasMeta && (
                  <Line type="monotone" dataKey="clicks" name="Click-uri" stroke="#3b82f6" strokeWidth={2} dot={false} />
                )}
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
