# RBAC System - Guia de Implementação

## 1. Estrutura de Pasta Backend (Node.js/Express)

```
backend/
├── config/
│   ├── supabase.js          # Inicialização do Supabase
│   ├── jwt.js               # Configuração JWT
│   └── env.js               # Variáveis de ambiente
├── middleware/
│   ├── auth.js              # verifyToken, checkRole, checkCompanyStatus
│   └── errorHandler.js      # Tratamento de erros
├── routes/
│   ├── auth.js              # POST /register/client, /register/company, /login
│   ├── admin.js             # GET/POST /admin/* (SUPER_ADMIN only)
│   ├── company.js           # GET/PUT /company/* (COMPANY only)
│   ├── profile.js           # GET/PUT /profile (todos autenticados)
│   └── index.js             # Agregador de rotas
├── controllers/
│   ├── authController.js    # registerAsClient, registerAsCompany, login
│   ├── adminController.js   # approveCompany, rejectCompany, getApprovals
│   ├── companyController.js # getCompanyDashboard, updateProfile
│   └── profileController.js # getUserProfile, updateUserProfile
├── services/
│   ├── notificationService.js  # sendEmailNotification, createInAppNotification
│   ├── auditService.js         # createAuditLog, detectSuspiciousActivity
│   ├── companyService.js       # Business logic de empresa
│   └── approvalService.js      # Business logic de aprovação
├── validators/
│   ├── authValidator.js     # Validação de registro/login
│   ├── companyValidator.js  # Validação de dados de empresa
│   └── index.js             # Agregador
├── utils/
│   ├── jwtUtils.js          # generateToken, verifyToken
│   └── errorUtils.js        # Tratamento de erros customizado
├── .env.example             # Template de variáveis
└── server.js                # Arquivo principal
```

## 2. Variáveis de Ambiente (.env)

```
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# JWT
JWT_SECRET=sua-chave-super-secreta-aqui
JWT_EXPIRY=7d

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app-google

# URLs
FRONTEND_URL=http://localhost:3000
ADMIN_DASHBOARD_URL=http://localhost:3000/admin
BACKEND_URL=http://localhost:5000

# Port
PORT=5000
NODE_ENV=development
```

## 3. Arquivo Principal (server.js)

```javascript
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import companyRoutes from './routes/company.js'
import profileRoutes from './routes/profile.js'
import { requestLogger, errorHandler } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares globais
app.use(cors())
app.use(express.json())
app.use(requestLogger)

// Rotas
app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/company', companyRoutes)
app.use('/profile', profileRoutes)

// Error handler (último middleware)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
```

## 4. Fluxo de Aprovação Passo a Passo

### Para Cliente:
1. Usuário clica em "Registrar como Cliente"
2. Preenche: email, senha, nome completo
3. POST /auth/register/client
4. Sistema cria user com role=CLIENT, status=active
5. Retorna token JWT
6. Usuário faz login automaticamente

### Para Empresa:
1. Usuário clica em "Registrar como Empresa"
2. Preenche: email, senha, nome completo, nome da empresa, CNPJ, etc
3. POST /auth/register/company
4. Sistema cria:
   - User com role=COMPANY, status=pending_approval
   - Company com status=pending_approval
   - ApprovalRequest com status=pending
5. Envia email para Super Admin: "Nova solicitacao de empresa"
6. Usuário recebe email: "Aguardando aprovacao"
7. Super Admin acessa /admin/approvals
8. Super Admin clica "Aprovar" ou "Rejeitar"
9. Se Aprovar:
   - Company.status = approved
   - Company_members adiciona owner como admin
   - Envia email: "Empresa aprovada"
   - Cria notificação in-app
10. Se Rejeitar:
    - Company.status = rejected
    - Envia email com motivo
    - Empresa não consegue fazer login após rejeição

## 5. Testes com cURL

### Teste 1: Registrar como Cliente
```bash
curl -X POST http://localhost:5000/auth/register/client \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123",
    "full_name": "João Cliente"
  }'
```

### Teste 2: Registrar como Empresa
```bash
curl -X POST http://localhost:5000/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "email": "empresa@example.com",
    "password": "senha123",
    "full_name": "Carlos Empresa",
    "company_name": "Tech Solutions Ltd",
    "cnpj": "12.345.678/0001-90",
    "industry": "Software",
    "company_size": "50-100",
    "contact_email": "contato@techsolutions.com",
    "contact_phone": "+55 11 3000-0000"
  }'
```

### Teste 3: Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123"
  }'

# Resposta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": {
#     "id": "uuid-123",
#     "email": "cliente@example.com",
#     "role": "CLIENT",
#     "status": "active"
#   }
# }
```

### Teste 4: Obter Solicitações Pendentes (SUPER_ADMIN)
```bash
curl -X GET http://localhost:5000/admin/approvals?status=pending \
  -H "Authorization: Bearer <TOKEN_SUPER_ADMIN>"
```

### Teste 5: Aprovar Empresa (SUPER_ADMIN)
```bash
curl -X POST http://localhost:5000/admin/approvals/COMPANY_ID/approve \
  -H "Authorization: Bearer <TOKEN_SUPER_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Empresa verificada"
  }'
```

### Teste 6: Acessar Dashboard de Empresa
```bash
curl -X GET http://localhost:5000/company/dashboard \
  -H "Authorization: Bearer <TOKEN_COMPANY>"

# Se status != approved, retorna 403:
# {
#   "error": "Empresa ainda nao foi aprovada",
#   "company_status": "pending_approval"
# }
```

## 6. Proteção de Rotas - Exemplo de Uso

```javascript
// Apenas Super Admin pode acessar
router.get('/admin/users', verifyToken, requireSuperAdmin, getUsers)

// Apenas Empresa aprovada
router.get(
  '/company/dashboard',
  verifyToken,
  checkRole(['COMPANY']),
  checkCompanyStatus,
  getCompanyDashboard
)

// Cliente ou Empresa aprovada
router.get(
  '/profile',
  verifyToken,
  requireClientOrApprovedCompany,
  getUserProfile
)

// Impedir acesso cruzado entre empresas
router.put(
  '/company/profile',
  verifyToken,
  checkRole(['COMPANY']),
  checkCompanyStatus,
  checkCompanyOwnership,
  updateCompanyProfile
)
```

## 7. Notificações Automáticas

### Quando são enviadas:

1. **Registro como Cliente**: Email de boas-vindas
2. **Registro como Empresa**: Email "Aguardando aprovacao" + alerta Super Admin
3. **Empresa Aprovada**: Email + notificação in-app
4. **Empresa Rejeitada**: Email com motivo + notificação in-app
5. **Empresa Suspensa**: Email + notificação in-app
6. **Membro adicionado à equipe**: Email com link de convite

### Estrutura de notificação in-app:

```javascript
{
  id: 'uuid',
  user_id: 'user-uuid',
  company_id: 'company-uuid',
  type: 'approval_status',  // approval_status, suspension, invitation, etc
  title: 'Empresa Aprovada',
  message: 'Sua empresa foi aprovada! Acesso total disponível.',
  data: {
    company_id: 'company-uuid',
    status: 'approved'
  },
  is_read: false,
  created_at: '2024-01-15T10:30:00Z',
  expires_at: '2024-02-15T10:30:00Z'
}
```

## 8. Auditoria e Segurança

Cada ação importante é registrada:

```javascript
{
  id: 'uuid',
  user_id: 'user-uuid',
  action: 'company_approved',
  entity_type: 'company',
  entity_id: 'company-uuid',
  changes: {
    old_status: 'pending_approval',
    new_status: 'approved'
  },
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  status: 'success',
  created_at: '2024-01-15T10:30:00Z'
}
```

Log de tentativas não autorizadas:

```javascript
{
  action: 'unauthorized_access_attempt',
  entity_type: 'route',
  status: 'unauthorized',
  error_message: 'Acesso negado para role: CLIENT'
}
```

## 9. Implementação Frontend React

### Tela de Registro Dupla

```jsx
// src/pages/RegisterPage.jsx
const [registerType, setRegisterType] = useState(null) // 'client' | 'company'

if (!registerType) {
  return (
    <div>
      <button onClick={() => setRegisterType('client')}>
        Registrar como Cliente
      </button>
      <button onClick={() => setRegisterType('company')}>
        Registrar como Empresa
      </button>
    </div>
  )
}

if (registerType === 'client') {
  return <ClientRegisterForm />
}

return <CompanyRegisterForm />
```

### Protected Route Component

```jsx
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children, requiredRole, requiredStatus }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && !requiredRole.includes(user.role)) {
    return <Navigate to="/" />
  }

  if (requiredRole === 'COMPANY' && user.company_status !== 'approved') {
    return <PendingApprovalScreen />
  }

  return children
}
```

### Uso no Router

```jsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute requiredRole={['CLIENT', 'COMPANY']}>
        <DashboardPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/company/dashboard"
    element={
      <ProtectedRoute requiredRole={['COMPANY']} requiredStatus="approved">
        <CompanyDashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin"
    element={
      <ProtectedRoute requiredRole={['SUPER_ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 10. Próximas Etapas

1. Executar SQL de schema no Supabase
2. Instalar dependências: `npm install express supabase jwt bcrypt cors nodemailer`
3. Implementar server.js com Express
4. Criar controllers e services conforme modelo
5. Testar com cURL
6. Integrar no frontend React
7. Configurar CI/CD para deployment

## 11. Considerações de Segurança

- Sempre validar e sanitizar entrada do usuário
- Usar HTTPS em produção
- Implementar rate limiting nos endpoints de login/registro
- Usar bcrypt para hash de senhas (NÃO salvar senha em texto plano)
- Implementar 2FA para Super Admin
- Audit logs devem ser imutáveis
- Usar RLS policies do Supabase para proteção adicional
- Implementar CORS corretamente
- Usar secrets management para variáveis sensíveis

## 12. Recuperação de Conta

TODO: Implementar fluxo de "Esqueceu Senha" com token de reset
TODO: Implementar MFA (Autenticação Multi-fator) para Super Admin
