# ToolValueLab — AI & Business Software Publication

A Next.js 16 / React 19 editorial website with an integrated private CMS at `/admin/`. This repository is for **toolvaluelab.com**; it is a separate publication from Nexilo Labs. Existing internal database/HTTP identifiers retain their older names for compatibility.

## Editorial focus

- AI tools and hands-on tutorials
- Software reviews and feature/price comparisons
- CRM, automation, business applications and SaaS
- Cloud services and hosting

Prioritize helpful, original, expert-reviewed writing. Use first-hand screenshots and test conditions where possible. Clearly disclose affiliate relationships and separate advertising from editorial recommendations. Do not publish unverified prices, claims or fabricated experience.

## Run locally

Node 22.13+ is required.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The initial owner is created once (the CLI prompts for a password; do not put it in command arguments or commit credentials):

```bash
npm run cms:user -- editor@your-domain.example "Editor Name" toolvaluelab-editor owner
```

Open `http://localhost:3000/admin/`. For local development, PGlite files and media live under `.data/` (not suitable for serverless production). The editor provides drafts, autosave, 100 revisions, private preview, scheduling, categorization, reusable media and publish/unpublish. No starter articles are included. The four primary topic categories are created on database initialization.

## Production configuration (must be completed before launch)

Set these server-side variables on the host (never add credentials to git):

```dotenv
NEXT_PUBLIC_SITE_URL=https://toolvaluelab.com
CMS_ADMIN_ORIGIN=https://toolvaluelab.com
STAGING_NOINDEX=false
DATABASE_URL=postgresql://... (private)
CRON_SECRET=<random 32+ character secret>
S3_BUCKET=<your private media bucket>
S3_REGION=<your provider region>
S3_ENDPOINT=<your S3-compatible service endpoint>
AWS_ACCESS_KEY_ID=<server-only access key>
AWS_SECRET_ACCESS_KEY=<server-only secret>
MEDIA_PUBLIC_URL=https://<your public media domain>
CMS_LOCAL_MODE=false
```

Add an owner account and test real production PostgreSQL with durable backups and restore. Verify S3 uploads, the cron authorization, secure HTTPS, draft access controls, front-end responsiveness, user-facing forms and publish-to-public propagation before launch. Configure CONTACT/NEWSLETTER providers if those forms will be available. Public forms require durable Redis. `npm run release:check` validates some environment requirements, but does **not** verify the live deployment.

### DNS and canonical origin

The domain may remain registered with BigRock while DNS points to your chosen hosting. Configure apex `toolvaluelab.com` plus `www` and enforce a single canonical hostname via your hosting provider. Preserve existing MX/TXT records during any nameserver changes. Domain transfer to GoDaddy is a separate optional registrar operation.

### Indexing safeguard

Production stays **noindex** until `STAGING_NOINDEX=false` is set intentionally. On staging keep `STAGING_NOINDEX=true`. After cutover verify:

- `/` returns 200 with no `X-Robots-Tag: noindex`
- `/robots.txt` allows public crawling
- `/sitemap.xml` includes only publicly published indexable URLs for toolvaluelab.com
- post canonical URLs, metadata and JSON-LD reference toolvaluelab.com
- `/admin/`, `/preview/` and API routes are protected/noindexed
- submit the new domain to Google Search Console, verify URL Inspection and monitor indexing

### Scheduled publishing

`vercel.json` uses a daily `03:00 UTC` cron for compatibility with Vercel Hobby. The app also publishes due posts when public content is requested. **This is not precise scheduling**: exact-time publication requires an appropriately frequent authorized scheduler or a supported paid hosting plan.

### Advertising

The code deliberately does **not** turn on ads or claim approval. Configure `ADSENSE_PUBLISHER_ID=pub-1234567890123456` only after receiving your real ID; `/ads.txt` will then serve the authorized seller declaration. The example ID is not valid for your site. Before introducing AdSense scripts/slots, get site approval, publish complete and accurate legal/trust pages, and implement applicable privacy/consent controls (including a Google-certified CMP when required). Do not overrun articles with ads or misrepresent affiliate partnerships.

### Pre-launch content requirements

Use the CMS to publish genuine About, Privacy Policy, Terms, Disclaimer, editorial standards and Contact information appropriate to the real business; links to CMS legal pages will 404 until they are created. Publish multiple substantial original articles and verify all visible footer links. No blog content should be fabricated as part of the deployment. 

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run release:check
```

GitHub Actions runs `npm run validate` on pushes/PRs. CI's embedded database is for testing only, not evidence that the production database, object storage, email integration, schedules, or DNS work. Merge only after checks pass and a hosted smoke test is performed.

## Database-free design preview (Vercel Preview only)

When `VERCEL_ENV=preview` and `DATABASE_URL` is absent, the public homepage renders a clearly labelled **read-only design preview** rather than crashing during CMS initialization. This mode does not publish, edit or serve real CMS articles; the admin page explains that storage is disconnected. It cannot be enabled on production. Vercel preview deployments are always `noindex`, independent of `STAGING_NOINDEX`. Configure a durable production PostgreSQL connection and object storage for complete website testing.
