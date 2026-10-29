/** Single fail-closed indexing policy shared by robots, metadata and response headers. */
export type IndexingEnvironment = { STAGING_NOINDEX?: string; VERCEL_ENV?: string };
export function shouldBlockIndexing(env: IndexingEnvironment = {
  STAGING_NOINDEX: process.env.STAGING_NOINDEX,
  VERCEL_ENV: process.env.VERCEL_ENV,
}): boolean {
  return env.STAGING_NOINDEX !== 'false' || env.VERCEL_ENV === 'preview';
}
