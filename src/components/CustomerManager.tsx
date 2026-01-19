import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { Customer } from '../../lib/types';

interface CustomerManagerProps {
  onCustomerLoad: (customer: Customer | null) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ onCustomerLoad }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });

  // Carregar clientes do localStorage ao montar
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
    
    // Verificar se há um cliente lembrado
    const rememberedCustomer = localStorage.getItem('rememberedCustomer');
    if (rememberedCustomer) {
      onCustomerLoad(JSON.parse(rememberedCustomer));
    }
  }, [onCustomerLoad]);

  // Salvar clientes no localStorage
  const saveCustomers = (updatedCustomers: Customer[]) => {
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    setCustomers(updatedCustomers);
  };

  // Salvar ou atualizar cliente
  const handleSave = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.password) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (editingCustomer) {
      // Atualizar cliente existente
      const updatedCustomers = customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...formData }
          : c
      );
      saveCustomers(updatedCustomers);
      setEditingCustomer(null);
    } else {
      // Adicionar novo cliente
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      saveCustomers([...customers, newCustomer]);
    }

    // Limpar formulário
    setFormData({ name: '', email: '', phone: '', address: '', password: '' });
    setShowForm(false);
  };

  // Carregar dados do cliente selecionado
  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      password: customer.password
    });
    onCustomerLoad(customer);
  };

  // Lembrar cliente
  const handleRememberCustomer = (customer: Customer) => {
    localStorage.setItem('rememberedCustomer', JSON.stringify(customer));
    handleSelectCustomer(customer);
  };

  // Excluir cliente
  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      saveCustomers(updatedCustomers);
      
      // Se era o cliente lembrado, limpar
      const rememberedCustomer = localStorage.getItem('rememberedCustomer');
      if (rememberedCustomer) {
        const remembered = JSON.parse(rememberedCustomer);
        if (remembered.id === customerId) {
          localStorage.removeItem('rememberedCustomer');
          onCustomerLoad(null);
        }
      }
    }
  };

  // Editar cliente
  const handleEditCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      password: customer.password
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  return (
    <>
      {customers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Meus Dados
            </h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              {showForm ? 'Cancelar' : 'Cadastro'}
            </button>
          </div>

          {showForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
              <h4 className="font-semibold text-gray-800">
                {editingCustomer ? 'Editar Dados' : 'Cadastrar Novo Cliente'}
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo:
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Digite seu nome completo"
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone:
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="(93) 99217-8154"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço:
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Rua, número, bairro..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Senha:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      placeholder="Digite uma senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingCustomer ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 mb-2">Clientes Cadastrados:</h4>
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.email}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRememberCustomer(customer)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerManager;
