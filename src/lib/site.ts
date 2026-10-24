export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://nexilolabs.com').replace(/\/$/, '');
export const SITE_NAME = 'Nexilo Labs';
export const SITE_DESCRIPTION = 'Explore practical AI tools, technology, education, jobs and digital skills guides from Nexilo Labs. Clear tutorials, comparisons and useful updates.';
export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'AI Tools', href: '/category/ai-tools/' },
  { label: 'Business & Software', href: '/category/business-software/' },
  { label: 'Smartphones & Apps', href: '/category/smartphones-apps/' },
] as const;
export const LOGO_PATH = '/brand/logo.webp';
export function publicUrl(path: string): string { return new URL(path.startsWith('/') ? path : `/${path}`, SITE_URL).toString(); }
export function normalizedSegment(segment: string): string {
  try { return decodeURIComponent(segment).normalize('NFC').toLowerCase(); }
  catch { return segment.normalize('NFC').toLowerCase(); }
}
