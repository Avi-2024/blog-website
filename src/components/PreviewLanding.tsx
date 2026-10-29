/** Honest visual-only fallback for a Vercel Preview deployment without a database. */
const topics=[
  {label:'AI Tools',detail:'Understand features, pricing and practical use cases.'},
  {label:'Software Reviews',detail:'Evaluate strengths and trade-offs before choosing.'},
  {label:'Business Software',detail:'Explore CRM, operations and automation workflows.'},
  {label:'Cloud & Hosting',detail:'Compare hosting platforms and cloud fundamentals.'},
];
export function PreviewLanding(){
  return <div className="container visual-preview">
    <section className="visual-preview-hero">
      <p className="visual-preview-eyebrow">AI TOOLS · SAAS · BUSINESS SOFTWARE</p>
      <h1>Find tools worth your time and money.</h1>
      <p>Practical guides, independent comparisons and clear explanations to help you choose software with confidence.</p>
      <div className="visual-preview-tags" aria-label="Publication topics"><span>AI Tools</span><span>Software Reviews</span><span>Business Software</span></div>
    </section>
    <section aria-labelledby="preview-topics">
      <div className="visual-preview-heading"><div><p>EXPLORE THE PUBLICATION</p><h2 id="preview-topics">Our editorial focus</h2></div><span>Design preview</span></div>
      <div className="visual-preview-grid">{topics.map((topic,index)=><article className="visual-preview-card" key={topic.label}>
        <span className="visual-preview-number">0{index+1}</span><h3>{topic.label}</h3><p>{topic.detail}</p>
      </article>)}</div>
    </section>
    <p className="visual-preview-disclaimer">This page demonstrates the website layout only. No articles are published in this preview; the production CMS requires PostgreSQL and persistent media storage.</p>
  </div>;
}
