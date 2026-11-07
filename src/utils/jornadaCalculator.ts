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

  const sorted = [...dayRegistros].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

  const entrada = sorted.find(r => r.tipoMarcacao === 'ENTRADA');
  const intervalInicio = sorted.find(r => r.tipoMarcacao === 'INTERVALO_INICIO');
  const intervalFim = sorted.find(r => r.tipoMarcacao === 'INTERVALO_FIM');
  const saida = sorted.find(r => r.tipoMarcacao === 'SAIDA');

  let totalMs = 0;
  let isInProgress = false;

  // Segment 1: Morning / First shift
  if (entrada) {
    const tEntrada = new Date(entrada.dataHora).getTime();
    if (intervalInicio) {
      const tIntInicio = new Date(intervalInicio.dataHora).getTime();
      if (tIntInicio > tEntrada) {
        totalMs += (tIntInicio - tEntrada);
      }
    } else if (saida) {
      // Worked continuously without interval punch
      const tSaida = new Date(saida.dataHora).getTime();
      if (tSaida > tEntrada) {
        totalMs += (tSaida - tEntrada);
      }
    } else {
      isInProgress = true;
    }
  }

  // Segment 2: Afternoon / Second shift
  if (intervalFim) {
    const tIntFim = new Date(intervalFim.dataHora).getTime();
    if (saida) {
      const tSaida = new Date(saida.dataHora).getTime();
      if (tSaida > tIntFim) {
        totalMs += (tSaida - tIntFim);
      }
    } else {
      isInProgress = true;
    }
  }

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
