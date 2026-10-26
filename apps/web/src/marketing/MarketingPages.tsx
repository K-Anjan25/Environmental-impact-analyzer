import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import SiteLayout from '../SiteLayout';
import { BackToTop, FaqAccordion, Reveal, StickyCta } from './widgets';
import ContactForm from './ContactForm';
import {
  CONTACT_EMAIL,
  FAQS,
  METHOD_SOURCES,
  METHOD_STEPS,
  PRICING_IS_FINAL,
  PRICING_TIERS,
  SCOPE_ROWS,
  GITHUB_URL,
  ISSUES_URL,
} from './content';
import { useCatalogSummary, useDocumentMeta } from './site';
import { useRevealOnScroll } from './hooks';

/*
 * The method, pricing, and contact pages. Each one is a route under the landing shell:
 * #/method, #/pricing, and #/contact. The home page is in LandingPage.tsx.
 */

/** Shared landing shell for a marketing page: heading, sections, and the floating controls. */
function MarketingShell({
  current,
  title,
  description,
  children,
}: {
  current: 'method' | 'pricing' | 'contact';
  title: string;
  description: string;
  children: ReactNode;
}) {
  const catalog = useCatalogSummary();
  useDocumentMeta(title, description);
  useRevealOnScroll();
  return (
    <SiteLayout current={current} variant="landing" sourceVersion={catalog.sourceVersion} totalRecords={catalog.totalRecords}>
      <div className="marketing">{children}</div>
      <StickyCta />
      <BackToTop />
    </SiteLayout>
  );
}

export function MethodPage() {
  return (
    <MarketingShell
      current="method"
      title="Method and scope"
      description="How the calculator turns a published process row into a selected-row subtotal and an EF 3.1 score, and what each result leaves out."
    >
      <section className="page-hero" aria-labelledby="method-title">
        <Reveal>
          <p className="section-eyebrow">Method</p>
          <Typography id="method-title" component="h1" className="mkt-page-title">
            From one process to a stated result
          </Typography>
          <Typography className="section-body">
            Every number traces back to a published row, its source unit, and its boundary. Nothing is filled in to make a total look complete.
          </Typography>
        </Reveal>
      </section>

      <section className="section" aria-labelledby="steps-title">
        <Reveal>
          <h2 id="steps-title" className="section-title">The five steps</h2>
        </Reveal>
        <ol className="step-list">
          {METHOD_STEPS.map((step, i) => (
            <li key={step.title} className="step-item">
              <Reveal delay={i * 60}>
                <span className="step-number" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-alt" aria-labelledby="scope-title">
        <Reveal>
          <h2 id="scope-title" className="section-title">What each part covers</h2>
          <p className="section-body">The table states what each part of the result covers and what it does not. Read it before you publish a number.</p>
        </Reveal>
        <div className="table-scroll">
          <table className="scope-table">
            <caption className="sr-only">Coverage and exclusions for each part of a result</caption>
            <thead>
              <tr>
                <th scope="col">Part of the result</th>
                <th scope="col">What it covers</th>
                <th scope="col">What it does not cover</th>
              </tr>
            </thead>
            <tbody>
              {SCOPE_ROWS.map((row) => (
                <tr key={row.item}>
                  <th scope="row">{row.item}</th>
                  <td>{row.covered}</td>
                  <td>{row.notCovered}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" aria-labelledby="sources-title">
        <Reveal>
          <h2 id="sources-title" className="section-title">Sources and licences</h2>
          <p className="section-body">
            The published scores are used under CC BY-SA 4.0 and are pinned to a specific release. The normalisation and weighting factors come from the JRC EF 3.1 method documents.
          </p>
          <ul className="source-list">
            {METHOD_SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} target="_blank" rel="noopener noreferrer">
                  {source.label} <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="section-body">
            Source code and the issue tracker are on{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub<span className="sr-only"> (opens in a new tab)</span></a>.{' '}
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Report a problem<span className="sr-only"> (opens in a new tab)</span></a>.
          </p>
        </Reveal>
      </section>

      <section className="cta-band" aria-labelledby="method-cta-title">
        <Reveal>
          <h2 id="method-cta-title" className="section-title">Read the scope before you publish a number</h2>
          <div className="mkt-actions">
            <a className="landing-button landing-button-primary" href="#/calculator">Start an estimate</a>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}

export function PricingPage() {
  return (
    <MarketingShell
      current="pricing"
      title="Plans"
      description="Plans for the EcoImpact Lab calculator. The calculator and its 302-row catalog are available now."
    >
      <section className="page-hero" aria-labelledby="pricing-title">
        <Reveal>
          <p className="section-eyebrow">Plans</p>
          <Typography id="pricing-title" component="h1" className="mkt-page-title">
            Plans that match how you estimate
          </Typography>
          <Typography className="section-body">
            The calculator is available to everyone. Paid plans add team features on top of the same method and scope rules.
          </Typography>
          {!PRICING_IS_FINAL && (
            <p className="pricing-note" role="note">
              Plan names, prices, and features are placeholders and are not final. Do not quote them until the plans are confirmed.
            </p>
          )}
        </Reveal>
      </section>

      <section className="section" aria-labelledby="plans-title">
        <h2 id="plans-title" className="sr-only">Plans</h2>
        <div className="table-scroll">
          <table className="pricing-table">
            <caption className="sr-only">Comparison of plans</caption>
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Feature</span></th>
                {PRICING_TIERS.map((tier) => (
                  <th scope="col" key={tier.name}>
                    <span className="tier-name">{tier.name}</span>
                    <span className="tier-price">{tier.price}</span>
                    {tier.cadence && <span className="tier-cadence">{tier.cadence}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Who it is for</th>
                {PRICING_TIERS.map((tier) => (
                  <td key={tier.name}>{tier.audience}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">Included</th>
                {PRICING_TIERS.map((tier) => (
                  <td key={tier.name}>
                    <ul className="tier-list">
                      {tier.rows.map((row) => (
                        <li key={row}>{row}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">Get started</th>
                {PRICING_TIERS.map((tier) => (
                  <td key={tier.name}>
                    <a className="landing-button landing-button-ghost" href={tier.cta.href}>{tier.cta.label}</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="faq-title">
        <Reveal>
          <h2 id="faq-title" className="section-title">Questions about data, scope, and limits</h2>
          <p className="section-body">{FAQS.length} common questions, answered from the bundled source and the method notes.</p>
        </Reveal>
        <Reveal delay={100}>
          <FaqAccordion />
        </Reveal>
      </section>
    </MarketingShell>
  );
}

export function ContactPage() {
  return (
    <MarketingShell
      current="contact"
      title="Contact"
      description="Contact EcoImpact Lab about data questions, bug reports, and pilots. The form checks your message before you send it."
    >
      <section className="page-hero" aria-labelledby="contact-title">
        <Reveal>
          <p className="section-eyebrow">Contact</p>
          <Typography id="contact-title" component="h1" className="mkt-page-title">
            Talk to the team
          </Typography>
          <Typography className="section-body">
            Ask about the data, report a problem, or discuss a pilot. Replies come from the same people who maintain the method notes.
          </Typography>
        </Reveal>
      </section>

      <section className="section contact-layout" aria-label="Contact options">
        <Reveal className="contact-main">
          <ContactForm />
        </Reveal>
        <Reveal className="contact-aside" delay={120}>
          <aside aria-labelledby="info-title">
            <h2 id="info-title" className="section-title small">Other ways to reach us</h2>
            <ul className="contact-options">
              <li>
                <strong>Report an issue</strong>
                <span>Bugs and data questions go to the public issue tracker. Keep personal details out.</span>
                <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">Open an issue <span className="sr-only">(opens in a new tab)</span></a>
              </li>
              <li>
                <strong>Source code</strong>
                <span>The calculator and the data pipeline are public.</span>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">View on GitHub <span className="sr-only">(opens in a new tab)</span></a>
              </li>
              {CONTACT_EMAIL && (
                <li>
                  <strong>Email</strong>
                  <span>For private questions that cannot go in a public issue.</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
              )}
            </ul>
            <p className="section-body">
              This site does not run analytics or advertising trackers, and it does not send your message to our servers. Read the{' '}
              <a href="#/legal/privacy">privacy policy</a>.
            </p>
          </aside>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
