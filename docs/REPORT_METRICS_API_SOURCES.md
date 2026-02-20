# Sursa metricilor din raport (API-uri reale)

Toate câmpurile din raportul PDF sunt preluate din **Google Ads API** și **Meta Marketing API (Insights)**. Nicio metrică nu este inventată.

---

## Google Ads API

- **Endpoint:** `https://googleads.googleapis.com/v16/customers/{id}/googleAds:search` (GAQL)
- **Documentație:** https://developers.google.com/google-ads/api/fields

| Câmp în raport        | Sursa în API | Notă |
|-----------------------|--------------|------|
| Impresii              | `metrics.impressions` (campaign) | Agregat pe toate campaniile |
| Click-uri              | `metrics.clicks` (campaign) | |
| Cheltuieli             | `metrics.cost_micros` (campaign) | Împărțit la 1_000_000 pentru sumă în unități |
| CTR                    | `metrics.ctr` (campaign) | |
| Conversii              | `metrics.conversions` (campaign) | |
| CPC mediu              | `metrics.average_cpc` (campaign) | |
| Quality Score         | `ad_group_criterion.quality_info.quality_score` din **keyword_view** | Doar pentru KEYWORD; medie pe toate cuvintele cheie |
| Impression Share      | `metrics.search_impression_share` (campaign) | La campaign nu există „impression_share” generic; folosim Search impression share |
| Search Impression Share | `metrics.search_impression_share` (campaign) | |
| Top of page rate      | `metrics.search_top_impression_share` (campaign) | |
| Valoare conversii     | `metrics.conversions_value` (campaign) | Suma valorilor conversiilor |
| ROAS                  | Calculat: `conversions_value / cost` | Return on Ad Spend |
| CPA                   | Calculat: `cost / conversions` | Cost per conversie |
| Performanță pe device | `segments.device` + metrics (campaign) | MOBILE, DESKTOP, TABLET etc. |
| Performanță geografică | `segments.geoTargetCountry` (campaign) | Agregat pe țară |

---

## Meta Marketing API (Insights)

- **Endpoint:** `https://graph.facebook.com/v21.0/{ad_account_id}/insights`
- **Documentație:** https://developers.facebook.com/docs/marketing-api/insights

| Câmp în raport    | Sursa în API | Notă |
|-------------------|--------------|------|
| Impresii          | `impressions` | |
| Click-uri         | `clicks` | |
| Cheltuieli        | `spend` | |
| CTR               | `ctr` | |
| Conversii         | `actions` unde `action_type` ∈ purchase, lead, omni_purchase | Suma valorilor |
| CPC               | `cpc` | |
| Reach             | `reach` | Persoane unice (limitări pentru date > 13 luni) |
| Frecvență         | `frequency` | |
| Link clicks       | `actions` unde `action_type` = `link_click` | |
| CPM               | `cpm` | Cost per 1000 impresii |
| Engagement rate   | Calculat: (post_engagement + video_view) / impressions × 100 | `actions`: post_engagement, video_view |
| Vizionări video   | `actions` unde `action_type` ∈ video_view, video_view_3s, video_view_15s | Suma valorilor |
| Video 25%         | `actions` unde `action_type` = video_p25_watched_actions | |
| Video 50%         | `actions` unde `action_type` = video_p50_watched_actions | |
| Video 100%        | `actions` unde `action_type` = video_p100_watched_actions | |

---

## Grafice în raport

- **Performanță pe device:** date din Google Ads (segments.device + metrics), afișate ca bare.
- **Evoluție cheltuieli (pe zi):** date zilnice din Google Ads și Meta, combinate pe dată; afișate ca **line chart** (polyline) + listă date/cheltuieli.
