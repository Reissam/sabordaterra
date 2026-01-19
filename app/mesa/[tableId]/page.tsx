'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { useParams } from 'next/navigation';
import { Plus, BellRing, User } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import CustomerFormModal from '../../../src/components/CustomerFormModal';
import { Customer } from '../../../lib/types';

// Tipos
type Product = {
    id: string;
    name: string;
    price: number;
    type: 'food' | 'drink';
    category: string;
    available: boolean;
};

type ComandaItem = {
    id?: string;
    comanda_id?: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    status: 'pending' | 'delivered' | 'cancelled';
};

export default function TablePage() {
    const params = useParams();
    const tableId = params.tableId as string;

    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<ComandaItem[]>([]);
    const [activeTab, setActiveTab] = useState<'food' | 'drink'>('food');
    const [loading, setLoading] = useState(true);
    const [comandaId, setComandaId] = useState<string | null>(null);
    const [comandaTotal, setComandaTotal] = useState(0);
    const [comandaItems, setComandaItems] = useState<ComandaItem[]>([]);
    const [requestingBill, setRequestingBill] = useState(false);
    const [isComandaOpen, setIsComandaOpen] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null); // Novo: manter ID do pedido atual

    // Função para enviar notificação Telegram
    const sendTelegramNotification = async (data: {
        orderNumber: string;
        items: any[];
        customer: Customer;
        total: number;
        isAddition: boolean;
    }) => {
        try {
            const telegramData = {
                orderNumber: data.orderNumber,
                date: new Date().toLocaleDateString('pt-BR'),
                time: new Date().toLocaleTimeString('pt-BR'),
                isAddition: data.isAddition,
                customer: {
                    name: data.customer.name,
                    phone: data.customer.phone || '(96) 98765-4321',
                    address: `Mesa ${tableId}`,
                    email: data.customer.email
                },
                items: data.items.map(item => ({
                    name: item.product_name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.total
                })),
                payment: {
                    method: 'cash' as const
                },
                totals: {
                    subtotal: data.total,
                    deliveryFee: 0,
                    total: data.total
                },
                observation: data.isAddition 
                    ? `Adição de itens - Mesa ${tableId}`
                    : 'Pedido realizado via QR Code'
            };

            await fetch('/api/send-telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(telegramData),
            });
        } catch (error) {
            console.error('Erro ao enviar notificação Telegram:', error);
        }
    };

    // Auth State
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    // Carregar produtos e verificar comanda
    useEffect(() => {
        loadProducts();
        checkOpenComanda();
        checkLogin();

        // Polling para atualizar status da comanda
        const interval = setInterval(checkOpenComanda, 10000);
        return () => clearInterval(interval);
    }, [tableId]);

    const checkLogin = () => {
        // Verificar se estamos no browser antes de acessar localStorage
        if (typeof window !== 'undefined') {
            const savedCustomer = localStorage.getItem('rememberedCustomer');
            if (savedCustomer) {
                try {
                    setCurrentCustomer(JSON.parse(savedCustomer));
                } catch (e) {
                    console.error("Erro ao ler cliente salvo", e);
                    setShowCustomerModal(true);
                }
            } else {
                setShowCustomerModal(true);
            }
        }
    };

    const handleLoginSuccess = (customer: Customer) => {
        setCurrentCustomer(customer);
        setShowCustomerModal(false);
        toast.success(`Bem-vindo, ${customer.name}!`);
    };

    const loadProducts = async () => {
        if (!supabase) {
            console.warn('Supabase não configurado');
            setLoading(false);
            return;
        }
        
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('available', true)
            .order('name');

        if (data) setProducts(data);
        setLoading(false);
    };

    const checkOpenComanda = async () => {
        if (!supabase) {
            console.warn('Supabase não configurado');
            return;
        }
        
        // Buscar comanda ABERTA para esta mesa
        const { data: comanda } = await supabase
            .from('comandas')
            .select('*, comanda_items(*)')
            .eq('table_number', tableId)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (comanda) {
            setComandaId(comanda.id);
            setIsComandaOpen(true);
            setComandaTotal(comanda.total);
            setComandaItems(comanda.comanda_items || []);

            if (comanda.closing_requested) {
                setRequestingBill(true);
            } else {
                setRequestingBill(false);
            }
        } else {
            setComandaId(null);
            setIsComandaOpen(false);
            setComandaTotal(0);
            setComandaItems([]);
        }
    };

    const addToCart = (product: Product) => {
        if (!currentCustomer) {
            setShowCustomerModal(true);
            toast.error('Identifique-se para fazer pedidos');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.product_name === product.name);
            if (existing) {
                return prev.map(item =>
                    item.product_name === product.name
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                        : item
                );
            }
            return [...prev, {
                product_name: product.name,
                quantity: 1,
                price: product.price,
                total: product.price,
                status: 'pending'
            }];
        });
        toast.success(`${product.name} adicionado!`);
    };

    const removeFromCart = (productName: string) => {
        setCart(prev => prev.filter(item => item.product_name !== productName));
    };

    const sendOrder = async () => {
        if (cart.length === 0) return;
        if (!currentCustomer) {
            setShowCustomerModal(true);
            return;
        }

        try {
            if (!supabase) {
                toast.error('Supabase não configurado');
                return;
            }

            let currentComandaId = comandaId;
            let targetOrderId = currentOrderId; // Usar pedido existente ou criar novo

            // Se não houver comanda aberta, abrir uma nova
            if (!currentComandaId) {
                const { data: newComanda, error: createError } = await supabase
                    .from('comandas')
                    .insert({
                        table_number: parseInt(tableId),
                        status: 'open',
                        total: 0,
                        customer_name: currentCustomer.name
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                currentComandaId = newComanda.id;
            }

            // Se não houver pedido aberto para esta mesa, criar um novo
            if (!targetOrderId) {
                const orderNumber = `MESA${tableId}-${Date.now().toString().slice(-6)}`;
                
                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        customer_id: currentCustomer.id,
                        items: cart,
                        total: cart.reduce((sum, item) => sum + item.total, 0),
                        status: 'pending',
                        payment_method: 'Comanda (Mesa)',
                        address: `Mesa ${tableId}`,
                        customer_name: currentCustomer.name,
                        observation: 'Pedido realizado via QR Code',
                        order_number: orderNumber
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;
                targetOrderId = newOrder.id;
                setCurrentOrderId(targetOrderId);

                // Enviar notificação de NOVO PEDIDO
                await sendTelegramNotification({
                    orderNumber,
                    items: cart,
                    customer: currentCustomer,
                    total: cart.reduce((sum, item) => sum + item.total, 0),
                    isAddition: false // Primeiro pedido
                });

            } else {
                // Adicionar itens ao pedido existente
                const { data: existingOrder } = await supabase
                    .from('orders')
                    .select('items, total, observation')
                    .eq('id', targetOrderId)
                    .single();

                if (existingOrder) {
                    const currentItems = existingOrder.items || [];
                    const currentTotal = existingOrder.total || 0;
                    const currentObservation = existingOrder.observation || 'Pedido realizado via QR Code';
                    
                    const newItems = [...currentItems, ...cart];
                    const additionalTotal = cart.reduce((sum, item) => sum + item.total, 0);
                    const newTotal = currentTotal + additionalTotal;

                    // Atualizar pedido existente com novos itens e timestamp
                    await supabase
                        .from('orders')
                        .update({
                            items: newItems,
                            total: newTotal,
                            updated_at: new Date().toISOString(),
                            observation: currentObservation + `\n[${new Date().toLocaleTimeString()}] Itens adicionados`
                        })
                        .eq('id', targetOrderId);

                    // Enviar notificação de ADIÇÃO DE ITENS
                    await sendTelegramNotification({
                        orderNumber: `MESA${tableId}-${targetOrderId.slice(-6)}`,
                        items: cart,
                        customer: currentCustomer,
                        total: additionalTotal,
                        isAddition: true // Adição de itens
                    });
                }
            }

            // Inserir itens na comanda (sempre)
            const itemsToInsert = cart.map(item => ({
                comanda_id: currentComandaId,
                product_name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                status: 'pending',
                created_at: new Date().toISOString() // Registrar hora exata
            }));

            const { error: itemsError } = await supabase
                .from('comanda_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Atualizar total da comanda
            const orderBatchTotal = cart.reduce((sum, item) => sum + item.total, 0);
            const newComandaTotal = comandaTotal + orderBatchTotal;
            await supabase
                .from('comandas')
                .update({ total: newComandaTotal })
                .eq('id', currentComandaId);

            toast.success(targetOrderId ? 'Itens adicionados ao pedido existente!' : 'Novo pedido criado!');
            setCart([]);
            checkOpenComanda();

        } catch (error: any) {
            console.error('Erro ao enviar pedido:', error);
            const msg = error?.message || 'Erro desconhecido';
            const details = error?.details || '';
            toast.error(`Erro ao enviar: ${msg} ${details}`, { duration: 5000 });
            alert(`Erro detalhado: ${JSON.stringify(error)}`);
        }
    };

    const requestBill = async () => {
        if (!comandaId || !supabase) return;

        try {
            await supabase
                .from('comandas')
                .update({ closing_requested: true })
                .eq('id', comandaId);

            setRequestingBill(true);
            toast.success('Conta solicitada! Aguarde o garçom.');
        } catch (error) {
            toast.error('Erro ao solicitar conta.');
        }
    };

    const filteredProducts = products.filter(p =>
        activeTab === 'food' ? p.type === 'food' : p.type === 'drink'
    );

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <Toaster position="top-center" />

            {/* Header */}
            <header className="bg-red-600 text-white p-4 sticky top-0 z-10 shadow-md">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">Mesa {tableId}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentCustomer && (
                            <div className="flex items-center gap-1 text-xs bg-red-700 px-2 py-1 rounded">
                                <User className="w-3 h-3" />
                                {currentCustomer.name.split(' ')[0]}
                            </div>
                        )}
                        {/* Sempre mostrar o total se comanda aberta, ou 0.00 */}
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                            R$ {comandaTotal.toFixed(2)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex bg-white shadow-sm sticky top-16 z-10">
                <button
                    onClick={() => setActiveTab('food')}
                    className={`flex-1 py-3 font-medium text-center ${activeTab === 'food' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}
                >
                    Pratos
                </button>
                <button
                    onClick={() => setActiveTab('drink')}
                    className={`flex-1 py-3 font-medium text-center ${activeTab === 'drink' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`}
                >
                    Bebidas
                </button>
            </div>

            {/* Products List */}
            <div className="p-4 space-y-4">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800">{product.name}</h3>
                            <p className="text-red-600 font-bold">R$ {product.price.toFixed(2)}</p>
                        </div>
                        <button
                            onClick={() => addToCart(product)}
                            className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Cart Sheet */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 rounded-t-2xl z-20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Seu Pedido ({cart.length} itens)</h3>
                        <span className="font-bold text-xl text-red-600">R$ {cartTotal.toFixed(2)}</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span>{item.quantity}x {item.product_name}</span>
                                <div className="flex items-center gap-2">
                                    <span>R$ {item.total.toFixed(2)}</span>
                                    <button onClick={() => removeFromCart(item.product_name)} className="text-red-500 font-bold px-2">X</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={sendOrder}
                        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-700 transition"
                    >
                        Enviar Pedido
                    </button>
                </div>
            )}

            {/* Floating Action Buttons (Quando não há itens no carrinho) */}
            {cart.length === 0 && isComandaOpen && (
                <div className="fixed bottom-6 right-6 z-10 flex flex-col gap-3 items-end">
                    {/* Botão Ver Pedidos */}
                    <button
                        onClick={() => setShowOrderModal(true)}
                        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    >
                        📝 Ver Pedido
                    </button>

                    {/* Botão Pedir Conta */}
                    <button
                        onClick={requestBill}
                        disabled={requestingBill}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-bold transition-all ${requestingBill
                            ? 'bg-yellow-400 text-yellow-900 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        <BellRing className="w-5 h-5" />
                        {requestingBill ? 'Conta Solicitada' : 'Pedir Conta'}
                    </button>
                </div>
            )}

            {/* Modal de Pedidos (View Order) */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="font-bold text-lg">Detalhes do Pedido</h2>
                            <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-800 font-bold text-xl">&times;</button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1">
                            {comandaItems.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Nenhum item pedido ainda.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-gray-400 text-xs uppercase">Itens Enviados</h3>
                                        {comandaItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">{item.product_name}</span>
                                                    <span className="text-xs text-gray-400">{item.status === 'pending' ? '🕒 Aguardando' : '✅ Entregue'}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-gray-600">x{item.quantity}</span>
                                                    <div className="text-xs text-gray-500">R$ {item.total?.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-dashed border-gray-300 mt-4 flex justify-between items-end">
                                        <span className="font-bold text-lg text-gray-800">Total</span>
                                        <div className="text-right">
                                            <span className="block font-bold text-2xl text-green-600">R$ {comandaTotal.toFixed(2)}</span>
                                            {requestingBill && <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Conta Solicitada</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Auth Modal */}
            <CustomerFormModal
                isOpen={showCustomerModal}
                onClose={() => {
                    // Bloqueia fechamento se não estiver logado
                    if (currentCustomer) {
                        setShowCustomerModal(false);
                    }
                }}
                onSave={(data) => {
                    // Fallback
                }}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    );
}
