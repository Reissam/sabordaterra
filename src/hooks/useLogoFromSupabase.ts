import { useState, useEffect } from 'react';
import { useIndexedDBLogo } from './useIndexedDBLogo';

export const useLogoFromSupabase = () => {
  const { logoUrl, loading, syncWithSupabase } = useIndexedDBLogo();

  useEffect(() => {
    // Tentar sincronizar com Supabase quando disponível
    const trySync = async () => {
      const synced = await syncWithSupabase();
      if (synced) {
        console.log('🔄 Logo sincronizada com Supabase');
      }
    };

    // Tentar sincronização a cada 30 segundos
    const interval = setInterval(trySync, 30000);
    
    // Tentar sincronização imediata
    trySync();

    return () => clearInterval(interval);
  }, [syncWithSupabase]);

  return { 
    logoUrl, 
    loading, 
    reloadLogo: async () => {
      // Recarregar tentando sincronizar com Supabase
      await syncWithSupabase();
    }
  };
};
