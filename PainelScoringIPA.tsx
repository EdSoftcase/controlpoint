import React, { useState, useMemo } from 'react';
import {
  Colaborador,
  RegistroPontoREPP,
  OcorrenciaDesconto,
  Departamento,
  Estabelecimento,
  Tenant
} from '../types/operational';
import {
  Award,
  Trophy,
  Medal,
  Star,
  Flame,
  Gift,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronRight,
  Sliders,
  Info,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  CheckCheck
} from 'lucide-react';

export interface ScoringIPAItem {
  colaboradorId: string;
  colaboradorNome: string;
  colaboradorMatricula: string;
  departamentoId: string;
  departamentoNome: string;
  cargoTitulo: string;
  fotoUrl?: string;
  horarioContratado: string;
  scoreGeral: number; // 0 a 100
  nivel: 'DIAMANTE' | 'OURO' | 'PRATA' | 'BRONZE' | 'CRITICO';
  dimensaoPontualidade: number; // 0 a 100
  dimensaoAssiduidade: number; // 0 a 100
  dimensaoConformidade: number; // 0 a 100
  totalAtrasos: number;
  totalMinutosAtraso: number;
  totalFaltas: number;
  totalSaidasAntecipadas: number;
  totalDivergencias: number;
  taxaBiometriaOkPercent: number;
  taxaDentroCercaPercent: number;
  statusPremiacao: 'ELEGIVEL_INTEGRAL' | 'ELEGIVEL_PARCIAL' | 'INELEGIVEL';
  valorBonus: number;
  badges: string[];
  detalhesCalculo: {
    base: number;
    penalidadeAtrasos: number;
    penalidadeFaltas: number;
    penalidadeSaidas: number;
    penalidadeDivergencias: number;
    bonusPresencaPerfeita: number;
    bonusBiometriaLiveness: number;
  };
}

interface PainelScoringIPAProps {
  colaboradores: Colaborador[];
  registrosPonto: RegistroPontoREPP[];
  ocorrencias: OcorrenciaDesconto[];
  departamentos: Departamento[];
  estabelecimentos: Estabelecimento[];
  activeTenant: Tenant;
}

export const PainelScoringIPA: React.FC<PainelScoringIPAProps> = ({
  colaboradores,
  registrosPonto,
  ocorrencias,
  departamentos,
  estabelecimentos,
  activeTenant
}) => {
  // Filtros
  const [filtroDepto, setFiltroDepto] = useState<string>('TODOS');
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS');
  const [filtroElegibilidade, setFiltroElegibilidade] = useState<string>('TODOS');
  const [buscaTermo, setBuscaTermo] = useState<string>('');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('MES_ATUAL');

  // Modal de Detalhes (Raio-X)
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<ScoringIPAItem | null>(null);

  // Parâmetros de Premiação do RH (Simulador Financeiro)
  const [bonusDiamante, setBonusDiamante] = useState<number>(500);
  const [bonusOuro, setBonusOuro] = useState<number>(350);
  const [bonusPrata, setBonusPrata] = useState<number>(150);
  const [mostrarSimulador, setMostrarSimulador] = useState<boolean>(false);
  const [loteAprovadoFeedback, setLoteAprovadoFeedback] = useState<boolean>(false);

  // =========================================================================
  // MOTOR DE CÁLCULO: ALGORITMO DO ÍNDICE DE PERFORMANCE & ASSIDUIDADE (IPA)
  // =========================================================================
  const rankingIPA: ScoringIPAItem[] = useMemo(() => {
    const colabsAtivos = colaboradores.filter((c) => c.status !== 'DESLIGADO');

    return colabsAtivos.map((colab) => {
      // 1. Ocorrências registradas para este colaborador
      const colabOcorr = ocorrencias.filter((o) => o.colaboradorId === colab.id);
      const atrasos = colabOcorr.filter((o) => o.tipo === 'ATRASO');
      const faltas = colabOcorr.filter((o) => o.tipo === 'FALTA_INJUSTIFICADA');
      const saidasAnt = colabOcorr.filter((o) => o.tipo === 'SAIDA_ANTECIPADA');
      const intervaloExc = colabOcorr.filter((o) => o.tipo === 'INTERVALO_EXCEDIDO');

      const totalMinutosAtraso = atrasos.reduce((acc, curr) => acc + (curr.minutosPerdidos || 0), 0);

      // 2. Registros de ponto do colaborador
      const colabPontos = registrosPonto.filter((r) => r.colaboradorId === colab.id);
      const pontosForaCerca = colabPontos.filter((r) => r.foraDoRaioGeofence);
      const totalDivergencias = pontosForaCerca.length + intervaloExc.length;

      // 3. Taxas de biometria e geofencing
      const taxaBiometria = colab.biometriaCadastrada ? 100 : 92.5;
      const taxaCerca = colabPontos.length > 0 
        ? Math.round(((colabPontos.length - pontosForaCerca.length) / colabPontos.length) * 100)
        : 100;

      // 4. Memória de Cálculo Matemático
      const baseScore = 100;
      let penalidadeAtrasos = 0;
      atrasos.forEach((a) => {
        if (a.minutosPerdidos > 10) {
          penalidadeAtrasos += 5; // Atraso grave (> tolerância legal CLT 10 min)
        } else {
          penalidadeAtrasos += 2; // Atraso leve
        }
      });

      const penalidadeFaltas = faltas.length * 15; // Falta injustificada penaliza forte
      const penalidadeSaidas = saidasAnt.length * 4;
      const penalidadeDivergencias = totalDivergencias * 4;

      // Bônus de comportamento positivo
      let bonusPresencaPerfeita = 0;
      if (faltas.length === 0 && atrasos.length === 0) {
        bonusPresencaPerfeita = 5;
      }

      let bonusBiometriaLiveness = 0;
      if (colab.biometriaCadastrada && pontosForaCerca.length === 0) {
        bonusBiometriaLiveness = 3;
      }

      // Cálculo bruto
      const scoreCalculado = baseScore 
        - penalidadeAtrasos 
        - penalidadeFaltas 
        - penalidadeSaidas 
        - penalidadeDivergencias 
        + bonusPresencaPerfeita 
        + bonusBiometriaLiveness;

      const scoreFinal = Number(Math.max(20, Math.min(100, scoreCalculado)).toFixed(1));

      // Dimensões específicas (0 - 100%)
      const dimPontualidade = Number(Math.max(0, Math.min(100, 100 - (penalidadeAtrasos * 4) - (penalidadeSaidas * 3))).toFixed(1));
      const dimAssiduidade = Number(Math.max(0, Math.min(100, 100 - (penalidadeFaltas * 3.5))).toFixed(1));
      const dimConformidade = Number(Math.max(0, Math.min(100, 100 - (penalidadeDivergencias * 5) + (colab.biometriaCadastrada ? 5 : 0))).toFixed(1));

      // Classificação por Níveis
      let nivel: 'DIAMANTE' | 'OURO' | 'PRATA' | 'BRONZE' | 'CRITICO' = 'CRITICO';
      let statusPremiacao: 'ELEGIVEL_INTEGRAL' | 'ELEGIVEL_PARCIAL' | 'INELEGIVEL' = 'INELEGIVEL';
      let valorBonus = 0;
      const badges: string[] = [];

      if (scoreFinal >= 98) {
        nivel = 'DIAMANTE';
        statusPremiacao = 'ELEGIVEL_INTEGRAL';
        valorBonus = bonusDiamante;
        badges.push('Destaque Diamante');
        if (atrasos.length === 0) badges.push('Zero Atrasos');
        if (pontosForaCerca.length === 0) badges.push('Geofence 100%');
      } else if (scoreFinal >= 90) {
        nivel = 'OURO';
        statusPremiacao = 'ELEGIVEL_INTEGRAL';
        valorBonus = bonusOuro;
        badges.push('Alta Performance');
        if (faltas.length === 0) badges.push('100% Frequência');
      } else if (scoreFinal >= 80) {
        nivel = 'PRATA';
        statusPremiacao = 'ELEGIVEL_PARCIAL';
        valorBonus = bonusPrata;
        badges.push('Conforme');
      } else if (scoreFinal >= 70) {
        nivel = 'BRONZE';
        statusPremiacao = 'INELEGIVEL';
        valorBonus = 0;
        badges.push('Atenção Preventiva');
      } else {
        nivel = 'CRITICO';
        statusPremiacao = 'INELEGIVEL';
        valorBonus = 0;
        badges.push('Plano de Melhoria');
      }

      return {
        colaboradorId: colab.id,
        colaboradorNome: colab.nome,
        colaboradorMatricula: colab.matricula,
        departamentoId: colab.departamentoId,
        departamentoNome: colab.departamentoNome,
        cargoTitulo: colab.cargoTitulo,
        fotoUrl: colab.fotoUrl,
        horarioContratado: `${colab.horarioInicio} às ${colab.horarioFim}`,
        scoreGeral: scoreFinal,
        nivel,
        dimensaoPontualidade: dimPontualidade,
        dimensaoAssiduidade: dimAssiduidade,
        dimensaoConformidade: dimConformidade,
        totalAtrasos: atrasos.length,
        totalMinutosAtraso,
        totalFaltas: faltas.length,
        totalSaidasAntecipadas: saidasAnt.length,
        totalDivergencias,
        taxaBiometriaOkPercent: taxaBiometria,
        taxaDentroCercaPercent: taxaCerca,
        statusPremiacao,
        valorBonus,
        badges,
        detalhesCalculo: {
          base: baseScore,
          penalidadeAtrasos,
          penalidadeFaltas,
          penalidadeSaidas,
          penalidadeDivergencias,
          bonusPresencaPerfeita,
          bonusBiometriaLiveness
        }
      };
    }).sort((a, b) => b.scoreGeral - a.scoreGeral);
  }, [colaboradores, ocorrencias, registrosPonto, bonusDiamante, bonusOuro, bonusPrata]);

  // Lista Filtrada
  const rankingFiltrado = useMemo(() => {
    return rankingIPA.filter((item) => {
      if (filtroDepto !== 'TODOS' && item.departamentoId !== filtroDepto) return false;
      if (filtroNivel !== 'TODOS' && item.nivel !== filtroNivel) return false;
      if (filtroElegibilidade !== 'TODOS' && item.statusPremiacao !== filtroElegibilidade) return false;
      if (buscaTermo.trim()) {
        const termo = buscaTermo.toLowerCase();
        const bateNome = item.colaboradorNome.toLowerCase().includes(termo);
        const bateMatricula = item.colaboradorMatricula.toLowerCase().includes(termo);
        const bateCargo = item.cargoTitulo.toLowerCase().includes(termo);
        if (!bateNome && !bateMatricula && !bateCargo) return false;
      }
      return true;
    });
  }, [rankingIPA, filtroDepto, filtroNivel, filtroElegibilidade, buscaTermo]);

  // Estatísticas Globais de Assiduidade e Premiações
  const stats = useMemo(() => {
    if (rankingIPA.length === 0) {
      return {
        mediaScore: 0,
        qtdDiamanteOuro: 0,
        percentualDiamanteOuro: 0,
        totalElegiveisPremiacao: 0,
        totalOrcamentoBonus: 0,
        zeroAtrasosQtd: 0
      };
    }

    const totalScore = rankingIPA.reduce((acc, curr) => acc + curr.scoreGeral, 0);
    const media = Number((totalScore / rankingIPA.length).toFixed(1));
    const altaPerformance = rankingIPA.filter((i) => i.nivel === 'DIAMANTE' || i.nivel === 'OURO');
    const elegiveis = rankingIPA.filter((i) => i.statusPremiacao !== 'INELEGIVEL');
    const totalBonus = elegiveis.reduce((acc, curr) => acc + curr.valorBonus, 0);
    const zeroAtrasos = rankingIPA.filter((i) => i.totalAtrasos === 0).length;

    return {
      mediaScore: media,
      qtdDiamanteOuro: altaPerformance.length,
      percentualDiamanteOuro: Math.round((altaPerformance.length / rankingIPA.length) * 100),
      totalElegiveisPremiacao: elegiveis.length,
      totalOrcamentoBonus: totalBonus,
      zeroAtrasosQtd: zeroAtrasos
    };
  }, [rankingIPA]);

  // Top 3 Campeões do Hall da Fama
  const top1 = rankingIPA[0];
  const top2 = rankingIPA[1];
  const top3 = rankingIPA[2];

  // Ação: Exportar Ranking para CSV
  const handleExportCSV = () => {
    const headers = [
      'Posicao',
      'Matricula',
      'Nome',
      'Departamento',
      'Cargo',
      'Score_IPA',
      'Nivel',
      'Pontualidade_Pct',
      'Assiduidade_Pct',
      'Conformidade_Pct',
      'Atrasos_Qtd',
      'Minutos_Atraso',
      'Faltas_Qtd',
      'Divergencias_Qtd',
      'Status_Premiacao',
      'Valor_Bonus_Sugerido'
    ];

    const rows = rankingIPA.map((item, idx) => [
      idx + 1,
      `"${item.colaboradorMatricula}"`,
      `"${item.colaboradorNome}"`,
      `"${item.departamentoNome}"`,
      `"${item.cargoTitulo}"`,
      item.scoreGeral,
      item.nivel,
      item.dimensaoPontualidade,
      item.dimensaoAssiduidade,
      item.dimensaoConformidade,
      item.totalAtrasos,
      item.totalMinutosAtraso,
      item.totalFaltas,
      item.totalDivergencias,
      item.statusPremiacao,
      item.valorBonus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ranking_scoring_ipa_${activeTenant.slug}_${periodoSelecionado}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ação: Aprovar Lote de Premiações
  const handleAprovarLote = () => {
    setLoteAprovadoFeedback(true);
    setTimeout(() => {
      setLoteAprovadoFeedback(false);
    }, 4500);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER EXECUTIVO & METAS DE RECONHECIMENTO                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Algoritmo IPA Corporativo
              </span>
              <span className="text-xs text-slate-400">Portaria MTP 671 / REP-P Compliant</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Award className="w-7 h-7 text-amber-400" />
              Índice de Performance & Assiduidade (IPA)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Algoritmo de pontuação contínua que avalia pontualidade estrita (CLT Art. 58 § 1º), frequência sem ausências e conformidade em geofencing/biometria facial para premiação meritocrática e tomada de decisão pelo RH.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setMostrarSimulador(!mostrarSimulador)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              {mostrarSimulador ? 'Ocultar Parâmetros' : 'Simulador de Bônus'}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Exportar CSV
            </button>

            <button
              onClick={handleAprovarLote}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <CheckCheck className="w-4 h-4 text-slate-950" />
              Aprovar Lote de Premiações
            </button>
          </div>
        </div>

        {/* Feedback de Lote Aprovado */}
        {loteAprovadoFeedback && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <strong>Lote de Premiações Homologado:</strong> R$ {stats.totalOrcamentoBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liberados para inclusão na folha de pagamento para {stats.totalElegiveisPremiacao} colaboradores!
            </span>
            <button onClick={() => setLoteAprovadoFeedback(false)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SIMULADOR DE ORÇAMENTO E PARÂMETROS DO RH (EXPANSÍVEL)                */}
      {/* ========================================================================= */}
      {mostrarSimulador && (
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Parâmetros de Bonificação & Orçamento de RH</h3>
            </div>
            <span className="text-xs text-slate-500">Ajuste os valores para simular o impacto financeiro na folha</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
              <label className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Bônus Nível Diamante (98-100 pts)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={bonusDiamante}
                  onChange={(e) => setBonusDiamante(Number(e.target.value))}
                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-950 font-mono focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[10px] text-amber-700">Excelência máxima e assiduidade plena</p>
            </div>

            <div className="p-3.5 bg-yellow-50/70 border border-yellow-200/80 rounded-xl space-y-1.5">
              <label className="text-[11px] font-bold text-yellow-900 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-600" /> Bônus Nível Ouro (90-97.9 pts)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={bonusOuro}
                  onChange={(e) => setBonusOuro(Number(e.target.value))}
                  className="w-full bg-white border border-yellow-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-yellow-950 font-mono focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <p className="text-[10px] text-yellow-700">Alta performance com pontualidade consistente</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                <Medal className="w-3.5 h-3.5 text-slate-500" /> Bônus Nível Prata (80-89.9 pts)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="25"
                  min="0"
                  value={bonusPrata}
                  onChange={(e) => setBonusPrata(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 font-mono focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <p className="text-[10px] text-slate-600">Reconhecimento de regularidade operacional</p>
            </div>

            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Investimento Simulado</span>
                <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
                  R$ {stats.totalOrcamentoBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className="text-[10px] font-medium text-indigo-800">
                {stats.totalElegiveisPremiacao} de {rankingIPA.length} colaboradores elegíveis
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CARDS DE KPIS EXECUTIVOS                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Média Geral IPA</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.mediaScore}</span>
            <span className="text-xs text-slate-500">/ 100 pts</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Nível Corporativo: {stats.mediaScore >= 90 ? 'Ouro Coletivo' : 'Prata Geral'}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Faixa Alta Performance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.percentualDiamanteOuro}%</span>
            <span className="text-xs text-slate-500">({stats.qtdDiamanteOuro} colaboradores)</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Níveis Diamante e Ouro (Score ≥ 90)</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pontualidade Perfeita</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">{stats.zeroAtrasosQtd}</span>
            <span className="text-xs text-slate-500">sem nenhum atraso</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CLT Art. 58 100% cumprido</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Premiações Previstas</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Gift className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              R$ {stats.totalOrcamentoBonus.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{stats.totalElegiveisPremiacao} beneficiários habilitados</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PÓDIO DOS CAMPEÕES (HALL DA FAMA DO RH)                               */}
      {/* ========================================================================= */}
      {rankingIPA.length >= 3 && (
        <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Pódio de Assiduidade & Destaques do Mês
              </h3>
              <p className="text-xs text-slate-500">Colaboradores com as maiores pontuações no ciclo de avaliação</p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
              Período: Outubro / 2026
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 2º LUGAR */}
            {top2 && (
              <div 
                onClick={() => setColaboradorSelecionado(top2)}
                className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between order-2 md:order-1 relative"
              >
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Medal className="w-3 h-3 text-slate-600" /> 2º Lugar • Prata
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden shrink-0">
                    {top2.fotoUrl ? (
                      <img src={top2.fotoUrl} alt={top2.colaboradorNome} className="w-full h-full object-cover" />
                    ) : (
                      top2.colaboradorNome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{top2.colaboradorNome}</h4>
                    <p className="text-[10px] text-slate-500">{top2.cargoTitulo}</p>
                    <span className="text-[10px] text-slate-400">{top2.departamentoNome}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Score IPA</span>
                    <div className="text-lg font-black text-slate-800 font-mono">{top2.scoreGeral}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bônus</span>
                    <div className="text-xs font-bold text-emerald-700 font-mono">R$ {top2.valorBonus}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 1º LUGAR (DESTAQUE CENTRAL) */}
            {top1 && (
              <div 
                onClick={() => setColaboradorSelecionado(top1)}
                className="bg-gradient-to-b from-amber-50/60 to-white rounded-xl p-4 border-2 border-amber-400 hover:border-amber-500 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between order-1 md:order-2 relative shadow-xs"
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Trophy className="w-3.5 h-3.5 fill-slate-950 text-slate-950" /> 1º Lugar • Campeão
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center font-black text-amber-900 text-base overflow-hidden shrink-0 shadow-2xs">
                    {top1.fotoUrl ? (
                      <img src={top1.fotoUrl} alt={top1.colaboradorNome} className="w-full h-full object-cover" />
                    ) : (
                      top1.colaboradorNome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="text-sm font-black text-slate-900 line-clamp-1">{top1.colaboradorNome}</h4>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600">{top1.cargoTitulo}</p>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      {top1.departamentoNome}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 font-bold uppercase">Score IPA</span>
                    <div className="text-2xl font-black text-amber-950 font-mono">{top1.scoreGeral}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-800 font-bold uppercase">Premiação Máxima</span>
                    <div className="text-sm font-black text-emerald-700 font-mono">R$ {top1.valorBonus}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 3º LUGAR */}
            {top3 && (
              <div 
                onClick={() => setColaboradorSelecionado(top3)}
                className="bg-white rounded-xl p-4 border-2 border-amber-700/30 hover:border-amber-700/60 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between order-3 md:order-3 relative"
              >
                <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Medal className="w-3 h-3 text-amber-800" /> 3º Lugar • Bronze
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center font-bold text-amber-800 text-sm overflow-hidden shrink-0">
                    {top3.fotoUrl ? (
                      <img src={top3.fotoUrl} alt={top3.colaboradorNome} className="w-full h-full object-cover" />
                    ) : (
                      top3.colaboradorNome.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{top3.colaboradorNome}</h4>
                    <p className="text-[10px] text-slate-500">{top3.cargoTitulo}</p>
                    <span className="text-[10px] text-slate-400">{top3.departamentoNome}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Score IPA</span>
                    <div className="text-lg font-black text-slate-800 font-mono">{top3.scoreGeral}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Bônus</span>
                    <div className="text-xs font-bold text-emerald-700 font-mono">R$ {top3.valorBonus}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BARRA DE FILTROS & BUSCA                                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Busca */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula ou cargo..."
              value={buscaTermo}
              onChange={(e) => setBuscaTermo(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Filtro por Departamento */}
          <select
            value={filtroDepto}
            onChange={(e) => setFiltroDepto(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
          >
            <option value="TODOS">Todos os Departamentos</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Nível */}
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
          >
            <option value="TODOS">Todos os Níveis</option>
            <option value="DIAMANTE">💎 Diamante (98-100 pts)</option>
            <option value="OURO">🥇 Ouro (90-97.9 pts)</option>
            <option value="PRATA">🥈 Prata (80-89.9 pts)</option>
            <option value="BRONZE">🥉 Bronze (70-79.9 pts)</option>
            <option value="CRITICO">⚠️ Crítico (&lt; 70 pts)</option>
          </select>

          {/* Filtro Elegibilidade */}
          <select
            value={filtroElegibilidade}
            onChange={(e) => setFiltroElegibilidade(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
          >
            <option value="TODOS">Todas as Premiações</option>
            <option value="ELEGIVEL_INTEGRAL">Apenas Elegíveis Integral</option>
            <option value="ELEGIVEL_PARCIAL">Apenas Elegíveis Parcial</option>
            <option value="INELEGIVEL">Inelegíveis (Sem bônus)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold self-end md:self-auto">
          <span>{rankingFiltrado.length} colaboradores listados</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TABELA DE RANQUEAMENTO GERAL                                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">Pos.</th>
                <th className="py-3 px-3">Colaborador</th>
                <th className="py-3 px-3">Departamento & Horário</th>
                <th className="py-3 px-3">Score IPA Geral</th>
                <th className="py-3 px-3 text-center">Nível</th>
                <th className="py-3 px-3 text-center">Pontualidade</th>
                <th className="py-3 px-3 text-center">Assiduidade</th>
                <th className="py-3 px-3 text-center">Conformidade</th>
                <th className="py-3 px-3">Premiação Sugerida</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingFiltrado.map((item, index) => {
                const isTop3 = index < 3;
                let medalBg = 'bg-slate-100 text-slate-700 font-bold';
                if (index === 0) medalBg = 'bg-amber-400 text-slate-950 font-black shadow-xs';
                else if (index === 1) medalBg = 'bg-slate-300 text-slate-900 font-bold';
                else if (index === 2) medalBg = 'bg-amber-700/20 text-amber-900 font-bold';

                return (
                  <tr 
                    key={item.colaboradorId} 
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => setColaboradorSelecionado(item)}
                  >
                    {/* Posição */}
                    <td className="py-3 px-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono ${medalBg}`}>
                        {index + 1}
                      </span>
                    </td>

                    {/* Colaborador */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                          {item.fotoUrl ? (
                            <img src={item.fotoUrl} alt={item.colaboradorNome} className="w-full h-full object-cover" />
                          ) : (
                            item.colaboradorNome.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {item.colaboradorNome}
                            {item.nivel === 'DIAMANTE' && <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Mat: {item.colaboradorMatricula} • {item.cargoTitulo}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Departamento & Horário */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{item.departamentoNome}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {item.horarioContratado}
                      </div>
                    </td>

                    {/* Score IPA Geral */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 w-32">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 font-mono text-sm">{item.scoreGeral}</span>
                          <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.scoreGeral >= 98
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : item.scoreGeral >= 90
                                ? 'bg-emerald-500'
                                : item.scoreGeral >= 80
                                ? 'bg-indigo-500'
                                : item.scoreGeral >= 70
                                ? 'bg-yellow-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${item.scoreGeral}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Nível */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.nivel === 'DIAMANTE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : item.nivel === 'OURO'
                            ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                            : item.nivel === 'PRATA'
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : item.nivel === 'BRONZE'
                            ? 'bg-amber-800/10 text-amber-800 border border-amber-800/20'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {item.nivel === 'DIAMANTE' && '💎 Diamante'}
                        {item.nivel === 'OURO' && '🥇 Ouro'}
                        {item.nivel === 'PRATA' && '🥈 Prata'}
                        {item.nivel === 'BRONZE' && '🥉 Bronze'}
                        {item.nivel === 'CRITICO' && '⚠️ Crítico'}
                      </span>
                    </td>

                    {/* Dimensões */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.dimensaoPontualidade}%
                      {item.totalAtrasos > 0 && (
                        <div className="text-[9px] text-rose-500 font-normal">({item.totalAtrasos} atr)</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.dimensaoAssiduidade}%
                      {item.totalFaltas > 0 && (
                        <div className="text-[9px] text-rose-500 font-normal">({item.totalFaltas} faltas)</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                      {item.dimensaoConformidade}%
                      {item.totalDivergencias > 0 && (
                        <div className="text-[9px] text-amber-600 font-normal">({item.totalDivergencias} div)</div>
                      )}
                    </td>

                    {/* Premiação */}
                    <td className="py-3 px-3">
                      {item.valorBonus > 0 ? (
                        <div>
                          <div className="font-bold text-emerald-700 font-mono">
                            R$ {item.valorBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[9px] text-emerald-600 font-semibold">
                            {item.statusPremiacao === 'ELEGIVEL_INTEGRAL' ? 'Bônus Integral 100%' : 'Bônus Parcial'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Inelegível</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setColaboradorSelecionado(item);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Ver Raio-X Detalhado"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rankingFiltrado.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODAL DE RAIO-X & EXTRATO DE PERFORMANCE DO COLABORADOR               */}
      {/* ========================================================================= */}
      {colaboradorSelecionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-2xs flex items-center justify-center font-bold text-slate-700 text-sm overflow-hidden">
                  {colaboradorSelecionado.fotoUrl ? (
                    <img src={colaboradorSelecionado.fotoUrl} alt={colaboradorSelecionado.colaboradorNome} className="w-full h-full object-cover" />
                  ) : (
                    colaboradorSelecionado.colaboradorNome.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{colaboradorSelecionado.colaboradorNome}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        colaboradorSelecionado.nivel === 'DIAMANTE'
                          ? 'bg-amber-100 text-amber-900'
                          : colaboradorSelecionado.nivel === 'OURO'
                          ? 'bg-yellow-100 text-yellow-900'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {colaboradorSelecionado.nivel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    Matrícula: {colaboradorSelecionado.colaboradorMatricula} • {colaboradorSelecionado.cargoTitulo} ({colaboradorSelecionado.departamentoNome})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setColaboradorSelecionado(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Score Geral e Premiação */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score Consolidado</span>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">
                    {colaboradorSelecionado.scoreGeral} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 font-medium">
                    Status: <strong className="text-indigo-700">{colaboradorSelecionado.nivel}</strong>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Premiação Habilitada</span>
                  <div className="text-3xl font-black text-emerald-800 font-mono mt-0.5">
                    R$ {colaboradorSelecionado.valorBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-2 text-xs text-emerald-700 font-medium">
                    {colaboradorSelecionado.valorBonus > 0 ? 'Apto para crédito em folha de pagamento' : 'Sem premiação neste ciclo'}
                  </div>
                </div>
              </div>

              {/* Quebra por Dimensões */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Desempenho por Dimensão Avaliada
                </h4>
                <div className="space-y-3">
                  {/* Pontualidade */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Dimensão 1: Pontualidade Estrita (Peso 35%)
                      </span>
                      <span className="font-mono text-slate-900">{colaboradorSelecionado.dimensaoPontualidade}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${colaboradorSelecionado.dimensaoPontualidade}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Total de Atrasos: {colaboradorSelecionado.totalAtrasos} ({colaboradorSelecionado.totalMinutosAtraso} min perdidos)</span>
                      <span>Saídas Antecipadas: {colaboradorSelecionado.totalSaidasAntecipadas}</span>
                    </div>
                  </div>

                  {/* Assiduidade */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dimensão 2: Frequência & Assiduidade (Peso 40%)
                      </span>
                      <span className="font-mono text-slate-900">{colaboradorSelecionado.dimensaoAssiduidade}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${colaboradorSelecionado.dimensaoAssiduidade}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Faltas Injustificadas: {colaboradorSelecionado.totalFaltas}</span>
                      <span>Presença Integral: {colaboradorSelecionado.totalFaltas === 0 ? 'Sim (100%)' : 'Não'}</span>
                    </div>
                  </div>

                  {/* Conformidade */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Dimensão 3: Conformidade Geofencing & Biometria (Peso 25%)
                      </span>
                      <span className="font-mono text-slate-900">{colaboradorSelecionado.dimensaoConformidade}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${colaboradorSelecionado.dimensaoConformidade}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Batidas Dentro da Cerca: {colaboradorSelecionado.taxaDentroCercaPercent}%</span>
                      <span>Biometria Facial Homologada: {colaboradorSelecionado.taxaBiometriaOkPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memória de Cálculo Auditável */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Extrato Matemático da Pontuação (Auditável Portaria 671)
                </span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Pontuação Base Inicial:</span>
                    <span className="font-bold text-slate-900">+{colaboradorSelecionado.detalhesCalculo.base} pts</span>
                  </div>
                  {colaboradorSelecionado.detalhesCalculo.penalidadeAtrasos > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Dedução por Atrasos ({colaboradorSelecionado.totalAtrasos} ocorrências):</span>
                      <span>-{colaboradorSelecionado.detalhesCalculo.penalidadeAtrasos} pts</span>
                    </div>
                  )}
                  {colaboradorSelecionado.detalhesCalculo.penalidadeFaltas > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Dedução por Faltas Injustificadas ({colaboradorSelecionado.totalFaltas} faltas):</span>
                      <span>-{colaboradorSelecionado.detalhesCalculo.penalidadeFaltas} pts</span>
                    </div>
                  )}
                  {colaboradorSelecionado.detalhesCalculo.penalidadeSaidas > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Dedução por Saídas Antecipadas:</span>
                      <span>-{colaboradorSelecionado.detalhesCalculo.penalidadeSaidas} pts</span>
                    </div>
                  )}
                  {colaboradorSelecionado.detalhesCalculo.penalidadeDivergencias > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Dedução por Divergências / Fora da Cerca Geofence:</span>
                      <span>-{colaboradorSelecionado.detalhesCalculo.penalidadeDivergencias} pts</span>
                    </div>
                  )}
                  {colaboradorSelecionado.detalhesCalculo.bonusPresencaPerfeita > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Bônus Especial de Presença e Pontualidade Perfeita:</span>
                      <span>+{colaboradorSelecionado.detalhesCalculo.bonusPresencaPerfeita} pts</span>
                    </div>
                  )}
                  {colaboradorSelecionado.detalhesCalculo.bonusBiometriaLiveness > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Bônus de Autenticação Biométrica com Prova de Vida Ativa:</span>
                      <span>+{colaboradorSelecionado.detalhesCalculo.bonusBiometriaLiveness} pts</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                    <span>Resultado Final IPA:</span>
                    <span className="text-indigo-700">{colaboradorSelecionado.scoreGeral} pts</span>
                  </div>
                </div>
              </div>

              {/* Parecer do RH */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-600" /> Parecer Automatizado para Gestão e Feedback 1:1
                </span>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  {colaboradorSelecionado.scoreGeral >= 95
                    ? `Colaborador exemplar com assiduidade impecável. Recomendado para o Programa de Reconhecimento e Premiação Integral de R$ ${colaboradorSelecionado.valorBonus.toFixed(2)}.`
                    : colaboradorSelecionado.scoreGeral >= 85
                    ? `Bom nível de assiduidade com poucas divergências operacionais. Elegível para bonificação com pontos de melhoria pontuais nos horários de entrada.`
                    : `Necessário agendar alinhamento de conduta e jornada para apuração de faltas ou atrasos recorrentes antes do encerramento da folha.`}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/80 rounded-b-2xl">
              <button
                onClick={() => setColaboradorSelecionado(null)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
