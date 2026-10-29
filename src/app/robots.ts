import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
export default function robots():MetadataRoute.Robots{
 if(process.env.STAGING_NOINDEX!=='false')return {rules:[{userAgent:'*',disallow:'/'}]};
 return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/admin/','/preview/','/search/']}],sitemap:`${SITE_URL}/sitemap.xml`};
}
