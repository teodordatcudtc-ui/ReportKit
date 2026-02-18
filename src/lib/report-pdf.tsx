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
  };
  clientInfo: {
    client_name: string;
  };
  dateStart: string;
  dateEnd: string;
}

export function ReportPDF({
  data,
  agencyInfo,
  clientInfo,
  dateStart,
  dateEnd,
}: ReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {agencyInfo.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop
            <Image src={agencyInfo.logo_url} style={styles.logo} />
          ) : null}
          <Text style={styles.title}>Marketing Performance Report</Text>
          <Text style={styles.subtitle}>Client: {clientInfo.client_name}</Text>
          <Text style={styles.date}>
            Period: {dateStart} to {dateEnd}
          </Text>
        </View>

        {data.google ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google Ads Performance</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label="Impressions" value={data.google.impressions.toLocaleString()} />
              <MetricCard label="Clicks" value={data.google.clicks.toLocaleString()} />
              <MetricCard label="Spend" value={`$${data.google.cost.toFixed(2)}`} />
              <MetricCard label="CTR" value={`${data.google.ctr.toFixed(2)}%`} />
              <MetricCard label="Conversions" value={data.google.conversions.toLocaleString()} />
              <MetricCard label="Avg CPC" value={`$${data.google.avg_cpc.toFixed(2)}`} />
            </View>
          </View>
        ) : null}

        {data.meta ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta Ads Performance</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label="Impressions" value={data.meta.impressions.toLocaleString()} />
              <MetricCard label="Clicks" value={data.meta.clicks.toLocaleString()} />
              <MetricCard label="Spend" value={`$${data.meta.spend.toFixed(2)}`} />
              <MetricCard label="CTR" value={`${data.meta.ctr.toFixed(2)}%`} />
              <MetricCard label="Conversions" value={data.meta.conversions.toLocaleString()} />
              <MetricCard label="CPC" value={`$${data.meta.cpc.toFixed(2)}`} />
            </View>
          </View>
        ) : null}

        {!data.google && !data.meta ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>No ad platform data for this period.</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
          <Text>Prepared by {agencyInfo.agency_name}</Text>
        </View>
      </Page>
    </Document>
  );
}
