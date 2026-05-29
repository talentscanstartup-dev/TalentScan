-- DATABASE SCHEMA - RBAC System
-- PostgreSQL / Supabase

-- ===== ENUM TYPES =====
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'COMPANY', 'CLIENT');
CREATE TYPE company_status AS ENUM ('pending_approval', 'approved', 'rejected', 'suspended');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE notification_type AS ENUM ('approval_status', 'account_created', 'suspension', 'system_alert');

-- ===== USERS TABLE =====
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CLIENT',
  status VARCHAR(50) DEFAULT 'active',
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- ===== COMPANIES TABLE =====
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) UNIQUE,
  tax_id VARCHAR(50),
  website VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  status company_status DEFAULT 'pending_approval',
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  logo_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  CONSTRAINT company_name_not_empty CHECK (length(trim(company_name)) > 0)
);

-- ===== APPROVAL REQUESTS TABLE =====
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status approval_status DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  UNIQUE(company_id, status) WHERE status = 'pending'
);

-- ===== COMPANY MEMBERS TABLE =====
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status VARCHAR(50) DEFAULT 'active',
  UNIQUE(company_id, user_id)
);

-- ===== ROLES & PERMISSIONS TABLE =====
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role UNIQUE NOT NULL,
  description TEXT,
  can_approve_companies BOOLEAN DEFAULT false,
  can_view_all_users BOOLEAN DEFAULT false,
  can_manage_system BOOLEAN DEFAULT false,
  can_upload_cv BOOLEAN DEFAULT false,
  can_access_analytics BOOLEAN DEFAULT false,
  can_manage_company BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days')
);

-- ===== AUDIT LOG TABLE =====
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  INDEX_ON (created_at, user_id, action)
);

-- ===== INDEXES =====
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_companies_owner_id ON companies(owner_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_created_at ON companies(created_at);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_company_id ON approval_requests(company_id);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ===== ROW LEVEL SECURITY (RLS) =====

-- Users: Each user can only view/update their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id OR 
         (SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Companies: Can be viewed by members and SUPER_ADMIN
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies viewable by members and super admin"
  ON companies FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_id = companies.id 
      AND user_id = auth.uid()
    ) OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

CREATE POLICY "Only company owner can update company"
  ON companies FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Approval Requests: Only SUPER_ADMIN can access
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can view all approval requests"
  ON approval_requests FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN');

CREATE POLICY "Company owner can view their own request"
  ON approval_requests FOR SELECT
  USING (user_id = auth.uid());

-- Notifications: Users see only their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit Logs: Only SUPER_ADMIN can view
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admin can view audit logs"
  ON audit_logs FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'SUPER_ADMIN');

-- ===== TRIGGERS =====

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create company_members when company status changes to approved
CREATE OR REPLACE FUNCTION auto_add_company_owner_to_members()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO company_members (company_id, user_id, role, is_admin)
    VALUES (NEW.id, NEW.owner_id, 'owner', true)
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_company_owner_on_approval
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_company_owner_to_members();

-- Create audit log on important actions
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, status)
    VALUES (
      auth.uid(),
      CASE WHEN TG_TABLE_NAME = 'companies' AND NEW.status IS DISTINCT FROM OLD.status THEN 'company_status_changed' ELSE 'updated' END,
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      ),
      'success'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_company_changes
  AFTER UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Insert default roles
INSERT INTO roles (name, description, can_approve_companies, can_view_all_users, can_manage_system)
VALUES 
  ('SUPER_ADMIN', 'System administrator with full access', true, true, true),
  ('COMPANY', 'Company account with company management permissions', false, false, false),
  ('CLIENT', 'Client account with basic permissions', false, false, false)
ON CONFLICT (name) DO NOTHING;
