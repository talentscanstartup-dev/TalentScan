# Talent Scan RBAC Backend

Sistema de controle de acesso baseado em papéis (RBAC) para gerenciamento de empresas, usuários e aprovações.

## Arquitetura

```
Frontend (React)
    ↓
API REST (Express/Node.js)
    ↓
PostgreSQL (Supabase)
```

## Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (https://supabase.com)
- Gmail ou outro serviço SMTP para emails

## Instalação

### 1. Clonar e instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar Supabase

```bash
# Acessar https://supabase.com e criar novo projeto
# Copiar credenciais para .env

# No Supabase Console:
# 1. Ir para SQL Editor
# 2. Criar novo query
# 3. Copiar conteúdo de ../RBAC_DATABASE_SCHEMA.sql
# 4. Executar query
# 5. Verificar se todas as tabelas foram criadas
```

### 3. Configurar variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais
# Necessário:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET
# - EMAIL_USER
# - EMAIL_PASSWORD
```

### 4. Criar usuário Super Admin (manual)

```bash
# No Supabase Console (em SQL Editor):

INSERT INTO users (
  id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  'Super Administrator',
  'SUPER_ADMIN',
  'active',
  true
);
```

### 5. Iniciar servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

Servidor estará em: `http://localhost:5000`

## Estrutura de Pastas

```
backend/
├── middleware/
│   ├── auth.js              # Autenticação e autorização
│   └── errorHandler.js      # Tratamento de erros
├── routes/
│   ├── auth.js              # Autenticação
│   ├── admin.js             # Administrativo
│   ├── company.js           # Empresa
│   ├── profile.js           # Perfil
│   └── index.js             # Agregador
├── controllers/
│   ├── authController.js    # Lógica de autenticação
│   ├── adminController.js   # Lógica administrativa
│   ├── companyController.js # Lógica de empresa
│   └── profileController.js # Lógica de perfil
├── services/
│   ├── notificationService.js  # Emails e notificações
│   ├── auditService.js         # Logs de auditoria
│   ├── companyService.js       # Regras de negócio
│   └── approvalService.js      # Aprovações
├── validators/
│   ├── authValidator.js     # Validação de dados
│   ├── companyValidator.js
│   └── adminValidator.js
├── config/
│   ├── supabase.js          # Cliente Supabase
│   └── jwt.js               # Configuração JWT
├── utils/
│   ├── errorResponse.js     # Tratamento de respostas
│   └── constants.js         # Constantes
├── .env.example             # Variáveis de exemplo
├── package.json             # Dependências
└── server.js                # Arquivo principal
```

## Endpoints Principais

### Autenticação

```bash
# Registrar como Cliente
POST /auth/register/client
Body: { email, password, full_name }

# Registrar como Empresa
POST /auth/register/company
Body: { email, password, full_name, company_name, cnpj, industry, company_size, contact_email }

# Login
POST /auth/login
Body: { email, password }

# Logout
POST /auth/logout
Headers: { Authorization: Bearer TOKEN }

# Validar email
POST /auth/validate-email
Body: { email }
```

### Super Admin

```bash
# Listar solicitações pendentes
GET /admin/approvals?status=pending
Headers: { Authorization: Bearer TOKEN }

# Aprovar empresa
POST /admin/approvals/{company_id}/approve
Headers: { Authorization: Bearer TOKEN }

# Rejeitar empresa
POST /admin/approvals/{company_id}/reject
Headers: { Authorization: Bearer TOKEN }
Body: { rejection_reason }

# Suspender empresa
POST /admin/companies/{company_id}/suspend
Headers: { Authorization: Bearer TOKEN }
Body: { reason }

# Listar usuários
GET /admin/users
Headers: { Authorization: Bearer TOKEN }

# Listar empresas
GET /admin/companies
Headers: { Authorization: Bearer TOKEN }

# Estatísticas do sistema
GET /admin/stats
Headers: { Authorization: Bearer TOKEN }

# Logs de auditoria
GET /admin/logs
Headers: { Authorization: Bearer TOKEN }
```

### Empresa

```bash
# Dashboard
GET /company/dashboard
Headers: { Authorization: Bearer TOKEN }

# Status de aprovação
GET /company/status
Headers: { Authorization: Bearer TOKEN }

# Perfil da empresa
GET /company/profile
PUT /company/profile
Headers: { Authorization: Bearer TOKEN }

# Métricas
GET /company/metrics
Headers: { Authorization: Bearer TOKEN }

# Membros da equipe
GET /company/members
POST /company/members
DELETE /company/members/{member_id}
Headers: { Authorization: Bearer TOKEN }
```

## Teste Rápido com cURL

```bash
# 1. Registrar cliente
curl -X POST http://localhost:5000/auth/register/client \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456",
    "full_name": "João Teste"
  }'

# 2. Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456"
  }'

# 3. Obter dados do usuário (usar token do passo anterior)
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Variáveis de Ambiente

Veja `.env.example` para referência completa.

Essenciais:
- `VITE_SUPABASE_URL`: URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima Supabase
- `JWT_SECRET`: Chave secreta para JWT (mínimo 32 caracteres)
- `EMAIL_USER`: Email para enviar notificações
- `EMAIL_PASSWORD`: Senha de app do email

## Testes

```bash
# Executar todos os testes
npm test

# Testes E2E
npm run test:e2e

# Lint
npm run lint

# Formatar código
npm run format
```

## Fluxo de Aprovação

### Cliente
1. Registra com `POST /auth/register/client`
2. Status: `active` imediatamente
3. Acesso a: `/client/dashboard`

### Empresa (até aprovação)
1. Registra com `POST /auth/register/company`
2. Status: `pending_approval`
3. Super Admin recebe notificação
4. Empresa recebe email
5. Acesso limitado a recursos de cliente

### Empresa (após aprovação)
1. Super Admin clica "Aprovar" em `/admin/approvals`
2. Status muda para: `approved`
3. Empresa recebe email
4. Notificação in-app criada
5. Acesso total a `/company/dashboard`

### Empresa (rejeitada)
1. Super Admin clica "Rejeitar"
2. Status muda para: `rejected`
3. Empresa não consegue fazer login
4. Pode registrar novamente com outro email

## Segurança

- Senhas com hash bcrypt (10 rounds)
- JWT com expiração 7 dias
- Rate limiting: 100 req/15min (geral), 5 login/15min
- Audit logs de todas as ações
- RLS policies no banco de dados
- CORS configurado
- Helmet para headers de segurança
- IP logging
- User agent logging

## Monitoramento

Todos os logs incluem:
- Timestamp
- User ID
- Action
- Entity type
- IP address
- User agent
- Status (success/failed)

Acessar em `/admin/logs`

## Troubleshooting

### Erro: "VITE_SUPABASE_URL not found"
- Verificar se .env existe
- Verificar se variáveis estão preenchidas
- Reiniciar servidor (npm run dev)

### Erro: "Token invalid"
- Token pode estar expirado (7 dias)
- Fazer login novamente
- Verificar se JWT_SECRET é consistente

### Erro: "Company not found"
- Empresa foi rejeitada ou suspensa
- Tentar registrar novamente

### Email não é enviado
- Verificar credenciais SMTP
- Verificar se email está correto
- Para Gmail: usar app-specific password (não senha normal)

## Desenvolvimento

### Adicionar novo endpoint

1. Criar função no controller apropriado
2. Adicionar rota em `routes/`
3. Adicionar middleware de autenticação se necessário
4. Testar com cURL
5. Documentar em README

### Adicionar novo banco de dados

1. Criar migração em Supabase
2. Atualizar schema.sql
3. Implementar no código
4. Adicionar RLS policies

## Deploy

### Heroku
```bash
# Adicionar buildpack
heroku buildpacks:add heroku/nodejs

# Deploy
git push heroku main
```

### Railway
```bash
# Conectar repo GitHub
# Deploy automático ao fazer push
```

### Docker
```bash
# Criar Dockerfile
docker build -t talent-scan .
docker run -p 5000:5000 talent-scan
```

## Contribuindo

1. Fork o projeto
2. Criar branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Licença

MIT

## Suporte

- Email: support@talentscan.com
- Issues: https://github.com/talentscan/backend/issues
- Documentação: `/docs`

## Roadmap

- [ ] Two-Factor Authentication (2FA)
- [ ] Social login (Google, GitHub)
- [ ] API tokens para integração
- [ ] Webhooks
- [ ] Analytics dashboard
- [ ] Custom roles e permissions
- [ ] SSO empresarial
- [ ] Database backup automático
- [ ] Rate limiting por usuário
- [ ] IP whitelist

---

**Última atualização:** Janeiro 2024
**Versão:** 1.0.0
**Status:** Em produção
