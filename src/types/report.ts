export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  userId?: string;
  status?: string;
  categoryId?: string;
  paymentMethod?: string;
}

export interface SalesReport {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
  salesByStore: Array<{
    storeId: string;
    storeName: string;
    sales: number;
    orders: number;
    percentage: number;
  }>;
  salesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    sales: number;
    orders: number;
    percentage: number;
  }>;
  salesByPaymentMethod: Array<{
    paymentMethod: string;
    sales: number;
    orders: number;
    percentage: number;
  }>;
}

export interface OrderReport {
  totalOrders: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  ordersByPeriod: Array<{
    period: string;
    count: number;
    averageValue: number;
  }>;
  ordersByStore: Array<{
    storeId: string;
    storeName: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  ordersByUser: Array<{
    userId: string;
    userName: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  averageDeliveryTime: number;
  cancellationRate: number;
}

export interface UserReport {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  usersByRole: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;
  usersByPeriod: Array<{
    period: string;
    newUsers: number;
    activeUsers: number;
  }>;
  topUsersByOrders: Array<{
    userId: string;
    userName: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
  topUsersBySpending: Array<{
    userId: string;
    userName: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
  }>;
  userRetentionRate: number;
}

export interface StoreReport {
  totalStores: number;
  activeStores: number;
  newStores: number;
  storesByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  storesByPeriod: Array<{
    period: string;
    newStores: number;
    activeStores: number;
  }>;
  topStoresBySales: Array<{
    storeId: string;
    storeName: string;
    ownerName: string;
    totalSales: number;
    totalOrders: number;
    averageRating: number;
  }>;
  topStoresByOrders: Array<{
    storeId: string;
    storeName: string;
    ownerName: string;
    totalOrders: number;
    totalSales: number;
    averageRating: number;
  }>;
  averageStoreRating: number;
  storeActivationRate: number;
}

export interface ProductReport {
  totalProducts: number;
  activeProducts: number;
  productsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
    percentage: number;
  }>;
  topProductsBySales: Array<{
    productId: string;
    productName: string;
    storeName: string;
    totalSales: number;
    totalOrders: number;
    averageRating: number;
  }>;
  topProductsByOrders: Array<{
    productId: string;
    productName: string;
    storeName: string;
    totalOrders: number;
    totalSales: number;
    averageRating: number;
  }>;
  averageProductRating: number;
  productAvailabilityRate: number;
}

export interface DashboardReport {
  overview: {
    totalSales: number;
    totalOrders: number;
    totalUsers: number;
    totalStores: number;
    averageOrderValue: number;
    averageDeliveryTime: number;
    cancellationRate: number;
    userRetentionRate: number;
    storeActivationRate: number;
  };
  salesTrend: Array<{
    period: string;
    sales: number;
    orders: number;
  }>;
  orderStatusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  topStores: Array<{
    storeId: string;
    storeName: string;
    sales: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sales: number;
    orders: number;
  }>;
  recentOrders: Array<{
    orderId: string;
    customerName: string;
    storeName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ReportResponse<T> {
  success: boolean;
  data: T;
  filters: ReportFilters;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export type ReportType = 'sales' | 'orders' | 'users' | 'stores' | 'products' | 'dashboard';

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
  includeDetails?: boolean;
}
