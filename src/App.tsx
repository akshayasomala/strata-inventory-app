import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, BarChart3, Boxes, ChevronRight,
  CircleHelp, Clock3, Database, DollarSign, Gauge, History, LayoutDashboard,
  Menu, Package, Plus, Search, Settings2, SlidersHorizontal, Sparkles, Truck,
  Undo2, X, Zap,
} from 'lucide-react';
import { inventory } from '@/lib/inventory';
import type { Product, StockStatus } from '@/lib/types';
import { getStockStatus } from '@/lib/types';
import { WarehouseScene } from '@/components/3d/WarehouseScene';
import { CrateStack3D } from '@/components/3d/CrateStack3D';
import { CrateGrid3D } from '@/components/3d/CrateGrid3D';
import { LowStockBars3D } from '@/components/3d/LowStockBars3D';
import { PriceScatter3D } from '@/components/3d/PriceScatter3D';
import { RestockConveyor3D } from '@/components/3d/RestockConveyor3D';
import {
  HashTableViz3D, AVLTreeViz3D, MinHeapViz3D, StackViz3D, QueueViz3D,
} from '@/components/3d/DataStructureViz3D';

type Page = 'dashboard' | 'products' | 'adjustments' | 'low-stock' | 'price-range' | 'restock' | 'complexity';

const navGroups = [
  { label: 'Operations', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'adjustments', label: 'Inventory Adjustments', icon: History },
    { id: 'restock', label: 'Stock Moves', icon: Truck },
  ]},
  { label: 'Analytics', items: [
    { id: 'low-stock', label: 'Low-Stock Report', icon: AlertTriangle },
    { id: 'price-range', label: 'Price Range Report', icon: BarChart3 },
    { id: 'complexity', label: 'Complexity Lab', icon: Gauge },
  ]},
];

const money = (n: number) => `$${n.toFixed(2)}`;
const timeAgo = (date: string) => {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
};

function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
    </span>
  );
}

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-amber font-mono mb-2">{eyebrow}</p>
      <h1 className="text-3xl font-semibold text-ink-100">{title}</h1>
      <p className="text-sm text-ink-300 mt-2">{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, detail, icon: Icon, accent }: {
  label: string; value: string; detail: string; icon: typeof Package; accent: 'amber' | 'cyan' | 'danger';
}) {
  return (
    <div className="panel p-5 relative overflow-hidden group">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-${accent}/10 blur-2xl group-hover:bg-${accent}/20 transition-colors`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-300 font-display">{label}</p>
          <p className="font-mono text-3xl text-ink-100 mt-2">{value}</p>
          <p className="text-xs text-ink-400 mt-2">{detail}</p>
        </div>
        <div className={`p-2.5 rounded-lg bg-${accent}/10 text-${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// 3D scene container — wraps a 3D component with a label and overlay info
function ScenePanel({ title, subtitle, children, height = 'h-[400px]' }: {
  title: string; subtitle: string; children: React.ReactNode; height?: string;
}) {
  return (
    <div className="panel overflow-hidden relative">
      <div className="panel-header flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-ink-100">{title}</h2>
          <p className="text-xs text-ink-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" /> 3D LIVE
        </div>
      </div>
      <div className={`relative ${height}`}>
        {children}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-ink-500 bg-ink-900/60 px-2 py-1 rounded">
          WebGL · Three.js
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const products = inventory.products();
  const low = inventory.lowStock();
  const stats = inventory.stats();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-amber font-mono mb-2">Operations overview</p>
          <h1 className="text-3xl font-semibold text-ink-100">Inventory Control Center</h1>
          <p className="text-sm text-ink-300 mt-2">Live 3D warehouse visualization across your catalog.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400 font-mono">
          <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" /> LIVE · STRUCTURES ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={String(products.length)} detail="Hash table records" icon={Boxes} accent="cyan" />
        <StatCard label="Units on Hand" value={products.reduce((a, p) => a + p.stock, 0).toLocaleString()} detail="Across 64 locations" icon={Package} accent="amber" />
        <StatCard label="Low Stock" value={String(low.length)} detail="Heap priority queue" icon={AlertTriangle} accent="danger" />
        <StatCard label="Inventory Value" value={money(products.reduce((a, p) => a + p.stock * p.price, 0))} detail="Current retail value" icon={DollarSign} accent="cyan" />
      </div>

      <ScenePanel title="Warehouse Overview" subtitle="Real-time 3D isometric view · crate stacks colored by stock urgency" height="h-[420px]">
        <WarehouseScene />
      </ScenePanel>

      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="panel">
          <div className="panel-header flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-ink-100">Attention required</h2>
              <p className="text-xs text-ink-400 mt-1">Min-heap · most urgent first</p>
            </div>
            <button className="btn btn-ghost text-xs" onClick={() => onNavigate('low-stock')}>
              View report <ChevronRight size={15} />
            </button>
          </div>
          <div className="divide-y divide-ink-800">
            {low.slice(0, 6).map((p) => (
              <button key={p.id} onClick={() => onNavigate('products')} className="w-full px-5 py-3 flex items-center justify-between hover:bg-ink-850 text-left">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getStockStatus(p.stock, p.reorderPoint) === 'critical' ? 'bg-danger/10 text-danger-light' : 'bg-amber/10 text-amber-light'}`}>
                    <Package size={15} />
                  </div>
                  <div>
                    <p className="text-sm text-ink-100">{p.name}</p>
                    <p className="text-xs font-mono text-ink-400">{p.id} · {p.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-danger-light">{p.stock} units</p>
                  <p className="text-[10px] text-ink-400">reorder at {p.reorderPoint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2 className="text-lg font-medium text-ink-100">Structure telemetry</h2>
            <p className="text-xs text-ink-400 mt-1">Custom implementations · live metrics</p>
          </div>
          <div className="p-5 space-y-4">
            {([
              ['Hash Table', `${stats.products} records · ${stats.buckets} buckets`, 'O(1) lookup', 'cyan'],
              ['Trie', `${stats.trieNodes} nodes`, 'O(m) prefix search', 'amber'],
              ['AVL Tree', `${stats.avlNodes} unique prices`, 'O(log n + k) range', 'cyan'],
              ['Min-Heap', `${stats.heapSize} priority items`, 'O(log n) alert', 'danger'],
            ] as const).map(([a, b, c, color]) => (
              <div key={a} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full bg-${color}`} />
                  <div>
                    <p className="text-sm text-ink-100">{a}</p>
                    <p className="text-[11px] font-mono text-ink-400">{b}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-ink-300 bg-ink-800 px-2 py-1 rounded">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────
function Products({ onSelect }: { onSelect: (p: Product) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [view3D, setView3D] = useState(true);
  const products = useMemo(() => inventory.products(), []);
  const suggestions = query.length > 1 ? inventory.autocomplete(query) : [];
  const filtered = products.filter((p) =>
    (category === 'All' || p.category === category) &&
    (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()))
  );
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan font-mono mb-2">Catalog / Products</p>
          <h1 className="text-3xl font-semibold text-ink-100">Product Catalog</h1>
          <p className="text-sm text-ink-300 mt-2">{products.length} indexed products · hash table powered</p>
        </div>
        <div className="flex gap-3">
          <button className={`btn ${view3D ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView3D(!view3D)}>
            <Boxes size={16} /> {view3D ? '3D View' : 'Table View'}
          </button>
          <button className="btn btn-secondary"><Plus size={16} /> Add product</button>
        </div>
      </div>

      <div className="panel p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-3 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or product ID..."
            className="input w-full pl-10"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-20 top-12 left-0 right-0 panel shadow-2xl animate-slide-down">
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p); setQuery(''); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-ink-800 flex justify-between"
                >
                  <span className="text-sm text-ink-100">{p.name}</span>
                  <span className="text-xs font-mono text-ink-400">{p.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-48">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary"><SlidersHorizontal size={16} /> Filters</button>
      </div>

      {view3D ? (
        <ScenePanel
          title="3D Catalog Grid"
          subtitle="Click any crate stack to view product details · color = stock urgency"
          height="h-[500px]"
        >
          <CrateGrid3D products={filtered} onSelect={onSelect} />
        </ScenePanel>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th><th>Category</th><th>Price</th><th>On hand</th><th>Status</th><th>Location</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((p) => {
                  const status = getStockStatus(p.stock, p.reorderPoint);
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => onSelect(p)}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-ink-800 border border-ink-600 flex items-center justify-center text-cyan">
                            <Package size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-ink-100">{p.name}</p>
                            <p className="text-xs font-mono text-ink-400">{p.id} · {p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-ink-300">{p.category}</td>
                      <td className="font-mono text-amber-light">{money(p.price)}</td>
                      <td className="font-mono text-ink-100">{p.stock}</td>
                      <td><StatusBadge status={status} /></td>
                      <td className="font-mono text-xs text-ink-300">{p.location}</td>
                      <td><ChevronRight size={16} className="text-ink-400" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-ink-700 text-xs text-ink-400 font-mono">
            Showing {Math.min(filtered.length, 80)} of {filtered.length} products
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Detail Drawer ───────────────────────────────────────────────
function Detail({ product, onClose, onUpdate, onRestock }: {
  product: Product; onClose: () => void; onUpdate: (stock: number) => void; onRestock: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock));
  const status = getStockStatus(product.stock, product.reorderPoint);

  return (
    <div className="fixed inset-0 z-40 bg-ink-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-ink-900 border-l border-ink-700 h-full overflow-y-auto animate-slide-up">
        <div className="p-6 border-b border-ink-700 flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan font-mono">Product detail</p>
            <h2 className="text-2xl text-ink-100 mt-2">{product.name}</h2>
            <p className="font-mono text-xs text-ink-400 mt-1">{product.id} · {product.sku}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-2"><X size={19} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* 3D Crate Stack — the centerpiece */}
          <div className="panel overflow-hidden">
            <div className="panel-header flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-ink-100">3D Stock Visualization</h3>
                <p className="text-xs text-ink-400 mt-1">Crate count = stock level · color = urgency</p>
              </div>
              <span className={`badge badge-${status}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{status}
              </span>
            </div>
            <div className="h-[320px] relative">
              <CrateStack3D product={product} />
            </div>
          </div>

          <div className="panel p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-400">Stock quantity</p>
              {editing ? (
                <div className="flex gap-2 mt-2">
                  <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="input w-28 font-mono" />
                  <button className="btn btn-primary" onClick={() => { onUpdate(Number(value)); setEditing(false); }}>Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-4xl text-ink-100">{product.stock}</span>
                  <StatusBadge status={status} />
                </div>
              )}
              <p className="text-xs text-ink-400 mt-2">Reorder point: <span className="font-mono text-ink-200">{product.reorderPoint}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-secondary justify-center" onClick={() => setEditing(true)}>
              <Settings2 size={16} /> Adjust quantity
            </button>
            <button className="btn btn-primary justify-center" onClick={onRestock}>
              <Truck size={16} /> Request restock
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {([
              ['Category', product.category],
              ['Unit price', money(product.price)],
              ['Supplier', product.supplier],
              ['Warehouse bin', product.location],
            ] as const).map(([a, b]) => (
              <div key={a} className="panel p-4">
                <p className="text-xs text-ink-400 uppercase tracking-wider">{a}</p>
                <p className="text-sm text-ink-100 mt-2">{b}</p>
              </div>
            ))}
          </div>

          <div className="panel p-5">
            <h3 className="text-sm text-ink-100 font-medium">Stock health</h3>
            <div className="mt-4 h-2 rounded-full bg-ink-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${status === 'critical' ? 'bg-danger' : status === 'low' ? 'bg-amber' : 'bg-cyan'}`}
                style={{ width: `${Math.min(100, (product.stock / Math.max(product.reorderPoint * 2, 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-ink-400 mt-2">
              <span>0</span><span>reorder {product.reorderPoint}</span><span>healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Adjustments ───────────────────────────────────────────────
function Adjustments() {
  const [, refresh] = useState(0);
  const log = inventory.mutations();

  return (
    <div className="space-y-5 animate-fade-in">
      <Header eyebrow="Operations / Audit trail" title="Inventory Adjustments" subtitle="Every quantity mutation, captured by the undo stack." />
      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Reference</th><th>Product</th><th>Change</th><th>Before → After</th><th>Time</th><th></th></tr>
          </thead>
          <tbody>
            {log.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-ink-400">No adjustments recorded yet. Edit a product quantity to create an entry.</td></tr>
            ) : log.map((m, i) => (
              <tr key={m.id}>
                <td className="font-mono text-xs text-amber-light">{m.reference}</td>
                <td>
                  <p className="text-ink-100">{m.productName}</p>
                  <p className="font-mono text-xs text-ink-400">{m.productId}</p>
                </td>
                <td className={`font-mono ${m.delta > 0 ? 'text-cyan-light' : 'text-danger-light'}`}>
                  {m.delta > 0 ? '+' : ''}{m.delta}
                </td>
                <td className="font-mono text-sm text-ink-200">
                  {m.beforeStock} <ChevronRight size={13} className="inline text-ink-500" /> {m.afterStock}
                </td>
                <td className="text-xs text-ink-400">{timeAgo(m.timestamp)}</td>
                <td>
                  {i === 0 && (
                    <button className="btn btn-secondary py-1.5 text-xs" onClick={() => { inventory.undo(); refresh((v) => v + 1); }}>
                      <Undo2 size={13} /> Undo
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Low-Stock Report ────────────────────────────────────────────────────
function LowStock() {
  const products = inventory.lowStock();

  return (
    <div className="space-y-5 animate-fade-in">
      <Header eyebrow="Analytics / Min-heap" title="Low-Stock Report" subtitle="Priority-sorted by available units. The most urgent items surface first." />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Critical" value={String(products.filter((p) => getStockStatus(p.stock, p.reorderPoint) === 'critical').length)} detail="Immediate action" icon={AlertTriangle} accent="danger" />
        <StatCard label="Low" value={String(products.filter((p) => getStockStatus(p.stock, p.reorderPoint) === 'low').length)} detail="Below reorder point" icon={Clock3} accent="amber" />
        <StatCard label="Heap depth" value={String(inventory.stats().heapSize)} detail="Priority nodes" icon={Database} accent="cyan" />
      </div>

      <ScenePanel title="3D Urgency Bars" subtitle="Bar height = stock level · color = urgency (red = critical, amber = low)" height="h-[380px]">
        <LowStockBars3D />
      </ScenePanel>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Priority</th><th>Product</th><th>Available</th><th>Reorder point</th><th>Gap</th><th>Action</th></tr>
          </thead>
          <tbody>
            {products.slice(0, 60).map((p, i) => {
              const s = getStockStatus(p.stock, p.reorderPoint);
              return (
                <tr key={p.id}>
                  <td><span className="font-mono text-xs text-ink-400">#{String(i + 1).padStart(2, '0')}</span></td>
                  <td>
                    <p className="text-ink-100">{p.name}</p>
                    <p className="font-mono text-xs text-ink-400">{p.id} · {p.location}</p>
                  </td>
                  <td className="font-mono text-danger-light">{p.stock}</td>
                  <td className="font-mono text-ink-300">{p.reorderPoint}</td>
                  <td className="font-mono text-amber-light">-{p.reorderPoint - p.stock}</td>
                  <td><StatusBadge status={s} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Price Range Report ──────────────────────────────────────────────────
function PriceRange() {
  const prices = inventory.products().map((p) => p.price);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  const [range, setRange] = useState<[number, number]>([min, max]);
  const results = inventory.priceRange(range[0], range[1]);

  return (
    <div className="space-y-5 animate-fade-in">
      <Header eyebrow="Analytics / AVL tree" title="Price Range Report" subtitle="Explore products by price using balanced tree range queries." />

      <div className="panel p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-400">Selected range</p>
            <p className="font-mono text-2xl text-amber-light mt-1">
              {money(range[0])} <span className="text-ink-500">—</span> {money(range[1])}
            </p>
          </div>
          <span className="badge badge-healthy"><Zap size={12} /> O(log n + k) query</span>
        </div>
        <div className="flex gap-4 items-center">
          <input type="range" min={min} max={max} value={range[0]} onChange={(e) => setRange([Math.min(Number(e.target.value), range[1]), range[1]])} className="w-full accent-amber" />
          <input type="range" min={min} max={max} value={range[1]} onChange={(e) => setRange([range[0], Math.max(Number(e.target.value), range[0])])} className="w-full accent-cyan" />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-ink-400">
          <span>${min}</span><span>${max}</span>
        </div>
      </div>

      <ScenePanel title="3D Price vs Stock Scatter" subtitle="X = price · Z = stock depth · Y = stock level · color = urgency" height="h-[420px]">
        <PriceScatter3D minPrice={range[0]} maxPrice={range[1]} />
      </ScenePanel>

      <div className="panel overflow-hidden">
        <div className="panel-header flex justify-between">
          <div>
            <h2 className="text-lg text-ink-100">Matching products</h2>
            <p className="text-xs text-ink-400 mt-1">{results.length} products in range</p>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Supplier</th></tr>
          </thead>
          <tbody>
            {results.slice(0, 60).map((p) => (
              <tr key={p.id}>
                <td>
                  <p className="text-ink-100">{p.name}</p>
                  <p className="text-xs font-mono text-ink-400">{p.id}</p>
                </td>
                <td className="text-ink-300">{p.category}</td>
                <td className="font-mono text-amber-light">{money(p.price)}</td>
                <td className="font-mono text-ink-100">{p.stock}</td>
                <td className="text-sm text-ink-300">{p.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stock Moves / Restock Queue ──────────────────────────────────────────
function Restock() {
  const [, setRefresh] = useState(0);
  const queue = inventory.restockQueue();

  return (
    <div className="space-y-5 animate-fade-in">
      <Header eyebrow="Operations / FIFO queue" title="Stock Moves" subtitle="Restock requests processed in the order they arrive." />

      <div className="panel p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan/10 text-cyan"><ArrowDownToLine size={22} /></div>
          <div>
            <p className="text-sm text-ink-100">Restock processing queue</p>
            <p className="text-xs text-ink-400 mt-1">{queue.length} requests waiting · O(1) enqueue / dequeue</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => setRefresh((v) => v + 1)}><Activity size={16} /> Refresh</button>
      </div>

      <ScenePanel title="3D Conveyor Belt" subtitle="Crates move along the FIFO processing track · front = next to dequeue" height="h-[340px]">
        <RestockConveyor3D />
      </ScenePanel>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Product</th><th>Quantity</th><th>Status</th></tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-ink-400">No restock requests yet. Create one from a product detail view.</td></tr>
            ) : queue.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs text-ink-300">{new Date(r.timestamp).toLocaleDateString()}</td>
                <td className="font-mono text-xs text-amber-light">{r.reference}</td>
                <td>
                  {r.productName}
                  <p className="text-xs font-mono text-ink-400">{r.productId}</p>
                </td>
                <td className="font-mono text-cyan-light">+{r.quantity}</td>
                <td><span className="badge badge-neutral">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Complexity Lab ──────────────────────────────────────────────────────
function Complexity() {
  const rows = [
    ['Lookup by ID', 'O(n)', 'O(1)', 'Custom Hash Table'],
    ['Prefix autocomplete', 'O(n · m)', 'O(m + r)', 'Trie'],
    ['Lowest stock', 'O(n log n)', 'O(log n)', 'Min-Heap'],
    ['Price range', 'O(n)', 'O(log n + k)', 'AVL Tree'],
    ['Undo latest', 'O(1)', 'O(1)', 'Stack'],
    ['Restock processing', 'O(n)', 'O(1)', 'Queue'],
  ] as const;

  const structures = [
    { title: 'Hash Table', subtitle: 'Buckets with collision chains', viz: <HashTableViz3D />, color: 'cyan', op: 'O(1) lookup' },
    { title: 'AVL Tree', subtitle: 'Self-balancing binary search tree', viz: <AVLTreeViz3D />, color: 'amber', op: 'O(log n) search' },
    { title: 'Min-Heap', subtitle: 'Priority queue for low-stock alerts', viz: <MinHeapViz3D />, color: 'danger', op: 'O(log n) push/pop' },
    { title: 'Stack', subtitle: 'LIFO undo history', viz: <StackViz3D />, color: 'cyan', op: 'O(1) push/pop' },
    { title: 'Queue', subtitle: 'FIFO restock processing', viz: <QueueViz3D />, color: 'amber', op: 'O(1) enq/deq' },
  ] as const;

  return (
    <div className="space-y-5 animate-fade-in">
      <Header eyebrow="Capstone / Analysis" title="Complexity Lab" subtitle="Why the right data structure matters at warehouse scale." />

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Operation</th><th>Naive array</th><th>STRATA structure</th><th>Powered by</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]}>
                <td className="text-ink-100 font-medium">{r[0]}</td>
                <td className="font-mono text-danger-light">{r[1]}</td>
                <td className="font-mono text-cyan-light">{r[2]}</td>
                <td><span className="badge badge-neutral">{r[3]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3D visualizations of each data structure */}
      <div className="space-y-4">
        <h2 className="text-xl font-display font-medium text-ink-100">Structure Visualizations</h2>
        <p className="text-sm text-ink-400">Interactive 3D models of each custom data structure implemented from scratch.</p>

        <div className="grid lg:grid-cols-2 gap-5">
          {structures.map((s) => (
            <div key={s.title} className="panel overflow-hidden">
              <div className="panel-header flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium text-ink-100">{s.title}</h3>
                  <p className="text-xs text-ink-400 mt-1">{s.subtitle}</p>
                </div>
                <span className={`text-[10px] font-mono bg-${s.color}/10 text-${s.color === 'danger' ? 'danger-light' : s.color === 'amber' ? 'amber-light' : 'cyan-light'} px-2 py-1 rounded`}>
                  {s.op}
                </span>
              </div>
              <div className="h-[280px] relative">
                {s.viz}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {([
          ['Time saved', 'As catalog size grows, targeted structures avoid scanning every record.', 'cyan'],
          ['Designed for change', 'Mutations are reversible and restocks stay in arrival order.', 'amber'],
          ['Transparent by design', 'Telemetry makes each structure visible to your capstone reviewer.', 'danger'],
        ] as const).map(([a, b, c]) => (
          <div className="panel p-5" key={a}>
            <div className={`h-9 w-9 rounded-lg bg-${c}/10 text-${c} flex items-center justify-center mb-4`}>
              <Sparkles size={17} />
            </div>
            <h3 className="text-ink-100 font-medium">{a}</h3>
            <p className="text-sm text-ink-400 leading-relaxed mt-2">{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [selected, setSelected] = useState<Product | null>(null);
  const [, refresh] = useState(0);

  const go = (p: Page) => setPage(p);
  const update = (stock: number) => {
    if (selected) {
      inventory.updateStock(selected.id, stock);
      setSelected({ ...selected, stock });
      refresh((v) => v + 1);
    }
  };
  const restock = () => {
    if (selected) {
      inventory.requestRestock(selected.id, Math.max(10, selected.reorderPoint * 2));
      go('restock');
      setSelected(null);
    }
  };

  const pageContent =
    page === 'dashboard' ? <Dashboard onNavigate={go} /> :
    page === 'products' ? <Products onSelect={setSelected} /> :
    page === 'adjustments' ? <Adjustments /> :
    page === 'low-stock' ? <LowStock /> :
    page === 'price-range' ? <PriceRange /> :
    page === 'restock' ? <Restock /> :
    <Complexity />;

  return (
    <div className="min-h-screen flex bg-ink-950">
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-ink-700 bg-ink-900 flex-col">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-ink-700">
          <div className="h-9 w-9 rounded-lg bg-amber flex items-center justify-center text-ink-950">
            <Boxes size={21} />
          </div>
          <div>
            <div className="font-display font-bold tracking-[0.22em] text-ink-100">STRATA</div>
            <div className="text-[9px] tracking-widest text-ink-400">INVENTORY OS</div>
          </div>
        </div>
        <nav className="p-4 flex-1">
          {navGroups.map((g) => (
            <div key={g.label} className="mb-7">
              <p className="px-4 mb-2 text-[10px] uppercase tracking-[0.18em] text-ink-500 font-display">{g.label}</p>
              {g.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id as Page)}
                  className={`nav-link w-full mb-1 ${page === item.id ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  <item.icon size={17} />
                  {item.label}
                  {page === item.id && <ChevronRight size={14} className="ml-auto" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-ink-700">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-display text-amber">JS</div>
            <div>
              <p className="text-xs text-ink-100">Jordan Smith</p>
              <p className="text-[10px] text-ink-400">Warehouse admin</p>
            </div>
            <Settings2 size={15} className="ml-auto text-ink-400" />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-20 border-b border-ink-700 bg-ink-900/70 backdrop-blur flex items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden btn btn-ghost p-2"><Menu size={20} /></button>
            <div className="lg:hidden font-display font-bold tracking-[0.2em] text-ink-100">STRATA</div>
            <div className="hidden md:flex items-center gap-2 text-xs text-ink-400 font-mono">
              <span className="text-cyan">/</span> {page.replace('-', ' ')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-ink-400">
              <CircleHelp size={15} /> Help center
            </div>
            <div className="h-8 w-px bg-ink-700" />
            <button className="relative btn btn-ghost p-2">
              <AlertTriangle size={17} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-danger" />
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8 max-w-[1600px]">
          {pageContent}
        </div>
      </main>

      {selected && (
        <Detail
          product={selected}
          onClose={() => setSelected(null)}
          onUpdate={update}
          onRestock={restock}
        />
      )}
    </div>
  );
}

export default App;
