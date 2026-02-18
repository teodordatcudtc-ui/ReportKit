import Link from 'next/link';
import { SiteLogo } from '@/components/SiteLogo';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <Link href="/" className="flex items-center flex-shrink-0" aria-label="ReportKit">
            <SiteLogo />
          </Link>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Link href="/#functionalitati" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Funcționalități
            </Link>
            <Link href="/#preturi" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Prețuri
            </Link>
            <Link href="/#contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Contact
            </Link>
            <Link href="/termeni" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Termeni și condiții
            </Link>
            <Link href="/confidentialitate" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Politica de confidențialitate
            </Link>
          </nav>
        </div>
        <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} ReportKit. Toate drepturile rezervate.</p>
          <p>Rapoarte de marketing pentru agenții.</p>
        </div>
      </div>
    </footer>
  );
}
