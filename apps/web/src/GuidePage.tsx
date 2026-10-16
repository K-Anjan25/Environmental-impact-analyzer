import type { Guide } from './guides';
import { guides } from './guides';
import SiteMenu from './SiteMenu';

export default function GuidePage({ guide }: { guide: Guide }) {
  return (
    <div className="guide-page">
      <header className="landing-nav guide-nav">
        <a className="landing-brand" href="#/" aria-label="EcoImpact Lab home">
          <img src="/brand/mark.svg" alt="" />
          <span>EcoImpact Lab</span>
        </a>
        <SiteMenu />
      </header>
      <main className="guide-main">
        <a className="guide-back" href="#/">← Back to the estimator</a>
        <p className="landing-eyebrow">{guide.kicker}</p>
        <h1 className="guide-title">{guide.title}</h1>
        <figure className="guide-figure">
          <img src={guide.image} alt={guide.alt} />
        </figure>
        <div className="guide-body">
          {guide.paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        <nav className="guide-more" aria-label="More guides">
          <h2>More guides</h2>
          <ul>
            {guides
              .filter((item) => item.slug !== guide.slug)
              .map((item) => (
                <li key={item.slug}>
                  <a href={`#/guides/${item.slug}`}>{item.title}</a>
                </li>
              ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
