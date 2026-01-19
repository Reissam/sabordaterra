'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Pizza, User, Lock, ShoppingBag, Settings } from 'lucide-react';
import FoodMenu from '../components/PizzaMenu';
import HamburgerMenu from '../components/HamburgerMenu';
import DrinkMenu from '../components/DrinkMenu';
import Cart from '../components/Cart';
import PaymentForm from '../components/PaymentForm';
import Receipt from '../components/Receipt';
import CustomerManager from '../src/components/CustomerManager';
import CustomerFormModal from '../src/components/CustomerFormModal';
import CustomerPanel from '../src/components/CustomerPanel';
import { CartItem, PaymentData, Customer } from '../lib/types';
import { supabase } from '../src/lib/supabase';

import { useLogoFromSupabase } from '../src/hooks/useLogoFromSupabase';

export default function Page() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { logoUrl, loading: logoLoading, reloadLogo } = useLogoFromSupabase();

  // Configuração da API Telegram (nova implementação)
  const TELEGRAM_API_URL = '/api/send-telegram';
  
  // Configuração do Telegram (opcional - para referência)
  const TELEGRAM_CONFIG = {
    enabled: process.env.NEXT_PUBLIC_TELEGRAM_ENABLED === 'true',
    chatId: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '@seucanal',
    botToken: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || 'SEU_BOT_TOKEN'
  };

  // Carregar dados do cliente selecionado
  const handleCustomerLoad = (customer: Customer | null) => {
    setCurrentCustomer(customer);
  };

  // Carregar clientes do localStorage
  React.useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
    
    // Verificar se há um cliente lembrado
    const rememberedCustomer = localStorage.getItem('rememberedCustomer');
    if (rememberedCustomer) {
      const customer = JSON.parse(rememberedCustomer);
      setCurrentCustomer(customer);
      setIsLoggedIn(true);
    }
  }, []);

  // Salvar novo cliente
  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...customerData,
      createdAt: new Date().toISOString()
    };
    
    const updatedCustomers = [...customers, newCustomer];
    setCustomers(updatedCustomers);
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    // Lembrar este cliente
    localStorage.setItem('rememberedCustomer', JSON.stringify(newCustomer));
    setCurrentCustomer(newCustomer);
    setIsLoggedIn(true);
  };

  // Função para lidar com login
  const handleLoginSuccess = () => {
    // Recarregar a página para atualizar o estado
    window.location.reload();
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    const existingItem = cart.find(cartItem => 
      cartItem.name === item.name
    );

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === existingItem.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const newItem: CartItem = {
        ...item,
        id: Date.now().toString(),
        quantity: 1
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleConfirmOrder = () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho antes de confirmar o pedido!');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSubmit = async (data: PaymentData) => {
    setPaymentData(data);
    
    // Gerar número do pedido (único para todos os canais)
    const now = new Date();
    const orderNumber = `SB${now.getTime().toString().slice(-6)}`;
    
    // Salvar pedido no Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          customer_id: currentCustomer?.id || null,
          order_number: orderNumber,
          items: cart,
          total: getTotalPrice(),
          payment_method: data.method,
          change_for: data.changeFor || null,
          address: data.address,
          observation: data.observation || null,
          status: 'pending'
        });

      if (error) {
        console.error('Erro ao salvar pedido no Supabase:', error);
        // Fallback para localStorage
        const savedOrders = localStorage.getItem('orders');
        const orders = savedOrders ? JSON.parse(savedOrders) : [];
        const newOrder = {
          id: Date.now().toString(),
          customerEmail: currentCustomer?.email || data.name,
          orderNumber,
          items: cart,
          total: getTotalPrice(),
          paymentMethod: data.method,
          changeFor: data.changeFor,
          address: data.address,
          observation: data.observation,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    }
    
    // Enviar dados para Telegram diretamente
    const orderData = {
      cart: cart,
      paymentData: data,
      total: getTotalPrice(),
      orderNumber: orderNumber // Enviar número gerado
    };
    
    // Envia para Telegram em background (não bloqueia o fluxo)
    sendToTelegram(orderData).then(success => {
      if (!success) {
        console.warn('Falha ao enviar dados para Telegram, mas o pedido continua');
      }
    });
    
    setShowReceipt(true);
    setShowPayment(false);
    setCurrentOrderNumber(orderNumber); // Salvar número do pedido atual
  };

  
  const sendToTelegram = async (orderData: { cart: CartItem[], paymentData: PaymentData, total: number, orderNumber: string }) => {
    try {
      const response = await fetch(TELEGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        console.error('Erro ao enviar para Telegram:', response.statusText);
        return false;
      }

      const result = await response.json();
      console.log('Dados enviados para Telegram com sucesso:', result);
      return true;
    } catch (error) {
      console.error('Erro ao enviar para Telegram:', error);
      return false;
    }
  };

  const sendToWhatsApp = () => {
    const orderDetails = cart.map(item => {
      let itemText = `${item.quantity}x ${item.name}`;
      itemText += ` - R$ ${(item.price * item.quantity).toFixed(2)}`;
      return itemText;
    }).join('\n');

    const total = getTotalPrice().toFixed(2);
    const paymentMethod = paymentData?.method === 'card' ? 'Cartão na entrega' :
                         paymentData?.method === 'cash' ? `Dinheiro (troco para R$ ${paymentData.changeFor?.toFixed(2)})` :
                         'Pix';

    const message = `🔥 *PEDIDO RESTAURANTE SABOR DA TERRA* 🔥\n\n` +
                   `📋 *NÚMERO:* #${currentOrderNumber}\n` +
                   `📋 *ITENS:*\n${orderDetails}\n\n` +
                   `💰 *TOTAL: R$ ${total}*\n\n` +
                   `💳 *PAGAMENTO:* ${paymentMethod}\n\n` +
                   `📍 *ENTREGA:* ${paymentData?.address}\n` +
                   `👤 *CLIENTE:* ${paymentData?.name}\n` +
                   `📞 *TELEFONE:* ${paymentData?.phone}\n` +
                   (paymentData?.observation ? `📝 *OBS:* ${paymentData.observation}\n` : '') +
                   `\n✅ Pedido confirmado!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '559620270750';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const resetOrder = () => {
    setCart([]);
    setShowPayment(false);
    setShowReceipt(false);
    setPaymentData(null);
    setCurrentOrderNumber(''); // Limpar número do pedido
  };

  if (showReceipt && paymentData) {
    return (
      <Receipt
              cart={cart}
              paymentData={paymentData}
              total={getTotalPrice()}
              onSendWhatsApp={sendToWhatsApp}
              onNewOrder={resetOrder}
              orderNumber={currentOrderNumber}
            />
    );
  }

  if (showPayment) {
    return (
      <PaymentForm
        total={getTotalPrice()}
        onSubmit={handlePaymentSubmit}
        onBack={() => setShowPayment(false)}
        customerData={currentCustomer}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Sabor da Terra Logo" className="w-32 h-32 object-contain rounded-lg bg-white p-2" />
              ) : (
                <img src="/logo-pulse.jpg" alt="Pulse Digital" className="w-32 h-32 object-contain rounded-lg bg-white p-2" />
              )}
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">Restaurante Sabor da Terra</h1>
                <p className="text-orange-100">Cardápio Virtual</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold">{cart.length} itens</span>
              </div>
              {isLoggedIn && currentCustomer?.email === 'leumaxreis@gmail.com' && (
                <button
                  onClick={() => window.location.href = '/admin/logo'}
                  className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 hover:bg-white/30 transition-colors"
                  title="Gerenciar Logo"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              {isLoggedIn && currentCustomer?.email === 'leumaxreis@gmail.com' && (
                <button
                  onClick={reloadLogo}
                  className="flex items-center gap-2 bg-blue-600/20 rounded-full px-4 py-2 hover:bg-blue-600/30 transition-colors"
                  title="Sincronizar Logo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors font-semibold text-sm"
                >
                  Entrar
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <span className="text-white text-sm">{currentCustomer?.name}</span>
                  <button
                    onClick={() => setShowCustomerPanel(true)}
                    className="bg-purple-600 text-white px-3 py-2 rounded-full hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <User className="w-4 h-4" />
                    Meu Painel
                  </button>
                  {isLoggedIn && currentCustomer?.email === 'leumaxreis@gmail.com' && (
                  <button
                    onClick={() => window.open('/admin', '_blank')}
                    className="bg-gray-600 text-white px-3 py-2 rounded-full hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </button>
                  )}
                  <button
                    onClick={() => {
                      setCurrentCustomer(null);
                      setIsLoggedIn(false);
                      localStorage.removeItem('rememberedCustomer');
                    }}
                    className="bg-red-600 text-white px-3 py-2 rounded-full hover:bg-red-700 transition-colors text-sm"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bem-vindo ao nosso cardápio!
          </h2>
          <p className="text-gray-600">Melhores pratos da região</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-red-600">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">(93) 99184-9036</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">(93) 99225-4394</span>
            </div>
          </div>
          <div className="text-gray-600 mt-2">
            <p className="font-semibold">TRAV. DOUTO LOUREIRO, 257 - Centro</p>
            <p className="font-semibold">Monte Alegre - PA</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <FoodMenu onAddToCart={addToCart} />
            <DrinkMenu onAddToCart={addToCart} />
          </div>
          <div className="lg:col-span-1">
            <Cart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              total={getTotalPrice()}
              onConfirmOrder={handleConfirmOrder}
            />
          </div>
        </div>
      </div>

      {/* Modal de Cadastro de Cliente */}
      <CustomerFormModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleSaveCustomer}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Painel do Cliente */}
      <CustomerPanel
        isOpen={showCustomerPanel}
        onClose={() => setShowCustomerPanel(false)}
        customer={currentCustomer}
      />
    </div>
  );
}


