import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { inventory, onInventoryEvent } from '@/lib/inventory';
import type { InventoryEvent } from '@/lib/inventory';
import { getStockStatus } from '@/lib/types';
import type { Product } from '@/lib/types';

const STATUS_COLOR: Record<string, number> = {
  healthy: 0x06b6d4,
  low: 0xf59e0b,
  critical: 0xef4444,
};

function createWorker(color: number, hasClipboard = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8b93a8, metalness: 0.1, roughness: 0.8 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.2, roughness: 0.7 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.35, 4, 8), bodyMat);
  torso.position.y = 0.55; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), skinMat);
  head.position.y = 0.95; g.add(head);

  const armGeo = new THREE.CapsuleGeometry(0.05, 0.3, 4, 6);
  const lArm = new THREE.Mesh(armGeo, bodyMat); lArm.position.set(-0.22, 0.55, 0); lArm.rotation.z = 0.3; g.add(lArm);
  const rArm = new THREE.Mesh(armGeo, bodyMat); rArm.position.set(0.22, 0.55, 0); rArm.rotation.z = -0.3; g.add(rArm);

  const legGeo = new THREE.CapsuleGeometry(0.06, 0.3, 4, 6);
  const lLeg = new THREE.Mesh(legGeo, legMat); lLeg.position.set(-0.1, 0.15, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(legGeo, legMat); rLeg.position.set(0.1, 0.15, 0); g.add(rLeg);

  if (hasClipboard) {
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.1, roughness: 0.8 }));
    clip.position.set(0.25, 0.5, 0.08); clip.rotation.z = -0.2; g.add(clip);
  }
  return g;
}

function createForklift(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.6, roughness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 });
  const forkMat = new THREE.MeshStandardMaterial({ color: 0x6b7388, metalness: 0.7, roughness: 0.3 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 1.1), bodyMat);
  chassis.position.y = 0.3; g.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), darkMat);
  cabin.position.set(0, 0.65, 0.1); g.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  [[-0.35, 0.12, 0.35], [0.35, 0.12, 0.35], [-0.35, 0.12, -0.35], [0.35, 0.12, -0.35]].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, y, z); g.add(w);
  });

  [-0.15, 0.15].forEach((x) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.6), forkMat);
    f.position.set(x, 0.15, -0.45); g.add(f);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), forkMat);
    m.position.set(x, 0.4, -0.15); g.add(m);
  });

  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.3, roughness: 0.5 }));
  crate.position.set(0, 0.4, -0.45); crate.visible = false;
  crate.name = 'carriedCrate'; g.add(crate);

  return g;
}

function createTruck(): THREE.Group {
  const g = new THREE.Group();
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.4, roughness: 0.4 });
  const trailerMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.3, roughness: 0.6 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 2.2), trailerMat);
  trailer.position.set(0, 0.7, 0.3); g.add(trailer);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.8), cabMat);
  cab.position.set(0, 0.55, -1.1); g.add(cab);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.7 }));
  windshield.position.set(0, 0.65, -1.5); g.add(windshield);

  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  [[-0.6, 0.15, -1.0], [0.6, 0.15, -1.0], [-0.6, 0.15, 0.3], [0.6, 0.15, 0.3], [-0.6, 0.15, 0.9], [0.6, 0.15, 0.9]].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(x, y, z); g.add(w);
  });

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.5, roughness: 0.4 }));
  door.position.set(0, 0.7, 1.43); door.name = 'truckDoor'; g.add(door);

  const dCrate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.5 }));
  dCrate.position.set(0, 0.4, 1.5); dCrate.visible = false;
  dCrate.name = 'deliveryCrate'; g.add(dCrate);

  return g;
}

function createDesk(): THREE.Group {
  const g = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.3, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.5), deskMat);
  top.position.y = 0.4; g.add(top);

  [[-0.4, 0.2, -0.2], [0.4, 0.2, -0.2], [-0.4, 0.2, 0.2], [0.4, 0.2, 0.2]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), deskMat);
    leg.position.set(x, y, z); g.add(leg);
  });

  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), darkMat);
  stand.position.set(0, 0.49, 0); g.add(stand);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.27, 0.04), darkMat);
  frame.position.set(0, 0.65, -0.015); g.add(frame);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.3 }));
  screen.position.set(0, 0.65, 0); screen.name = 'deskScreen'; g.add(screen);

  return g;
}

function createShelf(): THREE.Group {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a4050, metalness: 0.6, roughness: 0.3 });

  [[-0.5, 0.9, -0.25], [0.5, 0.9, -0.25], [-0.5, 0.9, 0.25], [0.5, 0.9, 0.25]].forEach(([x, y, z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.06), frameMat);
    p.position.set(x, y, z); g.add(p);
  });

  for (let i = 0; i < 3; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.6), frameMat);
    board.position.set(0, 0.1 + i * 0.6, 0); g.add(board);
  }

  return g;
}

type ForkliftState = 'idle' | 'toStaging' | 'atStaging' | 'toShelves' | 'atShelves';

interface SimState {
  forkliftState: ForkliftState;
  forkliftProgress: number;
  truckDoorOpen: number;
  deliveryCrateOut: number;
  screenFlash: number;
  screenFlashColor: THREE.Color;
}

export function WarehouseSimulation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0b0d, 15, 35);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    let camAngle = 0.6;
    let targetAngle = 0.6;
    const camRadius = 14;
    const camHeight = 9;
    const updateCamera = () => {
      camera.position.set(Math.cos(camAngle) * camRadius, camHeight, Math.sin(camAngle) * camRadius);
      camera.lookAt(0, 1, 0);
    };
    updateCamera();

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x111827, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 5); scene.add(dir);
    const amberLight = new THREE.PointLight(0xf59e0b, 1.5, 12);
    amberLight.position.set(-4, 3, 2); scene.add(amberLight);
    const cyanLight = new THREE.PointLight(0x06b6d4, 1.5, 12);
    cyanLight.position.set(4, 3, -2); scene.add(cyanLight);

    // Floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x13161b, metalness: 0.2, roughness: 0.8 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
    floor.rotation.x = -Math.PI / 2; scene.add(floor);

    const grid = new THREE.GridHelper(12, 24, 0x2a2f38, 0x181b21);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.4;
    scene.add(grid);

    // Walls (3 walls — open top, open front)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0e1013, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide });
    const wallH = 3.5;
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, wallH), wallMat);
    backWall.position.set(0, wallH / 2, -6); scene.add(backWall);
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, wallH), wallMat);
    leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-6, wallH / 2, 0); scene.add(leftWall);
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, wallH), wallMat);
    rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(6, wallH / 2, 0); scene.add(rightWall);

    // Wall edge lines
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3a4050, transparent: true, opacity: 0.6 });
    const wallEdges: number[][][] = [
      [[-6, 0, -6], [6, 0, -6]], [[-6, wallH, -6], [6, wallH, -6]],
      [[-6, 0, -6], [-6, wallH, -6]], [[6, 0, -6], [6, wallH, -6]],
      [[-6, 0, 6], [-6, wallH, 6]], [[6, 0, 6], [6, wallH, 6]],
    ];
    wallEdges.forEach(([a, b]) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])]),
        edgeMat
      );
      scene.add(line);
    });

    // Shelving with crates (data-driven)
    const lowStock = inventory.lowStock();
    const allProducts = inventory.products();
    const lowByCat = new Map<string, Product[]>();
    lowStock.forEach((p) => {
      const arr = lowByCat.get(p.category) || [];
      arr.push(p); lowByCat.set(p.category, arr);
    });
    const healthyByCat = new Map<string, Product[]>();
    allProducts.filter((p) => p.stock > p.reorderPoint).forEach((p) => {
      const arr = healthyByCat.get(p.category) || [];
      arr.push(p); healthyByCat.set(p.category, arr);
    });

    const shelfPositions: Array<[number, number, number]> = [
      [-3, -5, 0], [-1, -5, 0], [1, -5, 0],
      [-5, -3, Math.PI / 2], [-5, -1, Math.PI / 2], [-5, 1, Math.PI / 2],
    ];

    const crateGeo = new THREE.BoxGeometry(0.3, 0.22, 0.3);
    const crateEdgeGeo = new THREE.EdgesGeometry(crateGeo);
    const crateEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });

    const simState: SimState = {
      forkliftState: 'idle',
      forkliftProgress: 0,
      truckDoorOpen: 0,
      deliveryCrateOut: 0,
      screenFlash: 0,
      screenFlashColor: new THREE.Color(0x06b6d4),
    };

    const shelfCrateMeshes: THREE.Mesh[] = [];
    const lowKeys = Array.from(lowByCat.keys());
    const healthyKeys = Array.from(healthyByCat.keys());

    shelfPositions.forEach((shelfPos, shelfIdx) => {
      const [sx, sz, srot] = shelfPos;
      const shelf = createShelf();
      shelf.position.set(sx, 0, sz);
      shelf.rotation.y = srot;
      scene.add(shelf);

      for (let level = 0; level < 3; level++) {
        const pool: Product[] = (level + shelfIdx) % 2 === 0
          ? (lowByCat.get(lowKeys[shelfIdx % Math.max(lowKeys.length, 1)] || '') || [])
          : (healthyByCat.get(healthyKeys[shelfIdx % Math.max(healthyKeys.length, 1)] || '') || []);
        const product = pool[(shelfIdx * 3 + level) % Math.max(pool.length, 1)] || allProducts[shelfIdx * 3 + level];
        if (!product) continue;

        const status = getStockStatus(product.stock, product.reorderPoint);
        const color = STATUS_COLOR[status];

        const stackCount = Math.max(1, Math.min(3, Math.ceil(product.stock / 30)));
        for (let s = 0; s < stackCount; s++) {
          const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5, emissive: color, emissiveIntensity: 0.05 });
          const crate = new THREE.Mesh(crateGeo, mat);
          const localX = (s % 2) * 0.35 - 0.17;
          const localY = 0.22 + level * 0.6 + s * 0.24;
          const cos = Math.cos(srot);
          const sin = Math.sin(srot);
          crate.position.set(sx + localX * cos, localY, sz - localX * sin);
          crate.userData.productId = product.id;
          scene.add(crate);
          shelfCrateMeshes.push(crate);

          const edges = new THREE.LineSegments(crateEdgeGeo, crateEdgeMat);
          edges.position.copy(crate.position);
          scene.add(edges);
        }
      }
    });

    // Forklift
    const forklift = createForklift();
    const forkliftStart = new THREE.Vector3(2, 0, 2);
    const stagingArea = new THREE.Vector3(0, 0, 3);
    const shelfPickup = new THREE.Vector3(-3, 0, -4);
    forklift.position.copy(forkliftStart);
    scene.add(forklift);
    const carriedCrate = forklift.getObjectByName('carriedCrate') as THREE.Mesh;

    // Workers
    const worker1 = createWorker(0x06b6d4);
    worker1.position.set(3, 0, 1);
    worker1.rotation.y = -Math.PI / 4;
    scene.add(worker1);

    const worker2 = createWorker(0xf59e0b, true);
    worker2.position.set(-2, 0, 3);
    worker2.rotation.y = Math.PI / 6;
    scene.add(worker2);

    // Truck
    const truck = createTruck();
    truck.position.set(4.5, 0, 2);
    truck.rotation.y = -Math.PI / 2;
    scene.add(truck);
    const truckDoor = truck.getObjectByName('truckDoor') as THREE.Mesh;
    const deliveryCrate = truck.getObjectByName('deliveryCrate') as THREE.Mesh;

    // Desk
    const desk = createDesk();
    desk.position.set(-4.5, 0, 4);
    desk.rotation.y = Math.PI / 4;
    scene.add(desk);
    const deskScreen = desk.getObjectByName('deskScreen') as THREE.Mesh;

    // Drag-to-rotate camera
    let isDragging = false;
    let lastX = 0;
    let autoOrbit = true;
    let userInactivityTimer = 0;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      autoOrbit = false;
      userInactivityTimer = 0;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      lastX = clientX;
    };
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const dx = clientX - lastX;
      lastX = clientX;
      targetAngle += dx * 0.008;
    };
    const handleUp = () => {
      isDragging = false;
      userInactivityTimer = 0;
    };

    mount.addEventListener('mousedown', handleDown);
    mount.addEventListener('touchstart', handleDown, { passive: true });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    // Event subscription
    const handleInventoryEvent = (event: InventoryEvent) => {
      if (event.type === 'mutation' || event.type === 'undo') {
        simState.screenFlash = 1;
        simState.screenFlashColor.set(event.type === 'undo' ? 0xf59e0b : 0x06b6d4);

        const product = inventory.getProduct(event.mutation.productId);
        if (product) {
          const status = getStockStatus(product.stock, product.reorderPoint);
          const newColor = STATUS_COLOR[status];
          shelfCrateMeshes.forEach((m) => {
            if (m.userData.productId === product.id) {
              (m.material as THREE.MeshStandardMaterial).color.setHex(newColor);
              (m.material as THREE.MeshStandardMaterial).emissive.setHex(newColor);
            }
          });
        }
      }

      if (event.type === 'restock-processed') {
        if (simState.forkliftState === 'idle') {
          simState.forkliftState = 'toStaging';
          simState.forkliftProgress = 0;
        }
        simState.truckDoorOpen = 1;
        simState.deliveryCrateOut = 1;
      }
    };

    const unsubEvents = onInventoryEvent(handleInventoryEvent);

    // Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let frame = 0;
    let time = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      time += 0.016;

      if (!isDragging) {
        userInactivityTimer += 0.016;
        if (userInactivityTimer > 3) autoOrbit = true;
      }
      if (autoOrbit) targetAngle += 0.003;
      camAngle = lerp(camAngle, targetAngle, 0.05);
      updateCamera();

      worker1.position.y = Math.sin(time * 1.5) * 0.03;
      worker1.rotation.y = -Math.PI / 4 + Math.sin(time * 0.5) * 0.1;
      worker2.position.y = Math.sin(time * 1.5 + 1) * 0.03;
      worker2.rotation.y = Math.PI / 6 + Math.cos(time * 0.4) * 0.08;

      if (simState.screenFlash > 0) {
        simState.screenFlash = Math.max(0, simState.screenFlash - 0.02);
        const mat = deskScreen.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.3 + simState.screenFlash * 2;
        mat.emissive.copy(simState.screenFlashColor);
      }

      if (simState.truckDoorOpen > 0) {
        simState.truckDoorOpen = Math.max(0, simState.truckDoorOpen - 0.008);
        truckDoor.position.y = 0.7 + (1 - simState.truckDoorOpen) * 0.5;
        truckDoor.visible = simState.truckDoorOpen > 0.05;
      }
      if (simState.deliveryCrateOut > 0) {
        simState.deliveryCrateOut = Math.max(0, simState.deliveryCrateOut - 0.006);
        deliveryCrate.visible = true;
        deliveryCrate.position.z = 1.5 + (1 - simState.deliveryCrateOut) * 0.8;
        if (simState.deliveryCrateOut < 0.05) deliveryCrate.visible = false;
      }

      const fl = forklift;
      if (simState.forkliftState !== 'idle') {
        simState.forkliftProgress += 0.008;
        const t = simState.forkliftProgress;

        if (simState.forkliftState === 'toStaging') {
          const p = easeInOut(Math.min(t, 1));
          fl.position.lerpVectors(shelfPickup, stagingArea, p);
          fl.lookAt(stagingArea.x, 0, stagingArea.z);
          if (t >= 1) { simState.forkliftState = 'atStaging'; simState.forkliftProgress = 0; if (carriedCrate) carriedCrate.visible = false; }
        } else if (simState.forkliftState === 'atStaging') {
          if (t >= 0.3) { simState.forkliftState = 'toShelves'; simState.forkliftProgress = 0; if (carriedCrate) carriedCrate.visible = true; }
        } else if (simState.forkliftState === 'toShelves') {
          const p = easeInOut(Math.min(t, 1));
          fl.position.lerpVectors(stagingArea, shelfPickup, p);
          fl.lookAt(shelfPickup.x, 0, shelfPickup.z);
          if (t >= 1) { simState.forkliftState = 'atShelves'; simState.forkliftProgress = 0; if (carriedCrate) carriedCrate.visible = false; }
        } else if (simState.forkliftState === 'atShelves') {
          if (t >= 0.5) { simState.forkliftState = 'idle'; simState.forkliftProgress = 0; fl.position.copy(forkliftStart); }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      unsubEvents();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
      mount.removeEventListener('mousedown', handleDown);
      mount.removeEventListener('touchstart', handleDown);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
