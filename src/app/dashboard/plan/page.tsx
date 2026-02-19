'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PlanId = 'free' | 'starter' | 'professional' | 'agency';

const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  agency: 'Agency',
};

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<PlanId | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/agencies')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan && ['free', 'starter', 'professional', 'agency'].includes(data.plan)) {
          setPlan(data.plan as PlanId);
        } else {
          setPlan('free');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function switchPlan(newPlan: PlanId) {
    setError('');
    setMessage('');
    setSwitching(newPlan);
    const res = await fetch('/api/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: newPlan }),
    });
    setSwitching(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Nu s-a putut schimba planul.');
      return;
    }
    const data = await res.json().catch(() => null);
    if (data?.plan) setPlan(data.plan as PlanId);
    setMessage(`Plan schimbat la ${PLAN_NAMES[newPlan]}. (Faza de test – fara plata.)`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 text-sm font-medium">Se încarcă…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Plan abonament</h1>
        <p className="text-sm text-slate-500 mt-1">
          Schimbă planul (faza de test – fără plată). Limitele se aplică imediat.
        </p>
      </div>

      {message && (
        <div className="text-sm p-3 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm p-3 rounded-lg border bg-red-50 text-red-700 border-red-200">
          {error}
        </div>
      )}

      <p className="text-sm text-slate-600">
        Plan curent: <strong>{PLAN_NAMES[plan ?? 'free']}</strong>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['free', 'starter', 'professional', 'agency'] as PlanId[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => switchPlan(p)}
            disabled={!!switching || plan === p}
            className={`px-4 py-3 rounded-rk-lg border-2 text-left transition-colors ${
              plan === p
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
            } ${switching ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <span className="font-semibold">{PLAN_NAMES[p]}</span>
            {plan === p && <span className="ml-2 text-xs text-blue-600">(curent)</span>}
            {switching === p && <span className="block text-xs text-slate-500 mt-1">Se actualizează…</span>}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Free: 1 client, 3 rapoarte/lună. Starter: 5 clienți. Professional: 20 clienți + raport lunar pe email. Agency: nelimitat.
      </p>

      <Link
        href="/dashboard"
        className="inline-block text-sm font-medium text-blue-700 hover:text-blue-600"
      >
        ← Înapoi la dashboard
      </Link>
    </div>
  );
}
