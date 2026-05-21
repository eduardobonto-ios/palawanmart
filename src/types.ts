/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  vendorId: string;
  rating: number;
  reviewsCount: number;
  isPromoted?: boolean;
  specifications?: { label: string; value: string }[];
  stock?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  productId?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo: string;
  rating: number;
  location: string;
  isApproved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin' | 'rider';
  photoURL?: string;
  vendorId?: string;
  delivery_address?: string;
  contact_number?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed'
  | 'ready_for_pickup' 
  | 'picked_up' 
  | 'delivered' 
  | 'payment_received' 
  | 'cancelled'
  | 'return';

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  riderId?: string;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress?: string;
  paymentMethod: string;
  proof_photo_url?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  productImage?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Rating {
  id: string;
  user_id: string;
  product_id: string;
  score: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_photo?: string;
}
