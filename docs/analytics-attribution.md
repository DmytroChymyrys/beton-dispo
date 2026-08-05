# BétonDispo Acquisition Analytics

## Attribution Rules

BétonDispo stores attribution with each quote request so internal reporting does not depend on GA4.

First touch records how the visitor originally discovered the site. It is stored in `localStorage` for 90 days and is not overwritten by internal navigation. If `localStorage` is unavailable, the browser falls back to `sessionStorage`.

Last touch records the latest meaningful campaign or external referral in the current session. It updates only when the visitor arrives with `gclid`, `msclkid`, `fbclid`, UTM parameters, or an external referrer. Internal BétonDispo navigation is ignored.

Stored query parameters are limited to:

- `gclid`
- `msclkid`
- `fbclid`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

Arbitrary query parameters are not stored.

## Source Classification

The browser normalizes acquisition into source and medium:

- `gclid`: `google / cpc`
- `msclkid`: `bing / cpc`
- `fbclid`: `facebook / social`
- UTM traffic: source and medium come from UTM values
- Google organic referrer: `google / organic`
- Bing organic referrer: `bing / organic`
- Other external referrer: hostname / `referral`
- No campaign or external referrer: `direct / none`

Referrers are stored as hostnames, not full URLs.

## Landing Pages

The database keeps separate page fields:

- First-touch landing page
- Last-touch landing page
- Quote entry page
- Submission page

Paths are stored without protocol, hostname, fragments, or arbitrary query parameters.

## GCLID Limitations

A non-empty `gclid` means a Google Ads click was identified.

It does not reveal campaign, ad group, keyword, search term, or click cost by itself. Those require Google Ads reporting or the Google Ads API.

## Metric Definitions

- Quote requests: submitted quote forms stored in Postgres.
- Open leads: requests not marked won, lost, or invalid.
- Contacted leads: requests at `CONTACTED`, `QUALIFIED`, `QUOTING`, `OFFER_SENT`, `WON`, or `LOST`.
- Quoted: requests at `OFFER_SENT` or `WON`.
- Won: requests marked `WON`.
- Lost: requests marked `LOST` or `INVALID`.
- Win rate: won requests divided by total requests in the filtered range.
- First response time: `first_response_at - created_at`.
- First response timestamp: set once when an admin first moves a request into a contacted-or-later status.

## Revenue Fields

The schema supports nullable money fields:

- `estimated_job_value_cad`
- `final_job_value_cad`
- `betondispo_revenue_cad`

Money is stored as Postgres `numeric`, not floating point.

## Deployment Sequence

1. Run Drizzle migrations against production Neon.
2. Verify the new nullable columns and indexes exist.
3. Deploy the application code.
4. Submit a safe test quote.
5. Verify first-touch, last-touch, quote entry page, submission page, device category, browser language, and GCLID in the admin request detail.
6. Verify `/admin/analytics`.
7. Mark the test quote invalid or delete it manually if needed.

## Safe Test URL

```text
https://betondispo.ca/fr/calculateur-beton?utm_source=test&utm_medium=cpc&utm_campaign=analytics_test&utm_term=beton_test&gclid=test_gclid_123
```

Test flow:

1. Open the test URL.
2. Navigate to another internal page.
3. Submit a quote.
4. Confirm first touch remains the calculator page.
5. Confirm last touch contains the test campaign.
6. Confirm the admin analytics dashboard includes the quote.

## Future Offline Conversion Stages

Do not upload offline conversions yet. The schema is prepared for future reporting around:

- `quote_submit`
- `qualified_lead`
- `won_job`

Future Google Ads offline uploads should retain conversion timestamp, conversion name, conversion value, currency, and GCLID when present.

## Privacy Safeguards

Do not send these to GA4, Vercel Analytics, logs, or analytics exports:

- name
- email
- phone
- street address
- postal code
- free-form description
- internal notes
- raw IP
- precise geolocation

The internal analytics CSV excludes customer PII by default.
