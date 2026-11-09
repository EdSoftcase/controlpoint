export interface Tenant {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  slug: string;
  plano: 'Starter' | 'Pro' | 'REP-P Corporativo';
  licencasContratadas: number;
  licencasEmUso: number;
  status: 'ATIVO' | 'SUSPENSO' | 'IMPLANTACAO';
  dataAdesao: string;
  emailAdmin: string;
}

export interface Estabelecimento {
  id: string;
  tenantId: string;
  codigo: string;
  nome: string;
  cnpj: string;
  tipo: 'MATRIZ' | 'FILIAL' | 'OBRA';
  fusoHorario: string;
  cercaRaioMetros: number;
  latitude: number;
  longitude: number;
  uf: string;
  municipio: string;
  enderecoCompleto?: string;
  cep?: string;
  bloquearForaDoRaio?: boolean;
}

export interface Feriado {
  id: string;
  tenantId: string;
  nome: string;
  data: string; // Formato YYYY-MM-DD
  tipo: 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PONTO_FACULTATIVO';
  uf?: string;
  municipio?: string;
  estabelecimentoId?: string; // Se específico de uma unidade
  recorrenteAnual: boolean;
  legislacaoBase: string; // Ex: Lei Federal 662/1949, Lei Municipal 14.485/2007
  adicionalHoraExtraPercentual: number; // Padrão 100% conforme Súmula 146 TST
  geraFolgaCompensatoria: boolean;
  afetaDSR: boolean; // Se considerado descanso remunerado para reflexo em DSR
}

export interface MemoriaCalculoFeriadoDSR {
  colaboradorId: string;
  colaboradorNome: string;
  data: string;
  feriadoNome: string;
  tipoFeriado: string;
  trabalhouNoFeriado: boolean;
  horasTrabalhadas: number;
  adicionalPercentual: number;
  valorHoraNormal: number;
  totalPagarHorasExtras: number;
  reflexoDSR: number;
  regraAplicada: string;
}

export interface ColetorTablet {
  id: string;
  tenantId: string;
  estabelecimentoId: string;
  nome: string;
  uuid: string;
  status: 'ONLINE' | 'OFFLINE';
  versaoApp: string;
  ultimoSincronismo: string;
}

export interface Cargo {
  id: string;
  tenantId: string;
  titulo: string;
  codigo?: string;
  cbo: string;
  cboDescricao: string;
  cargaHorariaSemanal: number;
}

export interface Departamento {
  id: string;
  tenantId: string;
  nome: string;
  codigo: string;
  gestorId: string;
  gestorNome: string;
  gestorEmail: string;
  horarioInicioPadrao: string; // Ex: "08:00"
  cargaHorariaDiariaHoras: number; // Ex: 8
  intervaloMinutos: number; // Ex: 60 (1 hora)
  maxMinutosAntecedenciaPermitido: number; // Ex: 15 minutos
  regraAntecedenciaAtiva: boolean;
}

export interface Colaborador {
  id: string;
  tenantId: string;
  nome: string;
  cpf: string;
  matricula: string;
  pis?: string;
  dataAdmissao: string;
  cargoId: string;
  cargoTitulo: string;
  departamentoId: string;
  departamentoNome: string;
  gestorId?: string;
  gestorNome?: string;
  estabelecimentoId: string;
  estabelecimentoNome: string;
  regime: 'REGULAR' | 'EXCECAO' | 'DISPENSA_ART_62';
  horarioInicio: string; // Ex: "08:00"
  horarioFim: string; // Ex: "17:00"
  cargaHorariaDiariaHoras: number; // Ex: 8
  intervaloMinutos: number; // Ex: 60 (1 hora)
  maxMinutosAntecedenciaPermitido: number; // Padrão: 15 minutos
  regraAntecedenciaAtiva: boolean; // Se true, valida no coletor
  pinColetor: string;
  fotoUrl?: string;
  biometriaCadastrada?: boolean;
  biometriaHashTemplate?: string;
  limiarConfiancaMinimo?: number;
  status: 'ATIVO' | 'DESLIGADO' | 'PENDENTE';
  telefone?: string;
  dataSolicitacaoCadastro?: string;
  email?: string;
  senhaTemporaria?: string;
  // Extensões de Escalas & RH Avançado (Retrocompatíveis)
  tipoEscala?: '5x2' | '12x36' | '6x1' | '5x1' | 'flexivel';
  turmaEscala?: 'A' | 'B';
  diasFolgaSemana?: number[]; // Dias de folga semanal fixos: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  anualFolgas?: Record<string, boolean>; // Exceções de folga por data YYYY-MM-DD: true = folga, false = trabalho
  dataBaseCiclo?: string;
}

export interface SolicitacaoHoraExtra {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  departamentoId: string;
  departamentoNome: string;
  gestorId: string;
  gestorNome: string;
  data: string; // YYYY-MM-DD
  horarioContratado: string; // "08:00 às 17:00"
  horarioRealizado: string; // "07:48 às 19:15"
  minutosExtras: number; // Ex: 135 minutos = 2h 15m
  horasExtrasFormatadas: string; // "02:15h"
  tipoHoraExtra: 'NORMAL_50' | 'FERIADO_100';
  justificativa: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  motivoRecusa?: string;
  dataDecisao?: string;
}

export interface RegistroPontoREPP {
  id?: string;
  nsr: number;
  tenantId: string;
  empregadorRazaoSocial: string;
  empregadorCnpj: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  colaboradorMatricula: string;
  dataHora: string; // ISO String
  dataHoraFormatada: string;
  fusoHorario: string;
  coletorId: string;
  tipoMarcacao: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA';
  alertaAntecedencia?: string;
  alertaIntervalo?: string;
  hashSha256: string;
  // Campos de Geolocalização (GPS & Geofencing)
  latitude?: number;
  longitude?: number;
  distanciaCentroMetros?: number;
  foraDoRaioGeofence?: boolean;
  localizacaoEndereco?: string;
  modoDispositivo?: 'TABLET_KIOSK' | 'WEB_CAM' | 'MOBILE_GPS';
}

export interface SolicitacaoAjustePonto {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  departamentoId: string;
  departamentoNome: string;
  gestorId: string;
  gestorNome: string;
  data: string; // YYYY-MM-DD
  tipo: 'INCLUSAO_PONTO_ESQUECIDO' | 'ATESTADO_MEDICO' | 'JUSTIFICATIVA_CORRECAO';
  horarioAjuste?: string;
  tipoMarcacaoAjuste?: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA';
  cid10?: string;
  nomeDocumentoAnexo?: string;
  dataHoraEnvio: string;
  justificativa: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  respostaGestor?: string;
  dataDecisao?: string;
}

export interface AssinaturaEspelhoPonto {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  mesAno: string; // ex: "2026-10"
  dataHoraAssinatura: string;
  hashAssinaturaSha256: string;
  ipAddress: string;
  dispositivoInfo: string;
  rubricaDataUrl?: string; // Canvas da rubrica
  status: 'ASSINADO';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  tenantId: string;
  operador: string;
  acao: string;
  detalhes: string;
  hash: string;
}

export type TipoOcorrenciaDesconto = 
  | 'ATRASO' 
  | 'FALTA_INJUSTIFICADA' 
  | 'SAIDA_ANTECIPADA' 
  | 'INTERVALO_EXCEDIDO';

export type StatusTratamentoOcorrencia = 
  | 'PENDENTE_DESCONTO' 
  | 'ABONADO_ATESTADO' 
  | 'CONFIRMADO_DESCONTO' 
  | 'COMPENSADO_BANCO';

export interface OcorrenciaDesconto {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  colaboradorMatricula: string;
  departamentoId: string;
  departamentoNome: string;
  cargoTitulo: string;
  data: string; // YYYY-MM-DD
  tipo: TipoOcorrenciaDesconto;
  horarioPrevisto: string; // ex: "08:00 às 17:00"
  horarioRealizado: string; // ex: "08:34 às 17:00"
  minutosPerdidos: number; // ex: 34
  toleranciaAplicadaMinutos: number; // ex: 10 (CLT Art. 58 § 1º)
  minutosADescontar: number; // ex: 34 (se ultrapassou os 10m, desconta integral conforme CLT)
  valorHoraEstimado: number; // R$
  valorEstimadoDesconto: number; // R$
  perdeDsr: boolean; // se falta injustificada na semana gera perda de DSR
  valorDescontoDsr: number; // R$ do DSR
  status: StatusTratamentoOcorrencia;
  justificativa?: string;
  atestadoCid?: string;
  dataTratamento?: string;
  operadorTratamento?: string;
}

export interface ResumoGerencialDepartamento {
  departamentoId: string;
  departamentoNome: string;
  totalColaboradores: number;
  totalAtrasosQtd: number;
  totalAtrasosMinutos: number;
  totalFaltasQtd: number;
  totalFaltasHoras: number;
  totalSaidasAntecipadasQtd: number;
  totalSaidasAntecipadasMinutos: number;
  totalHorasDesconto: number;
  totalValorDescontos: number;
  taxaAbsenteismoPercentual: number;
}

export interface ProgramacaoFerias {
  id: string;
  tenantId: string;
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorCpf: string;
  periodoAquisitivoInicio: string; // YYYY-MM-DD
  periodoAquisitivoFim: string; // YYYY-MM-DD
  periodoConcessivoInicio: string; // YYYY-MM-DD
  periodoConcessivoFim: string; // YYYY-MM-DD
  dataInicioFerias: string; // YYYY-MM-DD
  dataFimFerias: string; // YYYY-MM-DD
  diasGozo: number; // ex: 20 ou 30
  diasAbonoPecuniario: number; // ex: 10 (venda de 1/3)
  status: 'PROGRAMADO' | 'EM_GOZO' | 'CONCLUIDO' | 'VENCIDO';
  observacao?: string;
}
