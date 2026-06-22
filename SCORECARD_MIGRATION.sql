-- 1. Habilitar a extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: Critérios de Avaliação (Scorecard Templates)
CREATE TABLE public.scorecard_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    criteria_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela: Avaliações dos Candidatos (Candidate Evaluations)
CREATE TABLE public.candidate_evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    scorecard_template_id UUID NOT NULL REFERENCES public.scorecard_templates(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (candidate_id, scorecard_template_id, evaluator_id)
);

-- 4. Índices para performance
CREATE INDEX idx_scorecard_job_id ON public.scorecard_templates(job_id);
CREATE INDEX idx_evaluations_candidate_id ON public.candidate_evaluations(candidate_id);

-- 5. Row Level Security (RLS)
ALTER TABLE public.scorecard_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_evaluations ENABLE ROW LEVEL SECURITY;

-- Sugestões de Políticas (Adapte conforme suas necessidades de RBAC):
-- Empresas podem ler e criar templates das suas próprias vagas
-- Recrutadores podem criar avaliações para as vagas em que têm acesso
