import {submitForm} from '@/lib/forms';
export async function POST(req:Request){return submitForm(req,'newsletter');}
