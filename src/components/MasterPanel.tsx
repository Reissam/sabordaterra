'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Product } from '../../lib/types';
import { Plus, RefreshCw, LogOut, Pencil, Trash2, X } from 'lucide-react';

type DbProduct = {
  id: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
};

const MasterPanel: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'food' | 'drink'>('food');
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const canSubmit = useMemo(() => {
    const p = Number(price);
    return name.trim().length > 0 && Number.isFinite(p) && p > 0;
  }, [name, price]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const mapped: Product[] = (data || []).map((p: DbProduct) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        available: Boolean(p.available),
        type: p.category === 'drink' ? 'drink' : 'food',
        category: p.category,
      }));

      setProducts(mapped);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const logout = () => {
    localStorage.removeItem('masterSession');
    router.push('/admin/master');
  };

  const resetForm = () => {
    setEditingProductId(null);
    setName('');
    setPrice('');
    setCategory('food');
    setAvailable(true);
  };

  const startEdit = (p: Product) => {
    setStatus('');
    setEditingProductId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory((p.category === 'drink' ? 'drink' : 'food') as 'food' | 'drink');
    setAvailable(Boolean(p.available));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setStatus('');

    try {
      const p = Number(price);
      const payload = {
        name: name.trim(),
        price: p,
        available,
        category,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingProductId
        ? await supabase
            .from('products')
            .update(payload)
            .eq('id', editingProductId)
        : await supabase
            .from('products')
            .insert(payload);

      if (error) throw error;

      setStatus(editingProductId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      resetForm();

      await loadProducts();
    } catch (error: any) {
      console.error('Erro ao cadastrar produto:', error);
      setStatus(editingProductId ? 'Erro ao atualizar produto.' : 'Erro ao cadastrar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este produto?');
    if (!confirmed) return;

    setSaving(true);
    setStatus('');

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      if (editingProductId === productId) {
        resetForm();
      }

      setStatus('Produto excluído com sucesso!');
      await loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      setStatus('Erro ao excluir produto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Painel Master</h1>
              <p className="text-gray-600">Cadastrar novos produtos no cardápio</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingProductId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: Coca-Cola 2L"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$)</label>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'food' | 'drink')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    >
                      <option value="food">Comida</option>
                      <option value="drink">Bebida</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Disponível</p>
                    <p className="text-xs text-gray-500">Se desmarcar, não aparece no cardápio</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailable((v) => !v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      available ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {available ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                {status && (
                  <div className={`p-3 rounded-lg ${status.includes('sucesso') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <p className={`text-sm ${status.includes('sucesso') ? 'text-green-700' : 'text-red-700'}`}>{status}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !canSubmit}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    saving || !canSubmit ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      {editingProductId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingProductId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                    </>
                  )}
                </button>

                {editingProductId ? (
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-gray-600 text-white hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                    Cancelar Edição
                  </button>
                ) : null}
              </form>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold text-gray-800">Produtos no Supabase</h2>
                <button
                  onClick={loadProducts}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-10 text-gray-600">Carregando...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 text-gray-600">Nenhum produto encontrado.</div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-[520px] overflow-auto">
                    {products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-sm text-gray-600">
                            {p.category} • R$ {p.price.toFixed(2)} • {p.available ? 'Ativo' : 'Inativo'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterPanel;
