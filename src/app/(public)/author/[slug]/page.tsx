import {Archive} from '@/components/Archive';
import {archiveMetadata} from '@/lib/seo';
type Props={params:Promise<{slug:string;number?:string}>};
export async function generateMetadata({params}:Props){const {slug,number}=await params;return archiveMetadata('author',slug,number?Number(number):1);}
export default async function Page({params}:Props){const {slug,number}=await params;return <Archive kind="author" slug={slug} page={number?Number(number):1}/>;}
