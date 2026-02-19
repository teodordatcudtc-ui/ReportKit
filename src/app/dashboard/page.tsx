'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPlanLimit } from '@/lib/plans';

interface Agency {
  id: string;
  agency_name: string;
  plan?: string | null;
}
interface ReportRow {
  id: string;
  client_id: string;
  report_date_start: string;
  report_date_end: string;
  pdf_url: string | null;
  created_at: string;
  clients?: { client_name: string } | null;
}
interface Client {
  id: string;
  client_name: string;
}

interface SummaryData {
  totals: { spend: number; impressions: number; conversions: number };
  topClientsBySpend: { client_id: string; client_name: string; spend: number }[];
  clientsWithoutReport: { client_id: string; client_name: string }[];
  date_start: string;
  date_end: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [period, setPeriod] = useState(getMonthRange());
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/agencies').then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
      fetch('/api/reports?limit=5').then((r) => r.json()),
    ]).then(([agencyRes, clientsRes, reportsRes]) => {
      setAgency(agencyRes?.id ? agencyRes : null);
      setClients(clientsRes.clients ?? []);
      setReports(reportsRes.reports ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setSummaryLoading(true);
    fetch(`/api/dashboard/summary?date_start=${period.start}&date_end=${period.end}`)
      .then((r) => r.json())
      .then((data) => {
        setSummary(data);
        setSummaryLoading(false);
      })
      .catch(() => setSummaryLoading(false));
  }, [period.start, period.end]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 text-sm font-medium">Se încarcă…</div>
      </div>
    );
  }

  const name = agency?.agency_name ?? session?.user?.name ?? 'acolo';
  const today = new Date();
  const dateStr = today.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const periodLabel = period.start.slice(0, 7) === getMonthRange().start.slice(0, 7)
    ? 'Luna curentă'
    : `${period.start} – ${period.end}`;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 capitalize">
          {dateStr}
          {agency?.plan && (
            <>
              {' · '}
              Plan {agency.plan.charAt(0).toUpperCase() + agency.plan.slice(1)}
              {(() => {
                const limits = getPlanLimit(agency.plan);
                if (limits.maxClients === Infinity) return ` · ${clients.length} clienti`;
                return ` · ${clients.length}/${limits.maxClients} clienti`;
              })()}
              {' · '}
              <Link href="/dashboard/plan" className="text-blue-600 hover:underline">Schimbă plan</Link>
            </>
          )}
          {' · '}{reports.length} rapoarte în listă
        </p>
      </div>

      {/* Rezumat perioadă + selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Rezumat (toți clienții)</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Perioadă:</label>
          <select
            value={period.start}
            onChange={(e) => {
              const start = e.target.value;
              const [y, m] = start.split('-').map(Number);
              const end = new Date(y, m, 0).toISOString().slice(0, 10); // ultima zi a lunii m
              setPeriod({ start, end });
            }}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value={getMonthRange().start}>Luna curentă</option>
            {[1, 2, 3, 4, 5, 6].map((delta) => {
              const d = new Date();
              d.setMonth(d.getMonth() - delta);
              const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
              const label = d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
              return (
                <option key={start} value={start}>
                  {label}
                </option>
              );
            })}
          </select>
          </div>
      </div>

      {/* Total cheltuieli / impresii / conversii */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk animate-pulse h-28" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total cheltuieli</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-display text-3xl text-slate-900">
                {summary.totals.spend.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{periodLabel}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total impresii</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-display text-3xl text-slate-900">
                {summary.totals.impressions.toLocaleString('ro-RO')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{periodLabel}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total conversii</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-display text-3xl text-slate-900">
                {summary.totals.conversions.toLocaleString('ro-RO')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{periodLabel}</p>
          </div>
        </div>
      ) : null}

      {/* Top 5 + Clienți fără raport */}
      {summary && !summaryLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-rk-lg shadow-rk overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Top 5 clienți după cheltuieli</h3>
              <p className="text-xs text-slate-500 mt-0.5">{periodLabel}</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {summary.topClientsBySpend.map((c, i) => (
                <li key={c.client_id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <span className="text-slate-400 font-mono text-sm w-6">{i + 1}.</span>
                  <Link href={`/clients/${c.client_id}`} className="flex-1 text-sm font-medium text-slate-800 hover:text-blue-700 truncate">
                    {c.client_name}
                  </Link>
                  <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                    {c.spend.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} €
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-rk-lg shadow-rk overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Clienți fără raport în perioada selectată</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reminder: generează raport pentru acești clienți</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {summary.clientsWithoutReport.length === 0 ? (
                <li className="px-5 py-4 text-sm text-slate-500">Toți clienții au raport în această perioadă.</li>
              ) : (
                summary.clientsWithoutReport.map((c) => (
                  <li key={c.client_id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <Link
                      href={`/clients/${c.client_id}`}
                      className="text-sm font-medium text-slate-800 hover:text-blue-700 truncate"
                    >
                      {c.client_name}
                    </Link>
                    <Link
                      href={`/clients/${c.client_id}#generate`}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Generează raport
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rapoarte generate</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display text-4xl text-slate-900">{reports.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-1.5 py-0.5">
              ▲ luna asta
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">total</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Clienți activi</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display text-4xl text-slate-900">{clients.length}</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-1.5 py-0.5">
              ▲ activi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">conectați la platforme</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Acțiuni rapide</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display text-4xl text-slate-900">—</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">generează sau exportă</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-rk-lg p-5 shadow-rk">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stare conexiuni</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-display text-4xl text-slate-900">OK</span>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-1.5 py-0.5">
              ● Activ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">toate platformele</p>
        </div>
      </div>

      {/* Recent reports card */}
      <div className="bg-white border border-slate-200 rounded-rk-lg shadow-rk overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Rapoarte recente</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border-[1.5px] border-blue-700 bg-[#EFF6FF] text-blue-700">
                Toate
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border-[1.5px] border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-700 transition-colors cursor-default">
                Google Ads
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border-[1.5px] border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-700 transition-colors cursor-default">
                Meta
              </span>
            </div>
            <Link
              href="/clients"
              className="inline-flex items-center justify-center px-4 py-2 bg-white border-[1.5px] border-slate-200 rounded-rk-sm text-sm font-semibold text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              Generează raport
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-left py-3 px-4 border-b border-slate-200">
                  Client
                </th>
                <th className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-left py-3 px-4 border-b border-slate-200">
                  Perioadă
                </th>
                <th className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-left py-3 px-4 border-b border-slate-200">
                  Generat
                </th>
                <th className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-right py-3 px-4 border-b border-slate-200">
                  Acțiuni
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 px-6 text-center text-base text-slate-500">
                    Niciun raport încă. Adaugă un client, conectează Google Ads sau Meta Ads, apoi generează un raport.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {(r as { clients?: { client_name?: string } }).clients?.client_name ?? 'Client'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {r.report_date_start} – {r.report_date_end}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {new Date(r.created_at).toLocaleDateString('ro-RO')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.pdf_url ? (
                        <a
                          href={r.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-semibold text-blue-700 hover:bg-blue-700/10 px-2 py-1.5 rounded-rk-sm transition-colors"
                        >
                          Vezi →
                        </a>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
