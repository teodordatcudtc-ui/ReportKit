'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Agency {
  id: string;
  agency_name: string;
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bună dimineața';
  if (h < 18) return 'Bună ziua';
  return 'Bună seara';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {getGreeting()}, {name} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 capitalize">
          {dateStr} · {reports.length} rapoarte în listă
        </p>
      </div>

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
