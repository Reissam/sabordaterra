import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { CartItem } from '../../lib/types';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  total: number;
  onConfirmOrder: () => void;
}

const Cart: React.FC<CartProps> = ({ cart, onUpdateQuantity, total, onConfirmOrder }) => {

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Carrinho</h3>
            <p className="text-gray-600">Seus itens aparecerão aqui</p>
          </div>
        </div>
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Seu carrinho está vazio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Carrinho</h3>
          <p className="text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{item.name}</h4>
              </div>
              <button
                onClick={() => onUpdateQuantity(item.id, 0)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="font-bold text-green-600">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-green-600">
            R$ {total.toFixed(2)}
          </span>
        </div>
        
        <button
          onClick={onConfirmOrder}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          Confirmar Pedido
        </button>
      </div>
    </div>
  );
};

export default Cart;