import React, { useState, useEffect } from 'react';
import { Colaborador, ProgramacaoFerias } from '../types/operational';
import { AfastamentoColaborador, TipoAfastamento } from '../types/rhAvancado';
import { useAuth } from './AuthContext';
import {
  FileText,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  X,
  Stethoscope,
  Plane,
  Baby,
  HeartHandshake,
  Download,
  AlertTriangle,
  CalendarDays
} from 'lucide-react';

interface GestaoAfastamentosProps {
  colaboradores: Colaborador[];
}

export const INITIAL_AFASTAMENTOS: AfastamentoColaborador[] = [
  {
    id: 'afast-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Mariana Souza',
    colaboradorCpf: '234.567.890-12',
    colaboradorMatricula: 'MAT-002',
    departamentoId: 'dep-02',
    departamentoNome: 'Tecnologia & Inovação',
    tipo: 'FERIAS',
    dataInicio: '2026-11-10',
    dataFim: '2026-11-24',
    totalDias: 15,
    abonaMarcacoesPonto: true,
    status: 'HOMOLOGADO',
    observacoes: 'Período regulamentar de férias - 1º período de 15 dias (CLT Art. 134 § 1º).',
    criadoEm: '2026-10-15',
    homologadoPor: 'Diretoria de RH'
  },
  {
    id: 'afast-02',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-03',
    colaboradorNome: 'Carlos Eduardo Oliveira',
    colaboradorCpf: '345.678.901-23',
    colaboradorMatricula: 'MAT-003',
    departamentoId: 'dep-03',
    departamentoNome: 'Operações & Logística',
    tipo: 'ATESTADO_MEDICO',
    dataInicio: '2026-11-06',
    dataFim: '2026-11-07',
    totalDias: 2,
    abonaMarcacoesPonto: true,
    cid10: 'J06.9 - Infecção aguda das vias aéreas superiores',
    nomeMedicoOuEmissor: 'Dr. Roberto Silveira',
    crmMedico: 'CRM-SP 182.904',
    comprovanteAnexoNome: 'atestado_medico_carlos_oliveira.pdf',
    status: 'HOMOLOGADO',
    observacoes: 'Atestado emitido por pronto atendimento credenciado. Abonado integralmente.',
    criadoEm: '2026-11-06',
    homologadoPor: 'Ambulatório Médico Ocupacional'
  }
];

export const INITIAL_PROGRAMACAO_FERIAS: ProgramacaoFerias[] = [
  {
    id: 'ferias-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-demo-01',
    colaboradorNome: 'Demonstração RH',
    colaboradorCpf: '999.888.777-66',
    periodoAquisitivoInicio: '2025-05-10',
    periodoAquisitivoFim: '2026-05-09',
    periodoConcessivoInicio: '2026-05-10',
    periodoConcessivoFim: '2027-05-09',
    dataInicioFerias: '2026-12-01',
    dataFimFerias: '2026-12-20',
    diasGozo: 20,
    diasAbonoPecuniario: 10,
    status: 'PROGRAMADO',
    observacao: 'Férias regulares com abono pecuniário de 10 dias (venda de 1/3).'
  },
  {
    id: 'ferias-02',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Mariana Souza',
    colaboradorCpf: '234.567.890-12',
    periodoAquisitivoInicio: '2024-03-15',
    periodoAquisitivoFim: '2025-03-14',
    periodoConcessivoInicio: '2025-03-15',
    periodoConcessivoFim: '2026-03-14',
    dataInicioFerias: '2025-11-10',
    dataFimFerias: '2025-11-24',
    diasGozo: 15,
    diasAbonoPecuniario: 0,
    status: 'EM_GOZO',
    observacao: '1º período de férias usufruído.'
  },
  {
    id: 'ferias-03',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-03',
    colaboradorNome: 'Carlos Eduardo Oliveira',
    colaboradorCpf: '345.678.901-23',
    periodoAquisitivoInicio: '2023-08-10',
    periodoAquisitivoFim: '2024-08-09',
    periodoConcessivoInicio: '2024-08-10',
    periodoConcessivoFim: '2025-08-09',
    dataInicioFerias: '2025-07-10',
    dataFimFerias: '2025-08-08',
    diasGozo: 30,
    diasAbonoPecuniario: 0,
    status: 'VENCIDO',
    observacao: 'Período concessivo ultrapassado sem gozo integral (Risco de pagamento em dobro conforme CLT Art. 137).'
  }
];

const STORAGE_KEY_FERIAS = 'sc_programacao_ferias';

const loadSavedFerias = (): ProgramacaoFerias[] => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_FERIAS) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Remove mock residual com CPF legado 123.456.789-00
        const filtrado = parsed.filter((f: any) => f.colaboradorCpf !== '123.456.789-00');
        if (filtrado.length > 0) return filtrado;
      }
    }
  } catch {}
  return INITIAL_PROGRAMACAO_FERIAS;
};

export function calcularPeriodosFerias(dataAdmissaoStr: string) {
  const adm = new Date(dataAdmissaoStr || '2025-01-01');
  const hoje = new Date();
  
  const anoAtual = hoje.getFullYear();
  const mesAdmissao = adm.getMonth();
  const diaAdmissao = adm.getDate();

  let aquisitivoInicio = new Date(anoAtual, mesAdmissao, diaAdmissao);
  if (aquisitivoInicio > hoje) {
    aquisitivoInicio.setFullYear(anoAtual - 1);
  }
  let aquisitivoFim = new Date(aquisitivoInicio);
  aquisitivoFim.setFullYear(aquisitivoFim.getFullYear() + 1);
  aquisitivoFim.setDate(aquisitivoFim.getDate() - 1);

  let concessivoInicio = new Date(aquisitivoFim);
  concessivoInicio.setDate(concessivoInicio.getDate() + 1);
  let concessivoFim = new Date(concessivoInicio);
  concessivoFim.setFullYear(concessivoFim.getFullYear() + 1);
  concessivoFim.setDate(concessivoFim.getDate() - 1);

  const diasAteFimConcessao = Math.round((concessivoFim.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
  const vencido = hoje > concessivoFim;

  return {
    aquisitivoInicio: aquisitivoInicio.toISOString().slice(0, 10),
    aquisitivoFim: aquisitivoFim.toISOString().slice(0, 10),
    concessivoInicio: concessivoInicio.toISOString().slice(0, 10),
    concessivoFim: concessivoFim.toISOString().slice(0, 10),
    diasAteFimConcessao,
    vencido
  };
}

export function GestaoAfastamentos({ colaboradores }: GestaoAfastamentosProps) {
  const { supabase } = useAuth();
  const [activeTab, setActiveTab] = useState<'afastamentos' | 'ferias'>('afastamentos');
  const [afastamentos, setAfastamentos] = useState<AfastamentoColaborador[]>(INITIAL_AFASTAMENTOS);
  const [programacoesFerias, setProgramacoesFerias] = useState<ProgramacaoFerias[]>(loadSavedFerias);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [modalFeriasAberto, setModalFeriasAberto] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const saveAndSetFerias = (next: ProgramacaoFerias[]) => {
    setProgramacoesFerias(next);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_FERIAS, JSON.stringify(next));
      }
    } catch {}
  };

  // Load vacations from Supabase on mount with localStorage fallback
  useEffect(() => {
    async function fetchVacations() {
      try {
        const { data, error } = await supabase.from('vacations').select('*');
        if (data && data.length > 0) {
          const mapped = data.map((v: any) => ({
            id: v.id,
            tenantId: v.tenant_id,
            colaboradorId: v.collaborator_id,
            colaboradorNome: v.collaborator_name,
            colaboradorCpf: v.collaborator_cpf,
            periodoAquisitivoInicio: v.periodo_aquisitivo_inicio,
            periodoAquisitivoFim: v.periodo_aquisitivo_fim,
            periodoConcessivoInicio: v.periodo_concessivo_inicio,
            periodoConcessivoFim: v.periodo_concessivo_fim,
            dataInicioFerias: v.data_inicio_ferias,
            dataFimFerias: v.data_fim_ferias,
            diasGozo: Number(v.dias_gozo),
            diasAbonoPecuniario: Number(v.dias_abono_pecuniario),
            status: v.status,
            observacao: v.observacao
          }));
          saveAndSetFerias(mapped);
        }
      } catch (err) {
        console.warn('Supabase vacations table not accessible yet, using robust local storage cache:', err);
      }
    }
    fetchVacations();
  }, [supabase]);

  // Form State Afastamento
  const [colaboradorIdForm, setColaboradorIdForm] = useState<string>(colaboradores[0]?.id || '');
  const [tipoForm, setTipoForm] = useState<TipoAfastamento>('ATESTADO_MEDICO');
  const [dataInicioForm, setDataInicioForm] = useState<string>('2026-11-07');
  const [dataFimForm, setDataFimForm] = useState<string>('2026-11-07');
  const [cid10Form, setCid10Form] = useState<string>('');
  const [crmForm, setCrmForm] = useState<string>('');
  const [medicoForm, setMedicoForm] = useState<string>('');
  const [obsForm, setObsForm] = useState<string>('');

  // Form State Férias (com cálculo automático de data fim)
  const [colabFeriasId, setColabFeriasId] = useState<string>(colaboradores[0]?.id || '');
  const [inicioFeriasForm, setInicioFeriasForm] = useState<string>('2027-01-01');
  const [diasGozoForm, setDiasGozoForm] = useState<number>(30);
  const [diasAbonoForm, setDiasAbonoForm] = useState<number>(0);
  const [fimFeriasForm, setFimFeriasForm] = useState<string>('2027-01-30');
  const [obsFeriasForm, setObsFeriasForm] = useState<string>('');

  // Função para recalcular automaticamente a data fim ao alterar início ou dias de gozo
  const handleInicioFeriasChange = (newInicio: string) => {
    setInicioFeriasForm(newInicio);
    if (newInicio) {
      const d = new Date(newInicio + 'T00:00:00');
      d.setDate(d.getDate() + Number(diasGozoForm) - 1);
      setFimFeriasForm(d.toISOString().slice(0, 10));
    }
  };

  const handleDiasGozoChange = (newDias: number) => {
    setDiasGozoForm(newDias);
    if (inicioFeriasForm) {
      const d = new Date(inicioFeriasForm + 'T00:00:00');
      d.setDate(d.getDate() + newDias - 1);
      setFimFeriasForm(d.toISOString().slice(0, 10));
    }
  };

  const diasPendentes = Math.max(0, 30 - Number(diasGozoForm) - Number(diasAbonoForm));

  const handleSalvarAfastamento = (e: React.FormEvent) => {
    e.preventDefault();
    const colab = colaboradores.find(c => c.id === colaboradorIdForm);
    if (!colab) return;

    const dIni = new Date(dataInicioForm);
    const dFim = new Date(dataFimForm);
    const diffDias = Math.max(1, Math.round((dFim.getTime() - dIni.getTime()) / (1000 * 3600 * 24)) + 1);

    const novo: AfastamentoColaborador = {
      id: `afast-${Date.now()}`,
      tenantId: 'tenant-01',
      colaboradorId: colab.id,
      colaboradorNome: colab.nome,
      colaboradorCpf: colab.cpf,
      colaboradorMatricula: colab.matricula,
      departamentoId: colab.departamentoId,
      departamentoNome: colab.departamentoNome,
      tipo: tipoForm,
      dataInicio: dataInicioForm,
      dataFim: dataFimForm,
      totalDias: diffDias,
      abonaMarcacoesPonto: true,
      cid10: cid10Form.trim() || undefined,
      crmMedico: crmForm.trim() || undefined,
      nomeMedicoOuEmissor: medicoForm.trim() || undefined,
      status: 'HOMOLOGADO',
      observacoes: obsForm.trim() || undefined,
      criadoEm: new Date().toISOString().slice(0, 10),
      homologadoPor: 'Gestor de Recursos Humanos'
    };

    setAfastamentos([novo, ...afastamentos]);
    setModalNovoAberto(false);
    setFeedbackMsg(`Afastamento de ${novo.colaboradorNome} registrado e homologado com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 4000);

    setCid10Form('');
    setCrmForm('');
    setMedicoForm('');
    setObsForm('');
  };

  const handleSalvarFerias = async (e: React.FormEvent) => {
    e.preventDefault();
    const colab = colaboradores.find(c => c.id === colabFeriasId);
    if (!colab) return;

    const periodos = calcularPeriodosFerias(colab.dataAdmissao || '2025-01-10');

    const novaFerias: ProgramacaoFerias = {
      id: `ferias-${Date.now()}`,
      tenantId: 'tenant-01',
      colaboradorId: colab.id,
      colaboradorNome: colab.nome,
      colaboradorCpf: colab.cpf,
      periodoAquisitivoInicio: periodos.aquisitivoInicio,
      periodoAquisitivoFim: periodos.aquisitivoFim,
      periodoConcessivoInicio: periodos.concessivoInicio,
      periodoConcessivoFim: periodos.concessivoFim,
      dataInicioFerias: inicioFeriasForm,
      dataFimFerias: fimFeriasForm,
      diasGozo: Number(diasGozoForm),
      diasAbonoPecuniario: Number(diasAbonoForm),
      status: periodos.vencido ? 'VENCIDO' : 'PROGRAMADO',
      observacao: obsFeriasForm.trim() || (diasPendentes > 0 ? `Férias fracionadas (${diasGozoForm}d gozo, restam ${diasPendentes}d pendentes)` : 'Férias regulares (30 dias)')
    };

    // Save to Supabase
    try {
      await supabase.from('vacations').upsert({
        id: novaFerias.id,
        tenant_id: novaFerias.tenantId,
        collaborator_id: novaFerias.colaboradorId,
        collaborator_name: novaFerias.colaboradorNome,
        collaborator_cpf: novaFerias.colaboradorCpf,
        periodo_aquisitivo_inicio: novaFerias.periodoAquisitivoInicio,
        periodo_aquisitivo_fim: novaFerias.periodoAquisitivoFim,
        periodo_concessivo_inicio: novaFerias.periodoConcessivoInicio,
        periodo_concessivo_fim: novaFerias.periodoConcessivoFim,
        data_inicio_ferias: novaFerias.dataInicioFerias,
        data_fim_ferias: novaFerias.dataFimFerias,
        dias_gozo: novaFerias.diasGozo,
        dias_abono_pecuniario: novaFerias.diasAbonoPecuniario,
        status: novaFerias.status,
        observacao: novaFerias.observacao
      });
    } catch (err) {
      console.warn('Failed to persist vacation to Supabase table:', err);
    }

    // Atualiza lista removendo duplicatas do mesmo colaborador e adicionando a nova
    const updatedList = [novaFerias, ...programacoesFerias.filter(f => f.colaboradorId !== novaFerias.colaboradorId)];
    saveAndSetFerias(updatedList);

    setModalFeriasAberto(false);
    setFeedbackMsg(`Férias de ${colab.nome} programadas e salvas com sucesso (${diasGozoForm} dias de gozo${diasPendentes > 0 ? `, ${diasPendentes}d pendentes` : ''})!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
    setObsFeriasForm('');
  };

  const getIconeTipo = (tipo: TipoAfastamento) => {
    switch (tipo) {
      case 'FERIAS': return <Plane className="w-4 h-4 text-emerald-400" />;
      case 'ATESTADO_MEDICO': return <Stethoscope className="w-4 h-4 text-amber-400" />;
      case 'LICENCA_MATERNIDADE':
      case 'LICENCA_PATERNIDADE': return <Baby className="w-4 h-4 text-sky-400" />;
      default: return <HeartHandshake className="w-4 h-4 text-purple-400" />;
    }
  };

  const formatarTipoLabel = (tipo: TipoAfastamento) => {
    switch (tipo) {
      case 'FERIAS': return 'Férias Regulamentares';
      case 'ATESTADO_MEDICO': return 'Atestado Médico';
      case 'LICENCA_MATERNIDADE': return 'Licença Maternidade';
      case 'LICENCA_PATERNIDADE': return 'Licença Paternidade';
      case 'CASAMENTO': return 'Licença Gala (Casamento)';
      case 'LUTO': return 'Licença Nojo (Luto)';
      default: return 'Afastamento Legal';
    }
  };

  const listaFiltrada = afastamentos.filter(a => {
    const matchTipo = filtroTipo === 'TODOS' || a.tipo === filtroTipo;
    const matchBusca = !buscaTexto || a.colaboradorNome.toLowerCase().includes(buscaTexto.toLowerCase()) || a.colaboradorCpf.includes(buscaTexto);
    return matchTipo && matchBusca;
  });

  const feriasVencidasCount = colaboradores.filter(c => {
    const periodos = calcularPeriodosFerias(c.dataAdmissao || '2025-01-10');
    const prog = programacoesFerias.find(f => f.colaboradorId === c.id);
    const temFeriasValidas = prog && (prog.status === 'PROGRAMADO' || prog.status === 'EM_GOZO' || prog.status === 'CONCLUIDO');
    return periodos.vencido && !temFeriasValidas;
  }).length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Stethoscope className="w-4 h-4" />
            Gestão de Afastamentos, Atestados & Programação de Férias CLT (Supabase)
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Suspensão de Ponto, Abonos & Férias</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Abono automático de faltas, homologação de atestados médicos com CID-10 e controle rigoroso dos períodos aquisitivos e concessivos de férias com persistência em Supabase (CLT Art. 129 a 153).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feriasVencidasCount > 0 && (
            <div className="px-3 py-2 bg-rose-950/80 border border-rose-500/60 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{feriasVencidasCount} Alerta(s) de Férias Vencidas (Art. 137)</span>
            </div>
          )}
          <button
            onClick={() => activeTab === 'afastamentos' ? setModalNovoAberto(true) : setModalFeriasAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'afastamentos' ? 'Registrar Afastamento' : 'Programar Férias'}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs Switcher: Afastamentos vs Programação de Férias */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('afastamentos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'afastamentos'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Atestados & Afastamentos ({afastamentos.length})
        </button>
        <button
          onClick={() => setActiveTab('ferias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ferias'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Programação de Férias & Alertas CLT ({programacoesFerias.length})
        </button>
      </div>

      {activeTab === 'afastamentos' ? (
        <>
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por colaborador ou CPF..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Tipo:</span>
              <select
                aria-label="Filtrar Afastamentos por Tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="TODOS">Todos os Afastamentos</option>
                <option value="ATESTADO_MEDICO">Atestados Médicos</option>
                <option value="FERIAS">Férias</option>
                <option value="LICENCA_MATERNIDADE">Licença Maternidade</option>
                <option value="LICENCA_PATERNIDADE">Licença Paternidade</option>
              </select>
            </div>
          </div>

          {/* Tabela de Afastamentos */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Tipo & CID</th>
                    <th className="py-3 px-4">Período</th>
                    <th className="py-3 px-4 text-center">Dias</th>
                    <th className="py-3 px-4">Impacto no Espelho</th>
                    <th className="py-3 px-4">Status & Homologação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {listaFiltrada.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.colaboradorNome}</div>
                        <div className="text-[11px] text-slate-500">{item.colaboradorCpf} • {item.departamentoNome}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 font-medium text-slate-200">
                          {getIconeTipo(item.tipo)}
                          <span>{formatarTipoLabel(item.tipo)}</span>
                        </div>
                        {item.cid10 && (
                          <div className="text-[11px] text-amber-400/90 mt-0.5 font-mono">
                            CID-10: {item.cid10}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {item.dataInicio.split('-').reverse().join('/')} até {item.dataFim.split('-').reverse().join('/')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {item.totalDias}d
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Falta Abonada (Sem Débito)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Por: {item.homologadoPor}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Aba de Gestão de Férias & Alertas CLT */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold uppercase block">Colaboradores Ativos</span>
              <span className="text-2xl font-bold text-white mt-1 block">{colaboradores.length}</span>
              <span className="text-[11px] text-emerald-400 mt-1 block">Períodos aquisitivos monitorados</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold uppercase block">Férias Programadas / Gozo</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                {programacoesFerias.filter(f => f.status === 'PROGRAMADO' || f.status === 'EM_GOZO').length}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Conforme CLT Art. 134</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-semibold uppercase block">Férias Vencidas (Risco Dobro)</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">{feriasVencidasCount}</span>
              <span className="text-[11px] text-rose-400 mt-1 block">Art. 137 CLT — Requer concessão imediata</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-400" />
                Quadro de Períodos Aquisitivos & Concessivos (Supabase / CLT)
              </h3>
              <button
                onClick={() => setModalFeriasAberto(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar Período de Férias
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Colaborador & Admissão</th>
                    <th className="py-3 px-4">Período Aquisitivo</th>
                    <th className="py-3 px-4">Período Concessivo Limite</th>
                    <th className="py-3 px-4">Gozo & Abono</th>
                    <th className="py-3 px-4">Status & Alerta CLT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {colaboradores.map(c => {
                    const periodos = calcularPeriodosFerias(c.dataAdmissao || '2025-01-10');
                    const prog = programacoesFerias.find(f => f.colaboradorId === c.id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.nome}</div>
                          <div className="text-[11px] text-slate-400">Admissão: <strong className="text-slate-200">{(c.dataAdmissao || '2025-01-10').split('-').reverse().join('/')}</strong></div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {periodos.aquisitivoInicio.split('-').reverse().join('/')} a {periodos.aquisitivoFim.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {periodos.concessivoInicio.split('-').reverse().join('/')} a <strong className={periodos.vencido ? 'text-rose-400' : 'text-slate-200'}>{periodos.concessivoFim.split('-').reverse().join('/')}</strong>
                        </td>
                        <td className="py-3 px-4">
                          {prog ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-white">{prog.diasGozo} dias gozo {prog.diasAbonoPecuniario > 0 ? `+ ${prog.diasAbonoPecuniario}d abono` : ''}</span>
                              <div className="text-[10px] text-slate-400 font-mono">Agendado: {prog.dataInicioFerias.split('-').reverse().join('/')}</div>
                            </div>
                          ) : (
                            <span className="text-amber-400/90">Não agendado</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {prog ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> FÉRIAS AGENDADAS
                            </span>
                          ) : periodos.vencido ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> FÉRIAS VENCIDAS (Art. 137 Dobro)
                            </span>
                          ) : periodos.diasAteFimConcessao <= 60 ? (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-400" /> Vence em {periodos.diasAteFimConcessao} dias
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Regular ({periodos.diasAteFimConcessao}d p/ vencer)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Afastamento */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                Registrar Afastamento / Atestado Médico
              </h3>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarAfastamento} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Colaborador</label>
                <select
                  aria-label="Colaborador para Afastamento"
                  value={colaboradorIdForm}
                  onChange={(e) => setColaboradorIdForm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  required
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cpf}) - {c.departamentoNome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Afastamento</label>
                  <select
                    aria-label="Tipo de Afastamento"
                    value={tipoForm}
                    onChange={(e) => setTipoForm(e.target.value as TipoAfastamento)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value="ATESTADO_MEDICO">Atestado Médico</option>
                    <option value="FERIAS">Férias</option>
                    <option value="LICENCA_MATERNIDADE">Licença Maternidade</option>
                    <option value="LICENCA_PATERNIDADE">Licença Paternidade</option>
                    <option value="CASAMENTO">Licença Gala</option>
                    <option value="LUTO">Licença Nojo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CID-10 (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: J06.9, M54.5"
                    value={cid10Form}
                    onChange={(e) => setCid10Form(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data Início</label>
                  <input
                    type="date"
                    value={dataInicioForm}
                    onChange={(e) => setDataInicioForm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={dataFimForm}
                    onChange={(e) => setDataFimForm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {tipoForm === 'ATESTADO_MEDICO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Médico Emissor</label>
                    <input
                      type="text"
                      placeholder="Dr. Nome do Médico"
                      value={medicoForm}
                      onChange={(e) => setMedicoForm(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">CRM / UF</label>
                    <input
                      type="text"
                      placeholder="Ex: CRM-SP 123456"
                      value={crmForm}
                      onChange={(e) => setCrmForm(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Justificativa ou informações adicionais..."
                  value={obsForm}
                  onChange={(e) => setObsForm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md active:scale-95"
                >
                  Homologar Afastamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Programar Férias */}
      {modalFeriasAberto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-emerald-400" />
                Agendamento de Férias Regulamentares (Supabase / CLT Art. 134)
              </h3>
              <button
                onClick={() => setModalFeriasAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarFerias} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Colaborador</label>
                <select
                  aria-label="Colaborador para Férias"
                  value={colabFeriasId}
                  onChange={(e) => setColabFeriasId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  required
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} (Admissão: {(c.dataAdmissao || '2025-01-10').split('-').reverse().join('/')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Card informativo de Vencimento e Período Aquisitivo CLT */}
              {(() => {
                const selectedColab = colaboradores.find(c => c.id === colabFeriasId);
                const periodos = calcularPeriodosFerias(selectedColab?.dataAdmissao || '2025-01-10');
                return (
                  <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                    periodos.vencido 
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-200' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 text-white">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        Período Aquisitivo & Vencimento (CLT)
                      </span>
                      <span className={periodos.vencido ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {periodos.vencido ? '🔴 VENCIDO (Art. 137)' : `Regular (${periodos.diasAteFimConcessao}d p/ vencer)`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                      <div>Aquisitivo: <strong className="text-white">{periodos.aquisitivoInicio.split('-').reverse().join('/')} a {periodos.aquisitivoFim.split('-').reverse().join('/')}</strong></div>
                      <div>Data Limite (Vencimento): <strong className={periodos.vencido ? 'text-rose-400 underline font-bold text-[11px]' : 'text-emerald-400 font-bold text-[11px]'}>{periodos.concessivoFim.split('-').reverse().join('/')}</strong></div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data Início das Férias</label>
                  <input
                    type="date"
                    value={inicioFeriasForm}
                    onChange={(e) => handleInicioFeriasChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Data Fim das Férias (Calculada)</label>
                  <input
                    type="date"
                    value={fimFeriasForm}
                    onChange={(e) => setFimFeriasForm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dias de Gozo (Ex: 20 ou 30)</label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={diasGozoForm}
                    onChange={(e) => handleDiasGozoChange(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Abono Pecuniário (Venda 1/3)</label>
                  <select
                    aria-label="Abono Pecuniario"
                    value={diasAbonoForm}
                    onChange={(e) => setDiasAbonoForm(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                  >
                    <option value={0}>0 dias (Sem abono)</option>
                    <option value={10}>10 dias (Venda de 1/3 - Máx legal)</option>
                  </select>
                </div>
              </div>

              {/* Balanço de Dias e Alerta de Fracionamento / Saldo Pendente */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Balanço da Licença (30 Dias Totais):</span>
                <span className="font-bold font-mono">
                  {diasGozoForm}d Gozo {diasAbonoForm > 0 ? `+ ${diasAbonoForm}d Abono` : ''} 
                  {diasPendentes > 0 ? ` · ⚠️ Restam ${diasPendentes}d Pendentes` : ' · ✅ 100% Utilizado'}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observações / Acordo de Fracionamento</label>
                <textarea
                  rows={2}
                  placeholder="Ex: 1º período de férias conforme acordado com a gerência..."
                  value={obsFeriasForm}
                  onChange={(e) => setObsFeriasForm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalFeriasAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md active:scale-95"
                >
                  Salvar e Sincronizar Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
