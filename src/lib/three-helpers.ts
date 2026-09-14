import { useEffect } from 'react';
import * as THREE from 'three';

// Shared 3D scene hook — handles renderer setup, resize, and cleanup
export function useThreeScene(
  mountRef: React.RefObject<HTMLDivElement>,
  setup: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => () => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const cleanup = setup(scene, camera, renderer);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      cleanup();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const STATUS_COLORS: Record<string, number> = {
  healthy: 0x06b6d4,
  low: 0xf59e0b,
  critical: 0xef4444,
};

export const STATUS_HEX: Record<string, string> = {
  healthy: '#06b6d4',
  low: '#f59e0b',
  critical: '#ef4444',
};

export function createCrate(
  width: number,
  height: number,
  depth: number,
  color: number,
  metalness = 0.3,
  roughness = 0.6
): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  group.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
  );
  group.add(edges);

  return group;
}

export function addLighting(scene: THREE.Scene, accentColor: number = 0x06b6d4) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111827, 1.2));
  const dir = new THREE.DirectionalLight(0xffffff, 1.5);
  dir.position.set(5, 8, 5);
  scene.add(dir);
  const point = new THREE.PointLight(accentColor, 2, 15);
  point.position.set(-3, 2, 3);
  scene.add(point);
  const point2 = new THREE.PointLight(0xf59e0b, 1.5, 15);
  point2.position.set(3, 1, -2);
  scene.add(point2);
}

export function createFloor(scene: THREE.Scene, size = 20) {
  const grid = new THREE.GridHelper(size, 20, 0x2a2f38, 0x181b21);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.5;
  scene.add(grid);
}

// Mouse parallax — subtle camera drift based on pointer position
export function useParallax(
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>,
  intensity = 0.15
) {
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!cameraRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * intensity;
      const y = (e.clientY / window.innerHeight - 0.5) * intensity;
      cameraRef.current.position.x += (x * 3 - cameraRef.current.position.x) * 0.05;
      cameraRef.current.position.y += (-y * 2 - cameraRef.current.position.y + 2) * 0.05;
      cameraRef.current.lookAt(0, 0.5, 0);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [cameraRef, intensity]);
}
