import type { Metadata } from 'next';
import { Instrument_Serif, DM_Sans } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/SessionProvider';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MetricLens – Rapoarte de marketing pentru agenții',
  description: 'Rapoarte pentru clienți din Google Ads & Meta Ads, generate automat.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="antialiased font-sans bg-white text-slate-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
