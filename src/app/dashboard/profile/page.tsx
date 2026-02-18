'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import { getPasswordIssues, PASSWORD_MIN_LENGTH } from '@/lib/security/password';

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  if (typeof data?.error === 'string') return data.error;
  return 'Cererea a eșuat.';
}

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const initialName = session?.user?.name ?? '';
  const initialEmail = session?.user?.email ?? '';

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [msg, setMsg] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const passwordIssues = useMemo(() => getPasswordIssues(newPassword), [newPassword]);

  async function saveName() {
    setErr('');
    setMsg('');
    setSavingName(true);
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setSavingName(false);
    if (!res.ok) {
      setErr(await readError(res));
      return;
    }
    const data = (await res.json().catch(() => null)) as { user?: { name?: string | null; email?: string } } | null;
    const u = data?.user;
    if (u?.name || u?.email) {
      await update({ user: { name: u.name ?? undefined, email: u.email } });
    }
    setMsg('Numele a fost salvat.');
  }

  async function saveEmail() {
    setErr('');
    setMsg('');
    setSavingEmail(true);
    const res = await fetch('/api/account/email', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword: currentPasswordForEmail }),
    });
    setSavingEmail(false);
    if (!res.ok) {
      setErr(await readError(res));
      return;
    }
    const data = (await res.json().catch(() => null)) as { user?: { name?: string | null; email?: string } } | null;
    const u = data?.user;
    if (u?.email) {
      await update({ user: { name: u.name ?? undefined, email: u.email } });
    }
    setCurrentPasswordForEmail('');
    setMsg('Email-ul a fost actualizat.');
  }

  async function savePassword() {
    setErr('');
    setMsg('');
    if (passwordIssues.length > 0) {
      setErr(`Parolă: ${passwordIssues[0]}`);
      return;
    }
    setSavingPassword(true);
    const res = await fetch('/api/account/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSavingPassword(false);
    if (!res.ok) {
      setErr(await readError(res));
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setMsg('Parola a fost schimbată.');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Setări profil</h1>
        <p className="text-sm text-slate-500 mt-1">Modifică nume, email și parola contului.</p>
      </div>

      {(err || msg) && (
        <div className={`text-sm p-3 rounded-lg border ${err ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          {err || msg}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Detalii cont</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="name">
              Nume
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Numele tău / agenția"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID utilizator
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-600">
              {session?.user?.id ?? '—'}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={saveName}
            disabled={savingName}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-rk-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {savingName ? 'Salvez…' : 'Salvează numele'}
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Schimbă email</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="tu@agentie.ro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="currentPasswordForEmail">
              Parola curentă
            </label>
            <input
              id="currentPasswordForEmail"
              type="password"
              value={currentPasswordForEmail}
              onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={saveEmail}
            disabled={savingEmail}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border-[1.5px] border-slate-200 rounded-rk-sm text-sm font-semibold text-slate-900 shadow-rk hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
          >
            {savingEmail ? 'Salvez…' : 'Salvează email-ul'}
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-rk-lg shadow-rk p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Schimbă parola</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="currentPassword">
              Parola curentă
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="newPassword">
              Parolă nouă
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2 text-xs text-slate-600 space-y-1">
              <div className="font-medium text-slate-700">Cerințe:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>minim {PASSWORD_MIN_LENGTH} caractere</li>
                <li>cel puțin o literă mare, una mică, o cifră și un simbol</li>
                <li>fără spații</li>
              </ul>
              {newPassword.length > 0 && passwordIssues.length > 0 && (
                <div className="text-red-600">Lipsește: {passwordIssues[0]}</div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={savePassword}
            disabled={savingPassword}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-rk-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {savingPassword ? 'Schimb…' : 'Schimbă parola'}
          </button>
        </div>
      </section>
    </div>
  );
}

