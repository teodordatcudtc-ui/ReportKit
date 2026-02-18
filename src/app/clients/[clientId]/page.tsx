'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

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
      setGenerateError(data.error ?? 'Failed to generate report');
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
        <div className="animate-pulse text-slate-500">Loading…</div>
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
          ← Back to clients
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Client: {client.client_name}</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          {success === 'google_connected' && 'Google Ads connected successfully.'}
          {success === 'meta_connected' && 'Meta Ads connected successfully.'}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          Connection failed. Please try again or check your app configuration.
        </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Connection status</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-700">Google Ads</p>
              <p className="text-sm text-slate-500">
                {client.google_ads_connected
                  ? `Connected${googleToken?.account_id ? ` (${googleToken.account_id})` : ''}`
                  : 'Not connected'}
              </p>
            </div>
            {client.google_ads_connected ? (
              <form action="/api/auth/google/disconnect" method="POST" className="inline">
                <input type="hidden" name="client_id" value={clientId} />
                <button type="button" className="text-sm text-slate-500 hover:text-red-600">
                  Disconnect (TODO)
                </button>
              </form>
            ) : (
              <a
                href={`/api/auth/google/connect?client_id=${clientId}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Connect Google Ads
              </a>
            )}
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-slate-700">Meta Ads</p>
              <p className="text-sm text-slate-500">
                {client.meta_ads_connected
                  ? `Connected${metaToken?.account_id ? ` (${metaToken.account_id})` : ''}`
                  : 'Not connected'}
              </p>
            </div>
            {client.meta_ads_connected ? (
              <span className="text-sm text-slate-500">Disconnect (TODO)</span>
            ) : (
              <a
                href={`/api/auth/meta/connect?client_id=${clientId}`}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Connect Meta Ads
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
          <h2 className="font-semibold text-slate-800">Reports history</h2>
          <button
            id="generate"
            onClick={() => setReportModalOpen(true)}
            disabled={!client.google_ads_connected && !client.meta_ads_connected}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate new report
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {client.reports.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No reports yet. Connect at least one ad platform and generate a report.
            </div>
          ) : (
            client.reports.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">
                    {r.report_date_start} – {r.report_date_end}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()} · {r.status}
                  </p>
                </div>
                {r.pdf_url && (
                  <a
                    href={r.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download PDF
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
            <h3 className="font-semibold text-slate-800">Generate report</h3>
            <form onSubmit={handleGenerateReport} className="mt-4 space-y-4">
              {generateError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{generateError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating ? 'Generating…' : 'Generate report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfUrl && (
        <p className="text-sm text-green-600">
          Report ready: <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">Open PDF</a>
        </p>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-pulse text-slate-500">Loading…</div></div>}>
      <ClientDetailContent />
    </Suspense>
  );
}
