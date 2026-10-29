import Link from 'next/link';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {cmsSettings} from '@/lib/cms-settings';
import {isReadOnlyPreview} from '@/lib/preview-mode';

export default async function PublicLayout({children}:{children:React.ReactNode}){
  if(isReadOnlyPreview()){
    return <>
      <div className="preview-only-notice" role="status">Design preview only — the CMS database is not connected. Publishing is disabled.</div>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="ToolValueLab preview homepage">
            <span className="brand-wordmark">Tool<span>Value</span>Lab</span>
          </Link>
          <span className="preview-header-status">Editorial design preview</span>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer"><div className="container preview-only-footer">ToolValueLab · Preview build — not a live publication</div></footer>
    </>;
  }
  const settings=await cmsSettings();
  return <><Header nav={settings.nav} announcement={settings.announcement}/><main id="main-content">{children}</main><Footer/></>;
}
