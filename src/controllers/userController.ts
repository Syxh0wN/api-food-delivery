import { Response } from "express";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../middleware/auth";
import { sendSuccess } from "../middleware/errorHandler";
import { UpdateProfileInput, CreateAddressInput, UpdateAddressInput } from "../schemas/userSchemas";

const userService = new UserService();

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const user = await userService.getProfile(req.user.id);
  sendSuccess(res, "Perfil obtido com sucesso", { user });
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const validatedData = req.body as UpdateProfileInput;
  const user = await userService.updateProfile(req.user.id, validatedData);
  sendSuccess(res, "Perfil atualizado com sucesso", { user });
};

export const getUserAddresses = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const addresses = await userService.getUserAddresses(req.user.id);
  sendSuccess(res, "Endereços obtidos com sucesso", { addresses });
};

export const createAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const validatedData = req.body as CreateAddressInput;
  const address = await userService.createAddress(req.user.id, validatedData);
  sendSuccess(res, "Endereço criado com sucesso", { address }, 201);
};

export const updateAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const { addressId } = req.params as { addressId: string };
  const validatedData = req.body as UpdateAddressInput;

  const address = await userService.updateAddress(
    req.user.id,
    addressId,
    validatedData
  );
  sendSuccess(res, "Endereço atualizado com sucesso", { address });
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ 
      success: false,
      message: 'Usuário não autenticado' 
    });
    return;
  }

  const { addressId } = req.params as { addressId: string };
  await userService.deleteAddress(req.user.id, addressId);
  sendSuccess(res, 'Endereço removido com sucesso');
};

export const setDefaultAddress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Usuário não autenticado",
    });
    return;
  }

  const { addressId } = req.params as { addressId: string };
  const address = await userService.setDefaultAddress(req.user.id, addressId);
  sendSuccess(res, "Endereço padrão definido com sucesso", { address });
};
