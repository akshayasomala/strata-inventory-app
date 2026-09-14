export type StockStatus = 'healthy' | 'low' | 'critical';
export type MutationType = 'ADD' | 'EDIT' | 'DELETE';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  supplier: string;
  location: string;
  reorderPoint: number;
  updatedAt: string;
}

export interface Mutation {
  id: string;
  type: MutationType;
  productId: string;
  productName: string;
  beforeStock: number;
  afterStock: number;
  delta: number;
  timestamp: string;
  reference: string;
}

export interface RestockRequest {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  timestamp: string;
  reference: string;
  status: 'Queued' | 'Processing' | 'Completed';
}

export const getStockStatus = (stock: number, reorderPoint: number): StockStatus => {
  if (stock <= Math.max(3, Math.floor(reorderPoint * 0.35))) return 'critical';
  if (stock <= reorderPoint) return 'low';
  return 'healthy';
};
