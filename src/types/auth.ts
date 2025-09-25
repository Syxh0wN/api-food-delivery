export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string | undefined;
  role?: 'CLIENT' | 'STORE_OWNER' | undefined;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  };
  token: string;
}
