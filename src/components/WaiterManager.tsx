import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserPlus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Waiter = {
    id: string;
    name: string;
    active: boolean;
};

const WaiterManager: React.FC = () => {
    const [waiters, setWaiters] = useState<Waiter[]>([]);
    const [newWaiterName, setNewWaiterName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadWaiters();
    }, []);

    const loadWaiters = async () => {
        try {
            const { data, error } = await supabase
                .from('waiters')
                .select('*')
                .order('name');

            if (error) throw error;
            setWaiters(data || []);
        } catch (error) {
            toast.error('Erro ao carregar garçons');
        } finally {
            setLoading(false);
        }
    };

    const addWaiter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWaiterName.trim()) return;

        try {
            const { data, error } = await supabase
                .from('waiters')
                .insert({ name: newWaiterName, active: true })
                .select()
                .single();

            if (error) throw error;

            setWaiters([...waiters, data]);
            setNewWaiterName('');
            toast.success('Garçom adicionado!');
        } catch (error) {
            toast.error('Erro ao adicionar garçom');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('waiters')
                .update({ active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            setWaiters(waiters.map(w =>
                w.id === id ? { ...w, active: !currentStatus } : w
            ));
            toast.success('Status atualizado!');
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const deleteWaiter = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este garçom?')) return;

        try {
            const { error } = await supabase
                .from('waiters')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setWaiters(waiters.filter(w => w.id !== id));
            toast.success('Garçom removido!');
        } catch (error) {
            toast.error('Erro ao remover garçom');
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestão de Garçons</h2>
                    <p className="text-gray-600">Cadastre e gerencie sua equipe</p>
                </div>
            </div>

            <form onSubmit={addWaiter} className="mb-8 flex gap-2">
                <input
                    type="text"
                    value={newWaiterName}
                    onChange={(e) => setNewWaiterName(e.target.value)}
                    placeholder="Nome do novo garçom"
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
                <button
                    type="submit"
                    disabled={!newWaiterName.trim()}
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                    <UserPlus className="w-5 h-5" />
                    Adicionar
                </button>
            </form>

            <div className="space-y-3">
                {waiters.map((waiter) => (
                    <div key={waiter.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${waiter.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800">{waiter.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${waiter.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {waiter.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleStatus(waiter.id, waiter.active)}
                                className={`p-2 rounded-lg transition ${waiter.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                title={waiter.active ? 'Desativar' : 'Ativar'}
                            >
                                {waiter.active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => deleteWaiter(waiter.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remover"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {waiters.length === 0 && (
                    <p className="text-center text-gray-500 py-4">Nenhum garçom cadastrado.</p>
                )}
            </div>
        </div>
    );
};

export default WaiterManager;
