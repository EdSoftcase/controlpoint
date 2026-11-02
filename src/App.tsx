import React, { useState } from 'react';
import { AuthUser, PRESET_USERS } from './types/auth';
import { LoginScreen } from './components/LoginScreen';
import { OperationalApp } from './components/OperationalApp';
import { PortalColaborador } from './components/PortalColaborador';
import { SpecificationReader } from './components/SpecificationReader';
import { InteractivePrototype } from './components/InteractivePrototype';
import { LegalMatrixViewer } from './components/LegalMatrixViewer';
import { ProjectPlanViewer } from './components/ProjectPlanViewer';
import { 
  INITIAL_REGISTROS, 
  INITIAL_FERIADOS, 
  INITIAL_DEPARTAMENTOS, 
  INITIAL_COLABORADORES, 
  INITIAL_HORAS_EXTRAS,
  INITIAL_OCORRENCIAS_DESCONTO,
  INITIAL_SOLICITACOES_AJUSTE,
  INITIAL_ASSINATURAS_ESPELHO,
  INITIAL_ESTABELECIMENTOS
} from './data/operationalStore';
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
  Menu
} from 'lucide-react';

export default function App() {
  // Estado de Autenticação: Inicializa deslogado (null) para exibir a tela de login
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'operational' | 'colaborador' | 'spec' | 'prototype' | 'legal' | 'plan'>('operational');
  const [prototypeTargetScreen, setPrototypeTargetScreen] = useState<string>('adm-02');
  // Estado do Menu Hambúrguer Responsivo (Mobile & Tablet)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [operationalTab, setOperationalTab] = useState<'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'registros' | 'feriados' | 'tenants'>('relatorios');

  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(INITIAL_ESTABELECIMENTOS);
  const [departamentos, setDepartamentos] = useState<Departamento[]>(INITIAL_DEPARTAMENTOS);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(INITIAL_COLABORADORES);
  const [registros, setRegistros] = useState<RegistroPontoREPP[]>(INITIAL_REGISTROS);
  const [horasExtras, setHorasExtras] = useState<SolicitacaoHoraExtra[]>(INITIAL_HORAS_EXTRAS);
  const [feriados, setFeriados] = useState<Feriado[]>(INITIAL_FERIADOS);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaDesconto[]>(INITIAL_OCORRENCIAS_DESCONTO);
  const [solicitacoesAjuste, setSolicitacoesAjuste] = useState<SolicitacaoAjustePonto[]>(INITIAL_SOLICITACOES_AJUSTE);
  const [assinaturasEspelho, setAssinaturasEspelho] = useState<AssinaturaEspelhoPonto[]>(INITIAL_ASSINATURAS_ESPELHO);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Bar Contract: Zone 1 (Wordmark & Session) — Zone 2 (Navigation) — Zone 3 (Profile & Primary Action) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Softcase Ponto
            </span>
            <span className="hidden lg:inline-block text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
              REP-P & PTRP Ativo
            </span>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
            {currentUser.role !== 'COLABORADOR' ? (
              <button
                onClick={() => setActiveView('operational')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  activeView === 'operational'
                    ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                Executar Sistema
              </button>
            ) : (
              <button
                onClick={() => setActiveView('colaborador')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  activeView === 'colaborador'
                    ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Meu Espelho de Ponto
              </button>
            )}

            <button
              onClick={() => setActiveView('spec')}
              className={`transition-colors py-1 ${
                activeView === 'spec'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Especificação (Doc 02)
            </button>
            <button
              onClick={() => setActiveView('prototype')}
              className={`transition-colors py-1 ${
                activeView === 'prototype'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simulador & BDD
            </button>
            <button
              onClick={() => setActiveView('legal')}
              className={`transition-colors py-1 ${
                activeView === 'legal'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz Legal 671
            </button>
            <button
              onClick={() => setActiveView('plan')}
              className={`transition-colors py-1 ${
                activeView === 'plan'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plano Geral (Doc 01)
            </button>
          </nav>

          {/* Zone 3: User Session, Export CTA & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User Profile Chip */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {currentUser.nome.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  {currentUser.roleLabel.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={() => setCurrentUser(null)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sair / Trocar de Usuário (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="hidden sm:flex px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Exportar Doc 02
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Abrir Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end lg:hidden">
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
              {currentUser.role !== 'COLABORADOR' ? (
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveView('operational');
                      setOperationalTab('relatorios');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                      activeView === 'operational' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                    Executar Sistema (Painel)
                  </button>

                  {activeView === 'operational' && (
                    <div className="pl-4 space-y-1 border-l-2 border-slate-200 ml-2 my-1">
                      <button onClick={() => { setOperationalTab('relatorios'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'relatorios' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Atrasos & Descontos (M09)
                      </button>
                      <button onClick={() => { setOperationalTab('equipes'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'equipes' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Equipes & Gestores (H.E.)
                      </button>
                      <button onClick={() => { setOperationalTab('coletor'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'coletor' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Coletor Tablet REP-P
                      </button>
                      <button onClick={() => { setOperationalTab('biometria'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'biometria' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Biometria Facial (M02)
                      </button>
                      <button onClick={() => { setOperationalTab('feriados'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'feriados' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Feriados & DSR (M03)
                      </button>
                      <button onClick={() => { setOperationalTab('empresa'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'empresa' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Colaboradores & RH
                      </button>
                      <button onClick={() => { setOperationalTab('registros'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'registros' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Registros & AFD Oficial
                      </button>
                      <button onClick={() => { setOperationalTab('tenants'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs ${operationalTab === 'tenants' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
                        · Painel Multi-tenant
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveView('colaborador');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors flex items-center gap-2 ${
                    activeView === 'colaborador' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  Meu Espelho de Ponto
                </button>
              )}

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
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto space-y-3">
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
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair / Trocar de Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'operational' && (
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
            onUpdateSolicitacoesAjuste={setSolicitacoesAjuste}
            assinaturasEspelho={assinaturasEspelho}
            onUpdateAssinaturasEspelho={setAssinaturasEspelho}
            estabelecimentos={estabelecimentos}
            onUpdateEstabelecimentos={setEstabelecimentos}
            operationalTab={operationalTab}
            onSelectOperationalTab={setOperationalTab}
          />
        )}

        {activeView === 'colaborador' && (
          <PortalColaborador
            user={currentUser}
            registros={registros}
            feriados={feriados}
            horasExtras={horasExtras}
            onAddHoraExtra={(nova) => setHorasExtras([nova, ...horasExtras])}
            solicitacoesAjuste={solicitacoesAjuste}
            onAddSolicitacaoAjuste={(nova) => setSolicitacoesAjuste([nova, ...solicitacoesAjuste])}
            assinaturasEspelho={assinaturasEspelho}
            onAddAssinaturaEspelho={(nova) => setAssinaturasEspelho([nova, ...assinaturasEspelho])}
            onRegistrarPonto={() => {
              setOperationalTab('coletor');
              setActiveView('operational');
            }}
          />
        )}

        {activeView === 'spec' && (
          <SpecificationReader onSelectScreenForPrototype={handleOpenPrototypeForScreen} />
        )}

        {activeView === 'prototype' && (
          <InteractivePrototype initialScreenId={prototypeTargetScreen} />
        )}

        {activeView === 'legal' && <LegalMatrixViewer />}

        {activeView === 'plan' && <ProjectPlanViewer />}
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
              className="text-blue-600 hover:underline"
            >
              Trocar de Usuário (Logout)
            </button>
            <span>·</span>
            <span>Versão 1.0</span>
          </div>
        </div>
      </footer>

      {/* Modal de Exportação do Documento 02 em Markdown */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
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
