// AVL Tree — self-balancing BST keyed on price
// Supports O(log n + k) range queries for price filtering

export interface AVLNode<T> {
  key: number;
  value: T;
  left: AVLNode<T> | null;
  right: AVLNode<T> | null;
  height: number;
}

export class AVLTree<T> {
  private root: AVLNode<T> | null;
  private _size: number;

  constructor() {
    this.root = null;
    this._size = 0;
  }

  get size(): number {
    return this._size;
  }

  insert(key: number, value: T): void {
    this.root = this.insertNode(this.root, key, value);
  }

  // Update value for an existing key, or insert if new
  upsert(key: number, value: T): void {
    const existing = this.find(key);
    if (existing) {
      existing.value = value;
    } else {
      this.insert(key, value);
    }
  }

  find(key: number): AVLNode<T> | null {
    let node = this.root;
    while (node) {
      if (key === node.key) return node;
      node = key < node.key ? node.left : node.right;
    }
    return null;
  }

  delete(key: number): boolean {
    const before = this._size;
    this.root = this.deleteNode(this.root, key);
    return this._size < before;
  }

  // Range query: return all values with keys in [min, max]
  rangeQuery(min: number, max: number): Array<{ key: number; value: T }> {
    const result: Array<{ key: number; value: T }> = [];
    this.rangeQueryNode(this.root, min, max, result);
    return result;
  }

  // In-order traversal — all items sorted by key
  inOrder(): Array<{ key: number; value: T }> {
    const result: Array<{ key: number; value: T }> = [];
    this.inOrderNode(this.root, result);
    return result;
  }

  get minHeight(): number {
    return this.root ? this.root.height : 0;
  }

  private height(node: AVLNode<T> | null): number {
    return node ? node.height : 0;
  }

  private balanceFactor(node: AVLNode<T>): number {
    return this.height(node.left) - this.height(node.right);
  }

  private updateHeight(node: AVLNode<T>): void {
    node.height = 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  private rotateRight(y: AVLNode<T>): AVLNode<T> {
    const x = y.left!;
    const t2 = x.right;
    x.right = y;
    y.left = t2;
    this.updateHeight(y);
    this.updateHeight(x);
    return x;
  }

  private rotateLeft(x: AVLNode<T>): AVLNode<T> {
    const y = x.right!;
    const t2 = y.left;
    y.left = x;
    x.right = t2;
    this.updateHeight(x);
    this.updateHeight(y);
    return y;
  }

  private insertNode(node: AVLNode<T> | null, key: number, value: T): AVLNode<T> {
    if (!node) {
      this._size++;
      return { key, value, left: null, right: null, height: 1 };
    }

    if (key < node.key) {
      node.left = this.insertNode(node.left, key, value);
    } else if (key > node.key) {
      node.right = this.insertNode(node.right, key, value);
    } else {
      node.value = value;
      return node;
    }

    this.updateHeight(node);
    return this.rebalance(node);
  }

  private deleteNode(node: AVLNode<T> | null, key: number): AVLNode<T> | null {
    if (!node) return null;

    if (key < node.key) {
      node.left = this.deleteNode(node.left, key);
    } else if (key > node.key) {
      node.right = this.deleteNode(node.right, key);
    } else {
      this._size--;
      if (!node.left || !node.right) {
        const temp = node.left || node.right;
        return temp;
      }
      // In-order successor
      let successor = node.right;
      while (successor.left) successor = successor.left;
      node.key = successor.key;
      node.value = successor.value;
      this._size++;
      node.right = this.deleteNode(node.right, successor.key);
    }

    this.updateHeight(node);
    return this.rebalance(node);
  }

  private rebalance(node: AVLNode<T>): AVLNode<T> {
    const bf = this.balanceFactor(node);

    // Left heavy
    if (bf > 1) {
      if (this.balanceFactor(node.left!) < 0) {
        node.left = this.rotateLeft(node.left!);
      }
      return this.rotateRight(node);
    }

    // Right heavy
    if (bf < -1) {
      if (this.balanceFactor(node.right!) > 0) {
        node.right = this.rotateRight(node.right!);
      }
      return this.rotateLeft(node);
    }

    return node;
  }

  private rangeQueryNode(
    node: AVLNode<T> | null,
    min: number,
    max: number,
    result: Array<{ key: number; value: T }>
  ): void {
    if (!node) return;

    if (node.key > min) {
      this.rangeQueryNode(node.left, min, max, result);
    }

    if (node.key >= min && node.key <= max) {
      result.push({ key: node.key, value: node.value });
    }

    if (node.key < max) {
      this.rangeQueryNode(node.right, min, max, result);
    }
  }

  private inOrderNode(
    node: AVLNode<T> | null,
    result: Array<{ key: number; value: T }>
  ): void {
    if (!node) return;
    this.inOrderNode(node.left, result);
    result.push({ key: node.key, value: node.value });
    this.inOrderNode(node.right, result);
  }
}
