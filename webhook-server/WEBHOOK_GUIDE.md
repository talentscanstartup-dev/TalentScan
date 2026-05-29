# N8N Webhook Server - Guia de Implementação

## Visão Geral

Servidor Express para receber dados de currículos extraídos por automação n8n. O servidor implementa autenticação por Bearer Token, validação de payload e logging estruturado.

## Arquitetura

```
n8n (Automação)
    ↓
    POST /api/receber-curriculo
    with Bearer Token
    ↓
Webhook Server (Express)
    ↓
Validação + Autenticação
    ↓
Processamento + Logging
    ↓
200 OK Response (evita timeout)
    ↓
[Inserir no banco de dados - TODO]
```

## Setup Rápido (5 minutos)

### 1. Clonar/Copiar arquivos

```bash
cd webhook-server
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar arquivo .env

```bash
cp .env.example .env
```

Editar `.env`:

```env
PORT=3001
NODE_ENV=development
N8N_WEBHOOK_TOKEN=seu-token-super-secreto-32-caracteres-aleatorios
```

**Como gerar um token seguro:**

```bash
# PowerShell
[System.Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Bash/Linux/Mac
openssl rand -hex 32
```

### 4. Iniciar servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

Resposta esperada:

```
╔════════════════════════════════════════════════════════════╗
║         N8N WEBHOOK SERVER - RECEBER CURRICULOS          ║
╠════════════════════════════════════════════════════════════╣
║ Servidor iniciado com sucesso                            ║
║ URL: http://localhost:3001                                ║
║ Health: GET  http://localhost:3001/health                 ║
║ Webhook: POST http://localhost:3001/api/receber-curriculo
║ Teste:   POST http://localhost:3001/api/receber-curriculo/teste
║                                                           ║
║ Token necessário: seu-token-s... ║
╚════════════════════════════════════════════════════════════╝
```

## Endpoints

### 1. GET /health
Verificar se servidor está rodando

```bash
curl -X GET http://localhost:3001/health
```

Resposta:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "development"
}
```

### 2. POST /api/receber-curriculo
Endpoint principal - Recebe dados de currículo do n8n

**Headers obrigatórios:**
```
Authorization: Bearer seu-token-super-secreto-32-caracteres-aleatorios
Content-Type: application/json
```

**Body esperado:**
```json
{
  "nome_candidato": "João Silva",
  "email": "joao@example.com",
  "telefone": "+55 11 98765-4321",
  "profissao": "Desenvolvedor Backend",
  "experiencia_anos": 5,
  "skills": ["Node.js", "Express", "PostgreSQL"],
  "localizacao": "São Paulo, SP",
  "pretensao_salarial": "R$ 8.000 - R$ 12.000",
  "linkedin": "https://linkedin.com/in/joao",
  "portfolio": "https://github.com/joao",
  "resumo": "Desenvolvedor backend com 5 anos de experiência...",
  "arquivo_id": "telegram_123456",
  "arquivo_url": "https://t.me/...",
  "data_extracao": "2024-01-15T10:30:00Z",
  "confianca_extracao": 0.95,
  "metadata": {
    "source": "telegram",
    "n8n_execution_id": "exec_abc123",
    "groq_model": "mixtral-8x7b-32768"
  }
}
```

**Campos obrigatórios:** `nome_candidato`, `email`, `telefone`

**Resposta sucesso (200):**
```json
{
  "success": true,
  "message": "Curriculo recebido com sucesso",
  "timestamp": "2024-01-15T10:30:00Z",
  "processamento": {
    "campos_recebidos": 15,
    "campos_validados": true,
    "timestamp_processamento": "2024-01-15T10:30:00Z",
    "status_banco_dados": "simulado"
  },
  "data": {
    "candidato_id": null,
    "nome_candidato": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Resposta erro (400 - faltam campos):**
```json
{
  "success": false,
  "error": "Campos obrigatorios faltando",
  "missing_fields": ["nome_candidato"],
  "expected_fields": ["nome_candidato", "email", "telefone"]
}
```

**Resposta erro (401 - sem token):**
```json
{
  "success": false,
  "error": "Token ausente. Use: Authorization: Bearer <TOKEN>",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Resposta erro (403 - token inválido):**
```json
{
  "success": false,
  "error": "Token invalido",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. POST /api/receber-curriculo/teste
Endpoint de teste **SEM autenticação** (remover em produção)

Útil para testar o payload antes de configurar a autenticação no n8n.

```bash
curl -X POST http://localhost:3001/api/receber-curriculo/teste \
  -H "Content-Type: application/json" \
  -d '{
    "nome_candidato": "João Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 98765-4321"
  }'
```

## Testando Localmente

### Teste 1: Health Check

```bash
curl -X GET http://localhost:3001/health
```

### Teste 2: Webhook com Token Correto

```bash
curl -X POST http://localhost:3001/api/receber-curriculo \
  -H "Authorization: Bearer seu-token-super-secreto-32-caracteres-aleatorios" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_candidato": "Maria Santos",
    "email": "maria@example.com",
    "telefone": "+55 21 99999-8888",
    "profissao": "Desenvolvedora Frontend",
    "experiencia_anos": 3,
    "skills": ["React", "TypeScript", "Tailwind"],
    "localizacao": "Rio de Janeiro, RJ"
  }'
```

Resposta esperada:
```
✓ Status 200
✓ success: true
✓ Dados aparecem no console do servidor
```

### Teste 3: Webhook sem Token (deve falhar)

```bash
curl -X POST http://localhost:3001/api/receber-curriculo \
  -H "Content-Type: application/json" \
  -d '{
    "nome_candidato": "João Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 98765-4321"
  }'
```

Resposta esperada:
```json
{
  "success": false,
  "error": "Token ausente. Use: Authorization: Bearer <TOKEN>"
}
```

### Teste 4: Webhook com Token Incorreto (deve falhar)

```bash
curl -X POST http://localhost:3001/api/receber-curriculo \
  -H "Authorization: Bearer token-errado" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_candidato": "João Silva",
    "email": "joao@example.com",
    "telefone": "+55 11 98765-4321"
  }'
```

Resposta esperada:
```json
{
  "success": false,
  "error": "Token invalido"
}
```

### Teste 5: Webhook faltando campos obrigatórios (deve falhar)

```bash
curl -X POST http://localhost:3001/api/receber-curriculo \
  -H "Authorization: Bearer seu-token-super-secreto-32-caracteres-aleatorios" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_candidato": "João Silva"
  }'
```

Resposta esperada:
```json
{
  "success": false,
  "error": "Campos obrigatorios faltando",
  "missing_fields": ["email", "telefone"]
}
```

## Expor Servidor Localmente para N8N (Ngrok / LocalTunnel)

Para o n8n fazer requisições ao servidor rodando na sua máquina local, é necessário expor a URL via um túnel.

### Opção 1: LocalTunnel (Recomendado - Mais Simples)

```bash
# Instalar globalmente
npm install -g localtunnel

# Expor porta 3001
npx localtunnel --port 3001

# Resposta:
# your url is: https://lucky-panda-55.loca.lt
```

**URL para usar no n8n:**
```
https://lucky-panda-55.loca.lt/api/receber-curriculo
```

### Opção 2: Ngrok

```bash
# Instalar de https://ngrok.com/download

# Fazer login
ngrok config add-authtoken seu-token-ngrok

# Expor porta 3001
ngrok http 3001

# Resposta:
# Forwarding   https://a1b2-3c4d-5e6f-7g8h.ngrok.io -> http://localhost:3001
```

**URL para usar no n8n:**
```
https://a1b2-3c4d-5e6f-7g8h.ngrok.io/api/receber-curriculo
```

### Opção 3: SSH Tunneling (Avançado)

Se você tem acesso a um servidor VPS:

```bash
ssh -R 3001:localhost:3001 user@seu-vps.com
```

## Configurar no N8N

Após expor o servidor, configure a automação n8n:

### 1. Usar nó "HTTP Request"

**Método:** POST

**URL:** `https://seu-url-tunel.loca.lt/api/receber-curriculo` (ou ngrok)

### 2. Headers

| Header | Valor |
|--------|-------|
| Authorization | `Bearer seu-token-super-secreto-32-caracteres-aleatorios` |
| Content-Type | `application/json` |

### 3. Body (tipo JSON)

Mapear as variáveis extraídas do n8n:

```json
{
  "nome_candidato": "{{ $json.nome }}",
  "email": "{{ $json.email }}",
  "telefone": "{{ $json.telefone }}",
  "profissao": "{{ $json.profissao }}",
  "experiencia_anos": "{{ $json.anos_experiencia }}",
  "skills": "{{ $json.skills }}",
  "localizacao": "{{ $json.localizacao }}",
  "pretensao_salarial": "{{ $json.salario }}",
  "linkedin": "{{ $json.linkedin_url }}",
  "portfolio": "{{ $json.portfolio_url }}",
  "resumo": "{{ $json.resumo_executivo }}",
  "arquivo_id": "{{ $json.arquivo_id }}",
  "arquivo_url": "{{ $json.arquivo_url }}",
  "data_extracao": "{{ $now.iso() }}",
  "confianca_extracao": "{{ $json.confianca_score }}",
  "metadata": {
    "source": "telegram",
    "n8n_execution_id": "{{ $execution.id }}",
    "groq_model": "mixtral-8x7b-32768"
  }
}
```

### 4. Tratamento de Resposta

- **Sucesso (200):** Continuar fluxo
- **Erro (4xx/5xx):** Enviar notificação ou salvar para retry

## Integrar com Banco de Dados

Atualmente, o servidor apenas faz logging. Para integrar com Supabase/PostgreSQL:

### 1. Instalar cliente Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Criar arquivo `db.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function inserirCandidato(dados) {
  const { data, error } = await supabase
    .from('candidatos')
    .insert({
      nome: dados.nome_candidato,
      email: dados.email,
      telefone: dados.telefone,
      profissao: dados.profissao,
      experiencia_anos: dados.experiencia_anos,
      skills: dados.skills,
      localizacao: dados.localizacao,
      pretensao_salarial: dados.pretensao_salarial,
      linkedin: dados.linkedin,
      portfolio: dados.portfolio,
      resumo: dados.resumo,
      arquivo_id: dados.arquivo_id,
      arquivo_url: dados.arquivo_url,
      confianca_extracao: dados.confianca_extracao,
      metadata: dados.metadata,
      status: 'novo',
    })
    .select()

  if (error) throw error
  return data[0]
}
```

### 3. Descomentar seção TODO no `server.js`

Procure por: `// TODO: INSERIR NO BANCO DE DADOS AQUI`

Descomente e adapte o código para usar a função `inserirCandidato()`.

## Logging e Debugging

### Console Output

O servidor imprime todos os dados recebidos:

```
[2024-01-15T10:30:00Z] POST /api/receber-curriculo

======================================================================
WEBHOOK RECEBIDO: POST /api/receber-curriculo
======================================================================
Timestamp: 2024-01-15T10:30:00Z
Token autenticado: true

Payload recebido:
{
  "nome_candidato": "João Silva",
  "email": "joao@example.com",
  ...
}
======================================================================
```

### Ver todos os logs

```bash
npm run dev 2>&1 | tee logs/server.log
```

## Segurança - Checklist

- [ ] Token alterado em `.env` (não usar padrão)
- [ ] `.env` nunca commitado no Git (adicionar a `.gitignore`)
- [ ] HTTPS ativado em produção (ngrok/localtunnel já usa)
- [ ] CORS configurado apenas para domínios permitidos
- [ ] Token rotacionado regularmente
- [ ] Logs removem dados sensíveis (em produção)
- [ ] Rate limiting configurado (futuro)
- [ ] Validação de email/telefone (futuro)

## Troubleshooting

### "EADDRINUSE: address already in use :::3001"

Porta 3001 já está em uso:

```bash
# Matar processo
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

Ou usar porta diferente:

```bash
PORT=3002 npm run dev
```

### "N8N_WEBHOOK_TOKEN nao configurada em .env"

Criar `.env` com token:

```bash
cp .env.example .env
# Editar .env e adicionar token
```

### Ngrok não conecta

```bash
# Verificar se autenticado
ngrok config show

# Re-autenticar
ngrok config add-authtoken seu-token
```

### LocalTunnel URL expira

URLs de LocalTunnel expiram após ~2 horas sem atividade. Reinicie:

```bash
npx localtunnel --port 3001
```

## Roadmap - Funcionalidades Futuras

- [ ] Autenticação API Key (além de Bearer)
- [ ] Rate limiting por IP/Token
- [ ] Banco de dados integrado
- [ ] Fila de processamento (Bull/RabbitMQ)
- [ ] Webhooks para eventos (notificação quando CV processado)
- [ ] Dashboard de monitoramento
- [ ] Métricas (Prometheus/Grafana)
- [ ] Backup automático
- [ ] Alertas por email
- [ ] Retry automático com backoff exponencial
- [ ] Versionamento de API

## Deploy em Produção

### Heroku

```bash
heroku create seu-app-webhook
heroku config:set N8N_WEBHOOK_TOKEN=seu-token
git push heroku main
```

### Railway

```bash
# Conectar repo GitHub
# Deploy automático ao fazer push
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js .
CMD ["node", "server.js"]
```

```bash
docker build -t webhook-server .
docker run -p 3001:3001 -e N8N_WEBHOOK_TOKEN=seu-token webhook-server
```

## Suporte e Documentação

- Arquivo: `server.js` (comentado)
- Postman Collection: Disponível em `docs/postman-collection.json`
- Exemplos: `docs/exemplos-payload.md`

## Licença

MIT

---

**Versão:** 1.0.0
**Última atualização:** Janeiro 2024
**Status:** Pronto para produção (com banco integrado)
