-- Criação da tabela products (se não existir)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  type TEXT NOT NULL, -- 'food' ou 'drink'
  category TEXT, -- 'food' ou 'drink'
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar acesso público (desabilitar RLS por enquanto, padrão do projeto)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Limpar dados existentes (opcional, para garantir sincronia)
TRUNCATE TABLE products;

-- Inserir Comidas (FoodMenu)
INSERT INTO products (name, price, type, category) VALUES
('PIRARUCU FRITO', 20.00, 'food', 'food'),
('BIFE DE FIGADO', 18.00, 'food', 'food'),
('LINGUA GUISADA', 18.00, 'food', 'food'),
('PORCO GUISADO', 18.00, 'food', 'food'),
('CARNEIRO GUISADO', 18.00, 'food', 'food'),
('COSTELA GUISADA', 18.00, 'food', 'food'),
('COZIDAO DE CARNE', 18.00, 'food', 'food'),
('FRANGO A PASSARINHO', 18.00, 'food', 'food'),
('CARNE DE SOL', 18.00, 'food', 'food');

-- Inserir Bebidas (DrinkMenu)
INSERT INTO products (name, price, type, category) VALUES
('Coca-Cola Lata (350ml)', 4.50, 'drink', 'drink'),
('Coca-Cola 1,5L', 8.90, 'drink', 'drink'),
('Coca-Cola 2L', 10.90, 'drink', 'drink'),
('Fanta Laranja Lata (350ml)', 4.50, 'drink', 'drink'),
('Fanta Laranja 2L', 9.90, 'drink', 'drink'),
('Guaraná Antarctica Lata (350ml)', 4.50, 'drink', 'drink'),
('Guaraná Antarctica 2L', 9.90, 'drink', 'drink'),
('Sprite Lata (350ml)', 4.50, 'drink', 'drink'),
('Sprite 2L', 9.90, 'drink', 'drink'),
('Água Mineral (500ml)', 3.00, 'drink', 'drink'),
('Suco Natural Laranja (300ml)', 6.90, 'drink', 'drink'),
('Suco Natural Limão (300ml)', 6.90, 'drink', 'drink'),
('Cerveja Skol Lata (350ml)', 4.90, 'drink', 'drink'),
('Cerveja Brahma Lata (350ml)', 4.90, 'drink', 'drink'),
('Suco de Uva Integral (300ml)', 7.90, 'drink', 'drink');
