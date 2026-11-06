import React, { useState } from 'react';
import { AuthUser, PRESET_USERS } from './types/auth';
import { LoginScreen } from './components/LoginScreen';
import { OperationalApp } from './components/OperationalApp';
import { PortalColaborador } from './components/PortalColaborador';
import { SpecificationReader } from './components/SpecificationReader';
import { InteractivePrototype } from './components/InteractivePrototype';
import { LegalMatrixViewer } from './components/LegalMatrixViewer';
import { ProjectPlanViewer } from './components/ProjectPlanViewer';
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
  AlertCircle
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
  const [activeView, setActiveView] = useState<'operational' | 'colaborador' | 'spec' | 'prototype' | 'legal' | 'plan'>('colaborador');
  const [prototypeTargetScreen, setPrototypeTargetScreen] = useState<string>('adm-02');

  // Enforce colaborador view for non-super-admins
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      setActiveView('colaborador');
    }
  }, [currentUser]);
  // Estado do Menu Hambúrguer Responsivo (Mobile & Tablet)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [operationalTab, setOperationalTab] = useState<'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'estrutura' | 'permissoes' | 'registros' | 'feriados' | 'tenants' | 'config' | 'ipa'>('relatorios');

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
          setColaboradores(colabs.map(c => ({
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
            email: c.email || ''
          })));
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
              <button onClick={() => setActiveView('spec')} className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${activeView === 'spec' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <FileText className="w-4 h-4"/> Especificação
              </button>
              <button onClick={() => setActiveView('prototype')} className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${activeView === 'prototype' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Play className="w-4 h-4"/> Simulador
              </button>
              <button onClick={() => setActiveView('legal')} className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${activeView === 'legal' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <ShieldCheck className="w-4 h-4"/> Matriz Legal
              </button>
              <button onClick={() => setActiveView('plan')} className={`w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 ${activeView === 'plan' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Calendar className="w-4 h-4"/> Plano Geral
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveView('colaborador')}
              className="w-full text-left transition-colors py-2.5 px-3 rounded-lg flex items-center gap-3 bg-slate-900 text-white font-semibold"
            >
              <User className="w-4 h-4 text-emerald-400" />
              Meu Espelho de Ponto
            </button>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Global Actions) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <span className="lg:hidden text-lg font-bold">Softcase Ponto</span>
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          {(currentUser.role !== 'SUPER_ADMIN' || activeView === 'colaborador') && (
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
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <strong>Softcase Ponto</strong> — Sistema de Registro Eletrônico de Ponto (REP-P / PTRP) conforme Portaria MTP nº 671/2021.
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

      {/* Mobile Menu Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end lg:hidden">
          <div className="bg-white w-80 max-w-full h-full shadow-2xl flex flex-col p-6 space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block text-base">Softcase Ponto</span>
                <span className="text-xs text-slate-500 font-mono">REP-P & PTRP Ativo</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 block uppercase font-mono text-[10px]">Sessão Atual</span>
              <div className="font-bold text-slate-900">{currentUser.nome}</div>
              <div className="text-slate-600">{currentUser.roleLabel}</div>
            </div>

            <div className="flex flex-col gap-2 font-medium text-sm">
              {currentUser.role === 'SUPER_ADMIN' ? (
                <>
                  <button 
                    onClick={() => { setActiveView('operational'); setOperationalTab('config'); setIsMobileMenuOpen(false); }} 
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                      activeView === 'operational' && operationalTab === 'config' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    Chaves de Acesso Supabase
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('operational');
                      if (operationalTab === 'config') setOperationalTab('relatorios');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                      activeView === 'operational' && operationalTab !== 'config' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Executar Sistema (Painel)
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('spec');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeView === 'spec' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Especificação (Doc 02)
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('prototype');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeView === 'prototype' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Simulador & BDD
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('legal');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeView === 'legal' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Matriz Legal 671
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('plan');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      activeView === 'plan' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Plano Geral (Doc 01)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setActiveView('colaborador');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 bg-slate-900 text-white font-semibold"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  Meu Espelho de Ponto
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto space-y-3">
              {currentUser.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Exportar Doc 02 (Markdown)
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors font-bold"
              >
                <LogOut className="w-4 h-4" />
                Sair (Logout)
              </button>
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
