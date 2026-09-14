import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, STATUS_COLORS } from '@/lib/three-helpers';
import { inventory } from '@/lib/inventory';
import { getStockStatus } from '@/lib/types';

// 3D scatter plot — price (X) vs stock (Z depth) vs stock-level (Y height), colored by status
export function PriceScatter3D({ minPrice, maxPrice }: { minPrice: number; maxPrice: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef({ minPrice, maxPrice });
  rangeRef.current = { minPrice, maxPrice };

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(8, 7, 9);
    camera.lookAt(0, 1, 0);

    addLighting(scene, 0x06b6d4);

    const { minPrice, maxPrice } = rangeRef.current;
    const products = inventory.priceRange(minPrice, maxPrice).slice(0, 100);

    const priceMin = Math.min(...inventory.products().map(p => p.price));
    const priceMax = Math.max(...inventory.products().map(p => p.price));
    const stockMax = Math.max(...inventory.products().map(p => p.stock));

    const spheres: THREE.Mesh[] = [];

    products.forEach((product) => {
      const status = getStockStatus(product.stock, product.reorderPoint);
      const color = STATUS_COLORS[status];
      const x = ((product.price - priceMin) / (priceMax - priceMin)) * 8 - 4;
      const z = ((product.stock - 0) / stockMax) * 6 - 3;
      const y = Math.max(0.2, (product.stock / stockMax) * 4 + 0.3);
      const size = 0.15 + (product.price / priceMax) * 0.2;

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16),
        new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4, emissive: color, emissiveIntensity: 0.1 })
      );
      sphere.position.set(x, y, z);
      scene.add(sphere);
      spheres.push(sphere);
    });

    // Axis lines
    const axisMat = new THREE.LineBasicMaterial({ color: 0x3a4050, transparent: true, opacity: 0.6 });
    const xAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.5, 0, -3.5), new THREE.Vector3(4.5, 0, -3.5)]), axisMat);
    const zAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.5, 0, -3.5), new THREE.Vector3(-4.5, 0, 3.5)]), axisMat);
    const yAxis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.5, 0, -3.5), new THREE.Vector3(-4.5, 4.5, -3.5)]), axisMat);
    scene.add(xAxis, zAxis, yAxis);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      new THREE.MeshStandardMaterial({ color: 0x0e1013, metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 12, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.2;
    scene.add(grid);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    tick();

    return () => cancelAnimationFrame(frame);
  }, [minPrice, maxPrice]);

  return <div ref={mountRef} className="w-full h-full" />;
}
