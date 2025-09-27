export const reviewsSwaggerPaths = {
  '/api/reviews': {
    get: {
      tags: ['Avaliações'],
      summary: 'Listar avaliações',
      description: 'Retorna uma lista de avaliações',
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
          name: 'rating',
          in: 'query',
          description: 'Filtrar por avaliação',
          schema: { type: 'integer', minimum: 1, maximum: 5 }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de avaliações obtida com sucesso',
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
                          reviews: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Review' }
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
    },
    post: {
      tags: ['Avaliações'],
      summary: 'Criar nova avaliação',
      description: 'Cria uma nova avaliação para uma loja',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['storeId', 'orderId', 'rating'],
              properties: {
                storeId: { type: 'string', example: 'store-id-123' },
                orderId: { type: 'string', example: 'order-id-123' },
                rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                comment: { type: 'string', example: 'Excelente atendimento e comida deliciosa!' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Avaliação criada com sucesso',
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
                          review: { $ref: '#/components/schemas/Review' }
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
          description: 'Dados inválidos ou pedido não encontrado',
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
  '/api/reviews/{id}': {
    get: {
      tags: ['Avaliações'],
      summary: 'Obter avaliação por ID',
      description: 'Retorna os dados de uma avaliação específica',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da avaliação',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Avaliação obtida com sucesso',
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
                          review: { $ref: '#/components/schemas/Review' }
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
          description: 'Avaliação não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Avaliações'],
      summary: 'Atualizar avaliação',
      description: 'Atualiza uma avaliação (apenas o autor)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da avaliação',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Avaliação atualizada com sucesso',
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
                          review: { $ref: '#/components/schemas/Review' }
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
          description: 'Avaliação não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Avaliações'],
      summary: 'Excluir avaliação',
      description: 'Exclui uma avaliação (apenas o autor)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da avaliação',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Avaliação excluída com sucesso',
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
          description: 'Avaliação não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/stores/{storeId}/reviews': {
    get: {
      tags: ['Avaliações'],
      summary: 'Listar avaliações da loja',
      description: 'Retorna as avaliações de uma loja específica',
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
          name: 'rating',
          in: 'query',
          description: 'Filtrar por avaliação',
          schema: { type: 'integer', minimum: 1, maximum: 5 }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de avaliações da loja obtida com sucesso',
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
                          reviews: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Review' }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              totalPages: { type: 'integer' }
                            }
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              averageRating: { type: 'number' },
                              totalReviews: { type: 'integer' },
                              ratingDistribution: {
                                type: 'object',
                                properties: {
                                  '1': { type: 'integer' },
                                  '2': { type: 'integer' },
                                  '3': { type: 'integer' },
                                  '4': { type: 'integer' },
                                  '5': { type: 'integer' }
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
        '404': {
          description: 'Loja não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/stores/{storeId}/reviews/summary': {
    get: {
      tags: ['Avaliações'],
      summary: 'Resumo das avaliações da loja',
      description: 'Retorna um resumo das avaliações de uma loja',
      parameters: [
        {
          name: 'storeId',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Resumo das avaliações obtido com sucesso',
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
                              averageRating: { type: 'number' },
                              totalReviews: { type: 'integer' },
                              ratingDistribution: {
                                type: 'object',
                                properties: {
                                  '1': { type: 'integer' },
                                  '2': { type: 'integer' },
                                  '3': { type: 'integer' },
                                  '4': { type: 'integer' },
                                  '5': { type: 'integer' }
                                }
                              },
                              recentReviews: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Review' }
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
        '404': {
          description: 'Loja não encontrada',
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
