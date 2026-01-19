import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Lock, ShoppingBag, Clock, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  created_at?: string;
  updated_at?: string;
}

interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  items: any;
  total: number;
  payment_method: string;
  change_for?: number;
  address: string;
  observation?: string;
  status: string;
  created_at: string;
}

interface CustomerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerPanel: React.FC<CustomerPanelProps> = ({ isOpen, onClose, customer }) => {
  const [lastOrders, setLastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (isOpen && customer) {
      fetchLastOrders();
    }
  }, [isOpen, customer]);

  const fetchLastOrders = async () => {
    try {
      console.log('Buscando pedidos para:', customer?.email);
      
      // Tentar buscar por customer_email primeiro
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', customer?.email)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        console.error('Erro ao buscar pedidos por email:', error);
        
        // Tentar buscar por customer_id como fallback
        const { data: dataById, error: errorById } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customer?.id)
          .order('created_at', { ascending: false })
          .limit(2);

        if (errorById) {
          console.error('Erro ao buscar pedidos por ID:', errorById);
          throw errorById;
        }
        
        console.log('Pedidos encontrados por ID:', dataById);
        setLastOrders(dataById || []);
      } else {
        console.log('Pedidos encontrados por email:', data);
        setLastOrders(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos no Supabase:', error);
      
      // Fallback para localStorage
      console.log('Usando fallback localStorage...');
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        try {
          const orders = JSON.parse(savedOrders);
          const customerOrders = orders.filter((o: any) => 
            o.customerEmail === customer?.email || o.customer_email === customer?.email
          );
          console.log('Pedidos do localStorage:', customerOrders);
          setLastOrders(customerOrders.slice(-2).reverse());
        } catch (parseError) {
          console.error('Erro ao parse localStorage:', parseError);
          setLastOrders([]);
        }
      } else {
        console.log('Nenhum pedido encontrado no localStorage');
        setLastOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }

    if (newPassword.length < 4) {
      alert('A senha deve ter pelo menos 4 caracteres!');
      return;
    }

    // Verificar senha atual
    if (currentPassword !== customer?.password) {
      alert('Senha atual incorreta!');
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ password: newPassword, updated_at: new Date().toISOString() })
        .eq('id', customer?.id);

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        // Fallback para localStorage
        const savedCustomers = localStorage.getItem('customers');
        if (savedCustomers) {
          const customers = JSON.parse(savedCustomers);
          const updatedCustomers = customers.map((c: Customer) => 
            c.id === customer?.id ? { ...c, password: newPassword } : c
          );
          localStorage.setItem('customers', JSON.stringify(updatedCustomers));
          localStorage.setItem('rememberedCustomer', JSON.stringify({ ...customer, password: newPassword }));
        }
        alert('Senha atualizada com sucesso!');
      } else {
        // Atualizar localStorage também
        const rememberedCustomer = localStorage.getItem('rememberedCustomer');
        if (rememberedCustomer) {
          const remembered = JSON.parse(rememberedCustomer);
          localStorage.setItem('rememberedCustomer', JSON.stringify({ ...remembered, password: newPassword }));
        }
        alert('Senha atualizada com sucesso!');
      }

      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      alert('Erro ao atualizar senha. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6" />
            Meu Painel
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações do Cliente */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Dados Pessoais
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Nome:</span>
              <span className="text-gray-600">{customer?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Email:</span>
              <span className="text-gray-600">{customer?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Telefone:</span>
              <span className="text-gray-600">{customer?.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Endereço:</span>
              <span className="text-gray-600">{customer?.address}</span>
            </div>
          </div>
        </div>

        {/* Último Pedido */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Meus Pedidos
          </h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Carregando...</p>
            </div>
          ) : lastOrders.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Últimos Pedidos
              </h4>
              {lastOrders.map((order, index) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">#{order.order_number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? 'Entregue' :
                       order.status === 'pending' ? 'Pendente' :
                       order.status === 'confirmed' ? 'Confirmado' :
                       order.status === 'preparing' ? 'Preparando' : 'Processando'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {new Date(order.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="text-green-600 font-semibold">R$ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Pagamento:</span>
                    <span className="text-gray-600">
                      {order.payment_method === 'card' ? 'Cartão' : 
                       order.payment_method === 'cash' ? 'Dinheiro' : 'Pix'}
                    </span>
                  </div>
                  {order.items && (
                    <div className="text-xs text-gray-500">
                      {Array.isArray(order.items) ? order.items.map((item: any, i: number) => (
                        <div key={i}>• {item.quantity}x {item.name}</div>
                      )) : 'Itens não disponíveis'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">Nenhum pedido encontrado.</p>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Alterar Senha
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Modal de Alterar Senha */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Alterar Senha
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha Atual:
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nova Senha:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Digite a nova senha"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nova Senha:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirme a nova senha"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Salvar Nova Senha
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setCurrentPassword('');
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPanel;
