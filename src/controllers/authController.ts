import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'STORE_OWNER']).optional().default('CLIENT')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      const result = await authService.register(validatedData);
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const result = await authService.login(validatedData);
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
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

        const profile = await authService.getProfile(req.user.userId);
      
      res.json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: profile
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }
}
