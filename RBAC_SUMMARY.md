# RBAC System - Resumo Executivo

## Visão Geral

Sistema de controle de acesso baseado em papéis (RBAC) para plataforma web com 3 níveis hierárquicos:

- **SUPER_ADMIN**: Administrador do sistema, aprova/rejeita empresas
- **COMPANY**: Empresa que passou por aprovação
- **CLIENT**: Cliente com acesso básico

## Problema Resolvido

Antes: Qualquer pessoa podia registrar como empresa e ter acesso imediato
Depois: Empresas são verificadas por Super Admin antes de terem acesso total

## Três Tabelas Principais

```
USERS
├── id (UUID)
├── email
├── role (CLIENT | COMPANY | SUPER_ADMIN)
├── status (active | inactive)
├── company_id (FK)
└── is_active

COMPANIES
├── id (UUID)
├── owner_id (FK to users)
├── company_name
├── cnpj
├── status (pending_approval | approved | rejected | suspended)
├── contact_email
└── metadata

APPROVAL_REQUESTS
├── id (UUID)
├── company_id (FK)
├── user_id (FK)
├── status (pending | approved | rejected | expired)
├── requested_at
└── reviewed_by (FK to Super Admin)
```

## Fluxo de Registro - Sequência

### Caso 1: Cliente
```
1. Usuário clica "Registrar como Cliente"
2. Preenche: email, senha, nome completo
3. POST /auth/register/client
4. Sistema cria User(role=CLIENT, status=active)
5. Retorna token JWT
6. Login automático bem-sucedido
```

### Caso 2: Empresa
```
1. Usuário clica "Registrar como Empresa"
2. Preenche: dados pessoais + dados empresa
3. POST /auth/register/company
4. Sistema cria:
   - User(role=COMPANY, status=pending_approval)
   - Company(status=pending_approval)
   - ApprovalRequest(status=pending)
5. Email para empresa: "Solicitacao recebida"
6. Notificação para Super Admin: "Nova empresa para revisar"
7. Usuário pode fazer login mas com acesso limitado (modo Cliente)
```

## Fluxo de Aprovação - Ações do Super Admin

```
Super Admin acessa: /admin/approvals

Vê tabela:
┌─────────────────────────────────────────────────────┐
│ Empresa          │ Contato      │ Status  │ Ações   │
├─────────────────────────────────────────────────────┤
│ Tech Solutions   │ carlos@tech   │ pending │ [Apro] │
│                  │              │         │ [Reje] │
└─────────────────────────────────────────────────────┘

Se clica APROVAR:
├─ Company.status = approved
├─ Company_members: adiciona owner como admin
├─ Email: "Empresa aprovada com sucesso"
├─ Notificação in-app
└─ Usuário agora tem acesso a /company/dashboard

Se clica REJEITAR:
├─ Company.status = rejected
├─ Email: "Sua solicitacao foi recusada. Motivo: ..."
├─ Notificação in-app
└─ Usuário pode tentar registrar novamente com outro email

Se clica SUSPENDER:
├─ Company.status = suspended
├─ Email: "Sua conta foi suspensa"
├─ Usuário perde acesso imediatamente
└─ Auditoria registra motivo
```

## Proteção de Rotas - Como Funciona

```
Exemplo: GET /company/dashboard

1. Cliente faz requisição com JWT token
2. Middleware: verifyToken
   ├─ Valida JWT
   └─ Extrai user_id, role, company_id
3. Middleware: checkRole(['COMPANY'])
   ├─ Valida se role = COMPANY
   └─ Se role = CLIENT, retorna erro 403
4. Middleware: checkCompanyStatus
   ├─ Busca Company no banco
   ├─ Se status != 'approved', retorna erro 403
   │  "Empresa ainda nao foi aprovada"
   └─ Se status = 'approved', passa
5. Controller: Executa lógica
6. Response: Dados do dashboard
```

## Estados Possíveis de Empresa

```
PENDING_APPROVAL
├─ Usuário pode fazer login? SIM
├─ Acesso a /company/dashboard? NÃO (erro 403)
├─ Acesso a /client/dashboard? SIM
├─ Pode fazer upload de CV? NÃO
└─ Próximo estado: approved ou rejected

APPROVED
├─ Usuário pode fazer login? SIM
├─ Acesso a /company/dashboard? SIM
├─ Acesso a recursos avançados? SIM
└─ Pode gerenciar equipe? SIM

REJECTED
├─ Usuário pode fazer login? NÃO (acesso negado)
├─ Pode tentar registrar novamente? SIM (novo email)
└─ Motivo armazenado em: Company.rejection_reason

SUSPENDED
├─ Usuário pode fazer login? NÃO
├─ Motivo armazenado
└─ Super Admin pode reativar? SIM (funcionalidade futura)
```

## Notificações Automáticas

```
Evento                      │ Para Quem              │ Tipo
────────────────────────────┼───────────────────────┼──────────────
Registro como cliente       │ Cliente               │ Email boas-vindas
Registro como empresa       │ Empresa + Super Admin │ Email + in-app
Empresa aprovada            │ Empresa               │ Email + in-app
Empresa rejeitada           │ Empresa               │ Email + in-app
Empresa suspensa            │ Empresa               │ Email + in-app
Membro adicionado à equipe  │ Novo membro           │ Email convite
```

## Segurança - Implementações

- Bcrypt para hash de senhas (10 rounds)
- JWT com expiração 7 dias
- Row-Level Security (RLS) no banco
- Audit logs de todas as ações
- Detecção de tentativas suspeitas
- CORS configurado
- Rate limiting recomendado
- IP address logging
- User agent logging

## API Endpoints - Visão Geral

```
PUBLIC ENDPOINTS:
POST   /auth/register/client
POST   /auth/register/company
POST   /auth/login
POST   /auth/validate-email

AUTHENTICATED (qualquer role):
POST   /auth/logout
GET    /auth/me
GET    /profile
PUT    /profile

SUPER_ADMIN ONLY:
GET    /admin/approvals
POST   /admin/approvals/{id}/approve
POST   /admin/approvals/{id}/reject
POST   /admin/companies/{id}/suspend
GET    /admin/users
GET    /admin/companies
GET    /admin/stats
GET    /admin/logs

COMPANY (approved) ONLY:
GET    /company/dashboard
GET    /company/profile
PUT    /company/profile
GET    /company/metrics
GET    /company/members
POST   /company/members
DELETE /company/members/{id}
POST   /company/logo

CLIENT ONLY:
GET    /client/dashboard
POST   /client/cv/upload
GET    /client/results
```

## Erros Mais Comuns

```
Erro 401: Unauthorized
├─ Token ausente
├─ Token inválido
├─ Token expirado
└─ Solução: Fazer login novamente

Erro 403: Forbidden - Role Insuficiente
├─ Cliente tentando acessar /company/dashboard
├─ COMPANY tentando acessar /admin/approvals
└─ Solução: Acessar rota permitida para seu role

Erro 403: Empresa Não Aprovada
├─ COMPANY com status != 'approved' tentando /company/dashboard
├─ Middleware: checkCompanyStatus bloqueou
└─ Solução: Aguardar aprovação do Super Admin

Erro 404: Empresa Não Encontrada
├─ Super Admin tenta aprovar company_id inexistente
└─ Solução: Validar company_id

Erro 409: Email Já Registrado
├─ Novo registro com email já existente
└─ Solução: Usar email diferente ou fazer login
```

## Banco de Dados - Estrutura Simplificada

```
users (n) ──── (1) companies
├─ id
├─ email
├─ role (ENUM)
├─ status (ENUM)
└─ company_id

companies
├─ id
├─ owner_id (FK to users)
├─ company_name
├─ status (ENUM: pending_approval, approved, rejected, suspended)
└─ approved_by (FK to super_admin)

approval_requests (1:1 com companies quando pending)
├─ id
├─ company_id
├─ user_id
├─ status
└─ reviewed_by

notifications
├─ id
├─ user_id
├─ type (ENUM)
└─ is_read

audit_logs
├─ id
├─ user_id
├─ action
└─ entity_type
```

## Deployment Checklist

- [ ] Executar SQL schema em Supabase
- [ ] Criar usuário SUPER_ADMIN manualmente
- [ ] Configurar variáveis .env
- [ ] Instalar dependências Node.js
- [ ] Testar endpoints com cURL
- [ ] Integrar autenticação no frontend
- [ ] Implementar telas de registro duplo
- [ ] Testar fluxo completo de aprovação
- [ ] Configurar SMTP para emails
- [ ] Implementar protected routes no frontend
- [ ] Adicionar rate limiting
- [ ] Ativar HTTPS
- [ ] Configurar backups automaticamente
- [ ] Testar recuperação de falhas
- [ ] Documentar processo para ops

## Métricas Importantes

- Tempo médio de aprovação de empresa
- Taxa de rejeição vs aprovação
- Tentativas de acesso não autorizado
- Uso de recursos por company
- Engajamento de usuários por role
- Notificações enviadas/lidas

## Melhorias Futuras

1. 2FA (Two-Factor Authentication)
2. Recuperação de senha
3. OAuth social login
4. SSO empresarial
5. Webhooks para eventos
6. API tokens para integração
7. Roles customizados por empresa
8. Permissões granulares
9. Analytics de segurança
10. Backup automático e disaster recovery
