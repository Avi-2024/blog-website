import { EditorialForm } from '@/components/Forms';
export const metadata={title:'Newsletter',robots:{index:false,follow:true}};
export default function Newsletter(){return <div className="container form-page"><h1>Subscribe to Nexilo Labs</h1><p>Fresh updates straight to your inbox.</p><EditorialForm kind="newsletter" configured={Boolean(process.env.NEWSLETTER_ENDPOINT_URL&&process.env.NEWSLETTER_ENDPOINT_TOKEN)}/></div>;}
