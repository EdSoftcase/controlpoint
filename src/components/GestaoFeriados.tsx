import React, { useState, useMemo } from 'react';
import {
  Tenant,
  Estabelecimento,
  Colaborador,
  Feriado,
  MemoriaCalculoFeriadoDSR
} from '../types/operational';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Calculator,
  Scale,
  Award,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface GestaoFeriadosProps {
  activeTenant: Tenant;
  estabelecimentos: Estabelecimento[];
  colaboradores: Colaborador[];
  feriados: Feriado[];
  onAddFeriado: (novo: Feriado) => void;
}

export const GestaoFeriados: React.FC<GestaoFeriadosProps> = ({
  activeTenant,
  estabelecimentos,
  colaboradores,
  feriados,
  onAddFeriado
}) => {
  const [subTab, setSubTab] = useState<'catalogo' | 'calendario-colaborador'>('catalogo');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>(
    colaboradores[0]?.id || ''
  );

  // Modal Novo Feriado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    nome: '',
    data: '2026-11-20',
    tipo: 'NACIONAL' as 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PONTO_FACULTATIVO',
    uf: 'SP',
    municipio: 'São Paulo',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 14.759/2023',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  });
  const [modalError, setModalError] = useState<string | null>(null);

  // Simulador de Apuração de Ponto em Feriado
  const [simulacaoData, setSimulacaoData] = useState({
    feriadoId: 'fer-07', // Finados 02/11/2026
    trabalhouNoFeriado: true,
    horasTrabalhadas: 8,
    concedeuFolgaCompensatoria: false,
    salarioBaseMensal: 5500, // R$ 5.500,00
    divisorHorasMes: 220, // 220h mensais
    diasUteisSemana: 5,
    domingosEFeriadosSemana: 2 // Domingo + Feriado
  });

  // Feriados do tenant ativo
  const tenantFeriados = useMemo(() => {
    return feriados.filter((f) => f.tenantId === activeTenant.id || !f.tenantId);
  }, [feriados, activeTenant.id]);

  const filteredFeriados = useMemo(() => {
    return tenantFeriados.filter((f) => {
      const matchTipo = filtroTipo === 'TODOS' || f.tipo === filtroTipo;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        f.nome.toLowerCase().includes(q) ||
        f.data.includes(q) ||
        (f.uf && f.uf.toLowerCase().includes(q)) ||
        (f.municipio && f.municipio.toLowerCase().includes(q));
      return matchTipo && matchQuery;
    });
  }, [tenantFeriados, filtroTipo, searchQuery]);

  // Colaborador selecionado para análise de calendário
  const currentColaborador = useMemo(() => {
    return (
      colaboradores.find((c) => c.id === selectedColaboradorId) || colaboradores[0]
    );
  }, [colaboradores, selectedColaboradorId]);

  // Estabelecimento de lotação do colaborador
  const colaboradorEstabelecimento = useMemo(() => {
    if (!currentColaborador) return estabelecimentos[0];
    return (
      estabelecimentos.find((e) => e.id === currentColaborador.estabelecimentoId) ||
      estabelecimentos[0]
    );
  }, [estabelecimentos, currentColaborador]);

  // Feriados aplicáveis ao colaborador específico (Herança Nacional + Estadual da UF + Municipal da Cidade)
  const feriadosColaborador = useMemo(() => {
    if (!colaboradorEstabelecimento) return tenantFeriados;
    const ufColab = colaboradorEstabelecimento.uf || 'SP';
    const munColab = (colaboradorEstabelecimento.municipio || 'São Paulo').toLowerCase();

    return tenantFeriados.filter((f) => {
      if (f.tipo === 'NACIONAL' || f.tipo === 'PONTO_FACULTATIVO') return true;
      if (f.tipo === 'ESTADUAL' && f.uf === ufColab) return true;
      if (f.tipo === 'MUNICIPAL' && f.uf === ufColab && f.municipio?.toLowerCase() === munColab) return true;
      return false;
    });
  }, [tenantFeriados, colaboradorEstabelecimento]);

  // Cálculo trabalhista de Horas Extras e DSR
  const calculoTrabalhista = useMemo(() => {
    const valorHoraNormal = simulacaoData.salarioBaseMensal / simulacaoData.divisorHorasMes;
    const feriadoSel = tenantFeriados.find((f) => f.id === simulacaoData.feriadoId) || tenantFeriados[0];

    let adicionalPercentual = feriadoSel ? feriadoSel.adicionalHoraExtraPercentual : 100;
    let totalHorasExtrasPagar = 0;
    let regraTexto = '';

    if (!simulacaoData.trabalhouNoFeriado) {
      regraTexto = 'Descanso remunerado usufruído integralmente. Não gera horas extras a pagar.';
    } else if (simulacaoData.concedeuFolgaCompensatoria) {
      regraTexto = 'Folga compensatória concedida na mesma semana conforme CLT Art. 70. Não incide pagamento de hora extra em dobro.';
    } else {
      // Súmula 146 do TST: Trabalho em domingos e feriados, não compensado, deve ser pago em dobro, sem prejuízo da remuneração relativa ao repouso semanal.
      const valorHoraExtra = valorHoraNormal * (1 + adicionalPercentual / 100);
      totalHorasExtrasPagar = simulacaoData.horasTrabalhadas * valorHoraExtra;
      regraTexto = `Trabalho em feriado sem folga compensatória. Pagamento de ${simulacaoData.horasTrabalhadas}h com adicional de ${adicionalPercentual}% (Súmula 146 TST e Lei 605/1949).`;
    }

    // Cálculo do DSR sobre Horas Extras: (Total de Horas Extras / Dias Úteis) * Dias de Repouso (Domingos + Feriados)
    const reflexoDSR =
      totalHorasExtrasPagar > 0 && simulacaoData.diasUteisSemana > 0
        ? (totalHorasExtrasPagar / simulacaoData.diasUteisSemana) * simulacaoData.domingosEFeriadosSemana
        : 0;

    const totalLiquidoTrabalhador = totalHorasExtrasPagar + reflexoDSR;

    return {
      valorHoraNormal,
      adicionalPercentual,
      totalHorasExtrasPagar,
      reflexoDSR,
      totalLiquidoTrabalhador,
      regraTexto,
      feriadoSel
    };
  }, [simulacaoData, tenantFeriados]);

  const handleSalvarNovoFeriado = () => {
    if (!modalForm.nome.trim()) {
      setModalError('O nome do feriado é obrigatório.');
      return;
    }
    if (!modalForm.data) {
      setModalError('A data do feriado é obrigatória.');
      return;
    }
    if (modalForm.tipo === 'ESTADUAL' && !modalForm.uf) {
      setModalError('Para feriado estadual, informe a UF correspondente.');
      return;
    }
    if (modalForm.tipo === 'MUNICIPAL' && (!modalForm.uf || !modalForm.municipio.trim())) {
      setModalError('Para feriado municipal, informe a UF e o Município.');
      return;
    }

    const novo: Feriado = {
      id: `fer-${Date.now()}`,
      tenantId: activeTenant.id,
      nome: modalForm.nome,
      data: modalForm.data,
      tipo: modalForm.tipo,
      uf: modalForm.tipo !== 'NACIONAL' ? modalForm.uf : undefined,
      municipio: modalForm.tipo === 'MUNICIPAL' ? modalForm.municipio : undefined,
      recorrenteAnual: modalForm.recorrenteAnual,
      legislacaoBase: modalForm.legislacaoBase || 'Legislação Trabalhista Municipal/Estadual',
      adicionalHoraExtraPercentual: modalForm.adicionalHoraExtraPercentual,
      geraFolgaCompensatoria: modalForm.geraFolgaCompensatoria,
      afetaDSR: modalForm.afetaDSR
    };

    onAddFeriado(novo);
    setIsModalOpen(false);
    setModalForm({
      nome: '',
      data: '2026-11-20',
      tipo: 'NACIONAL',
      uf: 'SP',
      municipio: 'São Paulo',
      recorrenteAnual: true,
      legislacaoBase: 'Lei Federal',
      adicionalHoraExtraPercentual: 100,
      geraFolgaCompensatoria: true,
      afetaDSR: true
    });
    setModalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header do Módulo de Feriados */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                MÓDULO 03 — JORNADAS & ESCALAS
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Gestão de Feriados & Apuração de DSR
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Gestão de Feriados por Empresa e Calendário do Colaborador
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Parametrização de feriados <strong>Nacionais, Estaduais e Municipais</strong>, com herança automática conforme a filial e cálculo rigoroso de <strong>Horas Extras em Dobro (100% Súmula 146 TST)</strong> e <strong>Reflexo no DSR (Lei 605/1949)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Novo Feriado
            </button>
          </div>
        </div>

        {/* Pilares Trabalhistas em Linha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              Súmula 146 do TST
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              O trabalho realizado em domingos e feriados não compensados com folga deve ser pago em dobro (100%), sem prejuízo da remuneração do repouso.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              Reflexo no DSR (Lei 605/1949)
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Horas extras habituais ou em feriados geram reflexo proporcional no Descanso Semanal Remunerado: <code>(HE / Dias Úteis) × Repousos</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Herança por Estabelecimento
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Cada trabalhador recebe os feriados da sua cidade e estado de lotação, evitando conflitos entre filiais em diferentes regiões do Brasil.
            </p>
          </div>
        </div>
      </div>

      {/* Navegação entre Catálogo de Feriados e Calendário do Colaborador */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold max-w-md">
        <button
          onClick={() => setSubTab('catalogo')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            subTab === 'catalogo'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-700" />
          Catálogo de Feriados ({tenantFeriados.length})
        </button>
        <button
          onClick={() => setSubTab('calendario-colaborador')}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
            subTab === 'calendario-colaborador'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-600" />
          Calendário do Trabalhador & DSR
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA 1: CATÁLOGO GERAL DE FERIADOS DA EMPRESA              */}
      {/* ========================================================= */}
      {subTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar feriado por nome, data ou UF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Filtrar:</span>
              {['TODOS', 'NACIONAL', 'ESTADUAL', 'MUNICIPAL', 'PONTO_FACULTATIVO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    filtroTipo === tipo
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tipo === 'TODOS'
                    ? 'Todos'
                    : tipo === 'NACIONAL'
                    ? 'Nacionais'
                    : tipo === 'ESTADUAL'
                    ? 'Estaduais'
                    : tipo === 'MUNICIPAL'
                    ? 'Municipais'
                    : 'Facultativos'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Feriados */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Nome do Feriado</th>
                    <th className="py-2.5 px-3">Tipo & Abrangência</th>
                    <th className="py-2.5 px-3">Legislação / Base Legal</th>
                    <th className="py-2.5 px-3">Adicional H.E.</th>
                    <th className="py-2.5 px-3">Reflexo DSR</th>
                    <th className="py-2.5 px-3">Recorrência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeriados.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {new Date(`${f.data}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{f.nome}</div>
                        {(f.municipio || f.uf) && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            {f.municipio ? `${f.municipio} / ${f.uf}` : `Estado de ${f.uf}`}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                            f.tipo === 'NACIONAL'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : f.tipo === 'ESTADUAL'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : f.tipo === 'MUNICIPAL'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {f.tipo === 'NACIONAL'
                            ? 'Nacional'
                            : f.tipo === 'ESTADUAL'
                            ? `Estadual (${f.uf})`
                            : f.tipo === 'MUNICIPAL'
                            ? `Municipal (${f.uf})`
                            : 'Ponto Facultativo'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs">{f.legislacaoBase}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                        +{f.adicionalHoraExtraPercentual}%
                      </td>
                      <td className="py-3 px-3">
                        {f.afetaDSR ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600" /> Sim (DSR)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {f.recorrenteAnual ? 'Todo Ano (Fixo)' : 'Data Móvel'}
                      </td>
                    </tr>
                  ))}
                  {filteredFeriados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        Nenhum feriado cadastrado para o filtro selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: CALENDÁRIO DO TRABALHADOR & SIMULADOR DSR/H.E.    */}
      {/* ========================================================= */}
      {subTab === 'calendario-colaborador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seletor do Trabalhador e seus Feriados Herdados */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Calendário Individual do Trabalhador
                  </h3>
                  <p className="text-xs text-slate-500">
                    Feriados que se aplicam a este colaborador conforme filial de lotação.
                  </p>
                </div>
              </div>

              {/* Seletor de Colaborador */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">
                  Selecione o Colaborador:
                </label>
                <select
                  value={selectedColaboradorId}
                  onChange={(e) => setSelectedColaboradorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cargoTitulo}) — {c.estabelecimentoNome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card de Informações da Filial do Colaborador */}
              {colaboradorEstabelecimento && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {colaboradorEstabelecimento.nome}
                    </span>
                    <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                      CNPJ: {colaboradorEstabelecimento.cnpj}
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center gap-3 text-[11px]">
                    <span>
                      <strong>Localidade:</strong> {colaboradorEstabelecimento.municipio || 'São Paulo'} - {colaboradorEstabelecimento.uf || 'SP'}
                    </span>
                    <span>·</span>
                    <span>
                      <strong>Fuso Horário:</strong> {colaboradorEstabelecimento.fusoHorario}
                    </span>
                  </div>
                </div>
              )}

              {/* Lista de Feriados Específicos deste Colaborador */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="font-semibold text-slate-700">
                    Feriados Aplicáveis a este Contrato ({feriadosColaborador.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ano 2026</span>
                </div>

                <div className="max-h-[360px] overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                  {feriadosColaborador.map((f) => {
                    const isSelectedInSim = simulacaoData.feriadoId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSimulacaoData({ ...simulacaoData, feriadoId: f.id })}
                        className={`w-full text-left p-2.5 transition-colors flex items-center justify-between gap-2 ${
                          isSelectedInSim
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-[11px] font-bold ${
                                isSelectedInSim ? 'text-emerald-400' : 'text-slate-900'
                              }`}
                            >
                              {new Date(`${f.data}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                isSelectedInSim
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {f.tipo}
                            </span>
                          </div>
                          <div className={`text-xs font-semibold ${isSelectedInSim ? 'text-white' : 'text-slate-900'}`}>
                            {f.nome}
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isSelectedInSim ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          +{f.adicionalHoraExtraPercentual}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Simulador Trabalhista de DSR & Horas Extras */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Memória de Cálculo de Horas Extras & DSR em Feriado
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Súmula 146 TST</span>
              </div>

              {/* Painel de Parâmetros de Simulação */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Trabalhou no Feriado?
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSimulacaoData({ ...simulacaoData, trabalhouNoFeriado: true })}
                      className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                        simulacaoData.trabalhouNoFeriado
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setSimulacaoData({ ...simulacaoData, trabalhouNoFeriado: false })}
                      className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                        !simulacaoData.trabalhouNoFeriado
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      Não (Folga)
                    </button>
                  </div>
                </div>

                {simulacaoData.trabalhouNoFeriado && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Concedeu Folga Compensatória?
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimulacaoData({ ...simulacaoData, concedeuFolgaCompensatoria: false })}
                        className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                          !simulacaoData.concedeuFolgaCompensatoria
                            ? 'bg-rose-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        Não (Paga 100%)
                      </button>
                      <button
                        onClick={() => setSimulacaoData({ ...simulacaoData, concedeuFolgaCompensatoria: true })}
                        className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                          simulacaoData.concedeuFolgaCompensatoria
                            ? 'bg-emerald-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        Sim (Compensada)
                      </button>
                    </div>
                  </div>
                )}

                {simulacaoData.trabalhouNoFeriado && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Horas Trabalhadas no Feriado:
                    </label>
                    <input
                      type="number"
                      value={simulacaoData.horasTrabalhadas}
                      onChange={(e) => setSimulacaoData({ ...simulacaoData, horasTrabalhadas: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1 border border-slate-200 rounded font-mono text-xs bg-white"
                      min={1}
                      max={12}
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Salário Contratual Base:
                  </label>
                  <input
                    type="number"
                    value={simulacaoData.salarioBaseMensal}
                    onChange={(e) => setSimulacaoData({ ...simulacaoData, salarioBaseMensal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1 border border-slate-200 rounded font-mono text-xs bg-white"
                  />
                </div>
              </div>

              {/* Resultado e Memória de Cálculo Auditável */}
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">FERIADO SELECIONADO:</span>
                  <strong className="text-emerald-400">
                    {calculoTrabalhista.feriadoSel?.nome} ({calculoTrabalhista.feriadoSel?.data})
                  </strong>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valor da Hora Normal (Salário / 220h):</span>
                    <span>R$ {calculoTrabalhista.valorHoraNormal.toFixed(2)} / hora</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Adicional Legal Aplicável:</span>
                    <span className="text-amber-400 font-bold">+{calculoTrabalhista.adicionalPercentual}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Valor da Hora Extra no Feriado:</span>
                    <span>
                      R$ {(calculoTrabalhista.valorHoraNormal * (1 + calculoTrabalhista.adicionalPercentual / 100)).toFixed(2)} / hora
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                    <span className="text-slate-300 font-sans font-semibold">Horas Extras Feriado (100%):</span>
                    <strong className="text-white">
                      R$ {calculoTrabalhista.totalHorasExtrasPagar.toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-sans font-semibold">Reflexo no DSR da Semana:</span>
                    <strong className="text-emerald-400">
                      R$ {calculoTrabalhista.reflexoDSR.toFixed(2)}
                    </strong>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold">
                    <span className="text-white font-sans">Total a Pagar na Folha:</span>
                    <strong className="text-emerald-400">
                      R$ {calculoTrabalhista.totalLiquidoTrabalhador.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 rounded text-[10px] text-slate-400 leading-relaxed font-sans">
                  <strong>Enquadramento:</strong> {calculoTrabalhista.regraTexto}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Novo Feriado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Cadastrar Novo Feriado</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Feriado *</label>
                <input
                  type="text"
                  value={modalForm.nome}
                  onChange={(e) => setModalForm({ ...modalForm, nome: e.target.value })}
                  placeholder="Ex: Aniversário da Cidade / Padroeiro"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data *</label>
                  <input
                    type="date"
                    value={modalForm.data}
                    onChange={(e) => setModalForm({ ...modalForm, data: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipo de Feriado *</label>
                  <select
                    value={modalForm.tipo}
                    onChange={(e) => setModalForm({ ...modalForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="NACIONAL">Nacional (Todo o Brasil)</option>
                    <option value="ESTADUAL">Estadual (Por UF)</option>
                    <option value="MUNICIPAL">Municipal (Por Cidade)</option>
                    <option value="PONTO_FACULTATIVO">Ponto Facultativo</option>
                  </select>
                </div>
              </div>

              {modalForm.tipo === 'ESTADUAL' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unidade Federativa (UF) *</label>
                  <select
                    value={modalForm.uf}
                    onChange={(e) => setModalForm({ ...modalForm, uf: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'AM', 'PA'].map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalForm.tipo === 'MUNICIPAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">UF *</label>
                    <select
                      value={modalForm.uf}
                      onChange={(e) => setModalForm({ ...modalForm, uf: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    >
                      {['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO'].map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Município *</label>
                    <input
                      type="text"
                      value={modalForm.municipio}
                      onChange={(e) => setModalForm({ ...modalForm, municipio: e.target.value })}
                      placeholder="Ex: Campinas"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Adicional de Hora Extra *</label>
                <select
                  value={modalForm.adicionalHoraExtraPercentual}
                  onChange={(e) => setModalForm({ ...modalForm, adicionalHoraExtraPercentual: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value={100}>100% (Padrão Súmula 146 TST / Pagamento em Dobro)</option>
                  <option value={120}>120% (Conforme Acordo / Convenção Coletiva)</option>
                  <option value={150}>150% (Especial CCT)</option>
                  <option value={50}>50% (Hora Extra Padrão em Dia Útil)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Legislação / Decreto Base</label>
                <input
                  type="text"
                  value={modalForm.legislacaoBase}
                  onChange={(e) => setModalForm({ ...modalForm, legislacaoBase: e.target.value })}
                  placeholder="Ex: Lei Municipal nº 14.485/2007"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.recorrenteAnual}
                    onChange={(e) => setModalForm({ ...modalForm, recorrenteAnual: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Recorrente Todo Ano</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.afetaDSR}
                    onChange={(e) => setModalForm({ ...modalForm, afetaDSR: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Reflete no Cálculo do DSR</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovoFeriado}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Salvar Feriado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
