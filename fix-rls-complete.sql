-- Script completo para ajustar políticas RLS e permitir operações

-- 1. Remover todas as políticas existentes da tabela customers
DROP POLICY IF EXISTS "Enable insert for all users" ON customers;
DROP POLICY IF EXISTS "Enable select for all users" ON customers;
DROP POLICY IF EXISTS "Enable update for all users" ON customers;
DROP POLICY IF EXISTS "Enable delete for all users" ON customers;
DROP POLICY IF EXISTS "customers_insert_policy" ON customers;
DROP POLICY IF EXISTS "customers_select_policy" ON customers;
DROP POLICY IF EXISTS "customers_update_policy" ON customers;
DROP POLICY IF EXISTS "customers_delete_policy" ON customers;

-- 2. Habilitar RLS na tabela customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas permissivas para desenvolvimento
-- Política para INSERT (qualquer um pode inserir)
CREATE POLICY "Enable insert for all users" ON customers
    FOR INSERT WITH CHECK (true);

-- Política para SELECT (qualquer um pode ler)
CREATE POLICY "Enable select for all users" ON customers
    FOR SELECT USING (true);

-- Política para UPDATE (qualquer um pode atualizar)
CREATE POLICY "Enable update for all users" ON customers
    FOR UPDATE USING (true) WITH CHECK (true);

-- Política para DELETE (qualquer um pode deletar)
CREATE POLICY "Enable delete for all users" ON customers
    FOR DELETE USING (true);

-- 4. Ajustar tabela orders também
DROP POLICY IF EXISTS "Enable insert for all users" ON orders;
DROP POLICY IF EXISTS "Enable select for all users" ON orders;
DROP POLICY IF EXISTS "Enable update for all users" ON orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Enable insert for all users" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON orders
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON orders
    FOR DELETE USING (true);

-- 5. Garantir estrutura correta da tabela customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS address TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS password TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 7. Inserir dados de teste se a tabela estiver vazia
INSERT INTO customers (name, email, phone, address, password) VALUES 
('Cliente Teste', 'teste@exemplo.com', '(93) 99217-8154', 'Rua Teste, 123 - Centro', 'senha123'),
('Usuario Demo', 'demo@cardapio.com', '(93) 99217-8154', 'Rua Demo, 456 - Bairro', 'demo')
ON CONFLICT (email) DO NOTHING;

-- 8. Criar função para recuperação de senha (opcional)
CREATE OR REPLACE FUNCTION public.get_customer_by_email(email_param TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.email, c.phone, c.address, c.created_at, c.updated_at
    FROM customers c
    WHERE c.email = email_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Confirmar mudanças
SELECT 'Políticas RLS ajustadas com sucesso!' as status,
       'Tabelas customers e orders liberadas para operações' as message,
       (SELECT COUNT(*) FROM customers) as total_customers;
