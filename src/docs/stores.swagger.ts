export const storesSwaggerPaths = {
  '/api/stores': {
    get: {
      tags: ['Lojas'],
      summary: 'Listar lojas',
      description: 'Retorna uma lista de lojas ativas',
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
          name: 'search',
          in: 'query',
          description: 'Termo de busca',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de lojas obtida com sucesso',
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
                          stores: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Store' }
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
      tags: ['Lojas'],
      summary: 'Criar nova loja',
      description: 'Cria uma nova loja (apenas para STORE_OWNER)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'description', 'address', 'phone', 'email'],
              properties: {
                name: { type: 'string', example: 'Pizzaria do João' },
                description: { type: 'string', example: 'Melhor pizza da cidade' },
                address: { type: 'string', example: 'Rua das Flores, 123' },
                phone: { type: 'string', example: '(11) 99999-9999' },
                email: { type: 'string', format: 'email', example: 'contato@pizzaria.com' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Loja criada com sucesso',
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
                          store: { $ref: '#/components/schemas/Store' }
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
  '/api/stores/{id}': {
    get: {
      tags: ['Lojas'],
      summary: 'Obter loja por ID',
      description: 'Retorna os dados de uma loja específica',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Loja obtida com sucesso',
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
                          store: { $ref: '#/components/schemas/Store' }
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
    },
    put: {
      tags: ['Lojas'],
      summary: 'Atualizar loja',
      description: 'Atualiza os dados de uma loja (apenas o dono)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
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
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                address: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Loja atualizada com sucesso',
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
                          store: { $ref: '#/components/schemas/Store' }
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
          description: 'Loja não encontrada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Lojas'],
      summary: 'Excluir loja',
      description: 'Exclui uma loja (apenas o dono)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Loja excluída com sucesso',
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
  '/api/stores/{id}/toggle-status': {
    patch: {
      tags: ['Lojas'],
      summary: 'Alternar status da loja',
      description: 'Ativa/desativa uma loja (apenas o dono)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da loja',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Status da loja alterado com sucesso',
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
                          store: { $ref: '#/components/schemas/Store' }
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
