import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

if (process.env.DATABASE_URL) {
  console.log('--- Checking pending editorial publications ---');
  const dir = path.join(process.cwd(), 'editorial');
  const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'publishing-schedule.json');

  for (const f of files) {
    const filePath = path.join(dir, f);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      if (data.imageFile && data.imageFile.endsWith('.svg')) {
        console.log(`Evaluating editorial/${f} for publication...`);
        const result = spawnSync(process.execPath, [
          '--conditions=react-server',
          '--import',
          'tsx',
          'scripts/publish-editorial.ts',
          `editorial/${f}`
        ], { stdio: 'inherit', env: process.env });
        if (result.error) {
          console.warn(`Warning on editorial/${f}:`, result.error.message);
        }
      }
    } catch (e) {
      console.warn(`Skipping ${f}:`, e.message);
    }
  }
} else {
  console.log('DATABASE_URL not set; skipping editorial auto-publish.');
}
