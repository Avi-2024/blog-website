import sanitizeHtml from 'sanitize-html';
export function stripHtml(html: string): string {
  const entities: Record<string,string> = {amp:'&',lt:'<',gt:'>',quot:'\"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',mdash:'—',ndash:'–'};
  return html.replace(/<[^>]+>/g, ' ').replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (_, key:string) => {
    if(key[0]==='#') {const n=key[1]?.toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
      return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):' '; }
    return entities[key.toLowerCase()]??`&${key};`;
  }).replace(/\s+/g, ' ').trim();
}
export function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img','figure','figcaption','picture','source','table','thead','tbody','tfoot','tr','th','td','h1','h2','h3','h4','h5','h6','pre','code','details','summary','video','audio','iframe','svg','path'
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ['href','name','target','rel','title'],
      img: ['src','srcset','sizes','alt','width','height','loading','decoding','class'],
      source: ['src','srcset','sizes','media','type'],
      '*': ['class','id','lang','dir','title','style'],
      svg:['viewBox','width','height','fill','aria-hidden'],path:['d','fill'],
      th: ['colspan','rowspan','scope'], td: ['colspan','rowspan'],
      iframe:['src','title','loading','allowfullscreen','referrerpolicy'],
      video: ['src','controls','preload','poster'], audio: ['src','controls','preload']
    },
    allowedSchemes: ['http','https','mailto','tel'],
    allowedIframeHostnames:['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'],
    // Imported HTML is intentionally sanitized; no plugin event handlers/scripts.
    allowedStyles: {'*':{'text-align':[/^(left|center|right|justify)$/]}},
    transformTags: {
      a: (_tag, attrs) => ({tagName:'a',attribs:{...attrs,...(attrs.target==='_blank'?{rel:[...new Set((attrs.rel||'').split(/\s+/).concat(['noopener','noreferrer']))].filter(Boolean).join(' ')}:{})}}),
      h1: 'h2' // Page/article heading is already the sole semantic H1.
    },
    disallowedTagsMode: 'discard',
  });
}
export function publishedDate(input: string): string {
  return new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Kolkata' }).format(new Date(/Z$|[+-]\d\d:\d\d$/.test(input)?input:input+'+05:30'));
}
