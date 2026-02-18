'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { ClientPerformanceCharts, type PlatformMetrics } from '@/components/ClientPerformanceCharts';

interface ClientDetail {
  id: string;
  client_name: string;
  google_ads_connected: boolean;
  meta_ads_connected: boolean;
  tokens: { platform: string; account_id: string | null }[];
  reports: {
    id: string;
    report_date_start: string;
    report_date_end: string;
    pdf_url: string | null;
    status: string;
    created_at: string;
  }[];
}

function ClientDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [metricsRange, setMetricsRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [metrics, setMetrics] = useState<{ google?: PlatformMetrics; meta?: PlatformMetrics } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    if (!clientId) return;
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clientId]);

  const loadMetrics = useCallback(() => {
    if (!clientId || !metricsRange.start || !metricsRange.end) return;
    setMetricsLoading(true);
    fetch(`/api/clients/${clientId}/metrics?date_start=${metricsRange.start}&date_end=${metricsRange.end}`)
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setMetricsLoading(false);
      })
      .catch(() => setMetricsLoading(false));
  }, [clientId, metricsRange.start, metricsRange.end]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setMetricsRange({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !metricsRange.start || !metricsRange.end) return;
    if (!client?.google_ads_connected && !client?.meta_ads_connected) {
      setMetrics(null);
      return;
    }
    setMetricsLoading(true);
    fetch(`/api/clients/${clientId}/metrics?date_start=${metricsRange.start}&date_end=${metricsRange.end}`)
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setMetricsLoading(false);
      })
      .catch(() => setMetricsLoading(false));
  }, [clientId, metricsRange.start, metricsRange.end, client?.google_ads_connected, client?.meta_ads_connected]);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setDateStart(firstDay.toISOString().slice(0, 10));
    setDateEnd(lastDay.toISOString().slice(0, 10));
  }, []);

  async function handleGenerateReport(e: React.FormEvent) {
    e.preventDefault();
    setGenerateError('');
    setGenerating(true);
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        date_start: dateStart,
        date_end: dateEnd,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerating(false);
    if (!res.ok) {
      setGenerateError(data.error ?? 'Nu s-a putut genera raportul.');
      return;
    }
    setPdfUrl(data.pdf_url ?? null);
    setReportModalOpen(false);
    if (data.pdf_url) window.open(data.pdf_url, '_blank');
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then(setClient);
  }

  const googleToken = client?.tokens?.find((t) => t.platform === 'google_ads');
  const metaToken = client?.tokens?.find((t) => t.platform === 'meta_ads');

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Se încarcă…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/clients"
          className="text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          ← Înapoi la clienți
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client: {client.client_name}</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {success === 'google_connected' && 'Google Ads conectat cu succes.'}
          {success === 'meta_connected' && 'Meta Ads conectat cu succes.'}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          Conexiune eșuată. Încearcă din nou sau verifică setările aplicației.
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Stare conexiuni</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-700">Google Ads</p>
              <p className="text-sm text-slate-500">
                {client.google_ads_connected
                  ? `Conectat${googleToken?.account_id ? ` (${googleToken.account_id})` : ''}`
                  : 'Neconectat'}
              </p>
            </div>
            {client.google_ads_connected ? (
              <form action="/api/auth/google/disconnect" method="POST" className="inline">
                <input type="hidden" name="client_id" value={clientId} />
                <button type="button" className="text-sm text-slate-500 hover:text-red-600">
                  Deconectare (TODO)
                </button>
              </form>
            ) : (
              <a
                href={`/api/auth/google/connect?client_id=${clientId}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Conectează Google Ads
              </a>
            )}
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-700">Meta Ads</p>
              <p className="text-sm text-slate-500">
                {client.meta_ads_connected
                  ? `Conectat${metaToken?.account_id ? ` (${metaToken.account_id})` : ''}`
                  : 'Neconectat'}
              </p>
            </div>
            {client.meta_ads_connected ? (
              <span className="text-sm text-slate-500">Deconectare (TODO)</span>
            ) : (
              <a
                href={`/api/auth/meta/connect?client_id=${clientId}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Conectează Meta Ads
              </a>
            )}
          </div>
        </div>
      </section>

      {(client.google_ads_connected || client.meta_ads_connected) && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-800">Performanță live</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={metricsRange.start}
                onChange={(e) => setMetricsRange((p) => ({ ...p, start: e.target.value }))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-slate-500">–</span>
              <input
                type="date"
                value={metricsRange.end}
                onChange={(e) => setMetricsRange((p) => ({ ...p, end: e.target.value }))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={loadMetrics}
                disabled={metricsLoading}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
              >
                {metricsLoading ? 'Se încarcă…' : 'Actualizează'}
              </button>
            </div>
          </div>
          {metricsLoading && !metrics ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Se încarcă datele…
            </div>
          ) : (
            <ClientPerformanceCharts
              google={metrics?.google}
              meta={metrics?.meta}
              dateStart={metricsRange.start}
              dateEnd={metricsRange.end}
            />
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
          <h2 className="font-semibold text-slate-800">Istoric rapoarte</h2>
          <button
            id="generate"
            onClick={() => setReportModalOpen(true)}
            disabled={!client.google_ads_connected && !client.meta_ads_connected}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generează raport nou
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {client.reports.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              Niciun raport încă. Conectează cel puțin o platformă de reclame și generează un raport.
            </div>
          ) : (
            client.reports.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">
                    {r.report_date_start} – {r.report_date_end}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString('ro-RO')} · {r.status}
                  </p>
                </div>
                {r.pdf_url && (
                  <a
                    href={r.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Descarcă PDF
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="font-semibold text-slate-800">Generează raport</h3>
            <form onSubmit={handleGenerateReport} className="mt-4 space-y-4">
              {generateError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{generateError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data start</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data sfârșit</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Anulare
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating ? 'Se generează…' : 'Generează raport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfUrl && (
        <p className="text-sm text-green-600">
          Raport gata: <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">Deschide PDF</a>
        </p>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-pulse text-slate-500">Se încarcă…</div></div>}>
      <ClientDetailContent />
    </Suspense>
  );
}
