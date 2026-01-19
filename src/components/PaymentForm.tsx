import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, ArrowLeft, MapPin, Phone, User, Mail, Store } from 'lucide-react';
import { PaymentData, Customer } from '../../lib/types';
import CustomerFormModal from './CustomerFormModal';

interface PaymentFormProps {
  total: number;
  onSubmit: (data: PaymentData) => void;
  onBack: () => void;
  customerData?: Customer | null;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ total, onSubmit, onBack, customerData }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'pix'>('card');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [changeFor, setChangeFor] = useState<number>(0);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [observation, setObservation] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [saveData, setSaveData] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dataSaved, setDataSaved] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Carregar dados do cliente quando disponível
  useEffect(() => {
    if (customerData) {
      setName(customerData.name);
      setAddress(customerData.address);
      setPhone(customerData.phone);
      setEmail(customerData.email);
    }
    
    // Carregar clientes do localStorage
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  }, [customerData]);

  // Handle checkbox exclusivo
  const handleHasAccountChange = (checked: boolean) => {
    setHasAccount(checked);
    if (checked) {
      setSaveData(false);
      setDataSaved(false);
      setShowCustomerModal(true); // Abrir modal de login
    }
  };

  const handleSaveDataChange = (checked: boolean) => {
    setSaveData(checked);
    if (checked) {
      setHasAccount(false);
    }
  };

  // Verificar login
  const handleLogin = (customer: Customer) => {
    setName(customer.name);
    setAddress(customer.address);
    setPhone(customer.phone);
    setEmail(customer.email);
    localStorage.setItem('rememberedCustomer', JSON.stringify(customer));
    setHasAccount(false); // Desmarcar checkbox após login
    setShowCustomerModal(false); // Fechar modal
    alert('Login realizado com sucesso!');
  };

  // Salvar novos dados
  const handleSaveNewData = () => {
    if (!name || !email || !phone || !address) {
      alert('Preencha todos os campos para salvar seus dados!');
      return;
    }

    // Gerar senha padrão com últimos 4 dígitos do telefone
    const phoneNumbers = phone.replace(/\D/g, '');
    const defaultPassword = phoneNumbers.slice(-4); // Últimos 4 dígitos
    
    // Usar senha personalizada se fornecida, senão usa a padrão
    const finalPassword = password.trim() || defaultPassword;

    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      address,
      password: finalPassword,
      createdAt: new Date().toISOString()
    };

    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    localStorage.setItem('rememberedCustomer', JSON.stringify(newCustomer));
    setDataSaved(true);
    
    // Mostrar senha gerada se for a padrão
    if (!password.trim()) {
      alert(`Dados salvos! Sua senha de acesso é: ${finalPassword} (últimos 4 dígitos do seu telefone)`);
    }
    
    setTimeout(() => setDataSaved(false), 3000);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove todos os não-números
    let formattedPhone = value;
    
    // Aplica máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (value.length <= 2) {
      formattedPhone = value;
    } else if (value.length <= 7) {
      formattedPhone = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else {
      formattedPhone = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    }
    
    setPhone(formattedPhone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      alert('Por favor, preencha o nome e telefone!');
      return;
    }

    // Se for entrega, validar endereço
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('Por favor, preencha o endereço para entrega!');
      return;
    }

    // Validação de telefone - deve ter pelo menos 10 dígitos
    const phoneNumbers = phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      alert('Por favor, digite um telefone válido com DDD!');
      return;
    }

    if (paymentMethod === 'cash' && changeFor < total) {
      alert('O valor para troco deve ser maior ou igual ao total do pedido!');
      return;
    }

    onSubmit({
      method: paymentMethod,
      changeFor: paymentMethod === 'cash' ? changeFor : undefined,
      name: name.trim(),
      address: deliveryType === 'delivery' ? address.trim() : 'Retirada na Loja',
      phone: phone.trim(),
      observation: observation.trim()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Finalizar Pedido</h2>
              <p className="text-gray-600">Total: R$ {total.toFixed(2)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Type */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tipo de Entrega:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    deliveryType === 'delivery'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <MapPin className="w-8 h-8" />
                  <span className="font-semibold">Entrega em Domicílio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    deliveryType === 'pickup'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <Store className="w-8 h-8" />
                  <span className="font-semibold">Retirada na Loja</span>
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Forma de Pagamento:</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="font-semibold">{deliveryType === 'pickup' ? 'Cartão' : 'Cartão na Entrega'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <Banknote className="w-8 h-8" />
                  <span className="font-semibold">Dinheiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Smartphone className="w-8 h-8" />
                  <span className="font-semibold">Pix</span>
                </button>
              </div>
            </div>

            {/* Change Amount for Cash */}
            {paymentMethod === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Troco para qual valor?
                </label>
                <input
                  type="text"
                  step="0.01"
                  min={total}
                  value={changeFor === 0 ? '' : changeFor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setChangeFor(value === '' ? 0 : parseFloat(value) || 0);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Digite o valor"
                  required
                />
                {changeFor > 0 && changeFor >= total && (
                  <p className="text-sm text-green-600 mt-1">
                    Troco: R$ {(changeFor - total).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Opções de cadastro (apenas se não tiver cliente logado) */}
            {!customerData && (
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAccount}
                    onChange={(e) => handleHasAccountChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Já tenho cadastro</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveData}
                    onChange={(e) => handleSaveDataChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Deseja salvar seus dados para um próximo pedido?</span>
                </label>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nome Completo:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Delivery Address - apenas se for entrega */}
            {deliveryType === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Endereço de Entrega:
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Rua, número, bairro, cidade..."
                  required
                />
              </div>
            )}

            {/* Pickup Info - apenas se for retirada */}
            {deliveryType === 'pickup' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-800 mb-2">
                  <Store className="w-4 h-4 inline mr-1" />
                  Informações da Retirada
                </h4>
                <p className="text-sm text-indigo-600">
                  📍 <strong>Endereço:</strong> TRAV. DOUTO LOUREIRO, 257 - Centro, Monte Alegre - PA<br/>
                  🕐 <strong>Horário:</strong> 18:00 às 23:00<br/>
                  📱 <strong>Contato:</strong> (93) 99184-9036
                </p>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefone para Contato:
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                maxLength={15}
                required
              />
            </div>

            {/* Botão Salvar Dados (se deseja salvar) */}
            {saveData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div>
                  <h4 className="font-semibold text-green-800">Salvar Dados</h4>
                  <p className="text-sm text-green-600">Seus dados ficarão salvos para próximos pedidos</p>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha (opcional - deixe em branco para usar últimos 4 dígitos do telefone):
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Deixe em branco para usar senha padrão"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Senha padrão: últimos 4 dígitos do seu telefone
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleSaveNewData}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors mt-3"
                >
                  Salvar Dados
                </button>
                
                {dataSaved && (
                  <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-sm text-center">
                    ✅ Dados salvos com sucesso!
                  </div>
                )}
              </div>
            )}

            {/* Observation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional):
              </label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                placeholder="Alguma observação especial..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim() || !phone.trim() || (deliveryType === 'delivery' && !address.trim())}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                name.trim() && phone.trim() && (deliveryType === 'pickup' || address.trim())
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {deliveryType === 'pickup' ? 'Finalizar Compra (Retirada)' : 'Finalizar Compra'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={() => {}}
        onLoginSuccess={handleLogin}
      />
    </div>
  );
};

export default PaymentForm;