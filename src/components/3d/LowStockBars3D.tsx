import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, STATUS_COLORS } from '@/lib/three-helpers';
import { inventory } from '@/lib/inventory';
import { getStockStatus } from '@/lib/types';

// 3D bar chart of lowest-stock items — bars rise from the floor, colored by urgency
export function LowStockBars3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(6, 5, 8);
    camera.lookAt(0, 1.5, 0);

    addLighting(scene, 0xef4444);

    const products = inventory.lowStock().slice(0, 20);
    const spacing = 1.3;
    const cols = 5;
    const bars: THREE.Mesh[] = [];

    products.forEach((product, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2 + 0.5) * spacing;
      const z = (row - 1.5) * spacing;
      const status = getStockStatus(product.stock, product.reorderPoint);
      const color = STATUS_COLORS[status];
      const height = Math.max(0.15, product.stock / 12);

      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, height, 0.9),
        new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5, emissive: color, emissiveIntensity: 0.15 })
      );
      bar.position.set(x, height / 2, z);
      scene.add(bar);
      bars.push(bar);

      // Wireframe overlay
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(bar.geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
      );
      wire.position.copy(bar.position);
      scene.add(wire);
    });

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x0e1013, metalness: 0.3, roughness: 0.7, transparent: true, opacity: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 12, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    scene.add(grid);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    tick();

    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}
