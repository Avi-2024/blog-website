import {AdminApp} from '@/components/admin/editor';
import {isReadOnlyPreview} from '@/lib/preview-mode';
import './admin.css';
export const dynamic='force-dynamic';
export const metadata={title:'ToolValueLab CMS',robots:{index:false,follow:false},referrer:'no-referrer' as const};

export default function Admin(){
  if(isReadOnlyPreview())return <main id="main-content" className="nex-cms-root">
    <section className="nex-cms-login">
      <h1>CMS not connected</h1>
      <p>This is a read-only design preview. Configure a persistent PostgreSQL database and media storage before enabling article editing or publishing.</p>
    </section>
  </main>;
  return <main id="main-content" className="nex-cms-root"><AdminApp/></main>;
}
