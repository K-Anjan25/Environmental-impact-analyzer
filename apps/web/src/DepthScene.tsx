import { useEffect, useRef, useState } from 'react';

/*
 * The EcoImpact journey: five slides that move through the page as you scroll.
 * Each slide is a flat card (text and image in separate columns, never overlapping).
 * Scroll position maps to a continuous progress value; each slide's transform is
 * derived from its distance to that value, so the incoming slide rises from below
 * while the outgoing slide recedes and dims. No 3D objects, no timers, no fades.
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
    cta: { label: 'Start an estimate', href: '#/calculator' },
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Slide transform for a card at signed distance d from the active slide (0 = active).
 * Cards move vertically by whole viewport heights, so an outgoing card leaves the stage
 * as the incoming card enters: their rectangles never overlap. A slight scale-down with
 * distance adds depth without any 3D transform.
 */
export function slideLayer(d: number): { transform: string; zIndex: number } {
  const distance = clamp(Math.abs(d), 0, 1);
  return {
    transform: `translate3d(0, ${d * 100}vh, 0) scale(${1 - distance * 0.03})`,
    zIndex: Math.max(1, 10 - Math.round(Math.abs(d) * 10)),
  };
}

export default function DepthScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const ratio = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      setProgress(ratio * (SLIDES.length - 1));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    SLIDES.forEach((slide) => {
      const preload = new Image();
      preload.src = slide.image;
    });
  }, []);

  const active = Math.round(progress);

  return (
    <section ref={sectionRef} className="depth-scene" aria-label="Walk through one process, step by step">
      <div className="depth-stage">
        {SLIDES.map((slide, index) => {
          const layer = reduced
            ? { transform: 'none', zIndex: index === active ? 10 : 0 }
            : slideLayer(index - progress);
          const isActive = index === active;
          return (
            <article
              key={slide.title}
              className={`depth-card${isActive ? ' is-active' : ''}`}
              style={{ transform: layer.transform, zIndex: layer.zIndex, visibility: reduced ? (isActive ? 'visible' : 'hidden') : Math.abs(index - progress) >= 1 ? 'hidden' : 'visible' }}
              aria-hidden={!isActive}
              inert={!isActive}
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
                <img src={slide.image} alt={isActive ? slide.alt : ''} decoding="async" loading={index === 0 ? 'eager' : 'lazy'} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
