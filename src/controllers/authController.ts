import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess, handleControllerError } from '../middleware/errorHandler';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../schemas/authSchemas';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = req.body as RegisterInput;
      const result = await authService.register(validatedData);
      sendSuccess(res, 'Usuário criado com sucesso', result, 201);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = req.body as LoginInput;
      const result = await authService.login(validatedData);
      sendSuccess(res, 'Login realizado com sucesso', result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Credenciais inválidas')) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      handleControllerError(res, error, 'Erro no login');
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const profile = await authService.getProfile(req.user.id);
      sendSuccess(res, 'Perfil obtido com sucesso', profile);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    sendSuccess(res, 'Logout realizado com sucesso');
  }
}
