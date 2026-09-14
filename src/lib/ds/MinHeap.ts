// Min-Heap — tracks lowest-stock items for low-stock alerts
// O(log n) push/pop, keyed on stock quantity (smallest at root)

export interface HeapItem {
  productId: string;
  stock: number;
}

export class MinHeap {
  private heap: HeapItem[];

  constructor() {
    this.heap = [];
  }

  get size(): number {
    return this.heap.length;
  }

  push(item: HeapItem): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapItem | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  peek(): HeapItem | undefined {
    return this.heap[0];
  }

  // Remove a specific product from the heap (used when stock changes)
  remove(productId: string): boolean {
    const idx = this.heap.findIndex((h) => h.productId === productId);
    if (idx === -1) return false;

    const last = this.heap.pop()!;
    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this.bubbleUp(idx);
      this.bubbleDown(idx);
    }
    return true;
  }

  // Update stock for a product already in the heap
  update(productId: string, newStock: number): boolean {
    const idx = this.heap.findIndex((h) => h.productId === productId);
    if (idx === -1) return false;
    this.heap[idx].stock = newStock;
    this.bubbleUp(idx);
    this.bubbleDown(idx);
    return true;
  }

  // Return all items sorted ascending by stock
  sortedItems(): HeapItem[] {
    const copy = [...this.heap];
    copy.sort((a, b) => a.stock - b.stock);
    return copy;
  }

  // Rebuild the heap from a fresh set of items (used after bulk changes)
  rebuild(items: HeapItem[]): void {
    this.heap = [...items];
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this.bubbleDown(i);
    }
  }

  private bubbleUp(idx: number): void {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[idx].stock >= this.heap[parent].stock) break;
      this.swap(idx, parent);
      idx = parent;
    }
  }

  private bubbleDown(idx: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < n && this.heap[left].stock < this.heap[smallest].stock) {
        smallest = left;
      }
      if (right < n && this.heap[right].stock < this.heap[smallest].stock) {
        smallest = right;
      }

      if (smallest === idx) break;
      this.swap(idx, smallest);
      idx = smallest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
