'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agencyName, setAgencyName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/signin?callbackUrl=/onboarding');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    let cancelled = false;
    setCheckingExisting(true);
    fetch('/api/agencies')
      .then((r) => (r.ok ? r.json() : null))
      .then((agency) => {
        if (cancelled) return;
        if (agency?.id) {
          router.replace('/dashboard');
          return;
        }
        setCheckingExisting(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCheckingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.id) return;
    setError('');
    setLoading(true);
    const res = await fetch('/api/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agency_name: agencyName,
        primary_color: primaryColor,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Nu s-a putut crea agenția.');
      return;
    }
    router.push('/dashboard');
  }

  if (status === 'loading' || !session || checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-500">Se încarcă…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Configurează agenția</h1>
          <p className="mt-2 text-slate-600">Aproape gata. Spune-ne numele agenției și culoarea de brand.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
          )}
          <div>
            <label htmlFor="agency_name" className="block text-sm font-medium text-slate-700 mb-1">
              Nume agenție
            </label>
            <input
              id="agency_name"
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ex. Agenția Mea"
            />
          </div>
          <div>
            <label htmlFor="primary_color" className="block text-sm font-medium text-slate-700 mb-1">
              Culoare principală (pentru rapoarte)
            </label>
            <div className="flex gap-3 items-center">
              <input
                id="primary_color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Se salvează…' : 'Continuă la panou'}
          </button>
        </form>
      </div>
    </div>
  );
}
