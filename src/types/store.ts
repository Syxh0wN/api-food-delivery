import { UserRole } from '@prisma/client';

export interface CreateStoreInput {
  name: string;
  description: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string | undefined;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryRadius: number;
  estimatedDeliveryTime: number;
  minimumOrderValue: number;
  isOpen?: boolean | undefined;
  logo?: string | undefined;
  coverImage?: string | undefined;
}

export interface UpdateStoreInput {
  name?: string | undefined;
  description?: string | undefined;
  phone?: string | undefined;
  address?: {
    street?: string | undefined;
    number?: string | undefined;
    complement?: string | undefined;
    neighborhood?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    zipCode?: string | undefined;
  } | undefined;
  deliveryRadius?: number | undefined;
  estimatedDeliveryTime?: number | undefined;
  minimumOrderValue?: number | undefined;
  isOpen?: boolean | undefined;
  logo?: string | undefined;
  coverImage?: string | undefined;
}

export interface StoreResponse {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryRadius: number;
  estimatedDeliveryTime: number;
  minimumOrderValue: number;
  isOpen: boolean;
  logo: string | null;
  coverImage: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface StoreListResponse {
  id: string;
  name: string;
  description: string;
  phone: string;
  deliveryRadius: number;
  estimatedDeliveryTime: number;
  minimumOrderValue: number;
  isOpen: boolean;
  logo: string | null;
  coverImage: string | null;
  ownerId: string;
  createdAt: Date;
}
