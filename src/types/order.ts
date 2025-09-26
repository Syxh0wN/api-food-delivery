import { OrderStatus } from '@prisma/client';

export interface CreateOrderInput {
  storeId: string;
  addressId: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
  deliveryInstructions?: string | undefined;
  couponCode?: string | undefined;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  notes?: string | undefined;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    description: string;
    images: string[];
  };
}

export interface OrderResponse {
  id: string;
  userId: string;
  storeId: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  deliveryInstructions: string | null;
  couponCode: string | null;
  estimatedDeliveryTime: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  store?: {
    id: string;
    name: string;
    phone: string;
    isOpen: boolean;
  };
  address?: {
    id: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItemResponse[];
}

export interface OrderListResponse {
  orders: OrderResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderSummaryResponse {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  preparingOrders: number;
  deliveringOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}
