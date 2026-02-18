import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/SessionProvider';

export const metadata: Metadata = {
  title: 'ReportKit – Marketing reports for agencies',
  description: 'Generate client reports from Google Ads & Meta Ads',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-white text-slate-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
