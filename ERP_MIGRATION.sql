-- =====================================================
-- TALENT SCAN - Migração do Módulo ERP
-- =====================================================

-- 1. Habilitar a extensão UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: Clientes da Empresa (erp_clients)
CREATE TABLE IF NOT EXISTS public.erp_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document TEXT, -- CNPJ ou CPF
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela: Estoque e Catálogo de Produtos/Serviços (erp_products)
CREATE TABLE IF NOT EXISTS public.erp_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    price NUMERIC DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    type TEXT DEFAULT 'product' CHECK (type IN ('product', 'service')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela: Oportunidades de Vendas / CRM (erp_sales)
CREATE TABLE IF NOT EXISTS public.erp_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.erp_clients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.erp_products(id) ON DELETE SET NULL,
    value NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'proposal', 'won', 'lost')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela: Transações Financeiras (erp_financial_transactions)
CREATE TABLE IF NOT EXISTS public.erp_financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    due_date DATE DEFAULT CURRENT_DATE,
    payment_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela: Funcionários / Recursos Humanos (erp_employees)
CREATE TABLE IF NOT EXISTS public.erp_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    department TEXT,
    salary NUMERIC DEFAULT 0,
    admission_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_vacation', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_erp_clients_user_id ON public.erp_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_products_user_id ON public.erp_products(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_user_id ON public.erp_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_sales_client_id ON public.erp_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_erp_financial_transactions_user_id ON public.erp_financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_employees_user_id ON public.erp_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_employees_candidate_id ON public.erp_employees(candidate_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.erp_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_employees ENABLE ROW LEVEL SECURITY;

-- Policies para erp_clients
CREATE POLICY "Users can manage their own erp_clients" 
  ON public.erp_clients FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_products
CREATE POLICY "Users can manage their own erp_products" 
  ON public.erp_products FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_sales
CREATE POLICY "Users can manage their own erp_sales" 
  ON public.erp_sales FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_financial_transactions
CREATE POLICY "Users can manage their own erp_financial_transactions" 
  ON public.erp_financial_transactions FOR ALL 
  USING (auth.uid() = user_id);

-- Policies para erp_employees
CREATE POLICY "Users can manage their own erp_employees" 
  ON public.erp_employees FOR ALL 
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
CREATE TRIGGER update_erp_clients_updated_at
  BEFORE UPDATE ON public.erp_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_products_updated_at
  BEFORE UPDATE ON public.erp_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_sales_updated_at
  BEFORE UPDATE ON public.erp_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_financial_transactions_updated_at
  BEFORE UPDATE ON public.erp_financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_erp_employees_updated_at
  BEFORE UPDATE ON public.erp_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
