# Nexilo Labs — Next.js and custom CMS

Architecture per the owner's latest instruction: **Next.js public website with an in-house CMS at `/admin/`; WordPress is removed from runtime.** No live hosting, production site, or DNS has been modified.

The UI keeps the audited Nexilo Labs layout and styling. CMS content lives in a PostgreSQL database, never in source arrays/Markdown imports. Local development uses persistent PGlite files; production requires an external PostgreSQL database. Media uploads are resized/re-encoded and saved to S3-compatible storage in production.

## Editorial features

- Owner, editor and author accounts; secure scrypt password hashes; eight-hour HttpOnly session cookies; account creation for the team.
- Visual editor supports article title as H1, H2/H3/H4, bold/italic, lists, links, tables, alignment, and images.
- Articles and pages with saved drafts, debounced autosave, 100 revisions, authenticated preview, publish/update, future scheduling, unpublish, recoverable trash and permanent delete from trash.
- Draft and published content are stored separately: autosave does not silently change the public article. Publish/Update explicitly changes the public copy.
- Featured media with alt text, category/tag assignment, author archives, SEO title/description/canonical/social fields, and noindex control.
- Website announcement, footer introduction, navigation and homepage SEO come from CMS settings. Pages (About, legal, contact, etc.) are edited in the Pages panel when created/imported.
- Public article pages, homepage, category/tag/author archives, search, RSS and sitemap read only `published` rows. Publishing invalidates Next.js cache tags and paths; pages are rendered dynamically so changes do not need a build or deployment.
- A bearer-protected `/api/cron/publish/` activates scheduled articles. `vercel.json` requests a once-a-minute job; production hosting must permit that schedule. Public requests also reconcile due schedule rows in case a cron tick was missed.

## Local setup

Requires Node 22.13+ and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Create the initial owner once. This prompts for the password without echoing it; finish with Enter, and send EOF (Ctrl-D) if prompted. Do not put a real password into command arguments or source control.

```bash
npm run cms:user -- avi@example.com "Avi Tamrakar" avi-tamrakar owner
```

Then open `http://localhost:3000/admin/`. No default credentials, demo account, imported blog posts or starter articles are included. Create your categories/tags and write your articles there. Local data is under `.data/cms` and images under `.data/media`; back these up if you keep local content.

## Production is not ready yet

Before using a public deployment, provision and configure:

- A durable PostgreSQL database with backups and restore testing (`DATABASE_URL`). Do not use local PGlite storage on serverless production.
- A private owner account and the exact HTTPS website origin (`CMS_ADMIN_ORIGIN`, `NEXT_PUBLIC_SITE_URL`). Do not enable `CMS_LOCAL_MODE` in production.
- An S3-compatible image bucket and HTTPS public media URL, with server-only credentials.
- A random 32+ character cron secret; confirm the host actually runs the configured one-minute cron.
- Contact/newsletter delivery integrations (the existing forms fail closed when not configured).
- Hosted acceptance tests for auth, real DB/media, editor, draft privacy, preview, search/indexing, sitemap, mobile layout, cron/retries, backups and real propagation latency.
- A content/URL decision before cutover. No legacy blog records or article export are included in this fresh-start repository. The existing live site remains untouched; production cutover still needs a review of pages, URLs, and redirects.

`npm run release:check` verifies required environment values; a pass alone is not launch approval. Do not mark production ready until hosted tests and content comparison pass.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Current automated tests exercise database transactions, password/session auth, role checks, draft privacy, publish/update, SEO data, autosave isolation, revisions, scheduled publication and retry, Unicode permalinks, redirects/unpublish, media sanitization, and API-origin checks. Their propagation measurements are local database timings, not production latency.
