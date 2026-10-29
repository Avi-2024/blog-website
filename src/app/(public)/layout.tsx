import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {cmsSettings} from '@/lib/cms-settings';

export default async function PublicLayout({children}:{children:React.ReactNode}){
  const settings=await cmsSettings();
  return <><Header nav={settings.nav} announcement={settings.announcement}/><main id="main-content">{children}</main><Footer/></>;
}
