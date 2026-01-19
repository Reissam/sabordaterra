'use client';

import React, { useState, useEffect } from 'react';
import { Order, Product } from '../../lib/types';
import { supabase } from '../lib/supabase';
import { useLogoFromSupabase } from '../hooks/useLogoFromSupabase';
import ComandaManager from './ComandaManager';
import WaiterManager from './WaiterManager';
import QRCodeGenerator from './QRCodeGenerator';
import { Bell, Eye, EyeOff, Check, Clock, Package, Truck, X, RefreshCw, Calendar, Download, Filter, ChevronDown, LayoutGrid, Utensils, User, QrCode } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null);
  const [billRequests, setBillRequests] = useState<any[]>([]); // New state for bill requests
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [activeTab, setActiveTab] = useState<'delivery' | 'comandas' | 'waiters' | 'qr'>('delivery');
  const { logoUrl } = useLogoFromSupabase();

  // Produtos padrão do cardápio
  const defaultProducts: Product[] = [
    { id: '1', name: 'PIRARUCU FRITO', price: 20.00, type: 'food', available: true },
    { id: '2', name: 'BIFE DE FIGADO', price: 18.00, type: 'food', available: true },
    { id: '3', name: 'LINGUA GUISADA', price: 18.00, type: 'food', available: true },
    { id: '4', name: 'PORCO GUISADO', price: 18.00, type: 'food', available: true },
    { id: '5', name: 'CARNEIRO GUISADO', price: 18.00, type: 'food', available: true },
    { id: '6', name: 'COSTELA GUISADA', price: 18.00, type: 'food', available: true },
    { id: '7', name: 'COZIDAO DE CARNE', price: 18.00, type: 'food', available: true },
    { id: '8', name: 'FRANGO A PASSARINHO', price: 18.00, type: 'food', available: true },
    { id: '9', name: 'CARNE DE SOL', price: 18.00, type: 'food', available: true },
  ];

  // Função auxiliar para converter data para string YYYY-MM-DD no fuso local
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Carregar pedidos
  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      filterOrdersByDate(data || [], startDate, endDate);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      // Fallback para localStorage
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const ordersData = JSON.parse(savedOrders);
        setOrders(ordersData);
        filterOrdersByDate(ordersData, startDate, endDate);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pedidos por período - CORRIGIDO
  const filterOrdersByDate = (ordersList: Order[], start: string, end: string) => {
    if (!start && !end) {
      setFilteredOrders(ordersList);
      return;
    }

    const filtered = ordersList.filter(order => {
      // Extrair a data do pedido no fuso local
      const orderDate = new Date(order.created_at);
      const orderDateStr = toLocalDateString(orderDate);

      // Se ambas as datas estão preenchidas, verificar o intervalo
      if (start && end) {
        return orderDateStr >= start && orderDateStr <= end;
      }

      // Se só a data inicial está preenchida
      if (start) {
        return orderDateStr >= start;
      }

      // Se só a data final está preenchida
      if (end) {
        return orderDateStr <= end;
      }

      return true;
    });

    setFilteredOrders(filtered);
  };

  // Gerar relatório diário - CORRIGIDO
  const generateDailyReport = () => {
    const dayOrders = selectedDate
      ? filteredOrders
      : orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const orderDateStr = toLocalDateString(orderDate);

        const today = new Date();
        const todayStr = toLocalDateString(today);

        return orderDateStr === todayStr;
      });

    const reportDate = selectedDate || new Date().toLocaleDateString('pt-BR');

    // Calcular estatísticas
    const totalOrders = dayOrders.length;
    const totalRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
    const deliveredOrders = dayOrders.filter(order => order.status === 'delivered').length;
    const pendingOrders = dayOrders.filter(order => order.status === 'pending').length;

    // Agrupar por produto
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};

    dayOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });

    // Gerar CSV
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '\uFEFF'; // BOM para Excel

    // Cabeçalho
    csvContent += 'Relatório de Vendas - Restaurante Sabor da Terra\n';
    csvContent += `Data: ${reportDate}\n\n`;

    // Estatísticas
    csvContent += 'Estatísticas Gerais\n';
    csvContent += 'Total de Pedidos;Valor Total;Pedidos Entregues;Pedidos Pendentes\n';
    csvContent += `${totalOrders};R$ ${totalRevenue.toFixed(2)};${deliveredOrders};${pendingOrders}\n\n`;

    // Vendas por produto
    csvContent += 'Vendas por Produto\n';
    csvContent += 'Produto;Quantidade;Faturamento\n';

    Object.entries(productSales).forEach(([productName, data]) => {
      csvContent += `"${productName}";${data.quantity};R$ ${data.revenue.toFixed(2)}\n`;
    });

    // Detalhes dos pedidos
    csvContent += '\nDetalhes dos Pedidos\n';
    csvContent += 'Número do Pedido;Data;Status;Valor Total;Forma Pagamento;Cliente;Endereço\n';

    dayOrders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleString('pt-BR');
      const statusMap = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        preparing: 'Preparando',
        ready: 'Pronto',
        delivered: 'Entregue',
        cancelled: 'Cancelado'
      };

      const paymentMap = {
        card: 'Cartão',
        cash: 'Dinheiro',
        pix: 'Pix'
      };

      csvContent += `#${order.order_number};"${orderDate}";"${statusMap[order.status]}";"R$ ${order.total.toFixed(2)}";"${paymentMap[order.payment_method as keyof typeof paymentMap]}";"${order.address.includes('Retirada') ? 'Retirada' : 'Delivery'}";"${order.address}"\n`;
    });

    // Download do arquivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_vendas_${reportDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Carregar produtos
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Se banco vazio, inserir defaults
        console.log('Banco de produtos vazio. Inserindo padrões...');
        const productsToInsert = defaultProducts.map(p => ({
          name: p.name,
          price: p.price,
          category: p.type, // Map type to category
          available: p.available,
          description: '',
          image_url: ''
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select();

        if (insertError) {
          console.error('Erro ao inserir produtos padrão:', insertError);
          // Fallback local
          setProducts(defaultProducts);
        } else {
          // Formatar dados inseridos
          const mapped: Product[] = (insertedData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            available: Boolean(p.available),
            type: p.category === 'drink' ? 'drink' : 'food',
            category: p.category,
          }));
          setProducts(mapped);
          console.log('Produtos padrão inseridos com sucesso!');
        }

      } else {
        const mapped: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          available: Boolean(p.available),
          type: p.category === 'drink' ? 'drink' : 'food',
          category: p.category,
        }));

        setProducts(mapped);
        localStorage.setItem('adminProducts', JSON.stringify(mapped));
        localStorage.setItem('menuProducts', JSON.stringify(mapped));
      }

    } catch (error) {
      console.error('Erro ao carregar produtos:', error);

      const savedProducts = localStorage.getItem('adminProducts');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(defaultProducts);
        localStorage.setItem('adminProducts', JSON.stringify(defaultProducts));
        localStorage.setItem('menuProducts', JSON.stringify(defaultProducts));
      }
    }
  };

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Fallback para localStorage
      const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    }
  };

  // Toggle disponibilidade do produto
  const toggleProductAvailability = async (productId: string) => {
    const current = products.find(p => p.id === productId);
    if (!current) return;

    const nextAvailable = !current.available;

    try {
      const { error } = await supabase
        .from('products')
        .update({ available: nextAvailable, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }

    const updatedProducts = products.map(product =>
      product.id === productId
        ? { ...product, available: nextAvailable }
        : product
    );

    setProducts(updatedProducts);
    localStorage.setItem('adminProducts', JSON.stringify(updatedProducts));
    localStorage.setItem('menuProducts', JSON.stringify(updatedProducts));
  };

  // Verificar novos pedidos
  const checkNewOrders = () => {
    const lastChecked = localStorage.getItem('lastOrderCheck');
    const newOrders = orders.filter(order =>
      order.status === 'pending' &&
      (!lastChecked || new Date(order.created_at) > new Date(lastChecked))
    );

    if (newOrders.length > 0 && showNotifications) {
      setNewOrderNotification(newOrders[0]);
      localStorage.setItem('lastOrderCheck', new Date().toISOString());
    }
  };

  // Status icons e cores
  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pendente' },
      confirmed: { icon: Check, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmado' },
      preparing: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Preparando' },
      ready: { icon: Bell, color: 'text-green-600', bg: 'bg-green-50', label: 'Pronto' },
      delivered: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Entregue' },
      cancelled: { icon: X, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelado' }
    };
    return configs[status];
  };

  const checkBillRequests = async () => {
    try {
      const { data } = await supabase
        .from('comandas')
        .select('*')
        .eq('status', 'open')
        .eq('closing_requested', true);

      if (data && data.length > 0) {
        setBillRequests(data);
        // Sound handled by browser policy usually needs interaction, but we try
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => { });
        } catch (e) { }
      } else {
        setBillRequests([]);
      }
    } catch (error) {
      console.error("Error checking bills", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProducts();

    // Verificar novos pedidos e contas a cada 15 segundos
    const interval = setInterval(() => {
      loadOrders();
      checkNewOrders();
      checkBillRequests();
    }, 15000);

    // Initial check
    checkBillRequests();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkNewOrders();
  }, [orders]);

  // Carregar pedidos iniciais
  useEffect(() => {
    loadOrders();
  }, []);

  // Atualizar filtro quando as datas mudarem
  useEffect(() => {
    filterOrdersByDate(orders, startDate, endDate);
  }, [startDate, endDate, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notificação de Novo Pedido */}
      {newOrderNotification && showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform scale-100 animate-pulse">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Novo Pedido!</h2>
              <p className="text-gray-600 mb-2">
                Pedido #{newOrderNotification.order_number}
              </p>
              <p className="text-xl font-black text-red-600 mb-4 animate-pulse">
                {newOrderNotification.address}
              </p>
              <p className="text-lg font-semibold text-gray-800 mb-6">
                Total: R$ {newOrderNotification.total.toFixed(2)}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    updateOrderStatus(newOrderNotification.id, 'confirmed');
                    setNewOrderNotification(null);
                  }}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
                >
                  Confirmar Pedido
                </button>
                <button
                  onClick={() => setNewOrderNotification(null)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Sabor da Terra Logo" className="w-24 h-24 object-contain rounded-lg" />
              ) : (
                <div className="w-24 h-24 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl text-center">Sabor da Terra</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">Restaurante Sabor da Terra</h1>
                <p className="text-red-100">Painel Administrativo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Botão de Notificações */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 rounded-xl transition-all ${showNotifications
                  ? 'bg-white text-red-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Filtro por Data */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">
                    {startDate && endDate
                      ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                      : 'Todas'
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showDateFilter && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg p-4 z-10 min-w-64">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Inicial:
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-white mb-2"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Final:
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setShowDateFilter(false);
                        }}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Limpar
                      </button>
                      <button
                        onClick={() => {
                          setShowDateFilter(false);
                          filterOrdersByDate(orders, startDate, endDate);
                        }}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Download Relatório */}
              <button
                onClick={generateDailyReport}
                className="bg-green-600 p-3 rounded-xl hover:bg-green-700 transition-all text-white"
                title="Baixar Relatório Diário"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={loadOrders}
                className="bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${activeTab === 'delivery'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Truck className="w-5 h-5" />
              Delivery & Cardápio
            </button>
            <button
              onClick={() => setActiveTab('comandas')}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${activeTab === 'comandas'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Utensils className="w-5 h-5" />
              Gestão de Mesas
            </button>
            <button
              onClick={() => setActiveTab('waiters')}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${activeTab === 'waiters'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <User className="w-5 h-5" />
              Garçons
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${activeTab === 'qr'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <QrCode className="w-5 h-5" />
              QR Codes
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'delivery' ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pedidos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Pedidos</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="w-4 h-4" />
                    <span>
                      {startDate && endDate
                        ? `${filteredOrders.length} pedidos de ${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : `${filteredOrders.length} pedidos (todos)`
                      }
                    </span>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      {startDate && endDate
                        ? `Nenhum pedido encontrado de ${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                        : 'Nenhum pedido encontrado'
                      }
                    </p>
                    {startDate && endDate && (
                      <button
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="mt-3 text-red-600 hover:text-red-700 text-sm underline"
                      >
                        Mostrar todos os pedidos
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div key={order.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                Pedido #{order.order_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} text-sm font-medium flex items-center gap-1`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="font-medium text-gray-700">Itens:</p>
                            {order.items.map((item, index) => (
                              <p key={index} className="text-sm text-gray-600">
                                {item.quantity}x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                              </p>
                            ))}
                          </div>

                          <div className="mb-3">
                            <p className="font-medium text-gray-700">Cliente: {order.address.includes('Retirada') ? 'Retirada na Loja' : 'Delivery'}</p>
                            <p className="text-sm text-gray-600">{order.address}</p>
                            {order.observation && (
                              <p className="text-sm text-gray-600 italic">Obs: {order.observation}</p>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg text-gray-800">
                              Total: R$ {order.total.toFixed(2)}
                            </p>

                            <div className="flex gap-2">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  Confirmar
                                </button>
                              )}
                              {order.status === 'confirmed' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                >
                                  Iniciar Preparo
                                </button>
                              )}
                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Pronto
                                </button>
                              )}
                              {order.status === 'ready' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                  Entregue
                                </button>
                              )}
                              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Produtos */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Gerenciar Produtos</h2>

                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className={`font-medium ${product.available ? 'text-gray-800' : 'text-gray-400'}`}>
                          {product.name}
                        </h4>
                        <p className={`text-sm ${product.available ? 'text-gray-600' : 'text-gray-400'}`}>
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleProductAvailability(product.id)}
                        className={`p-2 rounded-lg transition-all ${product.available
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                      >
                        {product.available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Dica:</strong> Produtos desativados não aparecerão no cardápio para os clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'comandas' ? (
          <ComandaManager products={products} />
        ) : activeTab === 'waiters' ? (
          <WaiterManager />
        ) : (
          <QRCodeGenerator />
        )}
      </div>

      {/* BILL REQUEST OVERLAY */}
      {billRequests.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-yellow-400">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-yellow-100 p-4 rounded-full">
                <Bell className="w-12 h-12 text-yellow-600 animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Pedindo Conta!</h2>
              <div className="space-y-2 w-full">
                {billRequests.map((req) => (
                  <div key={req.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="text-2xl font-black text-red-600">Mesa {req.table_number}</div>
                    <div className="text-sm text-gray-500">Cliente: {req.customer_name || 'Anônimo'}</div>
                    <div className="text-lg font-bold text-gray-800 mt-1">Total: R$ {Number(req.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setBillRequests([]);
                  setActiveTab('comandas');
                }}
                className="w-full bg-yellow-500 text-white font-bold py-4 text-xl rounded-xl hover:bg-yellow-600 transition shadow-lg mt-4"
              >
                Atender Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;