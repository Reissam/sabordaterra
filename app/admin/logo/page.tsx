'use client';

import React, { useState, useEffect } from 'react';
import LogoUpload from '../../../src/components/LogoUpload';
import { useIndexedDBLogo } from '../../../src/hooks/useIndexedDBLogo';
import { supabase } from '../../../src/lib/supabase';

const LogoManager: React.FC = () => {
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { logoUrl, saveLogo, loading: hookLoading, storageInfo, isIndexedDBSupported } = useIndexedDBLogo();

  useEffect(() => {
    // Carregar logo do IndexedDB
    setCurrentLogo(logoUrl);
  }, [logoUrl]);

  const handleLogoChange = async (logoDataUrl: string) => {
    setCurrentLogo(logoDataUrl);
    setLoading(true);
    
    try {
      // Salvar no IndexedDB (com fallback para localStorage)
      await saveLogo(logoDataUrl);

      // Salvar no Supabase para persistir entre dispositivos/sessões
      if (logoDataUrl && supabase) {
        const { data: existing, error: existingError } = await supabase
          .from('settings')
          .select('id')
          .eq('key', 'custom_logo')
          .maybeSingle();

        if (existingError) {
          console.error('❌ Erro ao verificar logo no Supabase:', existingError);
        } else if (existing?.id) {
          const { error: updateError } = await supabase
            .from('settings')
            .update({
              value: logoDataUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar logo no Supabase:', updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('settings')
            .insert({
              key: 'custom_logo',
              value: logoDataUrl,
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Erro ao inserir logo no Supabase:', insertError);
          }
        }
      } else if (supabase) {
        const { error: deleteError } = await supabase
          .from('settings')
          .delete()
          .eq('key', 'custom_logo');

        if (deleteError) {
          console.error('❌ Erro ao remover logo do Supabase:', deleteError);
        }
      }

      console.log('✅ Logo salva localmente e sincronizada com Supabase');
    } catch (error) {
      console.error('❌ Erro ao salvar logo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Gerenciador de Logo
            </h1>
            <p className="text-gray-600 mb-4">
              Personalize a logo do Restaurante Sabor da Terra
            </p>
            
            {/* Status do Armazenamento */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isIndexedDBSupported ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-gray-700">
                  {isIndexedDBSupported ? 'IndexedDB disponível' : 'Usando localStorage'}
                </span>
                {storageInfo.usage && (
                  <span className="text-gray-500">({storageInfo.usage})</span>
                )}
              </div>
            </div>
            
            {loading && (
              <div className="mt-4 text-blue-600 text-sm flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Salvando logo no armazenamento local...
              </div>
            )}
            
            {hookLoading && (
              <div className="mt-4 text-gray-600 text-sm flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                Carregando logo...
              </div>
            )}
          </div>

          <LogoUpload 
            onLogoChange={handleLogoChange}
            currentLogo={currentLogo}
          />

          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              Voltar ao Cardápio
            </button>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Painel Administrativo
            </button>
          </div>

          {/* Informações de Armazenamento */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">💾 Armazenamento</h3>
            <p className="text-xs text-gray-600">
              A logo é salva permanentemente no IndexedDB do navegador, 
              sobrevivendo à limpeza de histórico e cache. 
              Quando o Supabase estiver disponível, os dados serão sincronizados automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoManager;
