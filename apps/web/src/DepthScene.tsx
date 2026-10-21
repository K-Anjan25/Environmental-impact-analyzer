import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * The EcoImpact journey: five frames along one camera rail.
 * Each frame is a station with a procedural 3D object on the right and a text
 * card on the left. See docs/landing-journey-storyboard.md for the timing.
 */

type Frame = { title: string; body: string; cta?: { label: string; href: string } };

const FRAMES: Frame[] = [
  {
    title: 'Follow one process',
    body: 'Scroll to walk through a single process, from the first choice to its indicator reading.',
  },
  {
    title: 'Choose a process',
    body: 'Search the published apparel and footwear factors by process family and source geography.',
  },
  {
    title: 'Enter quantities',
    body: 'Each quantity is converted to the factor reference unit before any calculation runs.',
  },
  {
    title: 'Read the indicators',
    body: 'See all 16 EF 3.1 indicators on their own lines, with the unit shown beside each value.',
  },
  {
    title: 'Start an estimate',
    body: 'Enter your own processes and quantities to see their indicator results.',
    cta: { label: 'Start an estimate', href: '#process-library' },
  },
];

const FOV = 38;
const DESIGN_DISTANCE = 7.2;
const BACKDROP_DISTANCE = 20;
const FRAME_SPACING = 11;
const CAMERA_OFFSET_X = -1.7;
const INDICATOR_COUNT = 16;

const MORNING_MIST = 0xf7f9e1;
const GLACIAL_SKY = 0xa9e0f1;
const TEAL = 0x204654;
const SPRING_MEADOW = 0xcaffa6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (t: number) => t * t * (3 - 2 * t);
const frameCentre = (index: number) => index / (FRAMES.length - 1);
const STATION_X = FRAMES.map((_, index) => index * FRAME_SPACING);

// Text weight: full inside ±0.05 of the frame centre, zero beyond ±0.10.
// Neighbouring frames are 0.25 apart, so two cards are never visible together.
const textWeight = (p: number, index: number) => {
  const distance = Math.abs(p - frameCentre(index));
  return 1 - smooth(clamp((distance - 0.05) / 0.05, 0, 1));
};

// Object weight: grows from 0 at 0.25 away to 1 at the centre.
const objectWeight = (p: number, index: number) =>
  smooth(clamp(1 - Math.abs(p - frameCentre(index)) / 0.25, 0, 1));

function canUseWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl')));
  } catch {
    return false;
  }
}

function visibleSize(distance: number, aspect: number) {
  const height = 2 * distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return { width: height * aspect, height };
}

function textureAspect(texture: THREE.Texture): number {
  const image = texture.image as { width: number; height: number };
  return image.width / image.height;
}

function surfaceMaterial(color: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...extra });
}

function glowMaterial(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

// Frame 0: a wind turbine. The rotor turns slowly.
function buildTurbine() {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 2.3, 18), surfaceMaterial(GLACIAL_SKY));
  tower.position.y = -0.15;
  const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.22), surfaceMaterial(MORNING_MIST));
  nacelle.position.set(0, 1.05, 0);
  const rotor = new THREE.Group();
  rotor.position.set(0.27, 1.05, 0.13);
  rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 18, 12), surfaceMaterial(MORNING_MIST)));
  for (let i = 0; i < 3; i += 1) {
    const arm = new THREE.Group();
    arm.rotation.z = (i * Math.PI * 2) / 3;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.25, 0.03), surfaceMaterial(MORNING_MIST));
    blade.position.y = 0.62;
    arm.add(blade);
    rotor.add(arm);
  }
  group.add(tower, nacelle, rotor);
  return { group, rotor, bounds: { width: 2.6, height: 3.6 } };
}

// Frame 1: a globe with process locations. The globe turns slowly.
function buildGlobe() {
  const group = new THREE.Group();
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 32), surfaceMaterial(TEAL, { roughness: 0.8 }));
  const grid = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 24, 16),
    new THREE.MeshBasicMaterial({ color: GLACIAL_SKY, wireframe: true, transparent: true, opacity: 0.28 }),
  );
  group.add(sphere, grid);
  const pointGeometry = new THREE.SphereGeometry(0.075, 12, 8);
  const pointMaterial = new THREE.MeshBasicMaterial({ color: SPRING_MEADOW });
  for (let i = 0; i < 14; i += 1) {
    // Deterministic points on the surface, spread with the golden angle.
    const latitude = Math.asin(((((i * 37) % 19) / 19) * 1.6) - 0.8);
    const longitude = i * 2.399;
    const radius = 1.12;
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(
      radius * Math.cos(latitude) * Math.cos(longitude),
      radius * Math.sin(latitude),
      radius * Math.cos(latitude) * Math.sin(longitude),
    );
    group.add(point);
  }
  return { group, bounds: { width: 2.4, height: 2.4 } };
}

// Frame 2: a tray of nine blocks. Block heights stand for quantities.
function buildQuantities() {
  const group = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.7), surfaceMaterial(TEAL));
  tray.position.y = -0.95;
  group.add(tray);
  const blocks: { mesh: THREE.Mesh; target: number }[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const index = row * 3 + col;
      const target = 0.55 + (((index * 5) % 7) * 0.12);
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      geometry.translate(0, 0.5, 0); // pivot at the base so the block grows upward
      const mesh = new THREE.Mesh(geometry, surfaceMaterial(index % 2 ? SPRING_MEADOW : GLACIAL_SKY));
      mesh.position.set((col - 1) * 0.68, -0.91, (row - 1) * 0.6);
      mesh.scale.y = 0.2;
      group.add(mesh);
      blocks.push({ mesh, target });
    }
  }
  return { group, blocks, bounds: { width: 2.6, height: 2.0 } };
}

// Frame 3: a core with a ring of 16 nodes, one per EF 3.1 indicator.
function buildIndicatorRing() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), surfaceMaterial(TEAL, { roughness: 0.4 }));
  const coreWire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.56, 0),
    new THREE.MeshBasicMaterial({ color: GLACIAL_SKY, wireframe: true, transparent: true, opacity: 0.5 }),
  );
  const ringGroup = new THREE.Group();
  const ringLine = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 8, 160), glowMaterial(GLACIAL_SKY, 0.35));
  ringGroup.add(ringLine);
  const nodes = Array.from({ length: INDICATOR_COUNT }, (_, index) => {
    const angle = (index / INDICATOR_COUNT) * Math.PI * 2;
    const material = glowMaterial(GLACIAL_SKY, 0.35);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), material);
    mesh.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0.02);
    ringGroup.add(mesh);
    return { mesh, material };
  });
  group.add(core, coreWire, ringGroup);
  return { group, ringGroup, nodes, bounds: { width: 3.2, height: 3.2 } };
}

// Frame 4: three concentric rings around a glowing core. The rings open outward.
function buildClosing() {
  const group = new THREE.Group();
  const rings = [0.9, 1.35, 1.8].map((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.02, 8, 160),
      glowMaterial(index === 1 ? SPRING_MEADOW : GLACIAL_SKY, 0.6),
    );
    ring.rotation.x = Math.PI / 2.6 + index * 0.25;
    ring.rotation.y = index * 0.4;
    group.add(ring);
    return ring;
  });
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 16),
    surfaceMaterial(SPRING_MEADOW, { emissive: SPRING_MEADOW, emissiveIntensity: 0.25 }),
  );
  group.add(core);
  return { group, rings, bounds: { width: 3.6, height: 3.6 } };
}

export default function DepthScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return undefined;

    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progress = 0;
    let smoothed = 0;
    let webglActive = false;

    const updateSteps = (p: number) => {
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const w = textWeight(p, index);
        el.style.opacity = w.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - w) * 20).toFixed(1)}px, 0)`;
      });
    };

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      section.style.setProperty('--depth-p', progress.toFixed(3));
    };

    const onScroll = () => {
      readProgress();
      if (!webglActive) updateSteps(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    const cleanupListeners = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };

    if (!canUseWebGL()) {
      stage.classList.add('depth-fallback');
      return cleanupListeners;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      stage.classList.add('depth-fallback');
      return cleanupListeners;
    }
    webglActive = true;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'depth-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(GLACIAL_SKY, 0.6);
    rim.position.set(-4, -2, 3);
    scene.add(rim);

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];

    // Layer 0: the turbine photo behind everything, attached to the camera.
    // The tint dims the busy photo so the 3D objects stand out.
    const backdropMaterial = new THREE.MeshBasicMaterial({ color: 0x8aa6b0, transparent: true, opacity: 0.95, depthWrite: false });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backdropMaterial);
    backdrop.position.z = -BACKDROP_DISTANCE;
    camera.add(backdrop);
    let backdropAspect = 1;

    // Layer 1: the five stations, one 3D object each.
    const turbine = buildTurbine();
    const globe = buildGlobe();
    const quantities = buildQuantities();
    const ring = buildIndicatorRing();
    const closing = buildClosing();
    const stations = [
      { group: turbine.group, bounds: turbine.bounds, fit: 1 },
      { group: globe.group, bounds: globe.bounds, fit: 1 },
      { group: quantities.group, bounds: quantities.bounds, fit: 1 },
      { group: ring.group, bounds: ring.bounds, fit: 1 },
      { group: closing.group, bounds: closing.bounds, fit: 1 },
    ];
    stations.forEach((station, index) => {
      station.group.position.x = STATION_X[index];
      scene.add(station.group);
    });

    // Floating particles add depth in front of the stations.
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -8 + Math.random() * 14;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: GLACIAL_SKY, size: 0.06, transparent: true, opacity: 0.7, depthWrite: false }),
    );
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      const rect = stage.getBoundingClientRect();
      pointerTarget.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerTarget.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    };
    stage.addEventListener('pointermove', onPointerMove);

    // Rail: the camera passes each station from the left, so the object reads on the right.
    // Midpoints between stations dip up and down, so the glide has a gentle rhythm.
    let rail = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, DESIGN_DISTANCE)]);

    const layout = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (width === 0 || height === 0) return;
      const aspect = width / height;
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      const narrow = aspect < 0.9;
      const view = visibleSize(DESIGN_DISTANCE, aspect);
      const cameraOffsetX = narrow ? 0 : CAMERA_OFFSET_X;
      const stationY = narrow ? -view.height * 0.2 : 0;

      // Backdrop covers the whole view at its depth, with margin for parallax.
      const backView = visibleSize(BACKDROP_DISTANCE, aspect);
      const backWidth = backView.width * 1.15;
      const backHeight = backView.height * 1.15;
      const backAspect = backdropAspect;
      // Cover: fill the width when the image is narrower than the view, otherwise fill the height.
      const useWidth = backAspect < backWidth / backHeight;
      const backSize = useWidth
        ? { width: backWidth, height: backWidth / backAspect }
        : { width: backHeight * backAspect, height: backHeight };
      backdrop.geometry.dispose();
      backdrop.geometry = new THREE.PlaneGeometry(backSize.width, backSize.height);

      // Each object fits a box on the right, or the lower half on narrow screens.
      const boxWidth = narrow ? view.width * 0.8 : view.width * 0.3;
      const boxHeight = narrow ? view.height * 0.42 : view.height * 0.62;
      stations.forEach((station) => {
        station.fit = Math.min(boxWidth / station.bounds.width, boxHeight / station.bounds.height, 1.2);
        station.group.position.y = stationY;
      });

      // Camera rail through the stations, with a dip between each pair.
      const dips = [1.1, -0.9, 0.9, -0.6];
      const points: THREE.Vector3[] = [];
      STATION_X.forEach((x, index) => {
        points.push(new THREE.Vector3(x + cameraOffsetX, index % 2 ? -0.1 : 0.25, DESIGN_DISTANCE));
        if (index < STATION_X.length - 1) {
          const midX = (x + STATION_X[index + 1]) / 2 + cameraOffsetX;
          points.push(new THREE.Vector3(midX, dips[index % dips.length], DESIGN_DISTANCE - 2.2));
        }
      });
      rail = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    };

    window.addEventListener('resize', layout);
    layout();

    let frameId = 0;
    let time = 0;
    let last = performance.now();
    const timeScale = reduceMotion ? 0 : 1;
    const base = new THREE.Vector3();

    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt * timeScale;

      // Frame-rate independent easing for the scroll position and the pointer.
      smoothed += (progress - smoothed) * (1 - Math.exp(-dt * 7));
      pointer.x += (pointerTarget.x - pointer.x) * (1 - Math.exp(-dt * 4));
      pointer.y += (pointerTarget.y - pointer.y) * (1 - Math.exp(-dt * 4));

      // Camera follows the rail; the pointer adds a small sway.
      rail.getPoint(smoothed, base);
      camera.position.set(base.x + pointer.x * 0.3, base.y + pointer.y * 0.2, base.z);
      camera.lookAt(base.x, base.y, 0);

      // Text cards: one at a time, driven by scroll.
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const w = textWeight(smoothed, index);
        el.style.opacity = w.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - w) * 20).toFixed(1)}px, 0)`;
      });

      // Objects grow and move forward as the camera nears them.
      stations.forEach((station, index) => {
        const e = objectWeight(smoothed, index);
        station.group.scale.setScalar(station.fit * (0.7 + 0.3 * e));
        station.group.position.z = (1 - e) * -1.5;
        station.group.visible = e > 0.01;
      });

      turbine.rotor.rotation.z = time * 1.2;
      globe.group.rotation.y = time * 0.2 + smoothed * 0.6;

      // Quantity blocks rise to their heights as the camera arrives.
      const quantityWeight = objectWeight(smoothed, 2);
      quantities.blocks.forEach(({ mesh, target }) => {
        mesh.scale.y = 0.2 + (target - 0.2) * quantityWeight;
      });

      // Indicators light up across the approach to the last station.
      ring.ringGroup.rotation.z = time * 0.15 + smoothed * 0.8;
      const lit = Math.floor(clamp((smoothed - 0.6) / 0.25, 0, 1) * INDICATOR_COUNT);
      ring.nodes.forEach(({ mesh, material }, index) => {
        const isLit = index < lit;
        material.color.setHex(isLit ? SPRING_MEADOW : GLACIAL_SKY);
        material.opacity = isLit ? 1 : 0.35;
        mesh.scale.setScalar(isLit ? 1.6 : 1);
      });

      // Closing rings open outward as the last frame arrives.
      const closingWeight = objectWeight(smoothed, 4);
      closing.rings.forEach((item, index) => {
        item.scale.setScalar(0.6 + 0.4 * closingWeight + index * 0.05 * closingWeight);
      });

      backdrop.position.x = pointer.x * 0.2;
      backdrop.position.y = pointer.y * 0.15 - (smoothed - 0.5) * 0.4;
      particles.rotation.y = smoothed * 0.5 + time * 0.02;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(frame);

    loader.load('/images/site-background-wind.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      backdropAspect = textureAspect(texture);
      backdropMaterial.map = texture;
      backdropMaterial.needsUpdate = true;
      layout();
    });

    return () => {
      cancelAnimationFrame(frameId);
      cleanupListeners();
      window.removeEventListener('resize', layout);
      stage.removeEventListener('pointermove', onPointerMove);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material as THREE.Material | THREE.Material[];
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section ref={sectionRef} className="depth-scene" aria-label="Walk through one process, step by step">
      <div ref={stageRef} className="depth-stage">
        <div className="depth-copy">
          {FRAMES.map((frame, index) => (
            <div
              key={frame.title}
              className="depth-step"
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
            >
              <h2>{frame.title}</h2>
              <p>{frame.body}</p>
              {frame.cta ? (
                <a className="depth-cta" href={frame.cta.href}>
                  {frame.cta.label}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
