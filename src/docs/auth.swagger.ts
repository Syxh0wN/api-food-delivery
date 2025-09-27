export const authSwaggerPaths = {
  '/api/auth/register': {
    post: {
      tags: ['Autenticação'],
      summary: 'Registrar novo usuário',
      description: 'Cria uma nova conta de usuário no sistema',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'usuario@example.com' },
                password: { type: 'string', minLength: 6, example: 'senha123' },
                name: { type: 'string', example: 'João Silva' },
                role: { type: 'string', enum: ['CLIENT', 'STORE_OWNER'], default: 'CLIENT' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Usuário registrado com sucesso',
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
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
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
        '409': {
          description: 'Email já cadastrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags: ['Autenticação'],
      summary: 'Fazer login',
      description: 'Autentica um usuário e retorna um token JWT',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'usuario@example.com' },
                password: { type: 'string', example: 'senha123' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login realizado com sucesso',
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
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
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
          description: 'Credenciais inválidas',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  '/api/auth/profile': {
    get: {
      tags: ['Autenticação'],
      summary: 'Obter perfil do usuário',
      description: 'Retorna os dados do usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Perfil obtido com sucesso',
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
                          user: { $ref: '#/components/schemas/User' }
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
  '/api/auth/refresh': {
    post: {
      tags: ['Autenticação'],
      summary: 'Renovar token',
      description: 'Gera um novo token JWT para o usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Token renovado com sucesso',
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
                          token: { type: 'string' }
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
