import React, { useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  MapPin, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Navigation,
  Crosshair,
  Filter,
  Check
} from 'lucide-react';
import { Departamento, Cargo, Estabelecimento, Colaborador, Tenant } from '../types/operational';
import { validateCNPJ, formatCNPJ } from '../utils/brazilianValidators';
import { useAuth } from './AuthContext';

interface GestaoEstruturaProps {
  activeTenant: Tenant;
  departamentos: Departamento[];
  onUpdateDepartamentos: (novos: Departamento[]) => void;
  cargos: Cargo[];
  onUpdateCargos: (novos: Cargo[]) => void;
  estabelecimentos: Estabelecimento[];
  onUpdateEstabelecimentos: (novos: Estabelecimento[]) => void;
  colaboradores: Colaborador[];
}

export const GestaoEstrutura: React.FC<GestaoEstruturaProps> = ({
  activeTenant,
  departamentos,
  onUpdateDepartamentos,
  cargos,
  onUpdateCargos,
  estabelecimentos,
  onUpdateEstabelecimentos,
  colaboradores
}) => {
  const { supabase } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'departamentos' | 'cargos' | 'estabelecimentos'>('departamentos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modais de Criação / Edição
  const [isDeptoModalOpen, setIsDeptoModalOpen] = useState(false);
  const [editingDepto, setEditingDepto] = useState<Departamento | null>(null);
  const [deptoForm, setDeptoForm] = useState({
    nome: '',
    codigo: '',
    gestorId: '',
    gestorNome: '',
    gestorEmail: '',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  });

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoForm, setCargoForm] = useState({
    titulo: '',
    codigo: '',
    cbo: '',
    cboDescricao: '',
    cargaHorariaSemanal: 40
  });

  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [editingEst, setEditingEst] = useState<Estabelecimento | null>(null);
  const [estForm, setEstForm] = useState({
    nome: '',
    codigo: '',
    cnpj: '',
    tipo: 'FILIAL' as 'MATRIZ' | 'FILIAL' | 'OBRA',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 100,
    latitude: -23.561684,
    longitude: -46.655981,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: '',
    bloquearForaDoRaio: true
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setStatusFeedback({ message, type });
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  // ==========================================
  // HANDLERS: DEPARTAMENTOS
  // ==========================================
  const handleOpenDeptoModal = (depto?: Departamento) => {
    if (depto) {
      setEditingDepto(depto);
      setDeptoForm({
        nome: depto.nome,
        codigo: depto.codigo,
        gestorId: depto.gestorId,
        gestorNome: depto.gestorNome,
        gestorEmail: depto.gestorEmail || '',
        horarioInicioPadrao: depto.horarioInicioPadrao || '08:00',
        cargaHorariaDiariaHoras: depto.cargaHorariaDiariaHoras || 8,
        intervaloMinutos: depto.intervaloMinutos || 60,
        maxMinutosAntecedenciaPermitido: depto.maxMinutosAntecedenciaPermitido || 15,
        regraAntecedenciaAtiva: depto.regraAntecedenciaAtiva ?? true
      });
    } else {
      setEditingDepto(null);
      setDeptoForm({
        nome: '',
        codigo: `DEP-0${departamentos.length + 1}`,
        gestorId: '',
        gestorNome: '',
        gestorEmail: '',
        horarioInicioPadrao: '08:00',
        cargaHorariaDiariaHoras: 8,
        intervaloMinutos: 60,
        maxMinutosAntecedenciaPermitido: 15,
        regraAntecedenciaAtiva: true
      });
    }
    setIsDeptoModalOpen(true);
  };

  const handleSaveDepto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptoForm.nome.trim()) {
      showNotification('O nome do departamento é obrigatório.', 'error');
      return;
    }

    const deptoId = editingDepto ? editingDepto.id : `dep-${Date.now()}`;
    const novoDepto: Departamento = {
      id: deptoId,
      tenantId: activeTenant.id,
      nome: deptoForm.nome.trim(),
      codigo: deptoForm.codigo.trim() || `DEP-${Math.floor(100 + Math.random() * 900)}`,
      gestorId: deptoForm.gestorId || 'gestor-01',
      gestorNome: deptoForm.gestorNome.trim() || 'Gestor Responsável',
      gestorEmail: deptoForm.gestorEmail.trim(),
      horarioInicioPadrao: deptoForm.horarioInicioPadrao,
      cargaHorariaDiariaHoras: Number(deptoForm.cargaHorariaDiariaHoras),
      intervaloMinutos: Number(deptoForm.intervaloMinutos),
      maxMinutosAntecedenciaPermitido: Number(deptoForm.maxMinutosAntecedenciaPermitido),
      regraAntecedenciaAtiva: deptoForm.regraAntecedenciaAtiva
    };

    // Persistência no Supabase (não-bloqueante se tabela não existir)
    try {
      await supabase.from('departments').upsert({
        department_id: novoDepto.id,
        tenant_id: novoDepto.tenantId,
        nome: novoDepto.nome,
        codigo: novoDepto.codigo,
        gestor_id: novoDepto.gestorId,
        gestor_nome: novoDepto.gestorNome,
        gestor_email: novoDepto.gestorEmail,
        horario_padrao: novoDepto.horarioInicioPadrao,
        carga_horaria_diaria: novoDepto.cargaHorariaDiariaHoras
      });
    } catch (err) {
      console.warn('Aviso sincronização Supabase departamento:', err);
    }

    let updatedList: Departamento[];
    if (editingDepto) {
      updatedList = departamentos.map(d => d.id === editingDepto.id ? novoDepto : d);
      showNotification(`Departamento "${novoDepto.nome}" atualizado com sucesso!`, 'success');
    } else {
      updatedList = [...departamentos, novoDepto];
      showNotification(`Departamento "${novoDepto.nome}" criado com sucesso!`, 'success');
    }

    onUpdateDepartamentos(updatedList);
    setIsDeptoModalOpen(false);
  };

  const handleDeleteDepto = async (id: string, nome: string) => {
    const colabsInDepto = colaboradores.filter(c => c.departamentoId === id);
    if (colabsInDepto.length > 0) {
      alert(`Não é possível excluir o departamento "${nome}" pois existem ${colabsInDepto.length} colaboradores alocados nele.`);
      return;
    }

    if (confirm(`Deseja realmente remover o departamento "${nome}"?`)) {
      try {
        await supabase.from('departments').delete().eq('department_id', id);
      } catch (err) {
        console.warn('Aviso delete departamento Supabase:', err);
      }
      onUpdateDepartamentos(departamentos.filter(d => d.id !== id));
      showNotification(`Departamento "${nome}" removido.`, 'success');
    }
  };

  // ==========================================
  // HANDLERS: CARGOS
  // ==========================================
  const handleOpenCargoModal = (cargo?: Cargo) => {
    if (cargo) {
      setEditingCargo(cargo);
      setCargoForm({
        titulo: cargo.titulo,
        codigo: cargo.codigo || '',
        cbo: cargo.cbo || '',
        cboDescricao: cargo.cboDescricao || '',
        cargaHorariaSemanal: cargo.cargaHorariaSemanal || 40
      });
    } else {
      setEditingCargo(null);
      setCargoForm({
        titulo: '',
        codigo: `CRG-0${cargos.length + 1}`,
        cbo: '4110-10',
        cboDescricao: 'Assistente Administrativo / Operacional',
        cargaHorariaSemanal: 40
      });
    }
    setIsCargoModalOpen(true);
  };

  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargoForm.titulo.trim()) {
      showNotification('O título do cargo é obrigatório.', 'error');
      return;
    }

    const cargoId = editingCargo ? editingCargo.id : `crg-${Date.now()}`;
    const novoCargo: Cargo = {
      id: cargoId,
      tenantId: activeTenant.id,
      titulo: cargoForm.titulo.trim(),
      codigo: cargoForm.codigo.trim() || `CRG-${Math.floor(100 + Math.random() * 900)}`,
      cbo: cargoForm.cbo.trim() || '4110-10',
      cboDescricao: cargoForm.cboDescricao.trim() || 'Classificação Brasileira de Ocupações',
      cargaHorariaSemanal: Number(cargoForm.cargaHorariaSemanal) || 40
    };

    try {
      await supabase.from('positions').upsert({
        position_id: novoCargo.id,
        tenant_id: novoCargo.tenantId,
        titulo: novoCargo.titulo,
        cbo: novoCargo.cbo,
        cbo_descricao: novoCargo.cboDescricao,
        carga_horaria_semanal: novoCargo.cargaHorariaSemanal
      });
    } catch (err) {
      console.warn('Aviso sincronização Supabase cargo:', err);
    }

    let updatedList: Cargo[];
    if (editingCargo) {
      updatedList = cargos.map(c => c.id === editingCargo.id ? novoCargo : c);
      showNotification(`Cargo "${novoCargo.titulo}" atualizado com sucesso!`, 'success');
    } else {
      updatedList = [...cargos, novoCargo];
      showNotification(`Cargo "${novoCargo.titulo}" criado com sucesso!`, 'success');
    }

    onUpdateCargos(updatedList);
    setIsCargoModalOpen(false);
  };

  const handleDeleteCargo = async (id: string, titulo: string) => {
    const colabsInCargo = colaboradores.filter(c => c.cargoId === id);
    if (colabsInCargo.length > 0) {
      alert(`Não é possível excluir o cargo "${titulo}" pois existem ${colabsInCargo.length} colaboradores com esse cargo.`);
      return;
    }

    if (confirm(`Deseja realmente remover o cargo "${titulo}"?`)) {
      try {
        await supabase.from('positions').delete().eq('position_id', id);
      } catch (err) {
        console.warn('Aviso delete cargo Supabase:', err);
      }
      onUpdateCargos(cargos.filter(c => c.id !== id));
      showNotification(`Cargo "${titulo}" removido.`, 'success');
    }
  };

  // ==========================================
  // HANDLERS: ESTABELECIMENTOS
  // ==========================================
  const handleOpenEstModal = (est?: Estabelecimento) => {
    if (est) {
      setEditingEst(est);
      setEstForm({
        nome: est.nome,
        codigo: est.codigo || '',
        cnpj: est.cnpj || activeTenant.cnpj,
        tipo: est.tipo || 'FILIAL',
        fusoHorario: est.fusoHorario || 'America/Sao_Paulo',
        cercaRaioMetros: est.cercaRaioMetros || 100,
        latitude: est.latitude || -23.561684,
        longitude: est.longitude || -46.655981,
        uf: est.uf || 'SP',
        municipio: est.municipio || 'São Paulo',
        enderecoCompleto: est.enderecoCompleto || '',
        bloquearForaDoRaio: est.bloquearForaDoRaio ?? true
      });
    } else {
      setEditingEst(null);
      setEstForm({
        nome: '',
        codigo: `EST-0${estabelecimentos.length + 1}`,
        cnpj: activeTenant.cnpj,
        tipo: estabelecimentos.length === 0 ? 'MATRIZ' : 'FILIAL',
        fusoHorario: 'America/Sao_Paulo',
        cercaRaioMetros: 100,
        latitude: -23.561684,
        longitude: -46.655981,
        uf: 'SP',
        municipio: 'São Paulo',
        enderecoCompleto: '',
        bloquearForaDoRaio: true
      });
    }
    setIsEstModalOpen(true);
  };

  const handleCaptureGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setEstForm(prev => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6))
          }));
          showNotification('Coordenadas GPS capturadas com precisão!', 'success');
        },
        (err) => {
          showNotification(`Erro ao obter GPS: ${err.message}`, 'error');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      showNotification('Geolocalização não suportada pelo navegador.', 'error');
    }
  };

  const handleSaveEst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estForm.nome.trim()) {
      showNotification('O nome do estabelecimento é obrigatório.', 'error');
      return;
    }

    const cnpjClean = estForm.cnpj.replace(/\D/g, '');
    if (cnpjClean.length > 0 && !validateCNPJ(estForm.cnpj).isValid) {
      showNotification('CNPJ informado para a unidade é inválido.', 'error');
      return;
    }

    const estId = editingEst ? editingEst.id : `est-${Date.now()}`;
    const novoEst: Estabelecimento = {
      id: estId,
      tenantId: activeTenant.id,
      nome: estForm.nome.trim(),
      codigo: estForm.codigo.trim() || `EST-${Math.floor(100 + Math.random() * 900)}`,
      cnpj: estForm.cnpj.trim() || activeTenant.cnpj,
      tipo: estForm.tipo,
      fusoHorario: estForm.fusoHorario,
      cercaRaioMetros: Number(estForm.cercaRaioMetros) || 100,
      latitude: Number(estForm.latitude),
      longitude: Number(estForm.longitude),
      uf: estForm.uf.toUpperCase(),
      municipio: estForm.municipio.trim(),
      enderecoCompleto: estForm.enderecoCompleto.trim(),
      bloquearForaDoRaio: estForm.bloquearForaDoRaio
    };

    try {
      await supabase.from('establishments').upsert({
        establishment_id: novoEst.id,
        tenant_id: novoEst.tenantId,
        nome: novoEst.nome,
        cnpj: novoEst.cnpj,
        latitude: novoEst.latitude,
        longitude: novoEst.longitude,
        cerca_raio_metros: novoEst.cercaRaioMetros,
        bloquear_fora_do_raio: novoEst.bloquearForaDoRaio
      });
    } catch (err) {
      console.warn('Aviso sincronização Supabase estabelecimento:', err);
    }

    let updatedList: Estabelecimento[];
    if (editingEst) {
      updatedList = estabelecimentos.map(e => e.id === editingEst.id ? novoEst : e);
      showNotification(`Unidade "${novoEst.nome}" atualizada com sucesso!`, 'success');
    } else {
      updatedList = [...estabelecimentos, novoEst];
      showNotification(`Unidade "${novoEst.nome}" criada com sucesso!`, 'success');
    }

    onUpdateEstabelecimentos(updatedList);
    setIsEstModalOpen(false);
  };

  const handleDeleteEst = async (id: string, nome: string) => {
    const colabsInEst = colaboradores.filter(c => c.estabelecimentoId === id);
    if (colabsInEst.length > 0) {
      alert(`Não é possível excluir a unidade "${nome}" pois existem ${colabsInEst.length} colaboradores lotados nela.`);
      return;
    }

    if (confirm(`Deseja realmente remover a unidade "${nome}"?`)) {
      try {
        await supabase.from('establishments').delete().eq('establishment_id', id);
      } catch (err) {
        console.warn('Aviso delete estabelecimento Supabase:', err);
      }
      onUpdateEstabelecimentos(estabelecimentos.filter(e => e.id !== id));
      showNotification(`Unidade "${nome}" removida.`, 'success');
    }
  };

  // Filtragem
  const filteredDeptos = departamentos.filter(d => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.gestorNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCargos = cargos.filter(c => 
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cbo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cboDescricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEsts = estabelecimentos.filter(e => 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cnpj.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {statusFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          statusFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusFeedback.message}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header com Navegação de Sub-Abas da Estrutura */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Estrutura Organizacional</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {activeTenant.razaoSocial}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gerencie Departamentos, Cargos & CBO e Estabelecimentos (Cercas Virtuais Geofence).
              </p>
            </div>
          </div>

          {/* Botão de Criação Contextual */}
          <div>
            {activeSubTab === 'departamentos' && (
              <button
                onClick={() => handleOpenDeptoModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Novo Departamento
              </button>
            )}
            {activeSubTab === 'cargos' && (
              <button
                onClick={() => handleOpenCargoModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Novo Cargo
              </button>
            )}
            {activeSubTab === 'estabelecimentos' && (
              <button
                onClick={() => handleOpenEstModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Nova Unidade / Filial
              </button>
            )}
          </div>
        </div>

        {/* Barra de Sub-abas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => { setActiveSubTab('departamentos'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'departamentos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Departamentos ({departamentos.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('cargos'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'cargos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Cargos & CBO ({cargos.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('estabelecimentos'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'estabelecimentos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              Estabelecimentos ({estabelecimentos.length})
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Filtrar ${activeSubTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTEÚDO 1: DEPARTAMENTOS                                 */}
        {/* ========================================================= */}
        {activeSubTab === 'departamentos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDeptos.map((d) => {
                const countColabs = colaboradores.filter(c => c.departamentoId === d.id).length;
                return (
                  <div 
                    key={d.id} 
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all hover:shadow-xs flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {d.codigo}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenDeptoModal(d)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Editar Departamento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepto(d.id, d.nome)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Excluir Departamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {d.nome}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Gestor: <span className="font-semibold text-slate-700">{d.gestorNome}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Jornada Padrão:</span>
                        <span className="font-mono font-semibold">{d.horarioInicioPadrao} ({d.cargaHorariaDiariaHoras}h/dia)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Tolerância Antecedência:</span>
                        <span className={`font-mono font-semibold ${d.regraAntecedenciaAtiva ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {d.regraAntecedenciaAtiva ? `${d.maxMinutosAntecedenciaPermitido} min` : 'Inativa'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 font-bold text-slate-800">
                        <span>Colaboradores Alocados:</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                          {countColabs} {countColabs === 1 ? 'vida' : 'vidas'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDeptos.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum departamento encontrado. Clique em "+ Novo Departamento" para cadastrar.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTEÚDO 2: CARGOS & CBO                                  */}
        {/* ========================================================= */}
        {activeSubTab === 'cargos' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Código / Título do Cargo</th>
                    <th className="py-3 px-4">Código CBO (MTE)</th>
                    <th className="py-3 px-4">Descrição Oficial da Ocupação</th>
                    <th className="py-3 px-4">Carga Semanal</th>
                    <th className="py-3 px-4">Ocupantes</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCargos.map((c) => {
                    const countColabs = colaboradores.filter(col => col.cargoId === c.id).length;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{c.titulo}</div>
                          <span className="text-[10px] font-mono text-slate-400">{c.codigo || c.id}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                          {c.cbo}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={c.cboDescricao}>
                          {c.cboDescricao}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {c.cargaHorariaSemanal}h / semana
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                            {countColabs}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenCargoModal(c)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Editar Cargo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCargo(c.id, c.titulo)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Excluir Cargo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredCargos.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum cargo encontrado. Clique em "+ Novo Cargo" para adicionar.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTEÚDO 3: ESTABELECIMENTOS & GEOFENCING                  */}
        {/* ========================================================= */}
        {activeSubTab === 'estabelecimentos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEsts.map((est) => {
                const countColabs = colaboradores.filter(c => c.estabelecimentoId === est.id).length;
                return (
                  <div 
                    key={est.id} 
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all hover:shadow-xs flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          est.tipo === 'MATRIZ' 
                            ? 'bg-purple-100 text-purple-800' 
                            : est.tipo === 'FILIAL' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {est.tipo}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEstModal(est)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Editar Unidade"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEst(est.id, est.nome)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Excluir Unidade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {est.nome}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">CNPJ: {formatCNPJ(est.cnpj)}</p>
                      <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{est.municipio} - {est.uf}</span>
                      </p>
                      {est.enderecoCompleto && (
                        <p className="text-[11px] text-slate-500 mt-1 truncate" title={est.enderecoCompleto}>
                          {est.enderecoCompleto}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cerca Virtual (Raio):</span>
                        <span className="font-mono font-bold text-slate-800">{est.cercaRaioMetros} metros</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Coordenadas GPS:</span>
                        <span className="font-mono text-[10px] text-slate-600">
                          {est.latitude.toFixed(4)}, {est.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Bloqueio Fora do Raio:</span>
                        <span className={`font-semibold ${est.bloquearForaDoRaio ? 'text-rose-600' : 'text-slate-500'}`}>
                          {est.bloquearForaDoRaio ? 'Ativo (Bloqueia)' : 'Apenas Alerta'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 font-bold text-slate-800">
                        <span>Colaboradores Lotados:</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[10px]">
                          {countColabs} {countColabs === 1 ? 'vida' : 'vidas'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEsts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum estabelecimento encontrado. Clique em "+ Nova Unidade / Filial" para cadastrar.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: NOVO / EDITAR DEPARTAMENTO                         */}
      {/* ========================================================= */}
      {isDeptoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingDepto ? 'Editar Departamento' : 'Novo Departamento'}
                </h3>
              </div>
              <button 
                onClick={() => setIsDeptoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDepto} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Departamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Recursos Humanos & DP, Logística, TI"
                  value={deptoForm.nome}
                  onChange={(e) => setDeptoForm({ ...deptoForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Código Interno</label>
                  <input
                    type="text"
                    placeholder="Ex: DEP-01"
                    value={deptoForm.codigo}
                    onChange={(e) => setDeptoForm({ ...deptoForm, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Horário Início Padrão</label>
                  <input
                    type="time"
                    value={deptoForm.horarioInicioPadrao}
                    onChange={(e) => setDeptoForm({ ...deptoForm, horarioInicioPadrao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Carga Horária Diária</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={deptoForm.cargaHorariaDiariaHoras}
                    onChange={(e) => setDeptoForm({ ...deptoForm, cargaHorariaDiariaHoras: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Intervalo Padrão (min)</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={deptoForm.intervaloMinutos}
                    onChange={(e) => setDeptoForm({ ...deptoForm, intervaloMinutos: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Gestor Responsável</label>
                <input
                  type="text"
                  placeholder="Nome do coordenador / supervisor"
                  value={deptoForm.gestorNome}
                  onChange={(e) => setDeptoForm({ ...deptoForm, gestorNome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">Regra de Bloqueio por Antecedência</label>
                  <input
                    type="checkbox"
                    checked={deptoForm.regraAntecedenciaAtiva}
                    onChange={(e) => setDeptoForm({ ...deptoForm, regraAntecedenciaAtiva: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Impede que o colaborador registre ponto muito antes do horário previsto (Portaria 671 e CLT).
                </p>
                {deptoForm.regraAntecedenciaAtiva && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-600">Limite de tolerância:</span>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={deptoForm.maxMinutosAntecedenciaPermitido}
                      onChange={(e) => setDeptoForm({ ...deptoForm, maxMinutosAntecedenciaPermitido: Number(e.target.value) })}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-600">minutos</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeptoModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Salvar Departamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO / EDITAR CARGO                                */}
      {/* ========================================================= */}
      {isCargoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingCargo ? 'Editar Cargo' : 'Novo Cargo & CBO'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCargoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCargo} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Cargo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Analista de Recursos Humanos, Desenvolvedor"
                  value={cargoForm.titulo}
                  onChange={(e) => setCargoForm({ ...cargoForm, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Código CBO *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 4110-10, 2124-05"
                    value={cargoForm.cbo}
                    onChange={(e) => setCargoForm({ ...cargoForm, cbo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Carga Semanal (horas)</label>
                  <input
                    type="number"
                    min="10"
                    max="44"
                    value={cargoForm.cargaHorariaSemanal}
                    onChange={(e) => setCargoForm({ ...cargoForm, cargaHorariaSemanal: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Descrição Oficial CBO / Atribuições</label>
                <textarea
                  rows={3}
                  placeholder="Descrição da família ocupacional no Ministério do Trabalho e Previdência"
                  value={cargoForm.cboDescricao}
                  onChange={(e) => setCargoForm({ ...cargoForm, cboDescricao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCargoModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Salvar Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO / EDITAR ESTABELECIMENTO                      */}
      {/* ========================================================= */}
      {isEstModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingEst ? 'Editar Estabelecimento / Filial' : 'Novo Estabelecimento & Cerca Virtual'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEstModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEst} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Matriz Paulista, Filial Campinas"
                    value={estForm.nome}
                    onChange={(e) => setEstForm({ ...estForm, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={estForm.tipo}
                    onChange={(e) => setEstForm({ ...estForm, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="MATRIZ">MATRIZ</option>
                    <option value="FILIAL">FILIAL</option>
                    <option value="OBRA">OBRA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">CNPJ da Unidade</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={estForm.cnpj}
                    onChange={(e) => setEstForm({ ...estForm, cnpj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fuso Horário</label>
                  <select
                    value={estForm.fusoHorario}
                    onChange={(e) => setEstForm({ ...estForm, fusoHorario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-[11px]"
                  >
                    <option value="America/Sao_Paulo">Brasília (-03:00)</option>
                    <option value="America/Manaus">Manaus (-04:00)</option>
                    <option value="America/Cuiaba">Cuiabá (-04:00)</option>
                    <option value="America/Rio_Branco">Acre (-05:00)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Município</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, Campinas"
                    value={estForm.municipio}
                    onChange={(e) => setEstForm({ ...estForm, municipio: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={estForm.uf}
                    onChange={(e) => setEstForm({ ...estForm, uf: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono font-bold uppercase text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Av. Paulista, 1000 - Bela Vista"
                  value={estForm.enderecoCompleto}
                  onChange={(e) => setEstForm({ ...estForm, enderecoCompleto: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Coordenadas e Cerca Virtual */}
              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-950 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-rose-600" />
                    Parâmetros de Cerca Virtual (Geofencing)
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors shadow-2xs"
                  >
                    <Navigation className="w-3 h-3" /> Usar Meu GPS Atual
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={estForm.latitude}
                      onChange={(e) => setEstForm({ ...estForm, latitude: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={estForm.longitude}
                      onChange={(e) => setEstForm({ ...estForm, longitude: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Raio (Metros)</label>
                    <input
                      type="number"
                      min="20"
                      max="5000"
                      required
                      value={estForm.cercaRaioMetros}
                      onChange={(e) => setEstForm({ ...estForm, cercaRaioMetros: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-rose-700 text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-rose-200/50">
                  <input
                    type="checkbox"
                    id="chkBloqueio"
                    checked={estForm.bloquearForaDoRaio}
                    onChange={(e) => setEstForm({ ...estForm, bloquearForaDoRaio: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <label htmlFor="chkBloqueio" className="text-[11px] font-semibold text-slate-800 cursor-pointer">
                    Bloquear registro de ponto se o trabalhador estiver fora do raio estipulado
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEstModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
