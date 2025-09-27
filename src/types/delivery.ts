import { OrderStatus, DeliveryStatus, DeliveryMethod } from '@prisma/client';

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Date;
}

export interface DeliveryTracking {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  method: DeliveryMethod;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  deliveryPersonId?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  trackingCode: string;
  locations: DeliveryLocation[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliveryTrackingInput {
  orderId: string;
  method: DeliveryMethod;
  estimatedDeliveryTime?: Date;
  deliveryPersonId?: string;
  trackingCode?: string;
  notes?: string;
}

export interface UpdateDeliveryStatusInput {
  status: DeliveryStatus;
  location?: DeliveryLocation;
  notes?: string;
  actualDeliveryTime?: Date;
}

export interface DeliveryEstimate {
  orderId: string;
  estimatedPreparationTime: number; // em minutos
  estimatedDeliveryTime: number; // em minutos
  estimatedTotalTime: number; // em minutos
  estimatedDeliveryDate: Date;
  factors: {
    storePreparationTime: number;
    distance: number;
    trafficFactor: number;
    weatherFactor: number;
  };
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  currentLocation?: DeliveryLocation;
  isAvailable: boolean;
  totalDeliveries: number;
  averageRating: number;
  createdAt: Date;
}

export interface CreateDeliveryPersonInput {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface UpdateDeliveryPersonInput {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface DeliveryStats {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  deliveryPersonStats: Array<{
    deliveryPersonId: string;
    deliveryPersonName: string;
    totalDeliveries: number;
    averageRating: number;
    onTimePercentage: number;
  }>;
}

export interface OrderTrackingResponse {
  order: {
    id: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    estimatedDeliveryTime?: Date;
  };
  tracking: DeliveryTracking;
  store: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  deliveryAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  timeline: Array<{
    status: DeliveryStatus;
    timestamp: Date;
    description: string;
    location?: DeliveryLocation;
  }>;
}

export interface DeliveryFilter {
  status?: DeliveryStatus;
  method?: DeliveryMethod;
  deliveryPersonId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface DeliveryListResponse {
  deliveries: DeliveryTracking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeliveryPersonListResponse {
  deliveryPersons: DeliveryPerson[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderImprovementStats {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  averageOrderTime: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  deliveryPersonEfficiency: Array<{
    deliveryPersonId: string;
    name: string;
    efficiency: number;
    totalOrders: number;
  }>;
  storePerformance: Array<{
    storeId: string;
    storeName: string;
    averagePreparationTime: number;
    onTimeRate: number;
  }>;
}
