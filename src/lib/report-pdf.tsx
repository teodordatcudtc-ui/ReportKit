import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#444',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '30%',
    minWidth: 100,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    fontSize: 9,
    color: '#64748b',
  },
});

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{String(value)}</Text>
    </View>
  );
}

export interface GoogleMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  ctr: number;
  conversions: number;
  avg_cpc: number;
}

export interface MetaMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  conversions: number;
  cpc: number;
}

export interface ReportPDFProps {
  data: {
    google?: GoogleMetrics;
    meta?: MetaMetrics;
  };
  agencyInfo: {
    agency_name: string;
    logo_url?: string | null;
    primary_color?: string;
    website_url?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
  };
  clientInfo: {
    client_name: string;
  };
  dateStart: string;
  dateEnd: string;
}

const defaultBrandColor = '#3B82F6';

export function ReportPDF({
  data,
  agencyInfo,
  clientInfo,
  dateStart,
  dateEnd,
}: ReportPDFProps) {
  const brandColor = agencyInfo.primary_color || defaultBrandColor;
  const headerStyle = [styles.header, { borderBottomColor: brandColor }];
  const footerLines: string[] = [];
  footerLines.push(`Pregătit de ${agencyInfo.agency_name}`);
  if (agencyInfo.website_url) footerLines.push(agencyInfo.website_url);
  if (agencyInfo.contact_email) footerLines.push(agencyInfo.contact_email);
  if (agencyInfo.contact_phone) footerLines.push(agencyInfo.contact_phone);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={headerStyle}>
          {agencyInfo.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop
            <Image src={agencyInfo.logo_url} style={styles.logo} />
          ) : null}
          <Text style={styles.title}>Raport performanță marketing</Text>
          <Text style={styles.subtitle}>Client: {clientInfo.client_name}</Text>
          <Text style={styles.date}>
            Perioadă: {dateStart} – {dateEnd}
          </Text>
        </View>

        {data.google ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performanță Google Ads</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label="Impresii" value={data.google.impressions.toLocaleString()} />
              <MetricCard label="Click-uri" value={data.google.clicks.toLocaleString()} />
              <MetricCard label="Cheltuieli" value={`$${data.google.cost.toFixed(2)}`} />
              <MetricCard label="CTR" value={`${data.google.ctr.toFixed(2)}%`} />
              <MetricCard label="Conversii" value={data.google.conversions.toLocaleString()} />
              <MetricCard label="CPC mediu" value={`$${data.google.avg_cpc.toFixed(2)}`} />
            </View>
          </View>
        ) : null}

        {data.meta ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performanță Meta Ads</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label="Impresii" value={data.meta.impressions.toLocaleString()} />
              <MetricCard label="Click-uri" value={data.meta.clicks.toLocaleString()} />
              <MetricCard label="Cheltuieli" value={`$${data.meta.spend.toFixed(2)}`} />
              <MetricCard label="CTR" value={`${data.meta.ctr.toFixed(2)}%`} />
              <MetricCard label="Conversii" value={data.meta.conversions.toLocaleString()} />
              <MetricCard label="CPC" value={`$${data.meta.cpc.toFixed(2)}`} />
            </View>
          </View>
        ) : null}

        {!data.google && !data.meta ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Nu există date din platforme de reclame pentru această perioadă.</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Generat la {new Date().toLocaleDateString('ro-RO')}</Text>
          {footerLines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
