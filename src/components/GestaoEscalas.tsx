import React, { useState } from 'react';
import { Colaborador } from '../types/operational';
import { EscalaTrabalhoConfig } from '../types/rhAvancado';
import { ESCALAS_PADRAO, gerarCalendarioMesEscala } from '../utils/shiftEngine';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Info,
  CalendarDays,
  UserCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface GestaoEscalasProps {
  colaboradores: Colaborador[];
  onUpdateColaboradores: (novos: Colaborador[]) => void;
}

export function GestaoEscalas({ colaboradores, onUpdateColaboradores }: GestaoEscalasProps) {
  const [escalas, setEscalas] = useState<EscalaTrabalhoConfig[]>(ESCALAS_PADRAO);
  const [escalaSelecionadaId, setEscalaSelecionadaId] = useState<string>('esc-12x36-a');
  const [subTab, setSubTab] = useState<'ciclo' | 'calendario_anual'>('calendario_anual');
  const [mesVisualizacao, setMesVisualizacao] = useState<number>(10); // Novembro (0-indexed: 10)
  const [anoVisualizacao, setAnoVisualizacao] = useState<number>(2026);
  const [colaboradorFiltro, setColaboradorFiltro] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Estados do Calendário Anual
  const [colabAnualId, setColabAnualId] = useState<string>(colaboradores[0]?.id || '');
  const [anoAnual, setAnoAnual] = useState<number>(2026);

  const escalaAtiva = escalas.find((e) => e.id === escalaSelecionadaId) || escalas[0];

  const colabAnualSelecionado = colaboradores.find(c => c.id === colabAnualId) || colaboradores[0];

  // Simulação do calendário para a escala ativa
  const diasMes = gerarCalendarioMesEscala(
    anoVisualizacao,
    mesVisualizacao,
    escalaAtiva.tipo,
    escalaAtiva.turma || 'A',
    escalaAtiva.dataBaseInicioCiclo || '2026-01-01'
  );

  // Colaboradores alocados na escala
  const colaboradoresAlocados = colaboradores.filter((c) => {
    const escTipo = (c as any).tipoEscala || '5x2';
    const escTurma = (c as any).turmaEscala || 'A';
    if (escalaAtiva.tipo === '12x36') {
      return escTipo === '12x36' && escTurma === (escalaAtiva.turma || 'A');
    }
    return escTipo === escalaAtiva.tipo;
  });

  const handleTrocarEscalaColaborador = (colaboradorId: string, novaEscalaId: string) => {
    const targetEsc = escalas.find(e => e.id === novaEscalaId);
    if (!targetEsc) return;

    const novosColaboradores = colaboradores.map(c => {
      if (c.id === colaboradorId) {
        return {
          ...c,
          tipoEscala: targetEsc.tipo,
          turmaEscala: targetEsc.turma || 'A'
        };
      }
      return c;
    });

    onUpdateColaboradores(novosColaboradores);
    setFeedbackMsg(`Escala do colaborador atualizada para ${targetEsc.nome}!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleToggleDiaFolgaColaborador = (colaboradorId: string, dayIndex: number) => {
    const novosColaboradores = colaboradores.map(c => {
      if (c.id === colaboradorId) {
        const defaultFolgas = c.tipoEscala === '12x36' ? [] : (c.tipoEscala === '6x1' ? [0] : [0, 6]);
        const currentFolgas = c.diasFolgaSemana ?? defaultFolgas;
        const isAlreadyFolga = currentFolgas.includes(dayIndex);
        const nextFolgas = isAlreadyFolga 
          ? currentFolgas.filter(d => d !== dayIndex) 
          : [...currentFolgas, dayIndex].sort();

        return {
          ...c,
          diasFolgaSemana: nextFolgas
        };
      }
      return c;
    });

    onUpdateColaboradores(novosColaboradores);
    setFeedbackMsg('Dias de folga semanal do colaborador atualizados com sucesso!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Toggle de Folga Específica no Calendário Anual (Data YYYY-MM-DD)
  const handleToggleAnualFolgaData = (colaboradorId: string, yyyyMmDd: string) => {
    const novosColaboradores = colaboradores.map(c => {
      if (c.id === colaboradorId) {
        const anualMap = { ...(c.anualFolgas || {}) };
        const currentVal = anualMap[yyyyMmDd];
        
        // Determina se por padrão seria folga semanal
        const [y, m, d] = yyyyMmDd.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        const defaultFolgas = c.tipoEscala === '12x36' ? [] : (c.tipoEscala === '6x1' ? [0] : [0, 6]);
        const defaultIsFolga = (c.diasFolgaSemana ?? defaultFolgas).includes(dayOfWeek);

        const effectiveVal = currentVal !== undefined ? currentVal : defaultIsFolga;
        // Inverte o estado
        anualMap[yyyyMmDd] = !effectiveVal;

        return {
          ...c,
          anualFolgas: anualMap
        };
      }
      return c;
    });

    onUpdateColaboradores(novosColaboradores);
    setFeedbackMsg(`Calendário anual atualizado para a data ${yyyyMmDd.split('-').reverse().join('/')}!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <CalendarDays className="w-4 h-4" />
              Gestão Corporativa de Escalas & Calendário Anual de Folgas
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Escalas, Turnos e Marcação Anual de Folgas</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Conformidade com a CLT e convenção coletiva. Preencha o calendário anual de cada funcionário definindo os dias exatos de folga e trabalho para bloquear tentativas de ponto indevidas.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-mono">
              Portaria 671: Homologado
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Sub-abas de Navegação Interna */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setSubTab('calendario_anual')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'calendario_anual'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendário Anual de Folgas por Funcionário
        </button>
        <button
          onClick={() => setSubTab('ciclo')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            subTab === 'ciclo'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Modelos de Escala & Alocação de Turmas
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: CALENDÁRIO ANUAL DE FOLGAS                           */}
      {/* ========================================================= */}
      {subTab === 'calendario_anual' && colabAnualSelecionado && (
        <div className="space-y-6">
          {/* Seletor de Colaborador e Ano */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                {colabAnualSelecionado.nome.charAt(0)}
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                  Selecionar Funcionário
                </label>
                <select
                  aria-label="Selecionar Colaborador para Calendário Anual"
                  value={colabAnualId}
                  onChange={(e) => setColabAnualId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cargoTitulo} - {c.departamentoNome})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                  Ano de Referência
                </label>
                <select
                  aria-label="Ano de Referência do Calendário Anual"
                  value={anoAnual}
                  onChange={(e) => setAnoAnual(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trabalho
                </span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Folga (Bloqueado)
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              <strong>Dica de Uso:</strong> Clique em qualquer dia dos meses abaixo para alternar instantaneamente entre <strong>Dia de Trabalho</strong> e <strong>Dia de Folga</strong> para <strong>{colabAnualSelecionado.nome}</strong>. Nos dias de folga, o sistema bloqueará automaticamente qualquer tentativa de bater ponto.
            </span>
          </div>

          {/* Grid Anual: 12 Meses (3 colunas x 4 linhas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mesesNomes.map((mesNome, mIndex) => {
              // Gera os dias do mês mIndex no anoAnual
              const firstDay = new Date(anoAnual, mIndex, 1);
              const lastDay = new Date(anoAnual, mIndex + 1, 0);
              const daysInMonth = lastDay.getDate();
              const startDayOfWeek = firstDay.getDay(); // 0 = Dom

              const defaultFolgas = colabAnualSelecionado.tipoEscala === '12x36' 
                ? [] 
                : (colabAnualSelecionado.tipoEscala === '6x1' ? [0] : [0, 6]);
              const diasFolgaEscala = colabAnualSelecionado.diasFolgaSemana ?? defaultFolgas;
              const anualFolgasMap = colabAnualSelecionado.anualFolgas || {};

              return (
                <div key={mIndex} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {mesNome} {anoAnual}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {daysInMonth} dias
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                      <span key={i} className="text-[10px] font-bold text-slate-400 py-0.5">
                        {d}
                      </span>
                    ))}

                    {/* Espaços vazios antes do dia 1 */}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {/* Dias do mês */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateObj = new Date(anoAnual, mIndex, dayNum);
                      const yyyy = anoAnual;
                      const mm = String(mIndex + 1).padStart(2, '0');
                      const dd = String(dayNum).padStart(2, '0');
                      const yyyyMmDd = `${yyyy}-${mm}-${dd}`;
                      const dayOfWeek = dateObj.getDay();

                      const isDefaultFolga = diasFolgaEscala.includes(dayOfWeek);
                      const overrideVal = anualFolgasMap[yyyyMmDd];
                      const isFolga = overrideVal !== undefined ? overrideVal : isDefaultFolga;

                      return (
                        <button
                          key={yyyyMmDd}
                          type="button"
                          onClick={() => handleToggleAnualFolgaData(colabAnualId, yyyyMmDd)}
                          title={`${dayNum} de ${mesNome}: ${isFolga ? 'FOLGA (Clique para trabalhar)' : 'TRABALHO (Clique para folga)'}`}
                          className={`h-8 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isFolga
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 shadow-2xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: MODELOS DE ESCALA & ALOCAÇÃO DE TURMAS               */}
      {/* ========================================================= */}
      {subTab === 'ciclo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Lista de Escalas Disponíveis */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Modelos de Escala Ativos
            </h3>
            <div className="space-y-2">
              {escalas.map((esc) => {
                const isSelected = esc.id === escalaSelecionadaId;
                const qtd = colaboradores.filter((c) => {
                  const tipo = (c as any).tipoEscala || '5x2';
                  const turma = (c as any).turmaEscala || 'A';
                  return esc.tipo === '12x36' ? (tipo === '12x36' && turma === (esc.turma || 'A')) : (tipo === esc.tipo);
                }).length;

                return (
                  <button
                    key={esc.id}
                    onClick={() => setEscalaSelecionadaId(esc.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{esc.nome}</span>
                        {esc.turma && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Turma {esc.turma}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Carga: {esc.jornadaHorasDiarias}h/dia</span>
                        <span>•</span>
                        <span>Intervalo: {esc.duracaoIntervaloMinutos}m</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {qtd} colab{qtd === 1 ? '' : 's'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Colaboradores recém-cadastrados ou sem escala definida são alocados automaticamente na <strong>Comercial 5x2 (8h)</strong>.
                </span>
              </div>
            </div>
          </div>

          {/* Coluna 2 e 3: Calendário de Previsão Cíclica e Gestão de Plantonistas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Regra & Parâmetros da Escala Selecionada */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Escala em Exibição</span>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {escalaAtiva.nome}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{escalaAtiva.descricaoRegra}</p>
                </div>

                {/* Seletor de Mês do Calendário */}
                <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                  <select
                    aria-label="Mês de Visualização da Escala"
                    value={mesVisualizacao}
                    onChange={(e) => setMesVisualizacao(Number(e.target.value))}
                    className="bg-transparent text-white text-xs font-semibold px-2 py-1 outline-none cursor-pointer"
                  >
                    {mesesNomes.map((nome, idx) => (
                      <option key={idx} value={idx} className="bg-slate-900 text-white">
                        {nome}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Ano de Visualização da Escala"
                    value={anoVisualizacao}
                    onChange={(e) => setAnoVisualizacao(Number(e.target.value))}
                    className="bg-transparent text-white text-xs font-semibold px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value={2026} className="bg-slate-900 text-white">2026</option>
                    <option value={2027} className="bg-slate-900 text-white">2027</option>
                  </select>
                </div>
              </div>

              {/* Visualização do Mês: Matriz de Dias */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Ciclo do Mês: {mesesNomes[mesVisualizacao]} de {anoVisualizacao}</span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Plantão / Trabalho
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Folga 36h / DSR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia, idx) => (
                    <div key={idx} className="text-center text-[11px] font-semibold text-slate-400 py-1">
                      {dia}
                    </div>
                  ))}

                  {diasMes.map((item, idx) => {
                    const diaNum = parseInt(item.dataYmd.split('-')[2], 10);
                    const isTrabalho = item.tipoDia === 'TRABALHO';

                    return (
                      <div
                        key={idx}
                        className={`min-h-[58px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                          isTrabalho
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-800/30 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono">{diaNum}</span>
                          {isTrabalho && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                              {item.cargaPrevistaHoras}h
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] truncate text-slate-400">
                          {isTrabalho ? 'Plantão' : item.tipoDia === 'DSR' ? 'DSR' : 'Folga 36h'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Atribuição de Colaboradores à Escala */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Alocação de Colaboradores nesta Escala ({colaboradoresAlocados.length})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mude a escala ou a turma de qualquer colaborador instantaneamente.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={colaboradorFiltro}
                  onChange={(e) => setColaboradorFiltro(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
                {colaboradores
                  .filter(c => !colaboradorFiltro || c.nome.toLowerCase().includes(colaboradorFiltro.toLowerCase()) || c.cpf.includes(colaboradorFiltro))
                  .map((colab) => {
                    const currentEscalaTipo = (colab as any).tipoEscala || '5x2';
                    const currentTurma = (colab as any).turmaEscala || 'A';
                    const isNestaEscala = escalaAtiva.tipo === '12x36' 
                      ? (currentEscalaTipo === '12x36' && currentTurma === (escalaAtiva.turma || 'A'))
                      : (currentEscalaTipo === escalaAtiva.tipo);

                    const defaultFolgas = currentEscalaTipo === '12x36' ? [] : (currentEscalaTipo === '6x1' ? [0] : [0, 6]);
                    const folgasColab = colab.diasFolgaSemana ?? defaultFolgas;
                    const diasSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                    return (
                      <div key={colab.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            {colab.nome}
                            {isNestaEscala && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                                Alocado Aqui
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                            <span>CPF: {colab.cpf}</span>
                            <span>•</span>
                            <span>{colab.cargoTitulo} ({colab.departamentoNome})</span>
                          </div>
                        </div>

                        {/* Configuração de Escala e Dias de Folga */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Seletor de Dias de Folga */}
                          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 px-1 font-semibold">Folgas:</span>
                            {diasSemanaAbrev.map((dName, dIdx) => {
                              const isFolga = folgasColab.includes(dIdx);
                              return (
                                <button
                                  key={dIdx}
                                  type="button"
                                  title={isFolga ? `${dName}: Dia de Folga (Ponto Bloqueado)` : `${dName}: Dia de Trabalho Permissível`}
                                  onClick={() => handleToggleDiaFolgaColaborador(colab.id, dIdx)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    isFolga 
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {dName}
                                </button>
                              );
                            })}
                          </div>

                          {/* Dropdown de Alocação de Escala */}
                          <select
                            aria-label={`Escala de Trabalho do Colaborador ${colab.nome}`}
                            value={
                              currentEscalaTipo === '12x36'
                                ? (currentTurma === 'A' ? 'esc-12x36-a' : 'esc-12x36-b')
                                : (currentEscalaTipo === '6x1' ? 'esc-6x1' : 'esc-5x2')
                            }
                            onChange={(e) => handleTrocarEscalaColaborador(colab.id, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="esc-5x2">5x2 Comercial (8h)</option>
                            <option value="esc-12x36-a">12x36 Turma A (Plantão)</option>
                            <option value="esc-12x36-b">12x36 Turma B (Plantão)</option>
                            <option value="esc-6x1">6x1 Varejo (7h20m)</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
