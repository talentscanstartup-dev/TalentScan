-- ============================================================
-- AI_CRITERIA_MIGRATION.sql
-- Adiciona suporte a Critérios de IA Ajustáveis por Empresa
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar coluna ai_criteria_weights na tabela companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ai_criteria_weights JSONB DEFAULT '{
  "technical_skills": 40,
  "experience_years": 25,
  "education": 15,
  "specific_tools": 10,
  "soft_skills": 5,
  "languages": 5,
  "enabled_criteria": ["technical_skills", "experience_years", "education", "specific_tools", "soft_skills", "languages"],
  "strictness_level": "balanced"
}'::jsonb;

-- 2. Comentário descritivo na coluna
COMMENT ON COLUMN companies.ai_criteria_weights IS 
'Pesos configuráveis para análise de IA. Estrutura: { technical_skills: 0-100, experience_years: 0-100, education: 0-100, specific_tools: 0-100, soft_skills: 0-100, languages: 0-100, enabled_criteria: string[], strictness_level: "flexible"|"balanced"|"strict" }';

-- 3. Atualizar empresas existentes com valores padrão (caso a coluna seja null)
UPDATE companies
SET ai_criteria_weights = '{
  "technical_skills": 40,
  "experience_years": 25,
  "education": 15,
  "specific_tools": 10,
  "soft_skills": 5,
  "languages": 5,
  "enabled_criteria": ["technical_skills", "experience_years", "education", "specific_tools", "soft_skills", "languages"],
  "strictness_level": "balanced"
}'::jsonb
WHERE ai_criteria_weights IS NULL;

-- 4. Verificar resultado
SELECT 
  id,
  company_name,
  ai_criteria_weights
FROM companies
LIMIT 5;
