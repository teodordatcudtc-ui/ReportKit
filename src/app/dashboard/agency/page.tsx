'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPlanLimit } from '@/lib/plans';
import { ReportPreview } from '@/components/ReportPreview';
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

interface Agency {
  id: string;
  agency_name: string;
  logo_url: string | null;
  primary_color: string;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  plan?: string | null;
  report_settings?: unknown;
  integrations?: { google_ads: boolean; meta_ads: boolean };
}

interface ScheduledRow {
  id: string;
  client_id: string;
  client_name: string;
  send_to_email: string;
  from_email: string | null;
  next_send_at: string;
  last_sent_at: string | null;
}

interface Client {
  id: string;
  client_name: string;
}

function AgencySettingsContent() {
  const searchParams = useSearchParams();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [agencyName, setAgencyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [scheduled, setScheduled] = useState<ScheduledRow[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [scheduleClientId, setScheduleClientId] = useState('');
  const [scheduleFromEmail, setScheduleFromEmail] = useState('');
  const [scheduleToEmail, setScheduleToEmail] = useState('');
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reportSettings, setReportSettings] = useState<ReportSettings>(getDefaultReportSettings());

  function load() {
    setLoading(true);
    fetch('/api/agencies')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAgency(data);
        if (data) {
          setAgencyName(data.agency_name ?? '');
          setPrimaryColor(data.primary_color ?? '#3B82F6');
          setWebsiteUrl(data.website_url ?? '');
          setContactEmail(data.contact_email ?? '');
          setContactPhone(data.contact_phone ?? '');
          setReportSettings(normalizeReportSettings(data.report_settings));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function loadScheduled() {
    fetch('/api/scheduled-reports')
      .then((r) => (r.ok ? r.json() : { scheduled: [] }))
      .then((data) => setScheduled(data.scheduled ?? []));
  }

  function loadClients() {
    fetch('/api/clients')
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((data) => setClients(data.clients ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const success = searchParams.get('success');
    const err = searchParams.get('error');
    if (success === 'google_connected') {
      setMessage('Google Ads conectat. Clientii din Manager Account au fost importati.');
      setError('');
    } else if (success === 'meta_connected') {
      setMessage('Meta Ads conectat. Ad account-urile au fost importate ca clienti.');
      setError('');
    } else if (success === 'google_disconnected') {
      setMessage('Google Ads deconectat.');
      setError('');
    } else if (success === 'meta_disconnected') {
      setMessage('Meta Ads deconectat.');
      setError('');
    } else if (err) {
      const errMsg =
        err === 'oauth_failed'
          ? 'Autorizare esuata.'
          : err === 'no_agency'
            ? 'Agenție negăsită.'
            : err === 'no_google_ads_account'
              ? 'Contul Google nu are conturi Google Ads accesibile. Conectează-te cu un cont care are (sau este) Manager Account în Google Ads.'
              : 'Eroare.';
      setError(errMsg);
      setMessage('');
    }
  }, [searchParams]);

  useEffect(() => {
    if (agency && getPlanLimit(agency.plan).scheduledEmail) {
      loadScheduled();
      loadClients();
    }
  }, [agency]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingLogo(true);
    const formData = new FormData();
    formData.set('file', file);
    const res = await fetch('/api/agencies/upload-logo', {
      method: 'POST',
      body: formData,
    });
    setUploadingLogo(false);
    e.target.value = '';
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Upload eșuat.');
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.logo_url) {
      setAgency((prev) => (prev ? { ...prev, logo_url: data.logo_url } : null));
      setMessage('Logo actualizat.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    const res = await fetch('/api/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agency_name: agencyName.trim(),
        primary_color: primaryColor,
        website_url: websiteUrl.trim() || null,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        report_settings: reportSettings,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Salvare eșuată.');
      return;
    }
    const data = await res.json().catch(() => null);
    if (data) setAgency(data);
    setMessage('Setări salvate. Rapoartele generate vor afișa branding-ul agenției tale.');
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleClientId || !scheduleToEmail.trim()) return;
    setError('');
    setAddingSchedule(true);
    const res = await fetch('/api/scheduled-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: scheduleClientId,
        send_to_email: scheduleToEmail.trim(),
        from_email: scheduleFromEmail.trim() || undefined,
      }),
    });
    setAddingSchedule(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Nu s-a putut adăuga programarea.');
      return;
    }
    setScheduleClientId('');
    setScheduleFromEmail('');
    setScheduleToEmail('');
    loadScheduled();
    setMessage('Programare adăugată. Raportul va fi trimis lunar pe email (fără configurare SMTP).');
  }

  async function handleDeleteSchedule(id: string) {
    setDeletingId(id);
    await fetch(`/api/scheduled-reports?id=${id}`, { method: 'DELETE' });
    setDeletingId(null);
    loadScheduled();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 text-sm font-medium">Se încarcă…</div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="text-slate-600">
        <p>Nu există agenție. Completează mai întâi onboarding-ul.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(420px,560px)] gap-8 items-start xl:pr-24">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Setări agenție (white-label)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logo-ul, culorile și datele de contact vor apărea pe rapoartele PDF generate, ca și cum ar fi emise în totalitate de agenția ta.
          </p>
        </div>

        {(error || message) && (
        <div
          className={`text-sm p-3 rounded-lg border ${
            error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {error || message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Branding raport</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo agenție</label>
            <div className="flex flex-wrap items-center gap-4">
              {agency.logo_url && (
                <div className="w-32 h-12 border border-slate-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL dinamic din Supabase storage */}
                  <img src={agency.logo_url} alt="Logo agenție" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? 'Se încarcă…' : agency.logo_url ? 'Schimbă logo' : 'Încarcă logo'}
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-1">PNG, JPEG, WebP sau SVG. Max 2 MB. Apare în antetul raportului PDF.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="agency_name">
              Nume agenție
            </label>
            <input
              id="agency_name"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex. Agenția Mea"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="primary_color">
              Culoare principală (accent în raport)
            </label>
            <div className="flex gap-3 items-center">
              <input
                id="primary_color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Contact (opțional, în footer raport)</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="website_url">
              Website
            </label>
            <input
              id="website_url"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://agentia-ta.ro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="contact_email">
              Email contact
            </label>
            <input
              id="contact_email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="contact@agentia-ta.ro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="contact_phone">
              Telefon
            </label>
            <input
              id="contact_phone"
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+40 123 456 789"
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Integrari</h2>
          <p className="text-xs text-slate-500">
            Conectezi o singura data contul Manager (Google Ads) sau Business Manager (Meta). Clientii din cont vor fi importati automat.
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-800">Google Ads (Manager Account)</p>
                <p className="text-sm text-slate-500">
                  {agency.integrations?.google_ads ? 'Conectat – clientii din Manager Account sunt importati' : 'Neconectat'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {agency.integrations?.google_ads ? (
                  <form action="/api/auth/google/disconnect-agency" method="POST" className="inline">
                    <button type="submit" className="text-sm text-slate-500 hover:text-red-600 font-medium">
                      Deconectare
                    </button>
                  </form>
                ) : (
                  <a
                    href="/api/auth/google/connect"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Conecteaza Google Ads Manager
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-slate-800">Meta Ads (Business Manager)</p>
                <p className="text-sm text-slate-500">
                  {agency.integrations?.meta_ads ? 'Conectat – ad account-urile sunt importate ca clienti' : 'Neconectat'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {agency.integrations?.meta_ads ? (
                  <form action="/api/auth/meta/disconnect-agency" method="POST" className="inline">
                    <button type="submit" className="text-sm text-slate-500 hover:text-red-600 font-medium">
                      Deconectare
                    </button>
                  </form>
                ) : (
                  <a
                    href="/api/auth/meta/connect"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Conecteaza Meta Ads
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Campuri in raport PDF</h2>
          <p className="text-xs text-slate-500">
            Bifeaza ce metrici si sectiuni sa apara in rapoartele generate. Debifate nu vor fi afisate in PDF.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Google Ads</h3>
              <div className="space-y-1.5">
                {GOOGLE_REPORT_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportSettings.google?.[key as GoogleReportKey] !== false}
                      onChange={(e) => {
                        setReportSettings((prev) => ({
                          ...prev,
                          google: {
                            ...prev.google,
                            [key]: e.target.checked,
                          },
                        }));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {GOOGLE_LABELS[key as GoogleReportKey]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Meta Ads</h3>
              <div className="space-y-1.5">
                {META_REPORT_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reportSettings.meta?.[key as MetaReportKey] !== false}
                      onChange={(e) => {
                        setReportSettings((prev) => ({
                          ...prev,
                          meta: {
                            ...prev.meta,
                            [key]: e.target.checked,
                          },
                        }));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {META_LABELS[key as MetaReportKey]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Grafice in raport</h3>
            <div className="space-y-1.5">
              {REPORT_CHART_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportSettings.charts?.[key as ReportChartKey] !== false}
                    onChange={(e) => {
                      setReportSettings((prev) => ({
                        ...prev,
                        charts: {
                          ...prev.charts,
                          [key]: e.target.checked,
                        },
                      }));
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {CHART_LABELS[key as ReportChartKey]}
                </label>
              ))}
            </div>
          </div>
        </section>

        {getPlanLimit(agency.plan).scheduledEmail && (
          <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Rapoarte programate (trimise lunar pe email)</h2>
            <p className="text-xs text-slate-500">
              Completezi doar emailul de la care trimiti si emailul catre care trimiti. Fara configurare SMTP.
            </p>
            <ul className="space-y-2">
              {scheduled.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm">
                    {s.client_name}: {s.from_email ? `${s.from_email} → ` : ''}{s.send_to_email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(s.id)}
                    disabled={deletingId === s.id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === s.id ? 'Se sterge…' : 'Sterge'}
                  </button>
                </li>
              ))}
              {scheduled.length === 0 && (
                <li className="text-sm text-slate-500">Nicio programare. Adauga mai jos.</li>
              )}
            </ul>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">Client</label>
                  <select
                    value={scheduleClientId}
                    onChange={(e) => setScheduleClientId(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[160px]"
                  >
                    <option value="">Alege client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.client_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">De la (emailul tau)</label>
                  <input
                    type="email"
                    value={scheduleFromEmail}
                    onChange={(e) => setScheduleFromEmail(e.target.value)}
                    placeholder="tu@agentia.ro"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[200px]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">Catre (email destinatar)</label>
                  <input
                    type="email"
                    value={scheduleToEmail}
                    onChange={(e) => setScheduleToEmail(e.target.value)}
                    placeholder="client@email.ro"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[200px]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSchedule || !scheduleClientId || !scheduleToEmail.trim()}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {addingSchedule ? 'Se adauga…' : 'Programeaza'}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-rk-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? 'Se salvează…' : 'Salvează setările'}
          </button>
        </div>
      </form>
      </div>

      <div className="xl:sticky xl:top-6">
        <ReportPreview
          agency_name={agencyName}
          primary_color={primaryColor}
          logo_url={agency.logo_url}
          website_url={websiteUrl}
          contact_email={contactEmail}
          contact_phone={contactPhone}
          reportSettings={reportSettings}
        />
      </div>
    </div>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh]"><div className="animate-pulse text-slate-500 text-sm font-medium">Se încarcă…</div></div>}>
      <AgencySettingsContent />
    </Suspense>
  );
}
