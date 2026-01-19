-- COLE E EXECUTE ESTE SCRIPT AGORA MESMO!

-- 1. Desabilitar RLS completamente
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se o email existe
SELECT 'Verificando email leumaxreis@gmail.com...' as status;

-- 3. Inserir o usuário se não existir
INSERT INTO customers (name, email, phone, address, password) VALUES 
('Leumax Reis', 'leumaxreis@gmail.com', '(93) 99217-8154', 'Rua do Cliente, 123', 'senha123')
ON CONFLICT (email) DO NOTHING;

-- 4. Mostrar resultado
SELECT COUNT(*) as total_customers FROM customers;
SELECT * FROM customers WHERE email = 'leumaxreis@gmail.com';
