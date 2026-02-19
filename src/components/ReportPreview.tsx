'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ReportPDF } from '@/lib/report-pdf';

const MOCK_CLIENT = 'Client demo';

const MOCK_GOOGLE = {
  impressions: 124500,
  clicks: 3420,
  cost: 2840.5,
  ctr: 2.75,
  conversions: 89,
  avg_cpc: 0.83,
};

const MOCK_META = {
  impressions: 89200,
  clicks: 2100,
  spend: 1650,
  ctr: 2.35,
  conversions: 42,
  cpc: 0.79,
};

function getMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

export interface ReportPreviewProps {
  agency_name: string;
  primary_color: string;
  logo_url: string | null;
  website_url: string;
  contact_email: string;
  contact_phone: string;
}

const DEBOUNCE_MS = 400;

export function ReportPreview(props: ReportPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  const generate = useCallback(async () => {
    const { start, end } = getMonthRange();
    setError(null);
    try {
      const blob = await pdf(
        <ReportPDF
          data={{ google: MOCK_GOOGLE, meta: MOCK_META }}
          agencyInfo={{
            agency_name: props.agency_name || 'Nume agentie',
            logo_url: props.logo_url || null,
            primary_color: props.primary_color || '#3B82F6',
            website_url: props.website_url || null,
            contact_email: props.contact_email || null,
            contact_phone: props.contact_phone || null,
          }}
          clientInfo={{ client_name: MOCK_CLIENT }}
          dateStart={start}
          dateEnd={end}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = url;
      setBlobUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la generare preview');
      setBlobUrl(null);
    } finally {
      setLoading(false);
    }
  }, [props.agency_name, props.primary_color, props.logo_url, props.website_url, props.contact_email, props.contact_phone]);

  useEffect(() => {
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      generate();
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [generate]);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-rk-lg shadow-rk overflow-hidden flex flex-col h-full min-h-[560px] xl:min-h-[calc(100vh-8rem)]">
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-800">Preview raport PDF</h3>
      </div>
      <div className="flex-1 min-h-[520px] xl:min-h-[calc(100vh-10rem)] relative bg-slate-100">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>
        )}
        {blobUrl && !error && (
          <iframe
            key={blobUrl}
            src={`${blobUrl}#toolbar=0&navpanes=0`}
            title="Preview raport PDF"
            className="w-full h-full min-h-[520px] xl:min-h-[calc(100vh-10rem)] border-0"
          />
        )}
      </div>
    </div>
  );
}
