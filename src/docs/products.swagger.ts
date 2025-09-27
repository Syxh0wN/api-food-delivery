export const productsSwaggerPaths = {
  '/api/products': {
    get: {
      tags: ['Produtos'],
      summary: 'Listar produtos',
      description: 'Retorna uma lista de produtos disponíveis',
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
          name: 'category',
          in: 'query',
          description: 'Categoria do produto',
          schema: { type: 'string' }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Termo de busca',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de produtos obtida com sucesso',
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
                          products: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Product' }
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
      tags: ['Produtos'],
      summary: 'Criar novo produto',
      description: 'Cria um novo produto (apenas para STORE_OWNER)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'description', 'price', 'category', 'storeId'],
              properties: {
                name: { type: 'string', example: 'Pizza Margherita' },
                description: { type: 'string', example: 'Pizza com molho de tomate, mussarela e manjericão' },
                price: { type: 'number', example: 25.90 },
                category: { type: 'string', example: 'Pizza' },
                storeId: { type: 'string', example: 'store-id-123' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Produto criado com sucesso',
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
                          product: { $ref: '#/components/schemas/Product' }
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
  '/api/products/{id}': {
    get: {
      tags: ['Produtos'],
      summary: 'Obter produto por ID',
      description: 'Retorna os dados de um produto específico',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do produto',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Produto obtido com sucesso',
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
                          product: { $ref: '#/components/schemas/Product' }
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
          description: 'Produto não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Produtos'],
      summary: 'Atualizar produto',
      description: 'Atualiza os dados de um produto (apenas o dono da loja)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do produto',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                category: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Produto atualizado com sucesso',
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
                          product: { $ref: '#/components/schemas/Product' }
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
        '403': {
          description: 'Acesso negado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        '404': {
          description: 'Produto não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Produtos'],
      summary: 'Excluir produto',
      description: 'Exclui um produto (apenas o dono da loja)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do produto',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Produto excluído com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' }
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
          description: 'Produto não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/products/{id}/toggle-availability': {
    patch: {
      tags: ['Produtos'],
      summary: 'Alternar disponibilidade do produto',
      description: 'Ativa/desativa um produto (apenas o dono da loja)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID do produto',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Disponibilidade do produto alterada com sucesso',
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
                          product: { $ref: '#/components/schemas/Product' }
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
        },
        '404': {
          description: 'Produto não encontrado',
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
