import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SiteLayout from './SiteLayout';
import { BackToTop, StickyCta } from './marketing/widgets';
import { FEATURES, HERO, USE_CASES } from './marketing/content';
import { useCatalogSummary, useDocumentMeta } from './marketing/site';
import { POST_TYPE_LABEL, POST_TYPE_SEGMENT, POST_TYPES, publishedPosts, type Post, type PostType } from './posts';
import { postHref } from './router';
import './marketing/neo.css';

/*
 * Home page, rebuilt in a Neo-Brutalist style: bold colour blocks, thick black borders, hard offset
 * shadows, large type, and deliberately asymmetric layouts. Static throughout: no animation, no
 * canvas, no images. Sections, top to bottom: hero, the catalog numbers, three feature panels, use
 * cases, latest posts, and a closing call to action.
 */

/** The 16 EF 3.1 indicator codes, shown as tiles in the hero specimen. Order follows the method page. */
const INDICATOR_CODES = [
  'ACD', 'ETF', 'FRU', 'FWE', 'GHG', 'HTC', 'HTN', 'IOR',
  'LDU', 'MRU', 'OZD', 'PCO', 'PMA', 'SWE', 'TRE', 'WTU',
];

/** Tile colours cycle through the palette so the 16 tiles read as a set, not a gradient. */
const TILE_TONES = ['nb-tone-yellow', 'nb-tone-paper', 'nb-tone-pink', 'nb-tone-green', 'nb-tone-blue', 'nb-tone-orange'];

function latestPostOf(type: PostType): Post | undefined {
  return publishedPosts(type)[0];
}

export default function LandingPage() {
  const catalog = useCatalogSummary();
  const latest = POST_TYPES.map((type) => ({ type, post: latestPostOf(type) }));
  useDocumentMeta(
    'Environmental Impact Analyzer',
    'Published apparel and footwear process factors, with all 16 EF 3.1 indicators kept separate on every row. Scope is stated on every result.',
  );

  return (
    <SiteLayout current="home" variant="landing" sourceVersion={catalog.sourceVersion} totalRecords={catalog.totalRecords}>
      <div className="nb-home" id="nb-home">
        {/* ---------- Hero ---------- */}
        <section className="nb-hero" aria-labelledby="hero-title">
          <div className="nb-hero-copy">
            <p className="nb-tag">{HERO.eyebrow}</p>
            <h1 id="hero-title" className="nb-title">
              {HERO.title}
            </h1>
            <p className="nb-lede">{HERO.lede}</p>
            <div className="nb-actions">
              <a className="nb-button nb-button-primary" href="#/calculator">
                Open the calculator <ArrowForwardRoundedIcon fontSize="small" aria-hidden="true" />
              </a>
              <a className="nb-button nb-button-secondary" href="#/method">
                How the method works
              </a>
            </div>
            <ul className="nb-trust" aria-label="Commitments">
              {HERO.trust.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Decorative specimen of one process row: the 16 indicator tiles. The text summary is for screen readers. */}
          <div className="nb-spec" aria-hidden="true">
            <div className="nb-spec-head">
              <span>One process row</span>
              <span>16 indicators</span>
            </div>
            <div className="nb-spec-grid">
              {INDICATOR_CODES.map((code, i) => (
                <span key={code} className={`nb-tile ${TILE_TONES[i % TILE_TONES.length]}`}>
                  {code}
                </span>
              ))}
            </div>
            <div className="nb-spec-foot">Each indicator stays separate in its own unit</div>
          </div>
          <p className="sr-only">
            The hero shows one process row with all 16 EF 3.1 indicators: {INDICATOR_CODES.join(', ')}.
          </p>
        </section>

        {/* ---------- Catalog numbers ---------- */}
        <section className="nb-stats" aria-labelledby="stats-title">
          <h2 id="stats-title" className="nb-h2">
            What the bundled catalog holds
          </h2>
          <dl className="nb-stat-grid">
            <div className="nb-stat nb-tone-yellow">
              <dt>Published process factors</dt>
              <dd className="nb-stat-value">{catalog.totalRecords}</dd>
              <dd className="nb-stat-note">Pinned to source release {catalog.sourceVersion}</dd>
            </div>
            <div className="nb-stat nb-tone-pink">
              <dt>Selectable factor groups</dt>
              <dd className="nb-stat-value">{catalog.groups}</dd>
              <dd className="nb-stat-note">Families and reference units kept as published</dd>
            </div>
            <div className="nb-stat nb-tone-green">
              <dt>EF 3.1 indicators per row</dt>
              <dd className="nb-stat-value">16</dd>
              <dd className="nb-stat-note">Shown separately for every process row</dd>
            </div>
            <div className="nb-stat nb-tone-blue">
              <dt>Process rows per estimate</dt>
              <dd className="nb-stat-value">25</dd>
              <dd className="nb-stat-note">Maximum selections in one calculation</dd>
            </div>
          </dl>
        </section>

        {/* ---------- Feature panels: asymmetric, alternating ---------- */}
        {FEATURES.map((feature, index) => (
          <section
            key={feature.title}
            className={`nb-feature nb-feature-${index % 2 === 0 ? 'wide-left' : 'wide-right'}`}
            aria-labelledby={`feature-${index}-title`}
          >
            <div className="nb-feature-copy">
              <p className="nb-tag">{feature.eyebrow}</p>
              <h2 id={`feature-${index}-title`} className="nb-h2">
                {feature.title}
              </h2>
              <p className="nb-body">{feature.body}</p>
              <ul className="nb-checklist">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
            <div className={`nb-feature-panel nb-panel-${feature.visual}`} aria-hidden="true">
              <FeaturePanel kind={feature.visual} />
            </div>
          </section>
        ))}

        {/* ---------- Use cases ---------- */}
        <section className="nb-section" aria-labelledby="use-cases-title">
          <p className="nb-tag">Where teams use it</p>
          <h2 id="use-cases-title" className="nb-h2">
            Three ways to put the rows to work
          </h2>
          <ol className="nb-cases">
            {USE_CASES.map((item, i) => (
              <li key={item.title} className={`nb-case ${TILE_TONES[(i * 2) % TILE_TONES.length]}`}>
                <span className="nb-case-num" aria-hidden="true">
                  0{i + 1}
                </span>
                <h3 className="nb-h3">{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Latest posts ---------- */}
        <section className="nb-section" aria-labelledby="latest-heading">
          <h2 id="latest-heading" className="nb-h2">
            Latest from the blogs
          </h2>
          <ul className="nb-latest">
            {latest.map(({ type, post }) => (
              <li key={type} className="nb-latest-item">
                <span className="nb-tag nb-tag-small">{POST_TYPE_LABEL[type]}</span>
                {post ? (
                  <a href={postHref(post)} {...(post.externalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {post.title}
                    {post.externalUrl ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  </a>
                ) : (
                  <a href={`#/blogs/${POST_TYPE_SEGMENT[type]}`}>No {POST_TYPE_LABEL[type].toLowerCase()} published yet</a>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Closing call to action ---------- */}
        <section className="nb-cta" aria-labelledby="cta-title">
          <h2 id="cta-title" className="nb-cta-title">
            Start with one process row
          </h2>
          <p className="nb-body">
            Open the calculator, choose a published factor, and read its 16 indicators before you add a second row.
          </p>
          <div className="nb-actions">
            <a className="nb-button nb-button-primary" href="#/calculator">
              Open the calculator
            </a>
            <a className="nb-button nb-button-secondary" href="#/pricing">
              See plans
            </a>
          </div>
        </section>
      </div>
      <StickyCta />
      <BackToTop />
    </SiteLayout>
  );
}

/** Static, decorative panels for each feature. They describe the layout, not live data. */
function FeaturePanel({ kind }: { kind: 'indicators' | 'selection' | 'boundary' }) {
  if (kind === 'indicators') {
    return (
      <div className="nb-mock">
        <div className="nb-mock-row"><b>GHG</b><span>Climate change</span><i>unit</i></div>
        <div className="nb-mock-row"><b>WTU</b><span>Water use</span><i>unit</i></div>
        <div className="nb-mock-row"><b>MRU</b><span>Mineral &amp; metal</span><i>unit</i></div>
        <div className="nb-mock-row nb-mock-more">+ 13 more, each in its own unit</div>
      </div>
    );
  }
  if (kind === 'selection') {
    return (
      <div className="nb-mock">
        <div className="nb-mock-check"><span className="nb-box nb-box-on" />Dyeing row</div>
        <div className="nb-mock-check"><span className="nb-box nb-box-on" />Finishing row</div>
        <div className="nb-mock-check"><span className="nb-box" />Assembly row, not selected</div>
        <div className="nb-mock-total">Subtotal covers ticked rows only</div>
      </div>
    );
  }
  return (
    <div className="nb-mock">
      <div className="nb-mock-lock"><span className="nb-tag nb-tag-small">This browser</span> Product inputs</div>
      <div className="nb-mock-lock nb-mock-api"><span className="nb-tag nb-tag-small">API</span> Factor IDs and quantities</div>
    </div>
  );
}
