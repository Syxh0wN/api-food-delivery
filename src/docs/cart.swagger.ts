export const cartSwaggerPaths = {
  '/api/cart': {
    get: {
      tags: ['Carrinho'],
      summary: 'Obter carrinho do usuário',
      description: 'Retorna o carrinho de compras do usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Carrinho obtido com sucesso',
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
                          cart: { $ref: '#/components/schemas/Cart' }
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
    delete: {
      tags: ['Carrinho'],
      summary: 'Limpar carrinho',
      description: 'Remove todos os itens do carrinho',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Carrinho limpo com sucesso',
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
        }
      }
    }
  },
  '/api/cart/items': {
    post: {
      tags: ['Carrinho'],
      summary: 'Adicionar item ao carrinho',
      description: 'Adiciona um produto ao carrinho de compras',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { type: 'string', example: 'product-id-123' },
                quantity: { type: 'integer', minimum: 1, example: 2 }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Item adicionado ao carrinho com sucesso',
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
                          cartItem: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              productId: { type: 'string' },
                              quantity: { type: 'integer' },
                              price: { type: 'number' }
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
          description: 'Dados inválidos ou produto não encontrado',
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
  '/api/cart/items/{itemId}': {
    put: {
      tags: ['Carrinho'],
      summary: 'Atualizar quantidade do item',
      description: 'Atualiza a quantidade de um item no carrinho',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'itemId',
          in: 'path',
          required: true,
          description: 'ID do item no carrinho',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['quantity'],
              properties: {
                quantity: { type: 'integer', minimum: 1, example: 3 }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Item atualizado com sucesso',
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
                          cartItem: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              productId: { type: 'string' },
                              quantity: { type: 'integer' },
                              price: { type: 'number' }
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
          description: 'Dados inválidos ou item não encontrado',
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
    },
    delete: {
      tags: ['Carrinho'],
      summary: 'Remover item do carrinho',
      description: 'Remove um item específico do carrinho',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'itemId',
          in: 'path',
          required: true,
          description: 'ID do item no carrinho',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Item removido com sucesso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Success' }
            }
          }
        },
        '400': {
          description: 'Item não encontrado no carrinho',
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
  '/api/cart/summary': {
    get: {
      tags: ['Carrinho'],
      summary: 'Obter resumo do carrinho',
      description: 'Retorna um resumo do carrinho com totais',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Resumo do carrinho obtido com sucesso',
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
                              totalItems: { type: 'integer' },
                              totalValue: { type: 'number' },
                              items: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    productId: { type: 'string' },
                                    quantity: { type: 'integer' },
                                    price: { type: 'number' },
                                    subtotal: { type: 'number' }
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
        }
      }
    }
  }
};
