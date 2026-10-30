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
# Cloudinary (preferred; all three required)
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<server-only API key>
CLOUDINARY_API_SECRET=<server-only API secret>
CMS_LOCAL_MODE=false
```

Add an owner account and test real production PostgreSQL with durable backups and restore. Verify Cloudinary image uploads, the cron authorization, secure HTTPS, draft access controls, front-end responsiveness, user-facing forms and publish-to-public propagation before launch. Configure CONTACT/NEWSLETTER providers if those forms will be available. Public forms require durable Redis. `npm run release:check` validates some environment requirements, but does **not** verify the live deployment.

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

## Preview deployments

Preview builds use the **real** CMS and PostgreSQL integration, not a fake sample landing page. Set `DATABASE_URL` for the Preview environment when testing the site and CMS. Without database configuration, CMS-backed pages will fail rather than silently displaying demo content. Preview remains `noindex` through its existing Next.js robots and response-header safeguards. Keep preview database credentials server-side and separate from production when possible.

## Cloudinary image storage (preferred, no S3 key required)

1. Create a Cloudinary account and obtain **Cloud name**, **API Key**, **API Secret** from the Cloudinary Console (Settings / API Keys).
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` as server-only Vercel environment variables. Never commit or prefix them with `NEXT_PUBLIC_`.
3. Remove any incomplete/unused S3 variables. Cloudinary takes precedence when any Cloudinary variable is set and fails closed if incomplete, rather than silently writing media to another provider.
4. Redeploy after adding the keys so Next.js includes the Cloudinary CDN in its tightly scoped remote image patterns.
5. With a **persistent PostgreSQL database**, create the initial owner account, log in to `/admin/`, upload a sample image and verify its HTTPS Cloudinary URL renders in a published draft. The upload endpoint verifies the admin session, checks request origin and image type, limits input to 10 MB/40 MP, resizes to max 2400 px and stores WebP.

The server uploads through Cloudinary's authenticated API using HTTP Basic Auth; credentials never reach the browser. The returned `secure_url` is saved in the CMS media table. Local development keeps its existing local media fallback if Cloudinary is not set. Existing S3 media remains supported as a fallback provider. Media deletion/reconciliation and storage quota monitoring need additional lifecycle work before large-scale use. Cloudinary free plan quotas apply and may change.

## SEO indexing release gate (ToolValueLab)

The site uses one fail-closed SEO switch through `src/lib/indexing.ts`. `STAGING_NOINDEX=true`, missing values, or `VERCEL_ENV=preview` block crawling and add `noindex` headers and metadata. On the real production project, after content/trust pages and domain configuration are ready, set **`STAGING_NOINDEX=false` in Vercel Production** and deploy again. Never use this setting for a preview environment. Keep user-specific CMS draft `/preview/`, admin `/admin/` and API routes noindexed regardless.

Vercel domain redirects must agree with the canonical origin: **`toolvaluelab.com` serves HTTP 200; `www.toolvaluelab.com` permanently redirects to the apex (308)**. Do not enable public indexing while the opposite redirect is configured. The Vercel alias is not the desired Search Console property. After launch check the *live responses*, not just GitHub code:

- `https://toolvaluelab.com/robots.txt` allows public paths and references `https://toolvaluelab.com/sitemap.xml`.
- `https://toolvaluelab.com/sitemap.xml` lists only published indexable CMS URLs.
- The homepage and first published article both return 200, have apex canonical URLs, no `noindex` meta tags and **no `X-Robots-Tag: noindex`**.
- Private admin, API and preview routes remain disallowed/noindexed, and the Vercel preview environment remains blocked.
- Run Google Search Console live URL inspection on **the apex URL**, then request indexing. Crawling/indexing is Google-controlled and may not happen immediately.

## Publish the prepared Zoho Analytics news post

The article source is `editorial/zoho-analytics-agentic-ai-2026.json`; its original illustrated feature image is `public/featured/zoho-analytics-agentic-ai-2026.svg`. These files being in GitHub does **not** publish them. Only a real CMS publish writes to Neon PostgreSQL.

On an authorized workstation with Node 22+ and a trusted production database connection configured, run:

```bash
npm ci
node --env-file=.env.production.local --conditions=react-server --import tsx scripts/publish-zoho-analytics-2026.ts
```

Keep `.env.production.local` private and untracked. It must contain `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL=https://toolvaluelab.com`. Never paste the database password into GitHub, CLI arguments, logs or chat. The command validates the slug and featured image, checks for an existing post, uses the CMS's existing `createPost` / `editPost` functions, and refuses to overwrite an existing draft or post. It requires an existing, enabled CMS author. No build-time publisher hook, unauthenticated public import endpoint or automatic database writes are added. After the command reports `published`, inspect the canonical URL, the featured image and `/sitemap.xml`.
