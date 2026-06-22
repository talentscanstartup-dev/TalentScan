-- =====================================================
-- TALENT SCAN — Migração: Análise de Match Vaga vs CV
-- Execute este script no editor SQL do Supabase
-- =====================================================

-- 1. Adicionar colunas para análise de compatibilidade em job_applications
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS compatibility_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compatibility_summary TEXT,
  ADD COLUMN IF NOT EXISTS strengths TEXT,
  ADD COLUMN IF NOT EXISTS concerns TEXT,
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detailed_analysis JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS skills_match JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience_analysis TEXT,
  ADD COLUMN IF NOT EXISTS education_analysis TEXT,
  ADD COLUMN IF NOT EXISTS recommendation TEXT,
  ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending' 
    CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed'));

-- 2. Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_job_applications_compatibility_score
  ON public.job_applications(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_analysis_status
  ON public.job_applications(analysis_status);

-- 3. Criar tabela de histórico de análises (opcional, para auditoria)
CREATE TABLE IF NOT EXISTS public.match_analyses_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  compatibility_score NUMERIC,
  compatibility_summary TEXT,
  strengths TEXT,
  concerns TEXT,
  full_analysis JSONB,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Índice para histórico
CREATE INDEX IF NOT EXISTS idx_match_analyses_application_id
  ON public.match_analyses_history(application_id);

-- 5. Trigger para atualizar updated_at
CREATE TRIGGER update_match_analyses_history_updated_at
  BEFORE UPDATE ON public.match_analyses_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Script SQL para visualizar candidaturas com análise
-- =====================================================
-- Use a query abaixo para ver os resultados:
/*
SELECT 
  ja.id,
  ja.applicant_name,
  ja.applicant_email,
  jp.title as job_title,
  ja.compatibility_score,
  ja.compatibility_summary,
  ja.strengths,
  ja.concerns,
  ja.analysis_status,
  ja.created_at,
  ja.updated_at
FROM public.job_applications ja
JOIN public.job_positions jp ON ja.job_position_id = jp.id
ORDER BY ja.compatibility_score DESC NULLS LAST;
*/
