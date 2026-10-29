import {NextResponse} from 'next/server';import {createHash} from 'node:crypto';import {rateLimit} from './store';import {readLimited} from './security';
export async function submitForm(req:Request,kind:'contact'|'newsletter'){
 const prefix=kind.toUpperCase(),endpoint=process.env[`${prefix}_ENDPOINT_URL`],token=process.env[`${prefix}_ENDPOINT_TOKEN`];
 if(!endpoint||!token||!endpoint.startsWith('https://'))return NextResponse.json({error:'This service is temporarily unavailable.'},{status:503});
 const origin=req.headers.get('origin');const allowed=[new URL(req.url).origin,process.env.NEXT_PUBLIC_SITE_URL,...(process.env.FORM_ALLOWED_ORIGINS||'').split(',')].filter(Boolean);
 if(!origin||!allowed.includes(origin))return NextResponse.json({error:'Origin rejected'},{status:403});
 if(!req.headers.get('content-type')?.startsWith('application/json'))return NextResponse.json({error:'JSON required'},{status:415});
 let data;try{data=JSON.parse(await readLimited(req,8192));}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
 if(!data||typeof data.email!=='string'||data.email.length>254||!/^\S+@\S+\.\S+$/.test(data.email)||data.consent!==true||data.website)return NextResponse.json({error:'Valid email and consent are required.'},{status:400});
 if(kind==='contact'&&(typeof data.name!=='string'||data.name.trim().length<1||data.name.length>120||typeof data.message!=='string'||data.message.trim().length<10||data.message.length>5000))return NextResponse.json({error:'Please enter your name and a message of 10–5000 characters.'},{status:400});
 try{const key=createHash('sha256').update(data.email.trim().toLowerCase()).digest('hex');if(!await rateLimit(`form:${kind}:global`,100)||!await rateLimit(`form:${kind}:${key}`,3,3600))return NextResponse.json({error:'Too many requests. Please try later.'},{status:429});
 const payload={email:data.email.trim().toLowerCase(),...(kind==='contact'?{name:data.name.trim(),message:data.message.trim()}:{}),consent:true,consent_source:'ToolValueLab '+kind,timestamp:new Date().toISOString()};
 const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000),redirect:'error',cache:'no-store'});
 // The configured adapter must acknowledge acceptance. HTTP 200 alone isn't delivery evidence.
 const ack=await response.json().catch(()=>null);if(!response.ok||ack?.accepted!==true)throw new Error('Provider did not acknowledge');
 return NextResponse.json({ok:true});
 }catch{console.error(`${kind} submission unavailable`);return NextResponse.json({error:'Unable to submit at this time. Please try later.'},{status:503});}
}
