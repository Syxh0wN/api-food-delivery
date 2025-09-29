import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any[];
}

export const sendSuccess = (res: Response, message: string, data?: any, statusCode: number = 200): void => {
  const response: ApiResponse = { success: true, message };
  if (data !== undefined) response.data = data;
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode: number = 400, errors?: any[]): void => {
  const response: ApiResponse = { success: false, message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

export const sendNotFound = (res: Response, message: string): void => {
  const response: ApiResponse = { success: false, message };
  res.status(404).json(response);
};

export const handleZodError = (res: Response, error: z.ZodError): void => {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }));
  sendError(res, 'Erro de validação', 400, errors);
};

export const handleControllerError = (res: Response, error: any, defaultMessage: string = 'Erro interno do servidor'): void => {
  if (error instanceof z.ZodError) {
    handleZodError(res, error);
    return;
  }
  
  const message = error instanceof Error ? error.message : defaultMessage;
  const statusCode = error.statusCode || 400;
  sendError(res, message, statusCode);
};
