import { useRef } from 'react';
import * as THREE from 'three';
import { useThreeScene, addLighting } from '@/lib/three-helpers';

// Hash table 3D visualization — buckets with chains
export function HashTableViz3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(5, 5, 7);
    camera.lookAt(0, 1, 0);
    addLighting(scene, 0x06b6d4);

    const bucketCount = 8;
    const bucketSpacing = 1.2;
    const buckets: THREE.Mesh[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const x = (i - bucketCount / 2 + 0.5) * bucketSpacing;
      const bucket = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x181b21, metalness: 0.5, roughness: 0.4 })
      );
      bucket.position.set(x, 0.15, 0);
      scene.add(bucket);
      buckets.push(bucket);

      // Chain nodes — simulate collision chains
      const chainLength = (i * 3) % 4 + 1;
      for (let j = 0; j < chainLength; j++) {
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.3, roughness: 0.5, emissive: 0x06b6d4, emissiveIntensity: 0.2 })
        );
        node.position.set(x, 0.5 + j * 0.5, 0);
        scene.add(node);

        // Link line
        if (j === 0) {
          const link = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.3, 0), new THREE.Vector3(x, 0.32, 0)]),
            new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.4 })
          );
          scene.add(link);
        } else {
          const link = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.5 + (j - 1) * 0.5, 0), new THREE.Vector3(x, 0.5 + j * 0.5, 0)]),
            new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.4 })
          );
          scene.add(link);
        }
      }
    }

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: 0x0e1013, transparent: true, opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const grid = new THREE.GridHelper(14, 14, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.2;
    scene.add(grid);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.003;
      renderer.render(scene, camera);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}

// AVL Tree 3D visualization — balanced tree with nodes
export function AVLTreeViz3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 1.5, 0);
    addLighting(scene, 0xf59e0b);

    const nodes: THREE.Mesh[] = [];
    const edges: THREE.Line[] = [];

    // Build a balanced binary tree of depth 3
    const buildNode = (x: number, y: number, z: number, depth: number, parent: THREE.Vector3 | null) => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.5, emissive: 0xf59e0b, emissiveIntensity: 0.15 })
      );
      node.position.set(x, y, z);
      scene.add(node);
      nodes.push(node);

      if (parent) {
        const edge = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([parent, new THREE.Vector3(x, y, z)]),
          new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 })
        );
        scene.add(edge);
        edges.push(edge);
      }

      if (depth > 0) {
        const spread = 2.5 * Math.pow(0.6, 2 - depth);
        buildNode(x - spread, y - 1, z + 0.5, depth - 1, new THREE.Vector3(x, y, z));
        buildNode(x + spread, y - 1, z + 0.5, depth - 1, new THREE.Vector3(x, y, z));
      }
    };

    buildNode(0, 3.5, 0, 2, null);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0x0e1013, transparent: true, opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.003;
      nodes.forEach((n, i) => { n.scale.setScalar(1 + Math.sin(frame * 0.02 + i) * 0.05); });
      renderer.render(scene, camera);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}

// Min-Heap 3D visualization — pyramid of nodes
export function MinHeapViz3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(4, 5, 7);
    camera.lookAt(0, 1.5, 0);
    addLighting(scene, 0xef4444);

    const nodes: THREE.Mesh[] = [];
    const levels = 4;
    let nodeIdx = 0;

    for (let level = 0; level < levels; level++) {
      const count = Math.pow(2, level);
      const y = 3.5 - level * 0.9;
      const spread = 4 * Math.pow(0.55, level);
      for (let i = 0; i < count; i++) {
        const x = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        const color = level === 0 ? 0xef4444 : level === 1 ? 0xf59e0b : 0x06b6d4;
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.28 - level * 0.03, 16, 16),
          new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5, emissive: color, emissiveIntensity: 0.2 })
        );
        node.position.set(x, y, 0);
        scene.add(node);
        nodes.push(node);

        // Connect to parent
        if (level > 0) {
          const parentIdx = Math.floor((nodeIdx - 1) / 2);
          const parent = nodes[parentIdx];
          const edge = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([parent.position.clone(), node.position.clone()]),
            new THREE.LineBasicMaterial({ color: 0x3a4050, transparent: true, opacity: 0.5 })
          );
          scene.add(edge);
        }
        nodeIdx++;
      }
    }

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0x0e1013, transparent: true, opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.003;
      nodes.forEach((n, i) => { n.position.y += Math.sin(frame * 0.02 + i * 0.5) * 0.002; });
      renderer.render(scene, camera);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}

// Stack 3D visualization — vertical stack of plates
export function StackViz3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(3, 3, 6);
    camera.lookAt(0, 1.5, 0);
    addLighting(scene, 0x06b6d4);

    const plates: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const color = i === 4 ? 0x06b6d4 : 0x1f232b;
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.3, 24),
        new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4, emissive: i === 4 ? 0x06b6d4 : 0x000000, emissiveIntensity: 0.2 })
      );
      plate.position.set(0, 0.15 + i * 0.35, 0);
      scene.add(plate);
      plates.push(plate);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(plate.geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
      );
      wire.position.copy(plate.position);
      scene.add(wire);
    }

    // Arrow pointing up (push direction)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1), arrowMat);
    arrowShaft.position.set(1.2, 1.5, 0);
    scene.add(arrowShaft);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25), arrowMat);
    arrowHead.position.set(1.2, 2.1, 0);
    scene.add(arrowHead);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x0e1013, transparent: true, opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.004;
      // Top plate pulses
      const top = plates[plates.length - 1];
      top.scale.setScalar(1 + Math.sin(frame * 0.05) * 0.05);
      renderer.render(scene, camera);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}

// Queue 3D visualization — horizontal track of cubes
export function QueueViz3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (scene, camera, renderer) => {
    camera.position.set(0, 4, 7);
    camera.lookAt(0, 0.5, 0);
    addLighting(scene, 0xf59e0b);

    const cubes: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
      const color = i === 0 ? 0xf59e0b : 0x1f232b;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5, emissive: i === 0 ? 0xf59e0b : 0x000000, emissiveIntensity: 0.2 })
      );
      cube.position.set(-3.2 + i * 1.4, 0.4, 0);
      scene.add(cube);
      cubes.push(cube);

      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(cube.geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
      );
      wire.position.copy(cube.position);
      scene.add(wire);
    }

    // Track rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.6, roughness: 0.3 });
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), railMat);
    rail1.position.set(0, 0.02, 0.5);
    scene.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.05), railMat);
    rail2.position.set(0, 0.02, -0.5);
    scene.add(rail2);

    // Arrows: enqueue (right) and dequeue (left)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const deqArrow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3), arrowMat);
    deqArrow.rotation.z = Math.PI / 2;
    deqArrow.position.set(-4.2, 0.4, 0);
    scene.add(deqArrow);
    const enqArrow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3), arrowMat);
    enqArrow.rotation.z = -Math.PI / 2;
    enqArrow.position.set(4.2, 0.4, 0);
    scene.add(enqArrow);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ color: 0x0e1013, transparent: true, opacity: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      scene.rotation.y += 0.003;
      cubes.forEach((c, i) => { c.position.y = 0.4 + Math.sin(frame * 0.03 + i) * 0.02; });
      renderer.render(scene, camera);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  });

  return <div ref={mountRef} className="w-full h-full" />;
}
