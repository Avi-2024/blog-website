import {handleAdmin} from '@/lib/cms/admin-service';import {invalidateContent} from '@/lib/cms/invalidate';
export const runtime='nodejs';export const dynamic='force-dynamic';
const handler=(req:Request,c:{params:Promise<{action:string[]}>})=>handleAdmin(req,c,invalidateContent);export {handler as GET,handler as POST,handler as PUT,handler as DELETE};
