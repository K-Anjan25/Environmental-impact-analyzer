import { useEffect, useRef } from 'react';

/*
 * The EcoImpact journey: five full-size cards that stack over one another as you scroll.
 * Each card splits into a text panel and an image panel. The stage behind the cards is empty.
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
const smooth = (t: number) => t * t * (3 - 2 * t);

/*
 * Card i has a stack position r = progress * (N - 1) - i.
 * r < -1: not yet arrived, waiting below the stage.
 * -1 <= r < 0: sliding up over the previous card.
 * r >= 0: resting in the stack, pushed back and dimmed as newer cards cover it.
 */
const stackPosition = (p: number, index: number) => p * (SLIDES.length - 1) - index;

export default function DepthScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let progress = 0;
    let shown = 0;
    let frameId = 0;
    let last = performance.now();

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    };

    const paint = (p: number) => {
      SLIDES.forEach((_, index) => {
        const card = cardRefs.current[index];
        const dot = dotRefs.current[index];
        const r = stackPosition(p, index);
        if (card) {
          if (r < -1) {
            card.style.transform = 'translate3d(0, 100%, 0)';
            card.style.visibility = 'hidden';
            card.style.filter = 'none';
          } else if (r < 0) {
            const e = smooth(r + 1);
            card.style.transform = `translate3d(0, ${((1 - e) * 100).toFixed(2)}%, 0)`;
            card.style.visibility = 'visible';
            card.style.filter = 'none';
          } else {
            // Resting in the stack: recede slightly and dim as the next card covers it.
            const depth = Math.min(r, 1);
            card.style.transform = `translate3d(0, ${(-depth * 3).toFixed(2)}%, 0) scale(${(1 - 0.06 * depth).toFixed(4)})`;
            card.style.visibility = 'visible';
            card.style.filter = depth > 0 ? `brightness(${(1 - 0.5 * depth).toFixed(3)})` : 'none';
          }
        }
        if (dot) {
          const focus = clamp(1 - Math.abs(r), 0, 1);
          dot.style.opacity = (0.35 + 0.65 * focus).toFixed(3);
          dot.style.transform = `scale(${(1 + 0.4 * focus).toFixed(3)})`;
        }
      });
    };

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Frame-rate independent easing, so the stack settles at the same speed on any device.
      shown += (progress - shown) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 7));
      paint(shown);
    };

    const onScroll = () => readProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    readProgress();
    shown = progress;
    paint(progress);
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
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
            style={{ zIndex: index + 1 }}
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
        <div className="depth-dots" aria-hidden="true">
          {SLIDES.map((slide, index) => (
            <span
              key={slide.title}
              ref={(element) => {
                dotRefs.current[index] = element;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
