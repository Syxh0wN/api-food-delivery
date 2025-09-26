export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  isAvailable?: boolean | undefined;
  preparationTime?: number | undefined;
  ingredients?: string[] | undefined;
  allergens?: string[] | undefined;
  images?: string[] | undefined;
  isVegetarian?: boolean | undefined;
  isVegan?: boolean | undefined;
  isGlutenFree?: boolean | undefined;
  nutritionalInfo?: {
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
  } | undefined;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isAvailable?: boolean | undefined;
  preparationTime?: number | undefined;
  ingredients?: string[] | undefined;
  allergens?: string[] | undefined;
  images?: string[] | undefined;
  isVegetarian?: boolean | undefined;
  isVegan?: boolean | undefined;
  isGlutenFree?: boolean | undefined;
  nutritionalInfo?: {
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
  } | undefined;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  storeId: string;
  isAvailable: boolean;
  preparationTime: number | null;
  ingredients: string[];
  allergens: string[];
  images: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  nutritionalInfo: any;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  category?: {
    id: string;
    name: string;
    description: string | null;
  };
  store?: {
    id: string;
    name: string;
    isOpen: boolean;
  };
}

export interface ProductListResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  storeId: string;
  isAvailable: boolean;
  preparationTime: number | null;
  images: string[];
  averageRating: number;
  totalReviews: number;
  category?: {
    id: string;
    name: string;
  };
  store?: {
    id: string;
    name: string;
    isOpen: boolean;
  };
}

export interface CreateCategoryInput {
  name: string;
  description?: string | undefined;
}

export interface UpdateCategoryInput {
  name?: string | undefined;
  description?: string | undefined;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
