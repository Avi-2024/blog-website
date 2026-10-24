import {Archive} from '@/components/Archive';
import {archiveMetadata} from '@/lib/seo';
type Props={params:Promise<{slug:string;number?:string}>};
export async function generateMetadata({params}:Props){const {slug,number}=await params;return archiveMetadata('category',slug,number?Number(number):1);}
export default async function Page({params}:Props){const {slug,number}=await params;return <Archive kind="category" slug={slug} page={number?Number(number):1}/>;}
