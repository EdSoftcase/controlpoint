import React, { useState, useMemo } from 'react';
import { 
  OcorrenciaDesconto, 
  Departamento, 
  Colaborador, 
  TipoOcorrenciaDesconto, 
  StatusTratamentoOcorrencia 
} from '../types/operational';
import {
  FileText,
  Filter,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Search,
  DollarSign,
  TrendingDown,
  BarChart3,
  PieChart,
  ListFilter,
  FileSpreadsheet,
  Check,
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react';

interface ModuloRelatoriosOcorrenciasProps {
  ocorrencias: OcorrenciaDesconto[];
  onUpdateOcorrencias: (novas: OcorrenciaDesconto[]) => void;
  departamentos: Departamento[];
  colaboradores: Colaborador[];
}

export const ModuloRelatoriosOcorrencias: React.FC<ModuloRelatoriosOcorrenciasProps> = ({
  ocorrencias,
  onUpdateOcorrencias,
  departamentos,
  colaboradores
}) => {
  // Modo de visualização do relatório: Sintético (Gerencial), Analítico (por Colaborador) ou Detalhado (Operacional)
  const [reportViewMode, setReportViewMode] = useState<'sintetico' | 'analitico' | 'detalhado'>('sintetico');

  // Filtros Globais
  const [dataInicio, setDataInicio] = useState<string>('2026-10-01');
  const [dataFim, setDataFim] = useState<string>('2026-11-30');
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>('TODOS');
  const [selectedTipoOcorrencia, setSelectedTipoOcorrencia] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Tratamento de Ocorrência pelo RH
  const [tratandoOcorrencia, setTratandoOcorrencia] = useState<OcorrenciaDesconto | null>(null);
  const [novoStatusTratamento, setNovoStatusTratamento] = useState<StatusTratamentoOcorrencia>('CONFIRMADO_DESCONTO');
  const [justificativaTratamento, setJustificativaTratamento] = useState<string>('');
  const [cidInput, setCidInput] = useState<string>('');

  // Atalhos Rápidos de Período
  const handleSetPeriodo = (preset: 'mes_atual' | 'mes_anterior' | 'ultimos_30' | 'tudo') => {
    if (preset === 'mes_atual') {
      setDataInicio('2026-11-01');
      setDataFim('2026-11-30');
    } else if (preset === 'mes_anterior') {
      setDataInicio('2026-10-01');
      setDataFim('2026-10-31');
    } else if (preset === 'ultimos_30') {
      setDataInicio('2026-10-05');
      setDataFim('2026-11-03');
    } else {
      setDataInicio('2026-01-01');
      setDataFim('2026-12-31');
    }
  };

  // Filtragem dos Dados
  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((o) => {
      // Filtro de Data
      if (dataInicio && o.data < dataInicio) return false;
      if (dataFim && o.data > dataFim) return false;

      // Filtro de Departamento
      if (selectedDepartamentoId !== 'TODOS' && o.departamentoId !== selectedDepartamentoId) {
        return false;
      }

      // Filtro de Tipo
      if (selectedTipoOcorrencia !== 'TODOS' && o.tipo !== selectedTipoOcorrencia) {
        return false;
      }

      // Filtro de Status
      if (selectedStatus !== 'TODOS' && o.status !== selectedStatus) {
        return false;
      }

      // Busca textual por nome, CPF ou matrícula
      if (searchTerm.trim()) {
        const clean = searchTerm.toLowerCase();
        const matchNome = o.colaboradorNome.toLowerCase().includes(clean);
        const matchCpf = o.colaboradorCpf.includes(clean);
        const matchMatricula = o.colaboradorMatricula.toLowerCase().includes(clean);
        if (!matchNome && !matchCpf && !matchMatricula) return false;
      }

      return true;
    });
  }, [ocorrencias, dataInicio, dataFim, selectedDepartamentoId, selectedTipoOcorrencia, selectedStatus, searchTerm]);

  // Cálculos Consolidados para os Relatórios
  const totais = useMemo(() => {
    let minutosAtrasoTotal = 0;
    let minutosFaltaTotal = 0;
    let minutosSaidaTotal = 0;
    let minutosIntervaloTotal = 0;
    let minutosDescontoEfetivo = 0;
    let valorTotalDescontos = 0;
    let qtdFaltasInjustificadas = 0;
    let qtdDsrsPerdidos = 0;
    let valorTotalDsrs = 0;

    ocorrenciasFiltradas.forEach((o) => {
      if (o.tipo === 'ATRASO') minutosAtrasoTotal += o.minutosPerdidos;
      if (o.tipo === 'FALTA_INJUSTIFICADA') {
        minutosFaltaTotal += o.minutosPerdidos;
        qtdFaltasInjustificadas += 1;
      }
      if (o.tipo === 'SAIDA_ANTECIPADA') minutosSaidaTotal += o.minutosPerdidos;
      if (o.tipo === 'INTERVALO_EXCEDIDO') minutosIntervaloTotal += o.minutosPerdidos;

      if (o.status !== 'ABONADO_ATESTADO') {
        minutosDescontoEfetivo += o.minutosADescontar;
        valorTotalDescontos += o.valorEstimadoDesconto;
        if (o.perdeDsr) {
          qtdDsrsPerdidos += 1;
          valorTotalDsrs += o.valorDescontoDsr;
        }
      }
    });

    const horasDescontoEfetivo = (minutosDescontoEfetivo / 60).toFixed(1);
    const horasAtraso = (minutosAtrasoTotal / 60).toFixed(1);
    const horasFalta = (minutosFaltaTotal / 60).toFixed(1);
    const horasSaida = (minutosSaidaTotal / 60).toFixed(1);
    const totalGeralFinanceiro = valorTotalDescontos + valorTotalDsrs;

    return {
      totalOcorrencias: ocorrenciasFiltradas.length,
      minutosAtrasoTotal,
      horasAtraso,
      minutosFaltaTotal,
      horasFalta,
      minutosSaidaTotal,
      horasSaida,
      minutosIntervaloTotal,
      minutosDescontoEfetivo,
      horasDescontoEfetivo,
      valorTotalDescontos,
      qtdFaltasInjustificadas,
      qtdDsrsPerdidos,
      valorTotalDsrs,
      totalGeralFinanceiro
    };
  }, [ocorrenciasFiltradas]);

  // Agrupamento por Departamento para o Relatório Sintético
  const dadosPorDepartamento = useMemo(() => {
    const map = new Map<string, {
      departamentoId: string;
      departamentoNome: string;
      totalOcorrencias: number;
      atrasosQtd: number;
      faltasQtd: number;
      saidasQtd: number;
      minutosDesconto: number;
      valorDesconto: number;
    }>();

    departamentos.forEach((d) => {
      map.set(d.id, {
        departamentoId: d.id,
        departamentoNome: d.nome,
        totalOcorrencias: 0,
        atrasosQtd: 0,
        faltasQtd: 0,
        saidasQtd: 0,
        minutosDesconto: 0,
        valorDesconto: 0
      });
    });

    ocorrenciasFiltradas.forEach((o) => {
      const item = map.get(o.departamentoId) || {
        departamentoId: o.departamentoId,
        departamentoNome: o.departamentoNome,
        totalOcorrencias: 0,
        atrasosQtd: 0,
        faltasQtd: 0,
        saidasQtd: 0,
        minutosDesconto: 0,
        valorDesconto: 0
      };

      item.totalOcorrencias += 1;
      if (o.tipo === 'ATRASO') item.atrasosQtd += 1;
      if (o.tipo === 'FALTA_INJUSTIFICADA') item.faltasQtd += 1;
      if (o.tipo === 'SAIDA_ANTECIPADA') item.saidasQtd += 1;
      if (o.status !== 'ABONADO_ATESTADO') {
        item.minutosDesconto += o.minutosADescontar;
        item.valorDesconto += (o.valorEstimadoDesconto + (o.perdeDsr ? o.valorDescontoDsr : 0));
      }

      map.set(o.departamentoId, item);
    });

    return Array.from(map.values());
  }, [departamentos, ocorrenciasFiltradas]);

  // Agrupamento por Colaborador para o Relatório Analítico
  const dadosPorColaborador = useMemo(() => {
    const map = new Map<string, {
      colaboradorId: string;
      colaboradorNome: string;
      colaboradorMatricula: string;
      colaboradorCpf: string;
      departamentoNome: string;
      cargoTitulo: string;
      qtdAtrasos: number;
      minutosAtraso: number;
      qtdFaltas: number;
      qtdSaidas: number;
      minutosDescontoTotal: number;
      valorDescontoTotal: number;
      qtdAbonadas: number;
      qtdPendentes: number;
    }>();

    ocorrenciasFiltradas.forEach((o) => {
      const colab = map.get(o.colaboradorId) || {
        colaboradorId: o.colaboradorId,
        colaboradorNome: o.colaboradorNome,
        colaboradorMatricula: o.colaboradorMatricula,
        colaboradorCpf: o.colaboradorCpf,
        departamentoNome: o.departamentoNome,
        cargoTitulo: o.cargoTitulo,
        qtdAtrasos: 0,
        minutosAtraso: 0,
        qtdFaltas: 0,
        qtdSaidas: 0,
        minutosDescontoTotal: 0,
        valorDescontoTotal: 0,
        qtdAbonadas: 0,
        qtdPendentes: 0
      };

      if (o.tipo === 'ATRASO') {
        colab.qtdAtrasos += 1;
        colab.minutosAtraso += o.minutosPerdidos;
      }
      if (o.tipo === 'FALTA_INJUSTIFICADA') colab.qtdFaltas += 1;
      if (o.tipo === 'SAIDA_ANTECIPADA') colab.qtdSaidas += 1;

      if (o.status === 'ABONADO_ATESTADO') {
        colab.qtdAbonadas += 1;
      } else {
        colab.minutosDescontoTotal += o.minutosADescontar;
        colab.valorDescontoTotal += (o.valorEstimadoDesconto + (o.perdeDsr ? o.valorDescontoDsr : 0));
      }

      if (o.status === 'PENDENTE_DESCONTO') colab.qtdPendentes += 1;

      map.set(o.colaboradorId, colab);
    });

    return Array.from(map.values());
  }, [ocorrenciasFiltradas]);

  // Ação: Salvar Tratamento / Abono pelo RH
  const handleSalvarTratamento = () => {
    if (!tratandoOcorrencia) return;

    const agora = new Date().toLocaleString('pt-BR');
    const novas = ocorrencias.map((item) => {
      if (item.id === tratandoOcorrencia.id) {
        const isAbonado = novoStatusTratamento === 'ABONADO_ATESTADO';
        return {
          ...item,
          status: novoStatusTratamento,
          justificativa: justificativaTratamento || item.justificativa,
          atestadoCid: isAbonado ? (cidInput || 'CID Não especificado') : undefined,
          minutosADescontar: isAbonado ? 0 : item.minutosPerdidos,
          valorEstimadoDesconto: isAbonado ? 0 : item.valorEstimadoDesconto,
          perdeDsr: isAbonado ? false : item.perdeDsr,
          dataTratamento: agora,
          operadorTratamento: 'Luciana Mendonça (Coord. RH)'
        };
      }
      return item;
    });

    onUpdateOcorrencias(novas);
    setTratandoOcorrencia(null);
    setJustificativaTratamento('');
    setCidInput('');
  };

  // Ação: Exportar Arquivo CSV de Descontos para Folha de Pagamento
  const handleExportarCsvFolha = () => {
    let csv = 'MATRICULA;COLABORADOR;CPF;DEPARTAMENTO;DATA_OCORRENCIA;TIPO_EVENTO;COD_RUBRICA;HORAS_DESCONTO;VALOR_DESCONTO_RS;PERDA_DSR_RS;STATUS_APURACAO\r\n';

    ocorrenciasFiltradas.forEach((o) => {
      const codRubrica =
        o.tipo === 'FALTA_INJUSTIFICADA'
          ? '402-FALTA_INJ'
          : o.tipo === 'ATRASO'
          ? '401-ATRASO'
          : '403-SAIDA_ANT';

      const horasFmt = (o.minutosADescontar / 60).toFixed(2);
      const valorFmt = o.valorEstimadoDesconto.toFixed(2);
      const dsrFmt = o.perdeDsr ? o.valorDescontoDsr.toFixed(2) : '0.00';

      csv += `${o.colaboradorMatricula};"${o.colaboradorNome}";${o.colaboradorCpf};"${o.departamentoNome}";${o.data};${o.tipo};${codRubrica};${horasFmt};${valorFmt};${dsrFmt};${o.status}\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DESCONTOS_FOLHA_PAGAMENTO_${dataInicio}_A_${dataFim}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner do Módulo 09 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Módulo 09 — Relatórios de Atrasos, Faltas & Descontos
            </h2>
            <span className="text-xs font-mono font-medium text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Apuração de Descontos CLT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Listagem automática e tratamento de atrasos (CLT Art. 58 § 1º), faltas injustificadas com reflexo em DSR (Lei nº 605/1949) e saídas antecipadas para integração contábil com a folha de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportarCsvFolha}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Exportar Folha (CSV)
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 min-w-0">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 min-w-0 break-words">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Filtros de Apuração & Seleção de Período</span>
          </span>
          {/* Atalhos Rápidos de Período */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Atalhos:</span>
            <button
              onClick={() => handleSetPeriodo('mes_atual')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium whitespace-nowrap"
            >
              Nov/2026
            </button>
            <button
              onClick={() => handleSetPeriodo('mes_anterior')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium whitespace-nowrap"
            >
              Out/2026
            </button>
            <button
              onClick={() => handleSetPeriodo('ultimos_30')}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium whitespace-nowrap"
            >
              Últimos 30d
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Data Início */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Data Início:</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Data Fim:</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
            />
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Departamento / Equipe:</label>
            <select
              value={selectedDepartamentoId}
              onChange={(e) => setSelectedDepartamentoId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="TODOS">Todos os Departamentos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Ocorrência */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tipo de Ocorrência:</label>
            <select
              value={selectedTipoOcorrencia}
              onChange={(e) => setSelectedTipoOcorrencia(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="ATRASO">Atrasos na Entrada (CLT 58)</option>
              <option value="FALTA_INJUSTIFICADA">Faltas Injustificadas (+ DSR)</option>
              <option value="SAIDA_ANTECIPADA">Saídas Antecipadas</option>
              <option value="INTERVALO_EXCEDIDO">Intervalo de Almoço Excedido</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Status de Tratamento:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE_DESCONTO">Pendente de Desconto</option>
              <option value="CONFIRMADO_DESCONTO">Confirmado para Folha</option>
              <option value="ABONADO_ATESTADO">Abonado por Atestado Médico</option>
              <option value="COMPENSADO_BANCO">Compensado em Banco</option>
            </select>
          </div>
        </div>

        {/* Busca por Colaborador */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nome do colaborador, matrícula (ex: SC-0482) ou CPF..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Limpar
            </button>
          )}
          <span className="text-[11px] text-slate-400 font-mono">
            {ocorrenciasFiltradas.length} ocorrências localizadas
          </span>
        </div>
      </div>

      {/* Cartões Executivos de Resumo Financeiro e Horas Perdidas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total de Ocorrências</span>
          <span className="text-xl font-bold font-mono text-slate-900">{totais.totalOcorrencias} eventos</span>
          <span className="text-[10px] text-slate-500 block">No período selecionado</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Horas a Descontar</span>
          <span className="text-xl font-bold font-mono text-rose-700">{totais.horasDescontoEfetivo}h</span>
          <span className="text-[10px] text-rose-600 block">Líquidas para folha</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Faltas Injustificadas</span>
          <span className="text-xl font-bold font-mono text-amber-700">{totais.qtdFaltasInjustificadas} dias</span>
          <span className="text-[10px] text-amber-600 block">Sem abono / Art. 473</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Reflexo Perda DSR</span>
          <span className="text-xl font-bold font-mono text-purple-700">{totais.qtdDsrsPerdidos} DSRs</span>
          <span className="text-[10px] text-purple-600 block">R$ {totais.valorTotalDsrs.toFixed(2)} (Lei 605)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Desconto Estimado Total</span>
          <span className="text-xl font-bold font-mono text-slate-900">
            R$ {totais.totalGeralFinanceiro.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-600 block font-semibold">Salário + DSR abatidos</span>
        </div>
      </div>

      {/* Navegação entre as 3 Visões do Relatório */}
      <div className="flex flex-col sm:flex-row gap-1.5 p-1.5 bg-slate-200/70 rounded-xl text-xs font-semibold w-full overflow-x-auto max-w-full">
        <button
          onClick={() => setReportViewMode('sintetico')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-1.5 min-w-0 whitespace-normal break-words ${
            reportViewMode === 'sintetico'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate sm:whitespace-normal">Relatório Sintético & Gráficos</span>
        </button>
        <button
          onClick={() => setReportViewMode('analitico')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-1.5 min-w-0 whitespace-normal break-words ${
            reportViewMode === 'analitico'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate sm:whitespace-normal">Analítico por Colaborador</span>
        </button>
        <button
          onClick={() => setReportViewMode('detalhado')}
          className={`flex-1 py-2.5 px-3 rounded-lg transition-colors flex items-center justify-center text-center gap-1.5 min-w-0 whitespace-normal break-words ${
            reportViewMode === 'detalhado'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="truncate sm:whitespace-normal">Detalhado (Espelho de Ocorrências)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VISÃO 1: RELATÓRIO SINTÉTICO (GERENCIAL COM GRÁFICOS)   */}
      {/* ======================================================== */}
      {reportViewMode === 'sintetico' && (
        <div className="space-y-6">
          {/* Bloco de Gráficos Visuais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Volume de Ocorrências e Horas Perdidas por Departamento */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ocorrências por Departamento
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comparativo de volume de eventos e minutos perdidos por equipe.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Taxa de Absenteísmo</span>
              </div>

              <div className="space-y-4 text-xs">
                {dadosPorDepartamento.map((dep) => {
                  const maxOcc = Math.max(...dadosPorDepartamento.map((d) => d.totalOcorrencias), 1);
                  const pct = Math.round((dep.totalOcorrencias / maxOcc) * 100);

                  return (
                    <div key={dep.departamentoId} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{dep.departamentoNome}</span>
                        <span className="font-mono text-slate-600">
                          <strong>{dep.totalOcorrencias} eventos</strong> ({Math.round(dep.minutosDesconto / 60)}h desconto · R$ {dep.valorDesconto.toFixed(2)})
                        </span>
                      </div>
                      {/* Barra de Progresso Visual */}
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.max(pct, 6)}%` }}
                          className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full transition-all duration-500"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Atrasos: {dep.atrasosQtd} | Faltas: {dep.faltasQtd} | Saídas: {dep.saidasQtd}</span>
                        <span>{pct}% do total apurado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráfico 2: Composição por Natureza da Ocorrência */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Composição das Ocorrências
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Distribuição proporcional entre Atrasos, Faltas e Saídas Antecipadas.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400">CLT 58 vs CLT 473</span>
              </div>

              {/* Barra Segmentada Visual Proporcional */}
              <div className="space-y-3">
                <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-xs border border-slate-200 text-[10px] font-bold text-white text-center leading-6">
                  {totais.minutosAtrasoTotal > 0 && (
                    <div
                      style={{ width: `${Math.max((totais.minutosAtrasoTotal / (totais.minutosAtrasoTotal + totais.minutosFaltaTotal + totais.minutosSaidaTotal || 1)) * 100, 10)}%` }}
                      className="bg-blue-600 transition-all truncate px-1"
                      title="Atrasos"
                    >
                      Atrasos ({totais.horasAtraso}h)
                    </div>
                  )}
                  {totais.minutosFaltaTotal > 0 && (
                    <div
                      style={{ width: `${Math.max((totais.minutosFaltaTotal / (totais.minutosAtrasoTotal + totais.minutosFaltaTotal + totais.minutosSaidaTotal || 1)) * 100, 10)}%` }}
                      className="bg-rose-600 transition-all truncate px-1"
                      title="Faltas Injustificadas"
                    >
                      Faltas ({totais.horasFalta}h)
                    </div>
                  )}
                  {totais.minutosSaidaTotal > 0 && (
                    <div
                      style={{ width: `${Math.max((totais.minutosSaidaTotal / (totais.minutosAtrasoTotal + totais.minutosFaltaTotal + totais.minutosSaidaTotal || 1)) * 100, 10)}%` }}
                      className="bg-amber-500 transition-all truncate px-1"
                      title="Saídas Antecipadas"
                    >
                      Saídas ({totais.horasSaida}h)
                    </div>
                  )}
                </div>

                {/* Legendas e Indicadores Detalhados */}
                <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
                    <span className="font-semibold text-blue-900 block flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                      Atrasos na Entrada
                    </span>
                    <span className="font-mono font-bold text-blue-800 text-sm">{totais.horasAtraso}h</span>
                    <span className="text-[10px] text-blue-600 block">CLT Art. 58 (&gt;10 min)</span>
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg space-y-1">
                    <span className="font-semibold text-rose-900 block flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                      Faltas Injustificadas
                    </span>
                    <span className="font-mono font-bold text-rose-800 text-sm">{totais.horasFalta}h</span>
                    <span className="text-[10px] text-rose-600 block">Desconto dia + Perda DSR</span>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
                    <span className="font-semibold text-amber-900 block flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      Saídas Antecipadas
                    </span>
                    <span className="font-mono font-bold text-amber-800 text-sm">{totais.horasSaida}h</span>
                    <span className="text-[10px] text-amber-600 block">Jornada interrompida</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Sintética por Departamento */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Consolidado Sintético Departamental para Contabilidade & DP
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Qtd Eventos</th>
                    <th className="py-2.5 px-3">Atrasos</th>
                    <th className="py-2.5 px-3">Faltas</th>
                    <th className="py-2.5 px-3">Saídas Antecipadas</th>
                    <th className="py-2.5 px-3">Total Horas Desconto</th>
                    <th className="py-2.5 px-3">Valor Total Estimado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dadosPorDepartamento.map((d) => (
                    <tr key={d.departamentoId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">{d.departamentoNome}</td>
                      <td className="py-3 px-3">{d.totalOcorrencias}</td>
                      <td className="py-3 px-3 text-blue-700">{d.atrasosQtd}</td>
                      <td className="py-3 px-3 text-rose-700 font-bold">{d.faltasQtd}</td>
                      <td className="py-3 px-3 text-amber-700">{d.saidasQtd}</td>
                      <td className="py-3 px-3 font-bold text-rose-700">{(d.minutosDesconto / 60).toFixed(1)}h</td>
                      <td className="py-3 px-3 font-bold text-slate-900">R$ {d.valorDesconto.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISÃO 2: RELATÓRIO ANALÍTICO (POR COLABORADOR)           */}
      {/* ======================================================== */}
      {reportViewMode === 'analitico' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Relatório Analítico Consolidado por Colaborador
              </h3>
              <p className="text-xs text-slate-500">
                Acúmulo de minutos perdidos, ocorrências e valores individuais para lançamento em folha.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {dadosPorColaborador.length} colaboradores com ocorrências
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Matrícula</th>
                  <th className="py-2.5 px-3">Departamento / Cargo</th>
                  <th className="py-2.5 px-3">Atrasos (Qtd / Min)</th>
                  <th className="py-2.5 px-3">Faltas (Dias)</th>
                  <th className="py-2.5 px-3">Saídas Ant.</th>
                  <th className="py-2.5 px-3">Horas a Descontar</th>
                  <th className="py-2.5 px-3">Valor Líquido (R$)</th>
                  <th className="py-2.5 px-3">Pendências RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {dadosPorColaborador.map((c) => (
                  <tr key={c.colaboradorId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{c.colaboradorNome}</td>
                    <td className="py-3 px-3 text-slate-600">{c.colaboradorMatricula}</td>
                    <td className="py-3 px-3 font-sans text-slate-600">
                      <div>{c.departamentoNome}</div>
                      <div className="text-[10px] text-slate-400">{c.cargoTitulo}</div>
                    </td>
                    <td className="py-3 px-3 text-blue-700">
                      {c.qtdAtrasos} ({c.minutosAtraso} min)
                    </td>
                    <td className="py-3 px-3 text-rose-700 font-bold">{c.qtdFaltas} dia(s)</td>
                    <td className="py-3 px-3 text-amber-700">{c.qtdSaidas}</td>
                    <td className="py-3 px-3 font-bold text-rose-700">
                      {(c.minutosDescontoTotal / 60).toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      R$ {c.valorDescontoTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {c.qtdPendentes > 0 ? (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {c.qtdPendentes} pendente(s)
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-medium">Apurado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISÃO 3: RELATÓRIO DETALHADO (ESPELHO OPERACIONAL)       */}
      {/* ======================================================== */}
      {reportViewMode === 'detalhado' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Espelho Detalhado de Ocorrências e Tratamento Individual
              </h3>
              <p className="text-xs text-slate-500">
                Auditoria evento por evento com base legal CLT e ação de abono ou confirmação de desconto para o RH.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {ocorrenciasFiltradas.length} Registros Detalhados
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Colaborador</th>
                  <th className="py-2.5 px-3">Tipo da Ocorrência</th>
                  <th className="py-2.5 px-3">Horário Previsto vs Realizado</th>
                  <th className="py-2.5 px-3">Perda / Tolerância</th>
                  <th className="py-2.5 px-3">Desconto (h / R$)</th>
                  <th className="py-2.5 px-3">DSR Perdido</th>
                  <th className="py-2.5 px-3">Status / Justificativa</th>
                  <th className="py-2.5 px-3">Ação RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ocorrenciasFiltradas.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{o.data}</td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-slate-900">{o.colaboradorNome}</div>
                      <div className="text-[10px] text-slate-400">{o.colaboradorMatricula} · {o.departamentoNome}</div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        o.tipo === 'ATRASO'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : o.tipo === 'FALTA_INJUSTIFICADA'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : o.tipo === 'SAIDA_ANTECIPADA'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {o.tipo === 'ATRASO' && 'Atraso na Entrada'}
                        {o.tipo === 'FALTA_INJUSTIFICADA' && 'Falta Injustificada'}
                        {o.tipo === 'SAIDA_ANTECIPADA' && 'Saída Antecipada'}
                        {o.tipo === 'INTERVALO_EXCEDIDO' && 'Intervalo Excedido'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>Prev: {o.horarioPrevisto}</div>
                      <div className="text-slate-500 text-[10px]">Real: {o.horarioRealizado}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900">{o.minutosPerdidos} min</span>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Tolerância: {o.toleranciaAplicadaMinutos}m (CLT 58)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {o.status === 'ABONADO_ATESTADO' ? (
                        <span className="text-emerald-700 font-semibold font-sans">Abonado (R$ 0,00)</span>
                      ) : (
                        <div>
                          <span className="font-bold text-rose-700">{(o.minutosADescontar / 60).toFixed(2)}h</span>
                          <span className="text-slate-600 block text-[10px]">R$ {o.valorEstimadoDesconto.toFixed(2)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {o.perdeDsr && o.status !== 'ABONADO_ATESTADO' ? (
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-sans">
                          Sim (-R$ {o.valorDescontoDsr.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">Não</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="text-[11px]">
                        {o.status === 'PENDENTE_DESCONTO' && (
                          <span className="font-semibold text-amber-700">Pendente de Desconto</span>
                        )}
                        {o.status === 'CONFIRMADO_DESCONTO' && (
                          <span className="font-semibold text-rose-700">Confirmado para Folha</span>
                        )}
                        {o.status === 'ABONADO_ATESTADO' && (
                          <span className="font-semibold text-emerald-700">Abonado: {o.atestadoCid || 'Atestado'}</span>
                        )}
                        {o.status === 'COMPENSADO_BANCO' && (
                          <span className="font-semibold text-blue-700">Compensado em Banco</span>
                        )}
                      </div>
                      {o.justificativa && (
                        <div className="text-[10px] text-slate-500 italic max-w-xs truncate" title={o.justificativa}>
                          "{o.justificativa}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <button
                        onClick={() => {
                          setTratandoOcorrencia(o);
                          setNovoStatusTratamento(o.status);
                          setJustificativaTratamento(o.justificativa || '');
                          setCidInput(o.atestadoCid || '');
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Tratar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TRATAMENTO DE OCORRÊNCIA PELO RH                 */}
      {/* ======================================================== */}
      {tratandoOcorrencia && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Tratamento de Ocorrência de Frequência (RH)
                </h3>
                <p className="text-slate-500">
                  {tratandoOcorrencia.colaboradorNome} · {tratandoOcorrencia.data} ({tratandoOcorrencia.tipo})
                </p>
              </div>
              <button
                onClick={() => setTratandoOcorrencia(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono space-y-1">
              <div><strong>Horário Previsto:</strong> {tratandoOcorrencia.horarioPrevisto}</div>
              <div><strong>Horário Realizado:</strong> {tratandoOcorrencia.horarioRealizado}</div>
              <div><strong>Tempo Perdido:</strong> {tratandoOcorrencia.minutosPerdidos} min (Tolerância: {tratandoOcorrencia.toleranciaAplicadaMinutos}m)</div>
              <div><strong>Desconto Proposto:</strong> R$ {tratandoOcorrencia.valorEstimadoDesconto.toFixed(2)} {tratandoOcorrencia.perdeDsr && `+ R$ ${tratandoOcorrencia.valorDescontoDsr.toFixed(2)} de DSR`}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decisão do RH / Tratamento:
                </label>
                <select
                  value={novoStatusTratamento}
                  onChange={(e) => setNovoStatusTratamento(e.target.value as StatusTratamentoOcorrencia)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800"
                >
                  <option value="CONFIRMADO_DESCONTO">Confirmar Desconto em Folha de Pagamento</option>
                  <option value="ABONADO_ATESTADO">Abonar por Atestado Médico / Justificativa Legal (CLT 473)</option>
                  <option value="COMPENSADO_BANCO">Compensar Saldo Negativo em Banco de Horas</option>
                  <option value="PENDENTE_DESCONTO">Manter Pendente de Documentação</option>
                </select>
              </div>

              {novoStatusTratamento === 'ABONADO_ATESTADO' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CID-10 do Atestado Médico / Motivo do Abono:
                  </label>
                  <input
                    type="text"
                    value={cidInput}
                    onChange={(e) => setCidInput(e.target.value)}
                    placeholder="Ex: CID K04.4, CID J06.9 ou Atestado de Comparecimento"
                    className="w-full p-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parecer do Operador do RH:
                </label>
                <textarea
                  rows={2}
                  value={justificativaTratamento}
                  onChange={(e) => setJustificativaTratamento(e.target.value)}
                  placeholder="Observação da apuração para constar no arquivo fiscal AEJ..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setTratandoOcorrencia(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarTratamento}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs"
              >
                Confirmar Tratamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
