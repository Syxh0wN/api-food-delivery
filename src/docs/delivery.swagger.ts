export const deliverySwaggerPaths = {
  '/api/delivery/tracking': {
    post: {
      tags: ['Entrega'],
      summary: 'Criar rastreamento de entrega',
      description: 'Cria um novo rastreamento para um pedido',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['orderId', 'method'],
              properties: {
                orderId: { type: 'string', example: 'order-id-123' },
                method: { type: 'string', enum: ['DELIVERY', 'PICKUP'], example: 'DELIVERY' },
                estimatedDeliveryTime: { type: 'string', format: 'date-time' },
                deliveryPersonId: { type: 'string', example: 'delivery-person-id-123' },
                notes: { type: 'string', example: 'Entregar na portaria' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Rastreamento criado com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          tracking: { $ref: '#/components/schemas/DeliveryTracking' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Token inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/delivery/tracking/{orderId}': {
    get: {
      tags: ['Entrega'],
      summary: 'Obter rastreamento por ID do pedido',
      description: 'Retorna o rastreamento de um pedido específico',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          description: 'ID do pedido',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Rastreamento obtido com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          tracking: { $ref: '#/components/schemas/DeliveryTracking' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': {
          description: 'Token inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Rastreamento não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    patch: {
      tags: ['Entrega'],
      summary: 'Atualizar status de entrega',
      description: 'Atualiza o status de entrega de um pedido',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'orderId',
          in: 'path',
          required: true,
          description: 'ID do pedido',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { 
                  type: 'string', 
                  enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
                  example: 'OUT_FOR_DELIVERY'
                },
                location: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', example: -23.5505 },
                    longitude: { type: 'number', example: -46.6333 },
                    address: { type: 'string', example: 'Rua das Flores, 123' }
                  }
                },
                notes: { type: 'string', example: 'Saiu para entrega' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status atualizado com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          tracking: { $ref: '#/components/schemas/DeliveryTracking' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '401': {
          description: 'Token inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Rastreamento não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/delivery/tracking/code/{trackingCode}': {
    get: {
      tags: ['Entrega'],
      summary: 'Obter rastreamento por código',
      description: 'Retorna o rastreamento usando o código de rastreamento',
      parameters: [
        {
          name: 'trackingCode',
          in: 'path',
          required: true,
          description: 'Código de rastreamento',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Rastreamento obtido com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          tracking: { $ref: '#/components/schemas/DeliveryTracking' }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '404': {
          description: 'Rastreamento não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/delivery/estimate': {
    post: {
      tags: ['Entrega'],
      summary: 'Calcular estimativa de entrega',
      description: 'Calcula o tempo estimado de entrega para um endereço',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['storeId', 'deliveryAddress'],
              properties: {
                storeId: { type: 'string', example: 'store-id-123' },
                deliveryAddress: {
                  type: 'object',
                  required: ['latitude', 'longitude'],
                  properties: {
                    latitude: { type: 'number', example: -23.5505 },
                    longitude: { type: 'number', example: -46.6333 },
                    address: { type: 'string', example: 'Rua das Flores, 123' }
                  }
                },
                method: { type: 'string', enum: ['DELIVERY', 'PICKUP'], default: 'DELIVERY' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Estimativa calculada com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          estimate: {
                            type: 'object',
                            properties: {
                              estimatedTime: { type: 'integer', description: 'Tempo em minutos' },
                              estimatedDeliveryTime: { type: 'string', format: 'date-time' },
                              distance: { type: 'number', description: 'Distância em km' },
                              method: { type: 'string', enum: ['DELIVERY', 'PICKUP'] }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '400': {
          description: 'Dados inválidos',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/delivery/stats': {
    get: {
      tags: ['Entrega'],
      summary: 'Estatísticas de entrega',
      description: 'Retorna estatísticas de entrega (apenas para ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'period',
          in: 'query',
          description: 'Período das estatísticas',
          schema: { type: 'string', enum: ['today', 'week', 'month', 'year'], default: 'month' }
        }
      ],
      responses: {
        '200': {
          description: 'Estatísticas obtidas com sucesso',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/Success' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          stats: {
                            type: 'object',
                            properties: {
                              totalDeliveries: { type: 'integer' },
                              averageDeliveryTime: { type: 'number' },
                              onTimePercentage: { type: 'number' },
                              deliveriesByStatus: {
                                type: 'object',
                                properties: {
                                  PENDING: { type: 'integer' },
                                  CONFIRMED: { type: 'integer' },
                                  PREPARING: { type: 'integer' },
                                  READY: { type: 'integer' },
                                  OUT_FOR_DELIVERY: { type: 'integer' },
                                  DELIVERED: { type: 'integer' },
                                  CANCELLED: { type: 'integer' }
                                }
                              },
                              topDeliveryPersons: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' },
                                    totalDeliveries: { type: 'integer' },
                                    averageRating: { type: 'number' },
                                    onTimePercentage: { type: 'number' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        '401': {
          description: 'Token inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '403': {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
};
