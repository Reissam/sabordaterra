import { useState, useEffect } from 'react';
import { IndexedDBLogoStorage } from '../lib/indexedDB';

export const useIndexedDBLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<{ available: boolean; usage?: string }>({ available: false });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadLogoFromStorage();
      updateStorageInfo();
    }
  }, [isClient]);

  const loadLogoFromStorage = async () => {
    if (!isClient) return;
    
    try {
      setLoading(true);
      
      // Tentar carregar do IndexedDB primeiro
      const logo = await IndexedDBLogoStorage.loadLogo();
      setLogoUrl(logo);
      
      console.log('📱 Logo carregada:', logo ? 'disponível' : 'não encontrada');
    } catch (error) {
      console.error('❌ Erro ao carregar logo:', error);
      setLogoUrl('');
    } finally {
      setLoading(false);
    }
  };

  const saveLogoToStorage = async (logoDataUrl: string) => {
    if (!isClient) return;
    
    try {
      if (!logoDataUrl) {
        // Remover logo
        await IndexedDBLogoStorage.removeLogo();
        setLogoUrl('');
      } else {
        // Salvar logo
        await IndexedDBLogoStorage.saveLogo(logoDataUrl);
        setLogoUrl(logoDataUrl);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar logo:', error);
    }
  };

  const updateStorageInfo = async () => {
    if (!isClient) return;
    
    const info = await IndexedDBLogoStorage.getStorageInfo();
    setStorageInfo(info);
  };

  const clearAllData = async () => {
    if (!isClient) return;
    
    try {
      await IndexedDBLogoStorage.removeLogo();
      setLogoUrl('');
      console.log('🗑️ Todos os dados de logo removidos');
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  };

  // Tentativa de sincronização com Supabase (quando disponível)
  const syncWithSupabase = async () => {
    if (!isClient) return false;
    
    try {
      const { supabase } = await import('../lib/supabase');

      // 1) Tenta schema novo: settings(id='main', logo_url)
      // (mantemos por compatibilidade caso você recrie a tabela conforme o SQL anterior)
      const { data: dataById, error: errorById } = await supabase
        .from('settings')
        .select('logo_url')
        .eq('id', 'main')
        .maybeSingle();

      if (!errorById && dataById?.logo_url) {
        await saveLogoToStorage(dataById.logo_url);
        console.log('🔄 Logo sincronizada do Supabase (settings.id=main) para IndexedDB');
        return true;
      }

      // 2) Tenta schema atual do seu Supabase: settings(key='custom_logo', value)
      const { data: dataByKey, error: errorByKey } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'custom_logo')
        .maybeSingle();

      if (!errorByKey && dataByKey?.value) {
        await saveLogoToStorage(dataByKey.value);
        console.log('🔄 Logo sincronizada do Supabase (settings.key=custom_logo) para IndexedDB');
        return true;
      }
    } catch (error) {
      console.log('⚠️ Supabase indisponível, usando apenas armazenamento local');
    }
    return false;
  };

  return {
    logoUrl,
    loading,
    storageInfo,
    saveLogo: saveLogoToStorage,
    reloadLogo: loadLogoFromStorage,
    clearLogo: clearAllData,
    syncWithSupabase,
    isIndexedDBSupported: isClient && IndexedDBLogoStorage.isSupported()
  };
};
