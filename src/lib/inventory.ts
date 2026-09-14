import { HashTable } from '@/lib/ds/HashTable';
import { Trie } from '@/lib/ds/Trie';
import { MinHeap } from '@/lib/ds/MinHeap';
import { AVLTree } from '@/lib/ds/AVLTree';
import { Stack } from '@/lib/ds/Stack';
import { Queue } from '@/lib/ds/Queue';
import type { Mutation, Product, RestockRequest } from '@/lib/types';

const categories: Array<[string, string[]]> = [
  ['Electronics', ['USB-C Hub', 'Wireless Keyboard', 'Noise Cancelling Headphones', 'Webcam Pro', 'Portable SSD', 'Mechanical Mouse']],
  ['Home & Kitchen', ['Ceramic Mug Set', 'Bamboo Cutting Board', 'Cotton Towel Set', 'Glass Food Container', 'Linen Table Runner', 'Cast Iron Skillet']],
  ['Apparel', ['Organic Cotton T-Shirt', 'Merino Wool Sweater', 'Canvas Work Jacket', 'Performance Jogger', 'Leather Belt', 'Running Cap']],
  ['Outdoor', ['Insulated Water Bottle', 'Alpine Sleeping Bag', 'Trail Backpack', 'Camping Lantern', 'Folding Camp Chair', 'Hiking Pole Set']],
  ['Office', ['Hardcover Notebook', 'Desk Organizer', 'Fine Tip Marker Set', 'Ergonomic Desk Mat', 'Ballpoint Pen Pack', 'Document Tray']],
  ['Beauty', ['Daily Face Cleanser', 'Hydrating Body Lotion', 'Mineral Sunscreen', 'Essential Oil Set', 'Bamboo Hair Brush', 'Travel Grooming Kit']],
  ['Sports', ['Yoga Mat Pro', 'Resistance Band Set', 'Training Gloves', 'Foam Roller', 'Jump Rope Speed', 'Compression Socks']],
  ['Pet Supplies', ['Elevated Pet Bowl', 'Durable Rope Toy', 'Orthopedic Pet Bed', 'Grain Free Treats', 'Reflective Leash', 'Grooming Brush']],
];
const colors = ['Graphite', 'Sandstone', 'Slate', 'Forest', 'Ocean', 'Ivory', 'Terracotta', 'Midnight'];
const suppliers = ['Northstar Wholesale', 'Meridian Goods', 'Atlas Distribution', 'Harbor & Co.', 'Summit Supply'];
const locations = ['A-01-04', 'A-03-12', 'B-02-08', 'B-07-03', 'C-01-16', 'C-04-09', 'D-02-11', 'D-06-05'];

const hashTable = new HashTable<string, Product>(32);
const trie = new Trie();
const heap = new MinHeap();
const priceTree = new AVLTree<Product>();
const mutations = new Stack<Mutation>();
const restockQueue = new Queue<RestockRequest>();

const pad = (n: number, width: number) => String(n).padStart(width, '0');
const now = () => new Date().toISOString();

const seedProducts = (): Product[] => {
  const products: Product[] = [];
  let index = 1;
  for (const [category, names] of categories) {
    for (let variant = 0; variant < 8; variant++) {
      for (const name of names) {
        const price = Number((8 + ((index * 17) % 185) + (variant * 3.5)).toFixed(2));
        const reorderPoint = 8 + ((index * 7) % 22);
        const stock = (index * 31 + variant * 11) % 86;
        products.push({
          id: `PRD-${pad(index, 4)}`,
          name: `${colors[variant]} ${name}`,
          category,
          price,
          stock,
          sku: `ST-${category.slice(0, 3).toUpperCase()}-${pad(index, 5)}`,
          supplier: suppliers[index % suppliers.length],
          location: locations[index % locations.length],
          reorderPoint,
          updatedAt: now(),
        });
        index++;
      }
    }
  }
  return products;
};

const seed = seedProducts();
for (const product of seed) {
  hashTable.set(product.id, product);
  trie.insert(product.name, product.id);
  heap.push({ productId: product.id, stock: product.stock });
  priceTree.insert(product.price + product.id.charCodeAt(4) / 10000, product);
}

export const inventory = {
  products: () => hashTable.values(),
  getProduct: (id: string) => hashTable.get(id),
  autocomplete: (prefix: string): Product[] => [...trie.search(prefix)].map((id) => hashTable.get(id)).filter((p): p is Product => Boolean(p)).slice(0, 8),
  lowStock: (): Product[] => heap.sortedItems().map((item) => hashTable.get(item.productId)).filter((p): p is Product => Boolean(p)).filter((p) => p.stock <= p.reorderPoint),
  priceRange: (min: number, max: number): Product[] => priceTree.rangeQuery(min, max).map((node) => node.value),
  updateStock: (id: string, stock: number): Mutation | null => {
    const product = hashTable.get(id);
    if (!product) return null;
    const before = product.stock;
    product.stock = stock;
    product.updatedAt = now();
    heap.update(id, stock);
    const mutation: Mutation = { id: `M-${Date.now()}`, type: 'EDIT', productId: id, productName: product.name, beforeStock: before, afterStock: stock, delta: stock - before, timestamp: now(), reference: `ADJ-${pad(mutations.size + 1, 4)}` };
    mutations.push(mutation);
    return mutation;
  },
  undo: (): Mutation | null => {
    const mutation = mutations.pop();
    if (!mutation) return null;
    const product = hashTable.get(mutation.productId);
    if (product) { product.stock = mutation.beforeStock; product.updatedAt = now(); heap.update(product.id, product.stock); }
    return mutation;
  },
  mutations: () => mutations.toArray(),
  requestRestock: (id: string, quantity: number): RestockRequest | null => {
    const product = hashTable.get(id);
    if (!product) return null;
    const request: RestockRequest = { id: `RQ-${Date.now()}`, productId: id, productName: product.name, quantity, timestamp: now(), reference: `WH/${pad(restockQueue.size + 1, 4)}`, status: 'Queued' };
    restockQueue.enqueue(request);
    return request;
  },
  restockQueue: () => restockQueue.toArray(),
  stats: () => ({ products: hashTable.size, buckets: hashTable.bucketCount, collisions: hashTable.maxChainLength(), trieNodes: trie.nodeCount(), heapSize: heap.size, avlNodes: priceTree.size, undoDepth: mutations.size, queueSize: restockQueue.size }),
};

export type Inventory = typeof inventory;
