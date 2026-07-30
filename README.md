# BétonDispo

Bilingual (FR/EN) lead-generation website for **BétonDispo**, a centralized
concrete request service for Greater Montréal and the South Shore.

- Production: `betondispo.ca` (canonical)
- Alias: `betondispo.com` → redirects to `betondispo.ca`, preserving the path

---

## 1. What this is (and isn't)

Phase 1 exists to answer one business question:

> Can BétonDispo consistently generate qualified demand for concrete delivery
> and pumping in Greater Montréal?

So the site does exactly four things:

1. Presents BétonDispo as a single point of contact, in French first.
2. Collects detailed concrete requests through one form.
3. Stores every request with its acquisition source.
4. Lets an internal operator work those requests by hand.

**It is not** a marketplace, a supplier directory, a bidding platform, or a
comparison-shopping site. There are no payments, no customer accounts, no
supplier portal, and no automated quoting. Those belong to later phases.

### Two product constraints that are not negotiable

- **No fleet-ownership claims.** BétonDispo does not own concrete plants,
  trucks, volumetric mixers or pumps. Copy must use centralized-service
  language ("Nous vérifions la disponibilité", "On s’en occupe"), never
  ownership language ("nos camions", "notre flotte"). The structured data in
  `src/lib/structured-data.ts` publishes `Organization`, deliberately **not**
  `LocalBusiness`, because there is no publicly representable address.
- **No supplier names on the public site.** Supplier identity is disclosed at
  the booking stage, off-site.

---

## 2. Architecture

One Next.js application contains both the frontend and all server-side code.
There is no separate backend service.

| Layer      | Choice                                                 |
| ---------- | ------------------------------------------------------ |
| Framework  | Next.js 16 (App Router, React 19, Server Components)   |
| Language   | TypeScript (strict, `noUncheckedIndexedAccess`)        |
| Styling    | Tailwind CSS v4 (tokens in `src/app/globals.css`)      |
| Database   | Neon Postgres via the Vercel Marketplace               |
| ORM        | Drizzle ORM + drizzle-kit                              |
| Validation | Zod (shared between browser and server)                |
| Email      | Resend                                                 |
| Analytics  | Google Analytics 4 + Vercel Analytics + Speed Insights |
| Hosting    | Vercel                                                 |
| Tests      | Vitest (unit) + Playwright (E2E)                       |

### Directory map

```
src/
  app/
    layout.tsx              Pass-through root layout (no <html>)
    [locale]/               Every public page; renders <html lang>
      layout.tsx            Header, footer, sticky CTA, JSON-LD, analytics
      page.tsx              Home
      soumission/           FR quote form      EN counterpart: quote/
      comment-ca-marche/    FR how it works    EN counterpart: how-it-works/
      services/  faq/       Same slug in both locales
      politique-confidentialite/  conditions/  EN: privacy/  terms/
      opengraph-image.tsx   Generated social card, per locale
    admin/                  Internal operator UI (French, noindex)
    actions/submit-quote.ts Server action for the public form
    sitemap.ts  robots.ts
  components/               Presentational components
    quote/                  Multi-step form + field primitives
    pages/                  One component per page, locale-agnostic
  db/                       Drizzle schema, client, migrate + seed scripts
  i18n/                     Locale config, route registry, dictionaries
  lib/                      Validation, options, analytics, attribution, SEO
  messages/{fr,en}.json     All UI copy
  server/                   Server-only: auth, queries, notifications
  proxy.ts                  Locale detection + canonical host redirect
drizzle/                    Generated SQL migrations (committed)
tests/unit/                 Vitest
tests/e2e/                  Playwright
```

### Why the routing looks the way it does

Localized slugs are real directories (`/[locale]/soumission`,
`/[locale]/quote`), not rewrites. Each one guards its locale via
`requireLocale()` and returns 404 for the other, so `/en/soumission` can never
serve French content at an English URL and create duplicate content. All slugs
are registered in `src/i18n/routes.ts`, which is the single source used by the
language switcher, the sitemap and the hreflang tags.

`src/app/layout.tsx` deliberately renders only `{children}`: `<html lang>`
depends on the locale segment, so `[locale]/layout.tsx` and `admin/layout.tsx`
each render their own document shell.

---

## 3. Local setup

Requires Node 20+ (developed on 24) and a Postgres to talk to.

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run db:migrate
npm run db:seed                # optional: three sample requests
npm run dev                    # http://localhost:3987
```

The dev server runs on **port 3987**.

### Database for local development

Two options, both supported by `src/db/client.ts`:

- **Neon (recommended, matches production).** Copy the _pooled_ connection
  string from the Neon dashboard into `DATABASE_URL`. The app uses the Neon
  HTTP driver.
- **A local Postgres.** Point `DATABASE_URL` at
  `postgresql://postgres@localhost:5432/betondispo`. A `localhost` host makes
  the client switch to `node-postgres` automatically — this is what lets the
  E2E suite run without a cloud database. Only the query surface both drivers
  share (select/insert/update/delete, no transactions) is used.

---

## 4. Environment variables

Full list with comments in [`.env.example`](.env.example).

| Variable                        | Required | Purpose                                                                   |
| ------------------------------- | -------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | yes      | Canonical origin. Drives canonicals, hreflang, sitemap, admin email links |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | no       | GA4 measurement ID, e.g. `G-NHG2ZL55KG`                                   |
| `DATABASE_URL`                  | yes      | Neon pooled connection string. Injected by the Vercel integration         |
| `DATABASE_URL_UNPOOLED`         | no       | Direct connection for migrations; falls back to `DATABASE_URL`            |
| `RESEND_API_KEY`                | no\*     | Transactional email                                                       |
| `QUOTE_NOTIFICATION_FROM`       | no\*     | Verified sender, e.g. `BétonDispo <notifications@betondispo.com>`         |
| `QUOTE_NOTIFICATION_EMAIL`      | no\*     | Internal recipient(s), comma-separated                                    |
| `ADMIN_EMAIL`                   | yes      | Operator sign-in                                                          |
| `ADMIN_PASSWORD`                | yes      | Operator sign-in. Use a long random value                                 |
| `AUTH_SECRET`                   | yes      | Signs the admin session cookie. `openssl rand -base64 32`                 |

\* Without these three the site still accepts and stores requests; it just logs
a warning instead of emailing. That is intentional — see §7.

Never commit `.env.local`. `.gitignore` covers every `.env*` variant except the
tracked `.env.example`.

---

## 5. Database

### Schema

One table, `quote_requests` (`src/db/schema.ts`). Notable decisions:

- **Primary key is a UUID.** The sequential number is never the security
  identifier.
- **`public_id` is a stored generated column** —
  `'BD-' || lpad(reference_number::text, 6, '0')` — fed by a Postgres sequence.
  Postgres, not the application, guarantees the format and uniqueness under
  concurrent inserts, and the column is `GENERATED ALWAYS`, so a client cannot
  supply its own.
- **Enum values are locale-independent codes** defined once in
  `src/lib/quote-options.ts` and consumed by the Postgres enums, the Zod schema
  and the form UI. An option cannot exist in one layer and not another. Labels
  live in the dictionaries.
- **Internal fields** (`status`, `internal_notes`, `lost_reason`) are never
  selected into anything the public site renders.

### Migrations

```bash
npm run db:generate     # after editing src/db/schema.ts — writes drizzle/*.sql
npm run db:migrate      # apply pending migrations
npm run db:studio       # browse data
npm run db:seed         # development seed data (refuses to run in production)
```

Generated SQL is committed. `db:generate` works offline; `db:migrate`,
`db:push` and `db:studio` need a reachable database.

On Vercel, run `npm run db:migrate` from your machine (or a deploy hook)
against the production database after a schema change. It is not wired into the
build, so a bad migration can't take the site down mid-deploy.

---

## 6. Translations

All UI copy lives in `src/messages/fr.json` and `src/messages/en.json`. No
bilingual strings are hardcoded in components.

French is the canonical shape: `Dictionary = typeof fr`, and `en.json` is
checked against it at compile time, so a missing or renamed English key is a
type error rather than a blank string in production.

French copy uses typographic apostrophes (`’`), not `'`.

### Adding a locale

1. Add it to `locales`, `localeTags` and `localeLabels` in `src/i18n/config.ts`.
2. Add `src/messages/<locale>.json` (start from `fr.json`; TypeScript will list
   what's missing).
3. Add a slug per route in `src/i18n/routes.ts`.
4. Create `src/app/[locale]/<slug>/page.tsx` for each localized slug, guarded
   with `requireLocale()` and rendering the shared page component from
   `src/components/pages/`.

The sitemap, hreflang tags and language switcher pick it up automatically.

### Adding per-city landing pages later

`locationSegment` in `src/i18n/routes.ts` already reserves
`/fr/livraison-beton/<city>` and `/en/concrete-delivery/<city>`, and
`switchLocalePath` already maps between them. To ship them, add
`src/app/[locale]/livraison-beton/[city]/page.tsx` (plus the English
counterpart) and extend `src/app/sitemap.ts`.

Do **not** mass-generate thin city pages. Phase 1 ships high-quality core pages;
each location page should earn its place with real, specific content.

---

## 7. Quote submission pipeline

`src/app/actions/submit-quote.ts` runs in this order, and the order matters:

1. **Validate** the whole payload with `quoteSubmission` (Zod). Client-side
   validation is for fast feedback only and is never trusted.
2. **Reject spam.** A filled honeypot (`websiteUrl`) returns a generic error and
   stores nothing.
3. **Rate limit** — five submissions per IP per ten minutes. In-memory and
   therefore per-instance; it blunts casual spam without a CAPTCHA. Move to a
   shared store only if spam becomes real.
4. **Persist** to Postgres. This is the source of truth.
5. **Notify** by email, best-effort.

**A notification failure never fails the submission.** Once the row is in
Postgres the request is a success from the customer's point of view; email
problems are logged and the lead is still visible in the admin.

Server-side normalization: emails are lowercased, phone numbers stored as
`450-555-0142`, postal codes as `J4W 2K3`, and volumes as `numeric(7,2)` with
comma decimals accepted (French keyboards).

---

## 8. Analytics

Google Analytics 4, Vercel Analytics and Speed Insights are mounted in
`src/app/[locale]/layout.tsx`. Enable Vercel Analytics and Speed Insights in
the Vercel project settings; no key is needed for those.

For GA4, set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel Production. The current
BétonDispo web stream uses `G-NHG2ZL55KG`.

Funnel events (`src/lib/analytics.ts`):

| Event                  | Fired when                       |
| ---------------------- | -------------------------------- |
| `quote_form_started`   | First interaction with any field |
| `quote_step_completed` | A step validates and advances    |
| `quote_submitted`      | Request stored successfully      |
| `quote_submit_failed`  | Submission rejected              |

**No personally identifying information is ever sent to analytics.** The
allowed property set is typed (`QuoteEventProps`) and contains only
low-cardinality categories plus coarse buckets — never name, phone, email,
street address, or an exact volume.

UTM parameters, referrer and landing page are captured **first-touch** per
session (`src/lib/attribution.ts`) and stored on the request row, so a visitor
who arrives on an ad, reads the FAQ, then converts is still attributed
correctly.

### The metric that matters

The Phase-1 KPI is **qualified quote requests** — not visits, page views or
time on site. The admin dashboard leads with request counts over rolling 7- and
30-day windows for exactly this reason.

---

## 9. Email

Resend, configured through `RESEND_API_KEY`, `QUOTE_NOTIFICATION_FROM` and
`QUOTE_NOTIFICATION_EMAIL`. The sending domain must be verified in Resend.

The notification is written in **French** — the recipient is the internal
Québec operator, not the customer — and includes the customer's own language as
a field so the operator knows how to reply. Subject line:

```
Nouvelle demande BétonDispo — Brossard — 6 m³
```

It carries the reference, contact details, city, project, quantity, desired
date, pump requirement, notes, acquisition source, and a direct link to the
request in the admin. `Reply-To` is set to the customer.

---

## 10. Admin

Route: **`/admin`** — not linked from anywhere public, `noindex`, `no-store`,
and excluded from `robots.txt`.

- Dashboard: requests in the last 7/30 days, qualified count, conversion to
  WON, contractor vs homeowner split, top cities, latest requests.
- List: filter by status, city, customer type, desired-date range and
  creation-date range; sort by received date, city, desired date or status.
  Filters live in the URL, so a filtered view is shareable and survives reload.
- Detail: every field, plus the operator panel — change status, add internal
  notes, mark won, mark lost with a reason.

### Authentication

One shared operator account: `ADMIN_EMAIL` + `ADMIN_PASSWORD`, with an
HMAC-signed httpOnly session cookie (8 hours) signed with `AUTH_SECRET`.
Credentials are compared in constant time and a failed sign-in never reveals
which half was wrong.

The layout is **not** the guard — `/admin/login` lives under it. Every page and
**every server action** calls `requireAdmin()`, because a server action is its
own HTTP entry point and a layout check would not stop a crafted request.

Replace `src/server/auth.ts` wholesale when the team needs individual accounts.

---

## 11. Images and icons

Every asset is committed to the repository and served from the site's own
origin. **Nothing is loaded from a CDN or any third-party host** — no external
request on page load, and no dependency that can disappear or start charging.

- **Site imagery** lives in `public/images/`, registered in
  `src/lib/images.ts` and rendered by `<Photo>`. What ships is original vector
  artwork (2–4 KB each), not photography: licensed to nobody, no competitor
  branding, and generic enough that it cannot imply BétonDispo owns a fleet.
  Replacing a slot with a licensed photograph is a one-line change — see
  [`public/images/README.md`](public/images/README.md) for the slot list, the
  visual language, and the rules.
- **Favicons** are generated from `src/app/icon.svg` — the brand "B" split the
  way the wordmark is, white over safety orange. Next.js file conventions emit
  the link tags automatically: `icon.svg` (modern browsers), `icon.png` (192px),
  `favicon.ico` (48px, what Google Search uses), and `apple-icon.png` (180px).
  To change the mark, edit `icon.svg` and re-export the three raster files at
  those sizes.
- **Social cards** are generated per locale at build time by
  `src/app/[locale]/opengraph-image.tsx` — typographic, so no image asset can
  imply equipment ownership either.

`src/proxy.ts` skips any path whose last segment has a file extension, so
static assets are never locale-prefixed into a 404.

---

## 12. Testing

```bash
npm test           # Vitest — validation, locale routing, rate limiting,
                   # analytics buckets, notification rendering, request IDs
npm run test:e2e   # Playwright — desktop + mobile
```

E2E covers the flow the business depends on: home page → quote form → valid
submission → confirmation screen, in both languages, plus locale detection, the
language switcher across all pages, hreflang/canonical correctness, and that
the admin is unreachable when signed out.

Playwright starts `next dev` on port 3987 itself. Point `E2E_BASE_URL` at a
preview deployment to run against that instead. The submission tests write real
rows, so `DATABASE_URL` must be reachable.

The request-ID tests need a **local** Postgres (`public_id` is generated by the
database, so it can only be verified against one) and skip themselves
automatically when `DATABASE_URL` isn't local.

```bash
npm run typecheck
npm run lint
npm run format
npm run audit      # runtime dependencies only; the dev toolchain is excluded
```

---

## 13. Deployment

GitHub → Vercel. Preview deployment per branch/PR, production from `main`.

### First-time setup

1. Import the repository into Vercel. The framework preset is Next.js; no build
   overrides are needed (`vercel.json` pins the region to `iad1`).
2. **Add the Neon integration** from the Vercel Marketplace and connect it to
   the project. It injects `DATABASE_URL` (and the unpooled variant)
   automatically for every environment.
3. Add the remaining environment variables from §4 to Production and Preview.
   Set `NEXT_PUBLIC_SITE_URL` to `https://betondispo.ca` in Production.
4. Run `npm run db:migrate` against the production database.
5. Enable Analytics and Speed Insights in the project settings.

### Domains

Add both domains in Vercel:

- `betondispo.ca` — **set as the primary domain**
- `betondispo.com` — add it and let Vercel serve it as a secondary domain

`src/proxy.ts` issues a 308 to the canonical `.ca` host, preserving path and
query:

```
betondispo.com/fr/soumission  →  betondispo.ca/fr/soumission
betondispo.com/en/quote       →  betondispo.ca/en/quote
```

The redirect is skipped on `localhost` and on `*.vercel.app`, so previews keep
working. HTTPS and HSTS are on by default (`next.config.ts` sets the security
headers).

### robots.txt

`src/app/robots.ts` allows crawling **only** for the canonical
`https://betondispo.ca` host. Previews and local runs return `Disallow: /`, so
a preview deployment can never be indexed.

---

## 14. Privacy

The site operates in Québec and is built accordingly:

- Only information genuinely needed to process a request is collected.
- Consent is an explicit, required checkbox. Nobody is subscribed to marketing
  by default; a marketing opt-in, if ever added, must be a separate checkbox.
- No advertising or retargeting cookies.
- Customer personal details are never written to logs — error logs carry the
  city, project type and reference only.
- Database and email operations live in `server-only` modules, so lead data
  cannot leak into a client bundle.

`src/messages/*.json` holds the privacy policy and terms. They are written to
match what the application actually does; **have them reviewed by counsel
before launch**, and point the contact addresses (`privacy@betondispo.com`,
`info@betondispo.com`) at real, monitored mailboxes.

---

## 15. Deliberately not built

Customer accounts · supplier accounts · supplier portal · real-time
availability · online payments or deposits · supplier bidding · dispatch
optimization · truck tracking · automated pricing · reviews · chat · mobile
apps · CRM · AI features.

The data model is shaped so a later "fastest option / most economical option"
offer flow can be added without a rewrite, but none of it exists yet and none
of it should be added without a decision to move past Phase 1.
