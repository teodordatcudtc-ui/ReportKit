import Link from 'next/link';
import { SiteLogo } from '@/components/SiteLogo';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 md:px-10">
      <Link href="/" className="flex items-center flex-shrink-0" aria-label="ReportKit">
        <SiteLogo />
      </Link>
      <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        <Link href="/#functionalitati" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
          Funcționalități
        </Link>
        <Link href="/#preturi" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
          Prețuri
        </Link>
        <Link href="/#contact" className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none">
          Contact
        </Link>
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
  );
}
