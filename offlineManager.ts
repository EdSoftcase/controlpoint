import { RegistroPontoREPP } from '../types/operational';

const OFFLINE_QUEUE_KEY = 'softcase_offline_ponto_queue_v1';
const CLOCK_DRIFT_KEY = 'softcase_clock_drift_offset';

export interface OfflineQueueItem {
  id: string;
  registro: RegistroPontoREPP;
  timestampLocal: string;
  deviceTimeOffsetMs: number;
  syncAttempts: number;
}

/**
 * Obtém os registros pendentes na fila offline do navegador (localStorage / IndexedDB wrapper)
 */
export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Adiciona um novo registro de ponto na fila offline com hash e carimbo de tempo
 */
export function enqueueOfflineRecord(registro: RegistroPontoREPP, driftMs: number = 0): void {
  try {
    const queue = getOfflineQueue();
    const newItem: OfflineQueueItem = {
      id: registro.id || `offline-${Date.now()}`,
      registro,
      timestampLocal: new Date().toISOString(),
      deviceTimeOffsetMs: driftMs,
      syncAttempts: 0
    };
    queue.push(newItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Erro ao enfileirar registro offline:', err);
  }
}

/**
 * Remove um item sincronizado da fila offline
 */
export function removeOfflineRecord(id: string): void {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Erro ao remover registro da fila offline:', err);
  }
}

/**
 * Calcula o desvio de relógio (Clock Drift) comparando o relógio local com o horário do servidor (estimado)
 */
export async function checkClockDrift(serverTimeEndpointUrl?: string): Promise<number> {
  try {
    const start = performance.now();
    const res = await fetch(serverTimeEndpointUrl || '/api/health', { method: 'HEAD', cache: 'no-store' });
    const end = performance.now();
    const latency = (end - start) / 2;

    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const localTime = Date.now() - latency;
      const drift = localTime - serverTime;
      localStorage.setItem(CLOCK_DRIFT_KEY, String(drift));
      return drift;
    }
  } catch {
    // Falha na rede / offline: retorna último drift conhecido ou 0
    const cached = localStorage.getItem(CLOCK_DRIFT_KEY);
    if (cached) return Number(cached);
  }
  return 0;
}

/**
 * Monitora o nível de bateria e capacidade de armazenamento do dispositivo para quiosques/tablets
 */
export async function getDeviceHealthStatus(): Promise<{ batteryLevel: number | null; storageQuotaPercent: number | null; isCharging: boolean | null }> {
  let batteryLevel: number | null = null;
  let isCharging: boolean | null = null;
  let storageQuotaPercent: number | null = null;

  try {
    // @ts-ignore
    if (navigator.getBattery) {
      // @ts-ignore
      const battery = await navigator.getBattery();
      batteryLevel = Math.round(battery.level * 100);
      isCharging = battery.charging;
    }
  } catch {
    // Bateria não suportada no browser
  }

  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        storageQuotaPercent = Math.round((estimate.usage / estimate.quota) * 100);
      }
    }
  } catch {
    // Storage estimate não suportado
  }

  return { batteryLevel, storageQuotaPercent, isCharging };
}
