# 🤖 Integração N8N - Documentação Completa

## O que é N8N?

N8N é uma plataforma de automação de workflows. Ele conecta diferentes serviços e automatiza processos.

**No TalentScan, usamos N8N para:**
- ✅ Receber CVs do Telegram
- ✅ Extrair texto dos PDFs/DOCX
- ✅ Chamar OpenAI para análise de IA
- ✅ Salvar dados no Supabase
- ✅ Enviar resultados para Google Sheets

---

## 🚀 Como Configurar

### 1. Criar conta N8N
- Acesse https://n8n.io
- Crie uma conta (nuvem ou self-hosted)
- Acesse seu dashboard

### 2. Criar Webhooks
- No N8N, clique em **Workflows**
- Crie um novo workflow
- Adicione um nó **Webhook**
- Configure para receber POST requests
- Copie a URL do webhook

### 3. Adicionar ao TalentScan
- Acesse http://localhost:5173/admin
- Vá para a aba **⚙️ N8N Webhooks**
- Cole as URLs dos webhooks:
  - **CV Upload**: para quando um CV é enviado
  - **Analysis**: para análise com IA
  - **Telegram**: para sincronização

---

## 📋 Arquitetura do Workflow

### Fluxo 1: Upload de CV via Telegram
```
Telegram Bot (recebe PDF)
         ↓
   N8N Webhook #1
         ↓
  Extração de Texto
         ↓
  Upload para Supabase Storage
         ↓
  Salva referência no banco
         ↓
  Dispara análise automática
```

### Fluxo 2: Análise com OpenAI
```
CV em texto
     ↓
N8N Webhook #2
     ↓
Chamar OpenAI API
     ↓
Processar resultado
     ↓
Salvar em candidates table
     ↓
Gerar match scores
     ↓
Enviar para Google Sheets
```

### Fluxo 3: Sincronização Telegram
```
Dados de Candidates
        ↓
N8N Webhook #3
        ↓
Formatar mensagem
        ↓
Enviar para Telegram
        ↓
Notificar recrutador
```

---

## 💻 Como Usar no React

### Exemplo 1: Disparar Análise de CV

```jsx
import { n8nService } from '../config/n8n'

async function analisarCV() {
  const cvData = {
    candidateName: "João Silva",
    email: "joao@email.com",
    skills: ["JavaScript", "React", "Node.js"]
  }
  
  const result = await n8nService.analyzeCv(cvData)
  
  if (result.success) {
    console.log("Análise iniciada:", result.data)
  } else {
    console.error("Erro:", result.error)
  }
}
```

### Exemplo 2: Notificar Upload

```jsx
import { n8nService } from '../config/n8n'

async function notificarUpload(file) {
  const uploadData = {
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString()
  }
  
  const result = await n8nService.notifyCvUpload(uploadData)
  
  if (result.success) {
    console.log("N8N notificado")
  }
}
```

### Exemplo 3: Sincronizar com Telegram

```jsx
import { n8nService } from '../config/n8n'

async function sincronizarTelegram() {
  const data = {
    telegramChatId: "123456789",
    message: "Novo candidato encontrado!",
    candidateData: { /* dados */ }
  }
  
  const result = await n8nService.syncTelegram(data)
}
```

---

## 🎯 Painel Admin

### Acessar Admin Panel
```
http://localhost:5173/admin
```

### Funcionalidades

#### 1. Overview
- Dashboard com estatísticas
- Status de conexões
- Health check do sistema

#### 2. N8N Webhooks
- Configurar URLs dos webhooks
- Testar conexões
- Salvar configurações

#### 3. Gerenciar CVs
- Ver lista de CVs enviados
- Status de processamento
- Download de arquivos

#### 4. Candidatos
- Ver candidatos extraídos
- AI scores
- Análises da OpenAI

#### 5. Matches
- Ver matches gerados
- Scores de compatibilidade
- Status de seleção

#### 6. Logs
- Histórico de ações
- Erros e warnings
- Timestamps

---

## 📊 Exemplo de Payload N8N

### Webhook: CV Upload

**Request:**
```json
{
  "type": "cv_uploaded",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "fileName": "joao-silva.pdf",
    "fileSize": 245000,
    "fileType": "application/pdf",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Response N8N esperado:**
```json
{
  "success": true,
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing"
}
```

---

### Webhook: Analysis

**Request:**
```json
{
  "type": "cv_analysis",
  "timestamp": "2024-01-15T10:31:00Z",
  "data": {
    "candidateName": "João Silva",
    "email": "joao@email.com",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": "5 anos"
  }
}
```

**Response N8N esperado:**
```json
{
  "success": true,
  "analysisId": "550e8400-e29b-41d4-a716-446655440001",
  "score": 85,
  "analysis": {
    "strengths": ["Forte em React"],
    "weaknesses": ["Pouca DevOps"],
    "recommendation": "Excelente candidato"
  }
}
```

---

## 🔧 Troubleshooting

### Erro: "Webhook não encontrado"
- Verifique se a URL está correta
- Teste a URL no Postman
- Certifique-se que o workflow está ativo

### Erro: "Timeout"
- Aumente o timeout no N8N
- Verifique velocidade de Internet
- Verifique logs da OpenAI

### Erro: "Auth failed"
- Verifique as chaves de API
- Certifique-se que está no whitelist
- Regenere as chaves se necessário

---

## 🚀 Próximos Passos

- [ ] Criar workflows no N8N
- [ ] Configurar OpenAI API
- [ ] Testar webhooks
- [ ] Integrar Google Sheets
- [ ] Conectar Telegram Bot
- [ ] Configurar alertas

---

## 📚 Recursos Úteis

- [N8N Docs](https://docs.n8n.io/)
- [N8N Community](https://community.n8n.io/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Supabase Docs](https://supabase.com/docs/)
