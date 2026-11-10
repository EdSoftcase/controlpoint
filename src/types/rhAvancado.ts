// Types para Módulos Avançados de RH & Portaria MTP 671/2021
// Desenvolvido de forma modular e aditiva para total compatibilidade

export type TipoEscalaTrabalho = '5x2' | '12x36' | '6x1' | '5x1' | 'flexivel';

export interface EscalaTrabalhoConfig {
  id: string;
  tenantId: string;
  nome: string; // ex: "Plantonista Hospitalar 12x36 (Dia)", "Comercial 5x2", "Operacional 6x1"
  tipo: TipoEscalaTrabalho;
  jornadaHorasDiarias: number; // ex: 12 para 12x36, 8 para 5x2, 7.33 para 6x1 (44h semanais)
  duracaoIntervaloMinutos: number; // ex: 60
  toleranciaMinutos: number; // padrão 10 minutos (CLT Art. 58 § 1º)
  permiteBancoHoras: boolean;
  diasSemanaTrabalhoPadrao?: number[]; // [1,2,3,4,5] para seg-sex na 5x2
  turma?: 'A' | 'B'; // Para revezamento 12x36
  dataBaseInicioCiclo?: string; // YYYY-MM-DD para sincronizar plantões ímpares/pares
  descricaoRegra: string;
}

export type TipoAfastamento = 
  | 'FERIAS' 
  | 'ATESTADO_MEDICO' 
  | 'LICENCA_MATERNIDADE' 
  | 'LICENCA_PATERNIDADE' 
  | 'CASAMENTO' 
  | 'LUTO' 
  | 'CONVOCACAO_JUDICIAL' 
  | 'OUTROS';

export interface AfastamentoColaborador {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  colaboradorMatricula: string;
  departamentoId: string;
  departamentoNome: string;
  tipo: TipoAfastamento;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  totalDias: number;
  abonaMarcacoesPonto: boolean; // Se true, o espelho não computa falta ou débito
  cid10?: string;
  nomeMedicoOuEmissor?: string;
  crmMedico?: string;
  comprovanteAnexoNome?: string;
  status: 'HOMOLOGADO' | 'PENDENTE_VALIDACAO' | 'RECUSADO';
  observacoes?: string;
  criadoEm: string;
  homologadoPor?: string;
}

export interface SolicitacaoTrocaTurno {
  id: string;
  tenantId: string;
  colaboradorOrigemId: string;
  colaboradorOrigemNome: string;
  colaboradorOrigemCpf: string;
  colaboradorDestinoId: string;
  colaboradorDestinoNome: string;
  colaboradorDestinoCpf: string;
  departamentoId: string;
  departamentoNome: string;
  dataPlantaoOrigem: string; // YYYY-MM-DD dia em que a origem deveria trabalhar
  dataPlantaoDestino: string; // YYYY-MM-DD dia em que o destino trabalhará em substituição
  horarioTurno: string; // ex: "07:00 às 19:00"
  motivo: string;
  status: 'PENDENTE_SUPERVISOR' | 'APROVADO' | 'REJEITADO' | 'CANCELADO';
  validacaoInterjornadaOk: boolean; // Checagem se nenhum colaborador fica sem 11h de descanso
  supervisorDecisorId?: string;
  supervisorDecisorNome?: string;
  dataDecisao?: string;
  motivoRecusa?: string;
  criadoEm: string;
}

export interface ParametrosBancoHoras {
  id: string;
  tenantId: string;
  nomeAcordo: string; // ex: "Acordo Coletivo 2026/2027"
  ativo: boolean;
  validadeMeses: number; // 6 (acordo individual) ou 12 (acordo coletivo) CLT Art. 59 § 2º
  limiteMaximoHorasExtrasDiarias: number; // 2 horas (CLT Art. 59 caput)
  fatorMultiplicadorDiaUtil: number; // 1.0 (ou 1.5 se converter para HE)
  fatorMultiplicadorDomingoFeriado: number; // 2.0 (100% conforme CLT / TST)
  acaoAposVencimento: 'PAGAR_COMO_HORA_EXTRA' | 'ZERAR_SEM_PAGAMENTO_VEDADO';
}

export type TipoRiscoTrabalhista = 
  | 'INTERVALO_SUPRIMIDO_ART71'
  | 'INTERJORNADA_DESCUMPRIDA_ART66'
  | 'EXCESSO_HORAS_EXTRAS_ART59'
  | 'TRABALHO_CONTINUO_SEM_FOLGA_ART67'
  | 'BANCO_HORAS_PERTO_EXPIRACAO';

export interface AlertaRiscoTrabalhista {
  id: string;
  tipo: TipoRiscoTrabalhista;
  gravidade: 'CRITICA' | 'ALTA' | 'MODERADA';
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  departamentoNome: string;
  dataOcorrencia: string; // YYYY-MM-DD
  descricao: string;
  impactoFinanceiroEstimado: number; // Estimativa de passivo trabalhista em R$
  fundamentacaoLegal: string; // Artigo CLT / Súmula TST correspondente
  sugestaoAcao: string;
}

export type SistemaERPAlvo = 
  | 'TOTVS_PROTHEUS' 
  | 'SENIOR_VETORH' 
  | 'DOMINIO_SISTEMAS' 
  | 'ALTERDATA';

export interface ParametrosExportacaoERP {
  sistema: SistemaERPAlvo;
  mesAnoCompetencia: string; // YYYY-MM
  departamentoId?: string;
  incluirHorasExtras: boolean;
  incluirAdicionalNoturno: boolean;
  incluirFaltasEAtrasos: boolean;
  codigoEmpresaFolha: string;
  formatoLinha: 'TXT_POSICIONAL' | 'CSV_TABULADO';
}

export type CategoriaComunicado = 
  | 'FERIADOS' 
  | 'CAMPANHA_SAUDE' 
  | 'METAS_MES' 
  | 'COMUNICADO_GERAL' 
  | 'SEGURANCA_TRABALHO';

export interface ConfirmacaoLeituraComunicado {
  colaboradorId: string;
  colaboradorCpf: string;
  colaboradorNome: string;
  dataHora: string;
  ip: string;
}

export interface ComunicadoEmpresa {
  id: string;
  tenantId: string;
  titulo: string;
  conteudo: string;
  categoria: CategoriaComunicado;
  autorNome: string;
  fixado: boolean;
  exigeConfirmacaoLeitura: boolean;
  anexoNome?: string;
  anexoUrl?: string;
  confirmacoesLeitura: ConfirmacaoLeituraComunicado[];
  criadoEm: string;
}

export type AssuntoChamadoRh = 
  | 'DUVIDA_HOLERITE' 
  | 'VALE_TRANSPORTE' 
  | 'ALTERACAO_CADASTRAL' 
  | 'DUVIDA_PONTO' 
  | 'OUTROS';

export interface RespostaChamadoRh {
  id: string;
  autorId: string;
  autorNome: string;
  eDoRh: boolean;
  mensagem: string;
  dataHora: string;
  anexoNome?: string;
  anexoUrl?: string;
}

export interface ChamadoAtendimentoRh {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  departamentoNome?: string;
  assunto: AssuntoChamadoRh;
  titulo: string;
  mensagemInicial: string;
  anexoNome?: string;
  anexoUrl?: string;
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  respostas: RespostaChamadoRh[];
  criadoEm: string;
  atualizadoEm: string;
}

