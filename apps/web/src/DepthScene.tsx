import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FOV = 38;
const CAMERA_Z = 12;
const BACKGROUND = { src: '/images/site-background-wind.jpg', z: -9 };
// Each step brings one image forward on the right side of the stage.
const ITEM_DEPTH_Z = 1; // the active item sits here
const ITEMS = [
  { src: '/images/recycling-globe.jpg' },
  { src: '/images/recycling-icon.jpg' },
  { src: '/images/recycling-tshirt-cropped.jpg' },
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

// Visible world height and width at a given distance from the camera.
function visibleSize(distance: number, aspect: number) {
  const height = 2 * distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return { width: height * aspect, height };
}

// Size a plane to the image aspect, either filling the box (cover) or fitting inside it (contain).
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

    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let progress = 0;
    let smoothed = 0;

    const updateSteps = (p: number) => {
      const f = p * STEPS.length;
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const t = clamp(1 - Math.abs(f - (index + 0.5)), 0, 1);
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
    camera.position.z = CAMERA_Z;

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const materials: THREE.Material[] = [];

    const makePlane = (z: number, opacity: number) => {
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.position.z = z;
      scene.add(mesh);
      materials.push(material);
      return { mesh, material, aspect: 1 };
    };

    const background = makePlane(BACKGROUND.z, 1);
    const items = ITEMS.map((item, index) => ({
      ...makePlane(-2, 0),
      side: index % 2 === 0 ? 1 : -1,
      src: item.src,
    }));

    // Lay out every plane for the current stage size.
    const layout = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (width === 0 || height === 0) return;
      const aspect = width / height;
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();

      const narrow = aspect < 0.9;

      // Background covers the whole view at its depth, with margin for parallax.
      const bgView = visibleSize(CAMERA_Z - BACKGROUND.z, aspect);
      const bgSize = fitSize(background.aspect, bgView.width * 1.12, bgView.height * 1.12, true);
      background.mesh.geometry.dispose();
      background.mesh.geometry = new THREE.PlaneGeometry(bgSize.width, bgSize.height);

      // Items sit in their own column on the right (or the lower half on narrow screens).
      const itemView = visibleSize(CAMERA_Z - ITEM_DEPTH_Z, aspect);
      const boxWidth = narrow ? itemView.width * 0.78 : itemView.width * 0.36;
      const boxHeight = narrow ? itemView.height * 0.44 : itemView.height * 0.7;
      items.forEach((item) => {
        const size = fitSize(item.aspect, boxWidth, boxHeight, false);
        item.mesh.geometry.dispose();
        item.mesh.geometry = new THREE.PlaneGeometry(size.width, size.height);
        item.mesh.userData.slot = narrow
          ? { x: 0, y: -itemView.height * 0.18 }
          : { x: itemView.width * 0.25, y: 0 };
      });
    };

    const textureFor = (src: string, onLoad: (texture: THREE.Texture) => void) => {
      loader.load(src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        onLoad(texture);
        layout();
      });
    };

    textureFor(BACKGROUND.src, (texture) => {
      background.aspect = textureAspect(texture);
      background.material.map = texture;
      background.material.needsUpdate = true;
    });
    items.forEach((item) => {
      textureFor(item.src, (texture) => {
        item.aspect = textureAspect(texture);
        item.material.map = texture;
        item.material.needsUpdate = true;
      });
    });

    // Floating particles add depth behind the images.
    const particleCount = 160;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -9 + Math.random() * 12;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa9e0f1,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    materials.push(particleMaterial);

    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion) return;
      const rect = stage.getBoundingClientRect();
      pointerTarget.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerTarget.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    };
    stage.addEventListener('pointermove', onPointerMove);

    window.addEventListener('resize', layout);
    layout();

    let frameId = 0;
    let time = 0;
    let last = performance.now();
    const timeScale = reduceMotion ? 0 : 1;

    const frame = (now: number) => {
      frameId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt * timeScale;

      smoothed += (progress - smoothed) * 0.08;
      pointer.x += (pointerTarget.x - pointer.x) * 0.05;
      pointer.y += (pointerTarget.y - pointer.y) * 0.05;

      // Background drifts slowly with scroll.
      background.mesh.position.y = -(smoothed - 0.5) * 0.5 + pointer.y * 0.1;
      background.mesh.position.x = pointer.x * 0.15;

      // Each step brings one item forward; the others recede and fade.
      const f = smoothed * ITEMS.length;
      items.forEach((item, index) => {
        const t = clamp(1 - Math.abs(f - (index + 0.5)), 0, 1);
        const e = smooth(t);
        const slot = item.mesh.userData.slot as { x: number; y: number } | undefined;
        const slotX = slot?.x ?? 0;
        const slotY = slot?.y ?? 0;
        item.mesh.position.set(
          slotX + pointer.x * 0.2 + Math.sin(time * 0.5 + index) * 0.05 * timeScale,
          slotY + (1 - e) * -0.9 + pointer.y * 0.15,
          -2 + e * (ITEM_DEPTH_Z + 2),
        );
        item.mesh.rotation.y = (1 - e) * 0.6 * item.side + pointer.x * 0.04;
        item.material.opacity = e;
        item.mesh.visible = e > 0.01;
      });

      camera.position.y = -(smoothed - 0.5) * 0.6 + pointer.y * 0.2;
      camera.position.x = pointer.x * 0.25;
      camera.lookAt(0, 0, 0);
      particles.rotation.y = smoothed * 0.5 + time * 0.02;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      cleanupListeners();
      window.removeEventListener('resize', layout);
      stage.removeEventListener('pointermove', onPointerMove);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) object.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
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
