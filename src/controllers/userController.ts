import { Response } from "express";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";

const userService = new UserService();

const updateProfileSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  phone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 caracteres")
    .optional(),
  avatar: z.string().url("Avatar deve ser uma URL válida").optional(),
});

const createAddressSchema = z.object({
  street: z.string().min(3, "Rua deve ter no mínimo 3 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(3, "Bairro deve ter no mínimo 3 caracteres"),
  city: z.string().min(3, "Cidade deve ter no mínimo 3 caracteres"),
  state: z.string().min(2, "Estado deve ter no mínimo 2 caracteres"),
  zipCode: z.string().min(8, "CEP deve ter no mínimo 8 caracteres"),
  isDefault: z.boolean().optional(),
});

const updateAddressSchema = z.object({
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

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const user = await userService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Perfil obtido com sucesso",
      data: { user },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(
      req.user.userId,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: { user },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Erro de validação",
        errors: error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserAddresses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const addresses = await userService.getUserAddresses(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Endereços obtidos com sucesso",
      data: { addresses },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar endereços",
      error: error.message,
    });
  }
};

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const validatedData = createAddressSchema.parse(req.body);
    const address = await userService.createAddress(
      req.user.userId,
      validatedData
    );

    res.status(201).json({
      success: true,
      message: "Endereço criado com sucesso",
      data: { address },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Erro de validação",
        errors: error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res
        .status(400)
        .json({ success: false, message: "ID do endereço é obrigatório" });
      return;
    }
    const validatedData = updateAddressSchema.parse(req.body);

    const address = await userService.updateAddress(
      req.user.userId,
      addressId,
      validatedData
    );

    res.status(200).json({
      success: true,
      message: "Endereço atualizado com sucesso",
      data: { address },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Erro de validação",
        errors: error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false,
        message: 'Usuário não autenticado' 
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res.status(400).json({ success: false, message: 'ID do endereço é obrigatório' });
      return;
    }
    await userService.deleteAddress(req.user.userId, addressId);
    
    res.status(200).json({
      success: true,
      message: 'Endereço removido com sucesso'
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const setDefaultAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const { addressId } = req.params;
    if (!addressId) {
      res
        .status(400)
        .json({ success: false, message: "ID do endereço é obrigatório" });
      return;
    }
    const address = await userService.setDefaultAddress(
      req.user.userId,
      addressId
    );

    res.status(200).json({
      success: true,
      message: "Endereço padrão definido com sucesso",
      data: { address },
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
