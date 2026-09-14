import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting, createCrate, STATUS_COLORS } from '@/lib/three-helpers';
import type { Product } from '@/lib/types';
import { getStockStatus } from '@/lib/types';

// 3D grid of crates representing the product catalog — each tile is a product
export function CrateGrid3D({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef(products);
  productsRef.current = products;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(0, 8, 10);
    camera.lookAt(0, 0, 0);

    addLighting(scene, 0x06b6d4);

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const crateMeshes: THREE.Mesh[] = [];
    const crateProducts: Product[] = [];

    const items = productsRef.current.slice(0, 64);
    const cols = 8;
    const spacing = 1.6;

    items.forEach((product, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - cols / 2 + 0.5) * spacing;
      const z = (row - 3.5) * spacing;
      const status = getStockStatus(product.stock, product.reorderPoint);
      const color = STATUS_COLORS[status];
      const stackH = Math.max(1, Math.min(4, Math.ceil(product.stock / 22)));

      for (let h = 0; h < stackH; h++) {
        const crate = createCrate(1.2, 0.4, 0.95, color);
        crate.position.set(x, 0.2 + h * 0.42, z);
        scene.add(crate);
        if (h === stackH - 1) {
          const mesh = crate.children[0] as THREE.Mesh;
          crateMeshes.push(mesh);
          crateProducts.push(product);
        }
      }
    });

    // Ground
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0e1013, metalness: 0.3, roughness: 0.7, transparent: true, opacity: 0.5 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    const grid = new THREE.GridHelper(20, 20, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    scene.add(grid);

    let hovered: THREE.Object3D | null = null;
    let frame = 0;

    const handleClick = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(crateMeshes);
      if (intersects.length > 0) {
        const idx = crateMeshes.indexOf(intersects[0].object as THREE.Mesh);
        if (idx >= 0 && onSelectRef.current) {
          onSelectRef.current(crateProducts[idx]);
        }
      }
    };
    mountRef.current?.addEventListener('click', handleClick);

    const handleMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(crateMeshes);
      if (hovered && hovered !== intersects[0]?.object) {
        (hovered as THREE.Mesh).scale.set(1, 1, 1);
        hovered = null;
      }
      if (intersects.length > 0 && hovered !== intersects[0].object) {
        hovered = intersects[0].object;
        hovered.scale.set(1.08, 1.08, 1.08);
      }
    };
    mountRef.current?.addEventListener('mousemove', handleMove);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      mountRef.current?.removeEventListener('click', handleClick);
      mountRef.current?.removeEventListener('mousemove', handleMove);
    };
  });

  return <div ref={mountRef} className="w-full h-full cursor-pointer" />;
}
