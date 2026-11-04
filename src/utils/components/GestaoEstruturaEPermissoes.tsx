import React, { useState } from 'react';
import { 
  Building2, 
  Briefcase, 
  MapPin, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Users, 
  Clock, 
  Globe, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  CheckSquare, 
  Square,
  Building,
  UserCheck
} from 'lucide-react';
import { Departamento, Cargo, Estabelecimento, Tenant, Colaborador } from '../types/operational';
import { useAuth } from './AuthContext';

interface GestaoEstruturaEPermissoesProps {
  activeTenant: Tenant;
  departamentos: Departamento[];
  onUpdateDepartamentos: (novos: Departamento[]) => void;
  cargos: Cargo[];
  onUpdateCargos: (novos: Cargo[]) => void;
  estabelecimentos: Estabelecimento[];
  onUpdateEstabelecimentos: (novos: Estabelecimento[]) => void;
  colaboradores: Colaborador[];
}

// Definição da Matriz de Permissões por Papel/Role
export interface PermissaoItem {
  id: string;
  categoria: string;
  nome: string;
  descricao: string;
  rolesPermitidos: {
    SUPER_ADMIN: boolean;
    RH_ADMIN: boolean;
    GESTOR: boolean;
    FISCAL_MTP: boolean;
    COLABORADOR: boolean;
  };
}

const DEFAULT_MATRIZ_PERMISSOES: PermissaoItem[] = [
  // 1. Admissão & Gestão de Pessoas
  {
    id: 'perm_admitir_colab',
    categoria: 'Admissão & Gestão de Pessoas',
    nome: 'Admitir Novo Colaborador',
    descricao: 'Cadastrar novos funcionários, gerar senha de acesso e PIN do coletor.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_editar_colab',
    categoria: 'Admissão & Gestão de Pessoas',
    nome: 'Editar Ficha Funcional',
    descricao: 'Alterar cargo, departamento, salário base, matrícula e e-mail.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_desativar_colab',
    categoria: 'Admissão & Gestão de Pessoas',
    nome: 'Desativar / Desligar Funcionário',
    descricao: 'Registrar desligamento e bloquear acesso às plataformas.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },

  // 2. Estrutura Organizacional
  {
    id: 'perm_gerenciar_deptos',
    categoria: 'Estrutura Organizacional',
    nome: 'Criar & Editar Departamentos',
    descricao: 'Definir setores, códigos internos e gestores responsáveis.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_gerenciar_cargos',
    categoria: 'Estrutura Organizacional',
    nome: 'Criar & Editar Cargos & CBOs',
    descricao: 'Gerenciar tabela de cargos, CBO MTP/IBGE e carga horária semanal.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_gerenciar_estabelecimentos',
    categoria: 'Estrutura Organizacional',
    nome: 'Gerenciar Estabelecimentos & Geofencing',
    descricao: 'Cadastrar matriz, filiais, coordenadas GPS e raio de bloqueio.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },

  // 3. Jornada de Trabalho & Ponto
  {
    id: 'perm_bater_ponto',
    categoria: 'Jornada de Trabalho & Ponto',
    nome: 'Registrar Marcação de Ponto',
    descricao: 'Bater ponto via Kiosk Tablet, Reconhecimento Facial ou App Web.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: true, FISCAL_MTP: false, COLABORADOR: true }
  },
  {
    id: 'perm_aprovar_he',
    categoria: 'Jornada de Trabalho & Ponto',
    nome: 'Aprovar Solicitacões de Hora Extra (M08)',
    descricao: 'Aprovar ou rejeitar solicitações de H.E. antes do encerramento da folha.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: true, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_tratar_descontos',
    categoria: 'Jornada de Trabalho & Ponto',
    nome: 'Abonar & Tratar Atrasos e Faltas (M09)',
    descricao: 'Registrar atestados médicos, abonos regulamentados e cálculo de DSR.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: true, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_ajustar_ponto',
    categoria: 'Jornada de Trabalho & Ponto',
    nome: 'Inclusão & Ajuste Manual de Ponto',
    descricao: 'Corrigir omissões de batida com justificativa legal auditável.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: true, FISCAL_MTP: false, COLABORADOR: false }
  },

  // 4. Compliance & Portaria 671/2021
  {
    id: 'perm_emitir_afd',
    categoria: 'Compliance & Portaria MTP 671',
    nome: 'Geração & Download do Arquivo AFD Oficial',
    descricao: 'Emitir arquivo fonte de dados com assinatura SHA-256 e NSRs sequenciais.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: true, COLABORADOR: false }
  },
  {
    id: 'perm_emitir_aej',
    categoria: 'Compliance & Portaria MTP 671',
    nome: 'Geração & Download do Arquivo AEJ Fiscal',
    descricao: 'Exportar Arquivo Eletrônico de Jornada para fiscalização do MTP.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: true, COLABORADOR: false }
  },
  {
    id: 'perm_assinar_espelho',
    categoria: 'Compliance & Portaria MTP 671',
    nome: 'Assinatura Eletrônica do Espelho de Ponto',
    descricao: 'Assinar e validar relatórios mensais de frequência com comprovante IP.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: true, FISCAL_MTP: true, COLABORADOR: true }
  },

  // 5. Configurações & Segurança
  {
    id: 'perm_chaves_supabase',
    categoria: 'Configurações & Segurança',
    nome: 'Gerenciar Chaves Supabase & Banco',
    descricao: 'Atualizar URL, Anon Key e Secret Key do projeto Supabase.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: false, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  },
  {
    id: 'perm_matriz_acesso',
    categoria: 'Configurações & Segurança',
    nome: 'Configurar Matriz de Permissões RBAC',
    descricao: 'Liberar ou restringir funcionalidades por perfil de usuário.',
    rolesPermitidos: { SUPER_ADMIN: true, RH_ADMIN: true, GESTOR: false, FISCAL_MTP: false, COLABORADOR: false }
  }
];

export const GestaoEstruturaEPermissoes: React.FC<GestaoEstruturaEPermissoesProps> = ({
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
  const [tabAtiva, setTabAtiva] = useState<'departamentos' | 'cargos' | 'estabelecimentos' | 'permissoes'>('departamentos');

  // Estados de Pesquisa
  const [busca, setBusca] = useState('');

  // Modais de Criação
  const [isDeptoModalOpen, setIsDeptoModalOpen] = useState(false);
  const [deptoForm, setDeptoForm] = useState({
    nome: '',
    codigo: '',
    gestorNome: '',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  });

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [cargoForm, setCargoForm] = useState({
    titulo: '',
    cbo: '',
    cboDescricao: '',
    cargaHorariaSemanal: 44
  });

  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [estForm, setEstForm] = useState({
    codigo: '',
    nome: '',
    cnpj: activeTenant?.cnpj || '58.392.102/0001-44',
    tipo: 'MATRIZ' as 'MATRIZ' | 'FILIAL' | 'OBRA',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 100,
    latitude: -23.561684,
    longitude: -46.655981,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: '',
    bloquearForaDoRaio: true
  });

  // Matriz de Permissões
  const [matrizPermissoes, setMatrizPermissoes] = useState<PermissaoItem[]>(DEFAULT_MATRIZ_PERMISSOES);
  const [permissaoSalvaFeedback, setPermissaoSalvaFeedback] = useState<string | null>(null);

  // Criar Departamento
  const handleSaveDepto = async () => {
    if (!deptoForm.nome.trim()) {
      alert('Nome do departamento é obrigatório');
      return;
    }

    const novoDepto: Departamento = {
      id: `dep-${Date.now()}`,
      tenantId: activeTenant.id,
      nome: deptoForm.nome.trim(),
      codigo: deptoForm.codigo.trim() || `DEP-${Math.floor(10 + Math.random() * 90)}`,
      gestorId: `gestor-${Date.now()}`,
      gestorNome: deptoForm.gestorNome.trim() || 'Gestor Responsável',
      gestorEmail: '',
      horarioInicioPadrao: deptoForm.horarioInicioPadrao,
      cargaHorariaDiariaHoras: Number(deptoForm.cargaHorariaDiariaHoras),
      intervaloMinutos: Number(deptoForm.intervaloMinutos),
      maxMinutosAntecedenciaPermitido: Number(deptoForm.maxMinutosAntecedenciaPermitido),
      regraAntecedenciaAtiva: deptoForm.regraAntecedenciaAtiva
    };

    try {
      await supabase.from('departments').upsert({
        department_id: novoDepto.id,
        tenant_id: novoDepto.tenantId,
        nome: novoDepto.nome,
        codigo: novoDepto.codigo,
        gestor_nome: novoDepto.gestorNome
      });
    } catch (err) {
      console.warn('Erro ao salvar departamento no Supabase:', err);
    }

    onUpdateDepartamentos([...departamentos, novoDepto]);
    setIsDeptoModalOpen(false);
    setDeptoForm({
      nome: '',
      codigo: '',
      gestorNome: '',
      horarioInicioPadrao: '08:00',
      cargaHorariaDiariaHoras: 8,
      intervaloMinutos: 60,
      maxMinutosAntecedenciaPermitido: 15,
      regraAntecedenciaAtiva: true
    });
  };

  // Criar Cargo
  const handleSaveCargo = async () => {
    if (!cargoForm.titulo.trim()) {
      alert('Título do cargo é obrigatório');
      return;
    }

    const novoCargo: Cargo = {
      id: `crg-${Date.now()}`,
      tenantId: activeTenant.id,
      titulo: cargoForm.titulo.trim(),
      cbo: cargoForm.cbo.trim() || '2524-05',
      cboDescricao: cargoForm.cboDescricao.trim() || cargoForm.titulo,
      cargaHorariaSemanal: Number(cargoForm.cargaHorariaSemanal) || 44
    };

    try {
      await supabase.from('positions').upsert({
        position_id: novoCargo.id,
        tenant_id: novoCargo.tenantId,
        titulo: novoCargo.titulo,
        cbo: novoCargo.cbo
      });
    } catch (err) {
      console.warn('Erro ao salvar cargo no Supabase:', err);
    }

    onUpdateCargos([...cargos, novoCargo]);
    setIsCargoModalOpen(false);
    setCargoForm({
      titulo: '',
      cbo: '',
      cboDescricao: '',
      cargaHorariaSemanal: 44
    });
  };

  // Criar Estabelecimento
  const handleSaveEst = async () => {
    if (!estForm.nome.trim()) {
      alert('Nome da unidade/estabelecimento é obrigatório');
      return;
    }

    const novoEst: Estabelecimento = {
      id: `est-${Date.now()}`,
      tenantId: activeTenant.id,
      codigo: estForm.codigo.trim() || `EST-${Math.floor(100 + Math.random() * 900)}`,
      nome: estForm.nome.trim(),
      cnpj: estForm.cnpj.trim() || activeTenant.cnpj,
      tipo: estForm.tipo,
      fusoHorario: estForm.fusoHorario,
      cercaRaioMetros: Number(estForm.cercaRaioMetros) || 100,
      latitude: Number(estForm.latitude) || -23.561684,
      longitude: Number(estForm.longitude) || -46.655981,
      uf: estForm.uf.toUpperCase(),
      municipio: estForm.municipio,
      enderecoCompleto: estForm.enderecoCompleto || 'Av. Paulista, 1000 - Bela Vista, SP',
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
      console.warn('Erro ao salvar estabelecimento no Supabase:', err);
    }

    onUpdateEstabelecimentos([...estabelecimentos, novoEst]);
    setIsEstModalOpen(false);
    setEstForm({
      codigo: '',
      nome: '',
      cnpj: activeTenant?.cnpj || '58.392.102/0001-44',
      tipo: 'MATRIZ',
      fusoHorario: 'America/Sao_Paulo',
      cercaRaioMetros: 100,
      latitude: -23.561684,
      longitude: -46.655981,
      uf: 'SP',
      municipio: 'São Paulo',
      enderecoCompleto: '',
      bloquearForaDoRaio: true
    });
  };

  // Alternar Permissão na Matriz RBAC
  const togglePermissao = (permId: string, role: keyof PermissaoItem['rolesPermitidos']) => {
    setMatrizPermissoes(prev => prev.map(p => {
      if (p.id === permId) {
        return {
          ...p,
          rolesPermitidos: {
            ...p.rolesPermitidos,
            [role]: !p.rolesPermitidos[role]
          }
        };
      }
      return p;
    }));
    setPermissaoSalvaFeedback('Matriz de Permissões atualizada com sucesso!');
    setTimeout(() => setPermissaoSalvaFeedback(null), 3000);
  };

  // Filtragem dos itens
  const deptosFiltrados = departamentos.filter(d => 
    d.nome.toLowerCase().includes(busca.toLowerCase()) || 
    d.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    d.gestorNome.toLowerCase().includes(busca.toLowerCase())
  );

  const cargosFiltrados = cargos.filter(c => 
    c.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    c.cbo.toLowerCase().includes(busca.toLowerCase())
  );

  const estsFiltrados = estabelecimentos.filter(e => 
    e.nome.toLowerCase().includes(busca.toLowerCase()) || 
    e.cnpj.includes(busca) ||
    e.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Estrutura Organizacional & Permissões</h2>
            <p className="text-xs text-slate-500">
              Cadastre Departamentos, Cargos, Estabelecimentos (Unidades) e configure a Matriz de Controle de Acesso (RBAC).
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE SUB-ABAS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTabAtiva('departamentos')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              tabAtiva === 'departamentos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            Departamentos ({departamentos.length})
          </button>
          <button
            onClick={() => setTabAtiva('cargos')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              tabAtiva === 'cargos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            Cargos ({cargos.length})
          </button>
          <button
            onClick={() => setTabAtiva('estabelecimentos')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              tabAtiva === 'estabelecimentos' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            Estabelecimentos ({estabelecimentos.length})
          </button>
          <button
            onClick={() => setTabAtiva('permissoes')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              tabAtiva === 'permissoes' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Matriz RBAC
          </button>
        </div>
      </div>

      {/* FEEDBACK TEMPORÁRIO */}
      {permissaoSalvaFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {permissaoSalvaFeedback}
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 1: DEPARTAMENTOS                                      */}
      {/* ========================================================= */}
      {tabAtiva === 'departamentos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar departamento..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsDeptoModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Departamento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deptosFiltrados.map((dep) => {
              const colabsNoDepto = colaboradores.filter((c) => c.departamentoId === dep.id);
              return (
                <div key={dep.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {dep.codigo}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {colabsNoDepto.length} Colaboradores
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{dep.nome}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Gestor: <strong className="text-slate-700">{dep.gestorNome || 'Não Atribuído'}</strong>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Horário Padrão</span>
                      <span className="font-semibold">{dep.horarioInicioPadrao} ({dep.cargaHorariaDiariaHoras}h/dia)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Tolerância</span>
                      <span className="font-semibold">{dep.maxMinutosAntecedenciaPermitido} min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 2: CARGOS                                              */}
      {/* ========================================================= */}
      {tabAtiva === 'cargos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cargo ou CBO..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsCargoModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Cargo
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Título do Cargo</th>
                  <th className="py-3 px-4">Código CBO</th>
                  <th className="py-3 px-4">Descrição da Atribuição</th>
                  <th className="py-3 px-4">Carga Semanal</th>
                  <th className="py-3 px-4 text-right">Alocados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {cargosFiltrados.map((crg) => {
                  const totalAlocados = colaboradores.filter(c => c.cargoId === crg.id).length;
                  return (
                    <tr key={crg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{crg.titulo}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-800">{crg.cbo || '2524-05'}</td>
                      <td className="py-3 px-4 text-slate-500">{crg.cboDescricao || 'Atribuições de apoio administrativo'}</td>
                      <td className="py-3 px-4 font-mono">{crg.cargaHorariaSemanal || 44}h / semana</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {totalAlocados} Vidas
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 3: ESTABELECIMENTOS                                    */}
      {/* ========================================================= */}
      {tabAtiva === 'estabelecimentos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por unidade ou CNPJ..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsEstModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Estabelecimento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {estsFiltrados.map((est) => (
              <div key={est.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      est.tipo === 'MATRIZ' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {est.tipo}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{est.nome}</h3>
                    <p className="text-xs font-mono text-slate-500">{est.cnpj}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">CÓDIGO UNIDADE</span>
                    <span className="text-xs font-bold font-mono text-slate-800">{est.codigo}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{est.enderecoCompleto || `${est.municipio} - ${est.uf}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>Geofencing: <strong>{est.cercaRaioMetros}m de Raio</strong></span>
                    <span className={`font-semibold ${est.bloquearForaDoRaio ? 'text-rose-600' : 'text-slate-500'}`}>
                      {est.bloquearForaDoRaio ? 'Bloqueio Fora do Raio Ativo' : 'Apenas Alerta GPS'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 4: MATRIZ DE PERMISSÕES (RBAC)                        */}
      {/* ========================================================= */}
      {tabAtiva === 'permissoes' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4" />
                CONTROLE DE ACESSO BASEADO EM PAPÉIS (RBAC)
              </div>
              <h3 className="text-lg font-bold mt-1">Matriz de Configuração de Perfis</h3>
              <p className="text-xs text-slate-400">
                Ative ou restrinja o acesso a funcionalidades da plataforma conforme o perfil do usuário logado.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-emerald-300">Regras de Segurança Ativas</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-4 px-4 min-w-[240px]">Funcionalidade / Módulo</th>
                    <th className="py-4 px-2 text-center w-28 bg-emerald-50/50 text-emerald-900">SUPER ADMIN</th>
                    <th className="py-4 px-2 text-center w-28">RH ADMIN</th>
                    <th className="py-4 px-2 text-center w-28">GESTOR</th>
                    <th className="py-4 px-2 text-center w-28">FISCAL MTP</th>
                    <th className="py-4 px-2 text-center w-28">COLABORADOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {matrizPermissoes.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900">{perm.nome}</div>
                        <div className="text-[10px] text-slate-500">{perm.descricao}</div>
                        <span className="inline-block text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {perm.categoria}
                        </span>
                      </td>

                      {/* Toggles por Role */}
                      {(['SUPER_ADMIN', 'RH_ADMIN', 'GESTOR', 'FISCAL_MTP', 'COLABORADOR'] as const).map((role) => (
                        <td key={role} className="py-3.5 px-2 text-center align-middle">
                          <button
                            onClick={() => togglePermissao(perm.id, role)}
                            className={`p-1.5 rounded-lg transition-all ${
                              perm.rolesPermitidos[role]
                                ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                : 'text-slate-300 hover:text-slate-400 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                            }`}
                            title={`Alternar ${perm.nome} para ${role}`}
                          >
                            {perm.rolesPermitidos[role] ? (
                              <CheckSquare className="w-5 h-5 mx-auto" />
                            ) : (
                              <Square className="w-5 h-5 mx-auto" />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR DEPARTAMENTO                                 */}
      {/* ========================================================= */}
      {isDeptoModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 space-y-5 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Departamento</h3>
              <button onClick={() => setIsDeptoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Departamento *</label>
                <input
                  type="text"
                  placeholder="Ex: Engenharia de Software"
                  value={deptoForm.nome}
                  onChange={(e) => setDeptoForm({ ...deptoForm, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Interno</label>
                  <input
                    type="text"
                    placeholder="Ex: DEP-05"
                    value={deptoForm.codigo}
                    onChange={(e) => setDeptoForm({ ...deptoForm, codigo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gestor Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Andrade"
                    value={deptoForm.gestorNome}
                    onChange={(e) => setDeptoForm({ ...deptoForm, gestorNome: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário Início Padrão</label>
                  <input
                    type="time"
                    value={deptoForm.horarioInicioPadrao}
                    onChange={(e) => setDeptoForm({ ...deptoForm, horarioInicioPadrao: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carga Horária (h/dia)</label>
                  <input
                    type="number"
                    value={deptoForm.cargaHorariaDiariaHoras}
                    onChange={(e) => setDeptoForm({ ...deptoForm, cargaHorariaDiariaHoras: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDeptoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDepto}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-md"
              >
                Salvar Departamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR CARGO                                        */}
      {/* ========================================================= */}
      {isCargoModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 space-y-5 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Cargo</h3>
              <button onClick={() => setIsCargoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Cargo *</label>
                <input
                  type="text"
                  placeholder="Ex: Desenvolvedor Fullstack Senior"
                  value={cargoForm.titulo}
                  onChange={(e) => setCargoForm({ ...cargoForm, titulo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código CBO MTP</label>
                  <input
                    type="text"
                    placeholder="Ex: 2124-05"
                    value={cargoForm.cbo}
                    onChange={(e) => setCargoForm({ ...cargoForm, cbo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carga Horária Semanal</label>
                  <input
                    type="number"
                    value={cargoForm.cargaHorariaSemanal}
                    onChange={(e) => setCargoForm({ ...cargoForm, cargaHorariaSemanal: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Atribuições</label>
                <textarea
                  rows={2}
                  placeholder="Descrição resumida das atividades funcionais..."
                  value={cargoForm.cboDescricao}
                  onChange={(e) => setCargoForm({ ...cargoForm, cboDescricao: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCargoModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCargo}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-md"
              >
                Salvar Cargo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CRIAR ESTABELECIMENTO                              */}
      {/* ========================================================= */}
      {isEstModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 space-y-5 p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Estabelecimento / Unidade</h3>
              <button onClick={() => setIsEstModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Unidade</label>
                  <input
                    type="text"
                    placeholder="Ex: EST-002"
                    value={estForm.codigo}
                    onChange={(e) => setEstForm({ ...estForm, codigo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Unidade</label>
                  <select
                    value={estForm.tipo}
                    onChange={(e) => setEstForm({ ...estForm, tipo: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="MATRIZ">MATRIZ</option>
                    <option value="FILIAL">FILIAL</option>
                    <option value="OBRA">OBRA / CLIENTE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                <input
                  type="text"
                  placeholder="Ex: Filial Campinas - Parque Tecnológico"
                  value={estForm.nome}
                  onChange={(e) => setEstForm({ ...estForm, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CNPJ da Unidade</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={estForm.cnpj}
                  onChange={(e) => setEstForm({ ...estForm, cnpj: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade / Município</label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={estForm.municipio}
                    onChange={(e) => setEstForm({ ...estForm, municipio: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UF / Estado</label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={estForm.uf}
                    onChange={(e) => setEstForm({ ...estForm, uf: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Raio Geofencing (Metros)</label>
                  <input
                    type="number"
                    value={estForm.cercaRaioMetros}
                    onChange={(e) => setEstForm({ ...estForm, cercaRaioMetros: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={estForm.bloquearForaDoRaio}
                      onChange={(e) => setEstForm({ ...estForm, bloquearForaDoRaio: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    Bloquear Ponto Fora do Raio
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEstModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEst}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-md"
              >
                Salvar Estabelecimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
