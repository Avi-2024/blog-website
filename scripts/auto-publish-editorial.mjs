import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

if (process.env.DATABASE_URL) {
  console.log('--- Checking pending ToolValueLab editorial publications ---');
  
  // Look in editorial/toolvaluelab first, then root editorial (ignoring nexilolabs)
  const candidateDirs = [
    path.join(process.cwd(), 'editorial', 'toolvaluelab'),
    path.join(process.cwd(), 'editorial')
  ];

  const processedSlugs = new Set();

  for (const dir of candidateDirs) {
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter(f => 
      f.endsWith('.json') && 
      !f.includes('schedule') && 
      !f.includes('nexilo')
    );

    for (const f of files) {
      const filePath = path.join(dir, f);
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        if (data.slug && processedSlugs.has(data.slug)) continue;
        
        if (data.imageFile && data.imageFile.endsWith('.svg')) {
          console.log(`[ToolValueLab] Evaluating ${path.relative(process.cwd(), filePath)} for publication...`);
          const result = spawnSync(process.execPath, [
            '--conditions=react-server',
            '--import',
            'tsx',
            'scripts/publish-editorial.ts',
            path.relative(process.cwd(), filePath)
          ], { stdio: 'inherit', env: process.env });
          
          if (result.error) {
            console.warn(`[ToolValueLab] Warning on ${f}:`, result.error.message);
          } else {
            if (data.slug) processedSlugs.add(data.slug);
          }
        }
      } catch (e) {
        console.warn(`[ToolValueLab] Skipping ${f}:`, e.message);
      }
    }
  }
} else {
  console.log('DATABASE_URL not set; skipping ToolValueLab editorial auto-publish.');
}
