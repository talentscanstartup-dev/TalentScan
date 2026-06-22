-- =====================================================
-- TALENT SCAN - Migração de Expansão do Módulo ERP & HR
-- =====================================================

-- 1. Tabela: Folhas de Pagamento Realizadas (erp_payrolls)
CREATE TABLE IF NOT EXISTS public.erp_payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reference_month TEXT NOT NULL, -- Ex: "06/2026"
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'processed' CHECK (status IN ('draft', 'processed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela: Documentos Admissionais de Colaboradores (erp_employee_documents)
CREATE TABLE IF NOT EXISTS public.erp_employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.erp_employees(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('RG', 'CPF', 'Comprovante Residência', 'Contrato Assinado')),
    file_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela: Metas e OKRs (erp_okrs)
CREATE TABLE IF NOT EXISTS public.erp_okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.erp_employees(id) ON DELETE SET NULL, -- Se associado a funcionário
    department TEXT, -- Se associado a departamento
    title TEXT NOT NULL,
    target_value NUMERIC DEFAULT 100,
    current_value NUMERIC DEFAULT 0,
    bonus_value NUMERIC DEFAULT 0, -- Valor de recompensa financeira
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_erp_payrolls_user_id ON public.erp_payrolls(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_employee_documents_employee_id ON public.erp_employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_erp_okrs_user_id ON public.erp_okrs(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.erp_payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_okrs ENABLE ROW LEVEL SECURITY;

-- Policies para erp_payrolls
CREATE POLICY "Users can manage their own erp_payrolls" 
  ON public.erp_payrolls FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_employee_documents
CREATE POLICY "Users can manage their own erp_employee_documents" 
  ON public.erp_employee_documents FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_okrs
CREATE POLICY "Users can manage their own erp_okrs" 
  ON public.erp_okrs FOR ALL 
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
CREATE TRIGGER update_erp_employee_documents_updated_at
  BEFORE UPDATE ON public.erp_employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_okrs_updated_at
  BEFORE UPDATE ON public.erp_okrs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
