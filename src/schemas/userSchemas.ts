import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  phone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 caracteres")
    .optional(),
  avatar: z.string().url("Avatar deve ser uma URL válida").optional(),
});

export const createAddressSchema = z.object({
  street: z.string().min(3, "Rua deve ter no mínimo 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, "Bairro deve ter no mínimo 3 caracteres"),
  city: z.string().min(3, "Cidade deve ter no mínimo 3 caracteres"),
  state: z.string().min(2, "Estado deve ter no mínimo 2 caracteres"),
  zipCode: z.string().min(8, "CEP deve ter no mínimo 8 caracteres"),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  street: z.string().min(3, "Rua deve ter no mínimo 3 caracteres").optional(),
  number: z.string().min(1, "Número é obrigatório").optional(),
  complement: z.string().optional(),
  neighborhood: z
    .string()
    .min(3, "Bairro deve ter no mínimo 3 caracteres")
    .optional(),
  city: z.string().min(3, "Cidade deve ter no mínimo 3 caracteres").optional(),
  state: z.string().min(2, "Estado deve ter no mínimo 2 caracteres").optional(),
  zipCode: z.string().min(8, "CEP deve ter no mínimo 8 caracteres").optional(),
  isDefault: z.boolean().optional(),
});

export const addressIdSchema = z.object({
  addressId: z.string().min(1, "ID do endereço é obrigatório")
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressIdParams = z.infer<typeof addressIdSchema>;
