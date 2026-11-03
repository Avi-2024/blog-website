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
export const CATEGORY_EDITORIAL: Record<string,{description:string;intro:string}> = {
  'ai-tools': {
    description:'Practical AI tools guides for small businesses: compare assistants, productivity features, real use cases, costs and rollout limitations.',
    intro:'Explore practical AI assistants and productivity software through real business workflows, product announcements and clear limitations. Compare what a tool can actually help your team do before paying for another subscription.'
  },
  'software-reviews': {
    description:'Independent software comparisons covering features, subscription costs, limitations and practical choices for small business teams.',
    intro:'Read side-by-side comparisons built around budgets, workflows and maintenance—not feature lists alone. Our guides explain pricing models, important trade-offs and what to verify before buying.'
  },
  'business-software': {
    description:'Business software guides covering CRM, automation, analytics and productivity tools for startups and small teams.',
    intro:"Find software that suits your team's actual operations. We cover CRM selection, sales workflows, reporting, automation and useful technology updates with practical decision frameworks."
  },
  'cloud-hosting': {
    description:'Cloud hosting and deployment comparisons for websites and Next.js apps, including pricing, databases, cron jobs and operational trade-offs.',
    intro:'Choose hosting based on how your application runs. Compare deployment platforms, serverless and always-on services, databases, scheduled work and the real operating costs of a production website.'
  }
};

export function publicUrl(path: string): string { return new URL(path.startsWith('/') ? path : `/${path}`, SITE_URL).toString(); }
export function normalizedSegment(segment: string): string {
  try { return decodeURIComponent(segment).normalize('NFC').toLowerCase(); }
  catch { return segment.normalize('NFC').toLowerCase(); }
}
