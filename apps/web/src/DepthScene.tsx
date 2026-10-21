import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Layer = {
  src: string;
  z: number;
  height: number;
  drift: number;
  rotate: number;
};

// Four image layers at different depths. Farther layers move less on scroll.
const LAYERS: Layer[] = [
  { src: '/images/site-background-wind.jpg', z: -7, height: 15, drift: 0.6, rotate: 0 },
  { src: '/images/recycling-globe.jpg', z: -2.6, height: 4.4, drift: 1.2, rotate: 0.1 },
  { src: '/images/recycling-icon.jpg', z: 0.4, height: 3.3, drift: 1.9, rotate: -0.08 },
  { src: '/images/recycling-tshirt-cropped.jpg', z: 2.6, height: 4.8, drift: 2.6, rotate: 0.06 },
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

function canUseWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl')));
  } catch {
    return false;
  }
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
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const center = (index + 0.5) / STEPS.length;
        const distance = Math.abs(p - center);
        el.style.opacity = String(clamp(1 - distance * 3.4, 0, 1));
        el.style.transform = `translate3d(0, ${((p - center) * -70).toFixed(1)}px, 0)`;
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

    if (!canUseWebGL()) {
      stage.classList.add('depth-fallback');
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      stage.classList.add('depth-fallback');
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = 'depth-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 12;

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const layers = LAYERS.map((layer, index) => {
      const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const geometry = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geometry, material);
      const baseX = index % 2 === 0 ? -1.4 : 1.6;
      mesh.position.set(baseX, 0, layer.z);
      mesh.rotation.z = layer.rotate;
      scene.add(mesh);
      geometries.push(geometry);
      materials.push(material);
      loader.load(
        layer.src,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const aspect = texture.image.width / texture.image.height;
          const sized = new THREE.PlaneGeometry(layer.height * aspect, layer.height);
          mesh.geometry.dispose();
          mesh.geometry = sized;
          geometries.push(sized);
          material.map = texture;
          material.opacity = index === 0 ? 0.9 : 1;
          material.needsUpdate = true;
          textures.push(texture);
        },
        undefined,
        () => {
          // A layer that fails to load stays hidden; the other layers still render.
          material.opacity = 0;
        },
      );
      return { mesh, layer, baseX };
    });

    // Floating particles add depth between the image layers.
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -9 + Math.random() * 13;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa9e0f1,
      size: 0.07,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    geometries.push(particleGeometry);
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

    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

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

      layers.forEach(({ mesh, layer, baseX }, index) => {
        const side = index % 2 === 0 ? 1 : -1;
        mesh.position.x = baseX + pointer.x * layer.drift * 0.35 + Math.sin(time * 0.5 + index) * 0.08 * timeScale;
        mesh.position.y = -(smoothed - 0.5) * layer.drift * 2.6 + pointer.y * layer.drift * 0.2;
        mesh.rotation.y = (smoothed - 0.5) * 0.35 * side + pointer.x * 0.05;
      });

      camera.position.y = -(smoothed - 0.5) * 1.4 + pointer.y * 0.25;
      camera.position.x = pointer.x * 0.3;
      camera.lookAt(0, 0, 0);
      particles.rotation.y = smoothed * 0.6 + time * 0.02;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('resize', resize);
      stage.removeEventListener('pointermove', onPointerMove);
      geometries.forEach((geometry) => geometry.dispose());
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
