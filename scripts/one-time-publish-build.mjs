/**
 * Temporary, one-time publication hook. Runs only in the intended Vercel
 * production environment when the database is configured; never on CI/preview.
 * Idempotency is guaranteed by publish-first-article.ts.
 * Remove after the successful first publication.
 */
import {spawnSync} from 'node:child_process';

if(process.env.VERCEL_ENV==='production'&&process.env.DATABASE_URL){
  console.log('Checking first ToolValueLab article publication...');
  const result=spawnSync(process.execPath,[
    '--conditions=react-server','--import','tsx','scripts/publish-first-article.ts',
  ],{stdio:'inherit',env:process.env});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}else{
  console.log('First article seed skipped (non-production build or no production database).');
}
