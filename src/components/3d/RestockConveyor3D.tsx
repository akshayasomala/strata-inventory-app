import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, createCrate } from '@/lib/three-helpers';
import { inventory } from '@/lib/inventory';

// 3D conveyor belt — restock requests move along a FIFO track
export function RestockConveyor3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0.5, 0);

    addLighting(scene, 0x06b6d4);

    // Conveyor belt
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, metalness: 0.5, roughness: 0.4 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(10, 0.08, 2), beltMat);
    belt.position.set(0, 0.04, 0);
    scene.add(belt);

    // Belt stripes (moving animation)
    const stripes: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.01, 1.8),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.3 })
      );
      stripe.position.set(-4.5 + i * 1, 0.09, 0);
      scene.add(stripe);
      stripes.push(stripe);
    }

    // Side rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.7, roughness: 0.3 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.15, 0.05), railMat);
    rail1.position.set(0, 0.1, 1);
    scene.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.15, 0.05), railMat);
    rail2.position.set(0, 0.1, -1);
    scene.add(rail2);

    // Crates on the belt
    const queue = inventory.restockQueue();
    const crates: THREE.Group[] = [];
    const cratePositions: number[] = [];

    if (queue.length === 0) {
      // Show empty belt with a placeholder
      const placeholder = createCrate(1.5, 0.5, 1.2, 0x3a4050, 0.2, 0.8);
      placeholder.position.set(0, 0.35, 0);
      scene.add(placeholder);
    } else {
      queue.slice(0, 6).forEach((request, i) => {
        const color = i === 0 ? 0x06b6d4 : 0xf59e0b;
        const crate = createCrate(1.5, 0.5, 1.2, color);
        const startX = 4 - i * 1.6;
        crate.position.set(startX, 0.35, 0);
        scene.add(crate);
        crates.push(crate);
        cratePositions.push(startX);
      });
    }

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 12),
      new THREE.MeshStandardMaterial({ color: 0x0e1013, metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    const grid = new THREE.GridHelper(16, 16, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.2;
    scene.add(grid);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      // Move belt stripes
      stripes.forEach((s) => {
        s.position.x += 0.02;
        if (s.position.x > 5) s.position.x = -5;
      });
      // Gentle crate bob
      crates.forEach((c, i) => {
        c.position.y = 0.35 + Math.sin(frame * 0.03 + i) * 0.03;
        c.rotation.y += 0.002;
      });
      renderer.render(scene, camera);
    };
    tick();

    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}
