import React, { useState, useMemo } from 'react';
import { ScreenSpec } from '../types/specification';
import { SPECIFICATION_SCREENS } from '../data/specificationDoc';
import { 
  Search, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  FileCheck2, 
  Sliders, 
  ShieldAlert, 
  Terminal,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';

interface SpecificationReaderProps {
  onSelectScreenForPrototype?: (screenId: string) => void;
}

export const SpecificationReader: React.FC<SpecificationReaderProps> = ({
  onSelectScreenForPrototype
}) => {
  const [selectedScreenId, setSelectedScreenId] = useState<string>('adm-02');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<'ALL' | 'MOD-01' | 'MOD-02' | 'MOD-03'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'aparencia' | 'campos' | 'botoes' | 'regras' | 'permissoes' | 'erros' | 'comportamentos' | 'testes'
  >('campos');
  const [copiedScreen, setCopiedScreen] = useState(false);

  const filteredScreens = useMemo(() => {
    return SPECIFICATION_SCREENS.filter((screen) => {
      const matchModule =
        selectedModuleFilter === 'ALL' ||
        (selectedModuleFilter === 'MOD-01' && screen.module.includes('Módulo 01')) ||
        (selectedModuleFilter === 'MOD-02' && screen.module.includes('Módulo 02')) ||
        (selectedModuleFilter === 'MOD-03' && screen.module.includes('Módulo 03'));

      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        screen.code.toLowerCase().includes(q) ||
        screen.title.toLowerCase().includes(q) ||
        screen.subtitle.toLowerCase().includes(q) ||
        screen.camposEValidacoes.some((c) => c.name.toLowerCase().includes(q)) ||
        screen.regrasDeNegocio.some((r) => r.rule.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));

      return matchModule && matchQuery;
    });
  }, [selectedModuleFilter, searchQuery]);

  const currentScreen = useMemo(() => {
    return SPECIFICATION_SCREENS.find((s) => s.id === selectedScreenId) || SPECIFICATION_SCREENS[0];
  }, [selectedScreenId]);

  const handleCopyCurrentScreenMarkdown = () => {
    const s = currentScreen;
    let text = `## [${s.code}] ${s.title}\n`;
    text += `Módulo: ${s.module}\n`;
    text += `Base Legal: ${s.legalBasis.join('; ')}\n\n`;
    text += `### 1. Aparência e Organização\n${s.aparenciaOrganizacao.wireframeDescription}\n\n`;
    text += `### 2. Campos e Validações\n`;
    s.camposEValidacoes.forEach((c) => {
      text += `- **${c.name}** (${c.type}): ${c.validationRule} [Obrigatório: ${c.required ? 'Sim' : 'Não'}]\n`;
    });
    text += `\n### 4. Regras de Negócio\n`;
    s.regrasDeNegocio.forEach((r) => {
      text += `- **${r.code} - ${r.title}**: ${r.rule} (Impacto: ${r.legalImpact})\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedScreen(true);
    setTimeout(() => setCopiedScreen(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna de Navegação Lateral das Telas */}
      <div className="lg:col-span-4 space-y-4">
        {/* Barra de Busca e Filtro de Módulo */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tela, campo ou regra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedModuleFilter('ALL')}
              className={`py-1.5 px-2 font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedModuleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({SPECIFICATION_SCREENS.length})
            </button>
            <button
              onClick={() => setSelectedModuleFilter('MOD-01')}
              className={`py-1.5 px-2 font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedModuleFilter === 'MOD-01'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Módulo 01 (4)
            </button>
            <button
              onClick={() => setSelectedModuleFilter('MOD-02')}
              className={`py-1.5 px-2 font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedModuleFilter === 'MOD-02'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Módulo 02 (6)
            </button>
            <button
              onClick={() => setSelectedModuleFilter('MOD-03')}
              className={`py-1.5 px-2 font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedModuleFilter === 'MOD-03'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Módulo 03 (1)
            </button>
          </div>
        </div>

        {/* Lista de Telas */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
          {filteredScreens.map((screen) => {
            const isSelected = screen.id === currentScreen.id;
            return (
              <button
                key={screen.id}
                onClick={() => setSelectedScreenId(screen.id)}
                className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {screen.code}
                    </span>
                    <span
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {screen.module.split('—')[0].trim()}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-semibold leading-tight line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {screen.title}
                  </h4>
                  <p
                    className={`text-[11px] line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {screen.subtitle}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                    isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-300'
                  }`}
                />
              </button>
            );
          })}

          {filteredScreens.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma tela encontrada para os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {/* Coluna Central de Especificação da Tela Selecionada */}
      <div className="lg:col-span-8 space-y-6">
        {/* Header da Tela Especificada */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                  {currentScreen.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentScreen.module}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{currentScreen.title}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">{currentScreen.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCurrentScreenMarkdown}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                title="Copiar especificação desta tela em Markdown"
              >
                {copiedScreen ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copiar Tela
                  </>
                )}
              </button>

              {onSelectScreenForPrototype && (
                <button
                  onClick={() => onSelectScreenForPrototype(currentScreen.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Abrir no Simulador
                </button>
              )}
            </div>
          </div>

          {/* Base Legal */}
          <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Base Regulatória:</span>
            {currentScreen.legalBasis.map((base, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono border border-slate-200"
              >
                {base}
              </span>
            ))}
          </div>
        </div>

        {/* Abas dos 8 Critérios Obrigatórios da Especificação */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab('campos')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'campos'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Campos & Validações ({currentScreen.camposEValidacoes.length})
            </button>
            <button
              onClick={() => setActiveTab('regras')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'regras'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Regras de Negócio ({currentScreen.regrasDeNegocio.length})
            </button>
            <button
              onClick={() => setActiveTab('testes')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'testes'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              8. Critérios de Teste ({currentScreen.criteriosDeTeste.length})
            </button>
            <button
              onClick={() => setActiveTab('aparencia')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'aparencia'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Aparência & Layout
            </button>
            <button
              onClick={() => setActiveTab('botoes')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'botoes'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Botões & Ações ({currentScreen.botoesEAcoes.length})
            </button>
            <button
              onClick={() => setActiveTab('permissoes')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'permissoes'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Permissões RBAC ({currentScreen.permissoes.length})
            </button>
            <button
              onClick={() => setActiveTab('erros')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'erros'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. Mensagens de Erro ({currentScreen.mensagensDeErro.length})
            </button>
            <button
              onClick={() => setActiveTab('comportamentos')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'comportamentos'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7. Comportamentos
            </button>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="p-6">
            {/* 1. APARÊNCIA E ORGANIZAÇÃO */}
            {activeTab === 'aparencia' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-600" />
                    Descrição do Layout & Wireframe Textual
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700">
                    {currentScreen.aparenciaOrganizacao.wireframeDescription}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Zonas da Interface</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentScreen.aparenciaOrganizacao.zones.map((zone, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
                        <span className="text-xs font-semibold text-slate-900 block mb-1">
                          {zone.name}
                        </span>
                        <p className="text-xs text-slate-600 mb-3">{zone.description}</p>
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Elementos em Tela:
                          </span>
                          <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                            {zone.elements.map((el, elIdx) => (
                              <li key={elIdx}>{el}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <span className="font-semibold text-slate-900 block mb-1">Responsividade & Breakpoints:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {currentScreen.aparenciaOrganizacao.gridResponsiveness}
                  </p>
                </div>
              </div>
            )}

            {/* 2. CAMPOS E VALIDAÇÕES */}
            {activeTab === 'campos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-slate-600" />
                    Dicionário de Campos e Regras de Validação
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentScreen.camposEValidacoes.length} campos especificados
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Campo</th>
                        <th className="py-2.5 px-3">Tipo & Máscara</th>
                        <th className="py-2.5 px-3">Obrigatório</th>
                        <th className="py-2.5 px-3">Regra de Validação Estrita</th>
                        <th className="py-2.5 px-3">Impacto no Negócio / Legal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentScreen.camposEValidacoes.map((campo, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">{campo.name}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {campo.type}
                            </span>
                            {campo.mask && (
                              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                                Máscara: {campo.mask}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {campo.required ? (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Sim
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">Opcional</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs">{campo.validationRule}</td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs leading-relaxed">
                            {campo.businessImpact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. BOTÕES E AÇÕES */}
            {activeTab === 'botoes' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-slate-600" />
                  Botões, Gatilhos e Comportamentos Assíncronos
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Rótulo do Botão</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Atalho</th>
                        <th className="py-2.5 px-3">Estado de Loading</th>
                        <th className="py-2.5 px-3">Comportamento e Ação Executada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentScreen.botoesEAcoes.map((btn, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">{btn.label}</td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {btn.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">{btn.shortcut || '-'}</td>
                          <td className="py-3 px-3 text-slate-600">{btn.loadingStateBehavior}</td>
                          <td className="py-3 px-3 text-slate-700">{btn.actionDescription}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. REGRAS DE NEGÓCIO */}
            {activeTab === 'regras' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                    Regras de Negócio e Invariantes do Sistema
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentScreen.regrasDeNegocio.length} regras ativas
                  </span>
                </div>

                <div className="space-y-3">
                  {currentScreen.regrasDeNegocio.map((regra, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                            {regra.code}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{regra.title}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            regra.invarianceLevel === 'CRITICAL'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Invariante {regra.invarianceLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mb-2.5">{regra.rule}</p>

                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                        <span className="font-semibold text-slate-700 shrink-0">Impacto Legal:</span>
                        <span>{regra.legalImpact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. PERMISSÕES RBAC */}
            {activeTab === 'permissoes' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Matriz de Acesso Baseada em Papéis (RBAC)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Perfil de Usuário</th>
                        <th className="py-2.5 px-3">Nível de Acesso</th>
                        <th className="py-2.5 px-3">Descrição do Privilégio Operacional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentScreen.permissoes.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">{p.role}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                                p.accessLevel === 'TOTAL'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : p.accessLevel === 'CONSULTA'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : p.accessLevel === 'CONDICIONAL'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {p.accessLevel}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. MENSAGENS DE ERRO */}
            {activeTab === 'erros' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Catálogo Oficial de Mensagens de Erro e Tratamento
                </h3>
                <div className="space-y-3">
                  {currentScreen.mensagensDeErro.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                          {err.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{err.message}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-500 block mb-0.5 text-[11px]">
                            Causa Técnica:
                          </span>
                          <span className="text-slate-700">{err.cause}</span>
                        </div>
                        <div className="p-2.5 bg-emerald-50/50 rounded border border-emerald-200/60">
                          <span className="font-semibold text-emerald-800 block mb-0.5 text-[11px]">
                            Ação Corretiva:
                          </span>
                          <span className="text-slate-700">{err.resolution}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. COMPORTAMENTOS ESPERADOS */}
            {activeTab === 'comportamentos' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Comportamentos Esperados e Estados de Transição
                </h3>
                <div className="space-y-3">
                  {currentScreen.comportamentosEsperados.map((comp, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <span className="font-bold text-slate-900 block mb-1">
                        Cenário: {comp.scenario}
                      </span>
                      <p className="text-slate-700 leading-relaxed">{comp.expectedBehavior}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. CRITÉRIOS DE TESTE (BDD GHERKIN) */}
            {activeTab === 'testes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    Critérios de Teste e Aceite (Gherkin BDD)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentScreen.criteriosDeTeste.length} cenários de teste automatizados
                  </span>
                </div>

                <div className="space-y-4">
                  {currentScreen.criteriosDeTeste.map((teste) => (
                    <div
                      key={teste.id}
                      className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                            {teste.id}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{teste.title}</h4>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {teste.legalComplianceCheck}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg space-y-1.5 leading-relaxed">
                        <div className="text-slate-400">
                          <span className="text-amber-400 font-bold">Dado </span>
                          {teste.given}
                        </div>
                        <div className="text-slate-400">
                          <span className="text-blue-400 font-bold">Quando </span>
                          {teste.when}
                        </div>
                        <div className="text-slate-400">
                          <span className="text-emerald-400 font-bold">Então </span>
                          {teste.then}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
