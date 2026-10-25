import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

/*
 * Canvas hero background: a slow field of drifting points joined by faint lines.
 * Under reduced motion, it draws one still frame and does not animate.
 * The canvas is decorative (aria-hidden), and the text it sits behind carries all the content.
 */

type Point = { x: number; y: number; vx: number; vy: number };

const LINK_DISTANCE = 130;

export default function ParticleHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let points: Point[] = [];
    let frame = 0;

    const seed = () => {
      // Fewer points on small screens keeps the frame cost low.
      const count = Math.min(70, Math.max(24, Math.round((width * height) / 22000)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      seed();
      draw();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1;
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j += 1) {
          const b = points[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < LINK_DISTANCE) {
            context.strokeStyle = `rgba(183, 230, 200, ${(1 - distance / LINK_DISTANCE) * 0.35})`;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }
      context.fillStyle = 'rgba(214, 245, 226, 0.75)';
      for (const point of points) {
        context.beginPath();
        context.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
        context.fill();
      }
    };

    const step = () => {
      for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;
      }
      draw();
      frame = window.requestAnimationFrame(step);
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) frame = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', resize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
