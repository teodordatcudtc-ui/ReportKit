import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-slate-800">ReportKit</span>
          <div className="flex gap-4">
            <Link
              href="/auth/signin"
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            Marketing reports for agencies, in minutes
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Connect Google Ads and Meta Ads for each client. Pick a date range. Get a branded PDF report—no spreadsheets, no copy-paste.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Start free trial
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">Add clients</h3>
            <p className="mt-2 text-sm text-slate-600">
              Create a client, connect their Google Ads and Meta Ads accounts once.
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">Choose dates</h3>
            <p className="mt-2 text-sm text-slate-600">
              Select the report period. We pull impressions, clicks, spend, conversions.
            </p>
          </div>
          <div className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">Download PDF</h3>
            <p className="mt-2 text-sm text-slate-600">
              Get a clean, branded PDF to send to your client or use in presentations.
            </p>
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-200 mt-24 py-8 text-center text-sm text-slate-500">
        ReportKit · MVP for marketing agencies
      </footer>
    </div>
  );
}
