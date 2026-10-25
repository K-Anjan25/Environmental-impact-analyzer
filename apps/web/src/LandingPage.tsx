import { Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SiteLayout from './SiteLayout';
import ParticleHero from './marketing/ParticleHero';
import { AnimatedCanvas, drawBrowserBoundary, drawIndicatorBars, drawProcessChain, drawSelectionMerge, type Draw } from './marketing/AnimatedCanvas';
import { BackToTop, CountUp, Reveal, StickyCta, UseCaseCarousel } from './marketing/widgets';
import { FEATURES, HERO } from './marketing/content';
import { useCatalogSummary, useDocumentMeta } from './marketing/site';
import { useRevealOnScroll } from './marketing/hooks';
import { POST_TYPE_LABEL, POST_TYPE_SEGMENT, POST_TYPES, publishedPosts, type Post, type PostType } from './posts';
import { postHref } from './router';

/*
 * Home page of the public site. It is the production landing page, and it links to the calculator
 * dashboard at #/calculator. Sections, top to bottom:
 *   hero (canvas background, live counts), alternating feature rows (parallax images),
 *   the scroll-driven journey, use-case carousel, latest blog posts, and a call to action.
 */

function latestPostOf(type: PostType): Post | undefined {
  return publishedPosts(type)[0];
}

const FEATURE_VISUALS: Record<'indicators' | 'selection' | 'boundary', { draw: Draw }> = {
  indicators: { draw: drawIndicatorBars },
  selection: { draw: drawSelectionMerge },
  boundary: { draw: drawBrowserBoundary },
};

export default function LandingPage() {
  const catalog = useCatalogSummary();
  const latest = POST_TYPES.map((type) => ({ type, post: latestPostOf(type) }));
  useDocumentMeta(
    'Environmental Impact Analyzer',
    'Published apparel and footwear process factors, with all 16 EF 3.1 indicators kept separate on every row. Scope is stated on every result.',
  );
  useRevealOnScroll();

  return (
    <SiteLayout current="home" variant="landing" sourceVersion={catalog.sourceVersion} totalRecords={catalog.totalRecords}>
      <div className="marketing">
        <section className="mkt-hero" aria-labelledby="hero-title">
          <ParticleHero />
          <div className="mkt-copy mkt-reveal">
            <p className="mkt-eyebrow">{HERO.eyebrow}</p>
            <Typography id="hero-title" component="h1" className="mkt-title">
              {HERO.title}
            </Typography>
            <Typography className="mkt-lede">{HERO.lede}</Typography>
            <div className="mkt-actions">
              <a className="landing-button landing-button-primary" href="#/calculator">
                Open the calculator <ArrowForwardRoundedIcon fontSize="small" />
              </a>
              <a className="landing-button landing-button-ghost" href="#/method">
                How the method works
              </a>
            </div>
            <ul className="hero-trust" aria-label="Commitments">
              {HERO.trust.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mkt-art reveal" style={{ transitionDelay: '120ms' }}>
            <AnimatedCanvas draw={drawProcessChain} className="mkt-hero-canvas" />
          </div>
        </section>

        <section id="stats" className="section stats-section" aria-labelledby="stats-title">
          <Reveal>
            <p className="section-eyebrow">By the numbers</p>
            <h2 id="stats-title" className="section-title">What the bundled catalog holds</h2>
          </Reveal>
          <dl className="stat-grid">
            <Reveal className="stat-card" delay={0}>
              <dt>Published process factors</dt>
              <dd className="stat-value">
                <CountUp to={catalog.totalRecords} />
              </dd>
              <dd className="stat-note">Pinned to source release {catalog.sourceVersion}</dd>
            </Reveal>
            <Reveal className="stat-card" delay={80}>
              <dt>Selectable factor groups</dt>
              <dd className="stat-value">
                <CountUp to={catalog.groups} />
              </dd>
              <dd className="stat-note">Families and reference units kept as published</dd>
            </Reveal>
            <Reveal className="stat-card" delay={160}>
              <dt>EF 3.1 indicators per row</dt>
              <dd className="stat-value">
                <CountUp to={16} />
              </dd>
              <dd className="stat-note">Shown separately for every process row</dd>
            </Reveal>
            <Reveal className="stat-card" delay={240}>
              <dt>Process rows per estimate</dt>
              <dd className="stat-value">
                <CountUp to={25} />
              </dd>
              <dd className="stat-note">Maximum selections in one calculation</dd>
            </Reveal>
          </dl>
        </section>

        {FEATURES.map((feature, index) => (
          <section
            key={feature.title}
            className={`section feature-row${index % 2 === 1 ? ' feature-row-reverse' : ''}`}
            aria-labelledby={`feature-${index}-title`}
          >
            <Reveal className="feature-copy">
              <p className="section-eyebrow">{feature.eyebrow}</p>
              <h2 id={`feature-${index}-title`} className="section-title">
                {feature.title}
              </h2>
              <p className="section-body">{feature.body}</p>
              <ul className="feature-list">
                {feature.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="feature-visual" delay={120}>
              <AnimatedCanvas
                draw={FEATURE_VISUALS[feature.visual].draw}
                className="feature-canvas"
              />
            </Reveal>
          </section>
        ))}

        <section className="section section-alt" aria-labelledby="use-cases-title">
          <Reveal>
            <p className="section-eyebrow">Where teams use it</p>
            <h2 id="use-cases-title" className="section-title">Three ways to put the rows to work</h2>
          </Reveal>
          <Reveal delay={100}>
            <UseCaseCarousel />
          </Reveal>
        </section>

        <section className="section latest-section" aria-labelledby="latest-heading">
          <Reveal>
            <h2 id="latest-heading" className="section-title">Latest from the blogs</h2>
          </Reveal>
          <ul className="latest-list">
            {latest.map(({ type, post }) => (
              <li key={type} className="latest-item">
                <Reveal>
                  <span className="latest-type">{POST_TYPE_LABEL[type]}</span>
                  {post ? (
                    <a href={postHref(post)} {...(post.externalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {post.title}
                      {post.externalUrl ? <span className="sr-only"> (opens in a new tab)</span> : null}
                    </a>
                  ) : (
                    <a href={`#/blogs/${POST_TYPE_SEGMENT[type]}`}>No {POST_TYPE_LABEL[type].toLowerCase()} published yet</a>
                  )}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section className="cta-band" aria-labelledby="cta-title">
          <Reveal>
            <h2 id="cta-title" className="section-title">Start with one process row</h2>
            <p className="section-body">Open the calculator, choose a published factor, and read its 16 indicators before you add a second row.</p>
            <div className="mkt-actions">
              <a className="landing-button landing-button-primary" href="#/calculator">Open the calculator</a>
              <a className="landing-button landing-button-ghost" href="#/pricing">See plans</a>
            </div>
          </Reveal>
        </section>
      </div>
      <StickyCta />
      <BackToTop />
    </SiteLayout>
  );
}
