import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { shouldBlockIndexing } from '@/lib/indexing';

export default function robots(): MetadataRoute.Robots {
  if (shouldBlockIndexing()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/preview/', '/search/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
