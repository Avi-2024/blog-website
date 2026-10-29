/** Never run ephemeral CMS storage on a serverless Preview deployment. */
export function isReadOnlyPreview(
  env: { VERCEL_ENV?: string; DATABASE_URL?: string } = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
  },
): boolean {
  return env.VERCEL_ENV === 'preview' && !env.DATABASE_URL?.trim();
}
