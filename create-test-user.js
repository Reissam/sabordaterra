// Script para criar usuário de teste no localStorage
localStorage.setItem('customers', JSON.stringify([
  {
    id: '1',
    name: 'Cliente Teste',
    email: 'teste@exemplo.com',
    phone: '(93) 99217-8154',
    address: 'Rua Teste, 123 - Centro',
    password: 'senha123',
    createdAt: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Usuario Demo',
    email: 'demo@cardapio.com',
    phone: '(93) 99217-8154',
    address: 'Rua Demo, 456 - Bairro',
    password: 'demo',
    createdAt: new Date().toISOString()
  }
]));

console.log('✅ Usuários de teste criados no localStorage!');
console.log('📧 Email: teste@exemplo.com | Senha: senha123');
console.log('📧 Email: demo@cardapio.com | Senha: demo');
console.log('\n🔄 Recarregue a página e use estes dados para testar o login.');
