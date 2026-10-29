import { useEffect, useState, type RefObject } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** True when the visitor asks for less motion in their operating system settings. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true);

  useEffect(() => {
    const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
    if (!query) return undefined;
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Adds `is-visible` to each `.mkt-reveal` element inside the given root once it enters the viewport.
 * Without IntersectionObserver, every element is shown at once. The CSS also shows everything
 * immediately under reduced motion, so this hook does no work in that case.
 */
export function useRevealOnScroll(rootSelector = '.marketing'): void {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`${rootSelector} .mkt-reveal:not(.is-visible)`));
    if (elements.length === 0) return undefined;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rootSelector]);
}

/**
 * Scroll-driven parallax for a single element. It moves the element a small amount relative to
 * the page scroll, using requestAnimationFrame. It does nothing under reduced motion.
 */
export function useParallax(ref: RefObject<HTMLElement | null>, strength = 0.08): void {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const offset = (centre - window.innerHeight / 2) * -strength;
      element.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ref, reduced, strength]);
}

/** Tracks whether the page has scrolled past a pixel threshold. Used by the sticky CTA and back-to-top. */
export function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setPast(window.scrollY > threshold);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}
