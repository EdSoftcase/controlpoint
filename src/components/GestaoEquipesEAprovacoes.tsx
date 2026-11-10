import React, { useState } from 'react';
import { Departamento, Colaborador, SolicitacaoHoraExtra, SolicitacaoAjustePonto } from '../types/operational';
import { AuthUser } from '../types/auth';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Edit2,
  Save,
  X,
  Filter,
  Plus,
  Send,
  Calendar,
  Briefcase,
  PenTool
} from 'lucide-react';

interface GestaoEquipesEAprovacoesProps {
  departamentos: Departamento[];
  onUpdateDepartamentos: (novos: Departamento[]) => void;
  colaboradores: Colaborador[];
  onUpdateColaboradores: (novos: Colaborador[]) => void;
  horasExtras: SolicitacaoHoraExtra[];
  onUpdateHorasExtras: (novas: SolicitacaoHoraExtra[]) => void;
  solicitacoesAjuste?: SolicitacaoAjustePonto[];
  onUpdateSolicitacoesAjuste?: (novas: SolicitacaoAjustePonto[]) => void;
  currentUser: AuthUser;
}

import { GestaoMuralEAtendimento } from './rh/GestaoMuralEAtendimento';
import { Megaphone } from 'lucide-react';

export const GestaoEquipesEAprovacoes: React.FC<GestaoEquipesEAprovacoesProps> = ({
  departamentos,
  onUpdateDepartamentos,
  colaboradores,
  onUpdateColaboradores,
  horasExtras,
  onUpdateHorasExtras,
  solicitacoesAjuste = [],
  onUpdateSolicitacoesAjuste,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'aprovacoes' | 'equipes' | 'ajustes' | 'mural_atendimento'>('aprovacoes');
  
  // Filtros de Aprovação de Horas Extras
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO'>('PENDENTE');
  const [selectedGestorFilter, setSelectedGestorFilter] = useState<string>(
    currentUser.role === 'GESTOR' ? currentUser.id : 'TODOS'
  );

  // Modal / Edição de Equipe
  const [editingDept, setEditingDept] = useState<Departamento | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Modal Rejeição de Hora Extra
  const [rejectingHeId, setRejectingHeId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState<string>('');

  // Modal Aprovação com escolha (Banco de Horas vs Folha)
  const [approvingHeId, setApprovingHeId] = useState<string | null>(null);
  const [destinoAprovacao, setDestinoAprovacao] = useState<'BANCO_HORAS' | 'FOLHA_PAGAMENTO'>('BANCO_HORAS');

  // Modal Nova Solicitação Manual de H.E.
  const [isNovaHeModalOpen, setIsNovaHeModalOpen] = useState(false);
  const [novaHeForm, setNovaHeForm] = useState({
    colaboradorId: colaboradores[0]?.id || '',
    data: new Date().toISOString().slice(0, 10),
    minutosExtras: 120,
    tipoHoraExtra: 'NORMAL_50' as 'NORMAL_50' | 'FERIADO_100',
    justificativa: ''
  });

  // Lista de Gestores Disponíveis para Atribuição
  const gestoresDisponiveis = [
    { id: 'user-03', nome: 'Roberto Albuquerque', email: 'gestor@softcase.com.br', dept: 'Engenharia de Software' },
    { id: 'user-02', nome: 'Luciana Mendonça', email: 'rh@softcase.com.br', dept: 'Recursos Humanos & DP' },
    { id: 'user-06', nome: 'Marcelo Vieira', email: 'marcelo.gestor@softcase.com.br', dept: 'Operações & Logística' }
  ];

  // Filtra as solicitações conforme o perfil logado e filtros
  const filteredHorasExtras = horasExtras.filter((he) => {
    // Filtro por status
    if (statusFilter !== 'TODOS' && he.status !== statusFilter) return false;
    
    // Filtro por gestor
    if (selectedGestorFilter !== 'TODOS' && he.gestorId !== selectedGestorFilter) return false;

    return true;
  });

  const pendentesCount = horasExtras.filter((h) => h.status === 'PENDENTE').length;

  // Ação: Aprovar Hora Extra
  const handleConfirmAprovar = () => {
    if (!approvingHeId) return;

    const agora = new Date().toLocaleString('pt-BR');
    const atualizadas = horasExtras.map((he) => {
      if (he.id === approvingHeId) {
        return {
          ...he,
          status: 'APROVADO' as const,
          dataDecisao: `${agora} · Destino: ${destinoAprovacao === 'BANCO_HORAS' ? 'Banco de Horas (Compensação)' : 'Folha de Pagamento'}`
        };
      }
      return he;
    });

    onUpdateHorasExtras(atualizadas);
    setApprovingHeId(null);
  };

  // Ação: Rejeitar Hora Extra
  const handleConfirmRejeitar = () => {
    if (!rejectingHeId || !motivoRejeicao.trim()) return;

    const agora = new Date().toLocaleString('pt-BR');
    const atualizadas = horasExtras.map((he) => {
      if (he.id === rejectingHeId) {
        return {
          ...he,
          status: 'REJEITADO' as const,
          motivoRecusa: motivoRejeicao.trim(),
          dataDecisao: agora
        };
      }
      return he;
    });

    onUpdateHorasExtras(atualizadas);
    setRejectingHeId(null);
    setMotivoRejeicao('');
  };

  // Ação: Salvar Configurações da Equipe
  const handleSaveDeptConfig = () => {
    if (!editingDept) return;

    // Atualiza a lista de departamentos
    const novosDepts = departamentos.map((d) => (d.id === editingDept.id ? editingDept : d));
    onUpdateDepartamentos(novosDepts);

    // Replica as configurações de início de jornada, carga diária, intervalo e regra de 15 minutos para todos os colaboradores da equipe
    const novosColabs = colaboradores.map((c) => {
      if (c.departamentoId === editingDept.id) {
        return {
          ...c,
          gestorId: editingDept.gestorId,
          gestorNome: editingDept.gestorNome,
          horarioInicio: editingDept.horarioInicioPadrao,
          cargaHorariaDiariaHoras: editingDept.cargaHorariaDiariaHoras,
          intervaloMinutos: editingDept.intervaloMinutos,
          maxMinutosAntecedenciaPermitido: editingDept.maxMinutosAntecedenciaPermitido,
          regraAntecedenciaAtiva: editingDept.regraAntecedenciaAtiva
        };
      }
      return c;
    });
    onUpdateColaboradores(novosColabs);

    setEditSuccessMsg(`Parâmetros da equipe "${editingDept.nome}" salvos com sucesso e replicados aos colaboradores vinculados.`);
    setTimeout(() => {
      setEditSuccessMsg(null);
      setEditingDept(null);
    }, 2500);
  };

  // Ação: Submeter Nova Hora Extra
  const handleCriarNovaHe = () => {
    const colab = colaboradores.find((c) => c.id === novaHeForm.colaboradorId);
    if (!colab) return;

    const horas = Math.floor(novaHeForm.minutosExtras / 60);
    const mins = novaHeForm.minutosExtras % 60;
    const formatada = `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}h`;

    const nova: SolicitacaoHoraExtra = {
      id: `he-${Date.now()}`,
      tenantId: colab.tenantId,
      colaboradorId: colab.id,
      colaboradorNome: colab.nome,
      colaboradorCpf: colab.cpf,
      departamentoId: colab.departamentoId,
      departamentoNome: colab.departamentoNome,
      gestorId: colab.gestorId || 'user-03',
      gestorNome: colab.gestorNome || 'Roberto Albuquerque',
      data: novaHeForm.data,
      horarioContratado: `${colab.horarioInicio} às ${colab.horarioFim} (${colab.cargaHorariaDiariaHoras}h diárias, ${colab.intervaloMinutos}min intervalo)`,
      horarioRealizado: `${colab.horarioInicio} às ${String(17 + horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
      minutosExtras: novaHeForm.minutosExtras,
      horasExtrasFormatadas: formatada,
      tipoHoraExtra: novaHeForm.tipoHoraExtra,
      justificativa: novaHeForm.justificativa || 'Demanda operacional emergencial autorizada pelo gestor.',
      status: 'PENDENTE'
    };

    onUpdateHorasExtras([nova, ...horasExtras]);
    setIsNovaHeModalOpen(false);
    setNovaHeForm({
      colaboradorId: colaboradores[0]?.id || '',
      data: new Date().toISOString().slice(0, 10),
      minutosExtras: 120,
      tipoHoraExtra: 'NORMAL_50',
      justificativa: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explicativo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Gestão de Equipes, Gestores & Horas Extras
            </h2>
            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              CLT Art. 58, 59 & 71
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cada equipe possui seu gestor responsável direto pela validação de jornada, controle de intervalo intrajornada, limite de antecedência e aprovação de horas extras.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNovaHeModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação H.E.
          </button>
        </div>
      </div>

      {/* Navegação entre Sub-abas */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1.5 bg-slate-200/70 rounded-xl text-xs font-semibold w-full overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveSubTab('aprovacoes')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-2 min-w-0 ${
            activeSubTab === 'aprovacoes'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="whitespace-nowrap sm:whitespace-normal">Fila de Horas Extras</span>
          {pendentesCount > 0 && (
            <span className="text-[10px] font-mono font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full shrink-0">
              {pendentesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('ajustes')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-2 min-w-0 ${
            activeSubTab === 'ajustes'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="whitespace-nowrap sm:whitespace-normal">Ajustes & Atestados</span>
          {solicitacoesAjuste.filter(s => s.status === 'PENDENTE').length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full shrink-0">
              {solicitacoesAjuste.filter(s => s.status === 'PENDENTE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('equipes')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-2 min-w-0 ${
            activeSubTab === 'equipes'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="whitespace-nowrap sm:whitespace-normal">Equipes & Gestores</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mural_atendimento')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-2 min-w-0 ${
            activeSubTab === 'mural_atendimento'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="whitespace-nowrap sm:whitespace-normal">Mural & Atendimento DP</span>
        </button>
      </div>

      {activeSubTab === 'mural_atendimento' && (
        <GestaoMuralEAtendimento currentUser={currentUser} />
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 1: FILA DE APROVAÇÃO DE HORAS EXTRAS            */}
      {/* ======================================================== */}
      {activeSubTab === 'aprovacoes' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Status:
              </span>
              {(['PENDENTE', 'APROVADO', 'REJEITADO', 'TODOS'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'TODOS' ? 'Todos' : st === 'PENDENTE' ? 'Pendentes' : st === 'APROVADO' ? 'Aprovadas' : 'Rejeitadas'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 whitespace-nowrap">Gestor Responsável:</span>
              <select
                value={selectedGestorFilter}
                onChange={(e) => setSelectedGestorFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="TODOS">Todos os Gestores</option>
                {gestoresDisponiveis.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.dept})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Solicitações */}
          {filteredHorasExtras.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              Nenhuma solicitação de hora extra encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHorasExtras.map((he) => {
                const isPendente = he.status === 'PENDENTE';
                const isAprovado = he.status === 'APROVADO';

                return (
                  <div
                    key={he.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Linha Superior: Colaborador e Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{he.colaboradorNome}</span>
                          <span className="text-xs text-slate-400 font-mono">CPF {he.colaboradorCpf}</span>
                          <span className="text-[11px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {he.departamentoNome}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gestor da Equipe: <strong className="text-slate-700">{he.gestorNome}</strong></span>
                          <span>·</span>
                          <span>Data da ocorrência: <strong className="font-mono text-slate-700">{he.data}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPendente && (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            Aguardando Decisão do Gestor
                          </span>
                        )}
                        {isAprovado && (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aprovada pelo Gestor
                          </span>
                        )}
                        {he.status === 'REJEITADO' && (
                          <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejeitada pelo Gestor
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detalhes da Jornada e Horas Extras */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">Jornada Prevista</span>
                        <span className="text-slate-800 font-medium">{he.horarioContratado}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">Registro Realizado</span>
                        <span className="text-slate-800 font-medium">{he.horarioRealizado}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">Horas Extras Apuradas</span>
                        <span className="text-emerald-700 font-bold text-sm">+{he.horasExtrasFormatadas}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          {he.tipoHoraExtra === 'NORMAL_50' ? 'Adicional 50% (Dia útil)' : 'Adicional 100% (Feriado/DSR)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-sans uppercase">Base Legal CLT</span>
                        <span className="text-slate-700 font-sans text-[11px] block">
                          Art. 59 § 1º e 2º
                        </span>
                      </div>
                    </div>

                    {/* Justificativa do Colaborador */}
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700 block mb-0.5">Motivo / Justificativa Apresentada:</span>
                      <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 italic">
                        "{he.justificativa}"
                      </p>
                    </div>

                    {/* Observações de Decisão do Gestor */}
                    {he.dataDecisao && (
                      <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">Decisão do Gestor:</span>
                        <span>{he.dataDecisao}</span>
                        {he.motivoRecusa && (
                          <span className="text-rose-700 font-medium">· Motivo da recusa: "{he.motivoRecusa}"</span>
                        )}
                      </div>
                    )}

                    {/* Ações de Aprovação do Gestor (apenas para pendentes) */}
                    {isPendente && (
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setRejectingHeId(he.id);
                            setMotivoRejeicao('');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeitar Solicitação
                        </button>
                        <button
                          onClick={() => {
                            setApprovingHeId(he.id);
                            setDestinoAprovacao('BANCO_HORAS');
                          }}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprovar Hora Extra
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA: AJUSTES E ATESTADOS (Portaria 671)             */}
      {/* ======================================================== */}
      {activeSubTab === 'ajustes' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 uppercase">Filtros:</span>
             </div>
             <div className="flex gap-2">
                {['TODOS', 'PENDENTE', 'APROVADO', 'REJEITADO'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === st ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
             </div>
          </div>

          {solicitacoesAjuste.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <PenTool className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Nenhum pedido de ajuste</h3>
              <p className="text-sm text-slate-500">Não há solicitações de correção de ponto ou atestados pendentes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {solicitacoesAjuste.filter(s => statusFilter === 'TODOS' || s.status === statusFilter).map((ajuste) => (
                <div key={ajuste.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all space-y-4 relative overflow-hidden group">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {ajuste.colaboradorNome.charAt(0)}
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-slate-900">{ajuste.colaboradorNome}</h4>
                            <p className="text-[10px] text-slate-500 font-mono">CPF: {ajuste.colaboradorCpf} · Depto: {ajuste.departamentoNome}</p>
                         </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                           ajuste.status === 'PENDENTE' ? 'bg-amber-100 text-amber-800' : 
                           ajuste.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                         }`}>
                           {ajuste.status}
                         </span>
                         <span className="text-[9px] text-slate-400 font-mono">Solicitado em: {ajuste.dataHoraEnvio}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block">Tipo de Pedido</span>
                         <span className="text-[11px] font-bold text-blue-800">
                            {ajuste.tipo === 'ATESTADO_MEDICO' ? 'Atestado Médico' : 
                             ajuste.tipo === 'INCLUSAO_PONTO_ESQUECIDO' ? 'Ponto Esquecido' : 'Justificativa de Correção'}
                         </span>
                      </div>
                      <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block">Data do Evento</span>
                         <span className="text-[11px] font-mono font-bold text-slate-700">{ajuste.data}</span>
                      </div>
                      <div>
                         <span className="text-[9px] font-bold text-slate-400 uppercase block">Horário/Marcação</span>
                         <span className="text-[11px] font-bold text-slate-700">
                            {ajuste.horarioAjuste || '--:--'} ({ajuste.tipoMarcacaoAjuste || 'N/A'})
                         </span>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Explicação do Colaborador:</span>
                      <p className="text-xs text-slate-600 bg-blue-50/30 p-3 rounded-lg border border-blue-100 italic">
                         "{ajuste.justificativa}"
                      </p>
                   </div>

                   {ajuste.status === 'PENDENTE' && (
                     <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            if (onUpdateSolicitacoesAjuste) {
                              const novas = solicitacoesAjuste.map(s => s.id === ajuste.id ? {...s, status: 'REJEITADO' as any, dataDecisao: new Date().toLocaleString()} : s);
                              onUpdateSolicitacoesAjuste(novas);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                           <XCircle className="w-3.5 h-3.5" /> Negar
                        </button>
                        <button 
                          onClick={() => {
                            if (onUpdateSolicitacoesAjuste) {
                              const novas = solicitacoesAjuste.map(s => s.id === ajuste.id ? {...s, status: 'APROVADO' as any, dataDecisao: new Date().toLocaleString()} : s);
                              onUpdateSolicitacoesAjuste(novas);
                            }
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                           <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar Ajuste
                        </button>
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-ABA 2: CONFIGURAÇÃO DE EQUIPES & GESTORES           */}
      {/* ======================================================== */}
      {activeSubTab === 'equipes' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">
                Parametrização de Carga Horária, Intervalo e Tolerância de Antecedência
              </span>
              <p className="mt-0.5">
                Cada equipe define seu horário de início contratado (ex: 08:00), intervalo intrajornada (mínimo 60 min pela CLT Art. 71) e a <strong>regra opcional de antecedência máxima de 15 minutos</strong> (CLT Art. 4º e Art. 58 § 1º). Se ativa, colaboradores que registrarem presença antes desse limite serão alertados ou bloqueados no coletor REP-P.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departamentos.map((dept) => {
              const colabsDaEquipe = colaboradores.filter((c) => c.departamentoId === dept.id);

              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                          {dept.codigo}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{dept.nome}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {colabsDaEquipe.length} colaboradores vinculados
                      </p>
                    </div>

                    <button
                      onClick={() => setEditingDept({ ...dept })}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar Parâmetros
                    </button>
                  </div>

                  {/* Gestor Responsável */}
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Gestor Responsável da Equipe
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {dept.gestorNome.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{dept.gestorNome}</span>
                        <span className="text-slate-500 text-[11px] block">{dept.gestorEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parâmetros Operacionais da Equipe */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Início Padrão</span>
                      <span className="text-slate-900 font-bold">{dept.horarioInicioPadrao}</span>
                      <span className="text-[10px] font-sans text-slate-500 block">Carga: {dept.cargaHorariaDiariaHoras}h/dia</span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Intervalo Almoço</span>
                      <span className="text-slate-900 font-bold">{dept.intervaloMinutos} min</span>
                      <span className="text-[10px] font-sans text-slate-500 block">CLT Art. 71 (&ge; 60 min)</span>
                    </div>
                  </div>

                  {/* Regra de Antecedência de 15 Minutos */}
                  <div className={`p-3 rounded-lg border text-xs ${
                    dept.regraAntecedenciaAtiva 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Regra de Antecedência Máxima:
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        dept.regraAntecedenciaAtiva 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {dept.regraAntecedenciaAtiva ? 'ATIVA' : 'INATIVA'}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-600">
                      {dept.regraAntecedenciaAtiva ? (
                        <>Registro permitido com no máximo <strong>{dept.maxMinutosAntecedenciaPermitido} minutos</strong> de antecedência (mais cedo permitido: <strong>07:45</strong> para início 08:00).</>
                      ) : (
                        'Sem restrição de horário de chegada antecipada no coletor.'
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIÇÃO DE PARÂMETROS DA EQUIPE                    */}
      {/* ======================================================== */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Parâmetros da Equipe: {editingDept.nome}
                </h3>
                <p className="text-xs text-slate-500">
                  Ajuste a carga horária, gestor imediato e a regra de antecedência de 15 min.
                </p>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {editSuccessMsg}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Seleção do Gestor */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gestor Responsável da Equipe:
                  </label>
                  <select
                    value={editingDept.gestorId}
                    onChange={(e) => {
                      const sel = gestoresDisponiveis.find((g) => g.id === e.target.value);
                      if (sel) {
                        setEditingDept({
                          ...editingDept,
                          gestorId: sel.id,
                          gestorNome: sel.nome,
                          gestorEmail: sel.email
                        });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
                  >
                    {gestoresDisponiveis.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome} ({g.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horário de Início e Carga Diária */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Horário de Início Padrão:
                    </label>
                    <input
                      type="time"
                      value={editingDept.horarioInicioPadrao}
                      onChange={(e) =>
                        setEditingDept({
                          ...editingDept,
                          horarioInicioPadrao: e.target.value
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Carga Horária Diária (Horas):
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={12}
                      value={editingDept.cargaHorariaDiariaHoras}
                      onChange={(e) =>
                        setEditingDept({
                          ...editingDept,
                          cargaHorariaDiariaHoras: Number(e.target.value) || 8
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Intervalo Intrajornada */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Intervalo Intrajornada Mínimo (Minutos) — CLT Art. 71:
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={120}
                    step={15}
                    value={editingDept.intervaloMinutos}
                    onChange={(e) =>
                      setEditingDept({
                        ...editingDept,
                        intervaloMinutos: Number(e.target.value) || 60
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Para jornadas superiores a 6 horas, o mínimo legal é de 60 minutos (ou 30 min se previsto em CCT/ACT).
                  </span>
                </div>

                {/* Regra Opcional de Antecedência Máxima */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Regra de Antecedência Máxima ao Início
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Restringir registro precoce antes do horário acordado
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingDept.regraAntecedenciaAtiva}
                        onChange={(e) =>
                          setEditingDept({
                            ...editingDept,
                            regraAntecedenciaAtiva: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {editingDept.regraAntecedenciaAtiva && (
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tolerância Máxima de Antecedência (Minutos):
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={editingDept.maxMinutosAntecedenciaPermitido}
                        onChange={(e) =>
                          setEditingDept({
                            ...editingDept,
                            maxMinutosAntecedenciaPermitido: Number(e.target.value) || 15
                          })
                        }
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <span className="text-[11px] text-emerald-700 block mt-1 font-medium">
                        Exemplo: Com início às {editingDept.horarioInicioPadrao}, o colaborador só poderá registrar presença a partir das{' '}
                        <strong>
                          {(() => {
                            const [h, m] = editingDept.horarioInicioPadrao.split(':').map(Number);
                            const totalMin = h * 60 + m - editingDept.maxMinutosAntecedenciaPermitido;
                            const resH = Math.floor((totalMin + 1440) % 1440 / 60);
                            const resM = ((totalMin + 1440) % 1440) % 60;
                            return `${String(resH).padStart(2, '0')}:${String(resM).padStart(2, '0')}`;
                          })()}
                        </strong>.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingDept(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveDeptConfig}
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" /> Salvar e Replicar à Equipe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DECISÃO DE APROVAÇÃO (BANCO DE HORAS VS FOLHA)    */}
      {/* ======================================================== */}
      {approvingHeId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Aprovação de Hora Extra pelo Gestor
              </h3>
              <button onClick={() => setApprovingHeId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Como gestor da equipe, defina a destinação das horas extras aprovadas em conformidade com o acordo coletivo ou individual (CLT Art. 59):
            </p>

            <div className="space-y-2 text-xs">
              <label
                onClick={() => setDestinoAprovacao('BANCO_HORAS')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  destinoAprovacao === 'BANCO_HORAS'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold block">Compensar em Banco de Horas</span>
                  <span className="text-[11px] text-slate-500">
                    Crédito lançado para futura folga ou redução de jornada (CLT Art. 59 § 2º).
                  </span>
                </div>
                <input
                  type="radio"
                  name="destino"
                  checked={destinoAprovacao === 'BANCO_HORAS'}
                  onChange={() => setDestinoAprovacao('BANCO_HORAS')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label
                onClick={() => setDestinoAprovacao('FOLHA_PAGAMENTO')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  destinoAprovacao === 'FOLHA_PAGAMENTO'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold block">Pagamento em Folha com Adicional Legal</span>
                  <span className="text-[11px] text-slate-500">
                    Exportar para a folha com adicional mínimo de 50% ou 100% (CLT Art. 59 § 1º).
                  </span>
                </div>
                <input
                  type="radio"
                  name="destino"
                  checked={destinoAprovacao === 'FOLHA_PAGAMENTO'}
                  onChange={() => setDestinoAprovacao('FOLHA_PAGAMENTO')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setApprovingHeId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAprovar}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs"
              >
                Confirmar Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJEIÇÃO COM MOTIVO OBRIGATÓRIO                  */}
      {/* ======================================================== */}
      {rejectingHeId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                Rejeição de Hora Extra
              </h3>
              <button onClick={() => setRejectingHeId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Informe o motivo da recusa para constar no espelho de ponto e na notificação ao colaborador:
            </p>

            <textarea
              rows={3}
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Ex: Hora extra não autorizada previamente pela coordenação; atividade externa sem anuência do gestor."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setRejectingHeId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                disabled={!motivoRejeicao.trim()}
                onClick={handleConfirmRejeitar}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: NOVA SOLICITAÇÃO DE HORA EXTRA                   */}
      {/* ======================================================== */}
      {isNovaHeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Registrar Solicitação de Hora Extra para Aprovação
              </h3>
              <button onClick={() => setIsNovaHeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colaborador:</label>
                <select
                  value={novaHeForm.colaboradorId}
                  onChange={(e) => setNovaHeForm({ ...novaHeForm, colaboradorId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                >
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cargoTitulo}) — Gestor: {c.gestorNome || 'Roberto Albuquerque'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Prestação:</label>
                  <input
                    type="date"
                    value={novaHeForm.data}
                    onChange={(e) => setNovaHeForm({ ...novaHeForm, data: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minutos Extras:</label>
                  <input
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    value={novaHeForm.minutosExtras}
                    onChange={(e) => setNovaHeForm({ ...novaHeForm, minutosExtras: Number(e.target.value) || 60 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Equivale a {Math.floor(novaHeForm.minutosExtras / 60)}h {novaHeForm.minutosExtras % 60}m
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Hora Extra:</label>
                <select
                  value={novaHeForm.tipoHoraExtra}
                  onChange={(e) => setNovaHeForm({ ...novaHeForm, tipoHoraExtra: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                >
                  <option value="NORMAL_50">Dia Útil Padrão (Adicional 50% - CLT Art. 59 § 1º)</option>
                  <option value="FERIADO_100">Feriado ou Descanso Semanal DSR (Adicional 100% - Súmula 146 TST)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa Operacional:</label>
                <textarea
                  rows={2}
                  value={novaHeForm.justificativa}
                  onChange={(e) => setNovaHeForm({ ...novaHeForm, justificativa: e.target.value })}
                  placeholder="Descreva o motivo da prorrogação de jornada para avaliação do gestor..."
                  className="w-full p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsNovaHeModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarNovaHe}
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
    </div>
  );
};
