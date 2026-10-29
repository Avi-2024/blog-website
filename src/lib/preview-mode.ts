/** Never run ephemeral CMS storage on a serverless Preview deployment. */
export function isReadOnlyPreview(env: Partial<Record<'VERCEL_ENV'|'DATABASE_URL', string | undefined>>=process.env):boolean{
  return env.VERCEL_ENV==='preview'&&!env.DATABASE_URL?.trim();
}
