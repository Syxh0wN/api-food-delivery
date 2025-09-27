# Guia de Contribuição

Obrigado por considerar contribuir com o MyFood API! Este documento fornece diretrizes e informações sobre como contribuir de forma eficaz.

## Como Contribuir

### 1. Fork e Clone
1. Faça um fork do repositório
2. Clone seu fork localmente:
```bash
git clone https://github.com/seu-usuario/api-myfood.git
cd api-myfood
```

### 2. Configuração do Ambiente
1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

3. Configure o banco de dados:
```bash
npm run db:generate
npm run db:push
```

### 3. Criando uma Branch
```bash
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b fix/correcao-bug
```

### 4. Desenvolvimento
- Siga os padrões de código estabelecidos
- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes alta
- Documente novos endpoints no Swagger

### 5. Testes
```bash
# Execute todos os testes
npm test

# Execute testes com cobertura
npm run test:coverage

# Execute linting
npm run lint
```

### 6. Commit
Use commits semânticos:
```bash
git commit -m "feat: adiciona nova funcionalidade de busca"
git commit -m "fix: corrige bug na validação de email"
git commit -m "docs: atualiza documentação da API"
```

### 7. Push e Pull Request
```bash
git push origin feature/nova-funcionalidade
```

Depois, abra um Pull Request no GitHub.

## Padrões de Código

### TypeScript
- Use TypeScript para tipagem estática
- Evite `any` - use tipos específicos
- Siga as configurações do `tsconfig.json`

### Estrutura de Arquivos
```
src/
├── controllers/     # Controladores HTTP
├── services/        # Lógica de negócio
├── routes/          # Definição de rotas
├── middleware/      # Middlewares
├── types/           # Definições TypeScript
├── config/          # Configurações
├── docs/            # Documentação Swagger
└── tests/           # Testes
```

### Nomenclatura
- **Arquivos**: camelCase (ex: `userService.ts`)
- **Classes**: PascalCase (ex: `UserService`)
- **Funções/Variáveis**: camelCase (ex: `getUserById`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_RETRY_ATTEMPTS`)

### Documentação
- Documente todos os endpoints no Swagger
- Use JSDoc para funções complexas
- Mantenha o README atualizado

## Testes

### Estrutura de Testes
```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('deve retornar usuário quando ID é válido', async () => {
      // Arrange
      const userId = 'valid-id';
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });
  });
});
```

### Cobertura de Testes
- Mantenha cobertura mínima de 80%
- Teste casos de sucesso e erro
- Use mocks para dependências externas

## Pull Requests

### Checklist
- [ ] Código segue os padrões estabelecidos
- [ ] Testes passam e cobertura é adequada
- [ ] Documentação foi atualizada
- [ ] Commits são semânticos
- [ ] Branch está atualizada com main

### Template de PR
```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
Passos para testar as mudanças.

## Screenshots (se aplicável)
Adicione screenshots se relevante.

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Testes passam
```

## Issues

### Reportando Bugs
Use o template de bug report:
```markdown
**Descrição do Bug**
Descrição clara do problema.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [ex: Windows 10]
- Node.js: [ex: 18.0.0]
- Versão: [ex: 1.0.0]
```

### Sugerindo Funcionalidades
```markdown
**Funcionalidade**
Descrição da funcionalidade desejada.

**Problema que Resolve**
Qual problema esta funcionalidade resolveria.

**Solução Proposta**
Como você imagina que deveria funcionar.

**Alternativas Consideradas**
Outras soluções que você considerou.
```

## Comunicação

### Canais
- **Issues**: Para bugs e sugestões
- **Discussions**: Para dúvidas e discussões
- **Pull Requests**: Para contribuições de código

### Código de Conduta
- Seja respeitoso e construtivo
- Foque no problema, não na pessoa
- Ajude outros contribuidores
- Mantenha discussões relevantes

## Reconhecimento

Todos os contribuidores serão reconhecidos no README do projeto. Obrigado por ajudar a tornar o MyFood API melhor!
