import React, { useState } from 'react';
import { Colaborador } from '../types/operational';
import { EscalaTrabalhoConfig, TipoEscalaTrabalho } from '../types/rhAvancado';
import { ESCALAS_PADRAO, calcularStatusDiaEscala, gerarCalendarioMesEscala } from '../utils/shiftEngine';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  CalendarDays,
  UserCheck,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface GestaoEscalasProps {
  colaboradores: Colaborador[];
  onUpdateColaboradores: (novos: Colaborador[]) => void;
}

export function GestaoEscalas({ colaboradores, onUpdateColaboradores }: GestaoEscalasProps) {
  const [escalas, setEscalas] = useState<EscalaTrabalhoConfig[]>(ESCALAS_PADRAO);
  const [escalaSelecionadaId, setEscalaSelecionadaId] = useState<string>('esc-12x36-a');
  const [mesVisualizacao, setMesVisualizacao] = useState<number>(10); // Novembro (zero-indexed: 10)
  const [anoVisualizacao, setAnoVisualizacao] = useState<number>(2026);
  const [colaboradorFiltro, setColaboradorFiltro] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const escalaAtiva = escalas.find((e) => e.id === escalaSelecionadaId) || escalas[0];

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
              Gestão Corporativa de Jornadas & Turnos
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Escalas 12x36, 6x1 e Revezamento Cíclico</h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Configuração com conformidade CLT Art. 59-A (Jornada 12x36) e Art. 67 (Repouso Semanal Remunerado). Alterne colaboradores entre turmas de plantão sem quebrar o histórico de registros.
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

      {/* Grid: Seletor de Escalas e Detalhes da Regra */}
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

                  return (
                    <div key={colab.id} className="py-3 flex items-center justify-between gap-4">
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

                      {/* Dropdown de Alocação de Escala */}
                      <div className="flex items-center gap-2">
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
    </div>
  );
}
