// Utilitários de Cálculo Trabalhista Conforme CLT e Súmulas do TST
// Cálculos puros e testáveis, sem efeitos colaterais

import { RegistroPontoREPP } from '../types/operational';

// Fator oficial de redução da hora noturna: 60 minutos / 52.5 minutos = 1.14285714
export const FATOR_HORA_NOTURNA_REDUZIDA = 60 / 52.5;

export interface ResultadoHoraNoturna {
  minutosNoturnosFisicos: number; // Minutos reais de relógio entre 22h e 05h
  minutosNoturnosComputados: number; // Minutos após aplicação do fator 1.142857 (ficta)
  minutosProrrogacaoNoturna: number; // Minutos trabalhados pós 05h após jornada noturna integral (CLT Art. 73 § 5º)
  adicionalNoturnoHoras: number; // Horas computadas totais para adicional
  descricaoFormatada: string;
}

/**
 * Calcula a hora noturna reduzida e a prorrogação da jornada noturna.
 * Período noturno urbano: 22h00 às 05h00 (CLT Art. 73 § 2º).
 * Fator de redução: cada 52 minutos e 30 segundos equivale a 60 minutos (CLT Art. 73 § 1º).
 * Prorrogação: cumprida integralmente a jornada no período noturno e prorrogada esta,
 * devido é também o adicional quanto às horas prorrogadas (Súmula 60, II, TST e CLT Art. 73 § 5º).
 */
export function calcularHorasNoturnasIntervalo(
  inicioIso: string,
  fimIso: string
): ResultadoHoraNoturna {
  const dInicio = new Date(inicioIso);
  const dFim = new Date(fimIso);

  if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime()) || dFim <= dInicio) {
    return {
      minutosNoturnosFisicos: 0,
      minutosNoturnosComputados: 0,
      minutosProrrogacaoNoturna: 0,
      adicionalNoturnoHoras: 0,
      descricaoFormatada: '0h 00m'
    };
  }

  let minutosNoturnosFisicos = 0;
  let minutosProrrogacaoFisicos = 0;

  // Itera minuto a minuto pelo intervalo para precisão absoluta (máx 1440 iterações por dia)
  let cursor = new Date(dInicio.getTime());
  let atingiuPeriodoNoturnoSignificativo = false;

  while (cursor < dFim) {
    const hora = cursor.getHours();
    
    // Período Noturno Estrito: 22:00 até 04:59:59
    if (hora >= 22 || hora < 5) {
      minutosNoturnosFisicos++;
      atingiuPeriodoNoturnoSignificativo = true;
    } else if (hora >= 5 && atingiuPeriodoNoturnoSignificativo && minutosNoturnosFisicos >= 240) {
      // Prorrogação noturna (CLT Art. 73 § 5º): se cumpriu ao menos 4h noturnas e seguiu além das 05h
      minutosProrrogacaoFisicos++;
    }

    cursor = new Date(cursor.getTime() + 60000);
  }

  // Aplica o fator de redução de 52m30s sobre os minutos noturnos reais
  const minutosNoturnosFicta = Math.round(minutosNoturnosFisicos * FATOR_HORA_NOTURNA_REDUZIDA);
  const minutosProrrogadosFicta = Math.round(minutosProrrogacaoFisicos * FATOR_HORA_NOTURNA_REDUZIDA);

  const totalMinutosComputados = minutosNoturnosFicta + minutosProrrogadosFicta;
  const horasTotaisDecimais = +(totalMinutosComputados / 60).toFixed(2);

  const h = Math.floor(totalMinutosComputados / 60);
  const m = totalMinutosComputados % 60;

  return {
    minutosNoturnosFisicos,
    minutosNoturnosComputados: totalMinutosComputados,
    minutosProrrogacaoNoturna: minutosProrrogadosFicta,
    adicionalNoturnoHoras: horasTotaisDecimais,
    descricaoFormatada: `${h}h ${String(m).padStart(2, '0')}m`
  };
}

export interface ResultadoInterjornada {
  respeitou11Horas: boolean;
  minutosDescansoEfetivo: number;
  minutosFaltantes: number;
  horasExtrasIndenizatorias: number; // CLT Art. 66 c/c Súmula 110 TST / Tema 1046
  detalheTexto: string;
}

/**
 * Valida o intervalo interjornada de no mínimo 11 horas consecutivas de descanso (CLT Art. 66).
 * As horas subtraídas do descanso de 11h são devidas como horas extraordinárias indenizatórias.
 */
export function verificarInterjornada11h(
  saidaAnteriorIso?: string,
  entradaAtualIso?: string
): ResultadoInterjornada {
  if (!saidaAnteriorIso || !entradaAtualIso) {
    return {
      respeitou11Horas: true,
      minutosDescansoEfetivo: 660,
      minutosFaltantes: 0,
      horasExtrasIndenizatorias: 0,
      detalheTexto: 'Primeiro registro de jornada ou sem histórico prévio.'
    };
  }

  const dSaida = new Date(saidaAnteriorIso);
  const dEntrada = new Date(entradaAtualIso);

  if (isNaN(dSaida.getTime()) || isNaN(dEntrada.getTime()) || dEntrada <= dSaida) {
    return {
      respeitou11Horas: true,
      minutosDescansoEfetivo: 660,
      minutosFaltantes: 0,
      horasExtrasIndenizatorias: 0,
      detalheTexto: 'Intervalo válido.'
    };
  }

  const diffMs = dEntrada.getTime() - dSaida.getTime();
  const minutosDescanso = Math.floor(diffMs / 60000);
  const MINUTOS_OBRIGATORIOS = 11 * 60; // 660 minutos = 11 horas

  if (minutosDescanso >= MINUTOS_OBRIGATORIOS) {
    const h = Math.floor(minutosDescanso / 60);
    const m = minutosDescanso % 60;
    return {
      respeitou11Horas: true,
      minutosDescansoEfetivo: minutosDescanso,
      minutosFaltantes: 0,
      horasExtrasIndenizatorias: 0,
      detalheTexto: `Descanso de ${h}h ${m}m respeitado integralmente (Mínimo legal: 11h).`
    };
  }

  const faltantes = MINUTOS_OBRIGATORIOS - minutosDescanso;
  const hDescanso = Math.floor(minutosDescanso / 60);
  const mDescanso = minutosDescanso % 60;
  const hFaltam = Math.floor(faltantes / 60);
  const mFaltam = faltantes % 60;

  return {
    respeitou11Horas: false,
    minutosDescansoEfetivo: minutosDescanso,
    minutosFaltantes: faltantes,
    horasExtrasIndenizatorias: +(faltantes / 60).toFixed(2),
    detalheTexto: `Violação Art. 66 da CLT: Descansou apenas ${hDescanso}h ${mDescanso}m. Supressão de ${hFaltam}h ${mFaltam}m deve ser paga como hora extra com adicional de no mínimo 50%.`
  };
}

export interface MemoriaDSRReflexo {
  totalHorasExtrasValor: number;
  totalAdicionalNoturnoValor: number;
  diasUteisMes: number;
  domingosEFeriadosMes: number;
  valorReflexoDSR: number;
  formulaDescritiva: string;
}

/**
 * Calcula o reflexo de Horas Extras e Adicional Noturno no DSR
 * Conforme Lei nº 605/1949 e Súmula 172 do TST:
 * DSR = (Valor Total de Horas Extras / Dias Úteis do Mês) * Domingos e Feriados do Mês
 */
export function calcularReflexoDSR(
  totalHorasExtrasValor: number,
  totalAdicionalNoturnoValor: number,
  diasUteisMes: number = 25,
  domingosEFeriadosMes: number = 5
): MemoriaDSRReflexo {
  if (diasUteisMes <= 0) diasUteisMes = 25;
  const baseSoma = totalHorasExtrasValor + totalAdicionalNoturnoValor;
  const valorReflexoDSR = +((baseSoma / diasUteisMes) * domingosEFeriadosMes).toFixed(2);

  return {
    totalHorasExtrasValor,
    totalAdicionalNoturnoValor,
    diasUteisMes,
    domingosEFeriadosMes,
    valorReflexoDSR,
    formulaDescritiva: `(${baseSoma.toFixed(2)} ÷ ${diasUteisMes} dias úteis) × ${domingosEFeriadosMes} domingos/feriados = R$ ${valorReflexoDSR.toFixed(2)}`
  };
}

export interface ValidacaoIntervaloIntrajornada {
  minutosGozados: number;
  minutosMinimosLegais: number;
  suprimido: boolean;
  minutosSuprimidos: number;
  alertaArt71: string | null;
}

/**
 * Valida o intervalo para refeição e descanso (CLT Art. 71).
 * Jornadas acima de 6 horas: mínimo 1 hora (60 minutos).
 * Jornadas entre 4 e 6 horas: mínimo 15 minutos.
 * Jornadas até 4 horas: sem intervalo obrigatório.
 */
export function validarIntervaloIntrajornada(
  jornadaTotalHoras: number,
  minutosIntervaloGozados: number
): ValidacaoIntervaloIntrajornada {
  let minutosMinimos = 0;
  if (jornadaTotalHoras > 6) {
    minutosMinimos = 60;
  } else if (jornadaTotalHoras > 4) {
    minutosMinimos = 15;
  }

  if (minutosIntervaloGozados >= minutosMinimos) {
    return {
      minutosGozados: minutosIntervaloGozados,
      minutosMinimosLegais: minutosMinimos,
      suprimido: false,
      minutosSuprimidos: 0,
      alertaArt71: null
    };
  }

  const suprimidos = minutosMinimos - minutosIntervaloGozados;
  return {
    minutosGozados: minutosIntervaloGozados,
    minutosMinimosLegais: minutosMinimos,
    suprimido: true,
    minutosSuprimidos: suprimidos,
    alertaArt71: `Art. 71 CLT: Intervalo de refeição suprimido em ${suprimidos} min. A não concessão total ou parcial implica pagamento do período suprimido com acréscimo de 50% de natureza indenizatória (§ 4º).`
  };
}
