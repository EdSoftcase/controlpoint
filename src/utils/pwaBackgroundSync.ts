import { RegistroPontoREPP } from '../types/operational';
import { getOfflineQueue, removeOfflineRecord } from './offlineManager';

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
        id: registro.id || (registro.nsr ? `nsr-${registro.nsr}` : `offline-${Date.now()}`),
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
 * Remove um registro do IndexedDB após sincronização bem-sucedida com o servidor.
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
 * Sincroniza batidas pendentes (IndexedDB + localStorage) via endpoint autenticado /api/sync-offline-punches
 */
export async function syncOfflineQueueWithServer(bearerToken?: string | null): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

  const idbItems = await getOfflinePunchesFromIDB();
  const lsItems = getOfflineQueue().map((q) => ({
    ...q.registro,
    _lsId: q.id,
    id: q.id,
  }));

  if (idbItems.length === 0 && lsItems.length === 0) return 0;

  const mergedMap = new Map<string, any>();
  for (const item of idbItems) {
    const dedupKey = item.hashSha256 || item.id;
    mergedMap.set(dedupKey, { ...item, _idbId: item.id });
  }
  for (const item of lsItems) {
    const dedupKey = item.hashSha256 || item.id;
    const existing = mergedMap.get(dedupKey);
    mergedMap.set(dedupKey, existing ? { ...existing, _lsId: item._lsId } : item);
  }

  const unified = Array.from(mergedMap.values());
  if (unified.length === 0 || !bearerToken) return 0;

  try {
    const res = await fetch('/api/sync-offline-punches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`
      },
      body: JSON.stringify({
        punches: unified.map((u) => ({
          clientId: u.id,
          colaboradorId: u.colaboradorId,
          tenantId: u.tenantId,
          tipoMarcacao: u.tipoMarcacao,
          latitude: u.latitude,
          longitude: u.longitude,
          coletorId: u.coletorId,
          modoDispositivo: u.modoDispositivo || 'OFFLINE_SYNC_PWA',
          dataHora: u.dataHora,
          offlineClientHash: u.hashSha256,
          similaridadeFacial: u.similaridadeFacial,
          livenessScore: u.livenessScore
        }))
      })
    });

    if (!res.ok) return 0;
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    let syncedCount = 0;
    for (let i = 0; i < unified.length; i++) {
      const item = unified[i];
      const result = results.find((r: any) => r.clientId === item.id) || results[i];
      if (result && (result.status === 'SYNCED' || result.status === 'ALREADY_SYNCED' || result.status === 'REJECTED_PERMANENT')) {
        if (item._idbId) await removeOfflinePunchFromIDB(item._idbId);
        if (item._lsId) removeOfflineRecord(item._lsId);
        if (result.status === 'SYNCED') syncedCount++;
      }
    }

    return syncedCount;
  } catch (err) {
    console.warn('Falha na sincronização da fila offline:', err);
    return 0;
  }
}

/**
 * Registra listeners de rede para disparar sincronização automática via eventos Online.
 */
export function initBackgroundSyncListener(
  bearerTokenOrClient: string | null | undefined | any,
  onSyncComplete?: (count: number) => void
): () => void {
  const token = typeof bearerTokenOrClient === 'string' ? bearerTokenOrClient : null;

  const handleOnline = async () => {
    if (!token) return;
    const count = await syncOfflineQueueWithServer(token);
    if (count > 0 && onSyncComplete) {
      onSyncComplete(count);
    }
  };

  window.addEventListener('online', handleOnline);

  if (typeof navigator !== 'undefined' && navigator.onLine && token) {
    handleOnline();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
