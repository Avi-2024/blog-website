import type {Metadata} from 'next';
import {EditorialForm} from '@/components/Forms';

export const metadata:Metadata={title:'Contact ToolValueLab',description:'Contact the ToolValueLab editorial team with questions, feedback or corrections.'};

export default function ContactPage(){
  const configured=Boolean(process.env.CONTACT_ENDPOINT_URL&&process.env.CONTACT_ENDPOINT_TOKEN);
  return <div className="container form-page">
    <h1>Contact ToolValueLab</h1>
    <p>Have feedback, a correction or a question about an article? Reach out using this form.</p>
    <EditorialForm kind="contact" configured={configured}/>
  </div>;
}
