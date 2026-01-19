-- Criar/atualizar tabela orders para suportar os últimos 2 pedidos

-- Remover tabela existente se houver
DROP TABLE IF EXISTS orders CASCADE;

-- Criar tabela orders com estrutura correta
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    change_for NUMERIC,
    address TEXT NOT NULL,
    observation TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

-- Desabilitar RLS para a tabela orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Inserir dados de teste
INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, items, total, payment_method, address, status) VALUES 
('SB123456', 'teste@exemplo.com', 'Cliente Teste', '(93) 99217-8154', 
'[{"name": "Pizza Calabresa", "quantity": 2, "size": "Grande", "price": 45.90}]', 
91.80, 'cash', 'Rua Teste, 123', 'delivered'),
('SB123457', 'demo@cardapio.com', 'Usuario Demo', '(93) 99217-8154', 
'[{"name": "Hamburger", "quantity": 1, "price": 25.00}]', 
25.00, 'pix', 'Rua Demo, 456', 'pending');

-- Confirmar criação
SELECT 'Tabela orders criada com sucesso!' as status,
       (SELECT COUNT(*) FROM orders) as total_orders;
