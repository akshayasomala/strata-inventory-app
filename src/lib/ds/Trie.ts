// Trie — indexes product names for prefix-based autocomplete search
// O(m) per search where m = prefix length; O(L) per insert where L = word length

type TrieNodeData = Set<string>;

class TrieNode {
  children: Map<string, TrieNode>;
  productIds: TrieNodeData;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map<string, TrieNode>();
    this.productIds = new Set<string>();
    this.isEndOfWord = false;
  }
}

export class Trie {
  private root: TrieNode;
  private wordCount: number;

  constructor() {
    this.root = new TrieNode();
    this.wordCount = 0;
  }

  insert(word: string, productId: string): void {
    const normalized = word.toLowerCase();
    let node = this.root;

    for (const char of normalized) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.productIds.add(productId);
    }

    if (!node.isEndOfWord) {
      node.isEndOfWord = true;
      this.wordCount++;
    }
  }

  search(prefix: string): Set<string> {
    const normalized = prefix.toLowerCase();
    let node = this.root;

    for (const char of normalized) {
      if (!node.children.has(char)) {
        return new Set<string>();
      }
      node = node.children.get(char)!;
    }

    return new Set(node.productIds);
  }

  delete(word: string, productId: string): void {
    const normalized = word.toLowerCase();
    let node = this.root;

    for (const char of normalized) {
      if (!node.children.has(char)) return;
      node = node.children.get(char)!;
      node.productIds.delete(productId);
    }

    if (node.isEndOfWord) {
      node.isEndOfWord = false;
      this.wordCount--;
    }
  }

  get size(): number {
    return this.wordCount;
  }

  // Diagnostic: count total nodes in the trie
  nodeCount(): number {
    const count = (node: TrieNode): number => {
      let total = 1;
      for (const child of node.children.values()) {
        total += count(child);
      }
      return total;
    };
    return count(this.root);
  }
}
