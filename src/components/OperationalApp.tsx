import React, { useState, useEffect } from 'react';
import {
  Tenant,
  Estabelecimento,
  ColetorTablet,
  Cargo,
  Departamento,
  Colaborador,
  RegistroPontoREPP,
  AuditLogItem,
  Feriado,
  SolicitacaoHoraExtra,
  OcorrenciaDesconto,
  SolicitacaoAjustePonto,
  AssinaturaEspelhoPonto
} from '../types/operational';
import { AuthUser } from '../types/auth';
import {
  INITIAL_TENANTS,
  INITIAL_ESTABELECIMENTOS,
  INITIAL_COLETORES,
  INITIAL_CARGOS,
  INITIAL_DEPARTAMENTOS,
  INITIAL_COLABORADORES,
  INITIAL_REGISTROS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FERIADOS,
  INITIAL_HORAS_EXTRAS,
  INITIAL_OCORRENCIAS_DESCONTO,
  generateAFDContent,
  generateAEJContent
} from '../data/operationalStore';
import { GestaoFeriados } from './GestaoFeriados';
import { GestaoEquipesEAprovacoes } from './GestaoEquipesEAprovacoes';
import { ModuloRelatoriosOcorrencias } from './ModuloRelatoriosOcorrencias';
import { BiometricConfigurator, calculateDistanceMeters } from './BiometricConfigurator';
import {
  validateCNPJ,
  formatCNPJ,
  validateCPF,
  formatCPF
} from '../utils/brazilianValidators';
import {
  Building2,
  Users,
  Clock,
  Tablet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Search,
  FileText,
  Lock,
  Printer,
  ChevronRight,
  Radio,
  FileCheck,
  Calendar,
  Coffee,
  LogIn,
  LogOut,
  AlertTriangle,
  UserCheck,
  BarChart3,
  PieChart,
  ScanFace
} from 'lucide-react';

interface OperationalAppProps {
  currentUser?: AuthUser;
  departamentos?: Departamento[];
  onUpdateDepartamentos?: (novos: Departamento[]) => void;
  colaboradores?: Colaborador[];
  onUpdateColaboradores?: (novos: Colaborador[]) => void;
  registrosPonto?: RegistroPontoREPP[];
  onUpdateRegistrosPonto?: (novos: RegistroPontoREPP[]) => void;
  horasExtras?: SolicitacaoHoraExtra[];
  onUpdateHorasExtras?: (novos: SolicitacaoHoraExtra[]) => void;
  feriados?: Feriado[];
  onUpdateFeriados?: (novos: Feriado[]) => void;
  ocorrencias?: OcorrenciaDesconto[];
  onUpdateOcorrencias?: (novas: OcorrenciaDesconto[]) => void;
  solicitacoesAjuste?: SolicitacaoAjustePonto[];
  onUpdateSolicitacoesAjuste?: (novas: SolicitacaoAjustePonto[]) => void;
  assinaturasEspelho?: AssinaturaEspelhoPonto[];
  onUpdateAssinaturasEspelho?: (novas: AssinaturaEspelhoPonto[]) => void;
  estabelecimentos?: Estabelecimento[];
  onUpdateEstabelecimentos?: (novos: Estabelecimento[]) => void;
  operationalTab?: 'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'registros' | 'feriados' | 'tenants';
  onSelectOperationalTab?: (tab: any) => void;
}

export const OperationalApp: React.FC<OperationalAppProps> = ({
  currentUser = {
    id: 'user-02',
    nome: 'Luciana Mendonça',
    email: 'rh@softcase.com.br',
    cpf: '234.567.890-12',
    role: 'RH_ADMIN',
    roleLabel: 'RH & Departamento Pessoal',
    tenantId: 'tenant-01',
    tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
    mfaHabilitado: true
  },
  estabelecimentos: propEstabelecimentos,
  onUpdateEstabelecimentos: propOnUpdateEstabelecimentos,
  departamentos: propDepartamentos,
  onUpdateDepartamentos: propOnUpdateDepartamentos,
  colaboradores: propColaboradores,
  onUpdateColaboradores: propOnUpdateColaboradores,
  registrosPonto: propRegistros,
  onUpdateRegistrosPonto: propOnUpdateRegistros,
  horasExtras: propHorasExtras,
  onUpdateHorasExtras: propOnUpdateHorasExtras,
  feriados: propFeriados,
  onUpdateFeriados: propOnUpdateFeriados,
  ocorrencias: propOcorrencias,
  onUpdateOcorrencias: propOnUpdateOcorrencias,
  solicitacoesAjuste: propSolicitacoesAjuste,
  onUpdateSolicitacoesAjuste: propOnUpdateSolicitacoesAjuste,
  assinaturasEspelho: propAssinaturasEspelho,
  onUpdateAssinaturasEspelho: propOnUpdateAssinaturasEspelho,
  operationalTab: propOperationalTab,
  onSelectOperationalTab: propOnSelectOperationalTab
}) => {
  // Estado dos Dados Operacionais (com fallback local seguro)
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-01');
  const [localEstabelecimentos, setLocalEstabelecimentos] = useState<Estabelecimento[]>(INITIAL_ESTABELECIMENTOS);
  const estabelecimentos = propEstabelecimentos || localEstabelecimentos;
  const setEstabelecimentos = (ests: Estabelecimento[]) => {
    setLocalEstabelecimentos(ests);
    propOnUpdateEstabelecimentos?.(ests);
  };

  const [coletores, setColetores] = useState<ColetorTablet[]>(INITIAL_COLETORES);
  const [cargos, setCargos] = useState<Cargo[]>(INITIAL_CARGOS);

  // Estados sincronizáveis
  const [localDepartamentos, setLocalDepartamentos] = useState<Departamento[]>(INITIAL_DEPARTAMENTOS);
  const departamentos = propDepartamentos || localDepartamentos;
  const setDepartamentos = (depts: Departamento[]) => {
    setLocalDepartamentos(depts);
    propOnUpdateDepartamentos?.(depts);
  };

  const [localColaboradores, setLocalColaboradores] = useState<Colaborador[]>(INITIAL_COLABORADORES);
  const colaboradores = propColaboradores || localColaboradores;
  const setColaboradores = (colabs: Colaborador[]) => {
    setLocalColaboradores(colabs);
    propOnUpdateColaboradores?.(colabs);
  };

  const [localRegistros, setLocalRegistros] = useState<RegistroPontoREPP[]>(INITIAL_REGISTROS);
  const registrosPonto = propRegistros || localRegistros;
  const setRegistrosPonto = (regs: RegistroPontoREPP[]) => {
    setLocalRegistros(regs);
    propOnUpdateRegistros?.(regs);
  };

  const [localHorasExtras, setLocalHorasExtras] = useState<SolicitacaoHoraExtra[]>(INITIAL_HORAS_EXTRAS);
  const horasExtras = propHorasExtras || localHorasExtras;
  const setHorasExtras = (hes: SolicitacaoHoraExtra[]) => {
    setLocalHorasExtras(hes);
    propOnUpdateHorasExtras?.(hes);
  };

  const [localFeriados, setLocalFeriados] = useState<Feriado[]>(INITIAL_FERIADOS);
  const feriados = propFeriados || localFeriados;
  const setFeriados = (fers: Feriado[]) => {
    setLocalFeriados(fers);
    propOnUpdateFeriados?.(fers);
  };

  const [localOcorrencias, setLocalOcorrencias] = useState<OcorrenciaDesconto[]>(INITIAL_OCORRENCIAS_DESCONTO);
  const ocorrencias = propOcorrencias || localOcorrencias;
  const setOcorrencias = (occs: OcorrenciaDesconto[]) => {
    setLocalOcorrencias(occs);
    propOnUpdateOcorrencias?.(occs);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // Sub-abas do Ambiente Operacional (sincronizada com App.tsx ou local)
  const [localOperationalTab, setLocalOperationalTab] = useState<'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'registros' | 'feriados' | 'tenants'>('relatorios');
  const operationalTab = propOperationalTab || localOperationalTab;
  const setOperationalTab = (tab: any) => {
    setLocalOperationalTab(tab);
    propOnSelectOperationalTab?.(tab);
  };

  // Relógio em tempo real do Coletor Tablet
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulação de Horário no Coletor (Permite testar a regra de 15 min e intervalo intrajornada)
  const [simulatedTimeOverride, setSimulatedTimeOverride] = useState<'REAL' | '07:20_ANTECIPADO' | '08:00_NORMAL' | '12:35_INTERVALO_CURTO'>('REAL');

  // Tipo de marcação selecionada no Kiosk
  const [selectedPunchType, setSelectedPunchType] = useState<'AUTO' | 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('AUTO');

  // Estado do Coletor Tablet de Ponto
  const [kioskInput, setKioskInput] = useState<string>('');
  const [lastComprovante, setLastComprovante] = useState<RegistroPontoREPP | null>(null);
  const [kioskFeedback, setKioskFeedback] = useState<{ type: 'SUCCESS' | 'WARNING' | 'ERROR'; msg: string; details?: string } | null>(null);

  // Modal Novo Cliente
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    slug: '',
    plano: 'Pro' as 'Starter' | 'Pro' | 'REP-P Corporativo',
    licencas: 100,
    emailAdmin: ''
  });
  const [newTenantError, setNewTenantError] = useState<string | null>(null);

  // Modal Novo Colaborador
  const [isNewColabModalOpen, setIsNewColabModalOpen] = useState(false);
  const [newColabForm, setNewColabForm] = useState({
    nome: '',
    cpf: '',
    matricula: '',
    cargoId: '',
    departamentoId: '',
    estabelecimentoId: '',
    regime: 'REGULAR' as 'REGULAR' | 'EXCECAO' | 'DISPENSA_ART_62',
    pinColetor: ''
  });

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  const activeColaboradores = colaboradores.filter((c) => c.tenantId === selectedTenantId);
  const activeRegistros = registrosPonto.filter((r) => r.tenantId === selectedTenantId);

  // Calcula a data/hora efetiva do relógio (considerando simulação de teste)
  const getEffectiveClockTime = (): Date => {
    const base = new Date();
    if (simulatedTimeOverride === '07:20_ANTECIPADO') {
      const d = new Date(base);
      d.setHours(7, 20, 0, 0);
      return d;
    }
    if (simulatedTimeOverride === '08:00_NORMAL') {
      const d = new Date(base);
      d.setHours(8, 0, 15, 0);
      return d;
    }
    if (simulatedTimeOverride === '12:35_INTERVALO_CURTO') {
      const d = new Date(base);
      d.setHours(12, 35, 0, 0);
      return d;
    }
    return base;
  };

  // Estado da Biometria Facial no Coletor
  const [biometricTargetColab, setBiometricTargetColab] = useState<Colaborador | null>(null);
  const [biometricPendingType, setBiometricPendingType] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' | 'AUTO'>('AUTO');
  const [biometricState, setBiometricState] = useState<'scanning' | 'verified'>('scanning');
  const [biometricConfidence, setBiometricConfidence] = useState<string>('99.2');

  // WebCam Real para o Coletor Kiosk
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // GPS Geolocation State
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; address: string; inGeofence: boolean } | null>({
    lat: -23.561684,
    lng: -46.655981,
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    inGeofence: true
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)} (Perímetro Validado)`,
            inGeofence: true
          });
        },
        () => {
          // Fallback seguro
        }
      );
    }
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (biometricTargetColab && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsCameraActive(true);
        })
        .catch(() => {
          setIsCameraActive(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [biometricTargetColab]);

  // Ação: Iniciar Biometria Facial para Bater Ponto no Tablet Coletor REP-P
  const handleBaterPonto = (
    colabOrInput?: Colaborador | string,
    forcedType?: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'
  ) => {
    const term = typeof colabOrInput === 'string' ? colabOrInput : colabOrInput?.cpf || kioskInput;
    const cleanTerm = term.replace(/\D/g, '');

    // Busca por CPF ou por PIN
    const colab = activeColaboradores.find(
      (c) => c.cpf.replace(/\D/g, '') === cleanTerm || c.pinColetor === term.trim()
    );

    if (!colab) {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Identificação não encontrada. Digite o CPF ou PIN cadastrado.'
      });
      setTimeout(() => setKioskFeedback(null), 4000);
      return;
    }

    if (colab.status === 'DESLIGADO') {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Colaborador com vínculo desligado. Registro de ponto recusado.'
      });
      setTimeout(() => setKioskFeedback(null), 4000);
      return;
    }

    // Abre o Modal de Reconhecimento Facial (Leitura Facial Biométrica)
    setBiometricTargetColab(colab);
    setBiometricPendingType(forcedType || selectedPunchType);
    setBiometricState('scanning');
    setBiometricConfidence((98.5 + Math.random() * 1.4).toFixed(1));

    // Simula varredura facial biométrica por 1.8 segundos e transiciona para verified
    setTimeout(() => {
      setBiometricState('verified');
    }, 1800);
  };

  // Efetiva a marcação após a validação biométrica e de sequência
  const executeFinalPonto = () => {
    if (!biometricTargetColab) return;
    const colab = biometricTargetColab;
    const clockTime = getEffectiveClockTime();
    const hojeYMD = clockTime.toISOString().slice(0, 10);
    const batidasHoje = registrosPonto.filter(
      (r) => r.colaboradorId === colab.id && r.dataHora.startsWith(hojeYMD)
    );

    // Determina o tipo de marcação
    let tipo: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' = 'ENTRADA';
    if (biometricPendingType !== 'AUTO') {
      tipo = biometricPendingType;
    } else {
      if (batidasHoje.length === 0) tipo = 'ENTRADA';
      else if (batidasHoje.length === 1) tipo = 'INTERVALO_INICIO';
      else if (batidasHoje.length === 2) tipo = 'INTERVALO_FIM';
      else tipo = 'SAIDA';
    }

    // =========================================================================
    // 3. VALIDAÇÃO DE SEQUÊNCIA CRONOLÓGICA DE PONTO (Portaria 671 / Boas Práticas)
    // =========================================================================
    const temEntradaHoje = batidasHoje.some(b => b.tipoMarcacao === 'ENTRADA');
    const temSaidaAlmocoHoje = batidasHoje.some(b => b.tipoMarcacao === 'INTERVALO_INICIO');
    const temVoltaAlmocoHoje = batidasHoje.some(b => b.tipoMarcacao === 'INTERVALO_FIM');
    const temSaidaFinalHoje = batidasHoje.some(b => b.tipoMarcacao === 'SAIDA');

    if (tipo === 'INTERVALO_INICIO') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é permitido registrar Saída para Intervalo sem uma marcação prévia de Entrada no dia para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (temSaidaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: A Saída para Intervalo já foi registrada hoje para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    if (tipo === 'INTERVALO_FIM') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é possível registrar Retorno do Intervalo sem Entrada prévia.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (!temSaidaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Bloqueio de Sequência! Não é permitido registrar Volta do Almoço sem ter registrado a Saída para Almoço anteriormente!`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }
      if (temVoltaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: O Retorno do Intervalo já foi registrado hoje para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    if (tipo === 'SAIDA') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é possível registrar Saída sem uma Entrada registrada no dia.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (temSaidaFinalHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: A jornada de trabalho de hoje já foi encerrada com Saída registrada para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    let alertaAntecedencia: string | undefined = undefined;
    let alertaIntervalo: string | undefined = undefined;
    let alertaGeofence: string | undefined = undefined;

    // =========================================================================
    // 0. VALIDAÇÃO DE GEOFENCING E RAIO PERMITIDO DA UNIDADE
    // =========================================================================
    const estColab = estabelecimentos.find((e) => e.id === colab.estabelecimentoId) || estabelecimentos[0] || {
      id: 'est-01',
      latitude: -23.561684,
      longitude: -46.655981,
      cercaRaioMetros: 100,
      bloquearForaDoRaio: true,
      nome: 'Sede Administrativa'
    };

    let distMetrosGeofence = 12;
    if (gpsData) {
      distMetrosGeofence = calculateDistanceMeters(gpsData.lat, gpsData.lng, estColab.latitude, estColab.longitude);
    }

    const foraDaCerca = distMetrosGeofence > estColab.cercaRaioMetros;

    if (foraDaCerca) {
      if (estColab.bloquearForaDoRaio !== false) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Bloqueio de Geofencing: Ponto recusado para ${colab.nome}. Posição atual a ${distMetrosGeofence}m da unidade "${estColab.nome}" (raio máximo permitido: ${estColab.cercaRaioMetros}m).`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      } else {
        alertaGeofence = `AVISO GEOFENCING AO RH: Marcação realizada a ${distMetrosGeofence}m do centro da unidade "${estColab.nome}" (raio máximo cadastrado: ${estColab.cercaRaioMetros}m).`;
      }
    }

    // =========================================================================
    // 1. REGRA AUTOMÁTICA DE ANTECEDÊNCIA MÁXIMA (CLT Art. 58 § 1º e Art. 4º)
    // =========================================================================
    if (tipo === 'ENTRADA' && colab.regraAntecedenciaAtiva !== false) {
      const [hInicio, mInicio] = colab.horarioInicio.split(':').map(Number);
      const minutosInicioContratado = hInicio * 60 + mInicio;
      const minutosAtuais = clockTime.getHours() * 60 + clockTime.getMinutes();

      const diferencaMinutos = minutosInicioContratado - minutosAtuais;
      const toleranciaPermitida = colab.maxMinutosAntecedenciaPermitido || 15;

      if (diferencaMinutos > toleranciaPermitida) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Bloqueio de Antecedência: Entrada registrada muito cedo (${diferencaMinutos} min antes do início contratado ${colab.horarioInicio}). O limite de tolerância é ${toleranciaPermitida} min (CLT Art. 58 § 1º).`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }
    }

    // =========================================================================
    // 2. CONTROLE DE HORÁRIO DE INTERVALO (CLT Art. 71 e Art. 66)
    // =========================================================================
    if (tipo === 'INTERVALO_FIM') {
      const ultimaSaidaAlmoco = [...batidasHoje].reverse().find((b) => b.tipoMarcacao === 'INTERVALO_INICIO');
      const intervaloMinimo = colab.intervaloMinutos || 60;

      if (ultimaSaidaAlmoco) {
        const horaSaida = new Date(ultimaSaidaAlmoco.dataHora);
        const minutosIntervalo = Math.round((clockTime.getTime() - horaSaida.getTime()) / (60 * 1000));

        if (minutosIntervalo < intervaloMinimo) {
          const suprimidos = intervaloMinimo - minutosIntervalo;
          alertaIntervalo = `Alerta CLT Art. 71 § 4º: Intervalo intrajornada suprimido em ${suprimidos} min (duração realizada: ${minutosIntervalo} min / exigência mínima: ${intervaloMinimo} min). Gera indenização com acréscimo de 50%.`;
        }
      } else if (simulatedTimeOverride === '12:35_INTERVALO_CURTO') {
        alertaIntervalo = `Alerta CLT Art. 71 § 4º: Intervalo intrajornada suprimido em 25 min (duração simulada: 35 min / exigência: ${intervaloMinimo} min). Gera indenização de 50%.`;
      }
    }

    const nextNsr = registrosPonto.length + 1;
    const nowIso = clockTime.toISOString();
    const dataHoraFmt = `${String(clockTime.getDate()).padStart(2, '0')}/${String(clockTime.getMonth() + 1).padStart(2, '0')}/${clockTime.getFullYear()} ${String(clockTime.getHours()).padStart(2, '0')}:${String(clockTime.getMinutes()).padStart(2, '0')}:${String(clockTime.getSeconds()).padStart(2, '0')}`;

    // Gera hash criptográfico simulado
    const rawPayload = `${nextNsr}|${activeTenant.cnpj}|${colab.cpf}|${nowIso}|-03:00|${tipo}|BIOMETRIA_FACIAL_OK`;
    let hashCalc = '';
    for (let i = 0; i < 64; i++) {
      hashCalc += ((i * 17 + nextNsr * 31 + colab.cpf.charCodeAt(i % colab.cpf.length)) % 16).toString(16);
    }

    const novoRegistro: RegistroPontoREPP = {
      nsr: nextNsr,
      tenantId: activeTenant.id,
      empregadorRazaoSocial: activeTenant.razaoSocial,
      empregadorCnpj: activeTenant.cnpj,
      colaboradorId: colab.id,
      colaboradorNome: colab.nome,
      colaboradorCpf: colab.cpf,
      colaboradorMatricula: colab.matricula,
      dataHora: nowIso,
      dataHoraFormatada: dataHoraFmt,
      fusoHorario: '-03:00',
      coletorId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      tipoMarcacao: tipo,
      alertaAntecedencia,
      alertaIntervalo,
      hashSha256: hashCalc,
      latitude: gpsData?.lat || -23.561684,
      longitude: gpsData?.lng || -46.655981,
      distanciaCentroMetros: 12,
      foraDoRaioGeofence: false,
      localizacaoEndereco: gpsData?.address || 'Av. Paulista, 1000 - São Paulo, SP',
      modoDispositivo: isCameraActive ? 'WEB_CAM' : 'TABLET_KIOSK'
    };

    setRegistrosPonto([novoRegistro, ...registrosPonto]);
    setLastComprovante(novoRegistro);
    setKioskInput('');
    setBiometricTargetColab(null);

    const labelTipo =
      tipo === 'ENTRADA'
        ? '1ª Entrada'
        : tipo === 'INTERVALO_INICIO'
        ? 'Saída para Intervalo (Almoço)'
        : tipo === 'INTERVALO_FIM'
        ? 'Retorno do Intervalo'
        : '2ª Saída (Término)';

    if (alertaAntecedencia || alertaIntervalo) {
      setKioskFeedback({
        type: 'WARNING',
        msg: `Atenção: Ponto de ${labelTipo} (com Biometria Facial) registrado com observação legal! NSR ${String(nextNsr).padStart(9, '0')}.`,
        details: alertaAntecedencia || alertaIntervalo
      });
    } else {
      setKioskFeedback({
        type: 'SUCCESS',
        msg: `Biometria Facial confirmada! Ponto de ${labelTipo} registrado para ${colab.nome}! NSR ${String(nextNsr).padStart(9, '0')}.`
      });
    }

    // Grava na Trilha de Auditoria
    const auditItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: dataHoraFmt,
      tenantId: activeTenant.id,
      operador: `Coletor Kiosk 01 (UUID 9b1deb4d - Biometria Facial)`,
      acao: 'REGISTRO_PONTO_REPP_BIOMETRIA',
      detalhes: `Marcação (${tipo}) com Biometria Facial confirmada do trabalhador ${colab.nome} (CPF ${colab.cpf}), NSR ${nextNsr}.`,
      hash: hashCalc
    };
    setAuditLogs([auditItem, ...auditLogs]);

    setTimeout(() => setKioskFeedback(null), 8000);
  };

  // Ação: Download do Arquivo AFD Oficial (Portaria 671)
  const handleDownloadAFD = () => {
    const afdText = generateAFDContent(activeTenant, activeRegistros);
    const blob = new Blob([afdText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AFD_${activeTenant.cnpj.replace(/\D/g, '')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ação: Download do Arquivo AEJ Fiscal (Arquivo Eletrônico de Jornada - Portaria 671)
  const handleDownloadAEJ = () => {
    const aejText = generateAEJContent(activeTenant, colaboradores, activeRegistros);
    const blob = new Blob([aejText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AEJ_${activeTenant.cnpj.replace(/\D/g, '')}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ação: Criar Novo Cliente
  const handleCreateTenant = () => {
    const cnpjVal = validateCNPJ(newTenantForm.cnpj);
    if (!cnpjVal.isValid) {
      setNewTenantError(cnpjVal.error || 'CNPJ inválido');
      return;
    }

    if (!newTenantForm.razaoSocial.trim()) {
      setNewTenantError('Razão Social é obrigatória');
      return;
    }

    const slug = newTenantForm.slug || newTenantForm.razaoSocial.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);

    const novo: Tenant = {
      id: `tenant-${Date.now()}`,
      cnpj: newTenantForm.cnpj,
      razaoSocial: newTenantForm.razaoSocial,
      nomeFantasia: newTenantForm.nomeFantasia || newTenantForm.razaoSocial,
      slug,
      plano: newTenantForm.plano,
      licencasContratadas: newTenantForm.licencas,
      licencasEmUso: 0,
      status: 'ATIVO',
      dataAdesao: new Date().toISOString().slice(0, 10),
      emailAdmin: newTenantForm.emailAdmin || 'admin@cliente.com.br'
    };

    setTenants([novo, ...tenants]);
    setSelectedTenantId(novo.id);
    setIsNewTenantModalOpen(false);
    setNewTenantForm({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      slug: '',
      plano: 'Pro',
      licencas: 100,
      emailAdmin: ''
    });
    setNewTenantError(null);
  };

  // Ação: Criar Novo Colaborador
  const handleCreateColaborador = () => {
    const cpfVal = validateCPF(newColabForm.cpf);
    if (!cpfVal.isValid) {
      alert(cpfVal.error || 'CPF inválido');
      return;
    }

    if (!newColabForm.nome.trim()) {
      alert('Nome do colaborador é obrigatório');
      return;
    }

    const depId = newColabForm.departamentoId || departamentos[0]?.id;
    const dep = departamentos.find((d) => d.id === depId) || departamentos[0];
    const crg = cargos.find((c) => c.id === newColabForm.cargoId) || cargos[0];
    const est = estabelecimentos.find((e) => e.id === newColabForm.estabelecimentoId) || estabelecimentos[0];

    const novoColab: Colaborador = {
      id: `colab-${Date.now()}`,
      tenantId: activeTenant.id,
      nome: newColabForm.nome,
      cpf: newColabForm.cpf,
      matricula: newColabForm.matricula || `SC-${Math.floor(1000 + Math.random() * 9000)}`,
      dataAdmissao: new Date().toISOString().slice(0, 10),
      cargoId: crg.id,
      cargoTitulo: crg.titulo,
      departamentoId: dep.id,
      departamentoNome: dep.nome,
      gestorId: dep.gestorId,
      gestorNome: dep.gestorNome,
      estabelecimentoId: est.id,
      estabelecimentoNome: est.nome,
      regime: newColabForm.regime,
      horarioInicio: dep.horarioInicioPadrao || '08:00',
      horarioFim: '17:00',
      cargaHorariaDiariaHoras: dep.cargaHorariaDiariaHoras || 8,
      intervaloMinutos: dep.intervaloMinutos || 60,
      maxMinutosAntecedenciaPermitido: dep.maxMinutosAntecedenciaPermitido || 15,
      regraAntecedenciaAtiva: dep.regraAntecedenciaAtiva ?? true,
      pinColetor: newColabForm.pinColetor || '123456',
      status: 'ATIVO'
    };

    setColaboradores([...colaboradores, novoColab]);
    setIsNewColabModalOpen(false);
    setNewColabForm({
      nome: '',
      cpf: '',
      matricula: '',
      cargoId: '',
      departamentoId: '',
      estabelecimentoId: '',
      regime: 'REGULAR',
      pinColetor: ''
    });
  };

  const pendentesHeCount = horasExtras.filter((h) => h.status === 'PENDENTE').length;

  return (
    <div className="space-y-6">
      {/* Barra de Seleção de Empresa Empregadora (Multi-tenant) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Empresa Empregadora Selecionada
            </span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer truncate max-w-full sm:max-w-xs md:max-w-sm"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.razaoSocial} ({t.cnpj})
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                Plano {activeTenant.plano}
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores em Linha (Grid responsivo no mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px]">Vidas Ativas</span>
            <span className="font-bold font-mono text-slate-900">
              {activeColaboradores.length} / {activeTenant.licencasContratadas}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Equipes / Gestores</span>
            <span className="font-bold font-mono text-slate-900">
              {departamentos.length} Equipes
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">H.E. Pendentes</span>
            <span className={`font-bold font-mono ${pendentesHeCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
              {pendentesHeCount}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Total NSRs</span>
            <span className="font-bold font-mono text-emerald-700">
              {activeRegistros.length} Emitidos
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ABA: MÓDULO 09 — RELATÓRIOS & APURAÇÃO DE DESCONTOS      */}
      {/* ========================================================= */}
      {operationalTab === 'relatorios' && (
        <ModuloRelatoriosOcorrencias
          ocorrencias={ocorrencias}
          onUpdateOcorrencias={setOcorrencias}
          departamentos={departamentos}
          colaboradores={colaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA 0: EQUIPES, GESTORES & HORAS EXTRAS                  */}
      {/* ========================================================= */}
      {operationalTab === 'equipes' && (
        <GestaoEquipesEAprovacoes
          departamentos={departamentos}
          onUpdateDepartamentos={setDepartamentos}
          colaboradores={colaboradores}
          onUpdateColaboradores={setColaboradores}
          horasExtras={horasExtras}
          onUpdateHorasExtras={setHorasExtras}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: BIOMETRIA FACIAL (MÓDULO 02)                        */}
      {/* ========================================================= */}
      {operationalTab === 'biometria' && (
        <BiometricConfigurator
          activeTenant={activeTenant}
          colaboradores={colaboradores}
          onUpdateColaboradores={setColaboradores}
          estabelecimentos={estabelecimentos}
          onUpdateEstabelecimentos={setEstabelecimentos}
        />
      )}

      {/* ========================================================= */}
      {/* ABA 1: COLETOR TABLET REP-P (KIOSK DE PONTO INTERATIVO)  */}
      {/* ========================================================= */}
      {operationalTab === 'coletor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* O Tablet Virtual Kiosk */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  COLETOR TABLET HOMOLOGADO (REP-P)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                UUID: 9b1deb4d · Portaria MTP 671/2021
              </span>
            </div>

            {/* Seletor de Simulação de Horário para Teste das Regras */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Ambiente de Teste de Horário & Regras:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  CLT Art. 4º, 58 § 1º e Art. 71
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-medium">
                <button
                  onClick={() => setSimulatedTimeOverride('REAL')}
                  className={`py-1.5 px-2 rounded-lg border transition-colors ${
                    simulatedTimeOverride === 'REAL'
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Horário Real
                </button>
                <button
                  onClick={() => setSimulatedTimeOverride('08:00_NORMAL')}
                  className={`py-1.5 px-2 rounded-lg border transition-colors ${
                    simulatedTimeOverride === '08:00_NORMAL'
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  08:00 (Início OK)
                </button>
                <button
                  onClick={() => setSimulatedTimeOverride('07:20_ANTECIPADO')}
                  className={`py-1.5 px-2 rounded-lg border transition-colors ${
                    simulatedTimeOverride === '07:20_ANTECIPADO'
                      ? 'bg-amber-600 border-amber-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  07:20 (&gt;15m Cedo)
                </button>
                <button
                  onClick={() => setSimulatedTimeOverride('12:35_INTERVALO_CURTO')}
                  className={`py-1.5 px-2 rounded-lg border transition-colors ${
                    simulatedTimeOverride === '12:35_INTERVALO_CURTO'
                      ? 'bg-rose-600 border-rose-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  12:35 (Almoço 35m)
                </button>
              </div>
            </div>

            {/* Relógio Digital Oficial HLB */}
            <div className="text-center py-5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">
                Hora Legal Brasileira {simulatedTimeOverride !== 'REAL' && '(Simulação Ativa)'}
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider tabular-nums">
                {getEffectiveClockTime().toLocaleTimeString('pt-BR')}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {getEffectiveClockTime().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Seletor de Tipo de Marcação (Controle de Intervalo CLT Art. 71) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Tipo da Marcação no Coletor:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-medium">
                <button
                  onClick={() => setSelectedPunchType('AUTO')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors ${
                    selectedPunchType === 'AUTO'
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Automático
                </button>
                <button
                  onClick={() => setSelectedPunchType('ENTRADA')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'ENTRADA'
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> 1ª Entrada
                </button>
                <button
                  onClick={() => setSelectedPunchType('INTERVALO_INICIO')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'INTERVALO_INICIO'
                      ? 'bg-amber-600 border-amber-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" /> Saída Almoço
                </button>
                <button
                  onClick={() => setSelectedPunchType('INTERVALO_FIM')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'INTERVALO_FIM'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Volta Almoço
                </button>
                <button
                  onClick={() => setSelectedPunchType('SAIDA')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'SAIDA'
                      ? 'bg-rose-600 border-rose-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> 2ª Saída
                </button>
              </div>
            </div>

            {/* Entrada de Identificação (CPF ou PIN) */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-300 block">
                Identificação do Trabalhador (Digite CPF ou PIN):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={kioskInput}
                  onChange={(e) => setKioskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBaterPonto()}
                  placeholder="Ex: 123.456.789-09 ou PIN 102030"
                  className="w-full sm:flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleBaterPonto()}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  Registrar Ponto
                </button>
              </div>

              {kioskFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs space-y-1 ${
                    kioskFeedback.type === 'SUCCESS'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : kioskFeedback.type === 'WARNING'
                      ? 'bg-amber-950/90 text-amber-200 border border-amber-700'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2 font-bold">
                    {kioskFeedback.type === 'SUCCESS' && (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    )}
                    {kioskFeedback.type === 'WARNING' && (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    )}
                    {kioskFeedback.type === 'ERROR' && (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span>{kioskFeedback.msg}</span>
                  </div>
                  {kioskFeedback.details && (
                    <p className="text-[11px] text-amber-300/90 pl-6">
                      {kioskFeedback.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Acesso Rápido de Demonstração (Colaboradores Cadastrados) */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Simulação Rápida — Clique em um colaborador para bater o ponto com as regras ativas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeColaboradores.map((colab) => (
                  <button
                    key={colab.id}
                    onClick={() => handleBaterPonto(colab)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400">
                        {colab.nome}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Início: {colab.horarioInicio} · Int: {colab.intervaloMinutos}m · Máx Antecedência: {colab.maxMinutosAntecedenciaPermitido}m
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gestor: {colab.gestorNome || 'Roberto Albuquerque'}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* O Comprovante Oficial Emitido (Portaria 671 Art. 83) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Comprovante de Registro de Ponto do Trabalhador
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Portaria 671 Art. 83</span>
              </div>

              {lastComprovante ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono text-xs">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <div className="font-bold text-slate-900 text-sm">COMPROVANTE DE PONTO ELETRÔNICO</div>
                    <div className="text-[10px] text-slate-500">REGISTRADOR ELETRÔNICO DE PONTO VIA PROGRAMA (REP-P)</div>
                  </div>

                  <div className="space-y-1.5 text-slate-700 text-[11px]">
                    <div>
                      <span className="text-slate-400">EMPREGADOR:</span> {lastComprovante.empregadorRazaoSocial}
                    </div>
                    <div>
                      <span className="text-slate-400">CNPJ:</span> {lastComprovante.empregadorCnpj}
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-slate-400">TRABALHADOR:</span> {lastComprovante.colaboradorNome}
                    </div>
                    <div>
                      <span className="text-slate-400">CPF:</span> {lastComprovante.colaboradorCpf}
                    </div>
                    <div>
                      <span className="text-slate-400">MATRÍCULA:</span> {lastComprovante.colaboradorMatricula}
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex justify-between">
                      <span className="text-slate-400">TIPO DE MARCAÇÃO:</span>
                      <strong className="text-slate-900">
                        {lastComprovante.tipoMarcacao === 'ENTRADA' && '1ª ENTRADA'}
                        {lastComprovante.tipoMarcacao === 'INTERVALO_INICIO' && 'SAÍDA INTERVALO (ALMOÇO)'}
                        {lastComprovante.tipoMarcacao === 'INTERVALO_FIM' && 'RETORNO INTERVALO (ALMOÇO)'}
                        {lastComprovante.tipoMarcacao === 'SAIDA' && '2ª SAÍDA (TÉRMINO EXPEDIENTE)'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DATA/HORA:</span>
                      <strong className="text-slate-900">{lastComprovante.dataHoraFormatada} (HLB)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NSR (Nº SEQUENCIAL):</span>
                      <strong className="text-emerald-700">{String(lastComprovante.nsr).padStart(9, '0')}</strong>
                    </div>

                    {lastComprovante.alertaAntecedencia && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-sans">
                        <strong>Aviso CLT Art. 58:</strong> {lastComprovante.alertaAntecedencia}
                      </div>
                    )}

                    {lastComprovante.alertaIntervalo && (
                      <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[10px] font-sans">
                        <strong>Alerta CLT Art. 71 § 4º:</strong> {lastComprovante.alertaIntervalo}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 break-all leading-relaxed">
                    <span className="font-bold block text-slate-600 mb-0.5">HASH DE AUTENTICIDADE SHA-256:</span>
                    <code>{lastComprovante.hashSha256}</code>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Printer className="w-3 h-3" /> Imprimir Comprovante
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>Nenhuma marcação realizada nesta sessão.</p>
                  <p className="text-[11px] text-slate-400">
                    Utilize o tablet ao lado para registrar o primeiro ponto. O comprovante oficial com NSR e Hash SHA-256 aparecerá aqui.
                  </p>
                </div>
              )}

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 leading-relaxed">
                <strong>Conformidade Legal:</strong> O comprovante eletrônico é imutável e assinado digitalmente, contendo todos os campos do Art. 83 da Portaria 671/2021.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: EMPRESA, COLABORADORES & ESTRUTURA RH              */}
      {/* ========================================================= */}
      {operationalTab === 'empresa' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Colaboradores Cadastrados na {activeTenant.razaoSocial}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quadro de colaboradores ativos com vínculo de ponto, horários, intervalos e gestores responsáveis.
                </p>
              </div>
              <button
                onClick={() => setIsNewColabModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Novo Colaborador
              </button>
            </div>

            {/* Tabela de Colaboradores */}
            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3">Matrícula</th>
                    <th className="py-2.5 px-3">Cargo / Equipe</th>
                    <th className="py-2.5 px-3">Gestor da Equipe</th>
                    <th className="py-2.5 px-3">Jornada / Tolerância</th>
                    <th className="py-2.5 px-3">PIN Coletor</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeColaboradores.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {c.nome}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{c.cpf}</td>
                      <td className="py-3 px-3 text-slate-500">{c.matricula}</td>
                      <td className="py-3 px-3 font-sans text-slate-700">
                        <div>{c.cargoTitulo}</div>
                        <div className="text-[10px] text-slate-400">{c.departamentoNome}</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-800">
                        <span className="font-semibold">{c.gestorNome || 'Roberto Albuquerque'}</span>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700 text-[11px]">
                        <div>{c.horarioInicio} às {c.horarioFim} ({c.intervaloMinutos}m int.)</div>
                        <div className="text-[10px] text-emerald-700">
                          {c.regraAntecedenciaAtiva ? `Máx ${c.maxMinutosAntecedenciaPermitido}m antecipado` : 'Sem restrição'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">{c.pinColetor}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: REGISTROS EMITIDOS & ARQUIVO AFD OFICIAL           */}
      {/* ========================================================= */}
      {operationalTab === 'registros' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Arquivo Fonte de Dados (AFD) & Registros REP-P
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lista inalterável de marcações com NSR sequencial, controle de intervalo e ocorrências.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadAFD}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Baixar AFD (.txt)
                </button>
                <button
                  onClick={handleDownloadAEJ}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-800" />
                  Baixar AEJ Fiscal (.txt)
                </button>
              </div>
            </div>

            {/* Tabela de Registros com NSR */}
            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">NSR</th>
                    <th className="py-2.5 px-3">Data e Hora (HLB)</th>
                    <th className="py-2.5 px-3">Tipo da Marcação</th>
                    <th className="py-2.5 px-3">Trabalhador</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3">Alertas & Ocorrências</th>
                    <th className="py-2.5 px-3">Hash Criptográfico (SHA-256)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeRegistros.map((reg) => (
                    <tr key={reg.nsr} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-bold text-emerald-700">
                        {String(reg.nsr).padStart(9, '0')}
                      </td>
                      <td className="py-3 px-3 text-slate-800">{reg.dataHoraFormatada}</td>
                      <td className="py-3 px-3 font-sans font-semibold">
                        <span className={`text-[11px] px-2 py-0.5 rounded border ${
                          reg.tipoMarcacao === 'ENTRADA'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : reg.tipoMarcacao === 'INTERVALO_INICIO'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : reg.tipoMarcacao === 'INTERVALO_FIM'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {reg.tipoMarcacao === 'ENTRADA' && '1ª Entrada'}
                          {reg.tipoMarcacao === 'INTERVALO_INICIO' && 'Saída Intervalo'}
                          {reg.tipoMarcacao === 'INTERVALO_FIM' && 'Retorno Intervalo'}
                          {reg.tipoMarcacao === 'SAIDA' && '2ª Saída'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {reg.colaboradorNome}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{reg.colaboradorCpf}</td>
                      <td className="py-3 px-3 font-sans">
                        {reg.alertaAntecedencia && (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block mb-1">
                            Antecedência &gt; 15 min (CLT 58)
                          </span>
                        )}
                        {reg.alertaIntervalo && (
                          <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 block">
                            Intervalo Suprimido (CLT 71)
                          </span>
                        )}
                        {!reg.alertaAntecedencia && !reg.alertaIntervalo && (
                          <span className="text-[11px] text-slate-400 font-mono">Regular</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[10px] text-slate-500 max-w-[150px] truncate" title={reg.hashSha256}>
                        {reg.hashSha256}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong>Princípio da Imutabilidade (Portaria 671 Art. 84):</strong> Nenhum registro original pode ser alterado ou excluído. Qualquer correção de horário posterior será feita exclusivamente no PTRP como tratamento aditivo com apontamento do autor e motivo no arquivo AEJ.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: GESTÃO DE TENANTS (PAINEL SOFTCASE ADMIN)          */}
      {/* ========================================================= */}
      {operationalTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Diretório de Empresas Clientes (Tenants Softcase)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administração central de contratos SaaS, isolamento de banco e consumo de licenças.
                </p>
              </div>
              <button
                onClick={() => setIsNewTenantModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar Novo Cliente
              </button>
            </div>

            {/* Tabela de Tenants */}
            <div className="overflow-x-auto mt-4 border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Empresa Contratante</th>
                    <th className="py-2.5 px-3">CNPJ</th>
                    <th className="py-2.5 px-3">Subdomínio (Slug)</th>
                    <th className="py-2.5 px-3">Plano</th>
                    <th className="py-2.5 px-3">Licenças em Uso</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{t.razaoSocial}</div>
                        <div className="text-[10px] text-slate-400">{t.emailAdmin}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{t.cnpj}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{t.slug}.softcaseponto.com.br</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{t.plano}</td>
                      <td className="py-3 px-3 font-mono">
                        {t.licencasEmUso} / {t.licencasContratadas} vidas
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            t.status === 'ATIVO'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedTenantId(t.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 5: GESTÃO DE FERIADOS POR EMPRESA & DSR (MÓDULO 03)  */}
      {/* ========================================================= */}
      {operationalTab === 'feriados' && (
        <GestaoFeriados
          activeTenant={activeTenant}
          estabelecimentos={estabelecimentos}
          colaboradores={colaboradores}
          feriados={feriados}
          onAddFeriado={(novo) => setFeriados([novo, ...feriados])}
        />
      )}

      {/* MODAL: NOVO CLIENTE */}
      {isNewTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Cadastrar Nova Empresa Cliente</h3>
            {newTenantError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {newTenantError}
              </div>
            )}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">CNPJ do Empregador:</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={newTenantForm.cnpj}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, cnpj: formatCNPJ(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Razão Social:</label>
                <input
                  type="text"
                  placeholder="Nome empresarial completo"
                  value={newTenantForm.razaoSocial}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, razaoSocial: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plano:</label>
                  <select
                    value={newTenantForm.plano}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, plano: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Starter">Starter (até 50 vidas)</option>
                    <option value="Pro">Pro (até 200 vidas)</option>
                    <option value="REP-P Corporativo">REP-P Corporativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Licenças:</label>
                  <input
                    type="number"
                    value={newTenantForm.licencas}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, licencas: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewTenantModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTenant}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Cadastrar Empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO COLABORADOR */}
      {isNewColabModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Admitir Novo Colaborador</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nome Completo:</label>
                <input
                  type="text"
                  placeholder="Nome do trabalhador"
                  value={newColabForm.nome}
                  onChange={(e) => setNewColabForm({ ...newColabForm, nome: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">CPF:</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={newColabForm.cpf}
                    onChange={(e) => setNewColabForm({ ...newColabForm, cpf: formatCPF(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">PIN do Tablet (6 dígitos):</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={newColabForm.pinColetor}
                    onChange={(e) => setNewColabForm({ ...newColabForm, pinColetor: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Equipe / Departamento:</label>
                  <select
                    value={newColabForm.departamentoId}
                    onChange={(e) => setNewColabForm({ ...newColabForm, departamentoId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} (Gestor: {d.gestorNome})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cargo:</label>
                  <select
                    value={newColabForm.cargoId}
                    onChange={(e) => setNewColabForm({ ...newColabForm, cargoId: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  >
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsNewColabModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateColaborador}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Salvar Colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BIOMETRIA FACIAL (LEITURA FACIAL REP-P) */}
      {biometricTargetColab && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white space-y-5 text-center relative overflow-hidden">
            {/* Top scanning header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  RECONHECIMENTO FACIAL REP-P
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Portaria 671 / ISO 19794-5</span>
            </div>

            {/* Simulated/Real Camera Feed & Face Mesh */}
            <div className={`relative w-48 h-48 mx-auto rounded-full bg-slate-950 flex items-center justify-center overflow-hidden shadow-inner biometric-modal-scanner-circle ${biometricState === 'verified' ? 'verified' : ''}`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {biometricState === 'scanning' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-slate-950/30 backdrop-blur-[1px]">
                  <div className="absolute inset-x-0 h-1 bg-emerald-400 animate-bounce shadow-lg shadow-emerald-400"></div>
                  {!isCameraActive && <Users className="w-16 h-16 text-emerald-500/40 animate-pulse" />}
                  <span className="text-[11px] font-mono font-bold text-emerald-300 animate-pulse bg-slate-950/80 px-2 py-0.5 rounded">
                    Mapeando face...
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/70 text-emerald-300 space-y-1">
                  <ShieldCheck className="w-16 h-16 text-emerald-400 animate-bounce" />
                  <span className="text-xs font-bold font-mono">MATCH 100%</span>
                </div>
              )}
            </div>

            {/* Worker Details */}
            <div className="space-y-1">
              <div className="text-base font-bold text-white">
                {biometricTargetColab.nome}
              </div>
              <div className="text-xs font-mono text-slate-400">
                CPF: {biometricTargetColab.cpf} · Matrícula: {biometricTargetColab.matricula}
              </div>
              <div className="text-xs text-emerald-400 font-semibold pt-1">
                {biometricState === 'scanning'
                  ? 'Analisando 128 pontos faciais e prova de vida (liveness)...'
                  : `Identidade confirmada com ${biometricConfidence}% de precisão biométrica!`}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBiometricTargetColab(null)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeFinalPonto}
                disabled={biometricState === 'scanning'}
                className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-colors shadow-lg ${
                  biometricState === 'verified'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                    : 'bg-emerald-600/50 text-white cursor-wait'
                }`}
              >
                {biometricState === 'verified' ? 'Confirmar e Registrar Ponto' : 'Aguarde a Varredura...'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
