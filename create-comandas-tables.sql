-- Criar tabela de comandas (mesas)
CREATE TABLE IF NOT EXISTS comandas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'open', -- open, closed, paid
  total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de itens da comanda
CREATE TABLE IF NOT EXISTS comanda_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comanda_id UUID REFERENCES comandas(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price NUMERIC NOT NULL,
  total NUMERIC GENERATED ALWAYS AS (quantity * price) STORED,
  status TEXT DEFAULT 'pending', -- pending, delivered, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda_id ON comanda_items(comanda_id);

-- Desabilitar RLS para evitar problemas de permissão durante o desenvolvimento (já usado no projeto)
ALTER TABLE comandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE comanda_items DISABLE ROW LEVEL SECURITY;

-- Retornar sucesso
SELECT 'Tabelas comandas e comanda_items criadas com sucesso!' as status;
