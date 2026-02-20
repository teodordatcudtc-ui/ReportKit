'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { ClientPerformanceCharts, type PlatformMetrics } from '@/components/ClientPerformanceCharts';
import {
  normalizeReportSettings,
  getDefaultReportSettings,
  GOOGLE_REPORT_KEYS,
  META_REPORT_KEYS,
  REPORT_CHART_KEYS,
  GOOGLE_LABELS,
  META_LABELS,
  CHART_LABELS,
  type ReportSettings,
  type GoogleReportKey,
  type MetaReportKey,
  type ReportChartKey,
} from '@/lib/report-settings';

interface ClientDetail {
  id: string;
  client_name: string;
  google_ads_connected: boolean;
  meta_ads_connected: boolean;
  report_settings?: unknown;
  skip_report_modal?: boolean;
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
  const [reportModalFull, setReportModalFull] = useState(false);
  const [clientReportSettings, setClientReportSettings] = useState<ReportSettings>(getDefaultReportSettings());
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [sendReportId, setSendReportId] = useState<string | null>(null);
  const [sendToEmail, setSendToEmail] = useState('');
  const [sendFromEmail, setSendFromEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
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
        const clientSettings = data?.report_settings ?? null;
        setClientReportSettings(normalizeReportSettings(clientSettings));
        if (clientSettings == null) {
          fetch('/api/agencies')
            .then((ra) => ra.ok ? ra.json() : null)
            .then((agency) => {
              if (agency?.report_settings != null) {
                setClientReportSettings(normalizeReportSettings(agency.report_settings));
              }
            });
        }
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

  async function handleSendReport(e: React.FormEvent) {
    e.preventDefault();
    if (!sendReportId || !sendToEmail.trim()) return;
    setSendError('');
    setSending(true);
    const res = await fetch('/api/reports/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: sendReportId,
        to_email: sendToEmail.trim(),
        from_email: sendFromEmail.trim() || undefined,
      }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSendError(data.error ?? 'Trimitere esuata.');
      return;
    }
    setSendSuccess(true);
    setTimeout(() => {
      setSendReportId(null);
      setSendToEmail('');
      setSendFromEmail('');
      setSendSuccess(false);
    }, 2000);
  }

  function openReportModal(full: boolean) {
    setReportModalFull(full);
    setReportModalOpen(true);
    if (client?.report_settings) setClientReportSettings(normalizeReportSettings(client.report_settings));
  }

  async function handleSaveReportSettings() {
    setGenerateError('');
    setSavingSettings(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_settings: clientReportSettings }),
    });
    setSavingSettings(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGenerateError(data.error ?? 'Nu s-au putut salva setările.');
      return;
    }
    const updated = await res.json().catch(() => null);
    if (updated) setClient(updated);
    setReportModalOpen(false);
  }

  async function doGenerate(start: string, end: string, settings: ReportSettings) {
    setGenerateError('');
    setGenerating(true);
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        date_start: start,
        date_end: end,
        report_settings: settings,
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
      .then((next) => {
        setClient((prev) => ({
          ...next,
          report_settings: next.report_settings ?? prev?.report_settings,
          skip_report_modal: next.skip_report_modal !== undefined && next.skip_report_modal !== null
            ? next.skip_report_modal
            : prev?.skip_report_modal,
        }));
      });
  }

  async function handleGenerateReport(e: React.FormEvent) {
    e.preventDefault();
    if (client) {
      const patchRes = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_settings: clientReportSettings,
          skip_report_modal: dontShowAgain,
        }),
      });
      if (patchRes.ok) {
        const updated = await patchRes.json().catch(() => null);
        if (updated) {
          setClient((prev) => ({
            ...updated,
            tokens: updated.tokens ?? prev?.tokens ?? [],
            reports: updated.reports ?? prev?.reports ?? [],
          }));
        }
      }
    }
    await doGenerate(dateStart, dateEnd, clientReportSettings);
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
          {success === 'google_disconnected' && 'Google Ads deconectat.'}
          {success === 'meta_connected' && 'Meta Ads conectat cu succes.'}
          {success === 'meta_disconnected' && 'Meta Ads deconectat.'}
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
                <button type="submit" className="text-sm text-slate-500 hover:text-red-600 font-medium">
                  Deconectare
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
              <form action="/api/auth/meta/disconnect" method="POST" className="inline">
                <input type="hidden" name="client_id" value={clientId} />
                <button type="submit" className="text-sm text-slate-500 hover:text-red-600 font-medium">
                  Deconectare
                </button>
              </form>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openReportModal(true)}
              className="text-sm text-slate-600 hover:text-slate-800 underline"
            >
              Configurează raport
            </button>
            <button
              id="generate"
              onClick={() => {
                if (client.skip_report_modal && client.report_settings != null) {
                  doGenerate(dateStart, dateEnd, normalizeReportSettings(client.report_settings));
                } else {
                  openReportModal(true);
                }
              }}
              disabled={(!client.google_ads_connected && !client.meta_ads_connected) || generating}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Se generează…' : 'Generează raport nou'}
            </button>
          </div>
        </div>
        {generateError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">{generateError}</p>
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {(client.reports?.length ?? 0) === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              Niciun raport încă. Conectează cel puțin o platformă de reclame și generează un raport.
            </div>
          ) : (
            (client.reports ?? []).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-slate-800">
                    {r.report_date_start} – {r.report_date_end}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString('ro-RO')} · {r.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {r.pdf_url && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSendReportId(r.id);
                          setSendToEmail('');
                          setSendFromEmail('');
                          setSendError('');
                          setSendSuccess(false);
                        }}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Trimite raport
                      </button>
                      <a
                        href={r.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-600 hover:underline"
                      >
                        Descarcă PDF
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4 p-6">
            <h3 className="font-semibold text-slate-800">
              {reportModalFull ? 'Configurează și generează raport' : 'Generează raport'}
            </h3>
            <form onSubmit={handleGenerateReport} className="mt-4 space-y-4">
              {generateError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{generateError}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              {reportModalFull && (
                <>
                  <p className="text-sm text-slate-600">Bifează ce metrici și grafice să apară în raportul PDF.</p>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Google Ads</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {GOOGLE_REPORT_KEYS.map((key) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={clientReportSettings.google?.[key as GoogleReportKey] !== false}
                              onChange={(e) =>
                                setClientReportSettings((prev) => ({
                                  ...prev,
                                  google: { ...prev.google, [key]: e.target.checked },
                                }))
                              }
                              className="rounded border-slate-300 text-blue-600"
                            />
                            {GOOGLE_LABELS[key as GoogleReportKey]}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Meta Ads</h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {META_REPORT_KEYS.map((key) => (
                          <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={clientReportSettings.meta?.[key as MetaReportKey] !== false}
                              onChange={(e) =>
                                setClientReportSettings((prev) => ({
                                  ...prev,
                                  meta: { ...prev.meta, [key]: e.target.checked },
                                }))
                              }
                              className="rounded border-slate-300 text-blue-600"
                            />
                            {META_LABELS[key as MetaReportKey]}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Grafice</h4>
                    <div className="space-y-1">
                      {REPORT_CHART_KEYS.map((key) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={clientReportSettings.charts?.[key as ReportChartKey] !== false}
                            onChange={(e) =>
                              setClientReportSettings((prev) => ({
                                ...prev,
                                charts: { ...prev.charts, [key]: e.target.checked },
                              }))
                            }
                            className="rounded border-slate-300 text-blue-600"
                          />
                          {CHART_LABELS[key as ReportChartKey]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Nu mai afișa acest popup (folosește aceste setări la următoarea generare)
                  </label>
                </>
              )}
              {!reportModalFull && client?.report_settings != null ? (
                <p className="text-xs text-slate-500">
                  Setări raport: cele salvate pentru acest client.{' '}
                  <button
                    type="button"
                    onClick={() => setReportModalFull(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Configurează ce apare în raport
                  </button>
                </p>
              ) : null}
              <div className="flex gap-2 justify-end pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Anulare
                </button>
                {reportModalFull && (
                  <button
                    type="button"
                    onClick={handleSaveReportSettings}
                    disabled={savingSettings}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                  >
                    {savingSettings ? 'Se salvează…' : 'Salvează setări'}
                  </button>
                )}
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

      {sendReportId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="font-semibold text-slate-800">Trimite raport pe email</h3>
            <p className="text-sm text-slate-500 mt-1">Raportul va fi trimis la adresa indicata mai jos.</p>
            <form onSubmit={handleSendReport} className="mt-4 space-y-4">
              {sendError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{sendError}</p>
              )}
              {sendSuccess && (
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">Raport trimis cu succes.</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trimite la (email destinatar) *</label>
                <input
                  type="email"
                  value={sendToEmail}
                  onChange={(e) => setSendToEmail(e.target.value)}
                  placeholder="client@email.ro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">De la (emailul tau, optional – Reply-To)</label>
                <input
                  type="email"
                  value={sendFromEmail}
                  onChange={(e) => setSendFromEmail(e.target.value)}
                  placeholder="tu@agentia.ro"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setSendReportId(null); setSendError(''); }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Anulare
                </button>
                <button
                  type="submit"
                  disabled={sending || !sendToEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Se trimite…' : 'Trimite'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
