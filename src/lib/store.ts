// Shared durable Redis is mandatory for public mutation endpoints. No process-local fallback.
export async function redis<T=unknown>(...command:(string|number)[]):Promise<T>{
 const url=process.env.REDIS_REST_URL,token=process.env.REDIS_REST_TOKEN;
 if(!url?.startsWith('https://')||!token)throw new Error('Durable Redis is not configured');
 const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(command),cache:'no-store',signal:AbortSignal.timeout(5000)});
 if(!response.ok)throw new Error('Durable store unavailable');const data=await response.json();if(data.error)throw new Error('Durable store rejected operation');return data.result as T;
}
export async function once(key:string,ttl:number){return (await redis('SET',`nexilo:${key}`,'1','NX','EX',ttl))==='OK';}
export async function rateLimit(key:string,limit=30,seconds=60){
 const count=await redis<number>('EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",1,`nexilo:rate:${key}`,seconds);
 return count<=limit;
}
