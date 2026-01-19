-- Criar tabela de settings para armazenar configurações globais
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  logo_url TEXT,
  restaurant_name TEXT,
  restaurant_description TEXT,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO settings (id, restaurant_name, restaurant_description, contact_phone, contact_whatsapp, address)
VALUES (
  'main',
  'Restaurante Sabor da Terra',
  'Cardápio Virtual',
  '(93) 99184-9036',
  '559620270750',
  'TRAV. DOUTO LOUREIRO, 257 - Centro, Monte Alegre - PA'
) ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Allow public read" ON settings
FOR SELECT USING (true);

-- Política para permitir atualização apenas para admins
CREATE POLICY "Allow admin update" ON settings
FOR UPDATE USING (true);

-- Política para permitir inserção apenas para admins
CREATE POLICY "Allow admin insert" ON settings
FOR INSERT WITH CHECK (true);
