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
