import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, IconButton, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import { useScrolledPast, usePrefersReducedMotion } from './hooks';
import { FAQS, USE_CASES, type Faq } from './content';

/* ---------- Animated counter ---------- */

/**
 * Counts from 0 to `to` once the element scrolls into view. The screen-reader text is always the
 * final value, so assistive technology does not announce the intermediate frames.
 */
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(reduced ? to : 0);
  const started = useRef(false);
  const current = useRef(0);

  useEffect(() => {
    if (reduced) {
      setShown(to);
      current.current = to;
      return undefined;
    }
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) {
      setShown(to);
      return undefined;
    }

    let frame = 0;
    const animate = (target: number) => {
      const from = started.current ? current.current : 0;
      const duration = 1100;
      const begin = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - begin) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (target - from) * eased);
        current.current = value;
        setShown(value);
        if (progress < 1) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    };

    if (started.current) {
      // The target changed after the first run (for example, when the live catalog loads).
      animate(to);
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      started.current = true;
      observer.disconnect();
      animate(to);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [to, reduced]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {shown.toLocaleString('en-IN')}
        {suffix}
      </span>
      <span className="sr-only">
        {to.toLocaleString('en-IN')}
        {suffix}
      </span>
    </>
  );
}

/* ---------- Carousel of use cases ---------- */

const USE_CASE_ICONS = {
  search: SearchRoundedIcon,
  build: BuildRoundedIcon,
  description: DescriptionRoundedIcon,
} as const;

/**
 * Carousel of use cases, with previous and next buttons and dot buttons. It follows the ARIA
 * carousel pattern: each slide is a labelled group, and the dots are named buttons.
 */
export function UseCaseCarousel() {
  const [index, setIndex] = useState(0);
  const count = USE_CASES.length;
  const go = (next: number) => setIndex(((next % count) + count) % count);

  return (
    <section className="carousel" aria-roledescription="carousel" aria-label="Where teams use the calculator">
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {USE_CASES.map((item, i) => {
            const Icon = USE_CASE_ICONS[item.icon];
            return (
              <article
                key={item.title}
                className="carousel-slide"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}: ${item.title}`}
                aria-hidden={i !== index}
              >
                <span className="carousel-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
      <div className="carousel-controls">
        <IconButton className="carousel-button" aria-label="Previous use case" onClick={() => go(index - 1)}>
          <ChevronLeftRoundedIcon />
        </IconButton>
        <div className="carousel-dots">
          {USE_CASES.map((item, i) => (
            <button
              key={item.title}
              type="button"
              className="carousel-dot"
              aria-label={`Show ${item.title}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <IconButton className="carousel-button" aria-label="Next use case" onClick={() => go(index + 1)}>
          <ChevronRightRoundedIcon />
        </IconButton>
      </div>
    </section>
  );
}

/* ---------- FAQ accordion ---------- */

/** One open panel at a time. MUI Accordion provides the button, aria-expanded, and region wiring. */
export function FaqAccordion({ items = FAQS }: { items?: Faq[] }) {
  const [open, setOpen] = useState<number | false>(0);
  return (
    <div className="faq-list">
      {items.map((item, i) => (
        <Accordion
          key={item.question}
          disableGutters
          elevation={0}
          expanded={open === i}
          onChange={(_event, expanded) => setOpen(expanded ? i : false)}
          className="faq-item"
        >
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} id={`faq-${i}-header`} aria-controls={`faq-${i}-panel`}>
            <Typography component="h3" className="faq-question">
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails id={`faq-${i}-panel`} role="region" aria-labelledby={`faq-${i}-header`}>
            <Typography className="faq-answer">{item.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}

/* ---------- Floating controls ---------- */

/** Appears after the visitor scrolls past the hero. Moves focus to the top of the page on use. */
export function BackToTop() {
  const visible = useScrolledPast(600);
  const reduced = usePrefersReducedMotion();
  const onClick = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  };
  return (
    <button
      type="button"
      className={`to-top${visible ? ' is-visible' : ''}`}
      onClick={onClick}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <ArrowUpwardRoundedIcon />
    </button>
  );
}

/** A persistent call to action that links to the calculator. It appears once the hero has scrolled away. */
export function StickyCta() {
  const visible = useScrolledPast(520);
  return (
    <a
      className={`sticky-cta${visible ? ' is-visible' : ''}`}
      href="#/calculator"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <CalculateRoundedIcon fontSize="small" />
      <span>Open calculator</span>
    </a>
  );
}

/** Wraps children in a section that reveals on scroll. The class is applied by useRevealOnScroll. */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`mkt-reveal ${className}`.trim()} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
