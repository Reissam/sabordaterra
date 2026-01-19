-- Script para corrigir políticas RLS da tabela customers

-- 1. Remover todas as políticas existentes
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- 2. Desabilitar RLS temporariamente para testes
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS com política permissiva (para desenvolvimento)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política que permite todas as operações (apenas para desenvolvimento!)
CREATE POLICY "customers_dev_policy" ON customers
    FOR ALL USING (true)
    WITH CHECK (true);

-- 4. Garantir que a tabela tenha as colunas corretas
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS address TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 6. Inserir dados de teste (se necessário)
INSERT INTO customers (name, email, phone, address, password) VALUES 
('Cliente Teste', 'teste@exemplo.com', '(93) 99217-8154', 'Rua Teste, 123', 'senha123')
ON CONFLICT (email) DO NOTHING;

-- Confirmação
SELECT 'Tabela customers configurada com sucesso!' as status;
