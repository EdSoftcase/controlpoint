import React, { useState } from 'react';
import { Colaborador } from '../types/operational';
import { AfastamentoColaborador, TipoAfastamento } from '../types/rhAvancado';
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
  Download
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

export function GestaoAfastamentos({ colaboradores }: GestaoAfastamentosProps) {
  const [afastamentos, setAfastamentos] = useState<AfastamentoColaborador[]>(INITIAL_AFASTAMENTOS);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [modalNovoAberto, setModalNovoAberto] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [colaboradorIdForm, setColaboradorIdForm] = useState<string>(colaboradores[0]?.id || '');
  const [tipoForm, setTipoForm] = useState<TipoAfastamento>('ATESTADO_MEDICO');
  const [dataInicioForm, setDataInicioForm] = useState<string>('2026-11-07');
  const [dataFimForm, setDataFimForm] = useState<string>('2026-11-07');
  const [cid10Form, setCid10Form] = useState<string>('');
  const [crmForm, setCrmForm] = useState<string>('');
  const [medicoForm, setMedicoForm] = useState<string>('');
  const [obsForm, setObsForm] = useState<string>('');

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

    // Reset
    setCid10Form('');
    setCrmForm('');
    setMedicoForm('');
    setObsForm('');
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

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Stethoscope className="w-4 h-4" />
            Gestão de Afastamentos, Férias & Atestados
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Suspensão de Ponto & Abonos Legais</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Abono automático de faltas no espelho de ponto sem gerar advertência indevida. Homologue atestados médicos com código CID-10 e organize o cronograma de férias conforme a CLT.
          </p>
        </div>
        <button
          onClick={() => setModalNovoAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Registrar Afastamento
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

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
    </div>
  );
}
