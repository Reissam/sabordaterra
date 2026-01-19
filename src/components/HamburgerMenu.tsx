import React, { useState } from 'react';
import { Beef, Plus } from 'lucide-react';
import { CartItem } from '../../lib/types';

interface HamburgerMenuProps {
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}

const hamburgers = [
  { name: 'Hambúrguer Clássico', price: 18.90, description: 'Pão, hambúrguer, queijo, alface, tomate' },
  { name: 'Cheeseburger Duplo', price: 24.90, description: 'Pão, 2 hambúrgueres, queijo duplo, cebola, pickles' },
  { name: 'Bacon Burger', price: 22.90, description: 'Pão, hambúrguer, bacon, queijo, molho especial' },
  { name: 'Frango Grelhado', price: 19.90, description: 'Pão, frango grelhado, queijo, alface, tomate, maionese' },
  { name: 'Vegetariano', price: 17.90, description: 'Pão, hambúrguer de soja, queijo, alface, tomate, cebola' },
  { name: 'X-Tudo', price: 28.90, description: 'Pão, hambúrguer, bacon, queijo, ovo, presunto, alface, tomate' },
  { name: 'Peixe Empanado', price: 21.90, description: 'Pão, peixe empanado, queijo, alface, molho tártaro' },
  { name: 'Picanha Burguer', price: 32.90, description: 'Pão, picanha grelhada, queijo, cebola caramelizada' }
];

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onAddToCart }) => {
  const [selectedHamburgers, setSelectedHamburgers] = useState<Set<string>>(new Set());

  // Deploy fix: Vercel using old commit - forcing new build

  const handleToggleSelection = (hamburger: typeof hamburgers[0]) => {
    const newSelected = new Set(selectedHamburgers);
    const key = hamburger.name;
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedHamburgers(newSelected);
  };

  const handleAddToCart = (hamburger: typeof hamburgers[0]) => {
    onAddToCart({
      type: 'food',
      name: hamburger.name,
      price: hamburger.price
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
          <Beef className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Hambúrgueres</h3>
          <p className="text-gray-600">Deliciosos e suculentos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {hamburgers.map((hamburger) => (
          <div
            key={hamburger.name}
            className={`border-2 rounded-xl p-4 transition-all ${
              selectedHamburgers.has(hamburger.name)
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{hamburger.name}</h4>
              <span className="text-lg font-bold text-amber-600">
                R$ {hamburger.price.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{hamburger.description}</p>
            <button
              onClick={() => handleAddToCart(hamburger)}
              className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
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

export default HamburgerMenu;