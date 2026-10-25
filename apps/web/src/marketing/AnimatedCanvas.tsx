import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

/*
 * Canvas illustrations for the landing page. They replace the photographs.
 * Each one is a small drawing function that receives the context, the time in seconds, and the
 * canvas size. The loop runs only while the canvas is on screen, and under reduced motion a single
 * still frame is drawn. The drawings are decorative: they show no measured values.
 */

export type Draw = (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;

const PALETTE = {
  ink: '#e8f6ee',
  dim: 'rgba(200, 232, 214, 0.42)',
  lane: 'rgba(127, 217, 160, 0.35)',
  accent: '#7fd9a0',
  citrus: '#bfdc66',
  panel: 'rgba(255, 255, 255, 0.05)',
};

/** Draws `draw` on a canvas sized to its box, at the device pixel ratio, and animates it while visible. */
export function AnimatedCanvas({ draw, label, className = '' }: { draw: Draw; label: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      draw(ctx, reduced ? 0 : (now - start) / 1000, width, height);
    };

    const loop = (now: number) => {
      frame = 0;
      render(now);
      if (visible && !reduced) frame = window.requestAnimationFrame(loop);
    };

    resize();
    render(performance.now());

    // Pause the loop while the canvas is off screen, and restart it when it returns.
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !reduced && frame === 0) frame = window.requestAnimationFrame(loop);
    });
    observer.observe(canvas);
    if (!reduced) frame = window.requestAnimationFrame(loop);

    const onResize = () => {
      resize();
      render(performance.now());
    };
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [draw, reduced]);

  return <canvas ref={ref} className={`anim-canvas ${className}`.trim()} role="img" aria-label={label} />;
}

/* ---------- Hero: a process chain with particles flowing through selected rows ---------- */

export const drawProcessChain: Draw = (ctx, t, w, h) => {
  const labels = ['Process', 'Input', 'Output', 'Subtotal'];
  const nodes = labels.map((label, i) => {
    const x = w * (0.16 + i * 0.22);
    const y = h * (0.5 + Math.sin(i * 1.3) * 0.12);
    return { label, x, y };
  });

  // Lanes between the nodes, drawn as quadratic curves.
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.lane;
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - h * 0.18, b.x, b.y);
    ctx.stroke();
  }

  // Particles travel along each lane; their speed is slightly different so they do not bunch up.
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    for (let k = 0; k < 3; k += 1) {
      const progress = (t * (0.18 + i * 0.03) + k / 3) % 1;
      const u = progress;
      const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * ((a.x + b.x) / 2) + u * u * b.x;
      const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * ((a.y + b.y) / 2 - h * 0.18) + u * u * b.y;
      ctx.fillStyle = PALETTE.accent;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Nodes: rounded boxes that pulse in turn.
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  nodes.forEach((node, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 - i * 0.9);
    const bw = Math.min(118, w * 0.2);
    const bh = 46;
    ctx.fillStyle = `rgba(127, 217, 160, ${0.12 + pulse * 0.1})`;
    ctx.strokeStyle = `rgba(127, 217, 160, ${0.5 + pulse * 0.4})`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, node.x - bw / 2, node.y - bh / 2, bw, bh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText(node.label, node.x, node.y + 5);
  });

  // Caption: states what the drawing is.
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Illustration: flow only, not results', 16, h - 14);
};

/* ---------- Feature 1: sixteen indicator bars that breathe, one per EF 3.1 indicator ---------- */

const INDICATOR_CODES = ['ACD', 'ETF', 'FRU', 'FWE', 'GHG', 'HTC', 'HTN', 'IOR', 'LDU', 'MRU', 'OZD', 'PCO', 'PMA', 'SWE', 'TRE', 'WTU'];

export const drawIndicatorBars: Draw = (ctx, t, w, h) => {
  const count = INDICATOR_CODES.length;
  const padX = 22;
  const baseY = h - 42;
  const areaH = h - 90;
  const gap = (w - padX * 2) / count;
  const barW = Math.max(6, gap * 0.58);

  ctx.font = '500 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  INDICATOR_CODES.forEach((code, i) => {
    // Each bar has its own phase, so the bars rise and fall out of step.
    const wave = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.7) * Math.cos(t * 0.45 + i * 0.31);
    const bh = areaH * (0.25 + wave * 0.7);
    const x = padX + i * gap + (gap - barW) / 2;
    // All bars share one colour, so no indicator is emphasised.
    ctx.fillStyle = `rgba(127, 217, 160, ${0.35 + wave * 0.4})`;
    roundRect(ctx, x, baseY - bh, barW, bh, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(code, x + barW / 2, h - 20);
  });

  ctx.strokeStyle = 'rgba(232, 246, 238, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, baseY + 0.5);
  ctx.lineTo(w - padX, baseY + 0.5);
  ctx.stroke();
};

/* ---------- Feature 2: rows are selected, and their values merge into one subtotal bar ---------- */

export const drawSelectionMerge: Draw = (ctx, t, w, h) => {
  const rows = 6;
  const left = 24;
  const rowW = w * 0.5;
  const rowH = Math.min(30, (h - 60) / rows - 8);
  const top = 28;
  const cycle = 7; // seconds per cycle
  const phase = (t % cycle) / cycle;

  // Selection moves from row to row, so the subtotal changes over time.
  const selectedCount = phase < 0.5 ? Math.round(1 + phase * 2 * 3) : Math.round(4 - (phase - 0.5) * 2 * 3);
  ctx.font = '500 11px system-ui, sans-serif';
  for (let i = 0; i < rows; i += 1) {
    const y = top + i * (rowH + 8);
    const selected = i < selectedCount;
    ctx.fillStyle = selected ? 'rgba(127, 217, 160, 0.22)' : PALETTE.panel;
    ctx.strokeStyle = selected ? PALETTE.accent : 'rgba(232, 246, 238, 0.16)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, left, y, rowW, rowH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = selected ? PALETTE.ink : PALETTE.dim;
    ctx.textAlign = 'left';
    ctx.fillText(`Row ${i + 1}`, left + 12, y + rowH / 2 + 4);
  }

  // Subtotal bar on the right grows with the selected count.
  const barX = left + rowW + 36;
  const barW = Math.max(40, w - barX - 24);
  const fill = selectedCount / rows;
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, barX, top, barW, rows * (rowH + 8) - 8, 12);
  ctx.fill();
  ctx.fillStyle = `rgba(191, 220, 102, ${0.5 + fill * 0.4})`;
  const fillH = (rows * (rowH + 8) - 8) * fill;
  roundRect(ctx, barX, top + (rows * (rowH + 8) - 8) - fillH, barW, fillH, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('Selected', barX + barW / 2, top + rows * (rowH + 8) + 6);
};

/* ---------- Feature 3: product inputs stay inside the browser boundary; nothing crosses it ---------- */

export const drawBrowserBoundary: Draw = (ctx, t, w, h) => {
  const x = 22;
  const y = 22;
  const bw = w - 44;
  const bh = h - 44;

  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(127, 217, 160, 0.7)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, bw, bh, 18);
  ctx.stroke();
  ctx.setLineDash([]);

  // Particles bounce inside the boundary. Each one has a fixed seed, so the motion is repeatable.
  for (let i = 0; i < 14; i += 1) {
    const sx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const sy = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const px = x + 16 + (Math.abs(sx) * 0.5 + 0.5 * Math.abs(Math.sin(t * (0.4 + i * 0.05) + i))) * (bw - 32);
    const py = y + 16 + (Math.abs(sy) * 0.5 + 0.5 * Math.abs(Math.cos(t * (0.35 + i * 0.04) + i * 2))) * (bh - 32);
    ctx.fillStyle = i % 3 === 0 ? PALETTE.citrus : PALETTE.accent;
    ctx.beginPath();
    ctx.arc(Math.min(px, x + bw - 10), Math.min(py, y + bh - 10), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // A dashed arrow tries to leave the boundary and stops at the edge.
  const reach = (Math.sin(t * 1.1) * 0.5 + 0.5) * 0.35;
  const startX = x + bw * 0.6;
  const endX = startX + bw * reach + bw * 0.25;
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = 'rgba(232, 246, 238, 0.45)';
  ctx.beginPath();
  ctx.moveTo(startX, y + bh / 2);
  ctx.lineTo(Math.min(endX, x + bw), y + bh / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = PALETTE.ink;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Your browser', x + 18, y + 26);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '500 12px system-ui, sans-serif';
  ctx.fillText('Product inputs stay here', x + 18, y + bh - 16);
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
