'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const callbackUrl = encodeURIComponent('/#preturi');

type Billing = 'monthly' | 'annual';

/** Afișează prețul cu partea zecimală (virgula + cifre) mai mică decât partea întreagă */
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
      {decStr && (
        <span className="text-sm md:text-base text-slate-600 align-baseline">{decStr}</span>
      )}
      <span className="font-sans text-sm text-slate-500 font-normal">{suffix}</span>
    </span>
  );
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    badge: null,
    priceMonthly: 0,
    priceAnnual: 0,
    priceAnnualPerMonth: 0,
    forever: true,
    features: [
      '1 client activ',
      'Până la 3 rapoarte/lună',
      'Google Ads + Meta Ads',
      'Watermark "Powered by REPORTKIT" pe PDF',
      'Email support (48h response)',
    ],
    cta: 'Începe gratuit',
    ctaHrefSignup: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    badge: null,
    priceMonthly: 19,
    priceAnnual: 171,
    priceAnnualPerMonth: 14.25,
    forever: false,
    features: [
      'Până la 5 clienți activi',
      'Rapoarte PDF nelimitate',
      'Google Ads + Meta Ads',
      'White-label (fără watermark)',
      'Email support (24h response)',
    ],
    cta: 'Alege Starter',
    ctaHrefSignup: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'Cel mai popular',
    priceMonthly: 69,
    priceAnnual: 621,
    priceAnnualPerMonth: 51.75,
    forever: false,
    features: [
      'Până la 20 clienți activi',
      'Rapoarte PDF nelimitate',
      'Google Ads + Meta Ads + Google Analytics 4',
      'Full white-label (logo + culori personalizate)',
      'Rapoarte programate automat (trimise pe email lunar)',
      'Priority email support (12h response)',
    ],
    cta: 'Alege Professional',
    ctaHrefSignup: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    badge: null,
    priceMonthly: 149,
    priceAnnual: 1341,
    priceAnnualPerMonth: 111.75,
    forever: false,
    features: [
      'Clienți nelimitați',
      'Toate platformele (Google Ads, Meta Ads, GA4, + altele când adaugi)',
      'Full white-label + Custom domain (ex: reports.agencyname.com)',
      'Rapoarte programate + auto-trimise pe email',
      'Priority support (6h response) + onboarding call',
      'Dedicated account manager',
    ],
    cta: 'Alege Agency',
    ctaHrefSignup: false,
  },
] as const;

export function PricingSection() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;
  const [billing, setBilling] = useState<Billing>('monthly');

  const ctaSignin = `/auth/signin?callbackUrl=${callbackUrl}`;

  return (
    <section id="preturi" className="py-20 md:py-24 px-6 md:px-10 bg-slate-50 border-t border-slate-200 scroll-mt-20">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-xs font-semibold tracking-[0.12em] uppercase text-blue-700 text-center mb-3">Prețuri</div>
        <h2 className="font-display text-3xl md:text-[32px] text-slate-900 text-center mb-3">
          Simplu. <span className="italic text-blue-700">Transparent.</span>
        </h2>
        <p className="text-base text-slate-600 text-center max-w-[460px] mx-auto mb-10">
          Fără contracte pe termen lung. Anulezi oricând.
        </p>

        {/* Toggle Lunar / Anual — −25% în dreapta textului Anual, vizibil tot timpul */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
            Lunar
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={billing === 'annual'}
            onClick={() => setBilling((b) => (b === 'monthly' ? 'annual' : 'monthly'))}
            className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              billing === 'annual' ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${
                billing === 'annual' ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billing === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
            Anual
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46]">
            −25%
          </span>
        </div>

        {/* Cele 3 pachete pe un rând: Starter, Professional, Agency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.filter((p) => !p.forever).map((plan) => {
            const isPopular = !!plan.badge;
            const showMonthlyPrice = billing === 'monthly';
            const annualPerMonth = plan.priceAnnualPerMonth;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-rk-xl p-6 flex flex-col gap-5 ${
                  isPopular ? 'border-2 border-blue-700 shadow-[0_0_0_3px_rgba(30,64,175,.1)]' : 'border-[1.5px] border-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{plan.name}</div>
                  {plan.badge && (
                    <p className="text-xs text-blue-700 font-medium mt-0.5">{plan.badge}</p>
                  )}
                  <div className="font-display text-slate-900 mt-2 flex flex-wrap items-baseline gap-1">
                    {showMonthlyPrice ? (
                      <>
                        <span className="text-3xl">€{plan.priceMonthly}</span>
                        <span className="font-sans text-sm text-slate-500 font-normal">/lună</span>
                      </>
                    ) : (
                      <>
                        <PriceDisplay value={annualPerMonth} suffix="/lună" size="large" />
                        <span className="font-sans text-slate-500 text-sm">(€{plan.priceAnnual.toLocaleString('ro-RO')}/an)</span>
                      </>
                    )}
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-slate-500 mt-1">25% reducere</p>
                  )}
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((x) => (
                    <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={
                    isLoggedIn
                      ? plan.ctaHrefSignup
                        ? '/auth/signup'
                        : `/dashboard/plan${plan.forever ? '' : `?plan=${plan.id}`}`
                      : ctaSignin
                  }
                  className={`mt-auto w-full inline-flex justify-center py-3 px-4 rounded-rk text-sm font-semibold transition-colors ${
                    isPopular
                      ? 'bg-blue-700 text-white shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-600'
                      : 'bg-white border-[1.5px] border-slate-200 text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pachetul Free sub cele 3 */}
        {(() => {
          const plan = PLANS.find((p) => p.forever)!;
          return (
            <div className="mt-8 flex justify-center">
              <div className="bg-white border-[1.5px] border-slate-200 rounded-rk-xl p-6 flex flex-col md:flex-row md:items-center md:gap-10 w-full max-w-[640px]">
                <div className="flex-shrink-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{plan.name}</div>
                  <div className="font-display text-slate-900 mt-2 flex items-baseline gap-1">
                    <span className="text-3xl">€0</span>
                    <span className="font-sans text-sm text-slate-500 font-normal">/mereu</span>
                  </div>
                </div>
                <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-4 md:mt-0">
                  {plan.features.map((x) => (
                    <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex-shrink-0 mt-4 md:mt-0">
                  <Link
                    href={isLoggedIn ? '/auth/signup' : ctaSignin}
                    className="w-full md:w-auto inline-flex justify-center py-3 px-5 bg-white border-[1.5px] border-slate-200 rounded-rk text-sm font-semibold text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
