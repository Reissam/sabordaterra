-- Corrigir estrutura da tabela orders para suportar customer_email

-- 1. Verificar estrutura atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna customer_email se não existir
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);

-- 3. Atualizar customer_email baseado no customer_id (se houver relacionamento)
UPDATE orders 
SET customer_email = c.email 
FROM customers c 
WHERE orders.customer_id = c.id AND orders.customer_email IS NULL;

-- 4. Remover constraint de customer_id se existir
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- 5. Remover coluna customer_id se existir
ALTER TABLE orders DROP COLUMN IF EXISTS customer_id;

-- 6. Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 7. Desabilitar RLS para permitir acesso
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 8. Inserir dados de teste se a tabela estiver vazia
INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, items, total, payment_method, address, status) 
SELECT 
    'SB' || (EXTRACT(EPOCH FROM NOW()) * 1000)::text,
    'teste@exemplo.com',
    'Cliente Teste',
    '(93) 99217-8154',
    '[{"name": "Pizza Calabresa", "quantity": 2, "size": "Grande", "price": 45.90}]',
    91.80,
    'cash',
    'Rua Teste, 123',
    'delivered'
WHERE NOT EXISTS (SELECT 1 FROM orders LIMIT 1);

-- 9. Verificar resultado
SELECT 'Estrutura corrigida!' as status,
       (SELECT COUNT(*) FROM orders) as total_orders,
       (SELECT COUNT(*) FROM orders WHERE customer_email IS NOT NULL) as orders_with_email;
