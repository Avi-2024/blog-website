import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { publishNexiloArticle } from './publish-nexilo-editorial.mjs';

async function runDailyMultiSitePublish() {
  console.log('=====================================================');
  console.log(`[Daily Multi-Site Publisher] Started at ${new Date().toISOString()}`);
  console.log('=====================================================');

  const rootDir = process.cwd();

  // 1. Target 1: ToolValueLab (Next.js / Neon DB / Vercel)
  console.log('\n--- TARGET 1: ToolValueLab (Tier-1 US Market) ---');
  try {
    const tvlSchedulePath = path.join(rootDir, 'editorial', 'publishing-schedule.json');
    if (existsSync(tvlSchedulePath)) {
      const schedule = JSON.parse(readFileSync(tvlSchedulePath, 'utf8'));
      console.log(`ToolValueLab Cycle: ${schedule.cycle}, Total days: ${schedule.total_cycle_days}`);
      const res = spawnSync(process.execPath, [
        path.join(rootDir, 'scripts', 'auto-publish-editorial.mjs')
      ], { stdio: 'inherit', env: process.env });
      if (res.error) console.warn('[ToolValueLab Error]', res.error.message);
    }
  } catch (e) {
    console.error('[ToolValueLab Exception]', e.message);
  }

  // 2. Target 2: NexiloLabs (WordPress / India AI Ecosystem)
  console.log('\n--- TARGET 2: NexiloLabs (WordPress Site) ---');
  try {
    const nexiloDir = path.join(rootDir, 'editorial', 'nexilolabs');
    if (existsSync(nexiloDir)) {
      const files = readdirSync(nexiloDir).filter(f => f.endsWith('.json') && !f.includes('schedule'));
      console.log(`Found ${files.length} NexiloLabs editorial files:`, files);
      for (const f of files) {
        const filePath = path.join(nexiloDir, f);
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf8'));
          if (data.status === 'published_live' || (!data.html && !data.content)) {
            console.log(`Skipping ${f} (already marked published_live or metadata-only).`);
            continue;
          }
          console.log(`Publishing NexiloLabs article: ${f}...`);
          const res = await publishNexiloArticle(filePath);
          console.log(`[NexiloLabs Success] Published ID ${res.id} -> ${res.link}`);
        } catch (err) {
          console.warn(`[NexiloLabs Warning on ${f}]`, err.message);
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
