-- =====================================================
-- TALENT SCAN - Migração para Role Based Access Control
-- =====================================================
-- Execute estes comandos no editor SQL do Supabase para adicionar RBAC

-- Adicionar coluna 'role' à tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'CLIENT' 
CHECK (role IN ('CLIENT', 'COMPANY', 'ADMIN'));

-- Adicionar coluna 'status' à tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'pending_approval', 'suspended', 'deleted'));

-- Adicionar coluna 'avatar_url' à tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Criar tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  cnpj text UNIQUE,
  industry text,
  company_size text,
  contact_email text,
  contact_phone text,
  description text,
  website text,
  logo_url text,
  status text DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'suspended')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Adicionar coluna company_id à tabela users para vincular funcionários à empresa
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- Criar tabela de audit logs detalhada
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =====================================================
-- BUCKET STORAGE para Avatars e Empresas
-- =====================================================

-- Criar bucket para perfis (avatares)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT DO NOTHING;

-- Criar bucket para documentos de empresa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('companies', 'companies', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Política para tabela users
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Política para tabela companies
CREATE POLICY "Company owners can view their company" ON public.companies
  FOR SELECT USING (auth.uid() = owner_id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- Política para tabela audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
