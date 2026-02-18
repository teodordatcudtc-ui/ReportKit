'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Client {
  id: string;
  client_name: string;
  google_ads_connected: boolean;
  meta_ads_connected: boolean;
  last_report: { date: string; pdf_url: string } | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        setClients(data.clients ?? []);
        setLoading(false);
      });
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: newName.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? 'Failed to add client');
      return;
    }
    setModalOpen(false);
    setNewName('');
    load();
    if (data.id) window.location.href = `/clients/${data.id}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-600 mt-1">Manage clients and generate reports.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          + Add client
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8">Loading…</div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
          <p className="font-medium">No clients yet</p>
          <p className="text-sm mt-1">Add your first client to connect ad accounts and generate reports.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add client
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <h2 className="font-semibold text-slate-800">{c.client_name}</h2>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className={c.google_ads_connected ? 'text-green-600' : 'text-slate-400'}>
                    Google Ads: {c.google_ads_connected ? '✓ Connected' : 'Not connected'}
                  </span>
                  <span className={c.meta_ads_connected ? 'text-green-600' : 'text-slate-400'}>
                    Meta Ads: {c.meta_ads_connected ? '✓ Connected' : 'Not connected'}
                  </span>
                </div>
                {c.last_report && (
                  <p className="text-xs text-slate-500 mt-1">Last report: {c.last_report.date}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/clients/${c.id}`}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  View details
                </Link>
                {(c.google_ads_connected || c.meta_ads_connected) && (
                  <Link
                    href={`/clients/${c.id}#generate`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Generate report
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6">
            <h3 className="font-semibold text-slate-800">Add client</h3>
            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}
              <div>
                <label htmlFor="client_name" className="block text-sm font-medium text-slate-700 mb-1">
                  Client name
                </label>
                <input
                  id="client_name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Shoes SRL"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setError(''); }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding…' : 'Add client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
