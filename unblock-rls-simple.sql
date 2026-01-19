-- Script SIMPLES para desbloquear RLS imediatamente

-- 1. Desabilitar completamente RLS (mais rápido)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. Inserir dados de teste imediatamente
INSERT INTO customers (name, email, phone, address, password) VALUES 
('Cliente Teste', 'teste@exemplo.com', '(93) 99217-8154', 'Rua Teste, 123', 'senha123'),
('Usuario Demo', 'demo@cardapio.com', '(93) 99217-8154', 'Rua Demo, 456', 'demo')
ON CONFLICT (email) DO NOTHING;

-- 3. Verificar resultado
SELECT 'RLS DESABILITADO com sucesso!' as status,
       (SELECT COUNT(*) FROM customers) as total_customers,
       'Use: teste@exemplo.com / senha123 ou demo@cardapio.com / demo' as instructions;
