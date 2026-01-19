'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Comanda, Product, ComandaItem } from '../../lib/types';
import { Plus, Trash2, CheckCircle, XCircle, ShoppingBag, DollarSign, Utensils, RefreshCw, User, FileText, BellRing, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface ComandaManagerProps {
    products: Product[];
}

type Waiter = {
    id: string;
    name: string;
    active: boolean;
};

const ComandaManager: React.FC<ComandaManagerProps> = ({ products }) => {
    const [comandas, setComandas] = useState<Comanda[]>([]);
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const [tables] = useState<number[]>(Array.from({ length: 20 }, (_, i) => i + 1));
    const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [layoutSize, setLayoutSize] = useState<'small' | 'medium' | 'large'>('medium');

    // Estados para abrir nova comanda
    const [newCustomerName, setNewCustomerName] = useState('');
    const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');

    // Estados para adicionar item
    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        loadComandas();
        loadWaiters();
        // Refresh automático a cada 10s (mais rápido para ver pedidos do QR)
        const interval = setInterval(loadComandas, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadWaiters = async () => {
        const { data } = await supabase.from('waiters').select('*').eq('active', true);
        if (data) setWaiters(data);
    };

    // Carregar comandas ativas
    const loadComandas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comandas')
                .select('*, comanda_items(*)')
                .in('status', ['open'])
                .order('table_number');

            if (error) throw error;

            // Map comanda_items to items
            const mappedComandas = (data || []).map((c: any) => ({
                ...c,
                items: c.comanda_items || []
            }));

            setComandas(mappedComandas);

            // Se tiver comanda selecionada aberta, atualizar ela também
            if (selectedComanda) {
                const updated = data?.find(c => c.id === selectedComanda.id);
                if (updated) setSelectedComanda(updated);
            }

        } catch (error) {
            console.error('Erro ao carregar comandas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Abrir nova comanda
    const openComanda = async (tableNumber: number) => {
        try {
            const { data, error } = await supabase
                .from('comandas')
                .insert({
                    table_number: tableNumber,
                    customer_name: newCustomerName || `Mesa ${tableNumber}`,
                    status: 'open',
                    total: 0,
                    waiter_id: selectedWaiterId || null
                })
                .select('*, items:comanda_items(*)')
                .single();

            if (error) throw error;

            setComandas([...comandas, { ...data, items: [] }]);
            setSelectedComanda({ ...data, items: [] });
            setNewCustomerName('');
            setSelectedWaiterId('');
        } catch (error) {
            console.error('Erro ao abrir comanda:', error);
            alert('Erro ao abrir mesa');
        }
    };

    // Adicionar item à comanda
    const addItem = async () => {
        if (!selectedProduct || !selectedComanda) return;

        const product = products.find(p => p.id === selectedProduct);
        if (!product) return;

        try {
            const { data, error } = await supabase
                .from('comanda_items')
                .insert({
                    comanda_id: selectedComanda.id,
                    product_name: product.name,
                    quantity: quantity,
                    price: product.price,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Atualizar total da comanda
            const newTotal = selectedComanda.total + (data.price * data.quantity);
            await supabase
                .from('comandas')
                .update({ total: newTotal })
                .eq('id', selectedComanda.id);

            toast.success('Item adicionado!');
            loadComandas(); // Recarregar para garantir total correto

            // Resetar form
            setQuantity(1);
            setSelectedProduct('');
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            alert('Erro ao adicionar item');
        }
    };

    // Fechar comanda (Pagar)
    const closeComanda = async () => {
        if (!selectedComanda) return;

        if (!confirm(`Confirmar fechamento da Mesa ${selectedComanda.table_number}? Total: R$ ${selectedComanda.total.toFixed(2)}`)) return;

        try {
            const { error } = await supabase
                .from('comandas')
                .update({ status: 'paid', closed_at: new Date().toISOString() })
                .eq('id', selectedComanda.id);

            if (error) throw error;

            setComandas(comandas.filter(c => c.id !== selectedComanda.id));
            setShowModal(false);
            setSelectedComanda(null);
            toast.success('Mesa fechada com sucesso!');
        } catch (error) {
            console.error('Erro ao fechar comanda:', error);
            alert('Erro ao fechar conta');
        }
    };

    // Handle click na mesa
    const handleTableClick = (tableNumber: number) => {
        const existing = comandas.find(c => c.table_number === tableNumber);
        if (existing) {
            setSelectedComanda(existing);
            setShowModal(true);
        } else {
            // Perguntar se quer abrir (simples alert por enquanto, ideal seria modal)
            // Vou usar um confirm e um prompt simplificado, ou melhor, abrir o modal de Detalhes 
            // mas como não tem comanda, precisaria de um estado "Criando Comanda". 
            // Para simplificar: Prompt.
            const name = prompt(`Abrir Mesa ${tableNumber}? Nome do Cliente (Opcional):`);
            if (name !== null) {
                setNewCustomerName(name);
                // Se tiver garçons, poderia pedir. Por enquanto vai sem ou pega o primeiro.
                openComanda(tableNumber).then(() => setShowModal(true));
            }
        }
    };

    const getWaiterName = (id?: string) => {
        if (!id) return 'Sem garçom';
        const w = waiters.find(w => w.id === id);
        return w ? w.name : 'Desconhecido';
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Utensils className="text-orange-600" />
                    Gestão de Mesas
                </h2>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setLayoutSize('small')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${layoutSize === 'small' ? 'bg-white shadow text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pequeno
                        </button>
                        <button
                            onClick={() => setLayoutSize('medium')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${layoutSize === 'medium' ? 'bg-white shadow text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Médio
                        </button>
                        <button
                            onClick={() => setLayoutSize('large')}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${layoutSize === 'large' ? 'bg-white shadow text-gray-800 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Grande
                        </button>
                    </div>
                    <button
                        onClick={loadComandas}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Grid de Mesas */}
            <div className={`grid gap-4 transition-all
                ${layoutSize === 'small' ? 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8' : ''}
                ${layoutSize === 'medium' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' : ''}
                ${layoutSize === 'large' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' : ''}
            `}>
                {tables.map(num => {
                    const comanda = comandas.find(c => c.table_number === num);
                    const isOpen = !!comanda;
                    const isClosing = comanda?.closing_requested;

                    return (
                        <div
                            key={num}
                            onClick={() => handleTableClick(num)}
                            className={`
                                relative aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all shadow-md border-2
                                ${isOpen
                                    ? isClosing
                                        ? 'bg-yellow-100 border-yellow-400 animate-pulse'
                                        : 'bg-red-50 border-red-200 hover:border-red-400'
                                    : 'bg-green-50 border-green-200 hover:border-green-400'
                                }
                            `}
                        >
                            {isClosing && (
                                <div className="absolute top-2 right-2 animate-bounce">
                                    <BellRing className="w-6 h-6 text-yellow-600" fill="currentColor" />
                                </div>
                            )}

                            <span className={`text-4xl font-bold mb-2 ${isOpen ? 'text-gray-800' : 'text-green-600'}`}>
                                {num}
                            </span>
                            <span className="text-sm font-medium text-gray-600 truncate max-w-[90%] text-center">
                                {isOpen ? (comanda.customer_name || 'Ocupada') : 'Livre'}
                            </span>

                            {isOpen && (
                                <>
                                    <span className="mt-2 text-sm font-bold text-gray-800 bg-white px-2 py-1 rounded-full shadow-sm">
                                        R$ {comanda.total.toFixed(2)}
                                    </span>
                                    {comanda.waiter_id && (
                                        <span className="absolute bottom-2 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
                                            {getWaiterName(comanda.waiter_id)}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal de Detalhes */}
            {showModal && selectedComanda && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

                        {/* Header Modal */}
                        <div className={`p-6 border-b flex justify-between items-start rounded-t-2xl ${selectedComanda.closing_requested ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    Mesa {selectedComanda.table_number}
                                    {selectedComanda.closing_requested && (
                                        <span className="text-sm font-bold bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-1">
                                            <BellRing className="w-4 h-4" /> Solicitação de Conta
                                        </span>
                                    )}
                                </h3>
                                <div className="flex flex-col gap-1 mt-1">
                                    <p className="text-gray-500 flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {selectedComanda.customer_name}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        Garçom: {getWaiterName(selectedComanda.waiter_id)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Conteúdo Modal */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Lista de Itens */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-3 sticky top-0 bg-white py-2">
                                    <FileText className="w-4 h-4" /> Consumo Atual
                                </h4>

                                {(!selectedComanda.items || selectedComanda.items.length === 0) ? (
                                    <p className="text-gray-400 text-center py-4 italic">Nenhum item adicionado.</p>
                                ) : (
                                    selectedComanda.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <span className="bg-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm">
                                                    {item.quantity}x
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-800">{item.product_name}</p>
                                                    <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)} un.</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-700">
                                                R$ {(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Adicionar Item */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Adicionar Pedido
                                </h4>
                                <div className="flex gap-2 flex-wrap">
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="flex-[2] p-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                                    >
                                        <option value="">Selecione um produto...</option>
                                        {products
                                            .filter(p => p.available)
                                            .map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} - R$ {p.price.toFixed(2)}
                                                </option>
                                            ))}
                                    </select>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-20 p-2 rounded-lg border border-blue-200 text-center font-bold"
                                    />
                                    <button
                                        onClick={addItem}
                                        disabled={!selectedProduct}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex-1"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            </div>

                            {/* Trocar Garçom (Opcional, se necessário) */}
                            {!selectedComanda.waiter_id && waiters.length > 0 && (
                                <div className="mt-4">
                                    <label className="text-sm text-gray-600 block mb-1">Atribuir Garçom:</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                        onChange={async (e) => {
                                            const wid = e.target.value;
                                            if (!wid) return;
                                            await supabase.from('comandas').update({ waiter_id: wid }).eq('id', selectedComanda.id);
                                            loadComandas();
                                            toast.success('Garçom atribuído!');
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecione...</option>
                                        {waiters.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                        </div>

                        {/* Footer Modal - Total e Ações */}
                        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-gray-600 font-medium">Total da Mesa</span>
                                <span className="text-3xl font-bold text-gray-900">
                                    R$ {selectedComanda.total.toFixed(2)}
                                </span>
                            </div>

                            <button
                                onClick={closeComanda}
                                className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                            >
                                <DollarSign className="w-6 h-6" />
                                Fechar Conta e Receber
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ComandaManager;
