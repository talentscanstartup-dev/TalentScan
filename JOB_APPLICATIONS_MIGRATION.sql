-- =====================================================
-- TALENT SCAN — Migração: Vagas Empresas
-- Execute este script no editor SQL do Supabase
-- =====================================================

-- 1. Adicionar colunas em job_positions (se não existirem)
ALTER TABLE public.job_positions
  ADD COLUMN IF NOT EXISTS requirements text,
  ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'CLT';

-- Adicionar constraint de check (ignorar se já existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'job_positions' AND constraint_name = 'job_positions_employment_type_check'
  ) THEN
    ALTER TABLE public.job_positions
      ADD CONSTRAINT job_positions_employment_type_check
      CHECK (employment_type IN ('CLT', 'PJ', 'Híbrido', 'Freelancer', 'Estágio'));
  END IF;
END $$;

-- 2. Nova tabela de candidaturas a vagas empresas
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_position_id uuid NOT NULL REFERENCES public.job_positions(id) ON DELETE CASCADE,
  applicant_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  cv_file_url text NOT NULL,
  cv_file_name text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id
  ON public.job_applications(job_position_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
  ON public.job_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_email
  ON public.job_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status
  ON public.job_applications(status);

-- 4. RLS na nova tabela
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode se candidatar
CREATE POLICY "Authenticated users can apply to jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Candidato vê suas próprias candidaturas
CREATE POLICY "Applicants can view own applications"
  ON public.job_applications FOR SELECT
  USING (applicant_user_id = auth.uid());

-- Empresa vê candidatos de suas vagas
CREATE POLICY "Company can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (
    job_position_id IN (
      SELECT id FROM public.job_positions WHERE user_id = auth.uid()
    )
  );

-- Empresa pode atualizar status das candidaturas
CREATE POLICY "Company can update application status"
  ON public.job_applications FOR UPDATE
  USING (
    job_position_id IN (
      SELECT id FROM public.job_positions WHERE user_id = auth.uid()
    )
  );

-- 5. Trigger updated_at para job_applications
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Política pública para vagas ativas (candidatos e visitantes podem ver)
-- ATENÇÃO: Se já existe a policy "Users can view their own job positions",
-- pode ser necessário removê-la antes: DROP POLICY IF EXISTS "Users can view their own job positions" ON public.job_positions;
CREATE POLICY IF NOT EXISTS "Anyone can view active job positions"
  ON public.job_positions FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

-- =====================================================
-- STORAGE: Criar bucket job-applications
-- (Execute manualmente no painel Storage do Supabase
--  ou via API. O SQL abaixo é para referência.)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'job-applications',
--   'job-applications',
--   false,
--   10485760,  -- 10MB
--   ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- ) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (execute depois de criar o bucket)
-- CREATE POLICY "Authenticated upload to job-applications"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'job-applications' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Authenticated read from job-applications"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'job-applications' AND auth.uid() IS NOT NULL);
