import 'server-only';
import {randomUUID} from 'node:crypto';
import {CMSFailure} from './model';

/** Any Cloudinary configuration selects this provider, so partial secrets fail closed. */
export function cloudinarySelected(env:Record<string,string|undefined>=process.env):boolean{
  return Boolean(env.CLOUDINARY_CLOUD_NAME||env.CLOUDINARY_API_KEY||env.CLOUDINARY_API_SECRET);
}

/** Upload already validated and re-encoded WebP bytes using private server credentials. */
export async function uploadCloudinaryWebp(bytes:Buffer):Promise<string>{
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey=process.env.CLOUDINARY_API_KEY;
  const apiSecret=process.env.CLOUDINARY_API_SECRET;
  if(!cloudName||!apiKey||!apiSecret)throw new CMSFailure(503,'Cloudinary media storage is not completely configured');
  if(!/^[a-zA-Z0-9_-]+$/.test(cloudName)||!/^[0-9]+$/.test(apiKey))throw new CMSFailure(503,'Cloudinary media storage configuration is invalid');
  const publicId=`toolvaluelab/${randomUUID()}`;
  const form=new FormData();
  form.set('file',new Blob([new Uint8Array(bytes)],{type:'image/webp'}),'image.webp');
  form.set('public_id',publicId);
  form.set('overwrite','false');
  let response:Response;
  try {
    response=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,{
      method:'POST',
      headers:{authorization:'Basic '+Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')},
      body:form,
      signal:AbortSignal.timeout(30000),
      cache:'no-store',
    });
  }catch{
    throw new CMSFailure(502,'Image storage service is unavailable. Please retry');
  }
  if(!response.ok)throw new CMSFailure(502,'Cloudinary rejected the image upload');
  const result=await response.json().catch(()=>null) as
    |{secure_url?:unknown;public_id?:unknown;resource_type?:unknown;format?:unknown}|null;
  const url=typeof result?.secure_url==='string'?result.secure_url:'';
  if(result?.public_id!==publicId||result?.resource_type!=='image'||result?.format!=='webp'||
     !url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`))
    throw new CMSFailure(502,'Cloudinary returned an invalid image response');
  return url;
}
