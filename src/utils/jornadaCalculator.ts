import { RegistroPontoREPP } from '../types/operational';

export interface WorkedTimeResult {
  totalMinutes: number;
  formatted: string;
  hasPunches: boolean;
  isInProgress: boolean;
}

export function calculateWorkedTime(dayRegistros: RegistroPontoREPP[]): WorkedTimeResult {
  if (!dayRegistros || dayRegistros.length === 0) {
    return { totalMinutes: 0, formatted: '-', hasPunches: false, isInProgress: false };
  }

  const sorted = [...dayRegistros]
    .filter((r) => !Number.isNaN(new Date(r.dataHora).getTime()))
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  if (sorted.length === 0) {
    return { totalMinutes: 0, formatted: '-', hasPunches: false, isInProgress: false };
  }

  let totalMs = 0;
  let currentWorkStartMs: number | null = null;

  for (const reg of sorted) {
    const ts = new Date(reg.dataHora).getTime();
    if (reg.tipoMarcacao === 'ENTRADA' || reg.tipoMarcacao === 'INTERVALO_FIM') {
      if (currentWorkStartMs === null) {
        currentWorkStartMs = ts;
      }
    } else if (reg.tipoMarcacao === 'INTERVALO_INICIO' || reg.tipoMarcacao === 'SAIDA') {
      if (currentWorkStartMs !== null && ts > currentWorkStartMs) {
        totalMs += ts - currentWorkStartMs;
      }
      currentWorkStartMs = null;
    }
  }

  const isInProgress = currentWorkStartMs !== null;
  const totalMinutes = Math.floor(totalMs / (1000 * 60));

  if (totalMinutes === 0 && isInProgress) {
    return { totalMinutes: 0, formatted: 'Em curso', hasPunches: true, isInProgress: true };
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  let formatted = '';
  if (hours > 0 && mins > 0) {
    formatted = `${hours}h ${mins}min`;
  } else if (hours > 0) {
    formatted = `${hours}h`;
  } else if (mins > 0) {
    formatted = `${mins}min`;
  } else {
    formatted = isInProgress ? 'Em curso' : '0h';
  }

  return { totalMinutes, formatted, hasPunches: true, isInProgress };
}
