-- =====================================================
-- TALENT SCAN - Scripts SQL para Supabase
-- =====================================================
-- Execute estes comandos no editor SQL do Supabase

-- 1. Tabela de Perfil de Usuários (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  company_name text,
  phone text,
  profile_picture_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Posições de Emprego
CREATE TABLE IF NOT EXISTS public.job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  required_skills jsonb DEFAULT '[]'::jsonb,
  experience_level text,
  salary_range text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de CVs Enviados
CREATE TABLE IF NOT EXISTS public.cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_name text NOT NULL,
  candidate_email text,
  candidate_phone text,
  file_url text NOT NULL,
  file_name text,
  file_size integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'analyzed', 'rejected')),
  raw_text text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Candidatos (dados extraídos dos CVs)
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id uuid NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  location text,
  professional_summary text,
  skills jsonb DEFAULT '[]'::jsonb,
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  languages jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  ai_score numeric DEFAULT 0,
  ai_analysis jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Matches (resultados da análise)
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_position_id uuid REFERENCES public.job_positions(id) ON DELETE SET NULL,
  match_score numeric DEFAULT 0,
  match_details jsonb,
  status text DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'shortlisted', 'rejected')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Integração com Telegram
CREATE TABLE IF NOT EXISTS public.telegram_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  telegram_chat_id text NOT NULL,
  telegram_user_id text,
  is_active boolean DEFAULT true,
  webhook_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Integração com Google Sheets
CREATE TABLE IF NOT EXISTS public.sheets_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sheet_id text NOT NULL,
  sheet_name text,
  access_token text ENCRYPTED,
  refresh_token text ENCRYPTED,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 8. Tabela de Atividades/Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_job_positions_user_id ON public.job_positions(user_id);
CREATE INDEX idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX idx_cvs_status ON public.cvs(status);
CREATE INDEX idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX idx_candidates_cv_id ON public.candidates(cv_id);
CREATE INDEX idx_matches_user_id ON public.matches(user_id);
CREATE INDEX idx_matches_candidate_id ON public.matches(candidate_id);
CREATE INDEX idx_matches_job_position_id ON public.matches(job_position_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_telegram_integration_user_id ON public.telegram_integration(user_id);
CREATE INDEX idx_sheets_integration_user_id ON public.sheets_integration(user_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies para users
CREATE POLICY "Users can view their own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Policies para job_positions
CREATE POLICY "Users can view their own job positions" 
  ON public.job_positions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create job positions" 
  ON public.job_positions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job positions" 
  ON public.job_positions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job positions" 
  ON public.job_positions FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies para cvs
CREATE POLICY "Users can view their own cvs" 
  ON public.cvs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create cvs" 
  ON public.cvs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cvs" 
  ON public.cvs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cvs" 
  ON public.cvs FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies para candidates
CREATE POLICY "Users can view their own candidates" 
  ON public.candidates FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create candidates" 
  ON public.candidates FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates" 
  ON public.candidates FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates" 
  ON public.candidates FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies para matches
CREATE POLICY "Users can view their own matches" 
  ON public.matches FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create matches" 
  ON public.matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own matches" 
  ON public.matches FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own matches" 
  ON public.matches FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies para telegram_integration
CREATE POLICY "Users can view their own telegram integration" 
  ON public.telegram_integration FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own telegram integration" 
  ON public.telegram_integration FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para sheets_integration
CREATE POLICY "Users can view their own sheets integration" 
  ON public.sheets_integration FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sheets integration" 
  ON public.sheets_integration FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para activity_logs
CREATE POLICY "Users can view their own activity logs" 
  ON public.activity_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_positions_updated_at
  BEFORE UPDATE ON public.job_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON public.cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_integration_updated_at
  BEFORE UPDATE ON public.telegram_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sheets_integration_updated_at
  BEFORE UPDATE ON public.sheets_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CRIAR PERFIL DO USUÁRIO AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
