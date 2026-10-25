import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './hooks';

/*
 * Decorative 3D canvas scenes for the landing page.
 *
 * Every scene is pure motion: no text, no labels, no numbers. Each draw function receives the
 * 2D context, the time in seconds and the canvas size. Shapes are projected from simple 3D
 * coordinates with a small perspective camera and painted back to front, so they read as solid
 * objects. The loop runs only while the canvas is on screen; under reduced motion a single still
 * frame is drawn. The canvas is aria-hidden because the surrounding section text describes the
 * product.
 */

export type Draw = (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;

type Vec = [number, number, number];

/** Draws `draw` on a canvas sized to its box, at the device pixel ratio, and animates it while visible. */
export function AnimatedCanvas({ draw, className = '' }: { draw: Draw; className?: string }) {
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

  return <canvas ref={ref} className={`anim-canvas ${className}`.trim()} aria-hidden="true" />;
}

/* ---------- 3D helpers: rotation, perspective projection, and back-to-front solid faces ---------- */

const CAMERA_DISTANCE = 4.2;

interface View {
  cx: number;
  cy: number;
  unit: number;
  rx: number; // tilt around the X axis
  ry: number; // turn around the Y axis
}

function rotate([x, y, z]: Vec, { rx, ry }: Pick<View, 'rx' | 'ry'>): Vec {
  const x1 = x * Math.cos(ry) + z * Math.sin(ry);
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
  return [x1, y2, z2];
}

/** Projects a world point to the screen. Larger z is further from the camera, which sits at z = -CAMERA_DISTANCE. */
function project(p: Vec, view: View) {
  const [x, y, z] = rotate(p, view);
  const s = CAMERA_DISTANCE / (CAMERA_DISTANCE + z);
  return { x: view.cx + x * s * view.unit, y: view.cy - y * s * view.unit, z, s };
}

interface Solid {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  rgb: [number, number, number];
  alpha: number;
}

/** Paints the visible faces of axis-aligned boxes, farthest faces first. Back-facing faces are skipped. */
function drawSolids(ctx: CanvasRenderingContext2D, solids: Solid[], view: View) {
  const light: Vec = [-0.35, 0.8, -0.5];
  const faces: { pts: { x: number; y: number }[]; depth: number; shade: number; solid: Solid }[] = [];

  for (const s of solids) {
    const c = [
      [s.x0, s.y0, s.z0],
      [s.x1, s.y0, s.z0],
      [s.x1, s.y1, s.z0],
      [s.x0, s.y1, s.z0],
      [s.x0, s.y0, s.z1],
      [s.x1, s.y0, s.z1],
      [s.x1, s.y1, s.z1],
      [s.x0, s.y1, s.z1],
    ] as Vec[];
    const quads: { idx: number[]; normal: Vec }[] = [
      { idx: [0, 1, 2, 3], normal: [0, 0, -1] },
      { idx: [4, 5, 6, 7], normal: [0, 0, 1] },
      { idx: [3, 2, 6, 7], normal: [0, 1, 0] },
      { idx: [0, 1, 5, 4], normal: [0, -1, 0] },
      { idx: [1, 2, 6, 5], normal: [1, 0, 0] },
      { idx: [0, 3, 7, 4], normal: [-1, 0, 0] },
    ];
    for (const q of quads) {
      const n = rotate(q.normal, view);
      if (n[2] >= 0) continue; // faces away from the camera
      const pts = q.idx.map((i) => project(c[i], view));
      const depth = pts.reduce((sum, p) => sum + p.z, 0) / pts.length;
      const shade = 0.4 + 0.6 * Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]);
      faces.push({ pts, depth, shade, solid: s });
    }
  }

  faces.sort((a, b) => b.depth - a.depth);
  for (const f of faces) {
    const [r, g, b] = f.solid.rgb;
    ctx.beginPath();
    f.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(f.solid.alpha * f.shade).toFixed(3)})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(232, 246, 238, ${(0.12 * f.solid.alpha).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Points spread evenly over a sphere (Fibonacci lattice). Computed once. */
function fibonacciSphere(n: number): Vec[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const theta = i * golden;
    return [Math.cos(theta) * r, y, Math.sin(theta) * r] as Vec;
  });
}

const SPHERE = fibonacciSphere(240);
const ACCENT: [number, number, number] = [127, 217, 160];
const CITRUS: [number, number, number] = [191, 220, 102];

/* ---------- Hero: a rotating 3D particle globe with light travelling along an orbit ---------- */

export const drawProcessChain: Draw = (ctx, t, w, h) => {
  const view: View = { cx: w / 2, cy: h / 2, unit: Math.min(w, h) * 0.36, rx: 0.32, ry: t * 0.16 };

  const points = SPHERE.map((p) => project([p[0] * 0.92, p[1] * 0.92, p[2] * 0.92], view));

  // Links between neighbouring points. The lattice is ordered, so nearby indices are nearby in space.
  for (let i = 0; i < points.length; i += 1) {
    for (const step of [1, 9]) {
      const j = i + step;
      if (j >= points.length) continue;
      const a = points[i];
      const b = points[j];
      const depth = (a.s + b.s) / 2;
      ctx.strokeStyle = `rgba(${ACCENT.join(', ')}, ${(0.05 + (depth - 0.8) * 0.5).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Points, drawn far to near so the near ones sit on top.
  const sorted = [...points].sort((a, b) => b.z - a.z);
  for (const p of sorted) {
    const alpha = Math.min(1, 0.25 + (p.s - 0.8) * 1.6);
    ctx.fillStyle = `rgba(${ACCENT.join(', ')}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 * p.s, 0, Math.PI * 2);
    ctx.fill();
  }

  // An orbit ring tilted through the globe, with bright particles travelling around it.
  const ringView: View = { ...view, rx: view.rx + 0.5, ry: view.ry };
  const ring = (theta: number): Vec => [1.42 * Math.cos(theta), 0.5 * Math.sin(theta), 1.42 * Math.sin(theta)];
  ctx.strokeStyle = 'rgba(127, 217, 160, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let k = 0; k <= 96; k += 1) {
    const p = project(ring((k / 96) * Math.PI * 2), ringView);
    if (k === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  for (let k = 0; k < 4; k += 1) {
    const theta = (t * 0.9 + (k * Math.PI) / 2) % (Math.PI * 2);
    const p = project(ring(theta), ringView);
    ctx.fillStyle = `rgba(${CITRUS.join(', ')}, 0.95)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.4 * p.s, 0, Math.PI * 2);
    ctx.fill();
  }
};

/* ---------- Feature 1: sixteen 3D bars that breathe, one per EF 3.1 indicator ---------- */

const BAR_COUNT = 16;

export const drawIndicatorBars: Draw = (ctx, t, w, h) => {
  const view: View = {
    cx: w / 2,
    cy: h * 0.62,
    unit: Math.min(w * 0.8 / 2.6, h * 0.5),
    rx: 0.5,
    ry: -0.5 + 0.18 * Math.sin(t * 0.3),
  };

  // Floor grid, drawn first so the bars sit on it.
  ctx.strokeStyle = 'rgba(232, 246, 238, 0.12)';
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i += 1) {
    const a = project([i * 0.3, -0.62, -0.9], view);
    const b = project([i * 0.3, -0.62, 0.9], view);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const c = project([-1.3, -0.62, i * 0.3], view);
    const d = project([1.3, -0.62, i * 0.3], view);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }

  const solids: Solid[] = Array.from({ length: BAR_COUNT }, (_, i) => {
    // Each bar has its own phase, so the bars rise and fall out of step.
    const wave = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.7) * Math.cos(t * 0.45 + i * 0.31);
    const x = (i - (BAR_COUNT - 1) / 2) * 0.155;
    const height = 0.2 + wave * 0.9;
    return {
      x0: x - 0.055,
      x1: x + 0.055,
      y0: -0.62,
      y1: -0.62 + height,
      z0: -0.055,
      z1: 0.055,
      rgb: ACCENT,
      alpha: 0.55 + wave * 0.35,
    };
  });
  drawSolids(ctx, solids, view);
};

/* ---------- Feature 2: rows lift forward as they are selected, and a 3D column fills with their sum ---------- */

export const drawSelectionMerge: Draw = (ctx, t, w, h) => {
  const rows = 6;
  const cycle = 8; // seconds per full selection cycle
  // Continuous count of selected rows, moving smoothly between 1 and 5.
  const count = 3 + 2 * Math.sin((t / cycle) * Math.PI * 2);
  const view: View = {
    cx: w / 2,
    cy: h / 2,
    unit: Math.min(w * 0.8 / 1.6, h * 0.42),
    rx: -0.2,
    ry: -0.55 + 0.1 * Math.sin(t * 0.25),
  };

  const solids: Solid[] = [];
  for (let i = 0; i < rows; i += 1) {
    // How far this row has been selected, from 0 to 1. Selected rows lift toward the viewer.
    const lift = Math.min(1, Math.max(0, count - i));
    const top = 0.62 - i * 0.2;
    solids.push({
      x0: -0.78,
      x1: -0.05,
      y0: top - 0.13,
      y1: top,
      z0: -0.06 - lift * 0.28,
      z1: -0.02 - lift * 0.28,
      rgb: lift > 0.02 ? CITRUS : ACCENT,
      alpha: 0.22 + lift * 0.6,
    });
  }

  // Subtotal column on the right grows with the selected count.
  const fill = Math.max(0, count) / rows;
  solids.push({
    x0: 0.18,
    x1: 0.52,
    y0: -0.6,
    y1: -0.6 + fill * 1.22,
    z0: -0.1,
    z1: 0.04,
    rgb: CITRUS,
    alpha: 0.5 + fill * 0.4,
  });
  solids.push({
    x0: 0.18,
    x1: 0.52,
    y0: -0.6,
    y1: 0.62,
    z0: -0.12,
    z1: -0.1,
    rgb: ACCENT,
    alpha: 0.18,
  });

  drawSolids(ctx, solids, view);
};

/* ---------- Feature 3: particles turn inside a rotating 3D boundary; the arrow stops at its face ---------- */

const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

export const drawBrowserBoundary: Draw = (ctx, t, w, h) => {
  const view: View = {
    cx: w / 2,
    cy: h / 2,
    unit: Math.min(w, h) * 0.3,
    rx: 0.45 + 0.1 * Math.sin(t * 0.4),
    ry: t * 0.22,
  };
  const s = 0.9;
  const corners: Vec[] = [
    [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
    [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
  ];

  // Translucent faces of the boundary, then its edges.
  const boundary = { x0: -s, x1: s, y0: -s, y1: s, z0: -s, z1: s };
  drawSolids(ctx, [{ ...boundary, rgb: ACCENT, alpha: 0.05 }], view);

  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(127, 217, 160, 0.55)';
  ctx.lineWidth = 1.3;
  for (const [a, b] of CUBE_EDGES) {
    const pa = project(corners[a], view);
    const pb = project(corners[b], view);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Particles move inside the boundary on fixed, repeatable paths. Their inner margin keeps them off the faces.
  const inner = s - 0.12;
  const particles = Array.from({ length: 16 }, (_, i) => {
    const px = inner * Math.sin(t * (0.42 + i * 0.03) + i * 1.7);
    const py = inner * Math.sin(t * (0.37 + i * 0.05) + i * 2.9);
    const pz = inner * Math.sin(t * (0.31 + i * 0.04) + i * 0.6);
    const p = project([px, py, pz], view);
    return { p, citrus: i % 4 === 0 };
  }).sort((a, b) => b.p.z - a.p.z);
  for (const { p, citrus } of particles) {
    const color = citrus ? CITRUS : ACCENT;
    ctx.fillStyle = `rgba(${color.join(', ')}, 0.95)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3 * p.s, 0, Math.PI * 2);
    ctx.fill();
  }

  // A dashed arrow pushes toward the +X face. Its tip stops at the face and never crosses it.
  const reach = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.1));
  const tip = Math.min(reach, s); // the face is at s, so the tip stops there
  const start = project([0, 0, 0], view);
  const end = project([tip, 0, 0], view);
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = 'rgba(232, 246, 238, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
};
