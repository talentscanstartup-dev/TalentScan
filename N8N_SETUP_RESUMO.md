# 📱 Sistema N8N + Admin Panel - Resumo

## ✅ O que foi criado:

### 1. **Serviço N8N** ([src/config/n8n.js](src/config/n8n.js))
- Funções para chamar webhooks n8n
- `analyzeCv()` - Disparar análise com IA
- `notifyCvUpload()` - Notificar upload de CV
- `syncTelegram()` - Sincronizar com Telegram
- `sendData()` - Enviar dados customizados

### 2. **Painel Admin** ([src/pages/AdminDashboard.jsx](src/pages/AdminDashboard.jsx))
- Dashboard com 6 abas:
  - 📊 **Overview** - Status geral do sistema
  - ⚙️ **N8N Webhooks** - Configurar URLs dos webhooks
  - 📄 **CVs** - Listar CVs enviados
  - 👥 **Candidatos** - Listar candidatos analisados
  - 🎯 **Matches** - Listar matches gerados
  - 📋 **Logs** - Histórico de ações

### 3. **Componente Upload** ([src/components/CvUploadComponent.jsx](src/components/CvUploadComponent.jsx))
- Drag & drop de CVs
- Upload com validação
- Integração com n8n
- Feedback de sucesso/erro

### 4. **Rotas Atualizadas**
- `/admin` - Admin Dashboard (novo)
- `/dashboard` - User Dashboard (com botão pro admin)

---

## 🚀 Como Usar:

### 1. Acessar o Painel Admin
```
http://localhost:5173/admin
```

### 2. Configurar Webhooks N8N
- Vá para aba **⚙️ N8N Webhooks**
- Cole as URLs dos 3 webhooks:
  - CV Upload webhook
  - Analysis webhook  
  - Telegram webhook
- Clique em **Salvar Configurações**

### 3. Usar no Código React

```jsx
import { n8nService } from '../config/n8n'

// Analisar CV
await n8nService.analyzeCv({
  candidateName: "João",
  email: "joao@email.com"
})

// Notificar upload
await n8nService.notifyCvUpload({
  fileName: "cv.pdf",
  fileSize: 245000
})

// Sincronizar Telegram
await n8nService.syncTelegram({
  telegramChatId: "123456",
  message: "Novo candidato!"
})
```

---

## 📊 Arquitetura:

```
React Component
       ↓
n8nService (src/config/n8n.js)
       ↓
Webhook N8N
       ↓
├── Processa dados
├── Chama OpenAI
├── Salva no Supabase
└── Envia para Google Sheets
```

---

## 🔐 Variáveis de Ambiente

Seu `.env.local` agora tem:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_N8N_WEBHOOK_CV_UPLOAD=
VITE_N8N_WEBHOOK_ANALYSIS=
VITE_N8N_WEBHOOK_TELEGRAM=
```

---

## 📁 Arquivos Criados:

```
src/
├── config/
│   ├── n8n.js ..................... Serviço N8N
│   └── supabase.js ................ (já existia)
├── pages/
│   ├── AdminDashboard.jsx ......... Painel Admin
│   ├── DashboardPage.jsx .......... Atualizado com upload
│   └── ...
├── components/
│   └── CvUploadComponent.jsx ....... Componente upload
└── main.jsx ....................... Rotas atualizadas

.env.local .......................... Atualizado
N8N_GUIDE.md ....................... Documentação completa
```

---

## 🎯 Próximos Passos:

- [ ] Criar webhooks no N8N
- [ ] Testar conexão com n8n
- [ ] Integrar upload com Supabase Storage
- [ ] Implementar análise com OpenAI
- [ ] Conectar Google Sheets
- [ ] Configurar Telegram Bot

Veja [N8N_GUIDE.md](N8N_GUIDE.md) para documentação completa!
