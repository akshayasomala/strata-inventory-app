import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, createCrate, STATUS_COLORS } from '@/lib/three-helpers';
import type { Product } from '@/lib/types';
import { getStockStatus } from '@/lib/types';

// 3D crate stack for product detail — taller, more dramatic
export function CrateStack3D({ product }: { product: Product }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(4, 3.5, 5);
    camera.lookAt(0, 1.2, 0);

    addLighting(scene, STATUS_COLORS[getStockStatus(product.stock, product.reorderPoint)]);

    const status = getStockStatus(product.stock, product.reorderPoint);
    const color = STATUS_COLORS[status];
    const count = Math.max(1, Math.min(8, Math.ceil(product.stock / 12)));

    const group = new THREE.Group();

    for (let i = 0; i < count; i++) {
      const crate = createCrate(1.8, 0.6, 1.4, color, 0.4, 0.5);
      crate.position.y = i * 0.63;
      // Slight wobble offset for visual interest
      crate.position.x = Math.sin(i * 0.5) * 0.05;
      crate.rotation.z = Math.sin(i * 0.3) * 0.02;
      group.add(crate);
    }

    // Pallet base
    const palletMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.7, roughness: 0.3 });
    const pallet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.8), palletMat);
    pallet.position.y = -0.06;
    group.add(pallet);

    // Floor reflection plane
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1013,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.12;
    scene.add(floor);

    scene.add(group);

    // Floating stock number in 3D space using a sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(245, 158, 11, 1)';
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(product.stock), 128, 70);
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(170, 178, 196, 1)';
    ctx.fillText('UNITS', 128, 100);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(3, count * 0.63 + 0.5, 0);
    sprite.scale.set(1.5, 0.75, 1);
    scene.add(sprite);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      group.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      texture.dispose();
      spriteMat.dispose();
    };
  }, [product.id, product.stock, product.reorderPoint]);

  return <div ref={mountRef} className="w-full h-full" />;
}
