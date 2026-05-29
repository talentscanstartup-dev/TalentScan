# TalentScan - Sistema de Autenticação

## Arquivos de Autenticação Criados

### 1. **src/config/supabase.js**
- Configuração do cliente Supabase
- Funções de autenticação (signup, login, logout, getCurrentUser, getSession)
- Integração com variáveis de ambiente

### 2. **src/pages/LoginPage.jsx**
- Página completa de login
- Validação de campos
- Redirecionamento para dashboard após login
- Link para página de registro
- Recuperação de senha

### 3. **src/pages/RegisterPage.jsx**
- Página completa de registro
- Validação de email e senha
- Confirmação de senha
- Requisito mínimo de 6 caracteres
- Link para página de login

### 4. **src/pages/DashboardPage.jsx**
- Dashboard protegido
- Informações do usuário
- Cards de estatísticas
- Botão de logout
- Redirecionamento automático se não estiver autenticado

### 5. **src/main.jsx** (Atualizado)
- Integração com React Router
- Rotas para Home, Login, Register, Dashboard
- Redirecionamento para home em rotas inválidas

### 6. **src/App.jsx** (Atualizado)
- Navbar com botões de Login e Cadastro
- Navegação para páginas de autenticação
- Removido LoginPanel modal

### 7. **.env.local** (Criar)
```
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

## Como Usar

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure suas credenciais Supabase
- Crie um projeto em https://supabase.com
- Copie a URL e a chave anon
- Preencha o arquivo `.env.local`

### 3. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

### 4. Teste as rotas
- **Home**: http://localhost:5173/
- **Login**: http://localhost:5173/login
- **Registro**: http://localhost:5173/register
- **Dashboard**: http://localhost:5173/dashboard (protegido)

## Fluxo de Autenticação

1. Usuário clica em "Cadastro" na home
2. Preenche formulário de registro
3. Conta é criada no Supabase
4. Redirecionado para página de login
5. Faz login com suas credenciais
6. Sistema valida com Supabase
7. Redirecionado para dashboard
8. Dashboard verifica autenticação
9. Exibe informações do usuário

## Próximos Passos

- [ ] Integrar com Google Sheets para armazenar dados de CVs
- [ ] Criar página de upload de CVs
- [ ] Implementar integração com Telegram
- [ ] Adicionar recuperação de senha
- [ ] Criar perfil de usuário editável
- [ ] Adicionar autenticação com Google/GitHub
