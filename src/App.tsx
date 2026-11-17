import React, { useState } from 'react';
import { AuthUser, PRESET_USERS } from './types/auth';
import { LoginScreen } from './components/LoginScreen';
import { OperationalApp } from './components/OperationalApp';
import { PortalColaborador } from './components/PortalColaborador';
import { SpecificationReader } from './components/SpecificationReader';
import { InteractivePrototype } from './components/InteractivePrototype';
import { LegalMatrixViewer } from './components/LegalMatrixViewer';
import { ProjectPlanViewer } from './components/ProjectPlanViewer';
import { GuiaBoasVindas } from './components/GuiaBoasVindas';
// Mock data imports removed to favor Supabase real data fetching in components
import { 
  Departamento, 
  Colaborador, 
  RegistroPontoREPP, 
  Feriado, 
  SolicitacaoHoraExtra,
  OcorrenciaDesconto,
  SolicitacaoAjustePonto,
  AssinaturaEspelhoPonto,
  Estabelecimento
} from './types/operational';
import { generateSpecificationMarkdown } from './utils/markdownExporter';
import { 
  Download, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Play, 
  LogOut, 
  User, 
  ShieldCheck,
  ChevronDown,
  Menu,
  Calendar,
  Settings,
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  CalendarDays,
  Plane,
  Users,
  Grid,
  Tablet,
  ScanFace,
  Award,
  UserCheck,
  Building2,
  Server,
  ShieldAlert,
  Smartphone,
  Globe,
  Paperclip,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from './components/AuthContext';
import { syncBrasiliaClock, formatBrasiliaDate, formatBrasiliaTime } from './utils/brasiliaClock';
import { hasRealBiometricTemplate } from './utils/biometricHelpers';
import { OfflineIndicator, PWAInstallButton } from './components/PWAStatusAndInstall';
import { RolePermissionsMap, DEFAULT_ROLE_PERMISSIONS } from './types/permissions';
import { TAB_PERMISSION_MAP, hasPermission } from './utils/permissionsHelper';

export default function App() {
  const { session, authToken, loading: authLoading, supabase, clearAuthToken } = useAuth();
  const bearerToken = session?.access_token || authToken || '';
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(DEFAULT_ROLE_PERMISSIONS);
  const [globalThreshold, setGlobalThreshold] = useState<number>(82.0);
  const [testFeedback, setTestFeedback] = useState<{ loading: boolean; message: string | null; success?: boolean }>({ loading: false, message: null });

  const handleTestSupabase = async () => {
    setTestFeedback({ loading: true, message: 'Testando conexão com Supabase...' });
    const start = Date.now();
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const statusData = await res.json().catch(() => ({}));
      const latency = Date.now() - start;
      if (res.ok && statusData?.supabaseConnected) {
        setTestFeedback({
          loading: false,
          success: true,
          message: `Conexão Cloud Segura Confirmada! (${latency}ms) — Servidor Ativo`
        });
      } else {
        setTestFeedback({
          loading: false,
          success: false,
          message: 'Backend ativo, porém o banco Supabase não respondeu.'
        });
      }
    } catch (err: any) {
      setTestFeedback({ 
        loading: false, 
        success: false, 
        message: `Falha no teste: ${err?.message || 'Erro de rede'}` 
      });
    }
  };
  // Estado de Autenticação: Inicializa persistido no localStorage
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('sc_current_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'operational' | 'colaborador' | 'welcome' | 'spec' | 'prototype' | 'legal' | 'plan'>(() => {
    try {
      const savedView = localStorage.getItem('sc_active_view');
      if (savedView) return savedView as any;
    } catch {
      // ignore
    }
    return 'colaborador';
  });

  const [prototypeTargetScreen, setPrototypeTargetScreen] = useState<string>('adm-02');

  const updateCurrentUser = (user: AuthUser | null, view?: 'operational' | 'colaborador' | 'welcome' | 'spec' | 'prototype' | 'legal' | 'plan') => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem('sc_current_user', JSON.stringify(user));
        if (view) {
          setActiveView(view);
          localStorage.setItem('sc_active_view', view);
        }
      } else {
        localStorage.removeItem('sc_current_user');
        localStorage.removeItem('sc_active_view');
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    supabase.auth.signOut().catch(() => {});
    updateCurrentUser(null);
    setIsMobileMenuOpen(false);
  };

  React.useEffect(() => {
    syncBrasiliaClock(true);
    const interval = setInterval(() => syncBrasiliaClock(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const isOperatorAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'RH_ADMIN' || currentUser?.role === 'GESTOR';

  // Validar e reidratar sessão autenticada via /api/auth/session ao carregar / recarregar
  React.useEffect(() => {
    if (authLoading) return;
    let active = true;

    async function validateSession() {
      if (!bearerToken) {
        if (!session && currentUser) {
          updateCurrentUser(null);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${bearerToken}` }
        });

        if (res.status === 401 || res.status === 403) {
          if (active) {
            clearAuthToken();
            supabase.auth.signOut().catch(() => {});
            updateCurrentUser(null);
          }
          return;
        }

        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data?.user) return;

        const meta = data.user.user_metadata || {};
        const colab = data.colaborador || null;
        const isSuper = data.user.email === 'admin@softcase.com.br';
        const role = (meta.role as any) || (isSuper ? 'SUPER_ADMIN' : 'COLABORADOR');

        const hydratedUser: AuthUser = {
          id: colab?.id || meta.collaboratorId || data.user.id,
          nome: colab?.nome || meta.nome || currentUser?.nome || 'Usuário',
          email: colab?.email || data.user.email || currentUser?.email || '',
          cpf: colab?.cpf || meta.cpf || currentUser?.cpf || '',
          role,
          roleLabel: meta.roleLabel || currentUser?.roleLabel || (isSuper ? 'Super Administrador Softcase' : role === 'GESTOR' ? 'Gestor de Equipe' : role === 'RH_ADMIN' ? 'RH & Departamento Pessoal' : 'Colaborador CLT'),
          tenantId: colab?.tenantId || meta.tenantId || currentUser?.tenantId || 'tenant-01',
          tenantNome: meta.tenantNome || currentUser?.tenantNome || 'Empresa',
          departamentoNome: colab?.departamentoNome || currentUser?.departamentoNome,
          cargoTitulo: colab?.cargoTitulo || currentUser?.cargoTitulo,
          mfaHabilitado: currentUser?.mfaHabilitado ?? false
        };

        setCurrentUser(hydratedUser);
        try {
          localStorage.setItem('sc_current_user', JSON.stringify(hydratedUser));
        } catch {
          // ignore
        }
        if (colab) {
          setColaboradores(prev => {
            const exists = prev.some(c => c.id === colab.id);
            return exists ? prev.map(c => (c.id === colab.id ? { ...c, ...colab } : c)) : [colab, ...prev];
          });
        }
      } catch {
        // Offline ou falha de rede: mantém cache local sc_current_user para uso PWA offline
      }
    }

    validateSession();
    return () => {
      active = false;
    };
  }, [authLoading, bearerToken, session]);

  // Enforce colaborador view for non-admin/non-gestor users (unless viewing welcome guide)
  React.useEffect(() => {
    if (currentUser && !isOperatorAdmin) {
      if (activeView !== 'welcome') {
        setActiveView('colaborador');
      }
    }
  }, [currentUser, isOperatorAdmin]);

  // Estado do Menu Hambúrguer Responsivo (Mobile & Tablet)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [operationalTab, setOperationalTab] = useState<'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'estrutura' | 'permissoes' | 'registros' | 'feriados' | 'tenants' | 'config' | 'ipa' | 'escalas' | 'afastamentos' | 'exportador' | 'riscos' | 'mobile'>('relatorios');

  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [registros, setRegistros] = useState<RegistroPontoREPP[]>([]);
  const [horasExtras, setHorasExtras] = useState<SolicitacaoHoraExtra[]>([]);
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDesconto[]>([]);
  const [solicitacoesAjuste, setSolicitacoesAjuste] = useState<SolicitacaoAjustePonto[]>([]);
  const [assinaturasEspelho, setAssinaturasEspelho] = useState<AssinaturaEspelhoPonto[]>([]);

  // Redirecionar aba caso RBAC bloqueie acesso
  React.useEffect(() => {
    if (!currentUser || !isOperatorAdmin) return;
    const permKey = TAB_PERMISSION_MAP[operationalTab];
    if (!hasPermission(rolePermissions, currentUser.role, permKey)) {
      setOperationalTab('relatorios');
    }
  }, [currentUser, isOperatorAdmin, operationalTab, rolePermissions]);

  // Carregar dados iniciais via endpoint autenticado /api/bootstrap-data (Server-Side RLS / Multi-Tenant Guard)
  React.useEffect(() => {
    let active = true;

    async function fetchGlobalData() {
      if (!bearerToken) return;
      try {
        const tenantQuery = currentUser?.tenantId ? `?tenantId=${encodeURIComponent(currentUser.tenantId)}` : '';
        const res = await fetch(`/api/bootstrap-data${tenantQuery}`, {
          headers: { Authorization: `Bearer ${bearerToken}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !data?.success) return;

        const mappedColabs: Colaborador[] = Array.isArray(data.colaboradores) ? data.colaboradores : [];
        if (mappedColabs.length > 0) {
          setColaboradores(mappedColabs);
        }

        if (Array.isArray(data.estabelecimentos)) {
          setEstabelecimentos(data.estabelecimentos.map((e: any) => ({
            id: e.establishment_id || e.id,
            tenantId: e.tenant_id,
            nome: e.nome,
            cnpj: e.cnpj,
            codigo: (e.establishment_id || '').split('-')[0] || 'EST',
            tipo: (e.tipo as any) || 'MATRIZ',
            fusoHorario: e.fuso_horario || 'America/Sao_Paulo',
            cep: e.cep || '',
            uf: e.uf || 'SP',
            municipio: e.municipio || e.cidade || 'São Paulo',
            enderecoCompleto: e.endereco_completo || '',
            latitude: e.latitude != null ? Number(e.latitude) : Number.NaN,
            longitude: e.longitude != null ? Number(e.longitude) : Number.NaN,
            cercaRaioMetros: Number(e.cerca_raio_metros) || 100,
            bloquearForaDoRaio: e.bloquear_fora_do_raio ?? true
          })));
        }

        if (Array.isArray(data.departamentos)) {
          setDepartamentos(data.departamentos.map((d: any) => ({
            id: d.department_id || d.id,
            tenantId: d.tenant_id,
            nome: d.nome,
            codigo: d.codigo,
            gestorId: d.gestor_id || '',
            gestorNome: d.gestor_nome || '',
            gestorEmail: d.gestor_email || '',
            horarioInicioPadrao: d.horario_inicio_padrao || '08:00',
            cargaHorariaDiariaHoras: Number(d.carga_horaria_diaria) || 8,
            intervaloMinutos: Number(d.intervalo_minutos) || 60,
            maxMinutosAntecedenciaPermitido: Number(d.max_minutos_antecedencia) ?? 15,
            regraAntecedenciaAtiva: d.regra_antecedencia_ativa ?? true
          })));
        }

        if (Array.isArray(data.feriados)) {
          setFeriados(data.feriados.map((h: any) => ({
            id: h.holiday_id || h.id,
            tenantId: h.tenant_id,
            nome: h.nome,
            data: h.data,
            tipo: h.tipo as any,
            uf: h.uf,
            municipio: h.municipio,
            estabelecimentoId: h.estabelecimento_id,
            recorrenteAnual: Boolean(h.recorrente_anual),
            legislacaoBase: h.legislacao_base || '',
            adicionalHoraExtraPercentual: Number(h.adicional_hora_extra_percentual) || 100,
            geraFolgaCompensatoria: Boolean(h.gera_folga_compensatoria),
            afetaDSR: Boolean(h.afeta_dsr)
          })));
        }

        if (Array.isArray(data.horasExtras)) {
          setHorasExtras(data.horasExtras.map((o: any) => ({
            id: o.request_id || o.id,
            tenantId: o.tenant_id,
            colaboradorId: o.collaborator_id,
            colaboradorNome: o.collaborator_name || '',
            colaboradorCpf: o.collaborator_cpf || '',
            departamentoId: o.departamento_id || '',
            departamentoNome: o.departamento_nome || '',
            gestorId: o.gestor_id || '',
            gestorNome: o.gestor_nome || '',
            destinoAprovacao: o.destino_aprovacao || 'BANCO_HORAS',
            data: o.data,
            horarioContratado: o.horario_contratado || '',
            horarioRealizado: o.horario_realizado || '',
            minutosExtras: Number(o.minutos_extras) || 0,
            horasExtrasFormatadas: o.horas_extras_formatadas || '00:00h',
            tipoHoraExtra: (o.tipo_hora_extra as any) || 'NORMAL_50',
            justificativa: o.justificativa || '',
            status: o.status as any,
            motivoRecusa: o.motivo_recusa,
            dataDecisao: o.data_decisao
          })));
        }

        if (Array.isArray(data.registros)) {
          setRegistros(data.registros.map((p: any) => {
            const parsed = p.detalhes ? (typeof p.detalhes === 'string' ? (() => { try { return JSON.parse(p.detalhes); } catch { return {}; } })() : p.detalhes) : {};
            return {
              nsr: p.nsr,
              tenantId: p.tenant_id,
              empregadorRazaoSocial: parsed.empregadorRazaoSocial || 'Softcase Tecnologia',
              empregadorCnpj: parsed.empregadorCnpj || '00.000.000/0001-91',
              colaboradorId: p.collaborator_id,
              colaboradorNome: parsed.colaboradorNome || 'Colaborador',
              colaboradorCpf: parsed.colaboradorCpf || '',
              colaboradorMatricula: parsed.colaboradorMatricula || '',
              dataHora: p.data_hora,
              dataHoraFormatada: parsed.dataHoraFormatada || `${formatBrasiliaDate(p.data_hora)} ${formatBrasiliaTime(p.data_hora, true)}`,
              fusoHorario: parsed.fusoHorario || '-03:00',
              coletorId: parsed.coletorId || 'COL-MOBILE',
              tipoMarcacao: p.tipo_marcacao,
              hashSha256: p.hash_sha256 || 'HASH_DEFAULT',
              latitude: p.latitude !== null && p.latitude !== undefined ? Number(p.latitude) : parsed.latitude,
              longitude: p.longitude !== null && p.longitude !== undefined ? Number(p.longitude) : parsed.longitude,
              distanciaCentroMetros: parsed.distanciaCentroMetros,
              foraDoRaioGeofence: parsed.foraDoRaioGeofence,
              localizacaoEndereco: parsed.localizacaoEndereco,
              modoDispositivo: p.modo_dispositivo || parsed.modoDispositivo
            };
          }));
        }

        if (Array.isArray(data.assinaturas)) {
          setAssinaturasEspelho(data.assinaturas.map((s: any) => {
            const matchedColab = mappedColabs.find(c => c.id === s.collaborator_id);
            return {
              id: s.id,
              tenantId: s.tenant_id,
              colaboradorId: s.collaborator_id,
              colaboradorNome: matchedColab?.nome || 'Colaborador',
              colaboradorCpf: matchedColab?.cpf || '',
              mesAno: s.mes_ano,
              dataHoraAssinatura: s.data_hora_assinatura,
              hashAssinaturaSha256: s.hash_assinatura_sha256,
              ipAddress: s.ip_address || '',
              dispositivoInfo: s.dispositivo_info || '',
              rubricaDataUrl: s.rubrica_data_url || '',
              status: s.status as any
            };
          }));
        }

        if (Array.isArray(data.ajustes)) {
          setSolicitacoesAjuste(data.ajustes.map((a: any) => {
            const details = a.detalhes ? (typeof a.detalhes === 'string' ? (() => { try { return JSON.parse(a.detalhes); } catch { return {}; } })() : a.detalhes) : {};
            return {
              id: a.request_id,
              tenantId: a.tenant_id,
              colaboradorId: a.collaborator_id,
              colaboradorNome: details.colaboradorNome || 'Colaborador',
              colaboradorCpf: details.colaboradorCpf || '',
              departamentoId: details.departamentoId || '',
              departamentoNome: details.departamentoNome || '',
              gestorId: a.gestor_id || details.gestorId,
              gestorNome: a.gestor_nome || details.gestorNome,
              data: a.data,
              tipo: a.tipo as any,
              horarioAjuste: a.horario_ajuste,
              tipoMarcacaoAjuste: a.tipo_marcacao_ajuste as any,
              cid10: a.cid10,
              nomeDocumentoAnexo: a.nome_documento_anexo,
              anexoUrl: a.anexo_url || details.anexoUrl,
              dataHoraEnvio: a.data_hora_envio,
              justificativa: a.justificativa,
              status: a.status as any,
              respostaGestor: a.resposta_gestor,
              dataDecisao: a.data_decisao
            };
          }));
        }

        if (data.appSettings?.biometric_threshold != null) {
          const parsedThreshold = Number(data.appSettings.biometric_threshold);
          if (!Number.isNaN(parsedThreshold) && parsedThreshold >= 50 && parsedThreshold <= 99.9) {
            setGlobalThreshold(parsedThreshold);
          }
        }

        if (Array.isArray(data.rolePermissions) && data.rolePermissions.length > 0) {
          const merged: RolePermissionsMap = { ...DEFAULT_ROLE_PERMISSIONS };
          for (const row of data.rolePermissions) {
            if (row?.role && Array.isArray(row.permissions)) {
              merged[row.role as keyof RolePermissionsMap] = row.permissions;
            }
          }
          setRolePermissions(merged);
        }
      } catch (e) {
        console.warn('Carregamento inicial bootstrap-data aviso:', e);
      }
    }

    fetchGlobalData();
    return () => {
      active = false;
    };
  }, [bearerToken, currentUser?.tenantId]);

  // Sync currentUser with Supabase Auth session metadata if available
  React.useEffect(() => {
    if (session && session.user && !currentUser) {
      const meta = session.user.user_metadata || {};
      const isSuper = session.user.email === 'admin@softcase.com.br';
      const role = (meta.role as any) || (isSuper ? 'SUPER_ADMIN' : 'COLABORADOR');
      const u: AuthUser = {
        id: meta.collaboratorId || session.user.id,
        nome: meta.nome || 'Usuário',
        email: session.user.email || '',
        cpf: meta.cpf || '',
        role,
        roleLabel: meta.roleLabel || (isSuper ? 'Super Administrador Softcase' : role === 'GESTOR' ? 'Gestor de Equipe' : 'Colaborador CLT'),
        tenantId: meta.tenantId || 'tenant-01',
        tenantNome: meta.tenantNome || 'Empresa',
        mfaHabilitado: false
      };
      updateCurrentUser(u, (role === 'SUPER_ADMIN' || role === 'RH_ADMIN' || role === 'GESTOR') ? 'operational' : 'colaborador');
    }
  }, [session, currentUser]);

  // Se o usuário não está autenticado, renderiza a tela de login robusta
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user, redirectView) => {
          updateCurrentUser(user, redirectView);
        }}
        onCollaboratorRegistered={(novoColab) => {
          setColaboradores(prev => [novoColab, ...prev.filter(c => c.id !== novoColab.id && c.cpf !== novoColab.cpf)]);
        }}
      />
    );
  }

  const handleOpenPrototypeForScreen = (screenId: string) => {
    setPrototypeTargetScreen(screenId);
    setActiveView('prototype');
  };

  const handleCopyMarkdown = () => {
    const md = generateSpecificationMarkdown();
    navigator.clipboard.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleDownloadMarkdownFile = () => {
    const md = generateSpecificationMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SOFTCASE_PONTO_DOCUMENTO_02_ESPECIFICACAO_FUNCIONAL_V1.0.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex antialiased">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
               <ShieldCheck className="w-4 h-4" />
             </div>
             <div>
               <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">Point Control</h1>
               <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase">REP-P Secure</span>
             </div>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {isOperatorAdmin ? (
            <>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveView('operational');
                    if (operationalTab === 'config') setOperationalTab('relatorios');
                  }}
                  className={`w-full text-left transition-colors py-2 px-3 rounded-lg flex items-center justify-between ${
                    activeView === 'operational' && operationalTab !== 'config'
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Play className="w-4 h-4 text-emerald-400" />
                    Executar Painel
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeView === 'operational' ? 'rotate-180' : ''}`} />
                </button>

                {activeView === 'operational' && (
                  <div className="pl-3 py-1 space-y-0.5 border-l-2 border-slate-200 ml-3 text-[11px]">
                    {[
                      { tab: 'relatorios', label: '· Atrasos & Descontos', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'equipes', label: '· Equipes & Gestores', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'coletor', label: '· Coletor Tablet REP-P', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'biometria', label: '· Biometria Facial', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'ipa', label: '· IPA & Premiações (Scoring)', activeCls: 'bg-amber-100 text-amber-900 font-bold' },
                      { tab: 'feriados', label: '· Feriados & DSR', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'empresa', label: '· Colaboradores & RH', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'estrutura', label: '· Estrutura (Deptos/Cargos)', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'permissoes', label: '· Matriz de Permissões', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'registros', label: '· Registros & AFD Fiscal', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' },
                      { tab: 'tenants', label: '· Painel Multi-tenant', activeCls: 'bg-emerald-50 text-emerald-800 font-bold' }
                    ]
                      .filter(item => hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP[item.tab]))
                      .map(item => (
                        <button
                          key={item.tab}
                          onClick={() => setOperationalTab(item.tab as any)}
                          className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === item.tab ? item.activeCls : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['config']) && (
                <button 
                  onClick={() => { setActiveView('operational'); setOperationalTab('config'); }} 
                  className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${
                    activeView === 'operational' && operationalTab === 'config' 
                      ? 'bg-slate-900 text-white font-semibold shadow-lg shadow-emerald-500/10' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                    <Key className="w-4 h-4 text-emerald-500"/> Chaves de Acesso
                </button>
              )}

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (!['welcome', 'spec', 'prototype', 'legal', 'plan'].includes(activeView)) {
                      setActiveView('welcome');
                    }
                  }}
                  className={`w-full text-left transition-colors py-2 px-3 rounded-lg flex items-center justify-between ${
                    ['welcome', 'spec', 'prototype', 'legal', 'plan'].includes(activeView)
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Documentação & Manuais
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${['welcome', 'spec', 'prototype', 'legal', 'plan'].includes(activeView) ? 'rotate-180' : ''}`} />
                </button>

                {['welcome', 'spec', 'prototype', 'legal', 'plan'].includes(activeView) && (
                  <div className="pl-3 py-1 space-y-0.5 border-l-2 border-slate-200 ml-3 text-[11px]">
                    <button 
                      onClick={() => setActiveView('welcome')} 
                      className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                        activeView === 'welcome' 
                          ? 'bg-emerald-50 text-emerald-800 font-bold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        Guia de Boas-Vindas
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">RH & Colab</span>
                    </button>
                    <button onClick={() => setActiveView('spec')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${activeView === 'spec' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Especificação Técnica
                    </button>
                    <button onClick={() => setActiveView('prototype')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${activeView === 'prototype' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Simulador / Protótipo
                    </button>
                    <button onClick={() => setActiveView('legal')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${activeView === 'legal' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Matriz Legal (Portaria 671)
                    </button>
                    <button onClick={() => setActiveView('plan')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${activeView === 'plan' ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Plano Geral do Projeto
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveView('colaborador')}
                className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${
                  activeView === 'colaborador' 
                    ? 'bg-slate-900 text-white font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                Meu Espelho de Ponto
              </button>

              <button
                onClick={() => setActiveView('welcome')}
                className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${
                  activeView === 'welcome' 
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Guia de Boas-Vindas
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Global Actions) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <span className="lg:hidden text-lg font-bold">Point Control</span>
              <div className="hidden lg:block">
                 <span className="text-sm font-medium text-slate-500">
                   {isOperatorAdmin
                     ? (activeView === 'operational' ? 'Painel Administrativo' : 'Portal Colaborador') 
                     : 'Portal do Colaborador (Meu Espelho)'}
                 </span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto shrink-0">
                <PWAInstallButton />
                {isOperatorAdmin && (
                  <>
                    <button 
                      onClick={handleTestSupabase}
                      disabled={testFeedback.loading}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                      title="Testar Conexão em Tempo Real com Supabase"
                    >
                        <Database className={`w-3.5 h-3.5 ${testFeedback.loading ? 'animate-spin' : ''}`} /> 
                        <span className="hidden sm:inline">Testar Supabase</span>
                    </button>

                    <button 
                      onClick={() => setIsExportModalOpen(true)} 
                      className="flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                    >
                        <Download className="w-3.5 h-3.5" /> 
                        <span className="hidden sm:inline">Exportar Doc 02</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setActiveView('welcome')}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0 ${
                    activeView === 'welcome'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Abrir Guia de Boas-Vindas e Manual de Treinamento"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Guia de Boas-Vindas</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block shrink-0"></div>

                <div className="hidden sm:flex flex-col items-end mr-2 shrink-0">
                   <span className="text-[10px] font-bold text-slate-900 leading-none">{currentUser.nome}</span>
                   <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      {currentUser.roleLabel}
                      <span 
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" 
                        title="Supabase Conectado (Persistência Ativa no Schema PostgreSQL)"
                      ></span>
                   </span>
                </div>

                <button 
                  onClick={handleLogout} 
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  title="Sair"
                >
                    <LogOut className="w-4 h-4" />
                </button>
                
                <button 
                  onClick={() => setIsMobileMenuOpen(true)} 
                  className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                  aria-label="Abrir menu"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>
        </header>

        {testFeedback.message && (
          <div className={`px-6 py-2.5 text-xs border-b flex items-center justify-between transition-all ${
            testFeedback.success === false 
              ? 'bg-rose-50 text-rose-800 border-rose-200' 
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
          }`}>
            <div className="flex items-center gap-2">
              {testFeedback.success === false ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
              )}
              <span>{testFeedback.message}</span>
            </div>
            <button 
              onClick={() => setTestFeedback({ loading: false, message: null })}
              className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}


        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
          {(isOperatorAdmin && activeView === 'operational') && (
            <OperationalApp
              currentUser={currentUser}
              departamentos={departamentos}
              onUpdateDepartamentos={setDepartamentos}
              colaboradores={colaboradores}
              onUpdateColaboradores={setColaboradores}
              registrosPonto={registros}
              onUpdateRegistrosPonto={setRegistros}
              horasExtras={horasExtras}
              onUpdateHorasExtras={setHorasExtras}
              feriados={feriados}
              onUpdateFeriados={setFeriados}
              ocorrencias={ocorrencias}
              onUpdateOcorrencias={setOcorrencias}
              solicitacoesAjuste={solicitacoesAjuste}
              onUpdateSolicitacoesAjuste={async (novas) => {
                setSolicitacoesAjuste(novas);
                const alterado = novas.find(n => {
                  const anterior = solicitacoesAjuste.find(s => s.id === n.id);
                  return anterior && JSON.stringify(n) !== JSON.stringify(anterior);
                });
                if (alterado) {
                  try {
                    await fetch('/api/save-adjustment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${bearerToken}` },
                      body: JSON.stringify(alterado)
                    });
                  } catch (err) {
                    console.error('Erro ao persistir alteração de ajuste:', err);
                  }
                }
              }}
              assinaturasEspelho={assinaturasEspelho}
              onUpdateAssinaturasEspelho={setAssinaturasEspelho}
              estabelecimentos={estabelecimentos}
              onUpdateEstabelecimentos={setEstabelecimentos}
              operationalTab={operationalTab}
              onSelectOperationalTab={setOperationalTab}
              rolePermissions={rolePermissions}
              onRolePermissionsChange={setRolePermissions}
              globalThreshold={globalThreshold}
              onThresholdChange={setGlobalThreshold}
            />
          )}

          {(((!isOperatorAdmin && activeView !== 'welcome') || activeView === 'colaborador')) && (
            <PortalColaborador
              user={currentUser}
              registros={registros}
              feriados={feriados}
              horasExtras={horasExtras}
              globalThreshold={globalThreshold}
              onAddHoraExtra={async (nova) => {
                setHorasExtras([nova, ...horasExtras]);
                try {
                  if (bearerToken) {
                    await fetch('/api/save-overtime', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${bearerToken}`
                      },
                      body: JSON.stringify(nova)
                    });
                  }
                } catch (err) {
                  console.warn('Erro ao persistir hora extra:', err);
                }
              }}
              solicitacoesAjuste={solicitacoesAjuste}
              onAddSolicitacaoAjuste={async (nova) => {
                setSolicitacoesAjuste([nova, ...solicitacoesAjuste]);
                try {
                  await fetch('/api/save-adjustment', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${bearerToken}`
                    },
                    body: JSON.stringify(nova)
                  });
                } catch (err) {
                  console.error('Erro ao persistir solicitação:', err);
                }
              }}
              assinaturasEspelho={assinaturasEspelho}
              onAddAssinaturaEspelho={async (nova) => {
                setAssinaturasEspelho([nova, ...assinaturasEspelho]);
                try {
                  await fetch('/api/save-signature', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${bearerToken}`
                    },
                    body: JSON.stringify(nova)
                  });
                } catch (err) {
                  console.error('Erro ao persistir assinatura:', err);
                }
              }}
              onRegistrarPonto={() => {
                if (isOperatorAdmin) {
                  setOperationalTab('coletor');
                  setActiveView('operational');
                }
              }}
              onAddRegistroPonto={(novo) => setRegistros([novo, ...registros])}
              onUpdateColaboradorBiometria={(colabId, updatedFields) => {
                setColaboradores(prev => prev.map(c => c.id === colabId ? { ...c, ...updatedFields } : c));
              }}
              estabelecimentos={estabelecimentos}
              colaboradores={colaboradores}
              onOpenGuia={() => setActiveView('welcome')}
            />
          )}

          {activeView === 'welcome' && (
            <GuiaBoasVindas
              initialAudience={isOperatorAdmin ? 'rh' : 'colaborador'}
              currentUserRole={currentUser.role}
              onNavigateToTab={(tab) => {
                setActiveView('operational');
                setOperationalTab(tab as any);
              }}
              onNavigateToView={(view) => {
                setActiveView(view);
              }}
            />
          )}

          {(isOperatorAdmin && activeView === 'spec') && (
            <SpecificationReader onSelectScreenForPrototype={handleOpenPrototypeForScreen} />
          )}

          {(isOperatorAdmin && activeView === 'prototype') && (
            <InteractivePrototype initialScreenId={prototypeTargetScreen} />
          )}

          {(isOperatorAdmin && activeView === 'legal') && <LegalMatrixViewer />}

          {(isOperatorAdmin && activeView === 'plan') && <ProjectPlanViewer />}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 mt-auto pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <strong>Point Control</strong> — Sistema de Registro Eletrônico de Ponto (REP-P / PTRP) conforme Portaria MTP nº 671/2021.
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>Sessão: {currentUser.nome} ({currentUser.roleLabel})</span>
              <span>·</span>
              <button
                onClick={handleLogout}
                className="text-blue-600 hover:underline font-bold"
              >
                Sair (Logout)
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA (MOBILE & TABLETS)       */}
      {/* ========================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-2 py-1 flex items-center justify-around safe-area-pb">
        {isOperatorAdmin ? (
          <>
            {/* 1. Ponto / Relatórios */}
            <button
              onClick={() => {
                setActiveView('operational');
                setOperationalTab('relatorios');
                setIsMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                activeView === 'operational' && operationalTab === 'relatorios'
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Ponto</span>
              {activeView === 'operational' && operationalTab === 'relatorios' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>

            {/* 2. Escalas */}
            {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['escalas']) && (
              <button
                onClick={() => {
                  setActiveView('operational');
                  setOperationalTab('escalas');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                  activeView === 'operational' && operationalTab === 'escalas'
                    ? 'text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">Escalas</span>
                {activeView === 'operational' && operationalTab === 'escalas' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            )}

            {/* 3. Férias & Afastamentos */}
            {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['afastamentos']) && (
              <button
                onClick={() => {
                  setActiveView('operational');
                  setOperationalTab('afastamentos');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                  activeView === 'operational' && operationalTab === 'afastamentos'
                    ? 'text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plane className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">Férias</span>
                {activeView === 'operational' && operationalTab === 'afastamentos' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            )}

            {/* 4. Colaboradores / RH */}
            {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['empresa']) && (
              <button
                onClick={() => {
                  setActiveView('operational');
                  setOperationalTab('empresa');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                  activeView === 'operational' && operationalTab === 'empresa'
                    ? 'text-emerald-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">Equipe</span>
                {activeView === 'operational' && operationalTab === 'empresa' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
                )}
              </button>
            )}

            {/* 5. Mais Módulos */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
                isMobileMenuOpen || (!['relatorios', 'escalas', 'afastamentos', 'empresa'].includes(operationalTab) || activeView !== 'operational')
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Mais</span>
              {(isMobileMenuOpen || (!['relatorios', 'escalas', 'afastamentos', 'empresa'].includes(operationalTab) || activeView !== 'operational')) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />
              )}
            </button>
          </>
        ) : (
          <>
            {/* Colaborador: Espelho */}
            <button
              onClick={() => {
                setActiveView('colaborador');
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 text-emerald-400 font-bold"
            >
              <FileText className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Espelho</span>
            </button>

            {/* Colaborador: Escala */}
            <button
              onClick={() => {
                setActiveView('colaborador');
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 text-slate-400 hover:text-slate-200"
            >
              <CalendarDays className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Minha Escala</span>
            </button>

            {/* Colaborador: Bater Ponto Flutuante */}
            <button
              onClick={() => {
                setActiveView('colaborador');
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center -mt-5 mx-1"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-2 border-slate-900 active:scale-95 transition-transform">
                <ScanFace className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-1">Ponto</span>
            </button>

            {/* Colaborador: Férias */}
            <button
              onClick={() => {
                setActiveView('colaborador');
                setIsMobileMenuOpen(false);
              }}
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 text-slate-400 hover:text-slate-200"
            >
              <Plane className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Férias CLT</span>
            </button>

            {/* Colaborador: Opções / Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 text-slate-400 hover:text-slate-200"
            >
              <Grid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Opções</span>
            </button>
          </>
        )}
      </nav>

      {/* ========================================================= */}
      {/* BOTTOM SHEET ERGONÔMICO: "TODOS OS MÓDULOS" (MOBILE)      */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-label="Fechar menu"
          />
          <div className="relative z-10 bg-slate-900 border-t border-slate-700/80 rounded-t-3xl max-h-[85vh] w-full flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 text-white">
            {/* Drag Handle Superior */}
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-12 h-1.5 bg-slate-700 hover:bg-slate-500 rounded-full mx-auto mt-3 mb-1 shrink-0 cursor-pointer"
            />

            {/* Header do Bottom Sheet */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white leading-none">Módulos & Navegação RH</h3>
                  <span className="text-[10px] text-slate-400">Toque rápido no módulo desejado</span>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Área Scrollável de Módulos Agrupados */}
            <div className="overflow-y-auto p-4 space-y-5 flex-1">
              {isOperatorAdmin ? (
                <>
                  {/* Seção 1: Operação e Controle de Ponto */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Operação & Controle de Ponto
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['relatorios']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('relatorios');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'relatorios'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Atrasos & Descontos</div>
                            <div className="text-[9px] text-slate-400">Apuração diária</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['coletor']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('coletor');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'coletor'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Tablet className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Coletor Tablet</div>
                            <div className="text-[9px] text-slate-400">Modo Totem REP-P</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['biometria']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('biometria');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'biometria'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ScanFace className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Biometria Facial</div>
                            <div className="text-[9px] text-slate-400">Prova de vida</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['equipes']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('equipes');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'equipes'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Equipes & Gestores</div>
                            <div className="text-[9px] text-slate-400">Aprovação H.E.</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['feriados']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('feriados');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'feriados'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Feriados & DSR</div>
                            <div className="text-[9px] text-slate-400">Reflexo folha</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['ipa']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('ipa');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'ipa'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Award className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">IPA & Premiação</div>
                            <div className="text-[9px] text-slate-400">Assiduidade</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seção 2: Gestão de Pessoas & Escalas */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      Gestão de Pessoas, Escalas & CLT
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['escalas']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('escalas');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'escalas'
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Escalas & 12x36</div>
                            <div className="text-[9px] text-slate-400">Calendário anual</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['afastamentos']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('afastamentos');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'afastamentos'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Plane className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Férias & Atestados</div>
                            <div className="text-[9px] text-slate-400">Controle Art. 134</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['empresa']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('empresa');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'empresa'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Colaboradores & RH</div>
                            <div className="text-[9px] text-slate-400">Cadastro geral</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['estrutura']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('estrutura');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'estrutura'
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Estrutura Deptos</div>
                            <div className="text-[9px] text-slate-400">Cargos e locais</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['permissoes']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('permissoes');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'permissoes'
                              ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Permissões (RBAC)</div>
                            <div className="text-[9px] text-slate-400">Perfis de acesso</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['riscos']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('riscos');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'riscos'
                              ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Riscos & CLT</div>
                            <div className="text-[9px] text-slate-400">Auditoria passivos</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seção 3: Fiscal, TI & Multi-tenant */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      Fiscal, Integrações & Totem
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['registros']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('registros');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'registros'
                              ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <FileText className="w-4 h-4 text-orange-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">AFD & AEJ Fiscal</div>
                            <div className="text-[9px] text-slate-400">Portaria 671</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['exportador']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('exportador');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'exportador'
                              ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Server className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Exportador ERP</div>
                            <div className="text-[9px] text-slate-400">Folha de pagamento</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['mobile']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('mobile');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'mobile'
                              ? 'bg-violet-500/20 border-violet-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-violet-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">App Totem Kiosk</div>
                            <div className="text-[9px] text-slate-400">Modo tablet offline</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['tenants']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('tenants');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'tenants'
                              ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Multi-tenant</div>
                            <div className="text-[9px] text-slate-400">Empresas e filiais</div>
                          </div>
                        </button>
                      )}

                      {hasPermission(rolePermissions, currentUser.role, TAB_PERMISSION_MAP['config']) && (
                        <button
                          onClick={() => {
                            setActiveView('operational');
                            setOperationalTab('config');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`col-span-2 p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            activeView === 'operational' && operationalTab === 'config'
                              ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                              : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <Key className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">Chaves de Conexão Supabase</div>
                            <div className="text-[9px] text-slate-400">Configuração de banco e API</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Seção 4: Documentação e Manuais Técnicos */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      Documentação & Manuais Técnicos
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setActiveView('welcome');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`col-span-2 p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          activeView === 'welcome'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                            : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-slate-800'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            Guia de Boas-Vindas & Manual
                            <span className="text-[9px] px-1 bg-emerald-500/30 text-emerald-300 rounded font-normal">RH & Colab</span>
                          </div>
                          <div className="text-[9px] text-slate-400">Passo a passo interativo e dúvidas</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('spec');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          activeView === 'spec'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white font-bold'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">Especificação</div>
                          <div className="text-[9px] text-slate-400">Doc 02 detalhado</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('prototype');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          activeView === 'prototype'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white font-bold'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">Simulador / BDD</div>
                          <div className="text-[9px] text-slate-400">Cenários de teste</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('legal');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          activeView === 'legal'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white font-bold'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">Matriz Legal 671</div>
                          <div className="text-[9px] text-slate-400">Compliance jurídico</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('plan');
                          setIsMobileMenuOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          activeView === 'plan'
                            ? 'bg-blue-500/20 border-blue-500/50 text-white font-bold'
                            : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">Plano Geral</div>
                          <div className="text-[9px] text-slate-400">Doc 01 do projeto</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Opções para Colaborador */
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Meu Portal de Colaborador
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setActiveView('colaborador');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center gap-2.5"
                    >
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Espelho de Ponto</div>
                        <div className="text-[9px] text-slate-400">Consultar batidas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('colaborador');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center gap-2.5"
                    >
                      <Plane className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Minhas Férias</div>
                        <div className="text-[9px] text-slate-400">Períodos CLT</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('colaborador');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center gap-2.5"
                    >
                      <CalendarDays className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Escala & Turno</div>
                        <div className="text-[9px] text-slate-400">Plantões e folgas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('colaborador');
                        setIsMobileMenuOpen(false);
                      }}
                      className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center gap-2.5"
                    >
                      <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white">Atestados & Ajustes</div>
                        <div className="text-[9px] text-slate-400">Justificativas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('welcome');
                        setIsMobileMenuOpen(false);
                      }}
                      className="col-span-2 p-3 bg-gradient-to-r from-indigo-950/60 to-slate-800/80 border border-indigo-600/50 rounded-xl text-left flex items-center gap-2.5"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          Guia de Boas-Vindas do Colaborador
                          <span className="text-[9px] px-1 bg-indigo-500/30 text-indigo-300 rounded font-normal">Ajuda</span>
                        </div>
                        <div className="text-[9px] text-indigo-200">Como bater ponto, férias e atestados</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Bottom Sheet */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/30">
                    {currentUser.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white leading-none">{currentUser.nome}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{currentUser.roleLabel}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/70 text-rose-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>

              {isOperatorAdmin && (
                <button
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Exportar Especificação Técnica (Markdown)
                </button>
              )}
            </div>
          </div>
        </div>
      )}



      {/* Modal de Exportação do Documento 02 em Markdown */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Documento 02 — Especificação Funcional Oficial (Markdown)
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Documento formatado pronto para inclusão no repositório Git (docs/) ou Notion/Confluence da Softcase.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors flex items-center gap-1.5"
                >
                  {copiedExport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copiar Markdown
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadMarkdownFile}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Baixar Arquivo (.md)
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-950 text-slate-200 select-all whitespace-pre leading-relaxed">
              {generateSpecificationMarkdown()}
            </div>
          </div>
        </div>
      )}
      <OfflineIndicator />
    </div>
  );
}
