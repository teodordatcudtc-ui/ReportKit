'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PLANS_DISPLAY } from '@/lib/plans-data';
import type { PlanDisplayId } from '@/lib/plans-data';

type Billing = 'monthly' | 'annual';

function PriceDisplay({
  value,
  suffix = '/lună',
  size = 'normal',
}: {
  value: number;
  suffix?: string;
  size?: 'normal' | 'large';
}) {
  if (value === 0) {
    return (
      <span className="font-display text-slate-900">
        €0 <span className="font-sans text-sm text-slate-500 font-normal">{suffix}</span>
      </span>
    );
  }
  const int = Math.floor(value);
  const dec = value % 1;
  const decStr = dec > 0 ? ',' + (Math.round(value * 100) % 100).toString().padStart(2, '0') : '';
  const intSize = size === 'large' ? 'text-2xl md:text-3xl' : 'text-xl';
  return (
    <span className="font-display text-slate-900 inline-flex items-baseline">
      <span className={intSize}>€{int}</span>
      {decStr && <span className="text-sm md:text-base text-slate-600 align-baseline">{decStr}</span>}
      <span className="font-sans text-sm text-slate-500 font-normal">{suffix}</span>
    </span>
  );
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanDisplayId | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<PlanDisplayId | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [earlyAccessCode, setEarlyAccessCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [billing, setBilling] = useState<Billing>('monthly');

  useEffect(() => {
    fetch('/api/agencies')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.plan && ['free', 'starter', 'professional', 'agency'].includes(data.plan)) {
          setPlan(data.plan as PlanDisplayId);
        } else {
          setPlan('free');
        }
        if (data?.trial_ends_at) setTrialEndsAt(data.trial_ends_at);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function redeemEarlyAccess(e: React.FormEvent) {
    e.preventDefault();
    setRedeemError('');
    if (!earlyAccessCode.trim()) return;
    setRedeeming(true);
    const res = await fetch('/api/early-access/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: earlyAccessCode.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setRedeeming(false);
    if (!res.ok) {
      setRedeemError(data.error ?? 'Nu s-a putut aplica codul.');
      return;
    }
    setPlan('agency');
    if (data.trial_ends_at) setTrialEndsAt(data.trial_ends_at);
    setMessage(data.message ?? 'Cod early access aplicat: 6 luni gratuit, plan Agency.');
    setEarlyAccessCode('');
  }

  async function switchPlan(newPlan: PlanDisplayId) {
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
    if (data?.plan) setPlan(data.plan as PlanDisplayId);
    setMessage(`Plan schimbat la ${PLANS_DISPLAY.find((p) => p.id === newPlan)?.name ?? newPlan}. (Faza de test – fără plată.)`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500 text-sm font-medium">Se încarcă…</div>
      </div>
    );
  }

  const paidPlans = PLANS_DISPLAY.filter((p) => !p.forever);
  const freePlan = PLANS_DISPLAY.find((p) => p.forever)!;

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 md:px-6 space-y-10">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Plan abonament</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Schimbă planul (faza de test – fără plată). Limitele se aplică imediat.
        </p>
      </div>

      {message && (
        <div className="text-sm p-4 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200 max-w-xl mx-auto text-center">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm p-4 rounded-xl border bg-red-50 text-red-700 border-red-200 max-w-xl mx-auto text-center">
          {error}
        </div>
      )}

      <section className="p-5 rounded-xl border border-amber-200 bg-amber-50/80 max-w-xl mx-auto">
        <h2 className="text-sm font-semibold text-amber-900 mb-2">Ai un cod early access?</h2>
        <p className="text-xs text-amber-800 mb-3">
          Introdu codul primit și primești 6 luni gratuit la planul Agency (acces total).
        </p>
        <form onSubmit={redeemEarlyAccess} className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            value={earlyAccessCode}
            onChange={(e) => setEarlyAccessCode(e.target.value.toUpperCase())}
            placeholder="ex: EARLY-2025-01"
            className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            disabled={redeeming}
          />
          <button
            type="submit"
            disabled={redeeming || !earlyAccessCode.trim()}
            className="px-4 py-2 text-sm font-medium text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            {redeeming ? 'Se aplică…' : 'Aplică cod'}
          </button>
        </form>
        {redeemError && <p className="text-xs text-red-600 mt-2">{redeemError}</p>}
        {trialEndsAt && plan === 'agency' && (
          <p className="text-xs text-amber-800 mt-2">
            Perioada gratuită: până la <strong>{new Date(trialEndsAt).toLocaleDateString('ro-RO')}</strong>
          </p>
        )}
      </section>

      {/* Toggle Lunar / Anual */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Lunar</span>
        <button
          type="button"
          role="switch"
          aria-checked={billing === 'annual'}
          onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
          className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            billing === 'annual' ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${billing === 'annual' ? 'left-6' : 'left-1'}`} />
        </button>
        <span className={`text-sm font-medium ${billing === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>Anual</span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46]">−25%</span>
      </div>

      {/* Pachete plătite: Starter, Professional, Agency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paidPlans.map((p) => {
          const isPopular = !!p.badge;
          const isCurrent = plan === p.id;
          const showMonthly = billing === 'monthly';
          return (
            <div
              key={p.id}
              className={`bg-white rounded-rk-xl p-6 flex flex-col gap-5 ${
                isPopular ? 'border-2 border-blue-700 shadow-[0_0_0_3px_rgba(30,64,175,.1)]' : 'border-[1.5px] border-slate-200'
              } ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.name}</div>
                {p.badge && <p className="text-xs text-blue-700 font-medium mt-0.5">{p.badge}</p>}
                <div className="font-display text-slate-900 mt-2 flex flex-wrap items-baseline gap-1">
                  {showMonthly ? (
                    <>
                      <span className="text-3xl">€{p.priceMonthly}</span>
                      <span className="font-sans text-sm text-slate-500 font-normal">/lună</span>
                    </>
                  ) : (
                    <>
                      <PriceDisplay value={p.priceAnnualPerMonth} suffix="/lună" size="large" />
                      <span className="font-sans text-slate-500 text-sm">(€{p.priceAnnual.toLocaleString('ro-RO')}/an)</span>
                    </>
                  )}
                </div>
                {billing === 'annual' && <p className="text-xs text-slate-500 mt-1">25% reducere</p>}
              </div>
              <ul className="space-y-2.5 flex-1">
                {p.features.map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => switchPlan(p.id)}
                disabled={!!switching || isCurrent}
                className={`mt-auto w-full inline-flex justify-center py-3 px-4 rounded-rk text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-600 cursor-default'
                    : isPopular
                      ? 'bg-blue-700 text-white shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-600'
                      : 'bg-white border-[1.5px] border-slate-200 text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {switching === p.id ? 'Se actualizează…' : isCurrent ? 'Plan curent' : p.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pachetul Free */}
      <div className="flex justify-center px-2">
        <div className={`bg-white border-[1.5px] rounded-rk-xl p-6 flex flex-col md:flex-row md:items-center md:gap-10 w-full max-w-[640px] ${plan === 'free' ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-200' : 'border-slate-200'}`}>
          <div className="flex-shrink-0">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{freePlan.name}</div>
            <div className="font-display text-slate-900 mt-2 flex items-baseline gap-1">
              <span className="text-3xl">€0</span>
              <span className="font-sans text-sm text-slate-500 font-normal">/mereu</span>
            </div>
          </div>
          <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-4 md:mt-0">
            {freePlan.features.map((x) => (
              <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">✓</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <div className="flex-shrink-0 mt-4 md:mt-0">
            <button
              type="button"
              onClick={() => switchPlan('free')}
              disabled={!!switching || plan === 'free'}
              className={`w-full md:w-auto inline-flex justify-center py-3 px-5 rounded-rk text-sm font-semibold transition-colors ${
                plan === 'free'
                  ? 'bg-slate-100 text-slate-600 cursor-default'
                  : 'bg-white border-[1.5px] border-slate-200 text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {switching === 'free' ? 'Se actualizează…' : plan === 'free' ? 'Plan curent' : freePlan.cta}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-600">
          ← Înapoi la dashboard
        </Link>
      </div>
    </div>
  );
}
