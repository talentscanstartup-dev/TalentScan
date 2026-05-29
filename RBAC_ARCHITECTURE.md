# Arquitetura RBAC - Sistema de Controle de Acesso Hierárquico

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
├─────────────────────────────────────────────────────────┤
│  Auth Flows  │  Client Panel  │  Company Panel  │  Admin │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                  AUTH MIDDLEWARE                        │
│  verifyToken → attachUser → validateRole → checkStatus  │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│               API ROUTES (Protected)                    │
│  /auth       │  /profile  │  /company  │  /admin        │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                       │
│  Services   │  Controllers  │  Validators              │
└──────────────┬────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│          DATABASE (PostgreSQL/Supabase)                 │
│  users  │  companies  │  roles  │  permissions  │  logs  │
└─────────────────────────────────────────────────────────┘
```

## 2. Níveis de Acesso

| Nível | Descrição | Permissões Iniciais | Permissões Finais |
|-------|-----------|-------------------|-------------------|
| SUPER_ADMIN | CEO/Proprietário | Aprovar/rejeitar empresas, visualizar todos os painéis | Controle total do sistema |
| COMPANY | Empresa (após aprovação) | Painel limitado (cliente) | Dashboard empresarial, gestão de usuários, relatórios |
| CLIENT | Cliente | Painel básico | Upload de CVs, visualização de resultados |

## 3. Fluxo de Registro e Aprovação

```
┌─────────────────────────────────────────────────────────┐
│               USUÁRIO CLICA EM REGISTRAR               │
└─────────────┬───────────────────────────────┬───────────┘
              │                               │
              ▼                               ▼
        ┌──────────────┐            ┌──────────────────┐
        │   CLIENTE    │            │     EMPRESA      │
        └──────┬───────┘            └────────┬─────────┘
               │                             │
               │                 role = COMPANY
               │                 status = pending_approval
               │                 company_name required
               │
        role = CLIENT                       │
        status = active          ┌──────────▼──────────┐
        (ativo imediatamente)    │ ALERTA SUPER ADMIN  │
                                 └──────────┬──────────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        │                   │                   │
                      APROVA             REJEITA            SUSPENDE
                        │                   │                   │
                        ▼                   ▼                   ▼
                    APPROVED           REJECTED           SUSPENDED
                    status = active    status = rejected   status = suspended
                    acesso total       sem acesso          sem acesso
                    notificação        notificação         notificação
```

## 4. Estados de Empresa

- **pending_approval**: Aguardando aprovação do Super Admin
- **approved**: Empresa aprovada, com acesso total
- **rejected**: Solicitação rejeitada, sem acesso
- **suspended**: Empresa suspensa, sem acesso

## 5. Fluxo de Requisições Autenticadas

```
Cliente HTTP
    │
    ▼
Middleware: verifyToken
    ├─ Valida JWT
    ├─ Extrai user_id e role
    ├─ Retorna erro 401 se inválido
    │
    ▼
Middleware: checkRole([SUPER_ADMIN, COMPANY])
    ├─ Valida se role está autorizado
    ├─ Retorna erro 403 se não autorizado
    │
    ▼
Middleware: checkCompanyStatus (apenas para COMPANY)
    ├─ Valida se status = approved
    ├─ Retorna erro 403 se pending_approval
    │
    ▼
Controller
    ├─ Executa lógica
    │
    ▼
Response com dados apropriados
```

## 6. Estrutura de Pastas

```
backend/
├── config/
│   ├── supabase.js
│   ├── jwt.js
│   └── env.js
├── middleware/
│   ├── auth.js (verifyToken)
│   ├── authorization.js (checkRole, checkCompanyStatus)
│   └── errorHandler.js
├── routes/
│   ├── auth.js (register, login, logout)
│   ├── profile.js (get/update user profile)
│   ├── company.js (company dashboard, profile, metrics)
│   ├── admin.js (approvals, user management, system logs)
│   └── index.js (router aggregator)
├── controllers/
│   ├── authController.js
│   ├── profileController.js
│   ├── companyController.js
│   └── adminController.js
├── services/
│   ├── userService.js
│   ├── companyService.js
│   ├── notificationService.js
│   ├── approvalService.js
│   └── auditService.js
├── models/
│   ├── User.js
│   ├── Company.js
│   ├── ApprovalRequest.js
│   └── Notification.js
├── validators/
│   ├── authValidator.js
│   ├── companyValidator.js
│   └── index.js
└── server.js
```
