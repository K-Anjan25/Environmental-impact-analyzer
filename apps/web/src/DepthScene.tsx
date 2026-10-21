import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/*
 * "Process rail": the camera glides along a curved rail past three stations.
 * Station 1 and 2 show process images. Station 3 is a ring of 16 nodes, one per
 * EF 3.1 indicator, that lights up as the reader scrolls. Text sits on the left
 * and each station sits on the right, so nothing overlaps.
 */

const FOV = 38;
const DESIGN_DISTANCE = 7.2; // camera distance used to size the stations
const STATION_X = [0, 11, 22];
const INDICATOR_COUNT = 16;
const BACKDROP_DISTANCE = 20; // the turbine backdrop is parented to the camera

const STATIONS = [
  { src: '/images/recycling-globe.jpg' },
  { src: '/images/recycling-tshirt-cropped.jpg' },
  { src: '/images/recycling-icon.jpg' },
];

const STEPS = [
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
];

const COLOR_LIT = new THREE.Color(0xcaffa6); // Spring Meadow
const COLOR_IDLE = new THREE.Color(0xa9e0f1); // Glacial Sky

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smooth = (t: number) => t * t * (3 - 2 * t);

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

// Fill (cover) or fit (contain) an image aspect inside a box.
function fitSize(imageAspect: number, boxWidth: number, boxHeight: number, cover: boolean) {
  const boxAspect = boxWidth / boxHeight;
  const useWidth = cover ? imageAspect < boxAspect : imageAspect > boxAspect;
  if (useWidth) return { width: boxWidth, height: boxWidth / imageAspect };
  return { width: boxHeight * imageAspect, height: boxHeight };
}

function textureAspect(texture: THREE.Texture): number {
  const image = texture.image as { width: number; height: number };
  return image.width / image.height;
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

    // Each step owns one third of the rail; step centres are at 0, 0.5 and 1.
    const updateSteps = (p: number) => {
      const f = p * (STEPS.length - 1);
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const t = clamp(1 - Math.abs(f - index), 0, 1);
        const e = smooth(t);
        el.style.opacity = e.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - e) * 36).toFixed(1)}px, 0)`;
      });
    };

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      progress = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
      section.style.setProperty('--depth-p', progress.toFixed(3));
      updateSteps(progress);
    };

    const onScroll = () => readProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    readProgress();

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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'depth-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    scene.add(camera);

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];

    // Turbine backdrop: parented to the camera so it always fills the view.
    const backdropMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backdropMaterial);
    backdrop.position.z = -BACKDROP_DISTANCE;
    camera.add(backdrop);
    let backdropAspect = 1;

    // Stations: image planes placed along the rail.
    const stationGroups = STATIONS.map((station, index) => {
      const group = new THREE.Group();
      group.position.x = STATION_X[index];
      scene.add(group);
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      group.add(mesh);
      let aspect = 1;
      loader.load(station.src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        aspect = textureAspect(texture);
        material.map = texture;
        material.needsUpdate = true;
        mesh.userData.aspect = aspect;
        layout();
      });
      return { group, mesh, material };
    });

    // Indicator ring on the last station.
    const ringGroup = new THREE.Group();
    stationGroups[2].group.add(ringGroup);
    const ringLine = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.012, 8, 128),
      new THREE.MeshBasicMaterial({ color: COLOR_IDLE, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    ringGroup.add(ringLine);
    const nodes = Array.from({ length: INDICATOR_COUNT }, (_, index) => {
      const material = new THREE.MeshBasicMaterial({ color: COLOR_IDLE, transparent: true, opacity: 0.35 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), material);
      mesh.userData.angle = (index / INDICATOR_COUNT) * Math.PI * 2;
      ringGroup.add(mesh);
      return { mesh, material };
    });

    // Floating particles add depth between the layers.
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -8 + Math.random() * 14;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: COLOR_IDLE,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
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
      const cameraOffsetX = narrow ? 0 : -1.7;
      const stationY = narrow ? -view.height * 0.2 : 0;

      // Backdrop covers the full view at its depth, with margin for parallax.
      const backView = visibleSize(BACKDROP_DISTANCE, aspect);
      const backSize = fitSize(backdropAspect, backView.width * 1.15, backView.height * 1.15, true);
      backdrop.geometry.dispose();
      backdrop.geometry = new THREE.PlaneGeometry(backSize.width, backSize.height);

      // Station images fit a box on the right, or the lower half on narrow screens.
      const boxWidth = narrow ? view.width * 0.8 : view.width * 0.3;
      const boxHeight = narrow ? view.height * 0.42 : view.height * 0.62;
      let iconSize = { width: boxHeight, height: boxHeight };
      stationGroups.forEach((station, index) => {
        station.group.position.y = stationY;
        const itemAspect = (station.mesh.userData.aspect as number | undefined) ?? 1;
        const size = fitSize(itemAspect, boxWidth, boxHeight, false);
        station.mesh.geometry.dispose();
        station.mesh.geometry = new THREE.PlaneGeometry(size.width, size.height);
        if (index === 2) iconSize = size;
      });

      // Ring sits around the icon image.
      const radius = iconSize.width * 0.5 + 0.7;
      ringLine.geometry.dispose();
      ringLine.geometry = new THREE.TorusGeometry(radius, 0.012, 8, 128);
      nodes.forEach(({ mesh }) => {
        const angle = mesh.userData.angle as number;
        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.02);
      });

      // Camera rail through the three stations, with a dip between each.
      const [s0, s1, s2] = STATION_X;
      const mid01 = (s0 + s1) / 2 + cameraOffsetX;
      const mid12 = (s1 + s2) / 2 + cameraOffsetX;
      rail = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(s0 + cameraOffsetX, 0.25, DESIGN_DISTANCE),
          new THREE.Vector3(mid01, 1.2, DESIGN_DISTANCE - 2.2),
          new THREE.Vector3(s1 + cameraOffsetX, -0.15, DESIGN_DISTANCE),
          new THREE.Vector3(mid12, -1.0, DESIGN_DISTANCE - 2.2),
          new THREE.Vector3(s2 + cameraOffsetX, 0.2, DESIGN_DISTANCE),
        ],
        false,
        'catmullrom',
        0.5,
      );
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

      // Frame-rate independent easing, so the rail settles at the same speed on any device.
      const ease = 1 - Math.exp(-dt * 7);
      smoothed += (progress - smoothed) * ease;
      pointer.x += (pointerTarget.x - pointer.x) * (1 - Math.exp(-dt * 4));
      pointer.y += (pointerTarget.y - pointer.y) * (1 - Math.exp(-dt * 4));

      // Camera follows the rail; pointer adds a small sway.
      rail.getPoint(smoothed, base);
      camera.position.set(base.x + pointer.x * 0.3, base.y + pointer.y * 0.2, base.z);
      camera.lookAt(base.x, base.y, 0);

      // Stations grow and brighten as the camera nears them.
      stationGroups.forEach((station, index) => {
        const proximity = clamp(1 - Math.abs(smoothed - index / 2) * 2.2, 0, 1);
        const e = smooth(proximity);
        station.group.scale.setScalar(0.86 + 0.14 * e);
        station.material.opacity = 0.25 + 0.75 * e;
        station.mesh.visible = e > 0.02;
        station.mesh.position.z = (e - 1) * 1.2;
      });

      // Indicators light up across the last part of the rail.
      const lit = Math.floor(clamp((smoothed - 0.6) / 0.4, 0, 1) * INDICATOR_COUNT);
      nodes.forEach(({ mesh, material }, index) => {
        const isLit = index < lit;
        material.color.copy(isLit ? COLOR_LIT : COLOR_IDLE);
        material.opacity = isLit ? 1 : 0.35;
        mesh.scale.setScalar(isLit ? 1.6 : 1);
      });
      ringGroup.rotation.z = time * 0.12 + smoothed * 0.8;

      backdrop.position.x = pointer.x * 0.2;
      backdrop.position.y = pointer.y * 0.15 - (smoothed - 0.5) * 0.4;
      particles.rotation.y = smoothed * 0.5 + time * 0.02;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(frame);

    // The backdrop texture loads separately from the stations.
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
    <section ref={sectionRef} className="depth-scene" aria-label="Scroll through the calculation steps">
      <div ref={stageRef} className="depth-stage">
        <div className="depth-copy">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="depth-step"
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
            >
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
