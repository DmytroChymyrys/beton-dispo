# Google Ads And Supplier Analytics

## Deployment Order

1. Deploy the code with `GOOGLE_ADS_OFFLINE_UPLOAD_MODE=disabled` or `dry_run`.
2. Run `npm run db:migrate` against production Neon.
3. Add Google Ads read-only API credentials in Vercel.
4. Open `/admin/integrations/google-ads` and test the connection.
5. Run a 7-day reporting sync and verify `/admin/analytics` shows spend/clicks.
6. Create two Google Ads conversion actions manually:
   - `BétonDispo Qualified Lead`
   - `BétonDispo Won Job`
7. Keep both offline actions Secondary until the data is validated.
8. Set the two conversion action IDs in Vercel.
9. Use `dry_run` to queue and validate conversions.
10. Switch to `enabled` only after dry-run rows look correct.

## Required Environment Variables

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID` optional, only when using a manager account
- `GOOGLE_ADS_QUALIFIED_LEAD_ACTION_ID`
- `GOOGLE_ADS_WON_JOB_ACTION_ID`
- `GOOGLE_ADS_OFFLINE_UPLOAD_MODE=disabled|dry_run|enabled`
- `GOOGLE_ADS_API_VERSION`, optional, defaults to `v25`
- `GOOGLE_ADS_QUALIFIED_LEAD_VALUE_CAD`, optional, defaults to `25.00`
- `GOOGLE_ADS_WON_JOB_FIXED_VALUE_CAD`, optional, defaults to `100.00`
- `ADMIN_CRON_SECRET`, required for the cron sync endpoint

## Notes

- GA4 `quote_submit` remains the website form conversion.
- Offline conversions are deeper CRM outcomes: `QUALIFIED_LEAD` and `WON_JOB`.
- Google Ads spend is stored in Postgres and powers the admin ROI dashboard.
- A stored GCLID proves Google Ads click attribution, but it does not expose campaign or keyword by itself.
- Campaign spend and Google-reported conversions are shown separately from internal CRM conversions.
- Supplier analytics are based on `supplier_assignments`; pending assignments are not counted as losses.
