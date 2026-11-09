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

export default function App() {
  const { session, supabase } = useAuth();
  const [testFeedback, setTestFeedback] = useState<{ loading: boolean; message: string | null; success?: boolean }>({ loading: false, message: null });

  const handleTestSupabase = async () => {
    setTestFeedback({ loading: true, message: 'Testando conexão com Supabase...' });
    const start = Date.now();
    try {
      const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true });
      const latency = Date.now() - start;
      if (error && error.code !== 'PGRST116') {
        const res = await fetch('/api/status');
        const statusData = await res.json();
        if (statusData.supabaseConnected) {
          setTestFeedback({ 
            loading: false, 
            success: true, 
            message: `Supabase Ativo e Conectado via Backend! Latência: ${latency}ms` 
          });
        } else {
          setTestFeedback({ 
            loading: false, 
            success: false, 
            message: `Aviso Supabase: ${error.message}` 
          });
        }
      } else {
        setTestFeedback({ 
          loading: false, 
          success: true, 
          message: `Conexão Cloud Segura Confirmada! (${latency}ms) — Servidor Ativo` 
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
  // Estado de Autenticação: Inicializa deslogado (null) para exibir a tela de login
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'operational' | 'colaborador' | 'welcome' | 'spec' | 'prototype' | 'legal' | 'plan'>('colaborador');
  const [prototypeTargetScreen, setPrototypeTargetScreen] = useState<string>('adm-02');

  // Enforce colaborador view for non-super-admins (unless viewing welcome guide)
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      if (activeView !== 'welcome') {
        setActiveView('colaborador');
      }
    }
  }, [currentUser]);
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

  // Carregar dados iniciais do Supabase de forma resiliente
  React.useEffect(() => {
    async function fetchGlobalData() {
      try {
        const { data: colabs } = await supabase.from('collaborators').select('*');
        if (colabs && colabs.length > 0) {
          let contactsMap: Record<string, any> = {};
          if (typeof window !== 'undefined') {
            try {
              contactsMap = JSON.parse(localStorage.getItem('sc_all_colab_contacts') || '{}');
            } catch (_) {}
          }

          setColaboradores(colabs.map(c => {
            const cleanCpf = (c.cpf || '').replace(/\D/g, '');
            let parsedEmail = c.email || '';
            let parsedTelefone = c.telefone || '';

            // 1. Tentar extrair do biometric_template (que armazena JSON com email e telefone de auto-cadastros)
            if (c.biometric_template) {
              try {
                const bioData = typeof c.biometric_template === 'string' ? JSON.parse(c.biometric_template) : c.biometric_template;
                if (bioData && typeof bioData === 'object') {
                  if (bioData.email && !parsedEmail) parsedEmail = bioData.email;
                  if (bioData.telefone && !parsedTelefone) parsedTelefone = bioData.telefone;
                }
              } catch (_) {}
            }

            // 2. Tentar recuperar do localStorage caso tenha sido registrado no mesmo browser
            if (typeof window !== 'undefined') {
              try {
                const specificMeta = localStorage.getItem(`sc_colab_meta_${cleanCpf}`);
                if (specificMeta) {
                  const metaObj = JSON.parse(specificMeta);
                  if (metaObj.email && !parsedEmail) parsedEmail = metaObj.email;
                  if (metaObj.telefone && !parsedTelefone) parsedTelefone = metaObj.telefone;
                }
                const mappedContact = contactsMap[cleanCpf] || contactsMap[c.cpf];
                if (mappedContact) {
                  if (mappedContact.email && !parsedEmail) parsedEmail = mappedContact.email;
                  if (mappedContact.telefone && !parsedTelefone) parsedTelefone = mappedContact.telefone;
                }
              } catch (_) {}
            }

            return {
              id: c.collaborator_id || c.id,
              tenantId: c.tenant_id || 'tenant-01',
              nome: c.nome,
              cpf: c.cpf,
              matricula: c.matricula || 'MAT-001',
              pis: c.pis || '000.00000.00-0',
              dataAdmissao: c.data_admissao || '2024-01-01',
              cargoId: c.cargo_id || 'crg-01',
              cargoTitulo: c.cargo_titulo || 'Colaborador',
              departamentoId: c.departamento_id || 'dep-01',
              departamentoNome: c.departamento_nome || 'Geral',
              gestorId: c.gestor_id || 'colab-admin',
              gestorNome: c.gestor_nome || 'Administrador',
              estabelecimentoId: c.estabelecimento_id || 'est-01',
              estabelecimentoNome: c.estabelecimento_nome || 'Matriz',
              regime: (c.regime as any) || 'REGULAR',
              horarioInicio: c.horario_inicio || '08:00',
              horarioFim: c.horario_fim || '17:00',
              cargaHorariaDiariaHoras: Number(c.carga_horaria_diaria) || 8,
              intervaloMinutos: Number(c.intervalo_minutos) || 60,
              maxMinutosAntecedenciaPermitido: Number(c.max_minutos_antecedencia) || 15,
              regraAntecedenciaAtiva: c.regra_antecedencia_ativa ?? true,
              pinColetor: c.pin_coletor || '123456',
              status: (c.status as any) || 'ATIVO',
              biometriaCadastrada: Boolean(c.biometric_template || c.biometria_cadastrada || c.biometria_hash_template || (typeof window !== 'undefined' && localStorage.getItem(`sc_bio_${c.collaborator_id}`))),
              biometriaHashTemplate: c.biometric_template || c.biometria_hash_template || 'ISO19794-5:AES-256',
              limiarConfiancaMinimo: Number(c.limiar_confianca_minimo) || 95.0,
              email: parsedEmail,
              telefone: parsedTelefone
            };
          }));
        }

        const { data: ests } = await supabase.from('establishments').select('*');
        if (ests && ests.length > 0) {
          setEstabelecimentos(ests.map(e => ({
            id: e.establishment_id || e.id,
            tenantId: e.tenant_id,
            nome: e.nome,
            cnpj: e.cnpj,
            codigo: (e.establishment_id || '').split('-')[0] || 'EST',
            tipo: 'MATRIZ',
            fusoHorario: e.fuso_horario || '-0300',
            cidade: e.cidade || 'São Paulo',
            uf: e.uf || 'SP',
            municipio: e.municipio || e.cidade || 'São Paulo',
            enderecoCompleto: e.endereco_completo || 'Av. Paulista, 1000 - Bela Vista',
            latitude: Number(e.latitude) || -23.5615,
            longitude: Number(e.longitude) || -46.6559,
            cercaRaioMetros: Number(e.cerca_raio_metros) || 100,
            bloquearForaDoRaio: Boolean(e.bloquear_fora_do_raio)
          })));
        }

        const { data: pontos } = await supabase.from('point_registrations').select('*').order('created_at', { ascending: false });
        if (pontos && pontos.length > 0) {
          setRegistros(pontos.map(p => {
            const parsed = p.detalhes ? (typeof p.detalhes === 'string' ? JSON.parse(p.detalhes) : p.detalhes) : {};
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
              dataHoraFormatada: parsed.dataHoraFormatada || new Date(p.data_hora).toLocaleString('pt-BR'),
              fusoHorario: '-0300',
              coletorId: parsed.coletorId || 'COL-MOBILE',
              tipoMarcacao: p.tipo_marcacao,
              hashSha256: p.hash_sha256 || 'HASH_DEFAULT'
            };
          }));
        }

        const { data: sigs } = await supabase.from('point_signatures').select('*').order('created_at', { ascending: false });
        if (sigs && sigs.length > 0) {
          setAssinaturasEspelho(sigs.map(s => ({
            id: s.id,
            tenantId: s.tenant_id,
            colaboradorId: s.collaborator_id,
            colaboradorNome: '', // Will be matched via ID if needed, but PortalColaborador filters by CPF
            colaboradorCpf: '', // Need to ensure we have CPF or filter by ID
            mesAno: s.mes_ano,
            dataHoraAssinatura: s.data_hora_assinatura,
            hashAssinaturaSha256: s.hash_assinatura_sha256,
            ipAddress: s.ip_address || '',
            dispositivoInfo: s.dispositivo_info || '',
            rubricaDataUrl: s.rubrica_data_url || '',
            status: s.status as any
          })));
        }

        const { data: adjs } = await supabase.from('adjustment_requests').select('*').order('created_at', { ascending: false });
        if (adjs && adjs.length > 0) {
          setSolicitacoesAjuste(adjs.map(a => {
            const details = a.detalhes ? (typeof a.detalhes === 'string' ? JSON.parse(a.detalhes) : a.detalhes) : {};
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
              dataHoraEnvio: a.data_hora_envio,
              justificativa: a.justificativa,
              status: a.status as any,
              respostaGestor: a.resposta_gestor,
              dataDecisao: a.data_decisao
            };
          }));
        }
      } catch (e) {
        console.warn('Carregamento inicial Supabase aviso:', e);
      }
    }
    fetchGlobalData();
  }, [supabase]);

  // Sync currentUser with session metadata if session exists
  React.useEffect(() => {
    if (session && session.user && !currentUser) {
      const meta = session.user.user_metadata;
      const isSuper = session.user.email === 'admin@softcase.com.br' || session.user.email === 'edsonfreire.santos@hotmail.com';
      setCurrentUser({
        id: session.user.id,
        nome: meta.nome || 'Usuário Supabase',
        email: session.user.email || '',
        cpf: meta.cpf || '',
        role: isSuper ? 'SUPER_ADMIN' : 'COLABORADOR',
        roleLabel: isSuper ? 'Super Administrador Softcase' : 'Colaborador CLT',
        tenantId: meta.tenantId || 'tenant-01',
        tenantNome: meta.tenantNome || 'Empresa',
        mfaHabilitado: false
      });
    }
  }, [session, currentUser]);

  // Se o usuário não está autenticado, renderiza a tela de login robusta
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user, redirectView) => {
          setCurrentUser(user);
          setActiveView(redirectView);
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
               <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">Control Point</h1>
               <span className="text-[9px] font-semibold text-emerald-600 tracking-wider uppercase">REP-P Secure</span>
             </div>
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {currentUser.role === 'SUPER_ADMIN' ? (
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
                    <button onClick={() => setOperationalTab('relatorios')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'relatorios' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Atrasos & Descontos
                    </button>
                    <button onClick={() => setOperationalTab('equipes')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'equipes' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Equipes & Gestores
                    </button>
                    <button onClick={() => setOperationalTab('coletor')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'coletor' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Coletor Tablet REP-P
                    </button>
                    <button onClick={() => setOperationalTab('biometria')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'biometria' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Biometria Facial
                    </button>
                    <button onClick={() => setOperationalTab('ipa')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'ipa' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · IPA & Premiações (Scoring)
                    </button>
                    <button onClick={() => setOperationalTab('feriados')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'feriados' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Feriados & DSR
                    </button>
                    <button onClick={() => setOperationalTab('empresa')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'empresa' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Colaboradores & RH
                    </button>
                    <button onClick={() => setOperationalTab('estrutura')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'estrutura' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Estrutura (Deptos/Cargos)
                    </button>
                    <button onClick={() => setOperationalTab('permissoes')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'permissoes' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Matriz de Permissões
                    </button>
                    <button onClick={() => setOperationalTab('registros')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'registros' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Registros & AFD Fiscal
                    </button>
                    <button onClick={() => setOperationalTab('tenants')} className={`w-full text-left px-2 py-1 rounded-md transition-colors ${operationalTab === 'tenants' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                      · Painel Multi-tenant
                    </button>
                  </div>
                )}
              </div>

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
              <span className="lg:hidden text-lg font-bold">Control Point</span>
              <div className="hidden lg:block">
                 <span className="text-sm font-medium text-slate-500">
                   {currentUser.role === 'SUPER_ADMIN' 
                     ? (activeView === 'operational' ? 'Painel Administrativo' : 'Portal Colaborador') 
                     : 'Portal do Colaborador (Meu Espelho)'}
                 </span>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto shrink-0">
                {currentUser.role === 'SUPER_ADMIN' && (
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
                  onClick={() => setCurrentUser(null)} 
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
          {(currentUser.role === 'SUPER_ADMIN' && activeView === 'operational') && (
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
                // Persiste a mudança de status/resposta no Supabase
                const alterado = novas.find(n => {
                  const anterior = solicitacoesAjuste.find(s => s.id === n.id);
                  return anterior && JSON.stringify(n) !== JSON.stringify(anterior);
                });
                if (alterado) {
                  try {
                    const token = session?.access_token || localStorage.getItem('sc_supabase_anon') || '';
                    await fetch('/api/save-adjustment', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
            />
          )}

          {(((currentUser.role !== 'SUPER_ADMIN' && activeView !== 'welcome') || activeView === 'colaborador')) && (
            <PortalColaborador
              user={currentUser}
              registros={registros}
              feriados={feriados}
              horasExtras={horasExtras}
              onAddHoraExtra={(nova) => setHorasExtras([nova, ...horasExtras])}
              solicitacoesAjuste={solicitacoesAjuste}
              onAddSolicitacaoAjuste={async (nova) => {
                setSolicitacoesAjuste([nova, ...solicitacoesAjuste]);
                try {
                  const token = session?.access_token || localStorage.getItem('sc_supabase_anon') || '';
                  await fetch('/api/save-adjustment', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
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
                  const token = session?.access_token || localStorage.getItem('sc_supabase_anon') || '';
                  await fetch('/api/save-signature', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(nova)
                  });
                } catch (err) {
                  console.error('Erro ao persistir assinatura:', err);
                }
              }}
              onRegistrarPonto={() => {
                if (currentUser.role === 'SUPER_ADMIN') {
                  setOperationalTab('coletor');
                  setActiveView('operational');
                }
              }}
              onAddRegistroPonto={(novo) => setRegistros([novo, ...registros])}
              estabelecimentos={estabelecimentos}
              colaboradores={colaboradores}
              onOpenGuia={() => setActiveView('welcome')}
            />
          )}

          {activeView === 'welcome' && (
            <GuiaBoasVindas
              initialAudience={currentUser.role === 'SUPER_ADMIN' ? 'rh' : 'colaborador'}
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

          {(currentUser.role === 'SUPER_ADMIN' && activeView === 'spec') && (
            <SpecificationReader onSelectScreenForPrototype={handleOpenPrototypeForScreen} />
          )}

          {(currentUser.role === 'SUPER_ADMIN' && activeView === 'prototype') && (
            <InteractivePrototype initialScreenId={prototypeTargetScreen} />
          )}

          {(currentUser.role === 'SUPER_ADMIN' && activeView === 'legal') && <LegalMatrixViewer />}

          {(currentUser.role === 'SUPER_ADMIN' && activeView === 'plan') && <ProjectPlanViewer />}
        </main>

        {/* Footer */}
        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <strong>Control Point</strong> — Sistema de Registro Eletrônico de Ponto (REP-P / PTRP) conforme Portaria MTP nº 671/2021.
            </div>
            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>Sessão: {currentUser.nome} ({currentUser.roleLabel})</span>
              <span>·</span>
              <button
                onClick={() => setCurrentUser(null)}
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
        {currentUser.role === 'SUPER_ADMIN' ? (
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

            {/* 3. Férias & Afastamentos */}
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

            {/* 4. Colaboradores / RH */}
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
              {currentUser.role === 'SUPER_ADMIN' ? (
                <>
                  {/* Seção 1: Operação e Controle de Ponto */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Operação & Controle de Ponto
                    </span>
                    <div className="grid grid-cols-2 gap-2">
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
                    </div>
                  </div>

                  {/* Seção 2: Gestão de Pessoas & Escalas */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                      Gestão de Pessoas, Escalas & CLT
                    </span>
                    <div className="grid grid-cols-2 gap-2">
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
                    </div>
                  </div>

                  {/* Seção 3: Fiscal, TI & Multi-tenant */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      Fiscal, Integrações & Totem
                    </span>
                    <div className="grid grid-cols-2 gap-2">
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
                  onClick={() => {
                    setCurrentUser(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/70 text-rose-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>

              {currentUser.role === 'SUPER_ADMIN' && (
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
    </div>
  );
}
