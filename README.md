# MyFood API - Sistema de Delivery

Uma API completa para sistema de delivery de comida, desenvolvida com Node.js, TypeScript e PostgreSQL. Esta aplicação oferece uma solução robusta para gerenciamento de pedidos, lojas, produtos, carrinho de compras e muito mais.

## Características Principais

### Autenticação e Usuários
- Sistema de registro e login com JWT
- Diferentes tipos de usuários (Cliente, Dono de Loja, Administrador)
- Gerenciamento de perfis e permissões
- Renovação automática de tokens

### Gestão de Lojas
- Cadastro e gerenciamento de lojas
- Controle de status (ativa/inativa)
- Informações completas (endereço, telefone, email)
- Sistema de proprietários

### Catálogo de Produtos
- Cadastro de produtos por loja
- Categorização e busca
- Controle de disponibilidade
- Gestão de preços

### Carrinho de Compras
- Adição e remoção de produtos
- Cálculo automático de totais
- Persistência entre sessões
- Resumo detalhado

### Sistema de Pedidos
- Criação de pedidos a partir do carrinho
- Múltiplos métodos de pagamento
- Rastreamento de status em tempo real
- Histórico completo de pedidos

### Cupons e Descontos
- Sistema de cupons personalizáveis
- Descontos percentuais e fixos
- Validação automática
- Histórico de uso

### Avaliações e Reviews
- Sistema de avaliação por estrelas
- Comentários de clientes
- Estatísticas por loja
- Moderação de conteúdo

### Sistema de Favoritos
- Favoritar lojas e produtos
- Listas personalizadas
- Categorização com tags
- Exportação de dados

### Rastreamento de Entrega
- Status detalhados de entrega
- Códigos de rastreamento
- Estimativas de tempo
- Geolocalização

### Relatórios e Analytics
- Relatórios de vendas
- Estatísticas de pedidos
- Análise de performance
- Exportação em múltiplos formatos

### Chat em Tempo Real
- Comunicação entre clientes e lojas
- Notificações instantâneas
- Histórico de conversas
- Suporte a múltiplos usuários

### Cache e Performance
- Cache Redis para otimização
- Compressão de respostas
- Rate limiting
- Monitoramento de performance

## Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Socket.IO** - Comunicação em tempo real

### Autenticação e Segurança
- **JWT** - Tokens de autenticação
- **bcrypt** - Hash de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Controle de origem
- **Rate Limiting** - Proteção contra spam

### Validação e Documentação
- **Zod** - Validação de schemas
- **Swagger/OpenAPI** - Documentação da API
- **Jest** - Testes unitários
- **Supertest** - Testes de integração

### Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Nodemon** - Desenvolvimento automático
- **TypeScript** - Compilação

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middleware/      # Middlewares personalizados
├── types/           # Definições TypeScript
├── config/          # Configurações
├── docs/            # Documentação Swagger
└── tests/           # Testes automatizados
```

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL (versão 13 ou superior)
- Redis (opcional, para cache)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/api-myfood.git
cd api-myfood
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/myfood"

# JWT
JWT_SECRET="seu-jwt-secret-aqui"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# Servidor
PORT=3010
NODE_ENV=development
```

4. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev

# (Opcional) Popular com dados de exemplo
npx prisma db seed
```

5. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## Uso da API

### Documentação Interativa
Acesse a documentação completa da API em:
```
http://localhost:3010/api/docs
```

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil
- `POST /api/auth/refresh` - Renovar token

#### Lojas
- `GET /api/stores` - Listar lojas
- `POST /api/stores` - Criar loja
- `GET /api/stores/:id` - Obter loja
- `PUT /api/stores/:id` - Atualizar loja
- `DELETE /api/stores/:id` - Excluir loja

#### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Obter produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto

#### Carrinho
- `GET /api/cart` - Obter carrinho
- `POST /api/cart/items` - Adicionar item
- `PUT /api/cart/items/:id` - Atualizar item
- `DELETE /api/cart/items/:id` - Remover item

#### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders/:id` - Obter pedido
- `PATCH /api/orders/:id/cancel` - Cancelar pedido
- `GET /api/stores/:storeId/orders` - Listar pedidos da loja
- `PATCH /api/stores/:storeId/orders/:id/status` - Atualizar status do pedido
- `GET /api/stores/:storeId/orders/summary` - Resumo dos pedidos da loja

#### Cupons
- `GET /api/coupons/active` - Listar cupons ativos
- `GET /api/coupons/code/:code` - Obter cupom por código
- `POST /api/coupons/validate` - Validar cupom
- `GET /api/coupons` - Listar todos os cupons
- `POST /api/coupons` - Criar cupom
- `GET /api/coupons/:id` - Obter cupom por ID
- `PUT /api/coupons/:id` - Atualizar cupom
- `DELETE /api/coupons/:id` - Excluir cupom
- `GET /api/coupons/:id/usage` - Histórico de uso do cupom
- `GET /api/stores/:storeId/coupons` - Listar cupons da loja
- `POST /api/stores/:storeId/coupons` - Criar cupom para loja

#### Avaliações
- `GET /api/reviews` - Listar avaliações
- `POST /api/reviews` - Criar avaliação
- `GET /api/reviews/:id` - Obter avaliação por ID
- `PUT /api/reviews/:id` - Atualizar avaliação
- `DELETE /api/reviews/:id` - Excluir avaliação
- `GET /api/stores/:storeId/reviews` - Listar avaliações da loja
- `GET /api/stores/:storeId/reviews/summary` - Resumo das avaliações

#### Favoritos
- `GET /api/favorites` - Listar favoritos
- `POST /api/favorites` - Adicionar favorito
- `GET /api/favorites/:id` - Obter favorito por ID
- `PUT /api/favorites/:id` - Atualizar favorito
- `DELETE /api/favorites/:id` - Remover favorito
- `POST /api/favorites/toggle/:type/:itemId` - Alternar favorito
- `GET /api/favorites/status/:type/:itemId` - Verificar status de favorito
- `GET /api/favorites/lists` - Listar listas de favoritos
- `POST /api/favorites/lists` - Criar lista de favoritos
- `GET /api/favorites/lists/:id` - Obter lista por ID
- `PUT /api/favorites/lists/:id` - Atualizar lista
- `DELETE /api/favorites/lists/:id` - Excluir lista
- `GET /api/favorites/stats` - Estatísticas de favoritos
- `GET /api/favorites/recommendations` - Recomendações
- `GET /api/favorites/export` - Exportar favoritos

#### Entrega
- `POST /api/delivery/tracking` - Criar rastreamento
- `GET /api/delivery/tracking/:orderId` - Obter rastreamento por pedido
- `PATCH /api/delivery/tracking/:orderId` - Atualizar status de entrega
- `GET /api/delivery/tracking/code/:trackingCode` - Obter rastreamento por código
- `POST /api/delivery/estimate` - Calcular estimativa de entrega
- `GET /api/delivery/stats` - Estatísticas de entrega

#### Usuários
- `GET /api/users/profile` - Obter perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `GET /api/users/addresses` - Listar endereços
- `POST /api/users/addresses` - Adicionar endereço
- `PUT /api/users/addresses/:id` - Atualizar endereço
- `DELETE /api/users/addresses/:id` - Excluir endereço

#### Chat
- `GET /api/chat/conversations` - Listar conversas
- `POST /api/chat/conversations` - Criar conversa
- `GET /api/chat/conversations/:id` - Obter conversa
- `GET /api/chat/conversations/:id/messages` - Listar mensagens
- `POST /api/chat/conversations/:id/messages` - Enviar mensagem

#### Notificações
- `GET /api/notifications` - Listar notificações
- `PUT /api/notifications/:id/read` - Marcar como lida
- `PUT /api/notifications/read-all` - Marcar todas como lidas

#### Relatórios
- `GET /api/reports/sales` - Relatório de vendas
- `GET /api/reports/orders` - Relatório de pedidos
- `GET /api/reports/users` - Relatório de usuários
- `GET /api/reports/stores` - Relatório de lojas
- `GET /api/reports/products` - Relatório de produtos
- `GET /api/reports/dashboard` - Dashboard de relatórios

#### Histórico
- `GET /api/history` - Listar histórico
- `GET /api/history/:id` - Obter item do histórico
- `GET /api/history/export` - Exportar histórico

#### Upload
- `POST /api/uploads/image` - Upload de imagem
- `DELETE /api/uploads/:id` - Excluir arquivo

#### Pagamentos
- `POST /api/payment-intent` - Criar intenção de pagamento
- `POST /api/confirm/:paymentIntentId` - Confirmar pagamento
- `GET /api/status/:paymentIntentId` - Status do pagamento
- `POST /api/refund` - Criar reembolso
- `POST /api/webhook` - Webhook de pagamento

### Autenticação
A API utiliza JWT para autenticação. Inclua o token no header:
```
Authorization: Bearer seu-token-aqui
```

## Testes

### Executar Testes
```bash
# Todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Estrutura de Testes
- Testes unitários para services
- Testes de integração para rotas
- Testes de validação de schemas
- Testes de autenticação

## Deploy

### Variáveis de Ambiente de Produção
```env
NODE_ENV=production
DATABASE_URL="sua-url-de-producao"
JWT_SECRET="seu-jwt-secret-forte"
REDIS_URL="sua-url-redis-producao"
```

### Comandos de Deploy
```bash
# Build para produção
npm run build

# Iniciar em produção
npm start
```

## Contribuição

### Como Contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código
- Use TypeScript para tipagem
- Siga as convenções do ESLint
- Escreva testes para novas funcionalidades
- Documente endpoints no Swagger
- Use commits semânticos

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Compila TypeScript para JavaScript
npm start           # Inicia servidor em modo produção

# Testes
npm test            # Executa todos os testes
npm run test:watch  # Executa testes em modo watch
npm run test:coverage # Executa testes com relatório de cobertura
npm run test:ci     # Executa testes para CI/CD

# Qualidade de Código
npm run lint        # Verifica problemas de linting
npm run lint:fix    # Corrige problemas de linting automaticamente
npm run format      # Formata código com Prettier

# Banco de Dados
npm run db:generate # Gera cliente Prisma
npm run db:push     # Sincroniza schema com banco
npm run db:migrate  # Executa migrações
npm run db:studio   # Abre Prisma Studio
npm run db:seed     # Popula banco com dados de exemplo
```

## Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente (veja `env.example`):

### Obrigatórias
- `DATABASE_URL` - URL de conexão com PostgreSQL
- `JWT_SECRET` - Chave secreta para JWT
- `PORT` - Porta do servidor (padrão: 3010)

### Opcionais
- `REDIS_URL` - URL do Redis para cache
- `AWS_*` - Configurações AWS S3 para upload de imagens
- `SMTP_*` - Configurações de email
- `FIREBASE_*` - Configurações Firebase para notificações
- `STRIPE_*` - Configurações Stripe para pagamentos

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação da API
- Verifique os logs do servidor

## Roadmap

### Próximas Funcionalidades
- Sistema de notificações push
- Integração com gateways de pagamento
- App mobile nativo
- Sistema de fidelidade
- Analytics avançados
- Multi-tenancy

### Melhorias Técnicas
- Microserviços
- Containerização com Docker
- CI/CD automatizado
- Monitoramento avançado
- Otimizações de performance

---

Desenvolvido com dedicação para proporcionar a melhor experiência em delivery de comida.
