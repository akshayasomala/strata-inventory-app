import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, createFloor, createCrate, STATUS_COLORS } from '@/lib/three-helpers';
import { inventory } from '@/lib/inventory';
import { getStockStatus } from '@/lib/types';

// Full 3D warehouse isometric scene — the dashboard centerpiece
export function WarehouseScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(7, 6, 7);
    camera.lookAt(0, 0.5, 0);

    addLighting(scene, 0x06b6d4);
    createFloor(scene, 24);

    // Build warehouse shelving units with crates
    const products = inventory.products();
    const aisleProducts = products.slice(0, 48);
    const cols = 8;
    const spacing = 2.2;

    const crates: THREE.Group[] = [];

    aisleProducts.forEach((product, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2 + 0.5) * spacing;
      const z = (row - 2.5) * spacing;
      const status = getStockStatus(product.stock, product.reorderPoint);
      const color = STATUS_COLORS[status];
      const stackHeight = Math.max(1, Math.min(4, Math.ceil(product.stock / 20)));

      for (let h = 0; h < stackHeight; h++) {
        const crate = createCrate(1.4, 0.5, 1.1, color);
        crate.position.set(x, 0.25 + h * 0.52, z);
        scene.add(crate);
        crates.push(crate);
      }

      // Shelf frame
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.6, roughness: 0.3 });
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, stackHeight * 0.55 + 0.1), frameMat);
      post1.position.set(x - 0.75, (stackHeight * 0.55) / 2, z - 0.6);
      scene.add(post1);
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, stackHeight * 0.55 + 0.1), frameMat);
      post2.position.set(x + 0.75, (stackHeight * 0.55) / 2, z - 0.6);
      scene.add(post2);
      const post3 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, stackHeight * 0.55 + 0.1), frameMat);
      post3.position.set(x - 0.75, (stackHeight * 0.55) / 2, z + 0.6);
      scene.add(post3);
      const post4 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, stackHeight * 0.55 + 0.1), frameMat);
      post4.position.set(x + 0.75, (stackHeight * 0.55) / 2, z + 0.6);
      scene.add(post4);
    });

    // Ambient floating particles for atmosphere
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 6 + 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.06,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Slow rotation
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.0015;
      particles.rotation.y -= 0.0008;
      renderer.render(scene, camera);
    };
    tick();

    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}
