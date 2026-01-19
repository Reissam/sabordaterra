// IndexedDB Helper para Logo do Restaurante
export interface LogoData {
  id: string;
  logoUrl: string;
  timestamp: number;
  version: number;
}

export class IndexedDBLogoStorage {
  private static readonly DB_NAME = 'LaCoDeOuroDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'logos';

  // Abrir conexão com o banco
  static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      // Criar schema do banco
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar object store para logos
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          
          // Criar índices para busca rápida
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  // Salvar logo no IndexedDB
  static async saveLogo(logoUrl: string): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      const logoData: LogoData = {
        id: 'main',
        logoUrl,
        timestamp: Date.now(),
        version: 1
      };

      await store.put(logoData);
      
      // Aguardar transação completar
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Fallback para localStorage
      localStorage.setItem('customLogo', logoUrl);
      
      console.log('✅ Logo salva no IndexedDB e localStorage');
    } catch (error) {
      console.error('❌ Erro ao salvar logo no IndexedDB:', error);
      // Fallback para localStorage
      localStorage.setItem('customLogo', logoUrl);
    }
  }

  // Carregar logo do IndexedDB
  static async loadLogo(): Promise<string> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);

      const request = store.get('main');
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result as LogoData | undefined;
          
          if (result && result.logoUrl) {
            console.log('✅ Logo carregada do IndexedDB');
            resolve(result.logoUrl);
          } else {
            // Fallback para localStorage
            const savedLogo = localStorage.getItem('customLogo');
            if (savedLogo) {
              console.log('⚠️ Logo carregada do localStorage (fallback)');
              resolve(savedLogo);
            } else {
              console.log('📭 Nenhuma logo encontrada');
              resolve('');
            }
          }
        };

        request.onerror = () => {
          console.error('❌ Erro ao carregar logo do IndexedDB');
          // Fallback para localStorage
          const savedLogo = localStorage.getItem('customLogo');
          resolve(savedLogo || '');
        };
      });
    } catch (error) {
      console.error('❌ Erro ao acessar IndexedDB:', error);
      // Fallback para localStorage
      const savedLogo = localStorage.getItem('customLogo');
      console.log('⚠️ Usando fallback localStorage');
      return savedLogo || '';
    }
  }

  // Remover logo do IndexedDB
  static async removeLogo(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      await store.delete('main');
      
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      // Remover do localStorage também
      localStorage.removeItem('customLogo');
      
      console.log('✅ Logo removida do IndexedDB e localStorage');
    } catch (error) {
      console.error('❌ Erro ao remover logo do IndexedDB:', error);
      // Remover do localStorage mesmo com erro
      localStorage.removeItem('customLogo');
    }
  }

  // Verificar se IndexedDB está disponível
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  }

  // Obter informações de armazenamento
  static async getStorageInfo(): Promise<{ available: boolean; usage?: string }> {
    if (!this.isSupported()) {
      return { available: false };
    }

    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          available: true,
          usage: `${Math.round((estimate.usage || 0) / 1024 / 1024)}MB / ${Math.round((estimate.quota || 0) / 1024 / 1024)}MB`
        };
      }
      return { available: true };
    } catch (error) {
      return { available: true };
    }
  }
}
