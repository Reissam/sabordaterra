import React, { useState } from 'react';
import { X, User, Mail, Lock, MapPin, Phone, Eye, EyeOff, Package } from 'lucide-react';
import { Customer } from '../../lib/types';
import { supabase } from '../lib/supabase';
import CustomerOrders from './CustomerOrders';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onLoginSuccess?: (customer: Customer) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSave, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showOrders, setShowOrders] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  // Carregar clientes do localStorage
  React.useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const cleaned = value.replace(/\D/g, '');

    // Formatação para telefone brasileiro
    if (cleaned.length <= 2) {
      return `(${cleaned}`;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else {
      // Limita a 11 dígitos (com DDD)
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formattedPhone });
  };

  const handlePasswordRecovery = async () => {
    if (!formData.email) {
      alert('Por favor, digite seu email para recuperar a senha!');
      return;
    }

    try {
      // Tentar buscar cliente usando a função personalizada
      const { data, error } = await supabase
        .rpc('get_customer_by_email', {
          email_param: formData.email
        });

      if (error || !data || data.length === 0) {
        // Fallback: tentar busca direta
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('customers')
          .select('name, email, phone')
          .eq('email', formData.email)
          .single();

        if (fallbackError || !fallbackData) {
          alert('Email não encontrado em nosso sistema!\n\n' +
            'Verifique se o email está correto ou entre em contato.');
          return;
        }

        // Simular envio de email com dados do fallback
        alert(`📧 Email de recuperação enviado para ${formData.email}\n\n` +
          `Olá ${fallbackData.name},\n` +
          `Recebemos sua solicitação de recuperação de senha.\n\n` +
          `📞 Telefone cadastrado: ${fallbackData.phone}\n\n` +
          `Em um ambiente real, você receberia um link para redefinir sua senha.\n\n` +
          `⚠️ Por segurança, sua senha atual não será alterada.`);
        return;
      }

      // Simular envio de email com dados da função RPC
      const customer = data[0];
      alert(`📧 Email de recuperação enviado para ${formData.email}\n\n` +
        `Olá ${customer.name},\n` +
        `Recebemos sua solicitação de recuperação de senha.\n\n` +
        `📞 Telefone cadastrado: ${customer.phone}\n\n` +
        `Em um ambiente real, você receberia um link para redefinir sua senha.\n\n` +
        `⚠️ Por segurança, sua senha atual não será alterada.`);

    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      alert('Erro ao processar recuperação de senha.\n\n' +
        'Tente novamente ou entre em contato com o suporte.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert('Por favor, preencha email e senha!');
      return;
    }

    try {
      // Tentar login via Supabase Auth (recomendado)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (!authError && authData?.user) {
        // Se login via Auth funcionar, buscar dados do cliente
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (!customerError && customerData) {
          alert('Login realizado com sucesso!');
          localStorage.setItem('rememberedCustomer', JSON.stringify(customerData));
          if (onLoginSuccess) {
            onLoginSuccess(customerData);
          }
          onClose();
          return;
        }
      }

      // Fallback: Buscar diretamente na tabela (se RLS permitir)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', formData.email)
        .eq('password', formData.password)
        .single();

      if (error) {
        console.error('Erro ao buscar cliente no Supabase:', error);
        console.log('Tentando fallback para localStorage...');

        // Fallback para localStorage
        const customer = customers.find(c =>
          c.email === formData.email && c.password === formData.password
        );

        if (customer) {
          alert('Login realizado com sucesso (dados locais)!');
          localStorage.setItem('rememberedCustomer', JSON.stringify(customer));
          setLoggedInEmail(customer.email);
          if (onLoginSuccess) {
            onLoginSuccess(customer);
          }
          onClose();
        } else {
          alert('Email ou senha incorretos!');
        }
      } else {
        alert('Login realizado com sucesso!');
        localStorage.setItem('rememberedCustomer', JSON.stringify(data));
        setLoggedInEmail(data.email);
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Tente novamente.');
    }
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.password) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (!validatePhone(formData.phone)) {
      alert('Por favor, insira um número de telefone válido no formato (93) 99217-8154 ou (96) 92027-0750!');
      return;
    }

    try {
      // Salvar no Supabase
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar cliente no Supabase:', error);

        // Fallback: Salvar na lista local para permitir login futuro
        const newCustomerLocal = { ...formData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updatedCustomers = [...customers, newCustomerLocal];
        setCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));

        // Salvar sessão atual
        localStorage.setItem('rememberedCustomer', JSON.stringify(newCustomerLocal));

        onSave(formData);
        console.log('Cliente salvo localmente (Fallback).');
      } else {
        // Salvar no localStorage também (Backup/Cache)
        const updatedCustomers = [...customers, data];
        setCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));

        localStorage.setItem('rememberedCustomer', JSON.stringify(data));
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
        alert('Cadastro realizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);

      // Mesmo fallback do erro acima
      const newCustomerLocal = { ...formData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      const updatedCustomers = [...customers, newCustomerLocal];
      setCustomers(updatedCustomers);
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));

      localStorage.setItem('rememberedCustomer', JSON.stringify(newCustomerLocal));

      onSave(formData);
    }

    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            {isLogin ? 'Fazer Login' : 'Cadastrar Dados'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botões de alternância */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!isLogin
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Cadastrar
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${isLogin
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            Entrar
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSubmit} className="space-y-4">
          {/* Campos de Login */}
          {isLogin ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Senha:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                    placeholder="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Link de Recuperação de Senha */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handlePasswordRecovery}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Campos de Cadastro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Digite seu nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email:
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone:
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(93) 99217-8154"
                  required
                  maxLength={15}
                  pattern="\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}"
                  title="Formato: (93) 99217-8154 ou (96) 92027-0750"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Endereço:
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Rua, número, bairro..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Senha:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                    placeholder="Digite uma senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>

          {/* Botão Meus Pedidos - apenas no modo login */}
          {isLogin && (
            <button
              type="button"
              onClick={() => {
                if (formData.email) {
                  setLoggedInEmail(formData.email);
                  setShowOrders(true);
                } else {
                  alert('Digite seu email para consultar seus pedidos');
                }
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Meus Pedidos
            </button>
          )}
        </form>

        {/* Modal de Pedidos */}
        {showOrders && (
          <CustomerOrders
            customerEmail={loggedInEmail}
            onClose={() => setShowOrders(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerFormModal;
