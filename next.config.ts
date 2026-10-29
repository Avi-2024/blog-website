import type {NextConfig} from 'next';
import {shouldBlockIndexing} from './src/lib/indexing';
const media=process.env.MEDIA_PUBLIC_URL;
const cloudName=process.env.CLOUDINARY_CLOUD_NAME;
if (cloudName && !/^[a-zA-Z0-9_-]+$/.test(cloudName)) throw new Error('Invalid CLOUDINARY_CLOUD_NAME');
const config:NextConfig={
  trailingSlash:true,
  poweredByHeader:false,
  serverExternalPackages:['pg','@electric-sql/pglite'],
  images:{
    remotePatterns:[
      ...(cloudName?[{protocol:'https' as const,hostname:'res.cloudinary.com',pathname:`/${cloudName}/image/upload/**`}]:[]),
      ...(media?[{protocol:'https' as const,hostname:new URL(media).hostname,pathname:new URL(media).pathname.replace(/\/$/,'')+'/**'}]:[]),
    ],
    dangerouslyAllowSVG:false,
  },
  async headers(){
    return [
      {source:'/:path*',headers:[
        {key:'X-Content-Type-Options',value:'nosniff'},
        {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
        {key:'X-Frame-Options',value:'SAMEORIGIN'},
        {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
        ...(shouldBlockIndexing()?[{key:'X-Robots-Tag',value:'noindex, nofollow'}]:[]),
      ]},
      ...['/admin/:path*','/preview/:path*','/api/:path*'].map(source=>({source,headers:[
        {key:'Cache-Control',value:'private, no-store, max-age=0'},
        {key:'Referrer-Policy',value:'no-referrer'},
        {key:'X-Robots-Tag',value:'noindex, nofollow'},
      ]})),
    ];
  },
};
export default config;
