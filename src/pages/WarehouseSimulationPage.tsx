import { Suspense, lazy, useState } from 'react';
import { Boxes, Play, RotateCcw, Truck } from 'lucide-react';
import { inventory } from '@/lib/inventory';

const WarehouseSimulation = lazy(() =>
  import('@/components/3d/WarehouseSimulation').then((m) => ({ default: m.WarehouseSimulation }))
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[600px]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-ink-600 border-t-amber mb-4" />
        <p className="text-sm text-ink-400 font-mono">Loading 3D warehouse scene...</p>
      </div>
    </div>
  );
}

export function WarehouseSimulationPage() {
  const [, refresh] = useState(0);
  const queue = inventory.restockQueue();

  const processNext = () => {
    inventory.processRestock();
    refresh((v) => v + 1);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan font-mono mb-2">Simulation / Live 3D</p>
        <h1 className="text-3xl font-semibold text-ink-100">Warehouse Simulation</h1>
        <p className="text-sm text-ink-300 mt-2 max-w-2xl">
          A live isometric 3D model of your warehouse. Shelves show real stock data — crate colors
          reflect urgency (cyan = healthy, amber = low, red = critical). The forklift runs when a
          restock is processed, the truck door opens on delivery, and the desk screen flashes on
          every inventory mutation.
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-ink-100">Isometric Warehouse</h2>
            <p className="text-xs text-ink-400 mt-1">Drag to rotate · auto-orbits when idle · reacts to real backend events</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" /> 3D LIVE
          </div>
        </div>
        <div className="h-[600px] relative bg-ink-950">
          <Suspense fallback={<LoadingFallback />}>
            <WarehouseSimulation />
          </Suspense>
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-ink-500 bg-ink-900/60 px-2 py-1 rounded">
            WebGL · Three.js · Drag to rotate
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-sm text-ink-100 font-medium">Restock Queue</p>
              <p className="text-xs text-ink-400">{queue.length} requests waiting</p>
            </div>
          </div>
          <button
            className="btn btn-primary w-full justify-center"
            onClick={processNext}
            disabled={queue.length === 0}
          >
            <Play size={16} /> Process next restock
          </button>
          <p className="text-xs text-ink-400 mt-3">
            Triggers the forklift delivery animation and opens the truck door.
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-amber/10 text-amber-light flex items-center justify-center">
              <Boxes size={18} />
            </div>
            <div>
              <p className="text-sm text-ink-100 font-medium">Shelf Data</p>
              <p className="text-xs text-ink-400">Pulled from heap + hash table</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-cyan" /> <span className="text-ink-300">Healthy stock</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-amber" /> <span className="text-ink-300">Low stock</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-danger" /> <span className="text-ink-300">Critical stock</span>
            </div>
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg bg-danger/10 text-danger-light flex items-center justify-center">
              <RotateCcw size={18} />
            </div>
            <div>
              <p className="text-sm text-ink-100 font-medium">Event-Driven</p>
              <p className="text-xs text-ink-400">Reacts to real actions</p>
            </div>
          </div>
          <p className="text-xs text-ink-400 leading-relaxed">
            When you edit a product, undo a change, or process a restock from any other page, this
            scene plays the corresponding animation — a forklift run, a crate color change, or a
            desk screen flash.
          </p>
        </div>
      </div>
    </div>
  );
}
