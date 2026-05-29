# RBAC System - Fluxograma Decisão e Testes

## Fluxograma de Decisão de Acesso

```
┌─────────────────────────────────────────┐
│     REQUISIÇÃO RECEBIDA                 │
│     GET/POST /endpoint                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Tem Token JWT?      │
        └────────┬────────────┘
                 │
         ┌───────┴────────┐
         │                │
        NÃO              SIM
         │                │
         ▼                ▼
    ┌─────────┐    ┌─────────────────┐
    │ Return  │    │ Token válido?   │
    │ 401     │    └────────┬────────┘
    └─────────┘         ┌───┴────┐
                        │        │
                       NÃO      SIM
                        │        │
                        ▼        ▼
                    ┌────────┐  ┌──────────────┐
                    │Return  │  │ User role    │
                    │ 401    │  │ = SUPER_ADMIN│
                    └────────┘  │   ?          │
                                └────┬─────────┘
                                 ┌───┴────┐
                                 │        │
                                NÃO      SIM
                                 │        │
                    ┌────────────┴┐       │
                    │ Role =      │       │
                    │ COMPANY?    │       │
                    └────┬───┬────┘       │
                    ┌────┴─┐ │           │
                   NÃO    SIM │           │
                    │        ▼            │
                    │     ┌────────────┐  │
           ┌────────┼─────┤Company    │  │
           │        │     │status =   │  │
           │        │     │approved?  │  │
           │        │     └─┬──────┬──┘  │
           │        │       │      │     │
           │        │      NÃO    SIM    │
           │        │       │      │     │
           │        │       ▼      ▼     │
           │        │    ┌────┐  ┌───┐  │
           │        └────┤403 │  │✓ │  │
           │             └────┘  │Execute│
           │                     │logic │
           │                     └───┘  │
           │                           │
           └───────────────────────────┘
```

## Árvore de Decisão - Por Endpoint

```
POST /auth/register/client
├─ Validar dados
├─ Email já existe? → 409 Conflict
├─ Criar user(role=CLIENT, status=active)
├─ Gerar token
└─ ✓ 201 Created

POST /auth/register/company
├─ Validar dados
├─ Email já existe? → 409 Conflict
├─ Criar user(role=COMPANY, status=pending_approval)
├─ Criar company(status=pending_approval)
├─ Criar approval_request
├─ Email para empresa
├─ Notificação para Super Admin
└─ ✓ 201 Created

POST /auth/login
├─ Validar email/senha
├─ User existe? → 401 Unauthorized
├─ Senha correta? → 401 Unauthorized
├─ User ativo? → 403 Forbidden
├─ Se COMPANY: buscar company status
├─ Gerar JWT token
├─ Atualizar last_login
└─ ✓ 200 OK

GET /company/dashboard
├─ Token válido? → ✓ middleware
├─ Role = COMPANY? → 403 Forbidden
├─ Company status = approved? → 403 "Nao aprovada"
├─ Buscar dados do dashboard
└─ ✓ 200 OK

GET /admin/approvals
├─ Token válido? → ✓ middleware
├─ Role = SUPER_ADMIN? → 403 Forbidden
├─ Buscar approval_requests(status=pending)
└─ ✓ 200 OK

POST /admin/approvals/{id}/approve
├─ Token válido? → ✓ middleware
├─ Role = SUPER_ADMIN? → 403 Forbidden
├─ Company existe? → 404 Not Found
├─ Status já approved? → 400 Bad Request
├─ Atualizar company(status=approved)
├─ Atualizar approval_request
├─ Email para empresa
├─ Notificação in-app
├─ Audit log
└─ ✓ 200 OK
```

## Teste End-to-End (E2E) - Cenário 1: Cliente

```javascript
// PASSO 1: Registrar como cliente
POST /auth/register/client
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123456",
  "full_name": "João Silva"
}

RESPONSE 201:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-1",
    "email": "joao@example.com",
    "role": "CLIENT",
    "status": "active"
  }
}

// PASSO 2: Fazer login (mesmo email/senha)
POST /auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123456"
}

RESPONSE 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-1",
    "email": "joao@example.com",
    "role": "CLIENT",
    "status": "active"
  }
}

// PASSO 3: Acessar dashboard de cliente
GET /client/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

RESPONSE 200:
{
  "dashboardData": {
    "cvs_uploaded": 0,
    "results": []
  }
}

// PASSO 4: Tentar acessar dashboard de empresa (deve falhar)
GET /company/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

RESPONSE 403:
{
  "error": "Acesso negado. Role insuficiente.",
  "required_role": ["COMPANY"],
  "current_role": "CLIENT"
}
```

## Teste E2E - Cenário 2: Empresa (Fluxo Completo)

```javascript
// PASSO 1: Empresa se registra
POST /auth/register/company
Content-Type: application/json

{
  "email": "carlos@techsolutions.com",
  "password": "senha123456",
  "full_name": "Carlos Empresa",
  "company_name": "Tech Solutions Ltd",
  "cnpj": "12.345.678/0001-90",
  "industry": "Software",
  "company_size": "50-100",
  "contact_email": "contato@techsolutions.com",
  "contact_phone": "+55 11 3000-0000"
}

RESPONSE 201:
{
  "company_id": "uuid-company-1",
  "user_id": "uuid-user-2",
  "company_name": "Tech Solutions Ltd",
  "status": "pending_approval",
  "next_step": "Aguarde aprovacao do Super Admin"
}

// Email enviado para: contato@techsolutions.com
// Notificação criada para: SUPER_ADMIN

// PASSO 2: Empresa faz login (status=pending_approval)
POST /auth/login
Content-Type: application/json

{
  "email": "carlos@techsolutions.com",
  "password": "senha123456"
}

RESPONSE 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-user-2",
    "email": "carlos@techsolutions.com",
    "role": "COMPANY",
    "status": "pending_approval"
  },
  "company_status": "pending_approval",
  "warning": "Empresa ainda nao foi aprovada. Acesso limitado."
}

// PASSO 3: Empresa tenta acessar /company/dashboard (deve falhar)
GET /company/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

RESPONSE 403:
{
  "error": "Empresa ainda nao foi aprovada",
  "company_status": "pending_approval",
  "message": "Aguarde a aprovacao do administrador"
}

// PASSO 4: Super Admin lista solicitações pendentes
GET /admin/approvals?status=pending
Authorization: Bearer <TOKEN_SUPER_ADMIN>

RESPONSE 200:
{
  "requests": [
    {
      "id": "uuid-req-1",
      "company_id": "uuid-company-1",
      "user_id": "uuid-user-2",
      "status": "pending",
      "requested_at": "2024-01-15T10:00:00Z",
      "companies": {
        "id": "uuid-company-1",
        "company_name": "Tech Solutions Ltd",
        "cnpj": "12.345.678/0001-90",
        "industry": "Software",
        "contact_email": "contato@techsolutions.com"
      },
      "users": {
        "id": "uuid-user-2",
        "email": "carlos@techsolutions.com",
        "full_name": "Carlos Empresa"
      }
    }
  ],
  "total": 1,
  "page": 1
}

// PASSO 5: Super Admin aprova empresa
POST /admin/approvals/uuid-company-1/approve
Authorization: Bearer <TOKEN_SUPER_ADMIN>
Content-Type: application/json

{
  "notes": "Empresa verificada com sucesso"
}

RESPONSE 200:
{
  "message": "Empresa aprovada com sucesso",
  "company_id": "uuid-company-1",
  "status": "approved",
  "notification_sent": true
}

// Email enviado para: contato@techsolutions.com
// Notificação in-app criada

// PASSO 6: Empresa faz login novamente (status=approved)
POST /auth/login
Content-Type: application/json

{
  "email": "carlos@techsolutions.com",
  "password": "senha123456"
}

RESPONSE 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-user-2",
    "email": "carlos@techsolutions.com",
    "role": "COMPANY",
    "status": "active"
  },
  "company_status": "approved"
}

// PASSO 7: Agora empresa consegue acessar /company/dashboard
GET /company/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

RESPONSE 200:
{
  "company": {
    "id": "uuid-company-1",
    "company_name": "Tech Solutions Ltd",
    "status": "approved"
  },
  "stats": {
    "cvs_processed": 0,
    "success_rate": "0%",
    "team_members": 1
  }
}

// PASSO 8: Super Admin pode suspender empresa se necessário
POST /admin/companies/uuid-company-1/suspend
Authorization: Bearer <TOKEN_SUPER_ADMIN>
Content-Type: application/json

{
  "reason": "Violacao dos termos de servico"
}

RESPONSE 200:
{
  "message": "Empresa suspensa com sucesso",
  "company_id": "uuid-company-1",
  "status": "suspended"
}

// Empresa perde acesso imediatamente
```

## Teste E2E - Cenário 3: Rejeição

```javascript
// Mesmos passos 1-4 de Cenário 2...

// PASSO 5: Super Admin REJEITA empresa
POST /admin/approvals/uuid-company-1/reject
Authorization: Bearer <TOKEN_SUPER_ADMIN>
Content-Type: application/json

{
  "rejection_reason": "CNPJ nao validado. Por favor, enviar comprovante."
}

RESPONSE 200:
{
  "message": "Empresa rejeitada",
  "company_id": "uuid-company-1",
  "status": "rejected"
}

// Email enviado para: contato@techsolutions.com com motivo

// PASSO 6: Empresa tenta fazer login
POST /auth/login
Content-Type: application/json

{
  "email": "carlos@techsolutions.com",
  "password": "senha123456"
}

RESPONSE 403:
{
  "error": "Empresa rejeitada. Nao pode fazer login."
}

// Empresa pode registrar novamente com EMAIL DIFERENTE
```

## Teste de Segurança - Tentativas de Bypass

```javascript
// TESTE 1: Cliente tentando acessar admin
GET /admin/approvals
Authorization: Bearer <TOKEN_CLIENT>

RESPONSE 403:
{
  "error": "Acesso negado. Role insuficiente.",
  "required_role": ["SUPER_ADMIN"],
  "current_role": "CLIENT"
}
// AUDIT LOG: unauthorized_access_attempt

// TESTE 2: Empresa não aprovada tentando usar recursos
GET /company/metrics
Authorization: Bearer <TOKEN_COMPANY_PENDING>

RESPONSE 403:
{
  "error": "Empresa ainda nao foi aprovada",
  "company_status": "pending_approval"
}
// AUDIT LOG: access_pending_company

// TESTE 3: Token expirado
GET /company/dashboard
Authorization: Bearer <EXPIRED_TOKEN>

RESPONSE 401:
{
  "error": "Token invalido ou expirado"
}

// TESTE 4: Token inválido/malformado
GET /company/dashboard
Authorization: Bearer invalid.token.here

RESPONSE 401:
{
  "error": "Token invalido ou expirado"
}

// TESTE 5: Sem token
GET /company/dashboard

RESPONSE 401:
{
  "error": "Token nao fornecido"
}

// TESTE 6: Email duplicado
POST /auth/register/client
{
  "email": "joao@example.com",
  "password": "senha123",
  "full_name": "João Outro"
}

RESPONSE 409:
{
  "error": "Email ja registrado"
}

// TESTE 7: Rate limiting em login (5 tentativas)
POST /auth/login × 6 (com senha errada)

RESPONSE 429 (na 6ª tentativa):
{
  "error": "Muitas tentativas. Tente novamente em 15 minutos."
}
```

## Checklist de Testes Manual

```
[ ] Cliente consegue registrar
[ ] Cliente consegue fazer login
[ ] Cliente consegue acessar /client/dashboard
[ ] Cliente NÃO consegue acessar /company/dashboard
[ ] Cliente NÃO consegue acessar /admin/*

[ ] Empresa consegue registrar
[ ] Super Admin recebe notificação
[ ] Email é enviado para empresa
[ ] Empresa consegue fazer login com status pending_approval
[ ] Empresa NÃO consegue acessar /company/dashboard (403)
[ ] Super Admin consegue listar aprovações pendentes

[ ] Super Admin aprova empresa
[ ] Email é enviado para empresa com aprovação
[ ] Notificação in-app é criada
[ ] Empresa consegue fazer login novamente
[ ] Empresa AGORA consegue acessar /company/dashboard
[ ] Empresa consegue ver /company/metrics, /company/profile

[ ] Super Admin rejeita empresa
[ ] Email é enviado com motivo
[ ] Empresa NÃO consegue fazer login
[ ] Empresa pode registrar novamente com outro email

[ ] Super Admin suspende empresa
[ ] Email é enviado
[ ] Empresa perde acesso imediatamente
[ ] Audit logs registram todas as ações

[ ] Token expira após 7 dias
[ ] Login falhado é bloqueado após 5 tentativas
[ ] Email único é validado
[ ] Password mínimo 6 caracteres
```

## Métricas de Sucesso

- 100% de rotas protegidas têm middleware de autenticação
- 100% de ações importantes têm audit log
- Tempo de aprovação < 5 segundos
- Emails entregues < 10 segundos
- Taxa de erro < 1%
- Uptime > 99.9%
