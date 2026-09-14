// Custom Hash Table — product storage keyed by product ID
// O(1) average lookup/insert/delete, chaining for collisions, dynamic resizing

export class HashTable<K, V> {
  private buckets: Array<Array<{ key: K; value: V }>>;
  private capacity: number;
  private count: number;
  private readonly loadFactorThreshold: number;

  constructor(initialCapacity: number = 16, loadFactorThreshold: number = 0.75) {
    this.capacity = this.nextPowerOfTwo(initialCapacity);
    this.count = 0;
    this.loadFactorThreshold = loadFactorThreshold;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
  }

  private nextPowerOfTwo(n: number): number {
    let p = 1;
    while (p < n) p <<= 1;
    return Math.max(p, 16);
  }

  private hash(key: K): number {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % this.capacity;
  }

  set(key: K, value: V): void {
    const idx = this.hash(key);
    const chain = this.buckets[idx];

    for (const entry of chain) {
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }

    chain.push({ key, value });
    this.count++;

    if (this.count / this.capacity > this.loadFactorThreshold) {
      this.resize();
    }
  }

  get(key: K): V | undefined {
    const idx = this.hash(key);
    const chain = this.buckets[idx];
    for (const entry of chain) {
      if (entry.key === key) return entry.value;
    }
    return undefined;
  }

  delete(key: K): boolean {
    const idx = this.hash(key);
    const chain = this.buckets[idx];
    for (let i = 0; i < chain.length; i++) {
      if (chain[i].key === key) {
        chain.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  private resize(): void {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.count = 0;

    for (const chain of oldBuckets) {
      for (const entry of chain) {
        this.set(entry.key, entry.value);
      }
    }
  }

  get size(): number {
    return this.count;
  }

  get bucketCount(): number {
    return this.capacity;
  }

  entries(): Array<{ key: K; value: V }> {
    const result: Array<{ key: K; value: V }> = [];
    for (const chain of this.buckets) {
      for (const entry of chain) {
        result.push({ key: entry.key, value: entry.value });
      }
    }
    return result;
  }

  values(): V[] {
    return this.entries().map((e) => e.value);
  }

  keys(): K[] {
    return this.entries().map((e) => e.key);
  }

  // Diagnostic: max chain length (collision depth)
  maxChainLength(): number {
    return Math.max(...this.buckets.map((b) => b.length));
  }

  // Diagnostic: number of empty buckets
  emptyBuckets(): number {
    return this.buckets.filter((b) => b.length === 0).length;
  }
}
