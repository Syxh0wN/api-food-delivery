import { UserRole } from '@prisma/client';

export interface UpdateUserInput {
  name?: string | undefined;
  phone?: string | undefined;
  avatar?: string | undefined;
}

export interface CreateAddressInput {
  street: string;
  number: string;
  complement?: string | undefined;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean | undefined;
}

export interface UpdateAddressInput {
  street?: string | undefined;
  number?: string | undefined;
  complement?: string | undefined;
  neighborhood?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  zipCode?: string | undefined;
  isDefault?: boolean | undefined;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressResponse {
  id: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
