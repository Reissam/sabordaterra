-- Criar tabela de garçons
CREATE TABLE IF NOT EXISTS waiters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE waiters DISABLE ROW LEVEL SECURITY;

-- Adicionar colunas na tabela de comandas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comandas' AND column_name = 'waiter_id') THEN
        ALTER TABLE comandas ADD COLUMN waiter_id UUID REFERENCES waiters(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comandas' AND column_name = 'closing_requested') THEN
        ALTER TABLE comandas ADD COLUMN closing_requested BOOLEAN DEFAULT false;
    END IF;
END $$;
