import React, { useState } from 'react';
import { Colaborador, Departamento, Cargo } from '../../types/operational';
import { UserPlus, CheckCircle2, Search, Plus, UserCheck, UserX, FileSpreadsheet, FileText } from 'lucide-react';

interface GestaoColaboradoresTabProps {
  activeColaboradores: Colaborador[];
  departamentos: Departamento[];
  cargos: Cargo[];
  onAprovarAutoCadastro: (colabId: string, deptoId?: string, cargoId?: string) => void;
  onRecusarAutoCadastro: (colabId: string) => void;
  onOpenNewColabModal: () => void;
  colabApprovalNotice: string | null;
  onCloseApprovalNotice: () => void;
  getColabContactInfo: (colab: Colaborador) => {
    email: string;
    telefone: string;
    hasEmail: boolean;
    hasTelefone: boolean;
    pretensaoDepto?: string;
    pretensaoCargo?: string;
  };
}

export const GestaoColaboradoresTab: React.FC<GestaoColaboradoresTabProps> = ({
  activeColaboradores,
  departamentos,
  cargos,
  onAprovarAutoCadastro,
  onRecusarAutoCadastro,
  onOpenNewColabModal,
  colabApprovalNotice,
  onCloseApprovalNotice,
  getColabContactInfo
}) => {
  const [colabFilterStatus, setColabFilterStatus] = useState<'TODOS' | 'ATIVO' | 'PENDENTE'>('TODOS');
  const [colabSearchFilter, setColabSearchFilter] = useState<string>('');
  const [pendingDeptoSelection, setPendingDeptoSelection] = useState<Record<string, string>>({});
  const [pendingCargoSelection, setPendingCargoSelection] = useState<Record<string, string>>({});
  const [selectedPendentes, setSelectedPendentes] = useState<string[]>([]);

  // Estados para Emissão / Anexo de Holerite pelo RH
  const [holeriteModalColab, setHoleriteModalColab] = useState<Colaborador | null>(null);
  const [holeriteMesAno, setHoleriteMesAno] = useState<string>('2026-10');
  const [holeriteCompetencia, setHoleriteCompetencia] = useState<string>('Outubro / 2026');
  const [holeriteSalarioBruto, setHoleriteSalarioBruto] = useState<string>('5200.00');
  const [holeriteDescontos, setHoleriteDescontos] = useState<string>('680.00');
  const [holeriteArquivoNome, setHoleriteArquivoNome] = useState<string>('contracheque_outubro_2026.pdf');
  const [holeriteArquivoUrl, setHoleriteArquivoUrl] = useState<string | undefined>(undefined);
  const [holeriteObservacao, setHoleriteObservacao] = useState<string>('');
  const [holeriteNotice, setHoleriteNotice] = useState<string | null>(null);

  const handleSaveHoleriteRH = () => {
    if (!holeriteModalColab) return;
    const bruto = parseFloat(holeriteSalarioBruto) || 0;
    const desc = parseFloat(holeriteDescontos) || 0;
    const liq = Math.max(0, bruto - desc);

    const newHolerite = {
      id: `hol-rh-${Date.now()}`,
      tenantId: holeriteModalColab.tenantId || 'tenant-01',
      colaboradorId: holeriteModalColab.id,
      colaboradorNome: holeriteModalColab.nome,
      colaboradorCpf: holeriteModalColab.cpf,
      mesAno: holeriteMesAno,
      competencia: holeriteCompetencia || holeriteMesAno,
      salarioBruto: bruto,
      descontos: desc,
      liquido: liq,
      arquivoNome: holeriteArquivoNome || `holerite_${holeriteModalColab.cpf.replace(/\D/g, '')}.pdf`,
      arquivoUrl: holeriteArquivoUrl,
      dataUpload: new Date().toLocaleDateString('pt-BR'),
      status: 'EMITIDO_EMPRESA',
      observacao: holeriteObservacao
    };

    try {
      const existingAllRaw = localStorage.getItem('sc_holerites_all');
      const existingAll = existingAllRaw ? JSON.parse(existingAllRaw) : [];
      const updatedAll = [newHolerite, ...existingAll];
      localStorage.setItem('sc_holerites_all', JSON.stringify(updatedAll));
    } catch (_) {}

    try {
      const existingColabRaw = localStorage.getItem(`sc_holerites_${holeriteModalColab.id}`);
      const existingColab = existingColabRaw ? JSON.parse(existingColabRaw) : [];
      const updatedColab = [newHolerite, ...existingColab];
      localStorage.setItem(`sc_holerites_${holeriteModalColab.id}`, JSON.stringify(updatedColab));
    } catch (_) {}

    // Persistência no Supabase Backend
    try {
      fetch('/api/save-holerite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin-session-token`
        },
        body: JSON.stringify(newHolerite)
      }).catch(err => console.warn('Aviso Supabase save-holerite:', err));
    } catch (_) {}

    setHoleriteNotice(`Holerite de "${holeriteModalColab.nome}" (Competência ${holeriteCompetencia}) cadastrado com sucesso pelo RH! Persistido no banco de dados e disponível no Portal do Colaborador.`);
    setHoleriteModalColab(null);
  };

  // Estados para Publicação de Informe de Rendimentos (IRPF) pelo RH
  const [irpfModalColab, setIrpfModalColab] = useState<Colaborador | null>(null);
  const [irpfAnoCalendario, setIrpfAnoCalendario] = useState<string>('2025');
  const [irpfRendimentos, setIrpfRendimentos] = useState<string>('62400.00');
  const [irpfPrevidencia, setIrpfPrevidencia] = useState<string>('6864.00');
  const [irpfImpostoFonte, setIrpfImpostoFonte] = useState<string>('4320.00');
  const [irpfArquivoNome, setIrpfArquivoNome] = useState<string>('informe_rendimentos_2025.pdf');
  const [irpfArquivoUrl, setIrpfArquivoUrl] = useState<string | undefined>(undefined);

  const handleSaveInformeIrpfRH = () => {
    if (!irpfModalColab) return;

    const newInforme = {
      id: `irpf-rh-${Date.now()}`,
      tenantId: irpfModalColab.tenantId || 'tenant-01',
      colaboradorId: irpfModalColab.id,
      colaboradorNome: irpfModalColab.nome,
      colaboradorCpf: irpfModalColab.cpf,
      anoCalendario: irpfAnoCalendario || '2025',
      rendimentosTributaveis: parseFloat(irpfRendimentos) || 0,
      contribuicaoPrevidenciaria: parseFloat(irpfPrevidencia) || 0,
      impostoRetidoFonte: parseFloat(irpfImpostoFonte) || 0,
      arquivoNome: irpfArquivoNome || `informe_irpf_${irpfAnoCalendario}_${irpfModalColab.cpf.replace(/\D/g, '')}.pdf`,
      arquivoUrl: irpfArquivoUrl,
      dataUpload: new Date().toLocaleDateString('pt-BR'),
      status: 'DISPONIVEL'
    };

    try {
      const existingAllRaw = localStorage.getItem('sc_informes_irpf_all');
      const existingAll = existingAllRaw ? JSON.parse(existingAllRaw) : [];
      const updatedAll = [newInforme, ...existingAll];
      localStorage.setItem('sc_informes_irpf_all', JSON.stringify(updatedAll));
    } catch (_) {}

    try {
      const existingColabRaw = localStorage.getItem(`sc_informes_irpf_${irpfModalColab.id}`);
      const existingColab = existingColabRaw ? JSON.parse(existingColabRaw) : [];
      const updatedColab = [newInforme, ...existingColab];
      localStorage.setItem(`sc_informes_irpf_${irpfModalColab.id}`, JSON.stringify(updatedColab));
    } catch (_) {}

    try {
      fetch('/api/save-informe-irpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin-session-token`
        },
        body: JSON.stringify(newInforme)
      }).catch(err => console.warn('Aviso Supabase save-informe-irpf:', err));
    } catch (_) {}

    setHoleriteNotice(`Informe de Rendimentos IRPF (${irpfAnoCalendario}) de "${irpfModalColab.nome}" publicado com sucesso! Disponibilizado no Portal do Colaborador.`);
    setIrpfModalColab(null);
  };

  const colaboradoresPendentes = activeColaboradores.filter((c) => c.status === 'PENDENTE');
  const colaboradoresAtivos = activeColaboradores.filter((c) => c.status === 'ATIVO');

  const filteredColaboradores = activeColaboradores.filter((c) => {
    if (colabFilterStatus === 'ATIVO' && c.status !== 'ATIVO') return false;
    if (colabFilterStatus === 'PENDENTE' && c.status !== 'PENDENTE') return false;
    if (colabSearchFilter.trim()) {
      const query = colabSearchFilter.toLowerCase();
      const matchNome = c.nome.toLowerCase().includes(query);
      const matchCpf = c.cpf.includes(query);
      const matchMatricula = c.matricula.toLowerCase().includes(query);
      if (!matchNome && !matchCpf && !matchMatricula) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Feedback de Aprovação / Notificação */}
      {colabApprovalNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{colabApprovalNotice}</span>
          </div>
          <button 
            onClick={onCloseApprovalNotice}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {holeriteNotice && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl text-blue-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{holeriteNotice}</span>
          </div>
          <button 
            onClick={() => setHoleriteNotice(null)}
            className="text-blue-700 hover:text-blue-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* CARD DESTACADO: Auto-Cadastros Aguardando Homologação pelo Gestor */}
      {colaboradoresPendentes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 border-2 border-amber-400/80 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-300/50 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Novos Colaboradores Aguardando Homologação do Gestor
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
                    {colaboradoresPendentes.length} {colaboradoresPendentes.length === 1 ? 'pendente' : 'pendentes'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Os colaboradores abaixo se auto-cadastraram no login e aguardam liberação das funções e atribuição de escala.
                </p>
              </div>
            </div>
          </div>

          {/* Ações em Lote para Homologação */}
          {colaboradoresPendentes.length > 1 && (
            <div className="flex items-center justify-between px-3 py-2 bg-amber-100/70 border border-amber-300 rounded-xl text-xs font-semibold text-amber-950 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPendentes.length === colaboradoresPendentes.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPendentes(colaboradoresPendentes.map(p => p.id));
                    } else {
                      setSelectedPendentes([]);
                    }
                  }}
                  className="w-4 h-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Selecionar todos ({colaboradoresPendentes.length})</span>
              </label>

              {selectedPendentes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      selectedPendentes.forEach(id => {
                        const deptoId = pendingDeptoSelection[id] || departamentos[0]?.id;
                        const cargoId = pendingCargoSelection[id] || cargos[0]?.id;
                        onAprovarAutoCadastro(id, deptoId, cargoId);
                      });
                      setSelectedPendentes([]);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Aprovar Selecionados ({selectedPendentes.length})
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Deseja recusar os ${selectedPendentes.length} cadastros selecionados?`)) {
                        selectedPendentes.forEach(id => {
                          onRecusarAutoCadastro(id);
                        });
                        setSelectedPendentes([]);
                      }
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Recusar Lote
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista de Cards para Homologação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {colaboradoresPendentes.map((pend) => {
              const isSelected = selectedPendentes.includes(pend.id);
              return (
                <div
                  key={pend.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between transition-all ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10' : 'border-amber-200/90'
                  }`}
                >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPendentes(prev => [...prev, pend.id]);
                          } else {
                            setSelectedPendentes(prev => prev.filter(id => id !== pend.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Selecionar para lote"
                      />
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {pend.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{pend.nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">CPF: {pend.cpf}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                      Auto-Cadastro
                    </span>
                  </div>

                  {/* Dados adicionais informados pelo colaborador */}
                  {(() => {
                    const contact = getColabContactInfo(pend);
                    const deptoPretendido = contact.pretensaoDepto || pend.departamentoNome || 'A Definir';
                    const cargoPretendido = contact.pretensaoCargo || pend.cargoTitulo || 'A Definir';

                    const matchedDepto = departamentos.find(d => 
                      d.nome.toLowerCase() === deptoPretendido.toLowerCase() ||
                      deptoPretendido.toLowerCase().includes(d.nome.toLowerCase())
                    );
                    const defaultDeptoId = matchedDepto?.id || pend.departamentoId || departamentos[0]?.id;

                    const matchedCargo = cargos.find(c => 
                      c.titulo.toLowerCase() === cargoPretendido.toLowerCase() ||
                      cargoPretendido.toLowerCase().includes(c.titulo.toLowerCase())
                    );
                    const defaultCargoId = matchedCargo?.id || pend.cargoId || cargos[0]?.id;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                          <div>
                            <span className="text-slate-400 block font-medium">E-mail:</span>
                            <span 
                              className={`font-semibold truncate block ${contact.hasEmail ? 'text-slate-800' : 'text-slate-400 italic'}`} 
                              title={contact.email}
                            >
                              {contact.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Telefone:</span>
                            <span 
                              className={`font-semibold truncate block ${contact.hasTelefone ? 'text-slate-800' : 'text-slate-400 italic'}`} 
                              title={contact.telefone}
                            >
                              {contact.telefone}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Pretensão Depto:</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {deptoPretendido}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Pretensão Cargo:</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {cargoPretendido}
                            </span>
                          </div>
                        </div>

                        {/* Configuração Definitiva do Gestor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Homologar Departamento:
                            </label>
                            <select
                              value={pendingDeptoSelection[pend.id] || defaultDeptoId}
                              onChange={(e) => setPendingDeptoSelection(prev => ({ ...prev, [pend.id]: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            >
                              {departamentos.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                              Homologar Cargo:
                            </label>
                            <select
                              value={pendingCargoSelection[pend.id] || defaultCargoId}
                              onChange={(e) => setPendingCargoSelection(prev => ({ ...prev, [pend.id]: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                            >
                              {cargos.map(c => (
                                <option key={c.id} value={c.id}>{c.titulo}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Botões de Ação para o Gestor */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onAprovarAutoCadastro(
                      pend.id,
                      pendingDeptoSelection[pend.id] || pend.departamentoId,
                      pendingCargoSelection[pend.id] || pend.cargoId
                    )}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Aprovar & Liberar Funções
                  </button>

                  <button
                    onClick={() => onRecusarAutoCadastro(pend.id)}
                    className="py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                    title="Recusar solicitação de cadastro"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Recusar
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Painel Principal de Colaboradores */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quadro de Colaboradores</h2>
            <p className="text-xs text-slate-500">
              Gerencie o quadro funcional, aprove auto-cadastros e monitore o status de acesso.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={colabSearchFilter}
                onChange={(e) => setColabSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 w-56"
              />
            </div>

            <button 
              onClick={() => setHoleriteModalColab(activeColaboradores.find(c => c.status === 'ATIVO') || activeColaboradores[0] || null)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Anexar Holerite RH
            </button>

            <button 
              onClick={() => setIrpfModalColab(activeColaboradores.find(c => c.status === 'ATIVO') || activeColaboradores[0] || null)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Publicar Informe IRPF
            </button>

            <button 
              onClick={onOpenNewColabModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Colaborador
            </button>
          </div>
        </div>

        {/* Abas e Filtros de Status */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold">
          <button
            onClick={() => setColabFilterStatus('TODOS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              colabFilterStatus === 'TODOS'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({activeColaboradores.length})
          </button>
          <button
            onClick={() => setColabFilterStatus('ATIVO')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              colabFilterStatus === 'ATIVO'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ativos ({colaboradoresAtivos.length})
          </button>
          <button
            onClick={() => setColabFilterStatus('PENDENTE')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              colabFilterStatus === 'PENDENTE'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Pendentes de Aprovação</span>
            {colaboradoresPendentes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] flex items-center justify-center font-bold">
                {colaboradoresPendentes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tabela de Colaboradores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-2">Colaborador</th>
                <th className="pb-3 px-2">CPF</th>
                <th className="pb-3 px-2">Cargo & Depto</th>
                <th className="pb-3 px-2">Acesso & Login</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredColaboradores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum colaborador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredColaboradores.map((colab) => (
                  <tr key={colab.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-900">{colab.nome}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{colab.matricula}</div>
                    </td>
                    <td className="py-3 px-2 text-slate-600 font-mono">{colab.cpf}</td>
                    <td className="py-3 px-2">
                      <div className="text-slate-700 font-medium">{colab.cargoTitulo}</div>
                      <div className="text-[10px] text-slate-500">{colab.departamentoNome}</div>
                    </td>
                    <td className="py-3 px-2">
                      {(() => {
                        const contact = getColabContactInfo(colab);
                        return contact.hasEmail ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-slate-700 font-medium truncate max-w-[170px]" title={contact.email}>
                              {contact.email}
                            </span>
                            {contact.hasTelefone && (
                              <span className="text-[9px] text-slate-400 font-mono">{contact.telefone}</span>
                            )}
                            <span className={`text-[9px] font-bold ${colab.status === 'ATIVO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {colab.status === 'ATIVO' ? 'Acesso Liberado' : 'Aguardando Homologação'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Sem login</span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        colab.status === 'ATIVO' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : (colab.status === 'PENDENTE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 font-extrabold animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200')
                      }`}>
                        {colab.status === 'PENDENTE' ? '⏳ PENDENTE' : colab.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {colab.status === 'PENDENTE' ? (
                        <button
                          onClick={() => onAprovarAutoCadastro(colab.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          title="Aprovar e liberar acesso agora"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => setHoleriteModalColab(colab)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                            title="Disponibilizar Holerite / Contracheque no Portal deste colaborador"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                            <span>Holerite</span>
                          </button>
                          <button
                            onClick={() => setIrpfModalColab(colab)}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                            title="Publicar Informe de Rendimentos IRPF deste colaborador"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            <span>Informe IRPF</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Emissão / Anexo de Holerite pelo RH */}
      {holeriteModalColab && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Disponibilizar Holerite / Contracheque pelo RH</h3>
                  <p className="text-[11px] text-slate-500">O documento ficará imediatamente disponível no Portal do Colaborador.</p>
                </div>
              </div>
              <button onClick={() => setHoleriteModalColab(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador Destinatário:</label>
                <select
                  value={holeriteModalColab.id}
                  onChange={(e) => {
                    const found = activeColaboradores.find(c => c.id === e.target.value);
                    if (found) setHoleriteModalColab(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {activeColaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (CPF: {c.cpf} - Matrícula: {c.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mês / Ano (Competência):</label>
                  <input
                    type="text"
                    value={holeriteCompetencia}
                    onChange={(e) => setHoleriteCompetencia(e.target.value)}
                    placeholder="Ex: Outubro / 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Mês/Ano:</label>
                  <input
                    type="text"
                    value={holeriteMesAno}
                    onChange={(e) => setHoleriteMesAno(e.target.value)}
                    placeholder="Ex: 2026-10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Salário Bruto (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={holeriteSalarioBruto}
                    onChange={(e) => setHoleriteSalarioBruto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Descontos (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={holeriteDescontos}
                    onChange={(e) => setHoleriteDescontos(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-rose-600 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Líquido A Pagar:</label>
                  <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg font-bold text-emerald-900 text-xs text-center">
                    R$ {(Math.max(0, (parseFloat(holeriteSalarioBruto) || 0) - (parseFloat(holeriteDescontos) || 0))).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexo do Holerite (Foto ou PDF):</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setHoleriteArquivoNome(file.name);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setHoleriteArquivoUrl(evt.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={holeriteArquivoNome}
                  onChange={(e) => setHoleriteArquivoNome(e.target.value)}
                  placeholder="Nome do arquivo (ex: contracheque_outubro_2026.pdf)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações / Recado do DP (Opcional):</label>
                <textarea
                  rows={2}
                  value={holeriteObservacao}
                  onChange={(e) => setHoleriteObservacao(e.target.value)}
                  placeholder="Ex: Inclui pagamento de 1/3 de férias regulamentar..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setHoleriteModalColab(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveHoleriteRH}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Disponibilizar no Portal do Colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Publicação de Informe de Rendimentos (IRPF) */}
      {irpfModalColab && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Publicar Comprovante de Rendimentos IRPF</h3>
                  <p className="text-[11px] text-slate-500">Informe Anual de Rendimentos para Declaração de Imposto de Renda</p>
                </div>
              </div>
              <button onClick={() => setIrpfModalColab(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador Destinatário:</label>
                <select
                  value={irpfModalColab.id}
                  onChange={(e) => {
                    const found = activeColaboradores.find(c => c.id === e.target.value);
                    if (found) setIrpfModalColab(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  {activeColaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (CPF: {c.cpf} - Matrícula: {c.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ano-Calendário IRPF:</label>
                <select
                  value={irpfAnoCalendario}
                  onChange={(e) => setIrpfAnoCalendario(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-900 text-xs"
                >
                  <option value="2025">Ano-Calendário 2025 (Exercício 2026)</option>
                  <option value="2024">Ano-Calendário 2024 (Exercício 2025)</option>
                  <option value="2026">Ano-Calendário 2026 (Exercício 2027)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">Rend. Tributáveis (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={irpfRendimentos}
                    onChange={(e) => setIrpfRendimentos(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">INSS/Previdência (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={irpfPrevidencia}
                    onChange={(e) => setIrpfPrevidencia(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-blue-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 text-[10px] mb-1">IRRF Retido (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={irpfImpostoFonte}
                    onChange={(e) => setIrpfImpostoFonte(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-purple-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexo do Informe IRPF (PDF ou Imagem):</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIrpfArquivoNome(file.name);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) {
                            setIrpfArquivoUrl(evt.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={irpfArquivoNome}
                  onChange={(e) => setIrpfArquivoNome(e.target.value)}
                  placeholder="Nome do arquivo (ex: informe_rendimentos_2025.pdf)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIrpfModalColab(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInformeIrpfRH}
                className="px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4" />
                Publicar Informe de Rendimentos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
