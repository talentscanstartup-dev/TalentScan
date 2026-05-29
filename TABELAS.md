# 📊 Estrutura de Tabelas - Talent Scan

## Como Usar

1. Abra seu projeto no Supabase: https://supabase.com
2. Vá para **SQL Editor**
3. Crie um novo SQL query
4. Copie TODO o conteúdo de `SUPABASE_SETUP.sql`
5. Cole e execute (clique em Run ou Ctrl+Enter)

---

## 📋 Tabelas Criadas

### 1️⃣ **users** - Perfil do Usuário
```sql
id (UUID, PK)
email (TEXT, UNIQUE)
full_name (TEXT)
company_name (TEXT)
phone (TEXT)
profile_picture_url (TEXT)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Estende a tabela `auth.users` do Supabase com dados adicionais do perfil.

---

### 2️⃣ **job_positions** - Posições de Emprego
```sql
id (UUID, PK)
user_id (UUID, FK → users)
title (TEXT)
description (TEXT)
required_skills (JSONB - Array de skills)
experience_level (TEXT)
salary_range (TEXT)
status (TEXT: 'active' | 'inactive' | 'closed')
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Armazena as posições de emprego que o usuário está buscando preencher.

---

### 3️⃣ **cvs** - CVs Enviados
```sql
id (UUID, PK)
user_id (UUID, FK → users)
candidate_name (TEXT)
candidate_email (TEXT)
candidate_phone (TEXT)
file_url (TEXT)
file_name (TEXT)
file_size (INTEGER)
status (TEXT: 'pending' | 'analyzed' | 'rejected')
raw_text (TEXT - Texto extraído do CV)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Armazena os arquivos PDF/DOCX dos CVs recebidos via Telegram.

---

### 4️⃣ **candidates** - Dados dos Candidatos
```sql
id (UUID, PK)
cv_id (UUID, FK → cvs)
user_id (UUID, FK → users)
full_name (TEXT)
email (TEXT)
phone (TEXT)
location (TEXT)
professional_summary (TEXT)
skills (JSONB - Array de skills extraídas)
experience (JSONB - Array de experiências)
education (JSONB - Array de educação)
languages (JSONB - Array de idiomas)
certifications (JSONB - Array de certificações)
ai_score (NUMERIC - Score de 0 a 100)
ai_analysis (JSONB - Análise detalhada da IA)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Dados estruturados extraídos do CV pela IA (OpenAI).

---

### 5️⃣ **matches** - Resultados dos Matches
```sql
id (UUID, PK)
user_id (UUID, FK → users)
candidate_id (UUID, FK → candidates)
job_position_id (UUID, FK → job_positions - nullable)
match_score (NUMERIC - Score de compatibilidade)
match_details (JSONB - Detalhes do match)
status (TEXT: 'new' | 'viewed' | 'shortlisted' | 'rejected')
notes (TEXT - Notas do recrutador)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Armazena os resultados da comparação entre candidatos e posições.

---

### 6️⃣ **telegram_integration** - Integração Telegram
```sql
id (UUID, PK)
user_id (UUID, PK, UNIQUE, FK → users)
telegram_chat_id (TEXT)
telegram_user_id (TEXT)
is_active (BOOLEAN)
webhook_url (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Armazena dados da integração com Telegram Bot.

---

### 7️⃣ **sheets_integration** - Integração Google Sheets
```sql
id (UUID, PK)
user_id (UUID, PK, UNIQUE, FK → users)
sheet_id (TEXT)
sheet_name (TEXT)
access_token (TEXT - ENCRYPTED)
refresh_token (TEXT - ENCRYPTED)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```
**Descrição:** Armazena credenciais e dados da integração com Google Sheets.

---

### 8️⃣ **activity_logs** - Logs de Atividade
```sql
id (UUID, PK)
user_id (UUID, FK → users)
action (TEXT - ex: 'cv_uploaded', 'match_created')
entity_type (TEXT - ex: 'cv', 'candidate')
entity_id (UUID - ID da entidade)
details (JSONB - Detalhes adicionais)
created_at (TIMESTAMP)
```
**Descrição:** Rastreia todas as ações do usuário para auditoria e análise.

---

## 🔐 Segurança

- **Row Level Security (RLS):** Habilitado em todas as tabelas
- **Policies:** Cada usuário só pode ver seus próprios dados
- **Encryption:** Tokens do Google Sheets são criptografados

---

## 📌 Relacionamentos (Foreign Keys)

```
auth.users (Supabase nativo)
    ↓
users (extensão com dados adicionais)
    ↓
├── job_positions
├── cvs
│   ↓
│   candidates
│       ↓
│       matches ← job_positions
├── telegram_integration
├── sheets_integration
└── activity_logs
```

---

## 💾 Exemplo de Dados

### Exemplo: users
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "recrutador@empresa.com",
  "full_name": "João Silva",
  "company_name": "Tech Startup XYZ",
  "phone": "(11) 98765-4321",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Exemplo: job_positions
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Senior Backend Developer",
  "description": "Procuramos um dev experiente...",
  "required_skills": ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
  "experience_level": "senior",
  "salary_range": "R$ 8.000 - R$ 15.000",
  "status": "active"
}
```

### Exemplo: candidates (dados extraídos)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "full_name": "Maria Santos",
  "email": "maria@email.com",
  "skills": ["JavaScript", "React", "Node.js", "Python"],
  "experience": [
    {
      "company": "Tech Co",
      "position": "Frontend Developer",
      "duration": "2020-2023"
    }
  ],
  "ai_score": 85,
  "ai_analysis": {
    "strengths": ["Forte em React", "Experiência frontend"],
    "weaknesses": ["Pouca experiência backend"],
    "recommendation": "Bom candidato para posição junior/pleno"
  }
}
```

### Exemplo: matches
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidate_id": "550e8400-e29b-41d4-a716-446655440002",
  "job_position_id": "550e8400-e29b-41d4-a716-446655440001",
  "match_score": 82,
  "status": "shortlisted",
  "match_details": {
    "matching_skills": ["Node.js", "TypeScript"],
    "missing_skills": ["Docker", "Kubernetes"],
    "match_percentage": 82
  }
}
```

---

## 🚀 Próximos Passos

- [ ] Executar SQL no Supabase
- [ ] Testar autenticação
- [ ] Implementar upload de CVs
- [ ] Integrar com n8n/OpenAI para análise
- [ ] Conectar com Telegram Bot
- [ ] Integrar com Google Sheets

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique se todas as tabelas foram criadas no Supabase
2. Teste as RLS policies
3. Verifique os triggers de `updated_at`
