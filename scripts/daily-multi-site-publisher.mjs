import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pingGoogleIndexing, publishNexiloArticle } from './publish-nexilo-editorial.mjs';

function getTodayIst() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

function runGit(rootDir, args) {
  const res = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  if (res.status !== 0) {
    console.warn(`[Git Warning] git ${args.join(' ')} -> ${res.stderr || res.stdout}`);
  }
  return res.status === 0;
}

async function waitForLiveUrl(url, maxWaitMs = 120000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status === 200) {
        console.log(`[Deploy Check] Live HTTP 200 -> ${url}`);
        return true;
      }
    } catch {
      // retry until deadline
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  console.warn(`[Deploy Check] Timed out waiting for HTTP 200 -> ${url}; submitting ping anyway.`);
  return false;
}

async function runDailyMultiSitePublish() {
  const dryRun = process.argv.includes('--dry-run');
  const today = getTodayIst();
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..');

  console.log('=====================================================');
  console.log(`[Daily Multi-Site Publisher] Started at ${new Date().toISOString()} (IST date: ${today}${dryRun ? ', DRY-RUN' : ''})`);
  console.log('=====================================================');

  // 1. Target 1: ToolValueLab (Next.js / Neon DB / Vercel)
  console.log('\n--- TARGET 1: ToolValueLab (Tier-1 US Market) ---');
  const promotedTvlSlugs = [];
  try {
    const tvlQueueDir = path.join(rootDir, 'editorial', 'queued-toolvaluelab');
    const tvlLiveDir = path.join(rootDir, 'editorial');
    const tvlSchedulePath = path.join(tvlLiveDir, 'publishing-schedule.json');

    if (existsSync(tvlQueueDir)) {
      const queuedFiles = readdirSync(tvlQueueDir).filter(f => f.endsWith('.json')).sort();
      for (const f of queuedFiles) {
        const qPath = path.join(tvlQueueDir, f);
        const data = JSON.parse(readFileSync(qPath, 'utf8'));
        if (data.publishDate && data.publishDate > today) {
          console.log(`[ToolValueLab] Keeping ${f} queued (publishDate=${data.publishDate} > ${today}).`);
          continue;
        }
        if (data.imageFile) {
          const assetPath = path.join(rootDir, 'public', data.imageFile);
          if (!existsSync(assetPath)) {
            console.warn(`[ToolValueLab Warning] Missing SVG asset ${assetPath} for ${f}; skipping promotion.`);
            continue;
          }
        }
        const destPath = path.join(tvlLiveDir, f);
        if (dryRun) {
          console.log(`[ToolValueLab DRY-RUN] Would promote ${f} -> editorial/${f}`);
        } else {
          mkdirSync(tvlLiveDir, { recursive: true });
          if (!existsSync(destPath)) {
            renameSync(qPath, destPath);
          }
          if (data.slug) promotedTvlSlugs.push(data.slug);
          console.log(`[ToolValueLab] Promoted ${f} -> editorial/${f}`);
        }
      }
    }

    if (!dryRun && promotedTvlSlugs.length > 0 && existsSync(tvlSchedulePath)) {
      const schedule = JSON.parse(readFileSync(tvlSchedulePath, 'utf8'));
      if (Array.isArray(schedule.posts)) {
        for (const p of schedule.posts) {
          if (promotedTvlSlugs.includes(p.slug)) {
            p.status = 'published_live';
          }
        }
        writeFileSync(tvlSchedulePath, JSON.stringify(schedule, null, 2) + '\n', 'utf8');
      }
    }

    if (!dryRun && process.env.DATABASE_URL) {
      const res = spawnSync(process.execPath, [
        path.join(rootDir, 'scripts', 'auto-publish-editorial.mjs')
      ], { cwd: rootDir, stdio: 'inherit', env: process.env });
      if (res.error) console.warn('[ToolValueLab Error]', res.error.message);
    } else if (!dryRun && promotedTvlSlugs.length > 0) {
      console.log('[ToolValueLab] DATABASE_URL unset locally; committing promoted JSONs so Vercel build publishes automatically.');
    }

    if (!dryRun && promotedTvlSlugs.length > 0) {
      runGit(rootDir, ['add', 'editorial/', 'public/featured/']);
      const committed = runGit(rootDir, ['commit', '-m', `chore(editorial): publish ToolValueLab article(s) for ${today}`]);
      if (committed) {
        const pushed = runGit(rootDir, ['push', 'origin', 'main']);
        if (pushed) {
          for (const slug of promotedTvlSlugs) {
            const liveUrl = `https://toolvaluelab.com/${slug}/`;
            await waitForLiveUrl(liveUrl, 120000);
            await pingGoogleIndexing(liveUrl);
          }
          await pingGoogleIndexing('https://toolvaluelab.com/');
        }
      }
    }
  } catch (e) {
    console.error('[ToolValueLab Exception]', e.message);
  }

  // 2. Target 2: NexiloLabs (WordPress / India AI Ecosystem)
  console.log('\n--- TARGET 2: NexiloLabs (WordPress Site) ---');
  let nexiloUpdated = false;
  try {
    const nexiloDir = path.join(rootDir, 'editorial', 'nexilolabs');
    const nexiloSchedulePath = path.join(nexiloDir, 'publishing-schedule-nexilolabs.json');
    const schedule = existsSync(nexiloSchedulePath)
      ? JSON.parse(readFileSync(nexiloSchedulePath, 'utf8'))
      : null;

    if (existsSync(nexiloDir)) {
      const files = readdirSync(nexiloDir).filter(f => f.endsWith('.json') && !f.includes('schedule')).sort();
      console.log(`Found ${files.length} NexiloLabs editorial files.`);
      for (const f of files) {
        const filePath = path.join(nexiloDir, f);
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf8'));
          if (data.status === 'published_live' || (!data.html && !data.content)) {
            console.log(`[NexiloLabs] Skipping ${f} (already published_live or metadata-only).`);
            continue;
          }
          if (data.publishDate && data.publishDate > today) {
            console.log(`[NexiloLabs] Keeping ${f} queued (publishDate=${data.publishDate} > ${today}).`);
            continue;
          }
          if (dryRun) {
            console.log(`[NexiloLabs DRY-RUN] Would publish ${f} (${data.slug})`);
            continue;
          }
          console.log(`[NexiloLabs] Publishing article: ${f}...`);
          const res = await publishNexiloArticle(filePath);
          if (res?.success) {
            console.log(`[NexiloLabs Success] Published ID ${res.id} -> ${res.link}`);
            data.status = 'published_live';
            data.wpPostId = res.id;
            if (res.featuredMediaId) data.featuredMediaId = res.featuredMediaId;
            data.publishedAt = new Date().toISOString();
            writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
            if (schedule && Array.isArray(schedule.posts)) {
              const entry = schedule.posts.find(p => p.slug === data.slug);
              if (entry) {
                entry.status = 'published_live';
                entry.wpPostId = res.id;
              }
            }
            nexiloUpdated = true;
          }
        } catch (err) {
          console.warn(`[NexiloLabs Warning on ${f}]`, err.message);
        }
      }

      if (!dryRun && nexiloUpdated) {
        if (schedule) {
          writeFileSync(nexiloSchedulePath, JSON.stringify(schedule, null, 2) + '\n', 'utf8');
        }
        runGit(rootDir, ['add', 'editorial/nexilolabs/']);
        const committed = runGit(rootDir, ['commit', '-m', `chore(nexilolabs): mark article(s) published_live for ${today}`]);
        if (committed) {
          runGit(rootDir, ['push', 'origin', 'main']);
        }
      }
    } else {
      console.log('No editorial/nexilolabs directory found.');
    }
  } catch (e) {
    console.error('[NexiloLabs Exception]', e.message);
  }

  console.log('\n=====================================================');
  console.log(`[Daily Multi-Site Publisher] Finished at ${new Date().toISOString()}`);
  console.log('=====================================================');
}

runDailyMultiSitePublish().catch(console.error);
