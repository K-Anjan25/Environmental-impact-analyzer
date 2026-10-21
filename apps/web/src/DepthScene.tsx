import { useEffect, useRef } from 'react';

/*
 * The EcoImpact journey: five slides along one scroll.
 * Each slide has an isolated studio image on the right and a text card on the left.
 * Slides hand over one at a time, with depth transitions driven by scroll.
 * Timing is described in docs/landing-journey-storyboard.md.
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
const slideCentre = (index: number) => index / (SLIDES.length - 1);

// Text is fully visible within ±0.05 of a slide centre and gone beyond ±0.10,
// so neighbouring cards are never on screen together.
const textWeight = (p: number, index: number) => {
  const distance = Math.abs(p - slideCentre(index));
  return 1 - smooth(clamp((distance - 0.05) / 0.05, 0, 1));
};

// The image grows in over the 0.25 before its slide centre and out after it.
const imageWeight = (p: number, index: number) =>
  smooth(clamp(1 - Math.abs(p - slideCentre(index)) / 0.25, 0, 1));

export default function DepthScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const artRefs = useRef<(HTMLElement | null)[]>([]);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const backdrop = backdropRef.current;
    if (!section || !stage || !backdrop) return undefined;

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
      section.style.setProperty('--depth-p', progress.toFixed(3));
    };

    // Paint one state: text cards, images, dots, and the backdrop parallax.
    const paint = (p: number) => {
      SLIDES.forEach((_, index) => {
        const text = textRefs.current[index];
        const art = artRefs.current[index];
        const dot = dotRefs.current[index];
        const w = textWeight(p, index);
        const e = imageWeight(p, index);
        if (text) {
          text.style.opacity = w.toFixed(3);
          text.style.transform = `translate3d(0, ${((1 - w) * 22).toFixed(1)}px, 0)`;
        }
        if (art) {
          // Depth: the image rises from below and comes forward out of the back plane.
          art.style.opacity = e.toFixed(3);
          art.style.transform = `translate3d(${((1 - e) * -40).toFixed(1)}px, ${((1 - e) * 36).toFixed(1)}px, ${((e - 1) * 220).toFixed(1)}px) scale(${(0.9 + 0.1 * e).toFixed(3)}) rotateY(${((1 - e) * -10).toFixed(2)}deg)`;
          art.style.visibility = e > 0.01 ? 'visible' : 'hidden';
        }
        if (dot) {
          dot.style.opacity = (0.3 + 0.7 * w).toFixed(3);
          dot.style.transform = `scale(${(1 + 0.4 * w).toFixed(3)})`;
        }
      });
      // Backdrop moves slowest, so it reads as the farthest layer.
      backdrop.style.transform = `translate3d(0, ${((0.5 - p) * 60).toFixed(1)}px, 0) scale(1.08)`;
    };

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Frame-rate independent easing, so the slides settle at the same speed on any device.
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
      <div ref={stageRef} className="depth-stage">
        <div ref={backdropRef} className="depth-backdrop" aria-hidden="true" />
        {SLIDES.map((slide, index) => (
          <figure
            key={slide.title}
            className="depth-art"
            ref={(element) => {
              artRefs.current[index] = element;
            }}
          >
            <img src={slide.image} alt={slide.alt} loading="lazy" decoding="async" />
          </figure>
        ))}
        <div className="depth-copy">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className="depth-step"
              ref={(element) => {
                textRefs.current[index] = element;
              }}
            >
              <h2>{slide.title}</h2>
              <p>{slide.body}</p>
              {slide.cta ? (
                <a className="depth-cta" href={slide.cta.href}>
                  {slide.cta.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
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
