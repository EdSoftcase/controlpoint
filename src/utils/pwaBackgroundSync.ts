import { RegistroPontoREPP } from '../types/operational';

const DB_NAME = 'point_control_offline_db';
const STORE_NAME = 'offline_punches';
const DB_VERSION = 1;

/**
 * Inicializa ou abre o banco IndexedDB para armazenamento offline persistente de batidas de ponto.
 */
export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste navegador.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Armazena uma batida de ponto no IndexedDB enquanto o dispositivo está offline.
 */
export async function saveOfflinePunchToIDB(registro: RegistroPontoREPP): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const record = {
        ...registro,
        id: registro.nsr ? `nsr-${registro.nsr}` : `offline-${Date.now()}`,
        savedAt: new Date().toISOString(),
        synced: false
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao salvar ponto no IndexedDB:', err);
  }
}

/**
 * Retorna todas as batidas de ponto armazenadas offline no IndexedDB.
 */
export async function getOfflinePunchesFromIDB(): Promise<any[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao ler batidas offline do IndexedDB:', err);
    return [];
  }
}

/**
 * Remove um registro do IndexedDB após sincronização bem-sucedida com o Supabase.
 */
export async function removeOfflinePunchFromIDB(id: string): Promise<void> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Erro ao remover ponto sincronizado do IndexedDB:', err);
  }
}

/**
 * Sincroniza automaticamente a fila offline com o Supabase assim que a conexão retorna.
 */
export async function syncOfflineQueueToSupabase(supabaseClient: any): Promise<number> {
  if (!navigator.onLine || !supabaseClient) return 0;

  const offlinePunches = await getOfflinePunchesFromIDB();
  if (offlinePunches.length === 0) return 0;

  let syncedCount = 0;

  for (const item of offlinePunches) {
    try {
      const payload = {
        nsr: item.nsr,
        tenant_id: item.tenantId,
        collaborator_id: item.colaboradorId,
        data_hora: item.dataHora,
        tipo_marcacao: item.tipoMarcacao,
        latitude: item.latitude,
        longitude: item.longitude,
        hash_sha256: item.hashSha256,
        modo_dispositivo: 'OFFLINE_SYNC_PWA',
        detalhes: JSON.stringify({
          empregadorRazaoSocial: item.empregadorRazaoSocial,
          empregadorCnpj: item.empregadorCnpj,
          colaboradorNome: item.colaboradorNome,
          colaboradorCpf: item.colaboradorCpf,
          colaboradorMatricula: item.colaboradorMatricula,
          coletorId: item.coletorId
        })
      };

      const { error } = await supabaseClient.from('point_registrations').insert(payload);
      if (!error) {
        await removeOfflinePunchFromIDB(item.id);
        syncedCount++;
      } else {
        console.warn('Erro ao sincronizar registro pendente:', error.message);
      }
    } catch (e) {
      console.warn('Falha na sincronização do item offline:', e);
    }
  }

  return syncedCount;
}

/**
50: * Registra listeners de rede para disparar sincronização automática via Service Worker / Eventos Online.
   */
export function initBackgroundSyncListener(supabaseClient: any, onSyncComplete?: (count: number) => void): () => void {
  const handleOnline = async () => {
    console.log('Conexão restabelecida. Iniciando sincronização automática de batidas offline...');
    const count = await syncOfflineQueueToSupabase(supabaseClient);
    if (count > 0 && onSyncComplete) {
      onSyncComplete(count);
    }
  };

  window.addEventListener('online', handleOnline);

  // Executa checagem inicial caso já esteja online
  if (navigator.onLine) {
    handleOnline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
