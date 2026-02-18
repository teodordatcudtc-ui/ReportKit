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
        <div className="animate-pulse text-slate-500">Loading…</div>
      </div>
    );
  }

  const name = agency?.agency_name ?? session?.user?.name ?? 'there';
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {name}!</h1>
        <p className="text-slate-600 mt-1">Here’s an overview of your agency.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">Clients</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{clients.length}</p>
          <Link href="/clients" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View clients →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-500">Reports generated</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{reports.length}</p>
          <Link href="/clients" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Generate report →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Recent reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Last 5 reports</p>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No reports yet. Add a client and connect Google Ads or Meta Ads, then generate a report.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">
                    {(r as { clients?: { client_name?: string } }).clients?.client_name ?? 'Client'} –{' '}
                    {r.report_date_start} to {r.report_date_end}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {r.pdf_url && (
                  <a
                    href={r.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
