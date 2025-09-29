import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../schemas/authSchemas';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const validatedData = req.body as RegisterInput;
    const result = await authService.register(validatedData);
    sendSuccess(res, 'Usuário criado com sucesso', result, 201);
  }

  async login(req: Request, res: Response): Promise<void> {
    const validatedData = req.body as LoginInput;
    const result = await authService.login(validatedData);
    sendSuccess(res, 'Login realizado com sucesso', result);
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    const profile = await authService.getProfile(req.user.id);
    sendSuccess(res, 'Perfil obtido com sucesso', profile);
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    sendSuccess(res, 'Logout realizado com sucesso');
  }
}
