import React, { useState, useEffect } from 'react';
import { Clock, Package, DollarSign, Calendar } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  items: any[];
  total: number;
  payment_method: string;
  address: string;
  observation?: string;
  status: string;
  created_at: string;
}

interface CustomerOrdersProps {
  customerEmail: string;
  onClose: () => void;
}

export default function CustomerOrders({ customerEmail, onClose }: CustomerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [customerEmail]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer-orders?email=${encodeURIComponent(customerEmail)}`);
      const data = await response.json();

      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando Confirmação';
      case 'confirmed': return 'Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Entrega';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'pix': return 'Pix';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="ml-3">Carregando pedidos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Meus Pedidos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> {customerEmail}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Exibindo os últimos 2 pedidos
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
            <p className="text-sm text-gray-400 mt-2">
              Seus pedidos aparecerão aqui quando você fizer um pedido
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-800">
                      #{order.order_number}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.created_at)}
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="font-medium text-gray-700 mb-2">Itens do Pedido:</h4>
                  <div className="space-y-1">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                          {item.size && ` (${item.size})`}
                          {item.flavors && item.flavors.length > 0 && ` - ${item.flavors.join(' / ')}`}
                        </span>
                        <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-500">Pagamento:</span>
                    <p className="text-sm font-medium">
                      {getPaymentMethodText(order.payment_method)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Endereço:</span>
                    <p className="text-sm font-medium">{order.address}</p>
                  </div>
                </div>

                {order.observation && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Observação:</span>
                    <p className="text-sm text-gray-700">{order.observation}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                    <DollarSign className="w-5 h-5" />
                    Total: R$ {order.total.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Tempo estimado: 30-45 min
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
