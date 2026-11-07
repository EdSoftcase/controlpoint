// Motor de Escalas de Trabalho Complexas (12x36, 6x1, 5x2, 5x1)
// Em conformidade com a CLT e convenções sindicais

import { TipoEscalaTrabalho, EscalaTrabalhoConfig } from '../types/rhAvancado';

export interface StatusDiaEscala {
  dataYmd: string; // YYYY-MM-DD
  tipoDia: 'TRABALHO' | 'FOLGA_PREVISTA' | 'DSR' | 'FERIADO';
  cargaPrevistaMinutos: number; // Ex: 720 para 12x36 (12h), 480 para 5x2 (8h)
  cargaPrevistaHoras: number;
  descricao: string;
  turmaAtiva?: 'A' | 'B';
  ehPlantaDia: boolean;
}

export const ESCALAS_PADRAO: EscalaTrabalhoConfig[] = [
  {
    id: 'esc-5x2',
    tenantId: 'tenant-01',
    nome: 'Comercial Padrão 5x2 (40h/44h semanais)',
    tipo: '5x2',
    jornadaHorasDiarias: 8,
    duracaoIntervaloMinutos: 60,
    toleranciaMinutos: 10,
    permiteBancoHoras: true,
    diasSemanaTrabalhoPadrao: [1, 2, 3, 4, 5], // Seg a Sex
    descricaoRegra: 'Jornada regular de segunda a sexta com folga aos sábados e DSR aos domingos.'
  },
  {
    id: 'esc-12x36-a',
    tenantId: 'tenant-01',
    nome: 'Hospitalar / Segurança 12x36 (Turma A - Dias Pares)',
    tipo: '12x36',
    jornadaHorasDiarias: 12,
    duracaoIntervaloMinutos: 60,
    toleranciaMinutos: 10,
    permiteBancoHoras: false,
    turma: 'A',
    dataBaseInicioCiclo: '2026-01-01',
    descricaoRegra: 'Plantão de 12 horas corridas seguido de 36 horas ininterruptas de descanso (CLT Art. 59-A).'
  },
  {
    id: 'esc-12x36-b',
    tenantId: 'tenant-01',
    nome: 'Hospitalar / Segurança 12x36 (Turma B - Dias Ímpares)',
    tipo: '12x36',
    jornadaHorasDiarias: 12,
    duracaoIntervaloMinutos: 60,
    toleranciaMinutos: 10,
    permiteBancoHoras: false,
    turma: 'B',
    dataBaseInicioCiclo: '2026-01-01',
    descricaoRegra: 'Plantão de 12 horas corridas alternado com Turma A, descanso de 36 horas subsequentes.'
  },
  {
    id: 'esc-6x1',
    tenantId: 'tenant-01',
    nome: 'Comércio / Varejo 6x1 (44h semanais)',
    tipo: '6x1',
    jornadaHorasDiarias: 7.33, // 7h20min diárias
    duracaoIntervaloMinutos: 60,
    toleranciaMinutos: 10,
    permiteBancoHoras: true,
    diasSemanaTrabalhoPadrao: [1, 2, 3, 4, 5, 6], // Seg a Sáb com folga rotativa
    descricaoRegra: '6 dias de trabalho para 1 folga semanal, com DSR preferencialmente aos domingos ao menos 1x por mês.'
  }
];

/**
 * Calcula a condição de trabalho ou folga de uma data específica de acordo com a escala atribuída.
 */
export function calcularStatusDiaEscala(
  dataYmd: string,
  tipoEscala: TipoEscalaTrabalho = '5x2',
  turma: 'A' | 'B' = 'A',
  dataBaseCiclo: string = '2026-01-01'
): StatusDiaEscala {
  const [year, month, day] = dataYmd.split('-').map(Number);
  const dataAtual = new Date(year, month - 1, day, 12, 0, 0);
  const diaSemana = dataAtual.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // 1. Escala 5x2 Comercial
  if (tipoEscala === '5x2') {
    if (diaSemana === 0) {
      return {
        dataYmd,
        tipoDia: 'DSR',
        cargaPrevistaMinutos: 0,
        cargaPrevistaHoras: 0,
        descricao: 'Descanso Semanal Remunerado (DSR)',
        ehPlantaDia: false
      };
    }
    if (diaSemana === 6) {
      return {
        dataYmd,
        tipoDia: 'FOLGA_PREVISTA',
        cargaPrevistaMinutos: 0,
        cargaPrevistaHoras: 0,
        descricao: 'Folga Semanal Prevista (Sábado Compensado)',
        ehPlantaDia: false
      };
    }
    return {
      dataYmd,
      tipoDia: 'TRABALHO',
      cargaPrevistaMinutos: 480, // 8h
      cargaPrevistaHoras: 8,
      descricao: 'Dia de Trabalho Efetivo (8h)',
      ehPlantaDia: true
    };
  }

  // 2. Escala 12x36 (Plantonista)
  if (tipoEscala === '12x36') {
    const [baseY, baseM, baseD] = dataBaseCiclo.split('-').map(Number);
    const dataBase = new Date(baseY, baseM - 1, baseD, 12, 0, 0);
    
    // Diferença em dias inteiros
    const diffTime = dataAtual.getTime() - dataBase.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Se Turma A: trabalha em dias com diferença par (0, 2, 4...)
    // Se Turma B: trabalha em dias com diferença ímpar (1, 3, 5...)
    const isPlantaoTurmaA = Math.abs(diffDays) % 2 === 0;
    const trabalhaHoje = turma === 'A' ? isPlantaoTurmaA : !isPlantaoTurmaA;

    if (trabalhaHoje) {
      return {
        dataYmd,
        tipoDia: 'TRABALHO',
        cargaPrevistaMinutos: 720, // 12h
        cargaPrevistaHoras: 12,
        turmaAtiva: turma,
        descricao: `Plantão 12h Ativo (Turma ${turma})`,
        ehPlantaDia: true
      };
    } else {
      return {
        dataYmd,
        tipoDia: 'FOLGA_PREVISTA',
        cargaPrevistaMinutos: 0,
        cargaPrevistaHoras: 0,
        turmaAtiva: turma,
        descricao: `Descanso Compensatório de 36h (Turma ${turma})`,
        ehPlantaDia: false
      };
    }
  }

  // 3. Escala 6x1 (Varejo / Operacional)
  if (tipoEscala === '6x1') {
    if (diaSemana === 0) {
      return {
        dataYmd,
        tipoDia: 'DSR',
        cargaPrevistaMinutos: 0,
        cargaPrevistaHoras: 0,
        descricao: 'Descanso Semanal Remunerado (Domingo)',
        ehPlantaDia: false
      };
    }
    return {
      dataYmd,
      tipoDia: 'TRABALHO',
      cargaPrevistaMinutos: 440, // 7h20m = 44h / 6 dias
      cargaPrevistaHoras: 7.33,
      descricao: 'Dia de Trabalho Efetivo (7h20min)',
      ehPlantaDia: true
    };
  }

  // Fallback seguro
  return {
    dataYmd,
    tipoDia: diaSemana === 0 ? 'DSR' : (diaSemana === 6 ? 'FOLGA_PREVISTA' : 'TRABALHO'),
    cargaPrevistaMinutos: (diaSemana >= 1 && diaSemana <= 5) ? 480 : 0,
    cargaPrevistaHoras: (diaSemana >= 1 && diaSemana <= 5) ? 8 : 0,
    descricao: 'Jornada Convencional',
    ehPlantaDia: diaSemana >= 1 && diaSemana <= 5
  };
}

/**
 * Gera um mês completo de previsão de calendário para o colaborador
 */
export function gerarCalendarioMesEscala(
  ano: number,
  mesZeroBased: number,
  tipoEscala: TipoEscalaTrabalho = '5x2',
  turma: 'A' | 'B' = 'A',
  dataBaseCiclo: string = '2026-01-01'
): StatusDiaEscala[] {
  const diasNoMes = new Date(ano, mesZeroBased + 1, 0).getDate();
  const lista: StatusDiaEscala[] = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const ymd = `${ano}-${String(mesZeroBased + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    lista.push(calcularStatusDiaEscala(ymd, tipoEscala, turma, dataBaseCiclo));
  }

  return lista;
}
