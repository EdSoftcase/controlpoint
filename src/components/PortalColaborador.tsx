import React, { useState } from 'react';
import { AuthUser } from '../types/auth';
import { 
  RegistroPontoREPP, 
  Feriado, 
  SolicitacaoHoraExtra,
  SolicitacaoAjustePonto,
  AssinaturaEspelhoPonto,
  Estabelecimento,
  Colaborador
} from '../types/operational';
import { 
  Clock, 
  Calendar, 
  FileText, 
  Printer, 
  CheckCircle2, 
  UserCheck, 
  Scale, 
  Award,
  ChevronRight,
  ShieldCheck,
  Coffee,
  Plus,
  Send,
  XCircle,
  AlertTriangle,
  PenTool,
  Paperclip,
  MapPin,
  FileSpreadsheet,
  Camera,
  ScanFace,
  Lock,
  Sparkles,
  Navigation,
  ShieldAlert,
  RefreshCw,
  X,
  Check,
  Key,
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  Info,
  Plane,
  Megaphone,
  MessageSquare,
  Pin
} from 'lucide-react';
import { ComunicadoEmpresa, ChamadoAtendimentoRh, CategoriaComunicado, AssuntoChamadoRh } from '../types/rhAvancado';
import {
  detectFaceAndBiometrics,
  matchBiometricFace,
  averageBiometricDescriptors,
  saveBiometricTemplate,
  resetLivenessState,
  getRandomLivenessChallenge,
  LivenessChallenge,
  evaluateLivenessMotion,
  LivenessSample
} from '../utils/facialBiometricsEngine';
import { calculateDistanceMeters } from './BiometricConfigurator';
import { saveOfflinePunchToIDB } from '../utils/pwaBackgroundSync';
import { checkPinUsageEligibility } from '../utils/brazilianValidators';
import { calculateWorkedTime } from '../utils/jornadaCalculator';
import {
  calcularHorasNoturnasIntervalo,
  calcularReflexoDSR,
  verificarInterjornada11h
} from '../utils/cltCalculators';
import {
  calcularStatusDiaEscala,
  gerarCalendarioMesEscala
} from '../utils/shiftEngine';
import { SolicitacaoTrocaTurno } from '../types/rhAvancado';
import { useAuth } from './AuthContext';
import { PortalFeriasTab } from './portal/PortalFeriasTab';
import { PortalEspelhoTab } from './portal/PortalEspelhoTab';
import {
  getBrasiliaNow,
  getBrasiliaParts,
  getBrasiliaYmd,
  getBrasiliaMonthYear,
  getBrasiliaMinutesOfDay,
  getBrasiliaDayOfWeek,
  formatBrasiliaDate,
  formatBrasiliaTime,
  getMonthLabelPtBr
} from '../utils/brasiliaClock';
import { hasRealBiometricTemplate } from '../utils/biometricHelpers';

export type PortalTabId =
  | 'espelho'
  | 'horas_extras'
  | 'comprovantes'
  | 'feriados'
  | 'assinatura'
  | 'ajustes'
  | 'troca_turno'
  | 'escala'
  | 'ferias'
  | 'holerites'
  | 'comunicados'
  | 'fale_dp';

interface PortalColaboradorProps {
  user: AuthUser;
  registros: RegistroPontoREPP[];
  feriados: Feriado[];
  horasExtras?: SolicitacaoHoraExtra[];
  onAddHoraExtra?: (nova: SolicitacaoHoraExtra) => void;
  solicitacoesAjuste?: SolicitacaoAjustePonto[];
  onAddSolicitacaoAjuste?: (nova: SolicitacaoAjustePonto) => void;
  assinaturasEspelho?: AssinaturaEspelhoPonto[];
  onAddAssinaturaEspelho?: (nova: AssinaturaEspelhoPonto) => void;
  onRegistrarPonto?: () => void;
  onAddRegistroPonto?: (novo: RegistroPontoREPP) => void;
  onUpdateColaboradorBiometria?: (colabId: string, updatedFields: Partial<Colaborador>) => void;
  estabelecimentos?: Estabelecimento[];
  colaboradores?: Colaborador[];
  onOpenGuia?: () => void;
  globalThreshold?: number;
  activeTab?: PortalTabId;
  onTabChange?: (tab: PortalTabId) => void;
  openPunchTrigger?: number;
}

export const PortalColaborador: React.FC<PortalColaboradorProps> = ({
  user,
  registros,
  feriados,
  horasExtras = [],
  onAddHoraExtra,
  solicitacoesAjuste = [],
  onAddSolicitacaoAjuste,
  assinaturasEspelho = [],
  onAddAssinaturaEspelho,
  onRegistrarPonto,
  onAddRegistroPonto,
  onUpdateColaboradorBiometria,
  estabelecimentos = [],
  colaboradores = [],
  onOpenGuia,
  globalThreshold = 82.0,
  activeTab,
  onTabChange,
  openPunchTrigger = 0
}) => {
  const { supabase, authToken, session } = useAuth();
  const bearerToken = authToken || session?.access_token || '';
  const [internalTab, setInternalTab] = useState<PortalTabId>('espelho');
  const selectedTab = activeTab ?? internalTab;
  const setSelectedTab = (tab: PortalTabId) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };
  const [comprovanteModal, setComprovanteModal] = useState<RegistroPontoREPP | null>(null);
  const [viewingHoleriteModal, setViewingHoleriteModal] = useState<any | null>(null);
  const [viewingIrpfModal, setViewingIrpfModal] = useState<any | null>(null);
  const [isSigningHolerite, setIsSigningHolerite] = useState(false);
  const [holeriteOffset, setHoleriteOffset] = useState(0);
  const [hasMoreHolerites, setHasMoreHolerites] = useState(false);
  const livenessSamplesRef = React.useRef<LivenessSample[]>([]);
  const livenessScoreMeasuredRef = React.useRef<number>(92);
  const LIMIT = 10;
  const [portalNotice, setPortalNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showPortalNotice = (type: 'success' | 'error', text: string) => {
    setPortalNotice({ type, text });
    setTimeout(() => {
      setPortalNotice((prev) => (prev?.text === text ? null : prev));
    }, 6500);
  };


  const [holeritesList, setHoleritesList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`sc_holerites_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [informesIrpfList, setInformesIrpfList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`sc_informes_irpf_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // Estados do Mural Digital & Atendimento Fale com o DP/RH
  const [comunicadosList, setComunicadosList] = useState<ComunicadoEmpresa[]>(() => {
    try {
      const saved = localStorage.getItem('sc_comunicados_all');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [chamadosRhList, setChamadosRhList] = useState<ChamadoAtendimentoRh[]>(() => {
    try {
      const saved = localStorage.getItem(`sc_chamados_rh_${user.id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    try {
      const savedAll = localStorage.getItem('sc_chamados_rh_all');
      if (savedAll) {
        const parsedAll = JSON.parse(savedAll);
        const userCpfClean = (user.cpf || '').replace(/\D/g, '');
        return parsedAll.filter((t: any) => t.colaboradorId === user.id || (userCpfClean && (t.colaboradorCpf || '').replace(/\D/g, '') === userCpfClean));
      }
    } catch (_) {}
    return [];
  });

  const [isNovoChamadoModalOpen, setIsNovoChamadoModalOpen] = useState(false);
  const [novoChamadoAssunto, setNovoChamadoAssunto] = useState<AssuntoChamadoRh>('DUVIDA_HOLERITE');
  const [novoChamadoTitulo, setNovoChamadoTitulo] = useState('');
  const [novoChamadoMensagem, setNovoChamadoMensagem] = useState('');
  const [novoChamadoAnexoNome, setNovoChamadoAnexoNome] = useState('');
  const [novoChamadoAnexoUrl, setNovoChamadoAnexoUrl] = useState('');
  const [selectedUserTicket, setSelectedUserTicket] = useState<ChamadoAtendimentoRh | null>(null);
  const [respostaColabInput, setRespostaColabInput] = useState('');
  const [confirmingReadAnnId, setConfirmingReadAnnId] = useState<string | null>(null);

  React.useEffect(() => {
    const userCpfClean = (user.cpf || '').replace(/\D/g, '');
    let list: any[] = [];
    
    try {
      const savedColab = localStorage.getItem(`sc_holerites_${user.id}`);
      if (savedColab) {
        list = JSON.parse(savedColab);
      }
    } catch (_) {}

    try {
      const savedAll = localStorage.getItem('sc_holerites_all');
      if (savedAll) {
        const parsedAll = JSON.parse(savedAll);
        const userRhItems = parsedAll.filter((h: any) => {
          const hCpf = (h.colaboradorCpf || '').replace(/\D/g, '');
          return (user.id && h.colaboradorId === user.id) || (userCpfClean && hCpf === userCpfClean);
        });

        for (const item of userRhItems) {
          if (!list.some(existing => existing.id === item.id)) {
            list.unshift(item);
          }
        }
      }
    } catch (_) {}

    if (list.length > 0) {
      setHoleritesList(list);
    }

    // Carregar Informes IRPF salvos localmente
    let irpfLocal: any[] = [];
    try {
      const savedIrpfColab = localStorage.getItem(`sc_informes_irpf_${user.id}`);
      if (savedIrpfColab) {
        irpfLocal = JSON.parse(savedIrpfColab);
      }
    } catch (_) {}

    try {
      const savedIrpfAll = localStorage.getItem('sc_informes_irpf_all');
      if (savedIrpfAll) {
        const parsedIrpfAll = JSON.parse(savedIrpfAll);
        const userIrpfItems = parsedIrpfAll.filter((i: any) => {
          const iCpf = (i.colaboradorCpf || '').replace(/\D/g, '');
          return (user.id && i.colaboradorId === user.id) || (userCpfClean && iCpf === userCpfClean);
        });

        for (const item of userIrpfItems) {
          if (!irpfLocal.some(existing => existing.id === item.id)) {
            irpfLocal.unshift(item);
          }
        }
      }
    } catch (_) {}

    if (irpfLocal.length > 0) {
      setInformesIrpfList(irpfLocal);
    }

    async function fetchPortalDocuments() {
      const targetTenantId = user.tenantId || 'tenant-01';
      const targetColabId = user.id;

      if (bearerToken) {
        try {
          const url = `/api/portal-documents?tenantId=${encodeURIComponent(targetTenantId)}&collaboratorId=${encodeURIComponent(targetColabId)}&cpf=${encodeURIComponent(userCpfClean)}&limit=${LIMIT}&offset=${holeriteOffset}`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${bearerToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.success) {
              setHasMoreHolerites(Boolean(data.hasMorePaystubs));

              if (Array.isArray(data.paystubs)) {
                const mappedPay = data.paystubs.map((p: any) => ({
                  id: p.paystub_id || p.id,
                  tenantId: p.tenant_id,
                  colaboradorId: p.collaborator_id,
                  colaboradorNome: p.collaborator_name,
                  colaboradorCpf: p.collaborator_cpf,
                  mesAno: p.mes_ano,
                  competencia: p.competencia,
                  salarioBruto: Number(p.salario_bruto || 0),
                  descontos: Number(p.descontos || 0),
                  liquido: Number(p.salario_liquido || 0),
                  arquivoNome: p.arquivo_nome,
                  arquivoUrl: p.arquivo_url,
                  dataUpload: p.data_upload ? formatBrasiliaDate(p.data_upload) : formatBrasiliaDate(),
                  status: p.status,
                  observacao: p.observacao,
                  confirmadoEm: p.confirmado_em,
                  confirmadoIp: p.confirmado_ip,
                  confirmadoHash: p.confirmado_hash
                }));
                setHoleritesList(prev => {
                  const merged = [...prev];
                  for (const item of mappedPay) {
                    const idx = merged.findIndex(m => m.id === item.id);
                    if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
                    else merged.push(item);
                  }
                  return merged;
                });
              }

              if (Array.isArray(data.irpfList)) {
                const mappedIrpf = data.irpfList.map((t: any) => ({
                  id: t.report_id || t.id,
                  colaboradorId: t.collaborator_id,
                  colaboradorNome: t.collaborator_name,
                  colaboradorCpf: t.collaborator_cpf,
                  anoCalendario: t.ano_calendario,
                  exercicio: t.exercicio,
                  titulo: t.titulo || `Informe de Rendimentos IRPF - ${t.ano_calendario}`,
                  arquivoNome: t.arquivo_nome,
                  arquivoUrl: t.arquivo_url,
                  rendimentosTributaveis: t.rendimentos_tributaveis != null ? Number(t.rendimentos_tributaveis) : undefined,
                  irrfRetido: t.irrf_retido != null ? Number(t.irrf_retido) : undefined,
                  contribuicaoInss: t.contribuicao_inss != null ? Number(t.contribuicao_inss) : undefined,
                  dataUpload: t.created_at ? formatBrasiliaDate(t.created_at) : formatBrasiliaDate(),
                  status: t.status || 'PUBLICADO_RH'
                }));
                setInformesIrpfList(prev => {
                  const merged = [...prev];
                  for (const item of mappedIrpf) {
                    const idx = merged.findIndex(m => m.id === item.id);
                    if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
                    else merged.unshift(item);
                  }
                  return merged;
                });
              }

              if (Array.isArray(data.announcements)) {
                const mappedAnn = data.announcements.map((a: any) => ({
                  id: a.announcement_id || a.id,
                  tenantId: a.tenant_id,
                  titulo: a.titulo,
                  conteudo: a.conteudo,
                  categoria: a.categoria,
                  autorNome: a.autor_nome,
                  fixado: a.fixado,
                  exigeConfirmacaoLeitura: a.exige_confirmacao_leitura,
                  anexoNome: a.anexo_nome,
                  anexoUrl: a.anexo_url,
                  confirmacoesLeitura: Array.isArray(a.confirmacoes_leitura) ? a.confirmacoes_leitura : [],
                  criadoEm: a.created_at ? formatBrasiliaDate(a.created_at) : formatBrasiliaDate()
                }));
                setComunicadosList(mappedAnn);
              }

              if (Array.isArray(data.tickets)) {
                const mappedTickets = data.tickets.map((t: any) => ({
                  id: t.ticket_id || t.id,
                  tenantId: t.tenant_id,
                  colaboradorId: t.collaborator_id,
                  colaboradorNome: t.collaborator_name,
                  colaboradorCpf: t.collaborator_cpf,
                  departamentoNome: t.departamento_nome,
                  assunto: t.assunto,
                  titulo: t.titulo,
                  mensagemInicial: t.mensagem_inicial,
                  anexoNome: t.anexo_nome,
                  anexoUrl: t.anexo_url,
                  status: t.status,
                  prioridade: t.prioridade,
                  respostas: Array.isArray(t.respostas) ? t.respostas : [],
                  criadoEm: t.created_at ? formatBrasiliaDate(t.created_at) : formatBrasiliaDate(),
                  atualizadoEm: t.updated_at ? formatBrasiliaDate(t.updated_at) : formatBrasiliaDate()
                }));
                setChamadosRhList(mappedTickets);
              }

              if (Array.isArray(data.shiftSwaps)) {
                const mappedSwaps: SolicitacaoTrocaTurno[] = data.shiftSwaps.map((s: any) => ({
                  id: s.swap_id || s.id,
                  tenantId: s.tenant_id,
                  colaboradorOrigemId: s.solicitante_id,
                  colaboradorOrigemNome: s.solicitante_nome || user.nome,
                  colaboradorOrigemCpf: user.cpf,
                  colaboradorDestinoId: s.substituto_id,
                  colaboradorDestinoNome: s.substituto_nome || 'Colega',
                  colaboradorDestinoCpf: '',
                  departamentoId: user.departamentoNome || 'dep-01',
                  departamentoNome: user.departamentoNome || 'Geral',
                  dataPlantaoOrigem: s.data_turno_original,
                  dataPlantaoDestino: s.data_turno_compensacao || s.data_turno_original,
                  horarioTurno: 'Turno Escala',
                  motivo: s.motivo || '',
                  status: (s.status as any) || 'PENDENTE_SUPERVISOR',
                  validacaoInterjornadaOk: s.regra_clt_ok ?? true,
                  alertaConflito: s.alerta_conflito || undefined,
                  supervisorDecisorNome: s.supervisor_nome || undefined,
                  dataDecisao: s.data_aprovacao ? String(s.data_aprovacao).slice(0, 10) : undefined,
                  criadoEm: s.data_solicitacao ? String(s.data_solicitacao).slice(0, 10) : getBrasiliaYmd()
                }));
                setSolicitacoesTroca(mappedSwaps);
              }

              if (Array.isArray(data.vacations) && data.vacations.length > 0) {
                setMinhasFeriasAgendadas(data.vacations.map((v: any) => ({
                  id: v.id || v.vacation_id,
                  colaboradorId: v.collaborator_id,
                  colaboradorNome: v.collaborator_name,
                  colaboradorCpf: v.collaborator_cpf,
                  periodoAquisitivoInicio: v.periodo_aquisitivo_inicio,
                  periodoAquisitivoFim: v.periodo_aquisitivo_fim,
                  periodoConcessivoInicio: v.periodo_concessivo_inicio,
                  periodoConcessivoFim: v.periodo_concessivo_fim,
                  dataInicioFerias: v.data_inicio_ferias,
                  dataFimFerias: v.data_fim_ferias,
                  diasGozo: Number(v.dias_gozo),
                  diasAbonoPecuniario: Number(v.dias_abono_pecuniario),
                  status: v.status,
                  observacao: v.observacao
                })));
              }
              return;
            }
          }
        } catch {
          // Offline fallback para Supabase client se disponível
        }
      }

      // Fallback direto Supabase caso não haja token autenticado ou rede offline
      try {
        if (!supabase) return;
        const { data: payData } = await supabase
          .from('paystubs')
          .select('*')
          .range(holeriteOffset, holeriteOffset + LIMIT - 1)
          .order('created_at', { ascending: false });
        if (payData && payData.length > 0) {
          setHasMoreHolerites(payData.length >= LIMIT);
          const mapped = payData
            .filter((p: any) => {
              const pCpf = (p.collaborator_cpf || '').replace(/\D/g, '');
              return (user.id && p.collaborator_id === user.id) || (userCpfClean && pCpf === userCpfClean);
            })
            .map((p: any) => ({
              id: p.paystub_id || p.id,
              colaboradorId: p.collaborator_id,
              colaboradorNome: p.collaborator_name,
              colaboradorCpf: p.collaborator_cpf,
              mesAno: p.mes_ano,
              competencia: p.competencia,
              salarioBruto: Number(p.salario_bruto),
              descontos: Number(p.descontos),
              liquido: Number(p.salario_liquido),
              arquivoNome: p.arquivo_nome,
              arquivoUrl: p.arquivo_url,
              dataUpload: p.data_upload ? formatBrasiliaDate(p.data_upload) : formatBrasiliaDate(),
              status: p.status,
              observacao: p.observacao,
              confirmadoEm: p.confirmado_em,
              confirmadoIp: p.confirmado_ip,
              confirmadoHash: p.confirmado_hash
            }));
          setHoleritesList(prev => {
            const merged = [...prev];
            for (const item of mapped) {
              const idx = merged.findIndex(m => m.id === item.id);
              if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
              else merged.push(item);
            }
            return merged;
          });
        }
      } catch (_) {}
    }

    fetchPortalDocuments();
  }, [user.id, user.cpf, user.tenantId, supabase, bearerToken, holeriteOffset]);

  const handleConfirmReadingAnnouncement = async (ann: ComunicadoEmpresa) => {
    setConfirmingReadAnnId(ann.id);
    const timestamp = getBrasiliaParts().formatted;

    let readEntry = {
      colaboradorId: user.id,
      colaboradorCpf: user.cpf,
      colaboradorNome: user.nome,
      dataHora: timestamp,
      ip: 'Registrado no servidor'
    };

    try {
      if (bearerToken) {
        const res = await fetch('/api/read-announcement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            announcementId: ann.id,
            userCpf: user.cpf,
            userName: user.nome,
            userId: user.id
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.readEntry) readEntry = data.readEntry;
        }
      }
    } catch (_) {}

    const updatedAnn: ComunicadoEmpresa = {
      ...ann,
      confirmacoesLeitura: [...(ann.confirmacoesLeitura || []), readEntry]
    };

    const updatedList = comunicadosList.map(c => c.id === ann.id ? updatedAnn : c);
    setComunicadosList(updatedList);
    localStorage.setItem('sc_comunicados_all', JSON.stringify(updatedList));

    setConfirmingReadAnnId(null);
    showPortalNotice('success', `Leitura do comunicado "${ann.titulo}" confirmada às ${readEntry.dataHora}.`);
  };

  const handleCreateTicket = async () => {
    if (!novoChamadoTitulo.trim() || !novoChamadoMensagem.trim()) {
      showPortalNotice('error', 'Informe o título e os detalhes da solicitação antes de enviar.');
      return;
    }

    const nowFormatted = getBrasiliaParts().formatted;
    const ticketId = `ticket-${Date.now()}`;
    const tenantIdTarget = userColab?.tenantId || user.tenantId || 'tenant-01';
    const novo: ChamadoAtendimentoRh = {
      id: ticketId,
      tenantId: tenantIdTarget,
      colaboradorId: userColab?.id || user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      departamentoNome: userColab?.departamentoNome || user.departamentoNome || 'Geral',
      assunto: novoChamadoAssunto,
      titulo: novoChamadoTitulo.trim(),
      mensagemInicial: novoChamadoMensagem.trim(),
      anexoNome: novoChamadoAnexoNome || undefined,
      anexoUrl: novoChamadoAnexoUrl || undefined,
      status: 'ABERTO',
      prioridade: 'MEDIA',
      respostas: [],
      criadoEm: nowFormatted,
      atualizadoEm: nowFormatted
    };

    const updatedList = [novo, ...chamadosRhList];
    setChamadosRhList(updatedList);
    localStorage.setItem(`sc_chamados_rh_${user.id}`, JSON.stringify(updatedList));

    try {
      const savedAll = localStorage.getItem('sc_chamados_rh_all');
      const all = savedAll ? JSON.parse(savedAll) : [];
      localStorage.setItem('sc_chamados_rh_all', JSON.stringify([novo, ...all]));
    } catch (_) {}

    try {
      if (bearerToken) {
        await fetch('/api/save-ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            id: novo.id,
            tenantId: novo.tenantId,
            collaboratorId: novo.colaboradorId,
            collaboratorCpf: novo.colaboradorCpf,
            collaboratorName: novo.colaboradorNome,
            departamentoNome: novo.departamentoNome,
            assunto: novo.assunto,
            titulo: novo.titulo,
            mensagemInicial: novo.mensagemInicial,
            anexoNome: novo.anexoNome,
            anexoUrl: novo.anexoUrl,
            prioridade: novo.prioridade
          })
        });
      }
    } catch (_) {}

    setIsNovoChamadoModalOpen(false);
    setNovoChamadoTitulo('');
    setNovoChamadoMensagem('');
    setNovoChamadoAnexoNome('');
    setNovoChamadoAnexoUrl('');
    setSelectedUserTicket(novo);
    showPortalNotice('success', 'Chamado enviado com sucesso para a equipe de RH/DP.');
  };

  const handleSendUserReplyTicket = async (ticket: ChamadoAtendimentoRh) => {
    if (!respostaColabInput.trim()) return;
    const nowFormatted = getBrasiliaParts().formatted;

    const novaResposta = {
      id: `resp-${Date.now()}`,
      autorId: user.id,
      autorNome: `${user.nome} (Você)`,
      eDoRh: false,
      mensagem: respostaColabInput.trim(),
      dataHora: nowFormatted
    };

    const updatedTicket: ChamadoAtendimentoRh = {
      ...ticket,
      respostas: [...ticket.respostas, novaResposta],
      atualizadoEm: nowFormatted
    };

    const updatedList = chamadosRhList.map(t => t.id === ticket.id ? updatedTicket : t);
    setChamadosRhList(updatedList);
    localStorage.setItem(`sc_chamados_rh_${user.id}`, JSON.stringify(updatedList));

    try {
      const savedAll = localStorage.getItem('sc_chamados_rh_all');
      if (savedAll) {
        const all = JSON.parse(savedAll);
        const updatedAll = all.map((t: any) => t.id === ticket.id ? updatedTicket : t);
        localStorage.setItem('sc_chamados_rh_all', JSON.stringify(updatedAll));
      }
    } catch (_) {}

    setSelectedUserTicket(updatedTicket);
    setRespostaColabInput('');

    try {
      if (bearerToken) {
        await fetch('/api/save-ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            id: ticket.id,
            tenantId: ticket.tenantId || userColab?.tenantId || user.tenantId || 'tenant-01',
            resposta: novaResposta
          })
        });
      }
    } catch (_) {}
  };

  const handleConfirmHoleriteReceipt = async (holerite: any) => {
    if (!bearerToken) {
      showPortalNotice('error', 'Sessão autenticada expirada. Faça login novamente para assinar o recibo.');
      return;
    }
    setIsSigningHolerite(true);
    try {
      const resp = await fetch('/api/confirm-holerite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify({
          paystubId: holerite.id,
          tenantId: holerite.tenantId || userColab?.tenantId || user.tenantId || 'tenant-01',
          colaboradorId: userColab?.id || user.id
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        const timestamp = data.confirmadoEm;
        const ip = data.confirmadoIp;
        const hash = data.confirmadoHash;

        const updatedHolerite = {
          ...holerite,
          confirmadoEm: timestamp,
          confirmadoIp: ip,
          confirmadoHash: hash,
          status: 'CONFIRMADO_PELO_COLABORADOR'
        };

        const updatedList = holeritesList.map(h => h.id === holerite.id ? updatedHolerite : h);
        setHoleritesList(updatedList);
        localStorage.setItem(`sc_holerites_${user.id}`, JSON.stringify(updatedList));

        try {
          const savedAll = localStorage.getItem('sc_holerites_all');
          if (savedAll) {
            const parsedAll = JSON.parse(savedAll);
            const updatedAll = parsedAll.map((h: any) => h.id === holerite.id ? updatedHolerite : h);
            localStorage.setItem('sc_holerites_all', JSON.stringify(updatedAll));
          }
        } catch (_) {}

        setViewingHoleriteModal(updatedHolerite);
        showPortalNotice('success', `Recibo do contracheque assinado (CLT Art. 464). Hash: ${String(hash).slice(0, 16)}...`);
      } else {
        showPortalNotice('error', `Erro ao assinar recibo: ${data.error || 'Falha no servidor'}`);
      }
    } catch (err) {
      console.error(err);
      showPortalNotice('error', 'Erro de conexão ao assinar recibo digital.');
    } finally {
      setIsSigningHolerite(false);
    }
  };

  // Estados de Troca de Turno / Plantão (Gestão de Pares)
  const [solicitacoesTroca, setSolicitacoesTroca] = useState<SolicitacaoTrocaTurno[]>([]);
  const [isNovaTrocaModalOpen, setIsNovaTrocaModalOpen] = useState(false);
  const [trocaColegaId, setTrocaColegaId] = useState('');
  const [trocaDataOrigem, setTrocaDataOrigem] = useState(() => getBrasiliaYmd());
  const [trocaDataDestino, setTrocaDataDestino] = useState(() => getBrasiliaYmd());
  const [trocaHorarioTurno, setTrocaHorarioTurno] = useState('08:00 às 17:00');
  const [trocaMotivo, setTrocaMotivo] = useState('');
  const [trocaFeedback, setTrocaFeedback] = useState<string | null>(null);

  // =========================================================================
  // RELÓGIO OFICIAL DE BRASÍLIA EM TEMPO REAL & REGRA DE ANTECEDÊNCIA
  // =========================================================================
  const [nowClock, setNowClock] = useState<Date>(() => getBrasiliaNow());
  React.useEffect(() => {
    const timer = setInterval(() => setNowClock(getBrasiliaNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userColab = colaboradores.find(
    (c) => c.id === user.id || c.cpf.replace(/\D/g, '') === user.cpf.replace(/\D/g, '')
  );
  const myAllocatedEst: Estabelecimento =
    estabelecimentos.find((e) => e.id === userColab?.estabelecimentoId) ||
    estabelecimentos.find((e) => e.tenantId === (userColab?.tenantId || user.tenantId)) ||
    estabelecimentos[0] || {
      id: 'est-default',
      tenantId: userColab?.tenantId || user.tenantId || 'tenant-01',
      codigo: '0001',
      nome: userColab?.estabelecimentoNome || 'Unidade Principal',
      cnpj: '',
      tipo: 'MATRIZ' as const,
      fusoHorario: 'America/Sao_Paulo',
      latitude: Number.NaN,
      longitude: Number.NaN,
      cercaRaioMetros: 100,
      uf: 'SP',
      municipio: 'São Paulo',
      bloquearForaDoRaio: true
    };
  const horarioInicioStr = userColab?.horarioInicio || '08:00';
  const horarioFimStr = userColab?.horarioFim || '17:00';
  const maxAntecedenciaMin = userColab?.maxMinutosAntecedenciaPermitido ?? 15;
  const regraAntecedenciaAtiva = userColab?.regraAntecedenciaAtiva ?? true;
  const hasEnrolledBiometry = hasRealBiometricTemplate(userColab);

  // Consulta real de férias agendadas para este colaborador (via LocalStorage e Supabase)
  const [minhasFeriasAgendadas, setMinhasFeriasAgendadas] = useState<any[]>([]);

  React.useEffect(() => {
    const userCpfClean = user.cpf.replace(/\D/g, '');
    let feriasLocais: any[] = [];
    try {
      const raw = localStorage.getItem('sc_programacao_ferias');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          feriasLocais = parsed.filter((f: any) => {
            const fCpf = (f.colaboradorCpf || '').replace(/\D/g, '');
            const fId = f.colaboradorId || '';
            // Ignorar dados de demonstração
            if (fCpf === '12345678900' || fCpf === '99988877766') return false;
            return (userCpfClean && fCpf === userCpfClean) || (userColab?.id && fId === userColab.id);
          });
        }
      }
    } catch (_) {}

    setMinhasFeriasAgendadas(feriasLocais);

    async function loadVacationsFromDb() {
      if (bearerToken) return;
      try {
        if (supabase) {
          const { data } = await supabase
            .from('vacations')
            .select('*');
          if (data && data.length > 0) {
            const mapped = data
              .filter((v: any) => {
                const vCpf = (v.collaborator_cpf || '').replace(/\D/g, '');
                const vId = v.collaborator_id || '';
                if (vCpf === '12345678900' || vCpf === '99988877766') return false;
                return (userCpfClean && vCpf === userCpfClean) || (userColab?.id && vId === userColab.id);
              })
              .map((v: any) => ({
                id: v.id,
                colaboradorId: v.collaborator_id,
                colaboradorNome: v.collaborator_name,
                colaboradorCpf: v.collaborator_cpf,
                periodoAquisitivoInicio: v.periodo_aquisitivo_inicio,
                periodoAquisitivoFim: v.periodo_aquisitivo_fim,
                periodoConcessivoInicio: v.periodo_concessivo_inicio,
                periodoConcessivoFim: v.periodo_concessivo_fim,
                dataInicioFerias: v.data_inicio_ferias,
                dataFimFerias: v.data_fim_ferias,
                diasGozo: Number(v.dias_gozo),
                diasAbonoPecuniario: Number(v.dias_abono_pecuniario),
                status: v.status,
                observacao: v.observacao
              }));
            if (mapped.length > 0) {
              setMinhasFeriasAgendadas(mapped);
            }
          }
        }
      } catch (_) {}
    }
    loadVacationsFromDb();
  }, [user.cpf, user.id, userColab?.id, supabase, bearerToken]);

  // Registros do colaborador logado (Garantia de isolamento de dados)
  const userCpfDigits = user.cpf.replace(/\D/g, '');
  const meusRegistros = registros.filter(
    (r) => r.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  const nowParts = getBrasiliaParts(nowClock);
  const hojeStr = nowParts.ymd;
  const mesAnoAtual = nowParts.mesAno;
  const mesAnoLabel = getMonthLabelPtBr(mesAnoAtual);
  const batidasHoje = meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === hojeStr);
  const isFirstPunchToday = batidasHoje.length === 0;

  // Cálculo de permissão de batida no Horário Oficial de Brasília
  const [startH, startM] = horarioInicioStr.split(':').map(Number);
  const shiftStartTotalMinutes = startH * 60 + startM;
  const allowedStartTotalMinutes = shiftStartTotalMinutes - maxAntecedenciaMin;
  const allowedEndTotalMinutes = shiftStartTotalMinutes + 60;
  const currentTotalMinutes = getBrasiliaMinutesOfDay(nowClock);
  const currentTotalSeconds = currentTotalMinutes * 60 + nowParts.second;

  const allowedStartMinutesDay = (shiftStartTotalMinutes - maxAntecedenciaMin + 1440) % 1440;
  const allowedEndMinutesDay = (shiftStartTotalMinutes + 60 + 1440) % 1440;

  const startHH = String(Math.floor(allowedStartMinutesDay / 60)).padStart(2, '0');
  const startMM = String(allowedStartMinutesDay % 60).padStart(2, '0');
  const endHH = String(Math.floor(allowedEndMinutesDay / 60)).padStart(2, '0');
  const endMM = String(allowedEndMinutesDay % 60).padStart(2, '0');

  const allowedTimeFormatted = `${startHH}:${startMM} às ${endHH}:${endMM}`;

  const formatCountdown = (totalSecs: number) => {
    if (totalSecs <= 0) return '00:00:00';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const dayOfWeek = getBrasiliaDayOfWeek(nowClock);
  const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const diaAtualNome = diasNomes[dayOfWeek];

  // Determina folga considerando exceções anuais, paridade 12x36 e folga semanal fixa
  let isHojeDiaFolga = false;
  if (userColab?.anualFolgas && Object.prototype.hasOwnProperty.call(userColab.anualFolgas, hojeStr)) {
    isHojeDiaFolga = Boolean(userColab.anualFolgas[hojeStr]);
  } else if (userColab?.tipoEscala === '12x36') {
    const [yy, mm, dd] = hojeStr.split('-').map(Number);
    const diffDays = Math.floor((Date.UTC(yy, mm - 1, dd) - Date.UTC(2026, 0, 1)) / (1000 * 60 * 60 * 24));
    const isPar = Math.abs(diffDays) % 2 === 0;
    const trabalhaHoje = (userColab.turmaEscala || 'A') === 'A' ? isPar : !isPar;
    isHojeDiaFolga = !trabalhaHoje;
  } else {
    const defaultFolgas = userColab?.tipoEscala === '6x1' ? [0] : (userColab?.tipoEscala === '5x2' ? [0, 6] : []);
    const diasFolgaEscala = userColab?.diasFolgaSemana ?? defaultFolgas;
    isHojeDiaFolga = diasFolgaEscala.includes(dayOfWeek);
  }

  let isPunchAllowed = true;
  let punchBlockReason = '';
  let secondsRemaining = 0;

  if (isFirstPunchToday && regraAntecedenciaAtiva) {
    if (isHojeDiaFolga) {
      isPunchAllowed = false;
      punchBlockReason = `Hoje (${diaAtualNome}) é seu dia de folga escalado na empresa. Marcação de entrada bloqueada.`;
    } else if (currentTotalMinutes < allowedStartTotalMinutes) {
      isPunchAllowed = false;
      secondsRemaining = (allowedStartTotalMinutes * 60) - currentTotalSeconds;
      punchBlockReason = `Entrada liberada apenas das ${startHH}:${startMM} às ${endHH}:${endMM} (15 min antes até 1h depois do início às ${horarioInicioStr}). Faltam ${formatCountdown(secondsRemaining)}.`;
    } else if (currentTotalMinutes > allowedEndTotalMinutes) {
      isPunchAllowed = false;
      punchBlockReason = `Janela de entrada encerrada às ${endHH}:${endMM} (1 hora após o início das ${horarioInicioStr}). Solicite autorização ao supervisor.`;
    }
  }

  const formattedLiveClock = formatBrasiliaTime(nowClock, true);

  // =========================================================================
  // ESTADOS DO REGISTRO DE PONTO INDIVIDUAL & AUTO-CADASTRO FACIAL
  // =========================================================================
  const [isBaterPontoModalOpen, setIsBaterPontoModalOpen] = useState(false);
  const [tipoPonto, setTipoPonto] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('ENTRADA');
  const [cameraActive, setCameraActive] = useState(false);
  const [bioState, setBioState] = useState<'idle' | 'detecting' | 'verified' | 'rejected'>('idle');
  const [bioMsg, setBioMsg] = useState('Posicione seu rosto de frente para a câmera frontal...');
  const [bioSimilarity, setBioSimilarity] = useState<number>(0);
  const [bioProgress, setBioProgress] = useState<number>(0);
  const [currentLiveness, setCurrentLiveness] = useState<LivenessChallenge | null>(null);
  const [livenessConfirmed, setLivenessConfirmed] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; dist: number; dentroCerca: boolean; endereco: string } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pontoModalError, setPontoModalError] = useState<string | null>(null);
  const [isSubmittingPunch, setIsSubmittingPunch] = useState(false);
  const [pontoSucessoMsg, setPontoSucessoMsg] = useState<string | null>(null);

  // Modal de Auto-Cadastro Facial pelo Próprio Colaborador
  const [isEnrollFaceModalOpen, setIsEnrollFaceModalOpen] = useState(false);
  const [isEnrollingFace, setIsEnrollingFace] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStatusMsg, setEnrollStatusMsg] = useState('Posicione seu rosto no centro da câmera para cadastrar sua biometria.');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const enrollVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const enrollCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Validação por Token / PIN (Estrito ao 1º dia / contingência autorizada)
  const [authMethod, setAuthMethod] = useState<'FACIAL' | 'TOKEN_PIN'>('FACIAL');
  const [tokenPinInput, setTokenPinInput] = useState<string>('');
  const [tokenValidated, setTokenValidated] = useState<boolean>(false);
  const [tokenErrorMsg, setTokenErrorMsg] = useState<string | null>(null);

  const handleValidateTokenPin = async () => {
    setTokenErrorMsg(null);
    const pinClean = tokenPinInput.trim();
    if (!pinClean) {
      setTokenErrorMsg('Digite o PIN ou Token de validação informado pelo RH.');
      return;
    }

    const eligibility = checkPinUsageEligibility(userColab, meusRegistros);
    if (!eligibility.isEligible) {
      setTokenErrorMsg(`Acesso por PIN/Token Expirado! ${eligibility.reason}`);
      return;
    }

    if (navigator.onLine && bearerToken) {
      try {
        const res = await fetch('/api/verify-pin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            tenantId: userColab?.tenantId || user.tenantId || 'tenant-01',
            collaboratorId: userColab?.id || user.id,
            pin: pinClean
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.valid) {
          setTokenValidated(true);
          setBioState('verified');
          setBioMsg('Autenticado via PIN/Token corporativo (1º dia de trabalho).');
          return;
        }
        setTokenErrorMsg(data.error || 'PIN/Token incorreto. Verifique o código informado pelo RH e tente novamente.');
        return;
      } catch {
        // Fallback offline se desconectado
      }
    }

    const expectedPin = userColab?.pinColetor?.trim();
    if (!expectedPin) {
      setTokenErrorMsg('Nenhum PIN de contingência disponível offline. Conecte-se à internet ou cadastre sua face.');
      return;
    }

    if (pinClean === expectedPin) {
      setTokenValidated(true);
      setBioState('verified');
      setBioMsg('Autenticado via PIN/Token corporativo (1º dia de trabalho).');
    } else {
      setTokenErrorMsg('PIN/Token incorreto. Verifique o código informado pelo RH e tente novamente.');
    }
  };

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const bioCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isModalOpenRef = React.useRef<boolean>(false);
  isModalOpenRef.current = isBaterPontoModalOpen;
  const countdownStartedRef = React.useRef<boolean>(false);

  // Modal Solicitar Horas Extras
  const [isNovaHeModalOpen, setIsNovaHeModalOpen] = useState(false);
  const [minutosHeInput, setMinutosHeInput] = useState(120);
  const [tipoHeInput, setTipoHeInput] = useState<'NORMAL_50' | 'FERIADO_100'>('NORMAL_50');
  const [justificativaInput, setJustificativaInput] = useState('');
  const [dataHeInput, setDataHeInput] = useState(() => getBrasiliaYmd());
  const [heFormError, setHeFormError] = useState<string | null>(null);

  // Modal Solicitar Ajuste de Ponto / Atestado Médico
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [ajusteTipoInput, setAjusteTipoInput] = useState<'INCLUSAO_PONTO_ESQUECIDO' | 'ATESTADO_MEDICO' | 'JUSTIFICATIVA_CORRECAO'>('ATESTADO_MEDICO');
  const [ajusteDataInput, setAjusteDataInput] = useState(() => getBrasiliaYmd());
  const [ajusteHorarioInput, setAjusteHorarioInput] = useState('08:00');
  const [ajusteTipoMarcacaoInput, setAjusteTipoMarcacaoInput] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('ENTRADA');
  const [ajusteCidInput, setAjusteCidInput] = useState('');
  const [ajusteDocInput, setAjusteDocInput] = useState('');
  const [ajusteAnexoUrl, setAjusteAnexoUrl] = useState('');
  const [ajusteJustificativaInput, setAjusteJustificativaInput] = useState('');
  const [ajusteFormError, setAjusteFormError] = useState<string | null>(null);

  // Estado da Assinatura Digital do Espelho
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureSuccessMsg, setSignatureSuccessMsg] = useState<string | null>(null);
  const [biometricCountdown, setBiometricCountdown] = useState<number | null>(null);

  // Solicitações de H.E. do colaborador logado
  const minhasHorasExtras = horasExtras.filter(
    (h) => h.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  // Gestor da Equipe
  const gestorEquipeNome = userColab?.gestorNome || (user.departamentoNome === 'Recursos Humanos'
    ? 'Coordenação de RH'
    : 'Gestor Imediato da Equipe');
  const gestorEquipeEmail = user.departamentoNome === 'Recursos Humanos'
    ? 'rh@empresa.com.br'
    : 'gestor@empresa.com.br';

  const handleCriarSolicitacaoHe = () => {
    setHeFormError(null);
    if (!justificativaInput.trim()) {
      setHeFormError('Informe a justificativa operacional da hora extra.');
      return;
    }

    const horas = Math.floor(minutosHeInput / 60);
    const mins = minutosHeInput % 60;
    const formatada = `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;

    const nova: SolicitacaoHoraExtra = {
      id: `he-${Date.now()}`,
      tenantId: userColab?.tenantId || user.tenantId,
      colaboradorId: userColab?.id || user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      departamentoId: userColab?.departamentoId || 'dep-01',
      departamentoNome: userColab?.departamentoNome || user.departamentoNome || 'Geral',
      gestorId: userColab?.gestorId || 'gestor-01',
      gestorNome: gestorEquipeNome,
      data: dataHeInput,
      horarioContratado: `${horarioInicioStr} às ${horarioFimStr}`,
      horarioRealizado: `${horarioInicioStr} às ${String(Math.min(23, Number(horarioFimStr.split(':')[0] || 17) + horas)).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
      minutosExtras: minutosHeInput,
      horasExtrasFormatadas: formatada,
      tipoHoraExtra: tipoHeInput,
      justificativa: justificativaInput.trim(),
      status: 'PENDENTE'
    };

    onAddHoraExtra?.(nova);
    setIsNovaHeModalOpen(false);
    setJustificativaInput('');
    setMinutosHeInput(120);
    showPortalNotice('success', 'Solicitação de hora extra enviada para aprovação do gestor.');
  };

  // Solicitações de Ajuste / Atestado do colaborador logado
  const minhasSolicitacoesAjuste = solicitacoesAjuste.filter(
    (s) => s.colaboradorCpf.replace(/\D/g, '') === userCpfDigits
  );

  // Assinatura do Espelho do mês atual do colaborador
  const minhaAssinaturaMesAtual = assinaturasEspelho.find(
    (a) => (a.colaboradorId === user.id || (userColab && a.colaboradorId === userColab.id) || (a.colaboradorCpf && a.colaboradorCpf.replace(/\D/g, '') === userCpfDigits)) && a.mesAno === mesAnoAtual
  );

  // Submeter Novo Ajuste / Atestado
  const handleCriarSolicitacaoAjuste = () => {
    setAjusteFormError(null);
    if (!ajusteJustificativaInput.trim()) {
      setAjusteFormError('Por favor, informe a justificativa da solicitação.');
      return;
    }

    const nova: SolicitacaoAjustePonto = {
      id: `ajuste-${Date.now()}`,
      tenantId: userColab?.tenantId || user.tenantId,
      colaboradorId: userColab?.id || user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      departamentoId: userColab?.departamentoId || 'dep-01',
      departamentoNome: userColab?.departamentoNome || user.departamentoNome || 'Geral',
      gestorId: userColab?.gestorId || 'gestor-01',
      gestorNome: gestorEquipeNome,
      data: ajusteDataInput,
      tipo: ajusteTipoInput,
      horarioAjuste: ajusteTipoInput !== 'ATESTADO_MEDICO' ? ajusteHorarioInput : undefined,
      tipoMarcacaoAjuste: ajusteTipoInput !== 'ATESTADO_MEDICO' ? ajusteTipoMarcacaoInput : undefined,
      cid10: ajusteCidInput ? `CID ${ajusteCidInput}` : undefined,
      nomeDocumentoAnexo: ajusteDocInput || (ajusteTipoInput === 'ATESTADO_MEDICO' ? 'atestado_medico.pdf' : undefined),
      anexoUrl: ajusteAnexoUrl || undefined,
      dataHoraEnvio: getBrasiliaParts().formatted,
      justificativa: ajusteJustificativaInput.trim(),
      status: 'PENDENTE'
    };

    onAddSolicitacaoAjuste?.(nova);
    setIsAjusteModalOpen(false);
    setAjusteJustificativaInput('');
    setAjusteCidInput('');
    setAjusteDocInput('');
    setAjusteAnexoUrl('');
    showPortalNotice('success', 'Solicitação de ajuste/atestado enviada para análise do RH.');
  };

  // Funções de Desenho para Assinatura Eletrônica no Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmAssinaturaDigital = () => {
    const canvas = canvasRef.current;
    const rubricaUrl = canvas ? canvas.toDataURL() : undefined;

    const parts = getBrasiliaParts();
    const mesCompact = mesAnoAtual.replace('-', '');
    const hash = `sha256_espelho_ponto_${user.cpf.replace(/\D/g, '')}_${mesCompact}_${Date.now().toString(16)}`;

    const novaAssinatura: AssinaturaEspelhoPonto = {
      id: `ass-${Date.now()}`,
      tenantId: userColab?.tenantId || user.tenantId,
      colaboradorId: userColab?.id || user.id,
      colaboradorNome: user.nome,
      colaboradorCpf: user.cpf,
      mesAno: mesAnoAtual,
      dataHoraAssinatura: parts.iso,
      hashAssinaturaSha256: hash,
      ipAddress: 'Registrado no Servidor',
      dispositivoInfo: `${navigator.userAgent.slice(0, 45)}... (Portal PTRP)`,
      rubricaDataUrl: rubricaUrl,
      status: 'ASSINADO'
    };

    onAddAssinaturaEspelho?.(novaAssinatura);
    setSignatureSuccessMsg(`Espelho de ponto (${mesAnoLabel}) assinado eletronicamente! Hash: ${hash.slice(0, 20)}...`);
    setTimeout(() => setSignatureSuccessMsg(null), 6000);
  };

  // =========================================================================
  // HANDLERS: AUTO-CADASTRO FACIAL DO COLABORADOR
  // =========================================================================
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (isEnrollFaceModalOpen) {
      setEnrollError(null);
      setEnrollProgress(0);
      setEnrollStatusMsg('Posicione seu rosto no centro da câmera frontal em local bem iluminado.');
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (enrollVideoRef.current) {
            enrollVideoRef.current.srcObject = s;
            enrollVideoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEnrollError('Não foi possível acessar a câmera frontal. Verifique as permissões do navegador.');
          }
        });
    } else if (enrollVideoRef.current && enrollVideoRef.current.srcObject) {
      const tracks = (enrollVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      enrollVideoRef.current.srcObject = null;
    }
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [isEnrollFaceModalOpen]);

  const handleEnrollOwnFace = async () => {
    if (!enrollVideoRef.current || !enrollCanvasRef.current) return;
    setIsEnrollingFace(true);
    setEnrollError(null);
    setEnrollProgress(5);
    setEnrollStatusMsg('Iniciando captura multi-quadro da sua biometria facial...');

    const targetId = userColab?.id || user.id;
    const tenantIdTarget = userColab?.tenantId || user.tenantId || 'tenant-01';
    const collected: number[][] = [];
    let lastFail = 'Mantenha seu rosto centralizado em frente à câmera.';

    try {
      for (let i = 0; i < 8; i++) {
        if (!enrollVideoRef.current || !enrollCanvasRef.current) break;
        const pct = Math.min(90, 10 + Math.round(((i + 1) / 8) * 80));
        setEnrollProgress(pct);
        setEnrollStatusMsg(`Capturando amostra facial ${i + 1} de 8...`);

        const result = await detectFaceAndBiometrics(enrollVideoRef.current, enrollCanvasRef.current);
        if (result.detected && result.vector) {
          collected.push(result.vector);
        } else if (result.statusMessage) {
          lastFail = result.statusMessage;
        }
        if (i < 7) await new Promise((r) => setTimeout(r, 380));
      }

      if (collected.length < 4) {
        setEnrollProgress(0);
        setEnrollError(`${lastFail} (Amostras válidas: ${collected.length}/8). Tente melhorar a iluminação.`);
        return;
      }

      const averagedVector = averageBiometricDescriptors(collected);
      const localTemplate = saveBiometricTemplate(targetId, averagedVector);

      setEnrollProgress(95);
      setEnrollStatusMsg('Salvando template criptografado (AES-256 / LGPD) no servidor...');

      let finalTemplate = localTemplate;
      if (bearerToken) {
        const res = await fetch('/api/save-biometric', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            collaboratorId: targetId,
            tenantId: tenantIdTarget,
            encryptedTemplate: localTemplate,
            vector: averagedVector
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Falha ao salvar template facial no servidor.');
        }
        const resJson = await res.json();
        if (resJson.template) finalTemplate = resJson.template;
      } else if (supabase) {
        await supabase.from('collaborators').update({
          biometria_cadastrada: true,
          biometric_template: localTemplate,
          updated_at: getBrasiliaParts().iso
        }).eq('collaborator_id', targetId);
      }

      onUpdateColaboradorBiometria?.(targetId, {
        biometriaCadastrada: true,
        biometriaHashTemplate: finalTemplate
      });

      setEnrollProgress(100);
      setEnrollStatusMsg('Biometria facial cadastrada com sucesso!');
      setTimeout(() => {
        setIsEnrollFaceModalOpen(false);
        showPortalNotice('success', 'Sua foto/biometria facial foi cadastrada e já está ativa para registro de ponto.');
      }, 900);
    } catch (err: any) {
      setEnrollProgress(0);
      setEnrollError(err?.message || 'Erro ao cadastrar biometria facial.');
    } finally {
      setIsEnrollingFace(false);
    }
  };

  // =========================================================================
  // HANDLERS: REGISTRO DE PONTO INDIVIDUAL (MOBILE / HOME OFFICE)
  // =========================================================================
  const handleOpenPersonalPunch = () => {
    const hojeAtualStr = getBrasiliaYmd();
    const batidasDia = meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === hojeAtualStr);
    let proximoTipo: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' = 'ENTRADA';
    if (batidasDia.length === 1) proximoTipo = 'INTERVALO_INICIO';
    else if (batidasDia.length === 2) proximoTipo = 'INTERVALO_FIM';
    else if (batidasDia.length >= 3) proximoTipo = 'SAIDA';

    setTipoPonto(proximoTipo);
    setPontoModalError(null);
    setGpsError(null);
    setGpsData(null);
    setIsBaterPontoModalOpen(true);
    setBioState('idle');
    setBioProgress(0);
    setLivenessConfirmed(false);
    livenessSamplesRef.current = [];
    livenessScoreMeasuredRef.current = 92;
    setTokenValidated(false);
    setTokenErrorMsg(null);
    setBiometricCountdown(null);
    countdownStartedRef.current = false;
    setCurrentLiveness(getRandomLivenessChallenge());
    setBioMsg(
      hasEnrolledBiometry
        ? 'Enquadre seu rosto para validação biométrica e prova de vida...'
        : 'Face ainda não cadastrada. Cadastre sua face ou utilize o PIN (1º dia).'
    );

    // Captura GPS em tempo real (Sem fallback simulado!)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const est = myAllocatedEst;
          const hasEstCoords = typeof est.latitude === 'number' && Number.isFinite(est.latitude) && typeof est.longitude === 'number' && Number.isFinite(est.longitude);
          const dist = hasEstCoords ? calculateDistanceMeters(lat, lng, est.latitude, est.longitude) : 0;
          const dentro = !hasEstCoords || dist <= (est.cercaRaioMetros || 100);
          setGpsData({
            lat,
            lng,
            dist,
            dentroCerca: dentro,
            endereco: hasEstCoords
              ? `Lat ${lat.toFixed(4)}, Long ${lng.toFixed(4)} · ${est.nome} (${dentro ? 'Dentro da Cerca' : `Fora do raio: ${dist}m`})`
              : `Lat ${lat.toFixed(4)}, Long ${lng.toFixed(4)} · GPS Confirmado`
          });
          setGpsLoading(false);
        },
        () => {
          setGpsData(null);
          setGpsError('Não foi possível obter sua localização GPS. Ative o GPS nas permissões do navegador.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
      );
    } else {
      setGpsError('Geolocalização não suportada neste dispositivo/navegador.');
    }
  };

  const lastPunchTriggerRef = React.useRef<number>(openPunchTrigger);
  React.useEffect(() => {
    if (openPunchTrigger > 0 && openPunchTrigger !== lastPunchTriggerRef.current) {
      lastPunchTriggerRef.current = openPunchTrigger;
      if (batidasHoje.length >= 4) {
        showPortalNotice('error', 'Sua carga horária diária já foi encerrada (4 marcações registradas).');
      } else if (!isPunchAllowed) {
        showPortalNotice('error', `Bloqueio de Horário: ${punchBlockReason}`);
      } else {
        handleOpenPersonalPunch();
      }
    }
  }, [openPunchTrigger]);

  // Efeito de Contador Regressivo Biométrico (3 segundos)
  React.useEffect(() => {
    let timer: any;
    if (biometricCountdown !== null && biometricCountdown > 0) {
      timer = setTimeout(() => setBiometricCountdown(biometricCountdown - 1), 1000);
    } else if (biometricCountdown === 0) {
      setBiometricCountdown(null);
      if (authMethod === 'FACIAL') {
        if (currentLiveness && !livenessConfirmed) {
          setBioMsg(`Prova de vida: execute "${currentLiveness.actionPrompt}" e toque em "Confirmar que realizei a ação".`);
        } else {
          handleValidateFace(true);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [biometricCountdown, authMethod, currentLiveness, livenessConfirmed]);

  // Ciclo da Câmera Frontal (Selfie)
  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (isBaterPontoModalOpen) {
      setCameraActive(true);
      resetLivenessState();
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        .then((s) => {
          if (cancelled) {
            s.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn('Câmera indisponível:', err);
          setCameraActive(false);
          setBioMsg('Câmera frontal indisponível ou permissão não concedida.');
        });
    } else {
      setCameraActive(false);
      countdownStartedRef.current = false;
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isBaterPontoModalOpen]);

  // Captura contínua de quadros durante o desafio de Prova de Vida Ativa no Portal
  React.useEffect(() => {
    if (!isBaterPontoModalOpen || !cameraActive || authMethod !== 'FACIAL' || livenessConfirmed) return;
    let busy = false;
    const timer = setInterval(async () => {
      if (busy || !videoRef.current || !bioCanvasRef.current) return;
      if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) return;
      busy = true;
      try {
        const res = await detectFaceAndBiometrics(videoRef.current, bioCanvasRef.current);
        if (res.detected && res.vector) {
          livenessSamplesRef.current.push({
            landmarks: res.landmarks,
            faceBox: res.faceBox,
            vector: res.vector,
            livenessScore: res.livenessScore
          });
          if (livenessSamplesRef.current.length > 24) {
            livenessSamplesRef.current.shift();
          }
        }
      } catch {
        // ignore frame error
      } finally {
        busy = false;
      }
    }, 300);
    return () => clearInterval(timer);
  }, [isBaterPontoModalOpen, cameraActive, authMethod, livenessConfirmed]);

  // Validação Biométrica Facial Individual (Multi-Frame ~6.0s)
  const handleValidateFace = async (skipLivenessCheck = false) => {
    if (!videoRef.current || !bioCanvasRef.current) return;
    if (!hasEnrolledBiometry) {
      setBioState('rejected');
      setBioMsg('Você ainda não possui face cadastrada. Clique em "Cadastrar Minha Face Agora" abaixo.');
      return;
    }
    if (!skipLivenessCheck && currentLiveness && !livenessConfirmed) {
      setBioMsg(`Realize a prova de vida solicitada ("${currentLiveness.actionPrompt}") e clique em "Confirmar que realizei a ação".`);
      return;
    }

    setBioState('detecting');
    setBioProgress(5);
    resetLivenessState();
    setBioMsg('Estabilizando iluminação e enquadramento...');

    const collectedVectors: number[][] = [];
    let lastFailReason = 'Rosto não detectado no enquadramento. Centralize seu rosto em frente à câmera.';
    const totalSamples = 12;

    try {
      for (let i = 0; i < totalSamples; i++) {
        if (!isModalOpenRef.current || !videoRef.current || !bioCanvasRef.current) {
          return;
        }

        const pct = Math.min(95, 8 + Math.round(((i + 1) / totalSamples) * 87));
        setBioProgress(pct);

        if (i < 3) setBioMsg('Estabilizando iluminação e foco da câmera frontal...');
        else if (i < 6) setBioMsg('Mapeando 64 pontos anatômicos faciais...');
        else if (i < 9) setBioMsg('Extraindo descritor ISO 19794-5 e prova de vida temporal...');
        else setBioMsg('Conferindo padrão vetorial com o banco biométrico...');

        const result = await detectFaceAndBiometrics(videoRef.current, bioCanvasRef.current);
        if (result.detected && result.vector) {
          collectedVectors.push(result.vector);
          livenessSamplesRef.current.push({
            landmarks: result.landmarks,
            faceBox: result.faceBox,
            vector: result.vector,
            livenessScore: result.livenessScore
          });
          if (livenessSamplesRef.current.length > 24) {
            livenessSamplesRef.current.shift();
          }
        } else if (result.statusMessage) {
          lastFailReason = result.statusMessage;
        }

        if (i < totalSamples - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!isModalOpenRef.current) return;

      if (collectedVectors.length >= 4) {
        const stabilizedVector = averageBiometricDescriptors(collectedVectors);
        const match = matchBiometricFace(
          stabilizedVector,
          userColab?.id || user.id,
          userColab?.biometriaHashTemplate,
          false,
          globalThreshold
        );
        setBioSimilarity(match.similarity);
        setBioProgress(100);

        if (match.matched) {
          setBioState('verified');
          setBioMsg(`Autenticado com sucesso! Similaridade facial de ${match.similarity}%.`);
        } else {
          setBioState('rejected');
          setBioMsg(`Divergência biométrica (${match.similarity}%). Certifique-se de ser o titular cadastrado.`);
        }
      } else {
        setBioProgress(0);
        setBioState('rejected');
        setBioMsg(`${lastFailReason} (Quadros válidos: ${collectedVectors.length}/${totalSamples}).`);
      }
    } catch (e) {
      setBioProgress(0);
      setBioState('idle');
      setBioMsg('Erro na leitura óptica facial. Tente novamente.');
    }
  };

  // Inicia contagem regressiva preparatória única ao abrir modal no modo Facial
  React.useEffect(() => {
    if (
      isBaterPontoModalOpen &&
      authMethod === 'FACIAL' &&
      hasEnrolledBiometry &&
      bioState === 'idle' &&
      biometricCountdown === null &&
      !countdownStartedRef.current
    ) {
      countdownStartedRef.current = true;
      const t = setTimeout(() => setBiometricCountdown(3), 900);
      return () => clearTimeout(t);
    }
  }, [isBaterPontoModalOpen, authMethod, hasEnrolledBiometry, bioState, biometricCountdown]);

  // Efetivar Registro de Ponto Individual (via /api/punch autoritativo)
  const handleExecutarPontoIndividual = async () => {
    setPontoModalError(null);
    if (bioState !== 'verified') {
      setPontoModalError('A validação facial ou por PIN precisa ser concluída com sucesso.');
      return;
    }

    if (tipoPonto === 'ENTRADA' && !isPunchAllowed) {
      setPontoModalError(`Horário Não Permitido: ${punchBlockReason || `Sua entrada é permitida entre ${allowedTimeFormatted}.`}`);
      return;
    }

    const jaExisteTipo = batidasHoje.some(b => b.tipoMarcacao === tipoPonto);
    if (jaExisteTipo) {
      setPontoModalError(`Você já registrou sua marcação de ${tipoPonto} hoje. Para correções, utilize "Ajustes & Atestados".`);
      return;
    }

    const est = myAllocatedEst;
    const hasEstCoords = typeof est.latitude === 'number' && Number.isFinite(est.latitude) && typeof est.longitude === 'number' && Number.isFinite(est.longitude);
    if (est.bloquearForaDoRaio !== false && hasEstCoords) {
      if (!gpsData) {
        setPontoModalError('Geolocalização GPS obrigatória para esta unidade. Ative o GPS e tente novamente.');
        return;
      }
      if (!gpsData.dentroCerca) {
        setPontoModalError(`Fora da área permitida: você está a ${gpsData.dist}m da unidade "${est.nome}" (limite ${est.cercaRaioMetros}m).`);
        return;
      }
    }

    setIsSubmittingPunch(true);
    const parts = getBrasiliaParts();
    const tenantIdTarget = userColab?.tenantId || user.tenantId || 'tenant-01';
    const colabIdTarget = userColab?.id || user.id;

    try {
      let registroConfirmado: RegistroPontoREPP | null = null;

      if (navigator.onLine && bearerToken) {
        const res = await fetch('/api/punch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            tenantId: tenantIdTarget,
            colaboradorId: colabIdTarget,
            tipoMarcacao: tipoPonto,
            latitude: gpsData?.lat ?? null,
            longitude: gpsData?.lng ?? null,
            modoDispositivo: 'MOBILE_GPS',
            biometricAudit: {
              similarity: bioSimilarity || (authMethod === 'TOKEN_PIN' ? 100 : 0),
              lightingCondition: 'BOA',
              livenessScore: livenessConfirmed ? livenessScoreMeasuredRef.current : 0,
              verdict: 'APROVADO',
              algorithmUsed: authMethod === 'TOKEN_PIN' ? 'PIN_CONTINGENCIA' : 'ISO_19794_5_WEB'
            }
          })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setPontoModalError(data.error || 'Marcação recusada pelo servidor REP-P.');
          setIsSubmittingPunch(false);
          return;
        }
        if (data.success && data.registro) {
          registroConfirmado = data.registro;
        }
      }

      if (!registroConfirmado) {
        if (navigator.onLine && !bearerToken) {
          setPontoModalError('Sessão autenticada necessária para registrar ponto online. Faça login novamente.');
          setIsSubmittingPunch(false);
          return;
        }
        const nextNsr = registros.length + 1;
        let hashCalc = '';
        for (let i = 0; i < 64; i++) {
          hashCalc += ((i * 19 + nextNsr * 29 + user.cpf.charCodeAt(i % user.cpf.length)) % 16).toString(16);
        }
        registroConfirmado = {
          nsr: nextNsr,
          tenantId: tenantIdTarget,
          empregadorRazaoSocial: user.tenantNome || est.nome,
          empregadorCnpj: est.cnpj || '',
          colaboradorId: colabIdTarget,
          colaboradorNome: user.nome,
          colaboradorCpf: user.cpf,
          colaboradorMatricula: userColab?.matricula || `MAT-${user.cpf.replace(/\D/g, '').slice(0, 5)}`,
          dataHora: parts.iso,
          dataHoraFormatada: parts.formatted,
          fusoHorario: '-03:00',
          coletorId: 'MOBILE-APP-INDIVIDUAL',
          tipoMarcacao: tipoPonto,
          hashSha256: `OFFLINE_${hashCalc.slice(0, 56)}`,
          latitude: gpsData?.lat,
          longitude: gpsData?.lng,
          distanciaCentroMetros: gpsData?.dist,
          foraDoRaioGeofence: gpsData ? !gpsData.dentroCerca : false,
          localizacaoEndereco: gpsData?.endereco || `${est.nome} - Registro Offline`,
          modoDispositivo: 'MOBILE_GPS'
        };
        await saveOfflinePunchToIDB(registroConfirmado);
      }

      onAddRegistroPonto?.(registroConfirmado);
      setIsSubmittingPunch(false);
      setTimeout(() => {
        setIsBaterPontoModalOpen(false);
        setComprovanteModal(registroConfirmado);
      }, 900);

      const allPunchesToday = [...batidasHoje, registroConfirmado];
      const workedInfo = calculateWorkedTime(allPunchesToday);
      if (tipoPonto === 'SAIDA' || allPunchesToday.length >= 4) {
        setPontoSucessoMsg(`Saída registrada! Hoje sua carga horária foi de ${workedInfo.formatted}. (NSR ${String(registroConfirmado.nsr).padStart(9, '0')})`);
      } else {
        setPontoSucessoMsg(`Ponto registrado com sucesso! NSR ${String(registroConfirmado.nsr).padStart(9, '0')} gerado conforme Portaria MTP 671.`);
      }
      setTimeout(() => setPontoSucessoMsg(null), 10000);
    } catch (err) {
      console.error('Erro de conexão ao registrar ponto:', err);
      setPontoModalError('Falha de rede ao enviar marcação. Verifique sua conexão e tente novamente.');
      setIsSubmittingPunch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Relógio Digital em Tempo Real & Status de Liberação de Ponto com Contagem Regressiva */}
      <div className="relative group">
        {batidasHoje.length >= 4 && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-md rounded-2xl border-2 border-emerald-500/30 animate-in fade-in duration-500">
             <div className="text-center p-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Carga Horária Encerrada</h3>
                <p className="text-emerald-100/80 text-xs font-medium max-w-xs mx-auto">
                  Obrigado por registrar sua saída! Hoje sua carga horária foi de <strong className="text-white underline font-bold">{calculateWorkedTime(batidasHoje).formatted}</strong>, bom descanso!
                </p>
                <button 
                  onClick={() => setIsAjusteModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
                >
                  <PenTool className="w-3.5 h-3.5" /> Solicitar Correção ao Supervisor
                </button>
             </div>
          </div>
        )}

        <div className={`p-5 rounded-2xl border transition-all shadow-md ${
          batidasHoje.length >= 4 ? 'blur-sm grayscale grayscale-50 pointer-events-none' : ''
        } ${
          isPunchAllowed 
            ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-emerald-500/40 text-white' 
            : 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500/50 text-white'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Mostrador do Relógio Digital */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-bold shrink-0 border ${
                isPunchAllowed 
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}>
                <Clock className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] uppercase font-sans">Ao Vivo</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold font-mono tabular-nums tracking-wider text-white">
                    {formattedLiveClock}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isPunchAllowed 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isPunchAllowed ? 'LIBERADO PARA PONTO' : 'ENTRADA BLOQUEADA'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Jornada Contratada: <strong>{horarioInicioStr} às {horarioFimStr}</strong> · Antecedência Máxima: <strong>{maxAntecedenciaMin} min</strong> (Liberado das <strong>{allowedTimeFormatted}</strong>)
                </p>
              </div>
            </div>

            {/* Contagem Regressiva / Indicador de Liberação */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isPunchAllowed && (
                <div className="bg-amber-950/90 border border-amber-500/60 p-3 rounded-xl text-center space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-amber-300 tracking-wider block">
                    Tempo Restante para Liberar Entrada
                  </span>
                  <div className="text-xl font-bold font-mono tabular-nums text-amber-400 tracking-widest">
                    {formatCountdown(secondsRemaining)}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (batidasHoje.length >= 4) {
                    showPortalNotice('error', 'Sua carga horária diária já foi encerrada (4 marcações registradas).');
                    return;
                  }
                  if (!isPunchAllowed) {
                    showPortalNotice('error', `Bloqueio de Horário: ${punchBlockReason}`);
                  } else {
                    handleOpenPersonalPunch();
                  }
                }}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 ${
                  isPunchAllowed
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/50 cursor-pointer active:scale-95'
                    : 'bg-amber-800/80 hover:bg-amber-700/80 text-amber-100 border border-amber-500/50 cursor-pointer'
                }`}
              >
                <Camera className="w-4 h-4" />
                {isPunchAllowed ? 'Bater Meu Ponto Agora (Facial)' : (secondsRemaining > 0 ? `Entrada Liberada em ${formatCountdown(secondsRemaining)}` : 'Entrada Bloqueada (Fora do Horário)')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {portalNotice && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-xs ${
          portalNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {portalNotice.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{portalNotice.text}</span>
          </div>
          <button onClick={() => setPortalNotice(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de Boas-vindas do Colaborador com Gestor Imediato */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {user.nome.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{user.nome}</h2>
              <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Vínculo CLT Ativo
              </span>
              {!hasEnrolledBiometry && (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Biometria Pendente
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {userColab?.cargoTitulo || user.cargoTitulo || 'Colaborador'} · {userColab?.departamentoNome || user.departamentoNome || 'Geral'} · CPF {user.cpf}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Gestor Imediato: <strong className="text-slate-800">{gestorEquipeNome}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Unidade Alocada: <strong className="text-slate-800">{userColab?.estabelecimentoNome || myAllocatedEst.nome}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={() => setIsEnrollFaceModalOpen(true)}
            className={`flex-1 lg:flex-none justify-center px-3 py-2 font-semibold text-xs rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              hasEnrolledBiometry
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
            }`}
          >
            <ScanFace className="w-4 h-4 shrink-0" />
            <span>{hasEnrolledBiometry ? 'Atualizar Face' : 'Cadastrar Minha Face'}</span>
          </button>
          <button
            onClick={() => setIsAjusteModalOpen(true)}
            className="flex-1 lg:flex-none justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Enviar Atestado / Ajuste</span>
          </button>
          <button
            onClick={() => setIsNovaHeModalOpen(true)}
            className="flex-1 lg:flex-none justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Solicitar H.E.</span>
          </button>
          {onOpenGuia && (
            <button
              onClick={onOpenGuia}
              className="flex-1 lg:flex-none justify-center px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Acessar Guia de Boas-Vindas e Manual de Uso"
            >
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Guia</span>
            </button>
          )}
          {(user.role === 'SUPER_ADMIN' || user.role === 'RH_ADMIN') && onRegistrarPonto && (
            <button
              onClick={onRegistrarPonto}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              title="Acessar Modo Tablet Compartilhado da Recepção"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tablet Geral</span>
            </button>
          )}
        </div>
      </div>

      {pontoSucessoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{pontoSucessoMsg}</span>
          </div>
          <button onClick={() => setPontoSucessoMsg(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {signatureSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{signatureSuccessMsg}</span>
        </div>
      )}

      {/* Resumo de Indicadores Mensais de Jornada */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Escala & Jornada</span>
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
            {userColab?.tipoEscala === '12x36' 
              ? `12x36 (Turma ${userColab.turmaEscala || 'A'})` 
              : (userColab?.tipoEscala === '6x1' ? '6x1 Varejo' : 'Comercial 5x2')}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {userColab?.tipoEscala === '12x36' ? 'Plantão 12h · 36h descanso' : `${horarioInicioStr} às ${horarioFimStr} · ${userColab?.intervaloMinutos ?? 60}m intervalo`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Assinatura {mesAnoLabel}</span>
          <span className="text-lg font-bold font-mono text-emerald-700 flex items-center gap-1">
            {minhaAssinaturaMesAtual ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                Assinado
              </>
            ) : (
              <span className="text-amber-700">Pendente</span>
            )}
          </span>
          <span className="text-[10px] text-slate-500 block">Portaria MTP 671 / PTRP</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Saldo Horas Extras Aprov.</span>
          {(() => {
            const approvedMins = minhasHorasExtras
              .filter(h => h.status === 'APROVADO')
              .reduce((acc, h) => acc + (h.minutosExtras || 0), 0);
            const hh = String(Math.floor(approvedMins / 60)).padStart(2, '0');
            const mm = String(approvedMins % 60).padStart(2, '0');
            return (
              <span className="text-lg font-bold font-mono text-emerald-700">
                +{hh}:{mm}h
              </span>
            );
          })()}
          <span className="text-[10px] text-emerald-600 block">CLT Art. 59 (Banco / Folha)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Marcações em {mesAnoLabel}</span>
          <span className="text-lg font-bold font-mono text-slate-900">
            {meusRegistros.filter(r => getBrasiliaYmd(r.dataHora).startsWith(mesAnoAtual)).length} batidas
          </span>
          <span className="text-[10px] text-slate-500 block">Total histórico: {meusRegistros.length} NSRs</span>
        </div>
      </div>

      {/* Navegação Interna do Portal em 4 Pilares Ergonômicos */}
      {(() => {
        const PILLARS: {
          id: 'ponto' | 'escala_ferias' | 'documentos' | 'comunicacao';
          label: string;
          icon: React.ReactNode;
          defaultTab: PortalTabId;
          tabs: { id: PortalTabId; label: string; count?: number; statusTag?: string }[];
        }[] = [
          {
            id: 'ponto',
            label: 'Ponto & Espelho',
            icon: <Clock className="w-4 h-4 shrink-0" />,
            defaultTab: 'espelho',
            tabs: [
              { id: 'espelho', label: 'Espelho Mensal' },
              { id: 'comprovantes', label: 'Comprovantes', count: meusRegistros.length },
              { id: 'ajustes', label: 'Ajustes & Atestados', count: minhasSolicitacoesAjuste.length },
              { id: 'horas_extras', label: 'Horas Extras', count: minhasHorasExtras.length }
            ]
          },
          {
            id: 'escala_ferias',
            label: 'Escala & Férias',
            icon: <CalendarDays className="w-4 h-4 shrink-0" />,
            defaultTab: 'escala',
            tabs: [
              { id: 'escala', label: 'Minha Escala' },
              { id: 'troca_turno', label: 'Troca de Turno', count: solicitacoesTroca.length },
              { id: 'ferias', label: 'Férias CLT' },
              { id: 'feriados', label: 'Feriados' }
            ]
          },
          {
            id: 'documentos',
            label: 'Documentos & Assinatura',
            icon: <FileSpreadsheet className="w-4 h-4 shrink-0" />,
            defaultTab: 'holerites',
            tabs: [
              { id: 'holerites', label: 'Holerites & IRPF', count: holeritesList.length + informesIrpfList.length },
              { id: 'assinatura', label: 'Assinatura Digital', statusTag: minhaAssinaturaMesAtual ? 'Assinado' : 'Pendente' }
            ]
          },
          {
            id: 'comunicacao',
            label: 'Mural & RH',
            icon: <Megaphone className="w-4 h-4 shrink-0" />,
            defaultTab: 'comunicados',
            tabs: [
              { id: 'comunicados', label: 'Mural Digital', count: comunicadosList.length },
              { id: 'fale_dp', label: 'Atendimento DP/RH', count: chamadosRhList.length }
            ]
          }
        ];

        const activePillar = PILLARS.find(p => p.tabs.some(t => t.id === selectedTab)) || PILLARS[0];

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs space-y-2">
            {/* 4 Pilares Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {PILLARS.map((pillar) => {
                const isActive = pillar.id === activePillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => {
                      if (!isActive) setSelectedTab(pillar.defaultTab);
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                    }`}
                  >
                    {pillar.icon}
                    <span className="truncate">{pillar.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-navegação contextual do pilar ativo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
              {activePillar.tabs.map((sub) => {
                const isSubActive = selectedTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedTab(sub.id)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                      isSubActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {typeof sub.count === 'number' && (
                      <span className={`font-mono tabular-nums text-[10px] px-1.5 py-0.5 rounded ${
                        isSubActive ? 'bg-emerald-600 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {sub.count}
                      </span>
                    )}
                    {sub.statusTag && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        sub.statusTag === 'Assinado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.statusTag}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Conteúdo: Holerites & Contracheques */}
      {selectedTab === 'holerites' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Meus Holerites & Contracheques (CLT)
              </h2>
              <p className="text-xs text-slate-500">
                Visualize seus contracheques mensais emitidos pela empresa ou faça o upload/anexo da foto do seu holerite físico para registro e arquivo.
              </p>
            </div>
            <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all">
              <Plus className="w-4 h-4" />
              <span>Anexar Foto/PDF de Holerite</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      const dataUrl = String(evt.target?.result || '');
                      const compMesAno = getBrasiliaMonthYear();
                      const competenciaLabel = getMonthLabelPtBr(compMesAno);
                      const newHoleriteId = `hol-pessoal-${Date.now()}`;
                      const newHolerite = {
                        id: newHoleriteId,
                        tenantId: userColab?.tenantId || user.tenantId || 'tenant-01',
                        mesAno: compMesAno,
                        competencia: competenciaLabel,
                        salarioBruto: 0,
                        descontos: 0,
                        liquido: 0,
                        arquivoNome: file.name,
                        arquivoUrl: dataUrl,
                        dataUpload: formatBrasiliaDate(),
                        status: 'ANEXADO_PELO_COLABORADOR'
                      };

                      if (navigator.onLine && bearerToken) {
                        try {
                          await fetch('/api/save-personal-holerite', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${bearerToken}`
                            },
                            body: JSON.stringify({
                              id: newHoleriteId,
                              tenantId: newHolerite.tenantId,
                              colaboradorId: userColab?.id || user.id,
                              colaboradorCpf: user.cpf,
                              colaboradorNome: user.nome,
                              mesAno: compMesAno,
                              competencia: competenciaLabel,
                              arquivoNome: file.name,
                              arquivoUrl: dataUrl
                            })
                          });
                        } catch {
                          // fallback local
                        }
                      }

                      const updated = [newHolerite, ...holeritesList];
                      setHoleritesList(updated);
                      localStorage.setItem(`sc_holerites_${user.id}`, JSON.stringify(updated));
                      showPortalNotice('success', `Holerite "${file.name}" anexado e sincronizado ao seu arquivo pessoal.`);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holeritesList.map((h) => (
              <div key={h.id} className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-extrabold uppercase">
                    Competência: {h.competencia}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    h.confirmadoHash || h.status === 'CONFIRMADO_PELO_COLABORADOR'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : h.status === 'EMITIDO_EMPRESA' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {h.confirmadoHash || h.status === 'CONFIRMADO_PELO_COLABORADOR' 
                      ? '✅ Recibo Assinado (CLT 464)' 
                      : h.status === 'EMITIDO_EMPRESA' 
                      ? 'Disponível pela Empresa' 
                      : 'Anexado pelo Colaborador'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Salário Bruto</span>
                    <span className="font-bold text-slate-900">R$ {h.salarioBruto.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Descontos</span>
                    <span className="font-bold text-rose-600">R$ {h.descontos.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium">Líquido</span>
                    <span className="font-bold text-emerald-700">R$ {h.liquido.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                  <span className="text-slate-600 font-mono truncate max-w-[200px]" title={h.arquivoNome}>
                    📄 {h.arquivoNome}
                  </span>
                  <button
                    onClick={() => setViewingHoleriteModal(h)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Visualizar Holerite
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMoreHolerites && (
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  const nextOffset = holeriteOffset + LIMIT;
                  setHoleriteOffset(nextOffset);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Carregar mais Holerites
              </button>
            </div>
          )}

          {/* Seção Informe de Rendimentos IRPF */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Informe de Rendimentos Anual (IRPF)
                </h3>
                <p className="text-xs text-slate-500">
                  Comprovante de Rendimentos Pagos e de Retenção de Imposto de Renda na Fonte para declaração IRPF.
                </p>
              </div>
            </div>

            {informesIrpfList.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Nenhum Informe de Rendimentos IRPF publicado até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {informesIrpfList.map((irpf) => (
                  <div key={irpf.id} className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4 space-y-3 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-emerald-700 text-white rounded font-mono font-bold text-[11px]">
                        Ano-Calendário {irpf.anoCalendario}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                        Exercício {irpf.exercicio || Number(irpf.anoCalendario) + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{irpf.titulo}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Disponibilizado em: {irpf.dataUpload || 'Recentemente'}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200/60">
                      <span className="text-slate-600 font-mono text-[11px] truncate max-w-[180px]" title={irpf.arquivoNome}>
                        📄 {irpf.arquivoNome}
                      </span>
                      <button
                        onClick={() => setViewingIrpfModal(irpf)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Visualizar Informe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Visualizador de Holerite / Contracheque (com Assinatura Digital CLT Art. 464) */}
      {viewingHoleriteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Contracheque Digital / Holerite - {viewingHoleriteModal.competencia}</h3>
                  <p className="text-[11px] text-slate-500">Documento Oficial com Recibo Digital CLT Art. 464</p>
                </div>
              </div>
              <button onClick={() => setViewingHoleriteModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {viewingHoleriteModal.arquivoUrl ? (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>Arquivo Anexado: <strong>{viewingHoleriteModal.arquivoNome}</strong></span>
                  <a
                    href={viewingHoleriteModal.arquivoUrl}
                    download={viewingHoleriteModal.arquivoNome}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Baixar Arquivo
                  </a>
                </div>
                {viewingHoleriteModal.arquivoUrl.startsWith('data:image/') ? (
                  <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-100 flex justify-center">
                    <img src={viewingHoleriteModal.arquivoUrl} alt={viewingHoleriteModal.arquivoNome} className="max-w-full rounded-lg shadow-xs" />
                  </div>
                ) : (
                  <div className="h-[45vh] border border-slate-200 rounded-xl overflow-hidden">
                    <iframe src={viewingHoleriteModal.arquivoUrl} className="w-full h-full" title="Visualizador de PDF" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans text-[10px]">Empregador</span>
                    <strong className="text-slate-900 block truncate">{user.tenantNome || myAllocatedEst.nome}</strong>
                    <span className="text-slate-500 text-[10px]">CNPJ: {myAllocatedEst.cnpj || 'Conforme cadastro'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans text-[10px]">Colaborador</span>
                    <strong className="text-slate-900 block truncate">{user.nome}</strong>
                    <span className="text-slate-500 text-[10px]">CPF: {user.cpf}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5 text-right">Proventos (R$)</th>
                        <th className="p-2.5 text-right">Descontos (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-2.5 font-medium">Salário Base Mensal ({viewingHoleriteModal.competencia})</td>
                        <td className="p-2.5 text-right font-mono text-slate-900 font-bold">R$ {viewingHoleriteModal.salarioBruto.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">Descontos em Folha (INSS / IRRF / Benefícios)</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 font-bold">R$ {viewingHoleriteModal.descontos.toFixed(2)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-300 font-bold">
                        <td className="p-3 text-emerald-950 font-bold">Valor Líquido A Receber</td>
                        <td colSpan={2} className="p-3 text-right font-mono text-emerald-900 text-sm font-extrabold">
                          R$ {viewingHoleriteModal.liquido.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {viewingHoleriteModal.observacao && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                    <strong className="block text-[10px] uppercase font-bold text-amber-800">Observações do DP:</strong>
                    <span>{viewingHoleriteModal.observacao}</span>
                  </div>
                )}
              </div>
            )}

            {/* BLOCO DE CONFIRMAÇÃO DIGITAL / RECIBO DE LEITURA (CLT Art. 464) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Comprovação Eletrônica de Recebimento do Contracheque (CLT Art. 464)
                </span>
                {viewingHoleriteModal.confirmadoHash || viewingHoleriteModal.status === 'CONFIRMADO_PELO_COLABORADOR' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                    ✅ Recibo Assinado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                    ⏳ Pendente de Assinatura
                  </span>
                )}
              </div>

              {viewingHoleriteModal.confirmadoHash || viewingHoleriteModal.status === 'CONFIRMADO_PELO_COLABORADOR' ? (
                <div className="p-3 bg-emerald-950 text-white rounded-xl space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Recibo de Pagamento Assinado Digitalmente pelo Empregado</span>
                  </div>
                  <div><strong>Data/Hora do Carimbo:</strong> {viewingHoleriteModal.confirmadoEm || 'Confirmado'}</div>
                  <div><strong>Endereço IP Registrado:</strong> {viewingHoleriteModal.confirmadoIp || 'Capturado no Servidor'}</div>
                  <div className="truncate"><strong>Hash Criptográfico SHA-256:</strong> {viewingHoleriteModal.confirmadoHash}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-600">
                    Conforme o Art. 464 da Consolidação das Leis do Trabalho (CLT), o recibo de pagamento emitido através do sistema informatizado da empresa substitui a assinatura física em papel.
                  </p>
                  <button
                    onClick={() => handleConfirmHoleriteReceipt(viewingHoleriteModal)}
                    disabled={isSigningHolerite}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>{isSigningHolerite ? 'Gerando Carimbo Digital...' : 'Assinar / Confirmar Recebimento do Holerite (CLT Art. 464)'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setViewingHoleriteModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Mural Digital de Comunicados */}
      {selectedTab === 'comunicados' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                Mural Digital de Comunicados da Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Avisos institucionais da empresa, comunicados de feriados pontes, campanhas de vacinação e metas do mês.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comunicadosList.map((ann) => {
              const userCpfClean = user.cpf.replace(/\D/g, '');
              const jaConfirmou = (ann.confirmacoesLeitura || []).some(
                (r) => (r.colaboradorId === user.id) || (userCpfClean && (r.colaboradorCpf || '').replace(/\D/g, '') === userCpfClean)
              );
              const minhaConfirmacao = (ann.confirmacoesLeitura || []).find(
                (r) => (r.colaboradorId === user.id) || (userCpfClean && (r.colaboradorCpf || '').replace(/\D/g, '') === userCpfClean)
              );

              return (
                <div
                  key={ann.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    ann.fixado
                      ? 'bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/50 border-indigo-200 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ann.fixado && (
                        <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                          <Pin className="w-3 h-3 fill-current" /> Destaque Fixado
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono font-bold text-[10px] uppercase">
                        {ann.categoria === 'FERIADOS' && '🏖️ Feriado / Ponte'}
                        {ann.categoria === 'CAMPANHA_SAUDE' && '🏥 Campanha de Saúde'}
                        {ann.categoria === 'METAS_MES' && '🎯 Metas do Mês'}
                        {ann.categoria === 'COMUNICADO_GERAL' && '📢 Geral'}
                        {ann.categoria === 'SEGURANCA_TRABALHO' && '🛡️ Segurança do Trabalho'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{ann.titulo}</h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Publicado em: {ann.criadoEm} por {ann.autorNome}</span>
                  </div>

                  <div className="py-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {ann.conteudo}
                  </div>

                  {ann.anexoNome && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between max-w-md my-2">
                      <span className="text-slate-700 font-mono truncate" title={ann.anexoNome}>📄 {ann.anexoNome}</span>
                      {ann.anexoUrl && (
                        <a href={ann.anexoUrl} download={ann.anexoNome} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                          Baixar Anexo
                        </a>
                      )}
                    </div>
                  )}

                  {/* BLOCO DE CONFIRMAÇÃO DE LEITURA */}
                  <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Status de Leitura: {jaConfirmou ? <strong className="text-emerald-700 font-bold">Leitura Confirmada</strong> : <span className="text-amber-700 font-bold">Aguardando Sua Leitura</span>}
                    </span>

                    {ann.exigeConfirmacaoLeitura && (
                      jaConfirmou ? (
                        <div className="p-2 bg-emerald-100/90 text-emerald-900 rounded-xl font-mono text-[10px] flex items-center gap-2 border border-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Leitura Confirmada em <strong>{minhaConfirmacao?.dataHora || 'Confirmado'}</strong> (IP: {minhaConfirmacao?.ip || 'Servidor'})</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmReadingAnnouncement(ann)}
                          disabled={confirmingReadAnnId === ann.id}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{confirmingReadAnnId === ann.id ? 'Gravando...' : 'Confirmar Leitura do Comunicado'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conteúdo: Canal Fale com o DP / RH */}
      {selectedTab === 'fale_dp' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Canal Fale com o DP / RH
              </h2>
              <p className="text-xs text-slate-500">
                Tire suas dúvidas sobre holerites, solicite alteração do Vale-Transporte (VT) ou solicite alterações cadastrais diretamente à equipe de RH.
              </p>
            </div>
            <button
              onClick={() => setIsNovoChamadoModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Novo Chamado DP/RH</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista dos Meus Chamados */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Meus Chamados ({chamadosRhList.length})</h3>

              {chamadosRhList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Você não possui chamados abertos com o DP/RH no momento.
                </div>
              ) : (
                chamadosRhList.map((t) => {
                  const isSelected = selectedUserTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedUserTicket(t)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.status === 'ABERTO' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          t.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {t.status === 'ABERTO' ? '🟡 Em Análise' : t.status === 'EM_ATENDIMENTO' ? '🔵 Respondido pelo RH' : '🟢 Concluído'}
                        </span>
                        <span className="text-[10px] text-slate-400">{t.criadoEm}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{t.titulo}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{t.mensagemInicial}</p>

                      <div className="text-[10px] text-slate-500 pt-1 font-mono">
                        Assunto: <strong>
                          {t.assunto === 'DUVIDA_HOLERITE' && 'Dúvida sobre Holerite'}
                          {t.assunto === 'VALE_TRANSPORTE' && 'Vale-Transporte (VT)'}
                          {t.assunto === 'ALTERACAO_CADASTRAL' && 'Alteração Cadastral'}
                          {t.assunto === 'DUVIDA_PONTO' && 'Espelho de Ponto'}
                          {t.assunto === 'OUTROS' && 'Outras Solicitações'}
                        </strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Visualizador de Respostas e Conversa */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[450px]">
              {selectedUserTicket ? (
                <div className="flex flex-col h-full justify-between space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">{selectedUserTicket.titulo}</h3>
                      <span className="text-[10px] font-mono text-slate-400">Criado em: {selectedUserTicket.criadoEm}</span>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sua Mensagem Inicial:</span>
                      <p>{selectedUserTicket.mensagemInicial}</p>
                    </div>

                    {selectedUserTicket.anexoNome && (
                      <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                        <span>Anexo enviado: <strong>{selectedUserTicket.anexoNome}</strong></span>
                        {selectedUserTicket.anexoUrl && (
                          <a href={selectedUserTicket.anexoUrl} download={selectedUserTicket.anexoNome} target="_blank" rel="noreferrer" className="font-bold underline text-indigo-700">
                            Baixar Anexo
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thread de Respostas */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2 max-h-[280px]">
                    {selectedUserTicket.respostas.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-8">
                        Sua solicitação foi recebida pela equipe de RH/DP. Em breve uma analista responderá ao seu chamado por aqui.
                      </div>
                    ) : (
                      selectedUserTicket.respostas.map((r) => (
                        <div
                          key={r.id}
                          className={`p-3.5 rounded-xl text-xs space-y-1 max-w-[85%] ${
                            r.eDoRh
                              ? 'bg-emerald-900 text-white border border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200 shadow-xs ml-auto'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] opacity-80">
                            <span className="font-bold">{r.autorNome}</span>
                            <span>{r.dataHora}</span>
                          </div>
                          <p className="leading-relaxed">{r.mensagem}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Campo de Réplica / Resposta do Funcionário */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Enviar resposta ou réplica para o RH..."
                      value={respostaColabInput}
                      onChange={(e) => setRespostaColabInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendUserReplyTicket(selectedUserTicket);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSendUserReplyTicket(selectedUserTicket)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar Réplica</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400 py-20">
                  <MessageSquare className="w-12 h-12 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-600">Nenhum Chamado Selecionado</h4>
                  <p className="text-xs max-w-xs">
                    Selecione um chamado da lista ao lado para ver o histórico e respostas do RH ou clique no botão "Abrir Novo Chamado DP/RH".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO CHAMADO FALE COM O DP / RH */}
      {isNovoChamadoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Fale com o DP / RH - Abrir Nova Solicitação
              </h3>
              <button onClick={() => setIsNovoChamadoModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assunto da Solicitação:</label>
                <select
                  value={novoChamadoAssunto}
                  onChange={(e) => setNovoChamadoAssunto(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="DUVIDA_HOLERITE">📄 Dúvida sobre Holerite / Contracheque / Descontos</option>
                  <option value="VALE_TRANSPORTE">🚌 Vale-Transporte (VT) - Pedido ou Mudança de Rota</option>
                  <option value="ALTERACAO_CADASTRAL">👤 Alteração Cadastral (Endereço, Estado Civil, Dependentes)</option>
                  <option value="DUVIDA_PONTO">⏰ Dúvidas ou Correções no Espelho de Ponto</option>
                  <option value="OUTROS">💬 Outras Solicitações e Dúvidas com o RH</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Título / Resumo:</label>
                <input
                  type="text"
                  placeholder="Ex: Mudança de endereço residencial para atualização do cartão VT"
                  value={novoChamadoTitulo}
                  onChange={(e) => setNovoChamadoTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mensagem / Detalhes da Solicitação:</label>
                <textarea
                  rows={4}
                  placeholder="Descreva detalhadamente sua solicitação para a equipe do Departamento Pessoal..."
                  value={novoChamadoMensagem}
                  onChange={(e) => setNovoChamadoMensagem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Anexo de Comprovante (PDF/Imagem - Opcional):</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNovoChamadoAnexoNome(file.name);
                      const reader = new FileReader();
                      reader.onload = (evt) => setNovoChamadoAnexoUrl(evt.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNovoChamadoModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Chamado ao RH</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizador de Informe de Rendimentos IRPF */}
      {viewingIrpfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{viewingIrpfModal.titulo}</h3>
                  <p className="text-[11px] text-slate-500">Ano-Calendário {viewingIrpfModal.anoCalendario} · Exercício {viewingIrpfModal.exercicio || Number(viewingIrpfModal.anoCalendario) + 1}</p>
                </div>
              </div>
              <button onClick={() => setViewingIrpfModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {viewingIrpfModal.arquivoUrl ? (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span>Arquivo: <strong>{viewingIrpfModal.arquivoNome}</strong></span>
                  <a
                    href={viewingIrpfModal.arquivoUrl}
                    download={viewingIrpfModal.arquivoNome}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
                  >
                    Baixar Informe PDF
                  </a>
                </div>
                {viewingIrpfModal.arquivoUrl.startsWith('data:image/') ? (
                  <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-100 flex justify-center">
                    <img src={viewingIrpfModal.arquivoUrl} alt={viewingIrpfModal.arquivoNome} className="max-w-full rounded-lg shadow-xs" />
                  </div>
                ) : (
                  <div className="h-[45vh] border border-slate-200 rounded-xl overflow-hidden">
                    <iframe src={viewingIrpfModal.arquivoUrl} className="w-full h-full" title="Visualizador de PDF IRPF" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 font-mono text-[11px] text-slate-700">
                <div className="p-3 bg-emerald-900 text-white rounded-xl font-sans font-bold flex items-center justify-between">
                  <span>COMPROVANTE DE RENDIMENTOS PAGOS E DE RETENÇÃO DE IMPOSTO DE RENDA</span>
                  <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">RECEITA FEDERAL</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-sans text-[10px] block">1. Fonte Paguadora (Empresa)</span>
                    <strong className="block text-slate-900">{user.tenantNome || myAllocatedEst.nome}</strong>
                    <span>CNPJ: {myAllocatedEst.cnpj || 'Conforme cadastro'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-sans text-[10px] block">2. Pessoa Física Beneficiária</span>
                    <strong className="block text-slate-900">{user.nome}</strong>
                    <span>CPF: {user.cpf}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 font-sans text-xs space-y-2">
                  <strong className="block text-slate-900">Resumo Anual de Rendimentos ({viewingIrpfModal.anoCalendario}):</strong>
                  {viewingIrpfModal.rendimentosTributaveis != null || viewingIrpfModal.irrfRetido != null || viewingIrpfModal.contribuicaoInss != null ? (
                    <>
                      <div className="flex justify-between border-b pb-1">
                        <span>Rendimentos Tributáveis / Salários:</span>
                        <strong className="font-mono">
                          {viewingIrpfModal.rendimentosTributaveis != null
                            ? `R$ ${Number(viewingIrpfModal.rendimentosTributaveis).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Disponível no arquivo anexo'}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>Imposto de Renda Retido na Fonte (IRRF):</span>
                        <strong className="font-mono text-rose-600">
                          {viewingIrpfModal.irrfRetido != null
                            ? `R$ ${Number(viewingIrpfModal.irrfRetido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Disponível no arquivo anexo'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contribuição Previdenciária Oficial (INSS):</span>
                        <strong className="font-mono text-blue-700">
                          {viewingIrpfModal.contribuicaoInss != null
                            ? `R$ ${Number(viewingIrpfModal.contribuicaoInss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Disponível no arquivo anexo'}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Os valores detalhados de rendimentos tributáveis, IRRF e INSS constam integralmente no documento oficial publicado pelo Departamento Pessoal ({viewingIrpfModal.arquivoNome || 'PDF oficial IRPF'}).
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                onClick={() => setViewingIrpfModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Informe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Minhas Férias (CLT) */}
      {selectedTab === 'ferias' && (
        <PortalFeriasTab
          userColab={userColab}
          minhasFeriasAgendadas={minhasFeriasAgendadas}
        />
      )}

      {/* Conteúdo: Espelho de Ponto com 4 Batidas e Controle de Intervalo */}
      {selectedTab === 'espelho' && (
        <PortalEspelhoTab
          meusRegistros={meusRegistros}
          userColab={userColab}
          hojeStr={hojeStr}
          onSolicitarAjuste={(data, tipo) => {
            setAjusteTipoInput(tipo as any);
            setAjusteDataInput(data);
            setIsAjusteModalOpen(true);
          }}
        />
      )}

      {/* Conteúdo: Solicitações de Horas Extras e Aprovação do Gestor */}
      {selectedTab === 'horas_extras' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Minhas Solicitações de Horas Extras & Aprovação do Gestor
              </h3>
              <p className="text-xs text-slate-500">
                Horas extras excedentes enviadas para avaliação do gestor de equipe <strong>{gestorEquipeNome}</strong> (CLT Art. 59).
              </p>
            </div>
            <button
              onClick={() => setIsNovaHeModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Solicitação
            </button>
          </div>

          {minhasHorasExtras.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
              Nenhuma solicitação de hora extra registrada para você.
            </div>
          ) : (
            <div className="space-y-3">
              {minhasHorasExtras.map((he) => (
                <div
                  key={he.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{he.data}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-emerald-700 font-bold">+{he.horasExtrasFormatadas}</span>
                      <span className="text-[11px] text-slate-500">
                        ({he.tipoHoraExtra === 'NORMAL_50' ? 'Adicional 50%' : 'Adicional 100%'})
                      </span>
                    </div>

                    <div>
                      {he.status === 'PENDENTE' && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" /> Em Análise pelo Gestor
                        </span>
                      )}
                      {he.status === 'APROVADO' && (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovada pelo Gestor
                        </span>
                      )}
                      {he.status === 'REJEITADO' && (
                        <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejeitada pelo Gestor
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
                    <div><strong>Horário Previsto:</strong> {he.horarioContratado}</div>
                    <div><strong>Horário Realizado:</strong> {he.horarioRealizado}</div>
                    <div><strong>Gestor da Equipe:</strong> {he.gestorNome}</div>
                  </div>

                  <div className="text-slate-700 text-xs">
                    <strong>Motivo informado:</strong> "{he.justificativa}"
                  </div>

                  {he.dataDecisao && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                      <strong>Decisão registrada em:</strong> {he.dataDecisao}
                      {he.motivoRecusa && (
                        <span className="text-rose-700 block mt-0.5">Motivo da recusa: {he.motivoRecusa}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Assinatura Eletrônica do Espelho de Ponto (Portaria 671 / PTRP) */}
      {selectedTab === 'assinatura' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                Assinatura Eletrônica do Espelho de Ponto ({mesAnoLabel})
              </h3>
              <p className="text-xs text-slate-500">
                Homologado conforme o Programa de Tratamento de Registro de Ponto (PTRP) - Portaria MTP nº 671/2021 Art. 84.
              </p>
            </div>
            {minhaAssinaturaMesAtual ? (
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Espelho Assinado Digitalmente
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Aguardando Sua Assinatura
              </span>
            )}
          </div>

          {minhaAssinaturaMesAtual ? (
            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Assinatura Digital Registrada com Validade Jurídica (CLT e Portaria 671)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px] text-slate-700 bg-white p-3.5 rounded-lg border border-emerald-200">
                <div><strong>Data e Hora:</strong> {minhaAssinaturaMesAtual.dataHoraAssinatura}</div>
                <div><strong>Endereço IP:</strong> {minhaAssinaturaMesAtual.ipAddress}</div>
                <div><strong>Dispositivo:</strong> {minhaAssinaturaMesAtual.dispositivoInfo}</div>
                <div><strong>Status:</strong> <span className="text-emerald-700 font-bold">HOMOLOGADO</span></div>
                <div className="sm:col-span-2 truncate"><strong>Hash Criptográfico (SHA-256):</strong> {minhaAssinaturaMesAtual.hashAssinaturaSha256}</div>
              </div>
              {minhaAssinaturaMesAtual.rubricaDataUrl && (
                <div className="pt-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Rubrica Capturada:</span>
                  <img src={minhaAssinaturaMesAtual.rubricaDataUrl} alt="Rubrica" className="h-16 border border-slate-300 rounded bg-white p-1" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
                <span className="font-bold text-slate-900 block text-sm">
                  Declaração de Conformidade da Jornada de Trabalho ({mesAnoLabel})
                </span>
                <p>
                  Eu, <strong>{user.nome}</strong> (CPF {user.cpf}), declaro para os devidos fins legais que revisei o espelho de ponto referente à competência <strong>{mesAnoLabel}</strong> ({mesAnoAtual}) e atesto a veracidade das marcações registradas no REP-P, sem divergências pendentes.
                </p>
              </div>

              {/* Canvas de Rubrica */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Desenhe sua Rubrica no Campo Abaixo (com Mouse ou Toque na Tela):
                  </label>
                  <button
                    onClick={clearCanvas}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Limpar Desenho
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={500}
                  height={120}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="border-2 border-dashed border-slate-300 rounded-xl bg-white w-full cursor-crosshair touch-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleConfirmAssinaturaDigital}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  Assinar Espelho Digitalmente (Com Hash SHA-256)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Solicitações de Ajuste de Ponto & Atestados Médicos */}
      {selectedTab === 'ajustes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Ajustes de Ponto & Envio de Atestados Médicos
              </h3>
              <p className="text-xs text-slate-500">
                Inclusão de marcações esquecidas ou envio de comprovantes de abono para validação do RH/Gestor.
              </p>
            </div>
            <button
              onClick={() => setIsAjusteModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Enviar Novo Ajuste / Atestado
            </button>
          </div>

          {minhasSolicitacoesAjuste.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
              Nenhuma solicitação de ajuste ou atestado cadastrado até o momento.
            </div>
          ) : (
            <div className="space-y-3">
              {minhasSolicitacoesAjuste.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{s.data}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {s.tipo === 'ATESTADO_MEDICO' && 'Atestado Médico'}
                        {s.tipo === 'INCLUSAO_PONTO_ESQUECIDO' && 'Inclusão de Ponto Esquecido'}
                        {s.tipo === 'JUSTIFICATIVA_CORRECAO' && 'Justificativa de Ajuste'}
                      </span>
                      {s.cid10 && (
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.cid10}
                        </span>
                      )}
                    </div>

                    <div>
                      {s.status === 'PENDENTE' && (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" /> Em Análise pelo RH/Gestor
                        </span>
                      )}
                      {s.status === 'APROVADO' && (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado / Abonado
                        </span>
                      )}
                      {s.status === 'REJEITADO' && (
                        <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejeitado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-700 text-xs">
                    <strong>Motivo informado:</strong> "{s.justificativa}"
                  </div>

                  {s.nomeDocumentoAnexo && (
                    <div className="flex items-center gap-1.5 text-blue-700 font-mono text-[11px]">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Anexo: {s.nomeDocumentoAnexo}</span>
                    </div>
                  )}

                  {s.respostaGestor && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                      <strong>Parecer do Gestor ({s.gestorNome}):</strong> {s.respostaGestor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo: Comprovantes de Registro REP-P */}
      {selectedTab === 'comprovantes' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Comprovantes de Marcação com Assinatura Criptográfica
              </h3>
              <p className="text-xs text-slate-500">
                Comprovantes emitidos em conformidade com o Art. 83 da Portaria MTP nº 671/2021.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {meusRegistros.map((reg) => {
              const schedule = {
                ENTRADA: userColab?.horarioInicio || '08:00',
                INTERVALO_INICIO: '12:00',
                INTERVALO_FIM: '13:00',
                SAIDA: userColab?.horarioFim || '17:00'
              };
              const expectedTime = schedule[reg.tipoMarcacao as keyof typeof schedule] || '08:00';
              const punchTime = formatBrasiliaTime(reg.dataHora, false);
              
              const [pH, pM] = punchTime.split(':').map(Number);
              const [eH, eM] = expectedTime.split(':').map(Number);
              const punchMin = pH * 60 + pM;
              const expectedMin = eH * 60 + eM;
              const diff = Math.abs(punchMin - expectedMin);
              const isOnTime = diff <= 10;

              return (
                <div
                  key={`${reg.nsr}-${reg.dataHora}-${reg.tipoMarcacao}`}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs ${
                    isOnTime ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isOnTime ? 'text-emerald-700' : 'text-rose-700'}`}>
                        NSR {String(reg.nsr).padStart(9, '0')}
                      </span>
                      <span className="font-sans text-[11px] font-semibold text-slate-800">
                        · {reg.tipoMarcacao === 'ENTRADA' ? '1ª Entrada' : reg.tipoMarcacao === 'INTERVALO_INICIO' ? 'Saída Almoço' : reg.tipoMarcacao === 'INTERVALO_FIM' ? 'Volta Almoço' : '2ª Saída'}
                      </span>
                      <span className="font-sans text-[11px] text-slate-500">· {reg.dataHoraFormatada} (HLB)</span>
                      {!isOnTime && (
                         <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded font-bold">FORA DO HORÁRIO</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate max-w-lg">
                      Hash SHA-256: <code>{reg.hashSha256}</code>
                    </div>
                    {reg.alertaAntecedencia && (
                      <div className="text-[10px] text-amber-700 font-sans mt-0.5 font-bold">
                        ⚠️ {reg.alertaAntecedencia}
                      </div>
                    )}
                    {reg.alertaIntervalo && (
                      <div className="text-[10px] text-rose-700 font-sans mt-0.5 font-bold">
                        ⚠️ {reg.alertaIntervalo}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setComprovanteModal(reg)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-sans font-medium transition-colors text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Visualizar Comprovante
                  </button>
                </div>
              );
            })}

            {meusRegistros.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                Nenhum comprovante emitido para este colaborador ainda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo: Feriados do Trabalhador */}
      {selectedTab === 'feriados' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Feriados Aplicáveis ao Contrato de Trabalho
              </h3>
              <p className="text-xs text-slate-500">
                Herança legal automática para a unidade de {myAllocatedEst.municipio || 'Matriz'} / {myAllocatedEst.uf || 'BR'}.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {feriados.length} Feriados Mapeados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {feriados.map((f) => (
              <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {new Date(`${f.data}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    {f.tipo}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{f.nome}</div>
                <div className="text-[11px] text-slate-500">{f.legislacaoBase}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA: MINHA ESCALA & PLANTÕES CÍCLICOS                    */}
      {/* ========================================================= */}
      {selectedTab === 'escala' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
                <CalendarDays className="w-4 h-4" />
                Minha Programação de Turnos & Plantões
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Escala Ativa: {userColab?.tipoEscala === '12x36' ? `12x36 Hospitalar/Segurança (Turma ${userColab.turmaEscala || 'A'})` : (userColab?.tipoEscala === '6x1' ? '6x1 Operacional' : 'Comercial 5x2 (Segunda a Sexta)')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {userColab?.tipoEscala === '12x36' 
                  ? 'Plantão de 12 horas consecutivas com repouso ininterrupto subsequente de 36 horas (CLT Art. 59-A).'
                  : 'Carga horária padrão de 8 horas diárias e 44 horas semanais com 1h para descanso e refeição.'}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-indigo-800 text-xs font-mono">
              Competência: {mesAnoLabel}
            </div>
          </div>

          {/* Calendário Mensal do Colaborador */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">{mesAnoLabel}</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Plantão / Dia de Trabalho
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></span> Folga Programada / 36h
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, idx) => (
                <div key={idx} className="text-center text-[11px] font-bold text-slate-400 py-1">
                  {dia}
                </div>
              ))}

              {gerarCalendarioMesEscala(nowParts.year, nowParts.month - 1, userColab?.tipoEscala || '5x2', userColab?.turmaEscala || 'A').map((item, idx) => {
                const diaNum = parseInt(item.dataYmd.split('-')[2], 10);
                const isTrabalho = item.tipoDia === 'TRABALHO';
                const isHoje = item.dataYmd === hojeStr;

                return (
                  <div
                    key={idx}
                    className={`min-h-[58px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                      isTrabalho
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200/80 text-slate-500'
                    } ${isHoje ? 'ring-2 ring-emerald-500 shadow-xs' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono">{diaNum}</span>
                      {isHoje && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-emerald-600 text-white">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-medium truncate">
                      {isTrabalho ? (userColab?.tipoEscala === '12x36' ? 'Plantão 12h' : 'Trabalho 8h') : (item.tipoDia === 'DSR' ? 'DSR' : 'Folga 36h')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Segurança Jurídica de Escala:</strong> Folgas previstas e plantões em dias de feriado na escala 12x36 são compensados automaticamente conforme Súmula 444 do TST e Portaria 671.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA: SOLICITAÇÃO DE TROCA DE TURNO / PLANTÃO ENTRE PARES */}
      {/* ========================================================= */}
      {selectedTab === 'troca_turno' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
                <ArrowLeftRight className="w-4 h-4" />
                Governança de Plantões & Troca de Turno
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Minhas Solicitações de Troca de Plantão
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Troque plantões ou dias de folga com outro colega de equipe com validação obrigatória do intervalo de 11h de descanso (CLT Art. 66).
              </p>
            </div>
            <button
              onClick={() => {
                const targetTenant = userColab?.tenantId || user.tenantId;
                const outro = colaboradores.find(c =>
                  c.id !== (userColab?.id || user.id) &&
                  c.tenantId === targetTenant &&
                  (!c.status || c.status === 'ATIVO')
                );
                if (outro) setTrocaColegaId(outro.id);
                setIsNovaTrocaModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nova Troca de Plantão
            </button>
          </div>

          {trocaFeedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{trocaFeedback}</span>
            </div>
          )}

          {/* Lista de Solicitações de Troca */}
          <div className="space-y-3">
            {solicitacoesTroca.map((tr) => (
              <div key={tr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Troca de Plantão com {tr.colaboradorDestinoNome}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      tr.status === 'APROVADO'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {tr.status === 'APROVADO' ? '✅ Homologado pelo Supervisor' : '⏳ Aguardando Aprovação'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>Você cede: <strong>{tr.dataPlantaoOrigem.split('-').reverse().join('/')}</strong></span>
                    <span>➔</span>
                    <span>Colega cobre: <strong>{tr.dataPlantaoDestino.split('-').reverse().join('/')}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{tr.horarioTurno}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    "{tr.motivo}"
                  </p>

                  <div className={`flex items-center gap-2 text-[11px] font-medium ${tr.validacaoInterjornadaOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                    <ShieldCheck className={`w-3.5 h-3.5 ${tr.validacaoInterjornadaOk ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span>
                      {tr.validacaoInterjornadaOk
                        ? 'Intervalo interjornada de 11h validado e garantido em ambos os dias (CLT Art. 66).'
                        : 'Alerta CLT Art. 66: possível intervalo inferior a 11h — sujeito à validação do gestor.'}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <div>Supervisor: {tr.supervisorDecisorNome || 'Pendente'}</div>
                  <div className="mt-0.5">Enviado em: {tr.criadoEm.split('-').reverse().join('/')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOVA SOLICITAÇÃO DE TROCA DE PLANTÃO */}
      {isNovaTrocaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                Solicitar Troca de Turno / Plantão com Colega
              </h3>
              <button onClick={() => setIsNovaTrocaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Regra CLT Art. 66:</strong> O sistema checa se a troca mantém as 11 horas consecutivas de descanso interjornada para ambos os colaboradores.
              </span>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const colega = colaboradores.find(c => c.id === trocaColegaId);
                if (!colega) return;

                const timesMatch = trocaHorarioTurno.match(/(\d{2}:\d{2}).*?(\d{2}:\d{2})/);
                const startH = timesMatch?.[1] || '08:00';
                const endH = timesMatch?.[2] || '17:00';
                const originStartIso = `${trocaDataOrigem}T${startH}:00-03:00`;
                const originEndIso = `${trocaDataOrigem}T${endH}:00-03:00`;
                const destStartIso = `${trocaDataDestino}T${startH}:00-03:00`;
                const interjornadaCheck = trocaDataDestino >= trocaDataOrigem
                  ? verificarInterjornada11h(originEndIso, destStartIso)
                  : verificarInterjornada11h(`${trocaDataDestino}T${endH}:00-03:00`, originStartIso);

                const swapId = `troca-${Date.now()}`;
                const hojeBrt = getBrasiliaYmd();
                const tenantTarget = userColab?.tenantId || user.tenantId || 'tenant-01';
                const novaTroca: SolicitacaoTrocaTurno = {
                  id: swapId,
                  tenantId: tenantTarget,
                  colaboradorOrigemId: userColab?.id || user.id,
                  colaboradorOrigemNome: user.nome,
                  colaboradorOrigemCpf: user.cpf,
                  colaboradorDestinoId: colega.id,
                  colaboradorDestinoNome: colega.nome,
                  colaboradorDestinoCpf: colega.cpf,
                  departamentoId: userColab?.departamentoId || 'dep-01',
                  departamentoNome: userColab?.departamentoNome || 'Geral',
                  dataPlantaoOrigem: trocaDataOrigem,
                  dataPlantaoDestino: trocaDataDestino,
                  horarioTurno: trocaHorarioTurno,
                  motivo: trocaMotivo.trim() || 'Troca de escala entre colaboradores.',
                  status: 'PENDENTE_SUPERVISOR',
                  validacaoInterjornadaOk: interjornadaCheck.respeitou11Horas,
                  supervisorDecisorNome: userColab?.gestorNome || 'Aguardando Supervisor',
                  criadoEm: hojeBrt
                };

                if (navigator.onLine && bearerToken) {
                  try {
                    await fetch('/api/shift-swaps', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${bearerToken}`
                      },
                      body: JSON.stringify({
                        ...novaTroca,
                        alertaConflito: interjornadaCheck.respeitou11Horas ? null : interjornadaCheck.detalheTexto
                      })
                    });
                  } catch (err) {
                    console.warn('Aviso ao gravar troca via API:', err);
                  }
                } else if (supabase) {
                  try {
                    await supabase.from('shift_swaps').upsert({
                      swap_id: swapId,
                      tenant_id: tenantTarget,
                      solicitante_id: novaTroca.colaboradorOrigemId,
                      solicitante_nome: novaTroca.colaboradorOrigemNome,
                      substituto_id: colega.id,
                      substituto_nome: colega.nome,
                      data_turno_original: trocaDataOrigem,
                      data_turno_compensacao: trocaDataDestino,
                      motivo: novaTroca.motivo,
                      status: 'PENDENTE_SUPERVISOR',
                      regra_clt_ok: interjornadaCheck.respeitou11Horas
                    }, { onConflict: 'swap_id' });
                  } catch (err) {
                    console.warn('Aviso ao gravar troca no Supabase:', err);
                  }
                }

                setSolicitacoesTroca([novaTroca, ...solicitacoesTroca]);
                setIsNovaTrocaModalOpen(false);
                setTrocaMotivo('');
                setTrocaFeedback(`Solicitação de troca com ${colega.nome} enviada para homologação do supervisor!`);
                setTimeout(() => setTrocaFeedback(null), 5000);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Colega para Substituição</label>
                <select
                  aria-label="Colega para Substituição de Turno"
                  value={trocaColegaId}
                  onChange={(e) => setTrocaColegaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {colaboradores
                    .filter(c =>
                      c.id !== (userColab?.id || user.id) &&
                      c.tenantId === (userColab?.tenantId || user.tenantId) &&
                      (!c.status || c.status === 'ATIVO')
                    )
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.cargoTitulo}) - {c.departamentoNome}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Seu Dia a Cobrir</label>
                  <input
                    type="date"
                    value={trocaDataOrigem}
                    onChange={(e) => setTrocaDataOrigem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dia do Colega que Fará</label>
                  <input
                    type="date"
                    value={trocaDataDestino}
                    onChange={(e) => setTrocaDataDestino(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Horário do Turno / Plantão</label>
                <input
                  type="text"
                  value={trocaHorarioTurno}
                  onChange={(e) => setTrocaHorarioTurno(e.target.value)}
                  placeholder="Ex: 07:00 às 19:00 (12h)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Justificativa da Solicitação</label>
                <textarea
                  rows={2}
                  value={trocaMotivo}
                  onChange={(e) => setTrocaMotivo(e.target.value)}
                  placeholder="Motivo da solicitação de troca..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                <span>Status da Análise Prévia:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Descanso de 11h Homologado
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNovaTrocaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs active:scale-95"
                >
                  Confirmar e Enviar para Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA SOLICITAÇÃO DE HORA EXTRA */}
      {isNovaHeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Solicitar Aprovação de Horas Extras ao Gestor
              </h3>
              <button onClick={() => setIsNovaHeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              Sua solicitação será enviada para <strong>{gestorEquipeNome}</strong> para deliberação (CLT Art. 59).
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data:</label>
                  <input
                    type="date"
                    value={dataHeInput}
                    onChange={(e) => setDataHeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minutos Extras:</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    step={15}
                    value={minutosHeInput}
                    onChange={(e) => setMinutosHeInput(Number(e.target.value) || 60)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Equivale a {Math.floor(minutosHeInput / 60)}h {minutosHeInput % 60}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Hora Extra:</label>
                <select
                  value={tipoHeInput}
                  onChange={(e) => setTipoHeInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
                >
                  <option value="NORMAL_50">Dia Útil (Adicional de 50% - CLT Art. 59 § 1º)</option>
                  <option value="FERIADO_100">Feriado ou Descanso Semanal (Adicional 100% - Súmula 146 TST)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa Operacional:</label>
                <textarea
                  rows={3}
                  value={justificativaInput}
                  onChange={(e) => {
                    setJustificativaInput(e.target.value);
                    setHeFormError(null);
                  }}
                  placeholder="Descreva o motivo da prorrogação de jornada (ex: fechamento de release, atendimento a chamado crítico)..."
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              {heFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                  {heFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsNovaHeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarSolicitacaoHe}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar ao Gestor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Ajuste / Envio de Atestado */}
      {isAjusteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-600" />
                Solicitar Ajuste de Ponto ou Anexar Atestado
              </span>
              <button onClick={() => setIsAjusteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Solicitação:</label>
                <select
                  value={ajusteTipoInput}
                  onChange={(e) => setAjusteTipoInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                >
                  <option value="ATESTADO_MEDICO">Atestado Médico / Declaração de Saúde (Abono CLT)</option>
                  <option value="INCLUSAO_PONTO_ESQUECIDO">Inclusão de Ponto Esquecido (Entrada/Saída/Almoço)</option>
                  <option value="JUSTIFICATIVA_CORRECAO">Justificativa de Atraso / Saída Antecipada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Ocorrência:</label>
                  <input
                    type="date"
                    value={ajusteDataInput}
                    onChange={(e) => setAjusteDataInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>

                {ajusteTipoInput !== 'ATESTADO_MEDICO' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Horário a Incluir:</label>
                    <input
                      type="time"
                      value={ajusteHorarioInput}
                      onChange={(e) => setAjusteHorarioInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                    />
                  </div>
                )}

                {ajusteTipoInput === 'ATESTADO_MEDICO' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CID-10 (Opcional):</label>
                    <input
                      type="text"
                      placeholder="Ex: J06.9 ou K04.4"
                      value={ajusteCidInput}
                      onChange={(e) => setAjusteCidInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Anexo do Documento / Atestado (PDF/Imagem):</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAjusteDocInput(file.name);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setAjusteAnexoUrl((evt.target?.result as string) || '');
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nome do arquivo ou descrição (ex: atestado_medico.pdf)"
                  value={ajusteDocInput}
                  onChange={(e) => setAjusteDocInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa ao Gestor/RH:</label>
                <textarea
                  rows={3}
                  value={ajusteJustificativaInput}
                  onChange={(e) => {
                    setAjusteJustificativaInput(e.target.value);
                    setAjusteFormError(null);
                  }}
                  placeholder="Explique o motivo do atestado ou da solicitação de inclusão de ponto..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
                />
              </div>

              {ajusteFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                  {ajusteFormError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsAjusteModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarSolicitacaoAjuste}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar ao RH / Gestor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante Individual */}
      {comprovanteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 font-sans">COMPROVANTE DE PONTO REP-P</span>
              <button onClick={() => setComprovanteModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed">
              <div><strong>EMPREGADOR:</strong> {comprovanteModal.empregadorRazaoSocial}</div>
              <div><strong>CNPJ:</strong> {comprovanteModal.empregadorCnpj}</div>
              <div className="pt-1 border-t border-slate-100">
                <strong>TRABALHADOR:</strong> {comprovanteModal.colaboradorNome}
              </div>
              <div><strong>CPF:</strong> {comprovanteModal.colaboradorCpf}</div>
              <div><strong>MATRÍCULA:</strong> {comprovanteModal.colaboradorMatricula}</div>
              <div className="pt-1 border-t border-slate-100 flex justify-between">
                <span>TIPO:</span>
                <strong>
                  {comprovanteModal.tipoMarcacao === 'ENTRADA' ? '1ª ENTRADA' : comprovanteModal.tipoMarcacao === 'INTERVALO_INICIO' ? 'SAÍDA INTERVALO' : comprovanteModal.tipoMarcacao === 'INTERVALO_FIM' ? 'RETORNO INTERVALO' : '2ª SAÍDA'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>DATA/HORA:</span>
                <strong>{comprovanteModal.dataHoraFormatada} (HLB)</strong>
              </div>
              <div className="flex justify-between">
                <span>NSR:</span>
                <strong className="text-emerald-700">{String(comprovanteModal.nsr).padStart(9, '0')}</strong>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[9px] text-slate-500 break-all">
                <span>HASH SHA-256:</span><br />
                <code>{comprovanteModal.hashSha256}</code>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 text-white font-sans text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE REGISTRO DE PONTO INDIVIDUAL (MOBILE / EXTERNO) */}
      {/* ========================================================= */}
      {isBaterPontoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-y-auto border border-slate-200 shadow-2xl my-auto animate-scaleUp">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Registro de Ponto Individual
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-mono">
                      REP-P
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    {user.nome} • CPF {user.cpf}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBaterPontoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Seletor de Tipo de Ponto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Tipo de Marcação:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ENTRADA', label: '1ª Entrada', icon: Clock },
                    { id: 'INTERVALO_INICIO', label: 'Saída Almoço', icon: Coffee },
                    { id: 'INTERVALO_FIM', label: 'Retorno Almoço', icon: Coffee },
                    { id: 'SAIDA', label: '2ª Saída', icon: Clock }
                  ].map((t) => {
                    const isSelected = tipoPonto === t.id;
                    const jaBatido = batidasHoje.some(b => b.tipoMarcacao === t.id);
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={jaBatido}
                        onClick={() => setTipoPonto(t.id as any)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left relative ${
                          jaBatido 
                            ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 blur-[0.5px] cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${jaBatido ? 'text-slate-300' : isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{t.label}</span>
                        {jaBatido && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] bg-slate-200 text-slate-600 px-1 rounded">OK</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status do GPS / Geofencing */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    Geolocalização em Tempo Real:
                  </span>
                  {gpsLoading ? (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Obtendo GPS...
                    </span>
                  ) : gpsData ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      gpsData.dentroCerca ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {gpsData.dentroCerca ? 'Dentro do Raio Permitido' : (myAllocatedEst.bloquearForaDoRaio !== false ? 'Fora do Raio (Bloqueado)' : 'Trabalho Externo')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      GPS Indisponível
                    </span>
                  )}
                </div>
                {gpsData && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {gpsData.endereco} • Distância base: {gpsData.dist}m
                  </p>
                )}
                {gpsError && (
                  <p className="text-[10px] text-rose-700 font-medium">
                    {gpsError}
                  </p>
                )}
              </div>

              {/* Seletor de Método de Autenticação (Facial vs Token/PIN para Recém-contratados) */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('FACIAL');
                    if (!tokenValidated && bioState === 'verified') setBioState('idle');
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMethod === 'FACIAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ScanFace className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reconhecimento Facial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('TOKEN_PIN')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    authMethod === 'TOKEN_PIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Token / PIN (Empresa)</span>
                </button>
              </div>

              {/* MODO 1: RECONHECIMENTO FACIAL */}
              {authMethod === 'FACIAL' && (
                <>
                  {/* Câmera Frontal e Enquadramento */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-800 shadow-inner">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                    <canvas ref={bioCanvasRef} className="hidden" />

                    {/* Guia Oval Facial */}
                    <div className={`absolute w-44 h-56 rounded-[50%] border-2 pointer-events-none transition-colors z-20 ${
                      bioState === 'verified'
                        ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                        : bioState === 'rejected'
                        ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                        : 'border-white/50 border-dashed'
                    }`}>
                      {/* Efeito de Scanner Animado (biometric-modal-scanner-circle) */}
                      <div className={`absolute inset-0 rounded-[50%] opacity-30 ${
                        bioState === 'verified' ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
                      } biometric-modal-scanner-circle`}></div>
                    </div>

                    {/* Contador Regressivo 3s */}
                    {biometricCountdown !== null && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                        <div className="flex flex-col items-center">
                          <span className="text-7xl font-black text-white animate-ping drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                            {biometricCountdown}
                          </span>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-2 bg-indigo-600 px-2 py-0.5 rounded shadow-lg">
                            Prepare-se para o ponto
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instrução Dinâmica de Liveness após o Contador */}
                    {currentLiveness && !livenessConfirmed && biometricCountdown === null && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-amber-950/40 backdrop-blur-[1px] p-4 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl border-2 border-white/20 animate-bounce">
                          <span className="text-sm font-black uppercase tracking-tight">
                            {currentLiveness.actionPrompt}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-100 font-bold mt-3 max-w-[180px] drop-shadow-md">
                          {currentLiveness.instruction}
                        </span>
                      </div>
                    )}

                    {/* Badge de Status Biométrica */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-center space-y-1.5 z-30">
                      <p className="text-[11px] font-semibold text-white truncate">
                        {bioMsg}
                      </p>
                      {(bioState === 'detecting' || bioState === 'verified') && (
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${bioState === 'verified' ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                            style={{ width: `${bioState === 'verified' ? 100 : bioProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prova de Vida Ativa (Liveness Challenge) */}
                  {currentLiveness && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Prova de Vida Ativa Obrigatória
                        </span>
                        {livenessConfirmed && (
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-950 font-medium">
                        {currentLiveness.instruction}
                      </p>
                      {!livenessConfirmed && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentLiveness) return;
                            const evalRes = evaluateLivenessMotion(currentLiveness.id, livenessSamplesRef.current);
                            if (!evalRes.passed) {
                              setLivenessConfirmed(false);
                              setBioMsg(evalRes.message);
                              return;
                            }
                            livenessScoreMeasuredRef.current = evalRes.score;
                            setLivenessConfirmed(true);
                            setBiometricCountdown(null);
                            handleValidateFace(true);
                          }}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          Confirmar que realizei a ação e Validar Face
                        </button>
                      )}
                    </div>
                  )}

                  {/* Aviso de Auto-Cadastro Facial para quem ainda não tem foto */}
                  {!hasEnrolledBiometry && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                      <span className="text-amber-900 font-semibold">
                        Você ainda não cadastrou sua biometria facial no sistema.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsBaterPontoModalOpen(false);
                            setIsEnrollFaceModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer whitespace-nowrap"
                        >
                          Cadastrar Minha Face Agora
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMethod('TOKEN_PIN')}
                          className="font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer whitespace-nowrap"
                        >
                          Usar PIN (1º dia)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* MODO 2: TOKEN / PIN CORPORATIVO (RECÉM-CONTRATADOS OU CONTINGÊNCIA) */}
              {authMethod === 'TOKEN_PIN' && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3.5 border border-slate-800 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Validação por Token / PIN da Empresa</h4>
                      <p className="text-[10px] text-slate-400">Recém-contratados & Contingência REP-P (Válido 1º dia)</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Insira o <strong>PIN ou Token</strong> fornecido pelo RH para o 1º dia de registro antes do cadastro facial:
                  </p>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Token / PIN de Validação:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        maxLength={8}
                        placeholder="Digite seu PIN"
                        value={tokenPinInput}
                        onChange={(e) => setTokenPinInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-400 placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleValidateTokenPin}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                      >
                        Validar PIN
                      </button>
                    </div>
                  </div>

                  {tokenErrorMsg && (
                    <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{tokenErrorMsg}</span>
                    </div>
                  )}

                  {tokenValidated && (
                    <div className="p-3 bg-emerald-950/90 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <div>
                        <strong className="block text-white font-bold">PIN de Contingência Autenticado!</strong>
                        <span className="text-[10px] text-emerald-300">Ponto liberado para confirmação.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pontoModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pontoModalError}</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-2 pt-1">
                {bioState !== 'verified' ? (
                  authMethod === 'FACIAL' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasEnrolledBiometry) {
                          setIsBaterPontoModalOpen(false);
                          setIsEnrollFaceModalOpen(true);
                        } else {
                          handleValidateFace(false);
                        }
                      }}
                      disabled={bioState === 'detecting'}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>
                        {!hasEnrolledBiometry
                          ? 'Cadastrar Minha Face Primeiro'
                          : bioState === 'detecting'
                          ? `Validando Face (${bioProgress}%)...`
                          : bioState === 'rejected'
                          ? 'Tentar Validação Facial Novamente'
                          : 'Validar Minha Face Agora'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleValidateTokenPin}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                      <span>Validar PIN / Token da Empresa</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleExecutarPontoIndividual}
                    disabled={isSubmittingPunch}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md animate-pulse active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isSubmittingPunch ? 'Gravando no Servidor REP-P...' : 'CONFIRMAR E REGISTRAR MEU PONTO'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUTO-CADASTRO FACIAL DO COLABORADOR */}
      {isEnrollFaceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                  <ScanFace className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Auto-Cadastro de Biometria Facial</h3>
                  <p className="text-[10px] text-slate-300">Padrão ISO 19794-5 · Criptografia AES-256 (LGPD)</p>
                </div>
              </div>
              <button
                onClick={() => !isEnrollingFace && setIsEnrollFaceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border-2 border-slate-800">
                <video
                  ref={enrollVideoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={enrollCanvasRef} className="hidden" />
                <div className="absolute w-44 h-56 rounded-[50%] border-2 border-dashed border-emerald-400/80 pointer-events-none" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/90 px-3 py-2 rounded-xl border border-white/10 text-center space-y-1.5">
                  <p className="text-[11px] font-semibold text-white truncate">{enrollStatusMsg}</p>
                  {enrollProgress > 0 && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${enrollProgress}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900">
                <strong>Consentimento Biométrico (LGPD):</strong> Sua geometria facial será convertida em vetor matemático criptografado exclusivamente para validação de ponto eletrônico.
              </div>

              {enrollError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                  {enrollError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isEnrollingFace}
                  onClick={() => setIsEnrollFaceModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isEnrollingFace}
                  onClick={handleEnrollOwnFace}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isEnrollingFace ? `Capturando (${enrollProgress}%)...` : 'Capturar e Salvar Minha Face'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
