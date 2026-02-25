import { User } from './user';

export interface Category {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  options?: { name: string; price?: number }[];
}

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  clientId: string;
  vendorId: string;
  driverId?: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  deliveryAddress: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options?: { name: string; price?: number }[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  targetId: string;
  targetType: 'vendor' | 'product';
  rating: number;
  comment?: string;
  createdAt: string;
}
