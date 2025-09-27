import { Request, Response } from 'express';
import { z } from 'zod';
import { getDeliveryService } from '../services/deliveryService';
import { PrismaClient, DeliveryStatus, DeliveryMethod } from '@prisma/client';
import { 
  CreateDeliveryTrackingInput, 
  UpdateDeliveryStatusInput,
  CreateDeliveryPersonInput,
  UpdateDeliveryPersonInput,
  DeliveryFilter
} from '../types/delivery';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const prisma = new PrismaClient();
const deliveryService = getDeliveryService(prisma);

const createDeliveryTrackingSchema = z.object({
  orderId: z.string(),
  method: z.nativeEnum(DeliveryMethod),
  estimatedDeliveryTime: z.string().datetime().optional(),
  deliveryPersonId: z.string().optional(),
  trackingCode: z.string().optional(),
  notes: z.string().optional()
});

const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(DeliveryStatus),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    timestamp: z.string().datetime()
  }).optional(),
  notes: z.string().optional(),
  actualDeliveryTime: z.string().datetime().optional()
});

const createDeliveryPersonSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  password: z.string().min(6)
});

const updateDeliveryPersonSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional()
});

const deliveryFilterSchema = z.object({
  status: z.nativeEnum(DeliveryStatus).optional(),
  method: z.nativeEnum(DeliveryMethod).optional(),
  deliveryPersonId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

export const createDeliveryTracking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createDeliveryTrackingSchema.parse(req.body);
    
    const input: CreateDeliveryTrackingInput = {
      orderId: validatedData.orderId,
      method: validatedData.method as DeliveryMethod
    };
    
    if (validatedData.estimatedDeliveryTime) {
      input.estimatedDeliveryTime = new Date(validatedData.estimatedDeliveryTime);
    }
    if (validatedData.deliveryPersonId) {
      input.deliveryPersonId = validatedData.deliveryPersonId;
    }
    if (validatedData.trackingCode) {
      input.trackingCode = validatedData.trackingCode;
    }
    if (validatedData.notes) {
      input.notes = validatedData.notes;
    }
    
    const tracking = await deliveryService.createDeliveryTracking(input);
    
    return res.status(201).json(tracking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao criar rastreamento:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { trackingId } = req.params;
    const validatedData = updateDeliveryStatusSchema.parse(req.body);
    
    if (!trackingId) {
      return res.status(400).json({
        message: 'ID do rastreamento é obrigatório'
      });
    }
    
    const input: UpdateDeliveryStatusInput = {
      status: validatedData.status as DeliveryStatus
    };
    
    if (validatedData.location) {
      input.location = {
        ...validatedData.location,
        timestamp: new Date(validatedData.location.timestamp)
      };
    }
    if (validatedData.notes) {
      input.notes = validatedData.notes;
    }
    if (validatedData.actualDeliveryTime) {
      input.actualDeliveryTime = new Date(validatedData.actualDeliveryTime);
    }
    
    const tracking = await deliveryService.updateDeliveryStatus(
      trackingId, 
      input, 
      req.user?.id
    );
    
    return res.json(tracking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getOrderTracking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        message: 'ID do pedido é obrigatório'
      });
    }
    
    const tracking = await deliveryService.getOrderTracking(orderId);
    
    return res.json(tracking);
  } catch (error) {
    console.error('Erro ao buscar rastreamento:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getTrackingByCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { trackingCode } = req.params;
    
    if (!trackingCode) {
      return res.status(400).json({
        message: 'Código de rastreamento é obrigatório'
      });
    }
    
    const tracking = await prisma.deliveryTracking.findUnique({
      where: { trackingCode },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            },
            store: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true
              }
            },
            address: true
          }
        }
      }
    });
    
    if (!tracking) {
      return res.status(404).json({
        message: 'Rastreamento não encontrado'
      });
    }
    
    const orderTracking = await deliveryService.getOrderTracking(tracking.orderId);
    
    return res.json(orderTracking);
  } catch (error) {
    console.error('Erro ao buscar rastreamento por código:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const calculateDeliveryEstimate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        message: 'ID do pedido é obrigatório'
      });
    }
    
    const estimate = await deliveryService.calculateDeliveryEstimate(orderId);
    
    return res.json(estimate);
  } catch (error) {
    console.error('Erro ao calcular estimativa:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const createDeliveryPerson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createDeliveryPersonSchema.parse(req.body);
    
    const deliveryPerson = await deliveryService.createDeliveryPerson(validatedData);
    
    return res.status(201).json(deliveryPerson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao criar entregador:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const updateDeliveryPerson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deliveryPersonId } = req.params;
    const validatedData = updateDeliveryPersonSchema.parse(req.body);
    
    if (!deliveryPersonId) {
      return res.status(400).json({
        message: 'ID do entregador é obrigatório'
      });
    }
    
    const deliveryPerson = await deliveryService.updateDeliveryPerson(
      deliveryPersonId, 
      validatedData as UpdateDeliveryPersonInput
    );
    
    return res.json(deliveryPerson);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao atualizar entregador:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getDeliveryPersons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const [deliveryPersons, total] = await Promise.all([
      prisma.deliveryPerson.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.deliveryPerson.count()
    ]);
    
    const totalPages = Math.ceil(total / Number(limit));
    
    return res.json({
      deliveryPersons: deliveryPersons.map(person => ({
        id: person.id,
        name: person.name,
        phone: person.phone,
        email: person.email,
        isActive: person.isActive,
        currentLocation: person.currentLocation,
        isAvailable: person.isAvailable,
        totalDeliveries: person.totalDeliveries,
        averageRating: person.averageRating,
        createdAt: person.createdAt
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    });
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getDeliveryStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = deliveryFilterSchema.parse(req.query);
    
    const filter: any = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined
    };
    
    const stats = await deliveryService.getDeliveryStats(filter);
    
    return res.json(stats);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getOrderImprovementStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await deliveryService.getOrderImprovementStats();
    
    return res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de melhorias:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};

export const getDeliveries = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedFilters = deliveryFilterSchema.parse(req.query);
    
    const filter: any = {
      ...validatedFilters,
      startDate: validatedFilters.startDate ? new Date(validatedFilters.startDate) : undefined,
      endDate: validatedFilters.endDate ? new Date(validatedFilters.endDate) : undefined
    };
    
    const { page = 1, limit = 20 } = filter;
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.method) where.method = filter.method;
    if (filter.deliveryPersonId) where.deliveryPersonId = filter.deliveryPersonId;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }
    
    const [deliveries, total] = await Promise.all([
      prisma.deliveryTracking.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              total: true,
              createdAt: true
            }
          },
          deliveryPerson: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.deliveryTracking.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return res.json({
      deliveries: deliveries.map(delivery => ({
        id: delivery.id,
        orderId: delivery.orderId,
        status: delivery.status,
        method: delivery.method,
        estimatedDeliveryTime: delivery.estimatedDeliveryTime,
        actualDeliveryTime: delivery.actualDeliveryTime,
        deliveryPersonId: delivery.deliveryPersonId,
        deliveryPersonName: delivery.deliveryPersonName,
        deliveryPersonPhone: delivery.deliveryPersonPhone,
        trackingCode: delivery.trackingCode,
        locations: delivery.locations,
        notes: delivery.notes,
        createdAt: delivery.createdAt,
        updatedAt: delivery.updatedAt,
        order: delivery.order,
        deliveryPerson: delivery.deliveryPerson
      })),
      total,
      page,
      limit,
      totalPages
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parâmetros inválidos',
        errors: error.issues
      });
    }
    
    console.error('Erro ao buscar entregas:', error);
    return res.status(500).json({
      message: 'Erro interno do servidor'
    });
  }
};
