import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Line,
  Polyline,
} from '@react-pdf/renderer';

/** Elimina diacriticele din text ca sa apara corect in PDF (fontul nu afiseaza diacritice). */
function stripDiacritics(s: string): string {
  const map: Record<string, string> = {
    ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
    Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ț: 'T',
  };
  let out = s;
  for (const [d, r] of Object.entries(map)) out = out.split(d).join(r);
  return out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  logo: {
    width: 120,
    height: 40,
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
  chartBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 4,
  },
  chartBarFill: {
    height: 8,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  chartLabel: {
    fontSize: 8,
    width: 50,
    color: '#475569',
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
  quality_score?: number | null;
  impression_share?: number | null;
  search_impression_share?: number | null;
  top_of_page_rate?: number | null;
  conversion_value?: number | null;
  roas?: number | null;
  cpa?: number | null;
}

export interface MetaMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  conversions: number;
  cpc: number;
  reach?: number;
  frequency?: number;
  link_clicks?: number;
  cpm?: number;
  engagement_rate?: number;
  video_views?: number;
  video_p25?: number;
  video_p50?: number;
  video_p100?: number;
}

export interface DeviceRow {
  device: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
}

export interface GeographicRow {
  country: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
}

export interface DailyTrendRow {
  date: string;
  impressions: number;
  spend: number;
}

export interface ReportSettings {
  google?: Partial<Record<string, boolean>>;
  meta?: Partial<Record<string, boolean>>;
  charts?: Partial<Record<string, boolean>>;
}

export interface ReportPDFProps {
  data: {
    google?: GoogleMetrics;
    meta?: MetaMetrics;
  };
  reportSettings?: ReportSettings | null;
  googleDeviceBreakdown?: DeviceRow[];
  googleGeographicBreakdown?: GeographicRow[];
  dailyTrend?: DailyTrendRow[];
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

function showKey(settings: ReportSettings | null | undefined, platform: 'google' | 'meta' | 'charts', key: string): boolean {
  if (!settings) return true;
  const section = platform === 'google' ? settings.google : platform === 'meta' ? settings.meta : settings.charts;
  return section?.[key] !== false;
}

export function ReportPDF({
  data,
  reportSettings,
  googleDeviceBreakdown,
  googleGeographicBreakdown,
  dailyTrend,
  agencyInfo,
  clientInfo,
  dateStart,
  dateEnd,
}: ReportPDFProps) {
  const brandColor = agencyInfo.primary_color || defaultBrandColor;
  const headerStyle = [styles.header, { borderBottomColor: brandColor }];
  const footerLines: string[] = [];
  footerLines.push(stripDiacritics(`Pregatit de ${agencyInfo.agency_name}`));
  if (agencyInfo.website_url) footerLines.push(agencyInfo.website_url);
  if (agencyInfo.contact_email) footerLines.push(agencyInfo.contact_email);
  if (agencyInfo.contact_phone) footerLines.push(agencyInfo.contact_phone);

  const clientName = stripDiacritics(clientInfo.client_name);
  const generatedDate = stripDiacritics(new Date().toLocaleDateString('ro-RO'));

  const g = data.google;
  const m = data.meta;
  const showG = (k: string) => showKey(reportSettings, 'google', k);
  const showM = (k: string) => showKey(reportSettings, 'meta', k);
  const showC = (k: string) => showKey(reportSettings, 'charts', k);

  const maxDeviceImpr = googleDeviceBreakdown?.length
    ? Math.max(...googleDeviceBreakdown.map((d) => d.impressions), 1)
    : 1;
  const maxTrendSpend = dailyTrend?.length
    ? Math.max(...dailyTrend.map((d) => d.spend), 1)
    : 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={headerStyle}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{stripDiacritics('Raport performanta marketing')}</Text>
            <Text style={styles.subtitle}>Client: {clientName}</Text>
            <Text style={styles.date}>
              {stripDiacritics('Perioada')}: {dateStart} – {dateEnd}
            </Text>
          </View>
          {agencyInfo.logo_url ? (
            <View style={styles.headerRight}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- PDF Image has no alt prop */}
              <Image src={agencyInfo.logo_url} style={styles.logo} />
            </View>
          ) : null}
        </View>

        {g ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{stripDiacritics('Performanta Google Ads')}</Text>
            <View style={styles.metricsGrid}>
              {showG('impressions') && <MetricCard label="Impresii" value={g.impressions.toLocaleString()} />}
              {showG('clicks') && <MetricCard label="Click-uri" value={g.clicks.toLocaleString()} />}
              {showG('cost') && <MetricCard label="Cheltuieli" value={`$${g.cost.toFixed(2)}`} />}
              {showG('ctr') && <MetricCard label="CTR" value={`${g.ctr.toFixed(2)}%`} />}
              {showG('conversions') && <MetricCard label="Conversii" value={g.conversions.toLocaleString()} />}
              {showG('avg_cpc') && <MetricCard label="CPC mediu" value={`$${g.avg_cpc.toFixed(2)}`} />}
              {showG('quality_score') && (
                <MetricCard label="Quality Score" value={g.quality_score != null ? g.quality_score.toFixed(1) : '–'} />
              )}
              {showG('impression_share') && (
                <MetricCard label="Impression Share" value={g.impression_share != null ? `${(g.impression_share * 100).toFixed(1)}%` : '–'} />
              )}
              {showG('search_impression_share') && (
                <MetricCard label="Search Imp. Share" value={g.search_impression_share != null ? `${(g.search_impression_share * 100).toFixed(1)}%` : '–'} />
              )}
              {showG('top_of_page_rate') && (
                <MetricCard label="Top of page rate" value={g.top_of_page_rate != null ? `${(g.top_of_page_rate * 100).toFixed(1)}%` : '–'} />
              )}
              {showG('conversion_value') && (
                <MetricCard label="Valoare conversii" value={g.conversion_value != null ? `$${g.conversion_value.toFixed(2)}` : '–'} />
              )}
              {showG('roas') && (
                <MetricCard label="ROAS" value={g.roas != null ? g.roas.toFixed(2) : '–'} />
              )}
              {showG('cpa') && (
                <MetricCard label="CPA" value={g.cpa != null ? `$${g.cpa.toFixed(2)}` : '–'} />
              )}
            </View>
            {showC('device_breakdown') && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 6 }]}>
                  {stripDiacritics('Performanta pe device')}
                </Text>
                {googleDeviceBreakdown && googleDeviceBreakdown.length > 0 ? (
                  googleDeviceBreakdown.slice(0, 5).map((row) => (
                    <View key={row.device} style={styles.chartRow}>
                      <Text style={styles.chartLabel}>{row.device}</Text>
                      <View style={[styles.chartBar, { flex: 1 }]}>
                        <View
                          style={[
                            styles.chartBarFill,
                            {
                              width: `${Math.round((row.impressions / maxDeviceImpr) * 100)}%`,
                              backgroundColor: brandColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={{ fontSize: 8 }}>{row.impressions.toLocaleString()}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 9, color: '#64748b' }}>{stripDiacritics('Nu exista date pe device pentru aceasta perioada.')}</Text>
                )}
              </View>
            )}
            {showG('geographic_performance') && (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 6 }]}>
                  {stripDiacritics('Top geografic')}
                </Text>
                {googleGeographicBreakdown && googleGeographicBreakdown.length > 0 ? (
                  googleGeographicBreakdown.slice(0, 5).map((row) => (
                    <View key={row.country} style={styles.chartRow}>
                      <Text style={styles.chartLabel}>{row.country}</Text>
                      <Text style={{ fontSize: 8 }}>{row.impressions.toLocaleString()} impresii</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ fontSize: 9, color: '#64748b' }}>{stripDiacritics('Nu exista date geografice pentru aceasta perioada.')}</Text>
                )}
              </View>
            )}
          </View>
        ) : null}

        {m ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{stripDiacritics('Performanta Meta Ads')}</Text>
            <View style={styles.metricsGrid}>
              {showM('impressions') && <MetricCard label="Impresii" value={m.impressions.toLocaleString()} />}
              {showM('clicks') && <MetricCard label="Click-uri" value={m.clicks.toLocaleString()} />}
              {showM('spend') && <MetricCard label="Cheltuieli" value={`$${m.spend.toFixed(2)}`} />}
              {showM('ctr') && <MetricCard label="CTR" value={`${m.ctr.toFixed(2)}%`} />}
              {showM('conversions') && <MetricCard label="Conversii" value={m.conversions.toLocaleString()} />}
              {showM('cpc') && <MetricCard label="CPC" value={`$${m.cpc.toFixed(2)}`} />}
              {showM('reach') && <MetricCard label="Reach" value={m.reach != null ? m.reach.toLocaleString() : '–'} />}
              {showM('frequency') && <MetricCard label="Frecventa" value={m.frequency != null ? m.frequency.toFixed(2) : '–'} />}
              {showM('link_clicks') && <MetricCard label="Link clicks" value={m.link_clicks != null ? m.link_clicks.toLocaleString() : '–'} />}
              {showM('cpm') && <MetricCard label="CPM" value={m.cpm != null ? `$${m.cpm.toFixed(2)}` : '–'} />}
              {showM('engagement_rate') && <MetricCard label="Engagement rate" value={m.engagement_rate != null ? `${m.engagement_rate.toFixed(2)}%` : '–'} />}
              {showM('video_views') && <MetricCard label="Vizionari video" value={m.video_views != null ? m.video_views.toLocaleString() : '–'} />}
              {showM('video_p25') && <MetricCard label="Video 25%" value={m.video_p25 != null ? m.video_p25.toLocaleString() : '–'} />}
              {showM('video_p50') && <MetricCard label="Video 50%" value={m.video_p50 != null ? m.video_p50.toLocaleString() : '–'} />}
              {showM('video_p100') && <MetricCard label="Video 100%" value={m.video_p100 != null ? m.video_p100.toLocaleString() : '–'} />}
            </View>
          </View>
        ) : null}

        {showC('performance_trend') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{stripDiacritics('Evolutie cheltuieli (pe zi)')}</Text>
            {dailyTrend && dailyTrend.length > 0 ? (
              (() => {
                const slice = dailyTrend.slice(-14);
                const n = slice.length;
                const maxVal = maxTrendSpend;
                const maxRound = Math.max(50, Math.ceil(maxVal / 50) * 50);
                const chartLeft = 36;
                const chartBottom = 78;
                const chartWidth = 358;
                const chartHeight = 68;
                const xStep = n > 1 ? chartWidth / (n - 1) : 0;
                const polyPoints = slice
                  .map((row, i) => {
                    const x = chartLeft + (n > 1 ? i * xStep : chartWidth / 2);
                    const y = chartBottom - (row.spend / maxRound) * chartHeight;
                    return `${x},${y}`;
                  })
                  .join(' ');
                const yTicks = [maxRound, Math.round(maxRound / 2), 0];
                return (
                  <>
                    <View style={{ flexDirection: 'row', marginBottom: 2, alignItems: 'stretch' }}>
                      <View style={{ width: 28, justifyContent: 'space-between', paddingVertical: 2 }}>
                        {yTicks.map((t) => (
                          <Text key={t} style={{ fontSize: 7, color: '#64748b' }}>
                            ${t}
                          </Text>
                        ))}
                      </View>
                      <Svg width="100%" height={100} viewBox="0 0 400 90" preserveAspectRatio="xMidYMid meet">
                        <Line x1={chartLeft} y1={10} x2={chartLeft} y2={chartBottom} stroke="#94a3b8" strokeWidth={1} />
                        <Line x1={chartLeft} y1={chartBottom} x2={chartLeft + chartWidth} y2={chartBottom} stroke="#94a3b8" strokeWidth={1} />
                        <Polyline points={polyPoints} stroke={brandColor} strokeWidth={2} fill="none" />
                      </Svg>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 0, paddingLeft: 28 }}>
                      {slice.map((row) => {
                        const dayOnly = row.date.slice(-2);
                        return (
                          <View key={row.date} style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, color: '#475569' }}>{dayOnly}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 2, paddingLeft: 28 }}>
                      {slice.map((row) => (
                        <View key={`v-${row.date}`} style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={{ fontSize: 7, color: '#64748b' }}>${row.spend.toFixed(0)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                );
              })()
            ) : (
              <Text style={{ fontSize: 9, color: '#64748b' }}>{stripDiacritics('Nu exista date zilnice pentru aceasta perioada.')}</Text>
            )}
          </View>
        )}

        {!g && !m ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              {stripDiacritics('Nu exista date din platforme de reclame pentru aceasta perioada.')}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>{stripDiacritics('Generat la')} {generatedDate}</Text>
          {footerLines.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
