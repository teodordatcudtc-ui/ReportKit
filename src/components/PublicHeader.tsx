'use client';

import Link from 'next/link';
import { useState } from 'react';
function MenuIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function SignupIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#functionalitati', label: 'Funcționalități' },
    { href: '/#preturi', label: 'Prețuri' },
    { href: '/#contact', label: 'Contact' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-20 flex items-center justify-between px-4 md:px-10">
        <Link href="/" className="flex items-center flex-shrink-0 text-xl font-bold text-slate-900" aria-label="MetricLens">
          MetricLens
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium text-slate-600 px-4 py-2 rounded-rk-sm hover:text-slate-900 hover:bg-slate-100 transition-colors leading-none"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Dreapta: pe mobil iconițe + hamburger, pe desktop butoane text */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Link
            href="/auth/signin"
            className="md:flex hidden items-center justify-center h-11 text-[14px] font-semibold text-blue-700 px-4 rounded-rk-sm hover:bg-blue-700/10 transition-colors"
          >
            Autentificare
          </Link>
          <Link
            href="/auth/signup"
            className="md:inline-flex hidden items-center justify-center h-11 px-5 bg-blue-700 text-white text-[14px] font-semibold rounded-rk-sm shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors"
          >
            Încearcă gratuit
          </Link>
          {/* Mobil: doar iconițe */}
          <Link
            href="/auth/signin"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-rk-sm text-blue-700 hover:bg-blue-700/10 transition-colors"
            aria-label="Autentificare"
          >
            <LoginIcon />
          </Link>
          <Link
            href="/auth/signup"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-rk-sm bg-blue-700 text-white shadow-[0_1px_2px_rgba(30,64,175,.2)] hover:bg-blue-500 transition-colors"
            aria-label="Încearcă gratuit"
          >
            <SignupIcon />
          </Link>
          {/* Hamburger – doar mobil */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-rk-sm text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={menuOpen ? 'Închide meniul' : 'Deschide meniul'}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {/* Meniu mobil (overlay) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div
        className={`fixed top-20 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-rk-lg md:hidden transition-all duration-200 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col py-4 px-4">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium text-slate-700 py-3 px-4 rounded-rk-sm hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-slate-200 mt-2 pt-4 flex flex-col gap-2">
            <Link
              href="/auth/signin"
              onClick={() => setMenuOpen(false)}
              className="text-[15px] font-semibold text-blue-700 py-3 px-4 rounded-rk-sm hover:bg-blue-700/10 text-center"
            >
              Autentificare
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => setMenuOpen(false)}
              className="text-[15px] font-semibold text-white bg-blue-700 py-3 px-4 rounded-rk-sm hover:bg-blue-500 text-center"
            >
              Încearcă gratuit
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
