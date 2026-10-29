/** Single fail-closed indexing policy shared by robots, metadata and response headers. */
export type IndexingEnvironment = { STAGING_NOINDEX?: string; VERCEL_ENV?: string };
export function shouldBlockIndexing(env: IndexingEnvironment = process.env): boolean {
  return env.STAGING_NOINDEX !== 'false' || env.VERCEL_ENV === 'preview';
}
