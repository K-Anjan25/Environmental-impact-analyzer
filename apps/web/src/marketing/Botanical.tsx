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

/** Feature 1: a stem bearing sixteen branches, one per EF 3.1 indicator, each growing in turn. */
export function BotanicalIndicators() {
  const branches = Array.from({ length: 16 }, (_, i) => {
    const y = 268 - i * 14;
    const side = i % 2 === 0 ? -1 : 1;
    const length = 46 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 80;
    return { y, side, length, i };
  });
  return (
    <svg className="bot-figure" viewBox="0 0 480 300" aria-hidden="true" focusable="false">
      <path d="M240 282 L240 36" pathLength={1} className="bot-draw bot-stem" style={{ animationDelay: '0s' }} />
      {branches.map(({ y, side, length, i }) => (
        <g key={i}>
          <path
            d={`M240 ${y} Q ${240 + side * length * 0.5} ${y - 10} ${240 + side * length} ${y - 4}`}
            pathLength={1}
            className="bot-draw bot-vein"
            style={{ animationDelay: `${0.25 + i * 0.07}s` }}
          />
          <circle cx={240 + side * length} cy={y - 4} r="3.2" className="bot-node bot-grow" style={{ animationDelay: `${0.5 + i * 0.07}s` }} />
        </g>
      ))}
      {/* The baseline the branches grow from. */}
      <path d="M60 286 C 140 294, 340 278, 420 286" pathLength={1} className="bot-draw bot-scale-line" style={{ animationDelay: '0.1s' }} />
    </svg>
  );
}

/** Feature 2: rows branch from one trunk; the selected rows (terracotta) merge into a subtotal column. */
export function BotanicalSelection() {
  const rows = [0, 1, 2, 3, 4, 5];
  const selected = new Set([0, 2, 4]);
  return (
    <svg className="bot-figure" viewBox="0 0 480 300" aria-hidden="true" focusable="false">
      {/* Trunk rising from the base. */}
      <path d="M190 292 C 190 220, 196 150, 200 42" pathLength={1} className="bot-draw bot-stem" style={{ animationDelay: '0s' }} />
      {rows.map((i) => {
        const y = 250 - i * 34;
        const isSelected = selected.has(i);
        return (
          <g key={i}>
            <path
              d={`M194 ${y} C 166 ${y - 6}, 140 ${y - 2}, 112 ${y - 14}`}
              pathLength={1}
              className={`bot-draw ${isSelected ? 'bot-selected-branch' : 'bot-vein'}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            />
            <circle cx="112" cy={y - 14} r={isSelected ? 6 : 4} className={isSelected ? 'bot-selected-node' : 'bot-node'} />
          </g>
        );
      })}
      {/* Merge path from the selected rows into the subtotal column. */}
      <path d="M200 42 C 260 40, 300 60, 330 80" pathLength={1} className="bot-draw bot-merge" style={{ animationDelay: '1s' }} />
      {/* Subtotal column: an outline and a fill that grows with the selection. */}
      <rect x="330" y="60" width="92" height="222" rx="18" className="bot-column" />
      <rect x="330" y="60" width="92" height="222" rx="18" className="bot-column-fill bot-grow-y" />
    </svg>
  );
}

/** Feature 3: a leaf inside a dashed boundary. Dots stay inside, and the arrow stops at the frame edge. */
export function BotanicalBoundary() {
  return (
    <svg className="bot-figure" viewBox="0 0 480 300" aria-hidden="true" focusable="false">
      <rect x="40" y="30" width="400" height="240" rx="28" pathLength={1} className="bot-frame" />
      <path
        d="M130 226 C 160 120, 260 70, 350 74 C 336 170, 260 236, 130 226 Z"
        pathLength={1}
        className="bot-draw bot-leaf-shape"
        style={{ animationDelay: '0.2s' }}
      />
      <path d="M130 226 Q 230 150 350 74" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '0.7s' }} />
      <path d="M190 190 L 228 170 M 222 160 L 262 130 M 262 128 L 296 104" pathLength={1} className="bot-draw bot-vein" style={{ animationDelay: '0.9s' }} />
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={i}
          cx={170 + ((i * 37) % 170)}
          cy={120 + ((i * 53) % 90)}
          r="2.6"
          className="bot-dot bot-drift"
          style={{ animationDelay: `${(i * 0.37) % 3}s` }}
        />
      ))}
      {/* Arrow toward the boundary: it grows and stops well short of the frame. */}
      <path d="M240 150 L 400 150" pathLength={1} className="bot-arrow bot-arrow-grow" />
      <path d="M392 144 L 402 150 L 392 156" className="bot-arrow-head" />
    </svg>
  );
}
