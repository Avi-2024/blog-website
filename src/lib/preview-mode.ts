/** Never run ephemeral CMS storage on a serverless Preview deployment. */
export function isReadOnlyPreview(env: Pick<NodeJS.ProcessEnv,'VERCEL_ENV'|'DATABASE_URL'>=process.env):boolean{
  return env.VERCEL_ENV==='preview'&&!env.DATABASE_URL?.trim();
}
