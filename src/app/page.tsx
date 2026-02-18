import Link from 'next/link';
import { PublicFooter } from '@/components/PublicFooter';
import { SiteLogo } from '@/components/SiteLogo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#ECEEF2]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center flex-shrink-0" aria-label="ReportKit">
          <SiteLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <a href="#functionalitati" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
            Funcționalități
          </a>
          <a href="#preturi" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
            Prețuri
          </a>
          <a href="#contact" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/auth/signin"
            className="flex items-center justify-center h-11 text-[14px] font-semibold text-blue-700 px-4 rounded-rk-sm hover:bg-blue-700/10 transition-colors"
          >
            Autentificare
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center h-11 px-5 bg-blue-700 text-white text-[14px] font-semibold rounded-rk-sm shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors"
          >
            Încearcă gratuit
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-white border-b border-slate-200 px-6 md:px-10 pt-20 md:pt-28 pb-16 md:pb-24 text-center overflow-visible">
        {/* Cartonașe flotante – mai mari, mai ieșite din ecran */}
        <div className="hidden lg:block pointer-events-none absolute inset-0 w-full overflow-visible" style={{ left: '50%', right: 'auto', width: '100vw', marginLeft: '-50vw' }}>
          {/* Stânga – conținut la dreapta, card mai mare și mai ieșit */}
          <div className="absolute left-0 top-[6%] w-[340px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-6 pl-14 pr-5 text-right -translate-x-[58%] -rotate-6" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Raport/lună</div>
            <div className="font-display text-3xl text-slate-900 mt-1">€4,00</div>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-2 py-1 mt-2">▲ 1.02%</span>
          </div>
          <div className="absolute left-0 top-[36%] w-[300px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-6 pl-14 pr-5 text-right -translate-x-[58%] rotate-[-3deg]" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Cheltuieli</div>
            <div className="font-display text-2xl text-slate-900 mt-1">€3.450</div>
          </div>
          <div className="absolute left-0 top-[64%] w-[360px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-6 pl-14 pr-5 text-right -translate-x-[58%] rotate-3" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="flex items-center justify-between mb-2 flex-row-reverse">
              <span className="text-xs text-blue-700">Vezi →</span>
              <span className="text-sm font-semibold text-slate-600">Sincronizare</span>
            </div>
            <div className="h-12 w-full rounded bg-slate-50 overflow-hidden flex items-end">
              <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#1E40AF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="0,18 12,14 24,20 36,8 48,12 60,6 72,16 84,10 100,14"
                />
              </svg>
            </div>
            <div className="text-xs text-slate-500 mt-1.5">36%</div>
          </div>
          {/* Dreapta – conținut la stânga, card mai mare și mai ieșit */}
          <div className="absolute right-0 top-[4%] w-[380px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-6 pr-14 pl-5 text-left translate-x-[58%] rotate-[5deg]" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Rapoarte trimise</div>
            <div className="font-display text-3xl text-slate-900 mt-1">€7.840</div>
            <div className="text-xs text-slate-500 mt-1">265 luna asta</div>
          </div>
          <div className="absolute right-0 top-[38%] w-[260px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-5 pr-14 pl-5 text-left translate-x-[58%] -rotate-[4deg]" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase">Cont</div>
            <div className="font-mono text-base text-slate-600 tracking-wider mt-0.5">**** 0892</div>
          </div>
          <div className="absolute right-0 top-[62%] w-[400px] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-rk-lg p-6 pr-14 pl-5 text-left translate-x-[58%] rotate-[-2deg]" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.12)' }}>
            <div className="text-sm font-semibold text-slate-700 mb-3">Statistici</div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center flex-shrink-0" style={{ background: 'conic-gradient(#10B981 0deg 166deg, #E2E8F0 166deg 360deg)' }}>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900 bg-white rounded-full m-1">46%</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500">Clienți activi</div>
                <div className="font-display text-2xl text-slate-900">2.567</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl md:text-[58px] leading-[1.1] text-slate-900 max-w-[740px] mx-auto mb-6">
            Rapoarte de marketing.
            <br />
            <span className="italic text-blue-700">Generate automat.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-[520px] mx-auto mb-12 leading-relaxed">
            ReportKit adună datele din toate platformele și creează rapoarte clare pentru clienții tăi — fără ore pierdute în Excel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-10 py-4 bg-blue-700 text-white text-base font-semibold rounded-rk-lg shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors"
            >
              Începe gratuit →
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-10 py-4 bg-white text-slate-900 border-[1.5px] border-slate-200 rounded-rk-lg text-base font-semibold shadow-rk hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              Vezi demo live
            </Link>
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="relative z-10 mt-14 mx-auto max-w-[760px] bg-white border border-slate-200 rounded-rk-xl shadow-rk-lg overflow-hidden">
          <div className="h-12 px-5 flex items-center gap-2 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-rk-green" />
            <div className="flex-1" />
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-rk px-3 py-2 text-xs text-slate-400 w-[200px]">
              Caută...
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
            <div className="px-5 py-5">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Total cheltuieli</div>
              <div className="font-display text-2xl text-slate-900 mt-2">€12,480</div>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-2 py-0.5 mt-2">▲ 8.2%</span>
            </div>
            <div className="px-5 py-5">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Conversii</div>
              <div className="font-display text-2xl text-slate-900 mt-2">1,640</div>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#065F46] bg-[#ECFDF5] rounded-full px-2 py-0.5 mt-2">▲ 13%</span>
            </div>
            <div className="px-5 py-5">
              <div className="text-xs text-slate-500 uppercase tracking-wide">ROAS mediu</div>
              <div className="font-display text-2xl text-slate-900 mt-2">4.2×</div>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#991B1B] bg-[#FEF2F2] rounded-full px-2 py-0.5 mt-2">▼ 0.3</span>
            </div>
          </div>
          <div className="p-5 flex items-end gap-1.5 h-16">
            {[35, 50, 42, 68, 55, 72, 85, 78, 90, 70, 95, 100].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-[3px] min-h-[4px] transition-colors ${i >= 10 ? 'bg-blue-700' : 'bg-slate-200'}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Logos strip */}
      <section className="bg-slate-50 border-y border-slate-200 py-10 px-6 md:px-10 flex flex-wrap items-center justify-between gap-6">
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Folosit de agenții din</span>
        <div className="flex items-center gap-10 flex-wrap">
          <span className="text-base font-bold text-slate-400">🇷🇴 București</span>
          <span className="text-base font-bold text-slate-400">🇷🇴 Cluj-Napoca</span>
          <span className="text-base font-bold text-slate-400">🇷🇴 Timișoara</span>
          <span className="text-base font-bold text-slate-400">🇷🇴 Iași</span>
          <span className="text-base font-bold text-slate-400">🇷🇴 Brașov</span>
        </div>
      </section>

      {/* Features */}
      <section id="functionalitati" className="py-20 md:py-24 px-6 md:px-10 bg-white scroll-mt-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-[560px] mb-16">
            <div className="text-xs font-semibold tracking-[0.12em] uppercase text-blue-700 mb-4">Funcționalități</div>
            <h2 className="font-display text-3xl md:text-[32px] leading-tight text-slate-900">
              Tot ce ai nevoie. <span className="italic text-blue-700">Nimic în plus.</span>
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Construit pentru agenții mici și freelanceri care vor să impresioneze cu rapoarte profesionale, fără să petreacă ore întregi formatând date.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-rk-xl overflow-hidden">
            {[
              { icon: 'link', title: 'Integrări native', desc: 'Google Ads, Meta, TikTok, GA4, Mailchimp — conectate în câteva clicuri.' },
              { icon: 'file', title: 'Export PDF & PPTX', desc: 'Rapoarte cu branding-ul tău, gata de trimis clientului direct.' },
              { icon: 'clock', title: 'Programare automată', desc: 'Setezi o dată, raportul se trimite automat în fiecare lună.' },
              { icon: 'chart', title: 'Date în timp real', desc: 'Sincronizare automată zilnică din toate platformele conectate.' },
              { icon: 'users', title: 'Multi-client', desc: 'Gestionezi toți clienții dintr-un singur cont, organizat și clar.' },
              { icon: 'lock', title: 'Securitate GDPR', desc: 'Datele clienților tăi sunt protejate conform legislației europene.' },
            ].map((f) => (
              <div key={f.title} className="bg-white p-8 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-rk-sm bg-[#EFF6FF] flex items-center justify-center mb-5">
                  {f.icon === 'link' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  )}
                  {f.icon === 'file' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                  )}
                  {f.icon === 'clock' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  )}
                  {f.icon === 'chart' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  )}
                  {f.icon === 'users' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  )}
                  {f.icon === 'lock' && (
                    <svg width="18" height="18" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preturi" className="py-20 md:py-24 px-6 md:px-10 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-[880px] mx-auto">
          <div className="text-xs font-semibold tracking-[0.12em] uppercase text-blue-700 text-center mb-3">Prețuri</div>
          <h2 className="font-display text-3xl md:text-[32px] text-slate-900 text-center mb-3">
            Simplu. <span className="italic text-blue-700">Transparent.</span>
          </h2>
          <p className="text-base text-slate-600 text-center max-w-[460px] mx-auto mb-14">
            Fără contracte pe termen lung. Anulezi oricând.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border-[1.5px] border-slate-200 rounded-rk-xl p-8 flex flex-col gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter</div>
                <div className="font-display text-4xl text-slate-900 mt-2">€0 <span className="font-sans text-sm text-slate-500 font-normal">/lună</span></div>
              </div>
              <ul className="space-y-3">
                {['3 clienți activi', '2 integrări', 'Export PDF', 'Support email'].map((x) => (
                  <li key={x} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="mt-auto w-full inline-flex justify-center py-3 px-4 bg-white border-[1.5px] border-slate-200 rounded-rk text-sm font-semibold text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50 transition-colors">
                Începe gratuit
              </Link>
            </div>
            <div className="bg-white border-2 border-blue-700 rounded-rk-xl p-8 flex flex-col gap-6 shadow-[0_0_0_3px_rgba(30,64,175,.1)] relative">
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-blue-700">Popular</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pro</div>
                <div className="font-display text-4xl text-slate-900 mt-2">€49 <span className="font-sans text-sm text-slate-500 font-normal">/lună</span></div>
              </div>
              <ul className="space-y-3">
                {['Clienți nelimitați', 'Toate integrările', 'Export PDF + PPTX', 'Trimitere automată', 'White-label branding', 'Support prioritar'].map((x) => (
                  <li key={x} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="mt-auto w-full inline-flex justify-center py-3 px-4 bg-blue-700 text-white rounded-rk text-sm font-semibold shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors">
                Încearcă 14 zile gratis
              </Link>
            </div>
            <div className="bg-white border-[1.5px] border-slate-200 rounded-rk-xl p-8 flex flex-col gap-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Agenție</div>
                <div className="font-display text-4xl text-slate-900 mt-2">€129 <span className="font-sans text-sm text-slate-500 font-normal">/lună</span></div>
              </div>
              <ul className="space-y-3">
                {['Totul din Pro', 'Multi-utilizator (5 conturi)', 'API access', 'Onboarding dedicat'].map((x) => (
                  <li key={x} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-[#ECFDF5] text-rk-green flex items-center justify-center text-xs font-extrabold flex-shrink-0">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="mt-auto w-full inline-flex justify-center py-3 px-4 bg-white border-[1.5px] border-slate-200 rounded-rk text-sm font-semibold text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50 transition-colors">
                Contactează-ne
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 md:py-24 px-6 md:px-10 bg-white border-t border-slate-200 scroll-mt-20">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="text-xs font-semibold tracking-[0.12em] uppercase text-blue-700 mb-3">Contact</div>
          <h2 className="font-display text-3xl md:text-[32px] text-slate-900 mb-4">
            Hai să vorbim. <span className="italic text-blue-700">Suntem aici.</span>
          </h2>
          <p className="text-base text-slate-600 mb-10 leading-relaxed">
            Ai întrebări despre planuri, integrări sau onboarding? Scrie-ne sau sună-ne.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-left">
            <a href="mailto:contact@reportkit.ro" className="flex items-center gap-4 p-4 rounded-rk-lg border border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition-colors min-w-[240px]">
              <div className="w-12 h-12 rounded-rk-sm bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Email</div>
                <div className="text-slate-600">contact@reportkit.ro</div>
              </div>
            </a>
            <a href="tel:+40370123456" className="flex items-center gap-4 p-4 rounded-rk-lg border border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition-colors min-w-[240px]">
              <div className="w-12 h-12 rounded-rk-sm bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" fill="none" stroke="#1E40AF" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Telefon</div>
                <div className="text-slate-600">+40 370 123 456</div>
              </div>
            </a>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Program: Luni – Vineri, 09:00 – 18:00 (EET)
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 py-20 md:py-24 px-6 md:px-10 text-center">
        <h2 className="font-display text-4xl md:text-[42px] text-white mb-4">
          Gata să economisești ore întregi?
        </h2>
        <p className="text-base text-slate-400 mb-10">
          Încearcă ReportKit gratuit. Primul raport, în 5 minute.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center justify-center px-10 py-4 bg-blue-700 text-white text-base font-semibold rounded-rk-lg shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors"
        >
          Creează cont gratuit →
        </Link>
      </section>

      <PublicFooter />
    </div>
  );
}
