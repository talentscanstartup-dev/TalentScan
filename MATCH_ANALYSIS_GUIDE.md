# 🎯 Sistema de Matching Inteligente Vaga vs Currículo (v2 - AVANÇADO)

## ✨ O que foi adicionado?

### 📥 Download do Currículo
- Botão direto para baixar CV do candidato
- Nomes de arquivo automáticos: `CV_NomeCandidato.pdf`
- Funciona em lista compacta e vista expandida

### 🤖 Análise IA Detalhada
A IA agora fornece análise **muito mais profunda**:

#### Análise de Skills
- ✓ Skills correspondentes (com match score individual)
- ✕ Skills faltantes (com notas sobre importância)
- 📊 Percentual de compatibilidade de skills
- 🔍 Análise detalhada de cada skill

#### Análise de Experiência
- 📈 Anos de experiência exigidos vs fornecidos
- 🎯 Alinhamento da trajetória profissional
- 🚀 Análise de crescimento profissional
- ⚠️ Identificação de gaps específicos

#### Análise de Educação
- 🎓 Formação exigida vs fornecida
- ✓ Match de certificações e diplomas

#### Análise Cultural
- 👤 Fit cultural baseado no perfil profissional
- 🔴 Bandeiras vermelhas (job hopping, gaps, etc)
- 💡 Areas de foco para entrevista

#### Recomendação Final
Texto claro indicando:
- "Fortemente recomendado - avançar para entrevista técnica"
- "Considerar como candidato secundário"
- "Não recomendado - gaps significativos"

---

## 🎨 Visualização Atualizada

### Modo Compacto (Lista)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [85%] ●●●●●●●●●●●                                  │
│  ✓ Excelente                                        │
│  "82% compatível. Pontos fortes: Python, 5..."     │
│                                                     │
│  ✓ Fortes: Python, Backend, 5 anos  │  ⚠ Atenção  │
│  Falta React, AWS (pode aprender)    │            │
│                                                     │
│  💡 Recomendação: Avançar para ...                 │
│  [Baixar CV] [Reanalizar]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Modo Expandido (Detalhes)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [85%]                  🎯 Excelente Match             │
│   ●●●●●●●●●            "82% compatível..."            │
│                                                          │
│  💡 Recomendação: Fortemente recomendado para...      │
│  [Baixar CV] [Reanalizar]                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ ✓ PONTOS FORTES                                         │
│ Python avançado, 5 anos experiência backend,            │
│ liderança de projetos, arquitetura cloud               │
├──────────────────────────────────────────────────────────┤
│ ⚠ PONTOS DE ATENÇÃO                                     │
│ Falta Kubernetes (crítica, pode aprender),              │
│ Experiência limitada DevOps                            │
├──────────────────────────────────────────────────────────┤
│ 📊 ANÁLISE DETALHADA DE SKILLS                          │
│                                                          │
│ Compatibilidade: 90%                                    │
│ ▓▓▓▓▓▓▓▓▓░ 90%                                         │
│                                                          │
│ ✓ Correspondentes: Python | SQL | Docker |             │
│   Git | REST API                                        │
│                                                          │
│ ✕ Faltantes: Kubernetes | AWS Services               │
├──────────────────────────────────────────────────────────┤
│ 📌 INFORMAÇÕES ADICIONAIS                               │
│                                                          │
│ Fit Geral: Excelente alinhamento com vaga               │
│ Análise Experiência: 5 anos, alinhado...              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 JSON da Análise Detalhada

```json
{
  "compatibility_score": 85,
  "compatibility_summary": "85% compatível. Pontos fortes: Python avançado, 5 anos experiência, liderança. Atenção: Falta Kubernetes.",
  "strengths": "Python avançado; 5 anos experiência backend; Liderança de projetos; Arquitetura cloud",
  "concerns": "Kubernetes não possui; DevOps experiência limitada; AWS SDK nível básico",
  "recommendation": "Fortemente recomendado - avançar para entrevista técnica",
  "skills_match": {
    "required_skills": ["Python", "SQL", "Backend", "Docker", "API REST", "AWS"],
    "matched_skills": ["Python", "SQL", "Docker", "Git", "REST API"],
    "match_percentage": 90,
    "matched_details": [
      "Python (candidato: avançado, vaga: intermediário+) ✓",
      "SQL (candidato: avançado, vaga: intermediário) ✓",
      "Docker (candidato: intermediário, vaga: intermediário) ✓"
    ],
    "missing_skills": ["Kubernetes", "AWS Services"],
    "missing_notes": [
      "Kubernetes - crítica para arquitetura, porém curva curta de aprendizado",
      "AWS - importante, pode ser ensinado internamente"
    ]
  },
  "experience_match": {
    "required_years": "5+ anos em backend",
    "candidate_years": "6 anos experiência backend",
    "alignment": "Acima do requisito",
    "relevant_experience": ["Backend em Python", "Arquitetura microsserviços", "DDD", "Clean Code"],
    "gap_analysis": "Nenhum gap significativo identificado"
  },
  "detailed_analysis": {
    "overall_fit": "Candidato apresenta excelente alinhamento com vaga. Skills principais presentes, experiência acima do requisito, trajetória profissional consistente.",
    "career_progression": "Crescimento progressivo: Junior → Pleno → Senior em Backend, com atualizações constantes de tecnologia"
  },
  "red_flags": "Nenhuma bandeira identificada",
  "interview_focus_areas": [
    "Explorar experiência com Kubernetes/DevOps",
    "Confirmar capacidade técnica em arquitetura distribuída",
    "Avaliar soft skills de liderança"
  ],
  "hiring_score_rationale": "Score 85 reflete match muito bom: 90% skills, experiência acima, trajetória sólida. Os 15% restantes devem-se principalmente à falta de Kubernetes, que é aprendível."
}
```

---

## 🔧 Campos Novosordenados no Banco (SQL)

```sql
ALTER TABLE public.job_applications ADD:
- compatibility_score NUMERIC (0-100)
- compatibility_summary TEXT (3 linhas)
- strengths TEXT (pontos positivos)
- concerns TEXT (gaps/preocupações)
- recommendation TEXT (conclusão recomendada)
- ai_analysis JSONB (análise completa JSON)
- detailed_analysis JSONB (análise detalhada estruturada)
- skills_match JSONB (matching de skills com notas)
- experience_analysis TEXT (análise de experiência)
- education_analysis TEXT (análise de educação)
- analysis_timestamp TIMESTAMP (quando foi analisado)
- analysis_status TEXT (pending/processing/completed/failed)
```

---

## 🚀 Como Usar o Download de CV

### Na Lista de Candidaturas
1. Clique em um candidato para expandir
2. Clique em **[Baixar CV]**
3. CV é salvo como `CV_NomeCandidato.pdf`

### Na Vista Expandida
1. Botão **Baixar CV** está na área superior direita
2. Download direto do servidor com nome automático

---

## 📋 Exemplo de Uso Completo

### Cenário: RH revisa candidatos

```
1. RH acessa Painel → Vagas da Empresa
2. Clica em "Ver Candidatos" de uma vaga
3. Vê lista de candidatos COM scores já calculados
4. Candidatos com 75%+ têm badge "✓ Excelente"
5. RH expande um candidato (score 82%)
6. Vê:
   - Score grande e visual (82%)
   - Resumo de 3 linhas com contexto
   - Recomendação clara
   - Pontos fortes em verde
   - Pontos atenção em orange
   - Skills matching com percentual
   - Análise detalhada de experiência
   - Botão para baixar CV
   - Botão para reanalizar se precisar
7. RH clica "Baixar CV" → abre PDF localmente
8. RH toma decisão com base em análise
```

---

## 🎯 Recomendações Automáticas

A IA classifica em 3 categorias:

| Score | Categoria | Recomendação | Ação |
|-------|-----------|--------------|------|
| 75-100 | 🎯 Excelente | "Avançar para entrevista técnica" | ✓ Prioridade alta |
| 50-74 | ⚠️ Bom | "Considerar para entrevista" | ⓘ Revisar com cuidado |
| 0-49 | ❌ Fraco | "Não recomendado - gaps significativos" | ✕ Considerar outros |

---

## 💡 O que torna a análise detalhada?

### Antes (v1)
- Score simples (0-100)
- 3 campos: strengths, concerns, summary
- Análise local básica sem IA

### Agora (v2)
- Score contextualizado com recomendação
- 10+ campos de análise profunda
- Skills matching com notas
- Análise de trajetória profissional
- Bandeiras vermelhas automáticas
- Areas para explorar na entrevista
- Rationale explicando o score

---

## 🔄 Fluxo Completo

```
Candidato aplica a vaga
        ↓
Sistema cria candidatura
        ↓
IA disparada assincronamente
        ↓
Recupera dados do CV já analisado
        ↓
Recupera descrição da vaga
        ↓
Monta prompt detalhado para OpenAI
        ↓
OpenAI retorna análise completa
        ↓
Sistema salva em job_applications
        ↓
RH vê no painel com tudo preenchido
        ↓
RH baixa CV + lê análise
        ↓
RH toma decisão informada
```

---

## ⚙️ Integração N8N Recomendada

### Workflow sugerido

```javascript
Input → 
  Extract Prompt & Data →
  Call OpenAI GPT-4 (detailed analysis) →
  Parse JSON Response →
  Validate Structure →
  Output JSON
```

### Retorno esperado

```json
{
  "data": {
    "compatibility_score": 85,
    "summary": "...",
    "strengths": "...",
    "concerns": "...",
    "recommendation": "...",
    "skills_match": {...},
    "detailed_analysis": {...},
    ...
  }
}
```

---

## 📞 Troubleshooting

**P: CV não aparece para download?**
R: Verifique se `cv_file_url` e `signedUrls[app.id]` estão populados. Se via Supabase Storage, gere URL assinada.

**P: Análise ficou em "processing"?**
R: Pode estar esperando resposta do N8N. Aguarde 10-30s. Se continuar, clique "Tentar novamente".

**P: Score está 0?**
R: Análise ainda não foi executada. Componente mostra spinner. Aguarde.

**P: Quero reanalizar?**
R: Clique botão "Reanalizar" - dispara análise novamente, histórico guardado.

---

## 🎓 Checklist Implementação

- [x] Banco de dados atualizado
- [x] MatchingService melhorado
- [x] MatchScoreCard com download
- [x] JobApplicantsModal atualizado
- [x] Análise detalhada de IA
- [x] Recomendações automáticas
- [ ] (Opcional) Export para Excel
- [ ] (Opcional) Histórico gráfico de scores

---

Documentação completa: **`MATCH_ANALYSIS_GUIDE.md`**

