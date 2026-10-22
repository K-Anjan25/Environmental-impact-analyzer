import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import { getFactorCatalog, type FactorCatalog } from './api';
import DepthScene from './DepthScene';
import SiteLayout from './SiteLayout';
import { POST_TYPE_LABEL, POST_TYPE_SEGMENT, POST_TYPES, publishedPosts, type Post, type PostType } from './posts';
import { postHref } from './router';

function latestPostOf(type: PostType): Post | undefined {
  return publishedPosts(type)[0];
}

export default function LandingPage() {
  const [catalog, setCatalog] = useState<FactorCatalog | null>(null);
  const [latest] = useState(() => POST_TYPES.map((type) => ({ type, post: latestPostOf(type) })));

  useEffect(() => {
    let current = true;
    getFactorCatalog()
      .then((response) => {
        if (current) setCatalog(response);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, []);

  return (
    <SiteLayout current="home" sourceVersion={catalog?.source_version ?? '1.1.0'} totalRecords={catalog?.total_records ?? '302'}>
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-copy">
          <p className="landing-eyebrow">ENVIRONMENTAL IMPACT ANALYZER</p>
          <Typography id="hero-title" component="h1" className="landing-title">
            Measure the impact behind <span className="hero-title-accent">every process</span>
          </Typography>
          <Typography className="landing-lede">
            EcoImpact Lab compares published apparel and footwear factors across 16 EF 3.1 indicators, with source units and boundaries in view.
          </Typography>
          <a className="landing-cta" href="#/calculator">Open the calculator <ArrowDownwardRoundedIcon /></a>
          <dl className="landing-stats">
            <div><dt>{catalog?.total_records ?? '—'}</dt><dd>published factors</dd></div>
            <div><dt>{catalog?.families.length ?? '—'}</dt><dd>selectable groups</dd></div>
            <div><dt>16</dt><dd>EF 3.1 indicators</dd></div>
          </dl>
        </div>
        <figure className="landing-art">
          <img
            className="hero-photo"
            src="/images/hero-environment.png"
            alt="A restored river valley with a planted hillside, a solar-roofed building, and a clear sky."
            fetchPriority="high"
          />
        </figure>
      </section>

      <DepthScene />

      <section className="visual-index" aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="visual-index-heading">Latest from the blogs</h2>
        <div className="visual-index-grid">
          {latest.map(({ type, post }) =>
            post ? (
              <a
                key={type}
                className="visual-index-card"
                href={postHref(post)}
                {...(post.externalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {post.image ? <img src={post.image} alt="" loading="lazy" /> : null}
                <span className="visual-index-shade" />
                <span className="visual-index-copy">
                  <small>{POST_TYPE_LABEL[type].toUpperCase()}</small>
                  <strong>{post.title}</strong>
                </span>
                <span className="visual-index-arrow" aria-hidden="true">↗</span>
              </a>
            ) : (
              <a key={type} className="visual-index-card visual-index-empty" href={`#/blogs/${POST_TYPE_SEGMENT[type]}`}>
                <span className="visual-index-copy">
                  <small>{POST_TYPE_LABEL[type].toUpperCase()}</small>
                  <strong>No {POST_TYPE_LABEL[type].toLowerCase()} published yet</strong>
                </span>
              </a>
            ),
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
