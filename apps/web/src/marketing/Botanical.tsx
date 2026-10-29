/*
 * 2D botanical line illustrations for the landing pages.
 *
 * Each illustration pairs a plant form with a mathematical form: a golden spiral, a branching
 * tree of selected rows, or a frame with an arrow that stops at its edge. They are inline SVG, so
 * they are sharp at any size, cost no canvas work, and draw themselves in with CSS. The motion is
 * defined in marketing.css and is switched off under prefers-reduced-motion. Every SVG is
 * decorative (aria-hidden), because the surrounding section text carries the meaning.
 */

/**
 * Points along a golden (logarithmic) spiral, centred on the origin. Each quarter turn grows the
 * radius by the golden ratio, so the curve is the classic Fibonacci-proportion spiral.
 */
function goldenSpiralPath(scale: number, turns: number, steps: number): string {
  const phi = (1 + Math.sqrt(5)) / 2;
  const b = Math.log(phi) / (Math.PI / 2);
  const points: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * turns * Math.PI * 2;
    const r = scale * Math.exp(b * theta);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(' ');
}

const SPIRAL = goldenSpiralPath(6, 1.6, 160);

/** Hero: a single plant on a measured baseline, with a golden spiral behind it and one dot travelling up the stem. */
export function BotanicalHero() {
  return (
    <svg className="mkt-botanical" viewBox="0 0 520 480" aria-hidden="true" focusable="false">
      {/* Measurement baseline: faint ticks that read as a scale, not as text. */}
      <g className="bot-scale">
        {Array.from({ length: 11 }, (_, i) => (
          <line key={i} x1={60 + i * 40} y1="452" x2={60 + i * 40} y2={i % 5 === 0 ? 440 : 446} />
        ))}
        <line x1="60" y1="452" x2="460" y2="452" />
      </g>

      {/* Golden spiral behind the plant: the mathematical form. */}
      <g transform="translate(350 200) rotate(-18)" className="bot-spiral">
        <path d={SPIRAL} pathLength={1} className="bot-draw" style={{ animationDelay: '0.2s' }} />
      </g>

      {/* Stem. */}
      <path
        d="M205 452 C 192 360, 232 300, 214 168"
        pathLength={1}
        className="bot-draw bot-stem"
        style={{ animationDelay: '0.4s' }}
      />

      {/* Left leaf: midrib and side veins. */}
      <g className="bot-leaf bot-sway-left">
        <path
          d="M208 336 C 152 306, 112 244, 128 186 C 186 196, 222 254, 208 336 Z"
          pathLength={1}
          className="bot-draw bot-leaf-shape"
          style={{ animationDelay: '0.9s' }}
        />
        <path d="M208 336 Q 168 262 128 186" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '1.3s' }} />
        <path d="M194 300 L 158 278 M 184 268 L 150 240 M 170 236 L 142 214" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '1.5s' }} />
      </g>

      {/* Right leaf: slightly smaller, with its own veins. */}
      <g className="bot-leaf bot-sway-right">
        <path
          d="M212 262 C 262 232, 304 170, 282 118 C 232 128, 198 190, 212 262 Z"
          pathLength={1}
          className="bot-draw bot-leaf-shape"
          style={{ animationDelay: '1.1s' }}
        />
        <path d="M212 262 Q 250 196 282 118" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '1.5s' }} />
        <path d="M226 226 L 262 212 M 238 196 L 268 178" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '1.7s' }} />
      </g>

      {/* Bud at the top of the stem, with a ring that breathes. */}
      <circle cx="214" cy="164" r="7" className="bot-node" />
      <circle cx="214" cy="164" r="16" className="bot-ring" />

      {/* A dot travelling up the stem: the process moving toward the subtotal. Hidden under reduced motion. */}
      <g className="bot-motion">
        <circle r="4.5" className="bot-flow">
          <animateMotion dur="7s" repeatCount="indefinite" path="M205 452 C 192 360, 232 300, 214 168" />
        </circle>
      </g>
    </svg>
  );
}
