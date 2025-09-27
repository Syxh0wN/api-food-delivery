export const favoritesSwaggerPaths = {
  '/api/favorites': {
    get: {
      tags: ['Favoritos'],
      summary: 'Listar favoritos do usuário',
      description: 'Retorna os favoritos do usuário autenticado',
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
          name: 'type',
          in: 'query',
          description: 'Filtrar por tipo',
          schema: { type: 'string', enum: ['STORE', 'PRODUCT'] }
        },
        {
          name: 'listId',
          in: 'query',
          description: 'Filtrar por lista',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de favoritos obtida com sucesso',
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
                          favorites: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Favorite' }
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
      tags: ['Favoritos'],
      summary: 'Adicionar favorito',
      description: 'Adiciona um item aos favoritos do usuário',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['itemId', 'type'],
              properties: {
                itemId: { type: 'string', example: 'store-id-123' },
                type: { type: 'string', enum: ['STORE', 'PRODUCT'], example: 'STORE' },
                listId: { type: 'string', example: 'list-id-123' },
                notes: { type: 'string', example: 'Minha loja favorita' },
                tags: { type: 'array', items: { type: 'string' }, example: ['pizza', 'italiana'] }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Favorito adicionado com sucesso',
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
                          favorite: { $ref: '#/components/schemas/Favorite' }
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
    }
  },
  '/api/favorites/{favoriteId}': {
    get: {
      tags: ['Favoritos'],
      summary: 'Obter favorito por ID',
      description: 'Retorna os dados de um favorito específico',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'favoriteId',
          in: 'path',
          required: true,
          description: 'ID do favorito',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Favorito obtido com sucesso',
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
                          favorite: { $ref: '#/components/schemas/Favorite' }
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
          description: 'Favorito não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    put: {
      tags: ['Favoritos'],
      summary: 'Atualizar favorito',
      description: 'Atualiza os dados de um favorito',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'favoriteId',
          in: 'path',
          required: true,
          description: 'ID do favorito',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                listId: { type: 'string' },
                notes: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                isActive: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Favorito atualizado com sucesso',
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
                          favorite: { $ref: '#/components/schemas/Favorite' }
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
          description: 'Favorito não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Favoritos'],
      summary: 'Remover favorito',
      description: 'Remove um favorito da lista do usuário',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'favoriteId',
          in: 'path',
          required: true,
          description: 'ID do favorito',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '204': {
          description: 'Favorito removido com sucesso'
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
          description: 'Favorito não encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/favorites/toggle/{type}/{itemId}': {
    post: {
      tags: ['Favoritos'],
      summary: 'Alternar favorito',
      description: 'Adiciona ou remove um item dos favoritos',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          description: 'Tipo do item',
          schema: { type: 'string', enum: ['STORE', 'PRODUCT'] }
        },
        {
          name: 'itemId',
          in: 'path',
          required: true,
          description: 'ID do item',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                listId: { type: 'string' },
                notes: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status do favorito alterado com sucesso',
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
                          isFavorite: { type: 'boolean' },
                          favorite: { $ref: '#/components/schemas/Favorite' }
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
          description: 'Item não encontrado',
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
  '/api/favorites/status/{type}/{itemId}': {
    get: {
      tags: ['Favoritos'],
      summary: 'Verificar status de favorito',
      description: 'Verifica se um item está nos favoritos do usuário',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          description: 'Tipo do item',
          schema: { type: 'string', enum: ['STORE', 'PRODUCT'] }
        },
        {
          name: 'itemId',
          in: 'path',
          required: true,
          description: 'ID do item',
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Status do favorito obtido com sucesso',
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
                          isFavorite: { type: 'boolean' },
                          favorite: { $ref: '#/components/schemas/Favorite' }
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
  },
  '/api/favorites/lists': {
    get: {
      tags: ['Favoritos'],
      summary: 'Listar listas de favoritos',
      description: 'Retorna as listas de favoritos do usuário',
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
          name: 'isPublic',
          in: 'query',
          description: 'Filtrar por listas públicas',
          schema: { type: 'boolean' }
        }
      ],
      responses: {
        '200': {
          description: 'Lista de listas de favoritos obtida com sucesso',
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
                          lists: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                isPublic: { type: 'boolean' },
                                tags: { type: 'array', items: { type: 'string' } },
                                color: { type: 'string' },
                                itemCount: { type: 'integer' },
                                createdAt: { type: 'string', format: 'date-time' },
                                updatedAt: { type: 'string', format: 'date-time' }
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
        }
      }
    },
    post: {
      tags: ['Favoritos'],
      summary: 'Criar lista de favoritos',
      description: 'Cria uma nova lista de favoritos',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'Minhas Lojas Favoritas' },
                description: { type: 'string', example: 'Lista das melhores lojas' },
                isPublic: { type: 'boolean', default: false },
                tags: { type: 'array', items: { type: 'string' }, example: ['lojas', 'favoritas'] },
                color: { type: 'string', example: '#FF5733' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Lista de favoritos criada com sucesso',
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
                          list: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              description: { type: 'string' },
                              isPublic: { type: 'boolean' },
                              tags: { type: 'array', items: { type: 'string' } },
                              color: { type: 'string' },
                              itemCount: { type: 'integer' },
                              createdAt: { type: 'string', format: 'date-time' },
                              updatedAt: { type: 'string', format: 'date-time' }
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
  '/api/favorites/stats': {
    get: {
      tags: ['Favoritos'],
      summary: 'Estatísticas de favoritos',
      description: 'Retorna estatísticas dos favoritos do usuário',
      security: [{ bearerAuth: [] }],
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
                              totalFavorites: { type: 'integer' },
                              totalLists: { type: 'integer' },
                              favoritesByType: {
                                type: 'object',
                                properties: {
                                  STORE: { type: 'integer' },
                                  PRODUCT: { type: 'integer' }
                                }
                              },
                              mostUsedTags: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    tag: { type: 'string' },
                                    count: { type: 'integer' }
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
  },
  '/api/favorites/recommendations': {
    get: {
      tags: ['Favoritos'],
      summary: 'Recomendações baseadas em favoritos',
      description: 'Retorna recomendações de lojas e produtos baseadas nos favoritos do usuário',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'Número de recomendações',
          schema: { type: 'integer', minimum: 1, maximum: 20, default: 5 }
        }
      ],
      responses: {
        '200': {
          description: 'Recomendações obtidas com sucesso',
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
                          recommendations: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                type: { type: 'string', enum: ['STORE', 'PRODUCT'] },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                score: { type: 'number' },
                                reason: { type: 'string' }
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
  },
  '/api/favorites/export': {
    get: {
      tags: ['Favoritos'],
      summary: 'Exportar favoritos',
      description: 'Exporta os favoritos do usuário em diferentes formatos',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'format',
          in: 'query',
          description: 'Formato de exportação',
          schema: { type: 'string', enum: ['json', 'csv'], default: 'json' }
        }
      ],
      responses: {
        '200': {
          description: 'Favoritos exportados com sucesso',
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
                          format: { type: 'string' },
                          data: {
                            type: 'object',
                            properties: {
                              lists: { type: 'array' },
                              favorites: { type: 'array' },
                              metadata: {
                                type: 'object',
                                properties: {
                                  exportDate: { type: 'string', format: 'date-time' },
                                  totalLists: { type: 'integer' },
                                  totalFavorites: { type: 'integer' }
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
