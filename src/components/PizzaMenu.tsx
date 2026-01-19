import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CartItem } from '../../lib/types';
import { supabase } from '../lib/supabase';

interface FoodMenuProps {
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}

// Produtos padrão do cardápio
const defaultProducts = [
  { id: '1', name: 'PIRARUCU FRITO', price: 20.00, available: true },
  { id: '2', name: 'BIFE DE FIGADO', price: 18.00, available: true },
  { id: '3', name: 'LINGUA GUISADA', price: 18.00, available: true },
  { id: '4', name: 'PORCO GUISADO', price: 18.00, available: true },
  { id: '5', name: 'CARNEIRO GUISADO', price: 18.00, available: true },
  { id: '6', name: 'COSTELA GUISADA', price: 18.00, available: true },
  { id: '7', name: 'COZIDAO DE CARNE', price: 18.00, available: true },
  { id: '8', name: 'FRANGO A PASSARINHO', price: 18.00, available: true },
  { id: '9', name: 'CARNE DE SOL', price: 18.00, available: true }
];

type Product = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  type?: 'food' | 'drink';
  category?: string;
};

const FoodMenu: React.FC<FoodMenuProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  
  // Carregar produtos do localStorage apenas no cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProducts = localStorage.getItem('menuProducts');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }
  }, []);

  // Atualizar produtos do Supabase (fonte de verdade)
  useEffect(() => {
    let mounted = true;

    const loadFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        const mapped: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          available: Boolean(p.available),
          type: p.category === 'drink' ? 'drink' : 'food',
          category: p.category,
        }));

        if (!mounted) return;
        setProducts(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('menuProducts', JSON.stringify(mapped));
        }
      } catch (error) {
        // mantém fallback (localStorage/default)
      }
    };

    loadFromSupabase();
    return () => {
      mounted = false;
    };
  }, []);
  
  const availableProducts = products.filter((product: Product) => {
    const kind = product.category ?? product.type ?? 'food';
    return product.available && kind !== 'drink';
  });
  
  const handleAddToCart = (product: Product) => {
    onAddToCart({
      type: 'food',
      name: product.name,
      price: product.price
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm"></div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Cardápio</h3>
          <p className="text-gray-600">
            {availableProducts.length < products.length 
              ? `Pratos disponíveis (${availableProducts.length}/${products.length})`
              : 'Pratos da casa'
            }
          </p>
        </div>
      </div>

      {availableProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum prato disponível no momento</p>
          <p className="text-gray-400 text-sm mt-2">Tente novamente mais tarde</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 transition-all"
            >
              <div>
                <h4 className="font-semibold text-gray-800">{product.name}</h4>
                <p className="text-red-600 font-bold">R$ {product.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodMenu;