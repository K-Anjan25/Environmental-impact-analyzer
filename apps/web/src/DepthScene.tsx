import { useEffect, useRef } from 'react';

/*
 * The EcoImpact journey: five full-size cards that stack over one another as you scroll.
 * Each card splits into a text panel and an image panel. Cards cross-fade; nothing slides.
 * Timing and layout are described in docs/landing-journey-storyboard.md.
 */

type Slide = {
  title: string;
  body: string;
  image: string;
  alt: string;
  cta?: { label: string; href: string };
};

const SLIDES: Slide[] = [
  {
    title: 'Follow one process',
    body: 'Scroll to walk through a single process, from the first choice to its indicator reading.',
    image: '/images/journey/journey-turbine.png',
    alt: 'A white wind turbine on a plain studio background.',
  },
  {
    title: 'Choose a process',
    body: 'Search the published apparel and footwear factors by process family and source geography.',
    image: '/images/journey/journey-globe.png',
    alt: 'A glass globe with glowing green points on a plain studio background.',
  },
  {
    title: 'Enter quantities',
    body: 'Each quantity is converted to the factor reference unit before any calculation runs.',
    image: '/images/journey/journey-quantities.png',
    alt: 'A digital scale with stacked cardboard boxes on a plain studio background.',
  },
  {
    title: 'Read the indicators',
    body: 'See all 16 EF 3.1 indicators on their own lines, with the unit shown beside each value.',
    image: '/images/journey/journey-indicators.png',
    alt: 'An instrument gauge cluster with teal and lime dials on a plain studio background.',
  },
  {
    title: 'Start an estimate',
    body: 'Enter your own processes and quantities to see their indicator results.',
    image: '/images/journey/journey-closing.png',
    alt: 'A green seedling sprouting from soil in a glass jar on a plain studio background.',
    cta: { label: 'Start an estimate', href: '#process-library' },
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/*
 * Binary, sequential transitions: exactly one step is active at a time.
 * The outgoing step fades out completely, then the next step fades in.
 * CSS delays the incoming fade, so two steps are never visible together.
 * Timing is in docs/landing-journey-storyboard.md.
 */
export default function DepthScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    let activeIndex = -1;

    const activeFor = (progress: number) => Math.round(clamp(progress, 0, 1) * (SLIDES.length - 1));

    const apply = (index: number) => {
      if (index === activeIndex) return;
      activeIndex = index;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const isActive = i === index;
        card.classList.toggle('is-active', isActive);
        card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      apply(activeFor(progress));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="depth-scene" aria-label="Walk through one process, step by step">
      <div className="depth-stage">
        {SLIDES.map((slide, index) => (
          <article
            key={slide.title}
            className="depth-card"
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
          >
            <div className="depth-copy">
              <h2>{slide.title}</h2>
              <p>{slide.body}</p>
              {slide.cta ? (
                <a className="depth-cta" href={slide.cta.href}>
                  {slide.cta.label}
                </a>
              ) : null}
            </div>
            <div className="depth-art">
              <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
