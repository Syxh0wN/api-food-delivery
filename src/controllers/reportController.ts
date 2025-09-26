import { Response } from 'express';
import { ReportService } from '../services/reportService';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { ReportFilters, ReportResponse } from '../types/report';

const reportService = new ReportService();

const reportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  storeId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.string().optional()
});

const exportOptionsSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().optional().default(false),
  includeDetails: z.boolean().optional().default(true)
});

export const getSalesReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const salesReport = await reportService.getSalesReport(filters);

    const response: ReportResponse<typeof salesReport> = {
      success: true,
      data: salesReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getOrderReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const orderReport = await reportService.getOrderReport(filters);

    const response: ReportResponse<typeof orderReport> = {
      success: true,
      data: orderReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getUserReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const userReport = await reportService.getUserReport(filters);

    const response: ReportResponse<typeof userReport> = {
      success: true,
      data: userReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório de usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getStoreReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const storeReport = await reportService.getStoreReport(filters);

    const response: ReportResponse<typeof storeReport> = {
      success: true,
      data: storeReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório de lojas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getProductReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const productReport = await reportService.getProductReport(filters);

    const response: ReportResponse<typeof productReport> = {
      success: true,
      data: productReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório de produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const getDashboardReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem acessar relatórios'
      });
      return;
    }

    const validatedFilters = reportFiltersSchema.parse(req.query);
    const filters: ReportFilters = validatedFilters as any;

    const dashboardReport = await reportService.getDashboardReport(filters);

    const response: ReportResponse<typeof dashboardReport> = {
      success: true,
      data: dashboardReport,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao gerar relatório do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export const exportReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
      return;
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem exportar relatórios'
      });
      return;
    }

    const { reportType } = req.params;
    const validatedFilters = reportFiltersSchema.parse(req.query);
    const validatedOptions = exportOptionsSchema.parse(req.body);

    const filters: ReportFilters = validatedFilters as any;
    const options = validatedOptions;

    let reportData: any;

    switch (reportType) {
      case 'sales':
        reportData = await reportService.getSalesReport(filters);
        break;
      case 'orders':
        reportData = await reportService.getOrderReport(filters);
        break;
      case 'users':
        reportData = await reportService.getUserReport(filters);
        break;
      case 'stores':
        reportData = await reportService.getStoreReport(filters);
        break;
      case 'products':
        reportData = await reportService.getProductReport(filters);
        break;
      case 'dashboard':
        reportData = await reportService.getDashboardReport(filters);
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Tipo de relatório inválido'
        });
        return;
    }

    const response: ReportResponse<typeof reportData> = {
      success: true,
      data: reportData,
      filters,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: filters.endDate || new Date().toISOString().split('T')[0]
      } as any
    };

    if (options.format === 'json') {
      res.status(200).json(response);
    } else if (options.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(convertToCSV(response));
    } else if (options.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.status(200).send(convertToPDF(response));
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: error.issues
      });
      return;
    }

    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const convertToCSV = (data: any): string => {
  const headers = Object.keys(data.data);
  const csvContent = [
    headers.join(','),
    ...Object.values(data.data).map((value: any) => 
      Array.isArray(value) ? JSON.stringify(value) : String(value)
    )
  ].join('\n');
  
  return csvContent;
};

const convertToPDF = (data: any): string => {
  return JSON.stringify(data, null, 2);
};
