/** Canonical public brand; keep internal legacy CMS keys for DB compatibility. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://toolvaluelab.com').replace(/\/$/, '');
export const SITE_NAME = 'ToolValueLab';
export const SITE_DESCRIPTION = 'Practical reviews and comparisons of AI tools, SaaS, business software, automation and cloud services. Find the right tool for the job.';
export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'AI Tools', href: '/category/ai-tools/' },
  { label: 'Software Reviews', href: '/category/software-reviews/' },
  { label: 'Business Software', href: '/category/business-software/' },
  { label: 'Cloud & Hosting', href: '/category/cloud-hosting/' },
] as const;
export const LOGO_PATH = '/brand/favicon.svg';
export function publicUrl(path: string): string { return new URL(path.startsWith('/') ? path : `/${path}`, SITE_URL).toString(); }
export function normalizedSegment(segment: string): string {
  try { return decodeURIComponent(segment).normalize('NFC').toLowerCase(); }
  catch { return segment.normalize('NFC').toLowerCase(); }
}
