export const ordersSwaggerPaths = {
  '/api/orders': {
    get: {
      tags: ['Pedidos'],
      summary: 'Listar pedidos do usuário',
      description: 'Retorna os pedidos do usuário autenticado',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número da página',
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Itens por página',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por status',
          schema: { 
            type: 'string', 
            enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] 
          }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de pedidos obtida com sucesso',
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
                          orders: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Order' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              totalPages: { type: 'integer' }
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
        }
      }
    },
    post: {
      tags: ['Pedidos'],
      summary: 'Criar novo pedido',
      description: 'Cria um novo pedido a partir do carrinho',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['addressId', 'paymentMethod'],
              properties: {
                addressId: { type: 'string', example: 'address-id-123' },
                paymentMethod: { type: 'string', enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH'], example: 'PIX' },
                notes: { type: 'string', example: 'Entregar na portaria' },
                couponCode: { type: 'string', example: 'DESCONTO10' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Pedido criado com sucesso',
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
                          order: { $ref: '#/components/schemas/Order' }
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
          description: 'Dados inválidos ou carrinho vazio',
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
  '/api/orders/{id}': {
    get: {
      tags: ['Pedidos'],
      summary: 'Obter pedido por ID',
      description: 'Retorna os dados de um pedido específico',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do pedido',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Pedido obtido com sucesso',
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
                          order: { $ref: '#/components/schemas/Order' }
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
          description: 'Pedido não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/orders/{id}/cancel': {
    patch: {
      tags: ['Pedidos'],
      summary: 'Cancelar pedido',
      description: 'Cancela um pedido (apenas o dono do pedido)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do pedido',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                reason: { type: 'string', example: 'Mudança de planos' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Pedido cancelado com sucesso',
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
                          order: { $ref: '#/components/schemas/Order' }
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
          description: 'Pedido não pode ser cancelado',
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
          description: 'Pedido não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/stores/{storeId}/orders': {
    get: {
      tags: ['Pedidos'],
      summary: 'Listar pedidos da loja',
      description: 'Retorna os pedidos de uma loja específica (apenas o dono)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        },
        {
          name: 'page',
          in: 'query',
          description: 'Número da página',
          schema: { type: 'integer', minimum: 1, default: 1 }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Itens por página',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por status',
          schema: { 
            type: 'string', 
            enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] 
          }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de pedidos da loja obtida com sucesso',
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
                          orders: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Order' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              totalPages: { type: 'integer' }
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
  },
  '/api/stores/{storeId}/orders/{id}/status': {
    patch: {
      tags: ['Pedidos'],
      summary: 'Atualizar status do pedido',
      description: 'Atualiza o status de um pedido (apenas o dono da loja)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        },
        {
          name: 'id',
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
                  enum: ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
                  example: 'CONFIRMED'
                },
                notes: { type: 'string', example: 'Pedido confirmado, iniciando preparo' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status do pedido atualizado com sucesso',
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
                          order: { $ref: '#/components/schemas/Order' }
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
          description: 'Status inválido',
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
        },
        '404': {
          description: 'Pedido não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/stores/{storeId}/orders/summary': {
    get: {
      tags: ['Pedidos'],
      summary: 'Resumo dos pedidos da loja',
      description: 'Retorna um resumo dos pedidos de uma loja (apenas o dono)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        },
        {
          name: 'period',
          in: 'query',
          description: 'Período do resumo',
          schema: { type: 'string', enum: ['today', 'week', 'month', 'year'], default: 'month' }
        }
      ],
      responses: {
        '200': {
          description: 'Resumo dos pedidos obtido com sucesso',
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
                          summary: {
                            type: 'object',
                            properties: {
                              totalOrders: { type: 'integer' },
                              totalRevenue: { type: 'number' },
                              averageOrderValue: { type: 'number' },
                              ordersByStatus: {
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
