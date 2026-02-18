'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { SiteLogo } from '@/components/SiteLogo';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/clients', label: 'Clienți', icon: UsersIcon },
];

function GridIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={className}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'U';
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const initials = getInitials(session?.user?.name ?? null, session?.user?.email ?? null);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - ReportKit style */}
      <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col flex-shrink-0 py-3 px-4 overflow-visible">
        <Link href="/" className="flex items-center justify-center h-[100px] shrink-0 overflow-visible" aria-label="ReportKit">
          <SiteLogo size="compact" />
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2.5 pt-2 pb-2">Principal</span>
        <nav className="flex-1 flex flex-col gap-0.5">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-rk-sm text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#EFF6FF] text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2.5 pt-4 pb-2">Cont</span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-rk-sm text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left w-full"
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Deconectare
        </button>
      </aside>

      {/* Main + Topbar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="min-h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-rk py-2 px-4 w-64 text-sm text-slate-400">
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Caută rapoarte...
          </div>
          <div className="flex items-center gap-3 [&>a]:inline-flex [&>a]:items-center [&>a]:min-h-[40px]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46]">
              <span className="w-2 h-2 rounded-full bg-rk-green" />
              Conectat
            </span>
            <Link
              href="/clients"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-rk-sm shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors leading-none"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Raport nou
            </Link>
            <Link
              href="/dashboard/profile"
              className="w-9 h-9 rounded-full bg-[#DBEAFE] text-blue-700 flex items-center justify-center text-sm font-bold border-2 border-white flex-shrink-0 hover:bg-[#BFDBFE] transition-colors"
              aria-label="Profil / Setări"
              title="Profil / Setări"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-7">{children}</main>
      </div>
    </div>
  );
}
