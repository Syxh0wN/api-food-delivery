export const couponsSwaggerPaths = {
  '/api/coupons/active': {
    get: {
      tags: ['Cupons'],
      summary: 'Listar cupons ativos',
      description: 'Retorna uma lista de cupons ativos disponíveis',
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
          name: 'storeId',
          in: 'query',
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de cupons ativos obtida com sucesso',
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
                          coupons: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Coupon' }
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
        }
      }
    }
  },
  '/api/coupons/code/{code}': {
    get: {
      tags: ['Cupons'],
      summary: 'Obter cupom por código',
      description: 'Retorna os dados de um cupom específico pelo código',
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          description: 'Código do cupom',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Cupom obtido com sucesso',
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
                          coupon: { $ref: '#/components/schemas/Coupon' }
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
          description: 'Cupom não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/coupons/validate': {
    post: {
      tags: ['Cupons'],
      summary: 'Validar cupom',
      description: 'Valida um cupom para um pedido específico',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'orderValue'],
              properties: {
                code: { type: 'string', example: 'DESCONTO10' },
                orderValue: { type: 'number', example: 50.00 },
                storeId: { type: 'string', example: 'store-id-123' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Cupom validado com sucesso',
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
                          isValid: { type: 'boolean' },
                          coupon: { $ref: '#/components/schemas/Coupon' },
                          discount: { type: 'number' },
                          finalValue: { type: 'number' }
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
          description: 'Cupom inválido ou expirado',
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
  '/api/coupons': {
    get: {
      tags: ['Cupons'],
      summary: 'Listar todos os cupons',
      description: 'Retorna uma lista de todos os cupons (apenas para STORE_OWNER e ADMIN)',
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
          name: 'storeId',
          in: 'query',
          description: 'ID da loja',
          schema: { type: 'string' }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por cupons ativos',
          schema: { type: 'boolean' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de cupons obtida com sucesso',
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
                          coupons: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Coupon' }
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
    },
    post: {
      tags: ['Cupons'],
      summary: 'Criar novo cupom',
      description: 'Cria um novo cupom (apenas para STORE_OWNER e ADMIN)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'description', 'discountType', 'discountValue'],
              properties: {
                code: { type: 'string', example: 'DESCONTO10' },
                description: { type: 'string', example: '10% de desconto' },
                discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'], example: 'PERCENTAGE' },
                discountValue: { type: 'number', example: 10 },
                minOrderValue: { type: 'number', example: 30.00 },
                maxUses: { type: 'integer', example: 100 },
                validFrom: { type: 'string', format: 'date-time' },
                validUntil: { type: 'string', format: 'date-time' },
                storeId: { type: 'string', example: 'store-id-123' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Cupom criado com sucesso',
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
                          coupon: { $ref: '#/components/schemas/Coupon' }
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
  '/api/coupons/{id}': {
    get: {
      tags: ['Cupons'],
      summary: 'Obter cupom por ID',
      description: 'Retorna os dados de um cupom específico',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do cupom',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Cupom obtido com sucesso',
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
                          coupon: { $ref: '#/components/schemas/Coupon' }
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
        },
        '404': {
          description: 'Cupom não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Cupons'],
      summary: 'Atualizar cupom',
      description: 'Atualiza os dados de um cupom (apenas o criador ou ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do cupom',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                discountValue: { type: 'number' },
                minOrderValue: { type: 'number' },
                maxUses: { type: 'integer' },
                validFrom: { type: 'string', format: 'date-time' },
                validUntil: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Cupom atualizado com sucesso',
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
                          coupon: { $ref: '#/components/schemas/Coupon' }
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
        '403': {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Cupom não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Cupons'],
      summary: 'Excluir cupom',
      description: 'Exclui um cupom (apenas o criador ou ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do cupom',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Cupom excluído com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' }
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
        },
        '404': {
          description: 'Cupom não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/coupons/{id}/usage': {
    get: {
      tags: ['Cupons'],
      summary: 'Histórico de uso do cupom',
      description: 'Retorna o histórico de uso de um cupom (apenas o criador ou ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do cupom',
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
        }
      ],
      responses: {
        '200': {
          description: 'Histórico de uso obtido com sucesso',
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
                          usage: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                orderId: { type: 'string' },
                                userId: { type: 'string' },
                                discountApplied: { type: 'number' },
                                usedAt: { type: 'string', format: 'date-time' }
                              }
                            }
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
          description: 'Cupom não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/stores/{storeId}/coupons': {
    get: {
      tags: ['Cupons'],
      summary: 'Listar cupons da loja',
      description: 'Retorna os cupons de uma loja específica',
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
        }
      ],
      responses: {
        '200': {
          description: 'Lista de cupons da loja obtida com sucesso',
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
                          coupons: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Coupon' }
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
    },
    post: {
      tags: ['Cupons'],
      summary: 'Criar cupom para loja',
      description: 'Cria um novo cupom para uma loja específica (apenas o dono da loja)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'description', 'discountType', 'discountValue'],
              properties: {
                code: { type: 'string', example: 'LOJA10' },
                description: { type: 'string', example: '10% de desconto na loja' },
                discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'], example: 'PERCENTAGE' },
                discountValue: { type: 'number', example: 10 },
                minOrderValue: { type: 'number', example: 30.00 },
                maxUses: { type: 'integer', example: 100 },
                validFrom: { type: 'string', format: 'date-time' },
                validUntil: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Cupom da loja criado com sucesso',
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
                          coupon: { $ref: '#/components/schemas/Coupon' }
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
          description: 'Dados inválidos ou usuário não é dono da loja',
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
