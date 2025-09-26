export interface AddToCartInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    isAvailable: boolean;
    store: {
      id: string;
      name: string;
      isOpen: boolean;
    };
  };
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartSummaryResponse {
  totalItems: number;
  totalValue: number;
  itemsCount: number;
}
