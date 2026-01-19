// Script para testar conexão com Supabase
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Testar conexão
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Testar consulta simples
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .single();
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Dados:', data);
    
    // Testar inserção
    console.log('🧪 Testando inserção de cliente...');
    const testCustomer = {
      name: 'Cliente Teste',
      email: `teste${Date.now()}@email.com`,
      phone: '(96) 98765-4321',
      address: 'Endereço de Teste, 123',
      password: 'senha123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('customers')
      .insert(testCustomer)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      return false;
    }
    
    console.log('✅ Cliente inserido com sucesso!');
    console.log('👤 Dados do cliente:', insertData);
    
    // Testar consulta de clientes
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Erro na consulta:', fetchError);
      return false;
    }
    
    console.log('📋 Lista de clientes:');
    console.table(customers);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar teste
testSupabaseConnection().then(success => {
  if (success) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log('💥 Alguns testes falharam!');
  }
});
