# 🔧 Como Ajustar as Políticas RLS no Supabase

## 📋 Passos para Corrigir o Problema de Login

### 1️⃣ Acessar o Supabase Dashboard

1. Abra https://supabase.com/dashboard
2. Selecione seu projeto: `cmycijkqopwnnlxllmap`
3. Vá para **SQL Editor** no menu lateral

### 2️⃣ Executar o Script de Correção

Copie e cole todo o conteúdo do arquivo `fix-rls-complete.sql` no SQL Editor:

```sql
-- Script completo para ajustar políticas RLS e permitir operações

-- 1. Remover todas as políticas existentes da tabela customers
DROP POLICY IF EXISTS "Enable insert for all users" ON customers;
DROP POLICY IF EXISTS "Enable select for all users" ON customers;
DROP POLICY IF EXISTS "Enable update for all users" ON customers;
DROP POLICY IF EXISTS "Enable delete for all users" ON customers;

-- 2. Habilitar RLS na tabela customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas permissivas para desenvolvimento
CREATE POLICY "Enable insert for all users" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON customers
    FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON customers
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON customers
    FOR DELETE USING (true);

-- ... (restante do script)
```

### 3️⃣ Executar em Etapas

**Opção A: Executar Tudo de Uma Vez**
- Clique em **Run** para executar o script completo
- Aguarde a confirmação: `Políticas RLS ajustadas com sucesso!`

**Opção B: Executar Passo a Passo**
1. **Remover políticas antigas** (primeiras linhas)
2. **Habilitar RLS** 
3. **Criar novas políticas** (uma por uma)
4. **Inserir dados de teste**

### 4️⃣ Verificar Resultado

Após executar, teste com:

**Credenciais de Teste:**
- 📧 `teste@exemplo.com` | 🔒 `senha123`
- 📧 `demo@cardapio.com` | 🔒 `demo`

### 5️⃣ Validar Funcionalidades

✅ **Login deve funcionar** via Supabase  
✅ **Cadastro deve salvar** no banco  
✅ **Recuperação de senha** deve encontrar usuários  
✅ **Pedidos devem salvar** na tabela orders  

---

## 🚨 Solução Temporária (Enquanto ajusta)

Se precisar usar imediatamente, execute no console do navegador:

```javascript
// Criar usuários de teste
localStorage.setItem('customers', JSON.stringify([
  {
    id: '1',
    name: 'Cliente Teste',
    email: 'teste@exemplo.com',
    phone: '(93) 99217-8154',
    address: 'Rua Teste, 123',
    password: 'senha123',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Usuario Demo',
    email: 'demo@cardapio.com',
    phone: '(93) 99217-8154',
    address: 'Rua Demo, 456',
    password: 'demo',
    createdAt: new Date().toISOString()
  }
]));

console.log('✅ Usuários criados! Recarregue a página.');
```

---

## 📞 Suporte

Se tiver dificuldades:
1. **Verifique o console** para erros específicos
2. **Confirme as variáveis de ambiente** no `.env`
3. **Teste a conexão** com o script `test-supabase.js`

**Após ajustar o RLS, o sistema funcionará 100% com Supabase!** 🎉
