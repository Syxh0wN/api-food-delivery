import { Request, Response, NextFunction } from 'express';
import { handleControllerError } from './errorHandler';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      if (error instanceof Error && error.message.includes('Credenciais inválidas')) {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      handleControllerError(res, error);
    });
  };
};

export type AsyncAuthenticatedRequestHandler = (
  req: any,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncAuthenticatedHandler = (fn: AsyncAuthenticatedRequestHandler) => {
  return (req: any, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleControllerError(res, error);
    });
  };
};
