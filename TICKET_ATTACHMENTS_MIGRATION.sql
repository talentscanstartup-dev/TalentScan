-- Tabela para armazenar anexos dos tickets
-- Execute este script no Supabase SQL Editor para criar a tabela

-- 1. Criar tabela de anexos
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  filename text NOT NULL,
  original_name text NOT NULL,
  mimetype text NOT NULL,
  size bigint NOT NULL,
  path text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id 
  ON ticket_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_created_at 
  ON ticket_attachments(created_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
-- Permitir que usuários vejam anexos de seus próprios tickets
CREATE POLICY "Users can view their own ticket attachments"
  ON ticket_attachments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid()
    )
  );

-- Permitir que usuários deletem anexos de seus próprios tickets
CREATE POLICY "Users can delete their own ticket attachments"
  ON ticket_attachments
  FOR DELETE
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid()
    )
  );

-- Permitir que usuários façam upload em seus próprios tickets
CREATE POLICY "Users can insert attachments to their own tickets"
  ON ticket_attachments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM support_tickets 
      WHERE user_id = auth.uid()
    )
  );

-- 5. Atualizar tabela support_tickets se necessário (adicionar coluna attachments_count)
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS attachments_count integer DEFAULT 0;

-- 6. Criar trigger para atualizar attachments_count automaticamente
CREATE OR REPLACE FUNCTION update_ticket_attachments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE support_tickets 
    SET attachments_count = attachments_count + 1
    WHERE id = NEW.ticket_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE support_tickets 
    SET attachments_count = GREATEST(0, attachments_count - 1)
    WHERE id = OLD.ticket_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger
DROP TRIGGER IF NOT EXISTS update_ticket_attachments_count_trigger 
  ON ticket_attachments;

CREATE TRIGGER update_ticket_attachments_count_trigger
AFTER INSERT OR DELETE ON ticket_attachments
FOR EACH ROW
EXECUTE FUNCTION update_ticket_attachments_count();

-- 8. Comentários
COMMENT ON TABLE ticket_attachments 
  IS 'Armazena anexos (fotos, documentos) dos tickets de suporte';
COMMENT ON COLUMN ticket_attachments.filename 
  IS 'Nome único do arquivo no servidor';
COMMENT ON COLUMN ticket_attachments.original_name 
  IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN ticket_attachments.mimetype 
  IS 'Tipo MIME do arquivo (image/jpeg, application/pdf, etc.)';
COMMENT ON COLUMN ticket_attachments.size 
  IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN ticket_attachments.path 
  IS 'Caminho do arquivo para download';
