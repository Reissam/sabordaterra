import React, { useEffect, useState } from 'react';
import { Coffee, Plus } from 'lucide-react';
import { CartItem } from '../../lib/types';

interface DrinkMenuProps {
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}

const drinks = [
  { name: 'Coca-Cola Lata', price: 4.50, size: '350ml' },
  { name: 'Coca-Cola 1,5L', price: 8.90, size: '1,5L' },
  { name: 'Coca-Cola 2L', price: 10.90, size: '2L' },

  { name: 'Fanta Laranja Lata', price: 4.50, size: '350ml' },
  { name: 'Fanta Laranja 2L', price: 9.90, size: '2L' },
  { name: 'Guaraná Antarctica Lata', price: 4.50, size: '350ml' },
  { name: 'Guaraná Antarctica 2L', price: 9.90, size: '2L' },
  { name: 'Sprite Lata', price: 4.50, size: '350ml' },
  { name: 'Sprite 2L', price: 9.90, size: '2L' },
  { name: 'Água Mineral', price: 3.00, size: '500ml' },
  { name: 'Suco Natural Laranja', price: 6.90, size: '300ml' },
  { name: 'Suco Natural Limão', price: 6.90, size: '300ml' },
  { name: 'Cerveja Skol Lata', price: 4.90, size: '350ml' },
  { name: 'Cerveja Brahma Lata', price: 4.90, size: '350ml' },
  { name: 'Suco de Uva Integral', price: 7.90, size: '300ml' }
];

type MenuProduct = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  type?: 'food' | 'drink';
  category?: string;
};

const DrinkMenu: React.FC<DrinkMenuProps> = ({ onAddToCart }) => {
  const [menuDrinks, setMenuDrinks] = useState<MenuProduct[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedProducts = localStorage.getItem('menuProducts');
    if (!savedProducts) return;

    try {
      const parsed = JSON.parse(savedProducts) as MenuProduct[];
      const onlyDrinks = (parsed || []).filter((p) => {
        const kind = p.category ?? p.type;
        return p.available && kind === 'drink';
      });
      setMenuDrinks(onlyDrinks);
    } catch (e) {
      setMenuDrinks([]);
    }
  }, []);

  const handleAddToCart = (drink: { name: string; price: number; size?: string }) => {
    onAddToCart({
      type: 'drink',
      name: drink.size ? `${drink.name} (${drink.size})` : drink.name,
      price: drink.price
    });
  };

  const availableDrinks = menuDrinks.length > 0 ? menuDrinks : drinks;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Coffee className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Bebidas</h3>
          <p className="text-gray-600">Para acompanhar seu pedido</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {availableDrinks.map((drink: any) => (
          <div
            key={drink.id ?? (drink.name + (drink.size ?? ''))}
            className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all"
          >
            <div className="text-center mb-3">
              <h4 className="font-semibold text-gray-800 text-sm">{drink.name}</h4>
              {drink.size ? <p className="text-xs text-gray-500">{drink.size}</p> : null}
              <span className="text-lg font-bold text-blue-600">
                R$ {drink.price.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => handleAddToCart(drink)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrinkMenu;