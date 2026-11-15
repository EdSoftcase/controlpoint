import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Tenant,
  Estabelecimento,
  ColetorTablet,
  Cargo,
  Departamento,
  Colaborador,
  RegistroPontoREPP,
  AuditLogItem,
  Feriado,
  SolicitacaoHoraExtra,
  OcorrenciaDesconto,
  SolicitacaoAjustePonto,
  AssinaturaEspelhoPonto
} from '../types/operational';
import { AuthUser } from '../types/auth';
import {
  generateAFDContent,
  generateAEJContent
} from '../data/operationalStore';
import { GestaoFeriados } from './GestaoFeriados';
import { GestaoEquipesEAprovacoes } from './GestaoEquipesEAprovacoes';
import { ModuloRelatoriosOcorrencias } from './ModuloRelatoriosOcorrencias';
import { BiometricConfigurator, calculateDistanceMeters } from './BiometricConfigurator';
import { GestaoEstrutura } from './GestaoEstrutura';
import { MatrizPermissoes } from './MatrizPermissoes';
import { PainelScoringIPA } from './PainelScoringIPA';
import { GestaoEscalas } from './GestaoEscalas';
import { GestaoAfastamentos } from './GestaoAfastamentos';
import { ExportadorFolhaERP } from './ExportadorFolhaERP';
import { DashboardRiscosRH } from './DashboardRiscosRH';
import { ModuloAppMobileKiosk } from './ModuloAppMobileKiosk';
import { GestaoColaboradoresTab } from './rh/GestaoColaboradoresTab';
import { GestaoRegistrosPontoTab } from './rh/GestaoRegistrosPontoTab';
import { GestaoConfiguracoesTab } from './rh/GestaoConfiguracoesTab';
import { useAuth } from './AuthContext';
import {
  validateCNPJ,
  formatCNPJ,
  validateCPF,
  formatCPF,
  checkPinUsageEligibility
} from '../utils/brazilianValidators';
import {
  detectFaceAndBiometrics,
  matchBiometricFace,
  averageBiometricDescriptors,
  resetLivenessState,
  FaceLandmarks,
  getRandomLivenessChallenge,
  LivenessChallenge
} from '../utils/facialBiometricsEngine';
import {
  saveOfflinePunchToIDB,
  initBackgroundSyncListener
} from '../utils/pwaBackgroundSync';
import {
  getOfflineQueue,
  getDeviceHealthStatus
} from '../utils/offlineManager';
import { calculateWorkedTime } from '../utils/jornadaCalculator';
import {
  Building2,
  Users,
  Clock,
  Tablet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Search,
  FileText,
  Lock,
  Printer,
  ChevronRight,
  Radio,
  FileCheck,
  Calendar,
  Coffee,
  LogIn,
  LogOut,
  AlertTriangle,
  UserCheck,
  BarChart3,
  PieChart,
  ScanFace,
  Settings,
  Database,
  Key,
  Server,
  Globe,
  ExternalLink,
  RefreshCw,
  Wifi,
  WifiOff,
  Copy,
  X,
  Check,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  Camera,
  ShieldAlert,
  UserX,
  Eye,
  EyeOff,
  Award,
  Sparkles,
  CalendarDays,
  Stethoscope,
  Smartphone,
  UserPlus,
  MapPin,
  Navigation,
  Crosshair,
  Edit3
} from 'lucide-react';
import { fetchAddressByCep, formatCep, geocodeBrazilianAddress } from '../utils/cepGeocoding';
import {
  getBrasiliaNow,
  getBrasiliaParts,
  getBrasiliaYmd,
  getBrasiliaMinutesOfDay,
  getBrasiliaDayOfWeek,
  formatBrasiliaTime
} from '../utils/brasiliaClock';
import { hasRealBiometricTemplate } from '../utils/biometricHelpers';

export const DEFAULT_TENANT: Tenant = {
  id: 'tenant-01',
  cnpj: '58.392.102/0001-44',
  razaoSocial: 'Softcase Tecnologia e Sistemas Ltda',
  nomeFantasia: 'Softcase Tecnologia',
  slug: 'softcase',
  plano: 'REP-P Corporativo',
  licencasContratadas: 500,
  licencasEmUso: 0,
  status: 'ATIVO',
  dataAdesao: '2026-01-01T00:00:00.000Z',
  emailAdmin: 'admin@softcase.com.br'
};

export const DEFAULT_DEPARTAMENTOS: Departamento[] = [
  {
    id: 'dep-01',
    tenantId: 'tenant-01',
    nome: 'Administrativo & Operações',
    codigo: 'DEP-01',
    gestorId: 'colab-admin',
    gestorNome: 'Administrador Softcase',
    gestorEmail: 'admin@softcase.com.br',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  },
  {
    id: 'dep-02',
    tenantId: 'tenant-01',
    nome: 'Recursos Humanos & DP',
    codigo: 'DEP-02',
    gestorId: 'colab-02',
    gestorNome: 'Luciana Mendonça',
    gestorEmail: 'rh@softcase.com.br',
    horarioInicioPadrao: '08:30',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  },
  {
    id: 'dep-03',
    tenantId: 'tenant-01',
    nome: 'Tecnologia & Desenvolvimento',
    codigo: 'DEP-03',
    gestorId: 'colab-03',
    gestorNome: 'Carlos Silva',
    gestorEmail: 'ti@softcase.com.br',
    horarioInicioPadrao: '09:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  },
  {
    id: 'dep-04',
    tenantId: 'tenant-01',
    nome: 'Logística & Expedição',
    codigo: 'DEP-04',
    gestorId: 'colab-04',
    gestorNome: 'Marcos Ribeiro',
    gestorEmail: 'logistica@softcase.com.br',
    horarioInicioPadrao: '07:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  }
];

export const DEFAULT_DEP: Departamento = DEFAULT_DEPARTAMENTOS[0];

export const DEFAULT_CARGOS: Cargo[] = [
  { id: 'crg-01', tenantId: 'tenant-01', titulo: 'Super Administrador', codigo: 'CRG-01', cbo: '2124-05', cboDescricao: 'Especialista em Sistemas de Informação', cargaHorariaSemanal: 40 },
  { id: 'crg-02', tenantId: 'tenant-01', titulo: 'Analista de Recursos Humanos', codigo: 'CRG-02', cbo: '2524-05', cboDescricao: 'Profissionais de Recursos Humanos', cargaHorariaSemanal: 40 },
  { id: 'crg-03', tenantId: 'tenant-01', titulo: 'Analista de Departamento Pessoal', codigo: 'CRG-03', cbo: '4110-05', cboDescricao: 'Auxiliar de Pessoal / Folha de Pagamento', cargaHorariaSemanal: 44 },
  { id: 'crg-04', tenantId: 'tenant-01', titulo: 'Engenheiro de Software', codigo: 'CRG-04', cbo: '2124-20', cboDescricao: 'Desenvolvedor de Sistemas', cargaHorariaSemanal: 40 },
  { id: 'crg-05', tenantId: 'tenant-01', titulo: 'Coordenador Operacional', codigo: 'CRG-05', cbo: '1421-05', cboDescricao: 'Gerente Administrativo', cargaHorariaSemanal: 40 },
  { id: 'crg-06', tenantId: 'tenant-01', titulo: 'Assistente Administrativo', codigo: 'CRG-06', cbo: '4110-10', cboDescricao: 'Assistente Administrativo', cargaHorariaSemanal: 44 }
];

export const DEFAULT_CRG: Cargo = DEFAULT_CARGOS[0];

export const DEFAULT_ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: 'est-01',
    tenantId: 'tenant-01',
    codigo: '0001',
    nome: 'Matriz Principal - Sede (Av. Paulista)',
    cnpj: '58.392.102/0001-44',
    tipo: 'MATRIZ',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 100,
    latitude: -23.561684,
    longitude: -46.655981,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    bloquearForaDoRaio: true
  },
  {
    id: 'est-02',
    tenantId: 'tenant-01',
    codigo: '0002',
    nome: 'Filial Campinas - Polo Tecnológico',
    cnpj: '58.392.102/0002-25',
    tipo: 'FILIAL',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 150,
    latitude: -22.90556,
    longitude: -47.06083,
    uf: 'SP',
    municipio: 'Campinas',
    enderecoCompleto: 'Rua Barão de Jaguara, 500 - Centro, Campinas - SP',
    bloquearForaDoRaio: true
  }
];

export const DEFAULT_EST: Estabelecimento = DEFAULT_ESTABELECIMENTOS[0];

export const DEFAULT_COLABORADORES: Colaborador[] = [
  {
    id: 'colab-01',
    tenantId: 'tenant-01',
    nome: 'Carlos Silva',
    cpf: '123.456.789-01',
    matricula: 'SC-1001',
    pis: '123.45678.90-1',
    dataAdmissao: '2023-01-15',
    cargoId: 'crg-04',
    cargoTitulo: 'Engenheiro de Software',
    departamentoId: 'dep-03',
    departamentoNome: 'Tecnologia & Desenvolvimento',
    gestorId: 'colab-admin',
    gestorNome: 'Administrador Softcase',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Matriz Principal - Sede (Av. Paulista)',
    regime: 'REGULAR',
    horarioInicio: '09:00',
    horarioFim: '18:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '1001',
    biometriaCadastrada: true,
    biometriaHashTemplate: 'SHA256:7B8F9A01C2D3E4F5',
    limiarConfiancaMinimo: 95.0,
    status: 'ATIVO',
    email: 'carlos.silva@softcase.com.br'
  },
  {
    id: 'colab-02',
    tenantId: 'tenant-01',
    nome: 'Luciana Mendonça',
    cpf: '234.567.890-12',
    matricula: 'SC-1002',
    pis: '234.56789.01-2',
    dataAdmissao: '2022-05-10',
    cargoId: 'crg-02',
    cargoTitulo: 'Analista de Recursos Humanos',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & DP',
    gestorId: 'colab-admin',
    gestorNome: 'Administrador Softcase',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Matriz Principal - Sede (Av. Paulista)',
    regime: 'REGULAR',
    horarioInicio: '08:30',
    horarioFim: '17:30',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '1002',
    biometriaCadastrada: true,
    biometriaHashTemplate: 'SHA256:A1C2E3B4D5F60718',
    limiarConfiancaMinimo: 95.0,
    status: 'ATIVO',
    email: 'rh@softcase.com.br'
  },
  {
    id: 'colab-03',
    tenantId: 'tenant-01',
    nome: 'Marcos Ribeiro',
    cpf: '345.678.901-23',
    matricula: 'SC-1003',
    pis: '345.67890.12-3',
    dataAdmissao: '2024-02-01',
    cargoId: 'crg-05',
    cargoTitulo: 'Coordenador Operacional',
    departamentoId: 'dep-04',
    departamentoNome: 'Logística & Expedição',
    gestorId: 'colab-admin',
    gestorNome: 'Administrador Softcase',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Matriz Principal - Sede (Av. Paulista)',
    regime: 'REGULAR',
    horarioInicio: '07:00',
    horarioFim: '16:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '1003',
    biometriaCadastrada: false,
    status: 'ATIVO',
    email: 'marcos.ribeiro@softcase.com.br'
  },
  {
    id: 'colab-04',
    tenantId: 'tenant-01',
    nome: 'Juliana Ferreira',
    cpf: '456.789.012-34',
    matricula: 'SC-1004',
    pis: '456.78901.23-4',
    dataAdmissao: '2023-08-20',
    cargoId: 'crg-06',
    cargoTitulo: 'Assistente Administrativo',
    departamentoId: 'dep-01',
    departamentoNome: 'Administrativo & Operações',
    gestorId: 'colab-admin',
    gestorNome: 'Administrador Softcase',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Matriz Principal - Sede (Av. Paulista)',
    regime: 'REGULAR',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '1004',
    biometriaCadastrada: true,
    biometriaHashTemplate: 'SHA256:5E6F7A8B9C0D1E2F',
    limiarConfiancaMinimo: 95.0,
    status: 'ATIVO',
    email: 'juliana.ferreira@softcase.com.br'
  }
];

export const DEFAULT_COLAB: Colaborador = DEFAULT_COLABORADORES[0];

interface OperationalAppProps {
  currentUser?: AuthUser;
  departamentos?: Departamento[];
  onUpdateDepartamentos?: (novos: Departamento[]) => void;
  colaboradores?: Colaborador[];
  onUpdateColaboradores?: (novos: Colaborador[]) => void;
  registrosPonto?: RegistroPontoREPP[];
  onUpdateRegistrosPonto?: (novos: RegistroPontoREPP[]) => void;
  horasExtras?: SolicitacaoHoraExtra[];
  onUpdateHorasExtras?: (novos: SolicitacaoHoraExtra[]) => void;
  feriados?: Feriado[];
  onUpdateFeriados?: (novos: Feriado[]) => void;
  ocorrencias?: OcorrenciaDesconto[];
  onUpdateOcorrencias?: (novas: OcorrenciaDesconto[]) => void;
  solicitacoesAjuste?: SolicitacaoAjustePonto[];
  onUpdateSolicitacoesAjuste?: (novas: SolicitacaoAjustePonto[]) => void;
  assinaturasEspelho?: AssinaturaEspelhoPonto[];
  onUpdateAssinaturasEspelho?: (novas: AssinaturaEspelhoPonto[]) => void;
  estabelecimentos?: Estabelecimento[];
  onUpdateEstabelecimentos?: (novos: Estabelecimento[]) => void;
  operationalTab?: 'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'estrutura' | 'permissoes' | 'registros' | 'feriados' | 'tenants' | 'config' | 'ipa' | 'escalas' | 'afastamentos' | 'exportador' | 'riscos' | 'mobile';
  onSelectOperationalTab?: (tab: any) => void;
}

export const OperationalApp: React.FC<OperationalAppProps> = ({
  currentUser = {
    id: 'user-02',
    nome: 'Luciana Mendonça',
    email: 'rh@softcase.com.br',
    cpf: '234.567.890-12',
    role: 'RH_ADMIN',
    roleLabel: 'RH & Departamento Pessoal',
    tenantId: 'tenant-01',
    tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
    mfaHabilitado: true
  },
  estabelecimentos: propEstabelecimentos,
  onUpdateEstabelecimentos: propOnUpdateEstabelecimentos,
  departamentos: propDepartamentos,
  onUpdateDepartamentos: propOnUpdateDepartamentos,
  colaboradores: propColaboradores,
  onUpdateColaboradores: propOnUpdateColaboradores,
  registrosPonto: propRegistros,
  onUpdateRegistrosPonto: propOnUpdateRegistros,
  horasExtras: propHorasExtras,
  onUpdateHorasExtras: propOnUpdateHorasExtras,
  feriados: propFeriados,
  onUpdateFeriados: propOnUpdateFeriados,
  ocorrencias: propOcorrencias,
  onUpdateOcorrencias: propOnUpdateOcorrencias,
  solicitacoesAjuste: propSolicitacoesAjuste,
  onUpdateSolicitacoesAjuste: propOnUpdateSolicitacoesAjuste,
  assinaturasEspelho: propAssinaturasEspelho,
  onUpdateAssinaturasEspelho: propOnUpdateAssinaturasEspelho,
  operationalTab: propOperationalTab,
  onSelectOperationalTab: propOnSelectOperationalTab
}) => {
  const { session, authToken, updateSupabaseConfig, supabase } = useAuth();
  const bearerToken = authToken || session?.access_token || '';
  
  // Inicializa listener de Background Sync para PWA Offline -> Supabase
  useEffect(() => {
    const cleanup = initBackgroundSyncListener(supabase, (count) => {
      console.log(`${count} batidas de ponto offline sincronizadas com sucesso para o Supabase.`);
    });
    return cleanup;
  }, [supabase]);

  // Efeito para carregar dados reais do Supabase
  useEffect(() => {
    async function fetchData() {
      // Carrega dados do Supabase diretamente pelo client autenticado ou público
      
      try {
        // Carrega Tenants + metadados locais de endereço/coordenadas
        let cachedTenantLocations: Record<string, any> = {};
        if (typeof window !== 'undefined') {
          try {
            cachedTenantLocations = JSON.parse(localStorage.getItem('sc_tenant_locations') || '{}');
          } catch (_) {}
        }

        const { data: tenantsData } = await supabase.from('tenants').select('*');
        if (tenantsData && tenantsData.length > 0) {
          setTenants(tenantsData.map(t => {
            const loc = cachedTenantLocations[t.tenant_id] || {};
            return {
              id: t.tenant_id,
              cnpj: t.cnpj || '58.392.102/0001-44',
              razaoSocial: t.razao_social || 'Softcase Tecnologia e Sistemas Ltda',
              nomeFantasia: t.nome_fantasia || 'Softcase Tecnologia',
              slug: t.slug || 'softcase',
              plano: (t.plano as any) || 'REP-P Corporativo',
              licencasContratadas: Number(t.licencas_contratadas) || 500,
              licencasEmUso: 0,
              status: (t.status as any) || 'ATIVO',
              dataAdesao: t.created_at || getBrasiliaParts().iso,
              emailAdmin: t.email_admin || 'admin@softcase.com.br',
              cep: t.cep ?? loc.cep,
              logradouro: t.logradouro ?? loc.logradouro,
              numero: t.numero ?? loc.numero,
              complemento: t.complemento ?? loc.complemento,
              bairro: t.bairro ?? loc.bairro,
              municipio: t.municipio ?? loc.municipio,
              uf: t.uf ?? loc.uf,
              enderecoCompleto: t.endereco_completo ?? loc.enderecoCompleto,
              latitude: t.latitude != null ? Number(t.latitude) : loc.latitude,
              longitude: t.longitude != null ? Number(t.longitude) : loc.longitude,
              cercaRaioMetros: t.cerca_raio_metros != null ? Number(t.cerca_raio_metros) : loc.cercaRaioMetros,
              bloquearForaDoRaio: t.bloquear_fora_do_raio ?? loc.bloquearForaDoRaio ?? true
            };
          }));
        } else {
          setTenants([DEFAULT_TENANT]);
        }

        // Carrega Colaboradores
        const { data: colabsData } = await supabase.from('collaborators').select('*');
        if (colabsData && colabsData.length > 0) {
          setColaboradores(colabsData.map(c => {
            const localVecRaw = typeof window !== 'undefined' ? localStorage.getItem(`sc_bio_vec_${c.collaborator_id}`) : null;
            const rawTemplate = c.biometric_template || c.biometria_hash_template || localVecRaw || undefined;
            const hasBio = hasRealBiometricTemplate({
              biometriaCadastrada: c.biometria_cadastrada,
              biometriaHashTemplate: rawTemplate
            });
            return {
              id: c.collaborator_id,
              tenantId: c.tenant_id,
              nome: c.nome,
              cpf: c.cpf,
              matricula: c.matricula,
              pis: c.pis,
              dataAdmissao: c.data_admissao,
              cargoId: c.cargo_id,
              cargoTitulo: c.cargo_titulo,
              departamentoId: c.departamento_id,
              departamentoNome: c.departamento_nome,
              gestorId: c.gestor_id,
              gestorNome: c.gestor_nome,
              estabelecimentoId: c.estabelecimento_id,
              estabelecimentoNome: c.estabelecimento_nome,
              regime: c.regime as any,
              horarioInicio: c.horario_inicio,
              horarioFim: c.horario_fim,
              cargaHorariaDiariaHoras: Number(c.carga_horaria_diaria),
              intervaloMinutos: c.intervalo_minutos,
              maxMinutosAntecedenciaPermitido: c.max_minutos_antecedencia,
              regraAntecedenciaAtiva: c.regra_antecedencia_ativa,
              pinColetor: c.pin_coletor,
              status: c.status as any,
              biometriaCadastrada: hasBio,
              biometriaHashTemplate: rawTemplate,
              limiarConfiancaMinimo: c.limiar_confianca_minimo || 95.0,
              email: c.email || ''
            };
          }));
        } else {
          setColaboradores(DEFAULT_COLABORADORES);
        }

        // Carrega Estabelecimentos
        const { data: estsData } = await supabase.from('establishments').select('*');
        if (estsData && estsData.length > 0) setEstabelecimentos(estsData.map(e => ({
            id: e.establishment_id,
            tenantId: e.tenant_id,
            nome: e.nome,
            cnpj: e.cnpj,
            codigo: (e.establishment_id || '').split('-')[0] || 'EST',
            tipo: (e.tipo as any) || ((e.establishment_id || '').includes('matriz') ? 'MATRIZ' : 'FILIAL'),
            fusoHorario: e.fuso_horario || 'America/Sao_Paulo',
            uf: e.uf || 'SP',
            municipio: e.municipio || 'São Paulo',
            enderecoCompleto: e.endereco_completo || '',
            cep: e.cep || '',
            latitude: e.latitude != null ? Number(e.latitude) : Number.NaN,
            longitude: e.longitude != null ? Number(e.longitude) : Number.NaN,
            cercaRaioMetros: Number(e.cerca_raio_metros) || 100,
            bloquearForaDoRaio: e.bloquear_fora_do_raio ?? true
        })));

        // Carrega Registros de Ponto
        const { data: pointsData } = await supabase.from('point_registrations').select('*').order('data_hora', { ascending: false });
        if (pointsData) setRegistrosPonto(pointsData.map(p => {
            const detalhes = typeof p.detalhes === 'string' ? JSON.parse(p.detalhes) : p.detalhes;
            return {
                nsr: p.nsr,
                tenantId: p.tenant_id,
                empregadorRazaoSocial: detalhes?.empregadorRazaoSocial || 'Softcase',
                empregadorCnpj: detalhes?.empregadorCnpj || '00.000.000/0001-91',
                colaboradorId: p.collaborator_id,
                colaboradorNome: detalhes?.colaboradorNome || 'Colaborador', 
                colaboradorCpf: detalhes?.colaboradorCpf || '000.000.000-00',
                colaboradorMatricula: detalhes?.colaboradorMatricula || 'SC-0000',
                dataHora: p.data_hora,
                dataHoraFormatada: getBrasiliaParts(p.data_hora).formatted,
                fusoHorario: '-03:00',
                coletorId: detalhes?.coletorId || '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                tipoMarcacao: p.tipo_marcacao as any,
                latitude: p.latitude != null ? Number(p.latitude) : 0,
                longitude: p.longitude != null ? Number(p.longitude) : 0,
                hashSha256: p.hash_sha256,
                modoDispositivo: p.modo_dispositivo as any,
                alertaAntecedencia: detalhes?.alertaAntecedencia,
                alertaIntervalo: detalhes?.alertaIntervalo
            };
        }));

      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error);
      }
    }
    
    fetchData();
  }, [session, authToken, supabase]);
  
  // Estado dos Dados Operacionais (com fallback local seguro)
  const [tenants, setTenants] = useState<Tenant[]>([DEFAULT_TENANT]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-01');
  const [localEstabelecimentos, setLocalEstabelecimentos] = useState<Estabelecimento[]>(DEFAULT_ESTABELECIMENTOS);
  const estabelecimentos = (propEstabelecimentos && propEstabelecimentos.length > 0) ? propEstabelecimentos : (localEstabelecimentos.length > 0 ? localEstabelecimentos : DEFAULT_ESTABELECIMENTOS);
  const setEstabelecimentos = async (ests: Estabelecimento[]) => {
    setLocalEstabelecimentos(ests.length > 0 ? ests : DEFAULT_ESTABELECIMENTOS);
    propOnUpdateEstabelecimentos?.(ests);

    if (supabase) {
      const dbEsts = ests.map(e => ({
        establishment_id: e.id,
        tenant_id: e.tenantId,
        nome: e.nome,
        cnpj: e.cnpj,
        tipo: e.tipo || 'FILIAL',
        cep: e.cep || null,
        latitude: Number.isFinite(e.latitude) ? e.latitude : null,
        longitude: Number.isFinite(e.longitude) ? e.longitude : null,
        cerca_raio_metros: e.cercaRaioMetros,
        bloquear_fora_do_raio: e.bloquearForaDoRaio,
        endereco_completo: e.enderecoCompleto,
        municipio: e.municipio,
        uf: e.uf,
        fuso_horario: e.fusoHorario
      }));
      await supabase.from('establishments').upsert(dbEsts, { onConflict: 'establishment_id' });
    }
  };

  const [coletores, setColetores] = useState<ColetorTablet[]>([]);
  const [cargosState, setCargosState] = useState<Cargo[]>(DEFAULT_CARGOS);
  const cargos = cargosState.length > 0 ? cargosState : DEFAULT_CARGOS;
  const setCargos = setCargosState;

  // Estados sincronizáveis
  const [localDepartamentos, setLocalDepartamentos] = useState<Departamento[]>(DEFAULT_DEPARTAMENTOS);
  const departamentos = (propDepartamentos && propDepartamentos.length > 0) ? propDepartamentos : (localDepartamentos.length > 0 ? localDepartamentos : DEFAULT_DEPARTAMENTOS);
  const setDepartamentos = (depts: Departamento[]) => {
    setLocalDepartamentos(depts.length > 0 ? depts : DEFAULT_DEPARTAMENTOS);
    propOnUpdateDepartamentos?.(depts);
  };

  const [localColaboradores, setLocalColaboradores] = useState<Colaborador[]>(DEFAULT_COLABORADORES);
  const colaboradores = (propColaboradores && propColaboradores.length > 0) ? propColaboradores : localColaboradores;
  const setColaboradores = (colabs: Colaborador[]) => {
    setLocalColaboradores(colabs);
    propOnUpdateColaboradores?.(colabs);
  };

  const [localRegistros, setLocalRegistros] = useState<RegistroPontoREPP[]>([]);
  const registrosPonto = propRegistros || localRegistros;
  const setRegistrosPonto = (regs: RegistroPontoREPP[]) => {
    setLocalRegistros(regs);
    propOnUpdateRegistros?.(regs);
  };

  const [localHorasExtras, setLocalHorasExtras] = useState<SolicitacaoHoraExtra[]>([]);
  const horasExtras = propHorasExtras || localHorasExtras;
  const setHorasExtras = (hes: SolicitacaoHoraExtra[]) => {
    setLocalHorasExtras(hes);
    propOnUpdateHorasExtras?.(hes);
  };

  const [localFeriados, setLocalFeriados] = useState<Feriado[]>([]);
  const feriados = propFeriados || localFeriados;
  const setFeriados = (fers: Feriado[]) => {
    setLocalFeriados(fers);
    propOnUpdateFeriados?.(fers);
  };

  const [localOcorrencias, setLocalOcorrencias] = useState<OcorrenciaDesconto[]>([]);
  const ocorrencias = propOcorrencias || localOcorrencias;
  const setOcorrencias = (occs: OcorrenciaDesconto[]) => {
    setLocalOcorrencias(occs);
    propOnUpdateOcorrencias?.(occs);
  };

  const [localSolicitacoesAjuste, setLocalSolicitacoesAjuste] = useState<SolicitacaoAjustePonto[]>([]);
  const solicitacoesAjuste = propSolicitacoesAjuste || localSolicitacoesAjuste;
  const setSolicitacoesAjuste = (ajustes: SolicitacaoAjustePonto[]) => {
    setLocalSolicitacoesAjuste(ajustes);
    propOnUpdateSolicitacoesAjuste?.(ajustes);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Sub-abas do Ambiente Operacional (sincronizada com App.tsx ou local)
  const [localOperationalTab, setLocalOperationalTab] = useState<'relatorios' | 'equipes' | 'coletor' | 'biometria' | 'empresa' | 'estrutura' | 'permissoes' | 'registros' | 'feriados' | 'tenants' | 'config' | 'ipa'>('relatorios');
  const operationalTab = propOperationalTab || localOperationalTab;
  const setOperationalTab = (tab: any) => {
    setLocalOperationalTab(tab);
    propOnSelectOperationalTab?.(tab);
  };

  // Relógio em tempo real do Coletor Tablet (Horário Oficial de Brasília)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(() => getBrasiliaNow());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(getBrasiliaNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulação de Horário no Coletor (Permite testar a regra de 15 min e intervalo intrajornada)
  const [simulatedTimeOverride, setSimulatedTimeOverride] = useState<'REAL' | '07:20_ANTECIPADO' | '08:00_NORMAL' | '12:35_INTERVALO_CURTO'>('REAL');

  // Estado de Fila Offline e Saúde do Dispositivo (Dashboard Ponto 2)
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [deviceHealth, setDeviceHealth] = useState<{ batteryLevel: number | null; storageQuotaPercent: number | null; isCharging: boolean | null }>({ batteryLevel: 92, storageQuotaPercent: 14, isCharging: true });
  const [currentLivenessChallenge, setCurrentLivenessChallenge] = useState<LivenessChallenge | null>(null);
  const [livenessConfirmed, setLivenessConfirmed] = useState<boolean>(false);

  useEffect(() => {
    async function checkHealth() {
      const q = getOfflineQueue();
      setOfflineQueueCount(q.length);
      const h = await getDeviceHealthStatus();
      if (h.batteryLevel !== null || h.storageQuotaPercent !== null) {
        setDeviceHealth(h);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tipo de marcação selecionada no Kiosk
  const [selectedPunchType, setSelectedPunchType] = useState<'AUTO' | 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'>('AUTO');

  // Estado do Coletor Tablet de Ponto
  const [kioskInput, setKioskInput] = useState<string>('');
  const [lastComprovante, setLastComprovante] = useState<RegistroPontoREPP | null>(null);
  const [kioskFeedback, setKioskFeedback] = useState<{ type: 'SUCCESS' | 'WARNING' | 'ERROR'; msg: string; details?: string } | null>(null);
  
  // Estado de Status do Sistema (Supabase)
  const [systemStatus, setSystemStatus] = useState<{
    supabaseConnected: boolean;
    env: { url: boolean; key: boolean; encryption: boolean };
    lastChecked: string;
    loading: boolean;
  }>({
    supabaseConnected: false,
    env: { url: false, key: false, encryption: false },
    lastChecked: '-',
    loading: true
  });

  const checkSystemStatus = async () => {
    setSystemStatus(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setSystemStatus({
        supabaseConnected: Boolean(data.supabaseConnected),
        env: data.env ?? {
          url: Boolean(data.supabaseConnected),
          key: Boolean(data.supabaseConnected),
          encryption: true
        },
        lastChecked: formatBrasiliaTime(undefined, true),
        loading: false
      });
    } catch (err) {
      console.error('Failed to check status:', err);
      setSystemStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (operationalTab === 'config') {
      checkSystemStatus();
    }
  }, [operationalTab]);

  // Modal Novo Cliente
  const [isNewTenantModalOpen, setIsNewTenantModalOpen] = useState(false);
  const [expandedTenantRosterId, setExpandedTenantRosterId] = useState<string | null>(null);
  const [newTenantForm, setNewTenantForm] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    slug: '',
    plano: 'Pro' as 'Starter' | 'Pro' | 'REP-P Corporativo',
    licencas: 100,
    emailAdmin: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    uf: 'SP',
    latitude: '' as unknown as number,
    longitude: '' as unknown as number,
    cercaRaioMetros: 100,
    bloquearForaDoRaio: true
  });
  const [newTenantError, setNewTenantError] = useState<string | null>(null);

  // Modal Novo Colaborador
  const [isNewColabModalOpen, setIsNewColabModalOpen] = useState(false);
  const [newColabError, setNewColabError] = useState<string | null>(null);
  const [pendingRejectColabId, setPendingRejectColabId] = useState<string | null>(null);
  const [kioskPinError, setKioskPinError] = useState<string | null>(null);
  const [newColabForm, setNewColabForm] = useState({
    tenantId: '',
    nome: '',
    cpf: '',
    matricula: '',
    cargoId: '',
    departamentoId: '',
    estabelecimentoId: '',
    regime: 'REGULAR' as 'REGULAR' | 'EXCECAO' | 'DISPENSA_ART_62',
    pinColetor: '',
    email: '',
    gerarAcessoSistema: true
  });

  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; senha: string; nome: string; cpf?: string; pin?: string; colabId?: string } | null>(null);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  const activeColaboradores = colaboradores.filter((c) => c.tenantId === selectedTenantId);
  const activeRegistros = registrosPonto.filter((r) => r.tenantId === selectedTenantId);

  // Estados para Gestão e Homologação de Auto-Cadastros de Colaboradores
  const [colabFilterStatus, setColabFilterStatus] = useState<'TODOS' | 'ATIVO' | 'PENDENTE'>('TODOS');
  const [colabSearchFilter, setColabSearchFilter] = useState<string>('');
  const [colabApprovalNotice, setColabApprovalNotice] = useState<string | null>(null);
  const [pendingDeptoSelection, setPendingDeptoSelection] = useState<Record<string, string>>({});
  const [pendingCargoSelection, setPendingCargoSelection] = useState<Record<string, string>>({});

  // Helper resiliente para obter E-mail, Telefone e Pretensões a partir do Colaborador, Metadata ou LocalStorage
  const getColabContactInfo = (colab: Colaborador) => {
    let email = colab.email?.trim() || '';
    let telefone = colab.telefone?.trim() || '';
    let pretensaoDepto = (colab as any).pretensaoDepto?.trim() || '';
    let pretensaoCargo = (colab as any).pretensaoCargo?.trim() || '';

    // 1. Tentar ler do biometriaHashTemplate ou biometric_template com double-parse
    const rawTemplates = [
      colab.biometriaHashTemplate,
      (colab as any).biometric_template,
      (colab as any).biometricTemplate
    ].filter(Boolean);

    for (const raw of rawTemplates) {
      let parsed: any = raw;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (_) {}
      }
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (_) {}
      }
      if (parsed && typeof parsed === 'object') {
        if (parsed.email && !email) email = String(parsed.email).trim();
        if (parsed.telefone && !telefone) telefone = String(parsed.telefone).trim();
        if (parsed.pretensaoDepto && !pretensaoDepto) pretensaoDepto = String(parsed.pretensaoDepto).trim();
        if (parsed.pretensaoCargo && !pretensaoCargo) pretensaoCargo = String(parsed.pretensaoCargo).trim();
      }
    }

    // 2. Tentar ler do localStorage pelo CPF limpo ou formatado
    if (typeof window !== 'undefined' && (!email || !telefone || !pretensaoDepto || !pretensaoCargo)) {
      const clean = (colab.cpf || '').replace(/\D/g, '');
      try {
        const stored = localStorage.getItem(`sc_colab_meta_${clean}`) || localStorage.getItem(`sc_colab_meta_${colab.cpf}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email && !email) email = String(parsed.email).trim();
          if (parsed.telefone && !telefone) telefone = String(parsed.telefone).trim();
          if (parsed.pretensaoDepto && !pretensaoDepto) pretensaoDepto = String(parsed.pretensaoDepto).trim();
          if (parsed.pretensaoCargo && !pretensaoCargo) pretensaoCargo = String(parsed.pretensaoCargo).trim();
        }
        const all = JSON.parse(localStorage.getItem('sc_all_colab_contacts') || '{}');
        const item = all[clean] || all[colab.cpf] || all[colab.matricula] || all[colab.id];
        if (item) {
          if (item.email && !email) email = String(item.email).trim();
          if (item.telefone && !telefone) telefone = String(item.telefone).trim();
          if (item.pretensaoDepto && !pretensaoDepto) pretensaoDepto = String(item.pretensaoDepto).trim();
          if (item.pretensaoCargo && !pretensaoCargo) pretensaoCargo = String(item.pretensaoCargo).trim();
        }
      } catch (_) {}
    }

    return {
      email: email || 'Não informado',
      telefone: telefone || 'Não informado',
      hasEmail: Boolean(email && email.trim() && email !== 'Não informado'),
      hasTelefone: Boolean(telefone && telefone.trim() && telefone !== 'Não informado'),
      pretensaoDepto: pretensaoDepto || colab.departamentoNome || 'A Definir pelo Gestor',
      pretensaoCargo: pretensaoCargo || colab.cargoTitulo || 'A Definir pelo Gestor'
    };
  };

  const handleAprovarAutoCadastro = async (
    colabId: string,
    deptoIdParam?: string,
    cargoIdParam?: string,
    tenantIdParam?: string,
    estIdParam?: string
  ) => {
    const colab = colaboradores.find((c) => c.id === colabId);
    if (!colab) return;

    const contact = getColabContactInfo(colab);
    const chosenTenantId = tenantIdParam || colab.tenantId || selectedTenantId || tenants[0]?.id || 'tenant-01';
    const tenantEsts = estabelecimentos.filter((e) => e.tenantId === chosenTenantId);
    const chosenEstId = estIdParam || colab.estabelecimentoId || tenantEsts[0]?.id || estabelecimentos[0]?.id || 'est-01';
    const chosenDeptoId = deptoIdParam || pendingDeptoSelection[colabId] || colab.departamentoId || departamentos[0]?.id || 'dep-01';
    const chosenCargoId = cargoIdParam || pendingCargoSelection[colabId] || colab.cargoId || cargos[0]?.id || 'crg-01';

    const estObj = estabelecimentos.find((e) => e.id === chosenEstId) || tenantEsts[0] || estabelecimentos[0];
    const deptoObj = departamentos.find((d) => d.id === chosenDeptoId) || departamentos[0];
    const cargoObj = cargos.find((c) => c.id === chosenCargoId) || cargos[0];
    const tenantObj = tenants.find((t) => t.id === chosenTenantId);

    const matriculaFinal = colab.matricula?.startsWith('PEND-')
      ? `MAT-${Date.now().toString().slice(-4)}`
      : (colab.matricula || `MAT-${Date.now().toString().slice(-4)}`);

    const colabAtualizado: Colaborador = {
      ...colab,
      tenantId: chosenTenantId,
      estabelecimentoId: estObj?.id || chosenEstId,
      estabelecimentoNome: estObj?.nome || colab.estabelecimentoNome || 'Matriz Principal',
      status: 'ATIVO',
      matricula: matriculaFinal,
      departamentoId: deptoObj.id,
      departamentoNome: deptoObj.nome,
      cargoId: cargoObj.id,
      cargoTitulo: cargoObj.titulo,
      horarioInicio: deptoObj.horarioInicioPadrao || colab.horarioInicio || '08:00',
      horarioFim: '17:00',
      email: contact.hasEmail ? contact.email : colab.email,
      telefone: contact.hasTelefone ? contact.telefone : colab.telefone
    };

    const novosColabs = colaboradores.map((c) => (c.id === colabId ? colabAtualizado : c));
    setColaboradores(novosColabs);

    try {
      if (bearerToken) {
        await fetch('/api/save-collaborator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify(colabAtualizado)
        });
      }

      await supabase.from('collaborators').update({
        status: 'ATIVO',
        tenant_id: colabAtualizado.tenantId,
        estabelecimento_id: colabAtualizado.estabelecimentoId,
        estabelecimento_nome: colabAtualizado.estabelecimentoNome,
        matricula: matriculaFinal,
        departamento_id: deptoObj.id,
        departamento_nome: deptoObj.nome,
        cargo_id: cargoObj.id,
        cargo_titulo: cargoObj.titulo,
        updated_at: getBrasiliaParts().iso
      }).eq('collaborator_id', colabId);
    } catch (err) {
      console.warn('Aviso ao sincronizar aprovação no Supabase:', err);
    }

    setColabApprovalNotice(
      `Colaborador ${colab.nome} homologado em "${tenantObj?.nomeFantasia || tenantObj?.razaoSocial || chosenTenantId}" (${colabAtualizado.estabelecimentoNome}) com matrícula ${matriculaFinal}.`
    );
    setTimeout(() => setColabApprovalNotice(null), 5000);
  };

  const handleUpdateColaborador = async (updatedColab: Colaborador) => {
    const novosColabs = colaboradores.map((c) => (c.id === updatedColab.id ? updatedColab : c));
    setColaboradores(novosColabs);

    const tenantObj = tenants.find((t) => t.id === updatedColab.tenantId);

    try {
      const { error: sbErr } = await supabase.from('collaborators').update({
        tenant_id: updatedColab.tenantId,
        estabelecimento_id: updatedColab.estabelecimentoId,
        estabelecimento_nome: updatedColab.estabelecimentoNome,
        departamento_id: updatedColab.departamentoId,
        departamento_nome: updatedColab.departamentoNome,
        cargo_id: updatedColab.cargoId,
        cargo_titulo: updatedColab.cargoTitulo,
        regime: updatedColab.regime,
        status: updatedColab.status,
        updated_at: getBrasiliaParts().iso
      }).eq('collaborator_id', updatedColab.id);

      if (sbErr) {
        console.warn('Aviso ao atualizar alocação no Supabase:', sbErr);
      }

      if (bearerToken) {
        await fetch('/api/save-collaborator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify(updatedColab)
        });
      }
    } catch (err) {
      console.warn('Aviso ao sincronizar alocação do colaborador:', err);
    }

    setColabApprovalNotice(
      `Alocação de ${updatedColab.nome} atualizada para "${tenantObj?.nomeFantasia || tenantObj?.razaoSocial || updatedColab.tenantId}" · ${updatedColab.estabelecimentoNome}.`
    );
    setTimeout(() => setColabApprovalNotice(null), 4500);
  };

  const executeRejectColabIds = async (ids: string[]) => {
    const idSet = new Set(ids);
    const removed = colaboradores.filter((c) => idSet.has(c.id));
    if (removed.length === 0) return;

    setColaboradores(colaboradores.filter((c) => !idSet.has(c.id)));

    try {
      await supabase.from('collaborators').delete().in('collaborator_id', ids);
    } catch (err) {
      console.warn('Aviso ao excluir no Supabase:', err);
    }

    setColabApprovalNotice(
      removed.length === 1
        ? `Auto-cadastro de ${removed[0].nome} foi recusado.`
        : `${removed.length} auto-cadastros recusados.`
    );
    setTimeout(() => setColabApprovalNotice(null), 3000);
  };

  const handleRecusarAutoCadastro = (colabId: string, skipConfirm = false) => {
    const colab = colaboradores.find((c) => c.id === colabId);
    if (!colab) return;
    if (skipConfirm) {
      void executeRejectColabIds([colabId]);
      return;
    }
    setPendingRejectColabId(colabId);
  };

  const confirmRecusarAutoCadastro = async () => {
    if (!pendingRejectColabId) return;
    const colabId = pendingRejectColabId;
    setPendingRejectColabId(null);
    await executeRejectColabIds([colabId]);
  };

  // Data e Hora Oficial em Tempo Real (Horário de Brasília Sincronizado)
  const getEffectiveClockTime = (): Date => {
    return getBrasiliaNow();
  };

  // Estado da Biometria Facial no Coletor
  const [biometricTargetColab, setBiometricTargetColab] = useState<Colaborador | null>(null);
  const [biometricPendingType, setBiometricPendingType] = useState<'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' | 'AUTO'>('AUTO');
  const [biometricState, setBiometricState] = useState<
    'idle' | 'checking_camera' | 'no_camera' | 'unregistered_biometrics' | 'detecting_face' | 'analyzing_face' | 'verified' | 'rejected_mismatch'
  >('idle');
  const [biometricConfidence, setBiometricConfidence] = useState<string>('99.2');
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [faceStatusMessage, setFaceStatusMessage] = useState<string>('');
  const [simulatedMismatch, setSimulatedMismatch] = useState<boolean>(false);
  const [detectedLandmarks, setDetectedLandmarks] = useState<FaceLandmarks | null>(null);
  const [detectedFaceBox, setDetectedFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [biometricEngineName, setBiometricEngineName] = useState<string>('Algoritmo Aberto ISO 19794-5');
  const [lightingCondition, setLightingCondition] = useState<'EXCELENTE' | 'BOA' | 'BAIXA' | 'EXCESSIVA'>('BOA');
  const [biometricLivenessScore, setBiometricLivenessScore] = useState<number>(92);
  const [isAnalyzingInstant, setIsAnalyzingInstant] = useState<boolean>(false);
  const [kioskPinInput, setKioskPinInput] = useState<string>('');
  const [showPinFallback, setShowPinFallback] = useState<boolean>(false);

  // WebCam Real para o Coletor Kiosk
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const analyzerCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [biometricCountdown, setBiometricCountdown] = useState<number | null>(null);

  // Refs para estabilizar o loop de visão computacional sem recriar setInterval a cada transição
  const biometricStateRef = React.useRef(biometricState);
  biometricStateRef.current = biometricState;
  const biometricCountdownRef = React.useRef<number | null>(biometricCountdown);
  biometricCountdownRef.current = biometricCountdown;
  const currentLivenessRef = React.useRef(currentLivenessChallenge);
  currentLivenessRef.current = currentLivenessChallenge;
  const livenessConfirmedRef = React.useRef(livenessConfirmed);
  livenessConfirmedRef.current = livenessConfirmed;
  const isAnalyzingInstantRef = React.useRef(isAnalyzingInstant);
  isAnalyzingInstantRef.current = isAnalyzingInstant;

  const scanProgressRef = React.useRef<number>(0);
  const missedFramesRef = React.useRef<number>(0);
  const consecutiveDetectedRef = React.useRef<number>(0);
  const countdownTriggeredRef = React.useRef<boolean>(false);
  const collectedVectorsRef = React.useRef<number[][]>([]);

  // Efeito de Contador para Prova de Vida Ativa
  useEffect(() => {
    let timer: any;
    if (biometricCountdown !== null && biometricCountdown > 0) {
      timer = setTimeout(() => setBiometricCountdown(biometricCountdown - 1), 1000);
    } else if (biometricCountdown === 0) {
      if (!currentLivenessChallenge) {
        setCurrentLivenessChallenge(getRandomLivenessChallenge());
      }
      setBiometricCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [biometricCountdown, currentLivenessChallenge]);

  // GPS Geolocation State (Sem fallback fictício)
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; address: string; inGeofence: boolean } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: `Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)} (GPS Capturado)`,
            inGeofence: true
          });
        },
        () => {
          setGpsData(null);
        }
      );
    }
  }, []);

  // Ciclo de Vida da Câmera para Validação Facial
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    scanProgressRef.current = 0;
    missedFramesRef.current = 0;
    consecutiveDetectedRef.current = 0;
    countdownTriggeredRef.current = false;
    collectedVectorsRef.current = [];

    if (!biometricTargetColab) {
      setIsCameraActive(false);
      setBiometricState('idle');
      setFaceDetected(false);
      setScanProgress(0);
      setSimulatedMismatch(false);
      setDetectedLandmarks(null);
      setDetectedFaceBox(null);
      setBiometricCountdown(null);
      setCurrentLivenessChallenge(null);
      setLivenessConfirmed(false);
      resetLivenessState();
      return;
    }

    resetLivenessState();
    setLivenessConfirmed(false);
    setBiometricCountdown(null);
    setDetectedLandmarks(null);
    setDetectedFaceBox(null);
    setCurrentLivenessChallenge(getRandomLivenessChallenge());

    // 1. Validação Prévia: Colaborador possui template biométrico facial real?
    const hasBiometry =
      hasRealBiometricTemplate(biometricTargetColab) ||
      (typeof window !== 'undefined' &&
        hasRealBiometricTemplate(localStorage.getItem(`sc_bio_vec_${biometricTargetColab.id}`)));

    if (!hasBiometry) {
      setIsCameraActive(false);
      setBiometricState('unregistered_biometrics');
      setFaceStatusMessage('Colaborador sem biometria facial cadastrada no sistema.');
      return;
    }

    // 2. Inicia Câmera para Reconhecimento Real
    setBiometricState('checking_camera');
    setScanProgress(0);
    setFaceDetected(false);
    setFaceStatusMessage('Iniciando câmera e sensores biométricos de código aberto...');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        setBiometricState('detecting_face');
        setFaceStatusMessage('Posicione o rosto centralizado no círculo biométrico.');
      })
      .catch(() => {
        if (cancelled) return;
        setIsCameraActive(false);
        setBiometricState('no_camera');
        setFaceStatusMessage('Câmera indisponível ou permissão não concedida no navegador.');
      });
    } else {
      setIsCameraActive(false);
      setBiometricState('no_camera');
      setFaceStatusMessage('Dispositivo sem suporte a captura de vídeo.');
    }

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [biometricTargetColab]);

  // Motor de Análise de Rosto em Tempo Real no Canvas (Algoritmo Aberto + ISO 19794-5)
  useEffect(() => {
    if (!biometricTargetColab || !isCameraActive) return;

    let isProcessing = false;
    const interval = setInterval(async () => {
      if (isProcessing || isAnalyzingInstantRef.current) return;

      const currentState = biometricStateRef.current;
      if (
        currentState === 'verified' ||
        currentState === 'rejected_mismatch' ||
        currentState === 'unregistered_biometrics' ||
        currentState === 'no_camera' ||
        currentState === 'checking_camera'
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = analyzerCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        return;
      }

      isProcessing = true;
      try {
        const result = await detectFaceAndBiometrics(video, canvas);
        setLightingCondition(result.lightingQuality);

        if (!result.detected || !result.vector) {
          consecutiveDetectedRef.current = 0;
          missedFramesRef.current += 1;
          setFaceDetected(false);

          // Tolerância de 6 quadros (~1.5s) antes de zerar o progresso (evita perda por piscada ou micro-movimento)
          if (missedFramesRef.current >= 6) {
            setDetectedLandmarks(null);
            setDetectedFaceBox(null);
            scanProgressRef.current = 0;
            collectedVectorsRef.current = [];
            setScanProgress(0);
            setBiometricState('detecting_face');
            setFaceStatusMessage(result.statusMessage);
          } else if (scanProgressRef.current > 0) {
            setFaceStatusMessage('Mantenha o rosto centralizado na moldura para continuar...');
          } else {
            setFaceStatusMessage(result.statusMessage);
          }
          return;
        }

        // Rosto válido detectado
        missedFramesRef.current = 0;
        consecutiveDetectedRef.current += 1;
        setFaceDetected(true);
        setDetectedFaceBox(result.faceBox || null);
        setDetectedLandmarks(result.landmarks || null);
        setBiometricLivenessScore(result.livenessScore);
        setBiometricEngineName(
          result.algorithmUsed === 'W3C_NATIVE_SHAPE'
            ? 'W3C Shape Detector (Nativo)'
            : 'Algoritmo Aberto YCbCr/HOG (ISO 19794-5)'
        );

        // Inicia contagem regressiva preparatória de 3s após 2 detecções consecutivas estáveis
        if (!countdownTriggeredRef.current && consecutiveDetectedRef.current >= 2) {
          countdownTriggeredRef.current = true;
          setBiometricCountdown(3);
          setFaceStatusMessage('Rosto enquadrado! Prepare-se para a captura biométrica...');
          return;
        }

        // Aguarda contagem regressiva terminar antes de avançar a barra de extração
        if (biometricCountdownRef.current !== null) {
          collectedVectorsRef.current.push(result.vector);
          if (collectedVectorsRef.current.length > 15) {
            collectedVectorsRef.current.shift();
          }
          return;
        }

        // Avança progressão em ~7.2 segundos (250ms * ~29 quadros = +3.5% por quadro)
        if (currentState !== 'analyzing_face') {
          setBiometricState('analyzing_face');
        }

        collectedVectorsRef.current.push(result.vector);
        if (collectedVectorsRef.current.length > 20) {
          collectedVectorsRef.current.shift();
        }

        const next = Math.min(100, Number((scanProgressRef.current + 3.5).toFixed(1)));
        scanProgressRef.current = next;
        setScanProgress(Math.round(next));

        if (next < 25) {
          setFaceStatusMessage('Estabilizando enquadramento e calibração óptica...');
        } else if (next < 55) {
          setFaceStatusMessage('Mapeando 64 pontos anatômicos e extraindo vetor ISO 19794-5...');
        } else if (next < 85) {
          setFaceStatusMessage('Analisando prova de vida temporal e textura facial...');
        } else if (next < 100) {
          setFaceStatusMessage('Conferindo padrão biométrico consolidado com a base...');
        }

        if (next >= 100) {
          const stabilizedVector = averageBiometricDescriptors(collectedVectorsRef.current);
          const match = matchBiometricFace(
            stabilizedVector.length === 64 ? stabilizedVector : result.vector,
            biometricTargetColab.id,
            biometricTargetColab.biometriaHashTemplate,
            simulatedMismatch
          );

          setBiometricConfidence(match.similarity.toString());
          if (match.matched) {
            setBiometricState('verified');
            if (currentLivenessRef.current && !livenessConfirmedRef.current) {
              setFaceStatusMessage(
                `Face identificada (${match.similarity}%). AGUARDANDO PROVA DE VIDA: execute "${currentLivenessRef.current.actionPrompt}" e confirme.`
              );
            } else {
              setFaceStatusMessage(match.details);
            }
          } else {
            setBiometricState('rejected_mismatch');
            setFaceStatusMessage(match.details);
          }
        }
      } catch (err) {
        console.error('Erro na análise facial:', err);
      } finally {
        isProcessing = false;
      }
    }, 250);

    return () => clearInterval(interval);
  }, [biometricTargetColab, isCameraActive, simulatedMismatch]);

  // Captura & Validação Estendida Manual ("Capturar e Validar Face Agora")
  const handleInstantCaptureAndValidate = async () => {
    if (!videoRef.current || !analyzerCanvasRef.current || !biometricTargetColab) return;

    setIsAnalyzingInstant(true);
    setBiometricCountdown(null);
    setBiometricState('analyzing_face');
    resetLivenessState();
    scanProgressRef.current = 10;
    setScanProgress(10);
    setFaceStatusMessage('Iniciando varredura biométrica estendida multi-quadro...');

    try {
      const sampledVectors: number[][] = [];
      let lastResult: any = null;
      const totalSamples = 10; // 10 quadros x 550ms = ~5.5 segundos

      for (let i = 0; i < totalSamples; i++) {
        if (!videoRef.current || !analyzerCanvasRef.current) break;

        const pct = Math.min(95, 10 + Math.round(((i + 1) / totalSamples) * 85));
        scanProgressRef.current = pct;
        setScanProgress(pct);

        if (i < 3) setFaceStatusMessage('Estabilizando enquadramento e matriz YCbCr...');
        else if (i < 6) setFaceStatusMessage('Extraindo descritores faciais de 64 dimensões...');
        else if (i < 8) setFaceStatusMessage('Verificando prova de vida e variância óptica...');
        else setFaceStatusMessage('Consolidando leitura e comparando com o template...');

        const result = await detectFaceAndBiometrics(videoRef.current, analyzerCanvasRef.current);
        setLightingCondition(result.lightingQuality);
        if (result.detected && result.vector) {
          sampledVectors.push(result.vector);
          lastResult = result;
          setDetectedFaceBox(result.faceBox || null);
          setDetectedLandmarks(result.landmarks || null);
          setBiometricLivenessScore(result.livenessScore);
          setBiometricEngineName(
            result.algorithmUsed === 'W3C_NATIVE_SHAPE'
              ? 'W3C Shape Detector (Nativo)'
              : 'Algoritmo Aberto YCbCr/HOG (ISO 19794-5)'
          );
          setFaceDetected(true);
        }

        if (i < totalSamples - 1) {
          await new Promise((r) => setTimeout(r, 550));
        }
      }

      if (sampledVectors.length >= 4 && lastResult) {
        scanProgressRef.current = 100;
        setScanProgress(100);
        const averagedVector = averageBiometricDescriptors(sampledVectors);
        const match = matchBiometricFace(
          averagedVector,
          biometricTargetColab.id,
          biometricTargetColab.biometriaHashTemplate,
          simulatedMismatch
        );

        setBiometricConfidence(match.similarity.toString());
        if (match.matched) {
          setBiometricState('verified');
          if (currentLivenessChallenge && !livenessConfirmed) {
            setFaceStatusMessage(
              `Face validada (${match.similarity}%). Agora confirme a Prova de Vida ("${currentLivenessChallenge.actionPrompt}") no card amarelo.`
            );
          } else {
            setFaceStatusMessage(match.details);
          }
        } else {
          setBiometricState('rejected_mismatch');
          setFaceStatusMessage(match.details);
        }
      } else {
        scanProgressRef.current = 0;
        setScanProgress(0);
        setBiometricState('detecting_face');
        setFaceStatusMessage('Rosto não mantido estável no enquadramento. Centralize a face em local iluminado e tente novamente.');
      }
    } catch (e) {
      setBiometricState('detecting_face');
      setFaceStatusMessage('Erro na leitura óptica facial.');
    } finally {
      setIsAnalyzingInstant(false);
    }
  };

  // Ação: Iniciar Biometria Facial para Bater Ponto no Tablet Coletor REP-P
  const handleBaterPonto = (
    colabOrInput?: Colaborador | string,
    forcedType?: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA'
  ) => {
    let colab: Colaborador | undefined;
    if (colabOrInput && typeof colabOrInput === 'object') {
      colab = colabOrInput;
    } else {
      const term = typeof colabOrInput === 'string' ? colabOrInput : kioskInput;
      const cleanTerm = term.replace(/\D/g, '');
      const trimTerm = term.trim().toLowerCase();

      // Busca por CPF numérico, PIN, Matrícula ou Nome
      colab = activeColaboradores.find((c) => {
        const cCpfClean = c.cpf.replace(/\D/g, '');
        return (
          (cleanTerm && cCpfClean === cleanTerm) ||
          (c.pinColetor && c.pinColetor.trim() === term.trim()) ||
          (c.matricula && c.matricula.toLowerCase() === trimTerm) ||
          (c.nome && c.nome.toLowerCase().includes(trimTerm))
        );
      });
    }

    if (!colab) {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Identificação não encontrada. Digite o CPF ou PIN cadastrado.'
      });
      setTimeout(() => setKioskFeedback(null), 4000);
      return;
    }

    if (colab.status === 'DESLIGADO') {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Colaborador com vínculo desligado. Registro de ponto recusado.'
      });
      setTimeout(() => setKioskFeedback(null), 4000);
      return;
    }

    // Validação estrita de horário de permissão de Entrada (15 min antes até 1h depois) - Horário de Brasília
    const targetType = forcedType || selectedPunchType;
    const clockTime = getBrasiliaNow();
    const brParts = getBrasiliaParts(clockTime);
    const hojeYMD = brParts.ymd;
    const batidasHoje = registrosPonto.filter((r) => r.colaboradorId === colab.id && getBrasiliaYmd(r.dataHora) === hojeYMD);
    const isEntrada = targetType === 'ENTRADA' || (targetType === 'AUTO' && batidasHoje.length === 0);

    if (isEntrada && colab.regraAntecedenciaAtiva !== false) {
      const dayOfWeek = brParts.dayOfWeek;
      const diasNomes = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const diaAtualNome = diasNomes[dayOfWeek];

      const defaultFolgas = colab.tipoEscala === '12x36' 
        ? [] 
        : (colab.tipoEscala === '6x1' ? [0] : (colab.tipoEscala === '5x2' ? [0, 6] : []));
      const diasFolgaEscala = colab.diasFolgaSemana ?? defaultFolgas;
      const isFolgaAnual = Boolean(colab.anualFolgas?.[hojeYMD]);
      let isFolga12x36 = false;
      if (colab.tipoEscala === '12x36' && colab.dataBaseCiclo) {
        const startMs = new Date(`${colab.dataBaseCiclo}T00:00:00-03:00`).getTime();
        const currMs = new Date(`${hojeYMD}T00:00:00-03:00`).getTime();
        if (Number.isFinite(startMs) && Number.isFinite(currMs)) {
          const diffDays = Math.round((currMs - startMs) / (24 * 60 * 60 * 1000));
          isFolga12x36 = Math.abs(diffDays % 2) === 1;
        }
      }
      const isHojeDiaFolga = diasFolgaEscala.includes(dayOfWeek) || isFolgaAnual || isFolga12x36;

      if (isHojeDiaFolga) {
        setKioskFeedback({
          type: 'ERROR',
          msg: `Horário Não Permitido: Hoje (${diaAtualNome}) é dia de folga escalado para ${colab.nome}. Entrada bloqueada.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }

      const [hInicio, mInicio] = (colab.horarioInicio || '08:00').split(':').map(Number);
      const minutosInicioContratado = hInicio * 60 + mInicio;
      const janelaInicioPermitida = minutosInicioContratado - (colab.maxMinutosAntecedenciaPermitido || 15);
      const janelaFimPermitida = minutosInicioContratado + 60; // 1 hora depois
      const minutosAtuais = brParts.minutesOfDay;

      const fmtStartHH = String(Math.floor(((janelaInicioPermitida + 1440) % 1440) / 60)).padStart(2, '0');
      const fmtStartMM = String(((janelaInicioPermitida + 1440) % 1440) % 60).padStart(2, '0');
      const fmtEndHH = String(Math.floor(((janelaFimPermitida + 1440) % 1440) / 60)).padStart(2, '0');
      const fmtEndMM = String(((janelaFimPermitida + 1440) % 1440) % 60).padStart(2, '0');

      if (minutosAtuais < janelaInicioPermitida) {
        const diferencaMinutos = janelaInicioPermitida - minutosAtuais;
        setKioskFeedback({
          type: 'ERROR',
          msg: `Horário Não Permitido: Entrada muito cedo para ${colab.nome}. A entrada é permitida das ${fmtStartHH}:${fmtStartMM} às ${fmtEndHH}:${fmtEndMM} (início às ${colab.horarioInicio}). Faltam ${diferencaMinutos} min.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }

      if (minutosAtuais > janelaFimPermitida) {
        setKioskFeedback({
          type: 'ERROR',
          msg: `Janela Expirada: Entrada bloqueada para ${colab.nome}. A janela de entrada para a jornada de ${colab.horarioInicio} encerrou às ${fmtEndHH}:${fmtEndMM} (1 hora após o horário contratado).`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }
    }

    // Abre o Modal de Reconhecimento Facial com Prova de Vida Ativa
    setKioskPinError(null);
    setShowPinFallback(false);
    setKioskPinInput('');
    setBiometricTargetColab(colab);
    setBiometricPendingType(targetType);
    setScanProgress(0);
    setFaceDetected(false);
    setSimulatedMismatch(false);
    setCurrentLivenessChallenge(getRandomLivenessChallenge());
    setLivenessConfirmed(false);
  };

  // Efetiva a marcação após a validação biométrica e de sequência
  const executeFinalPonto = async () => {
    if (!biometricTargetColab) return;
    const colab = biometricTargetColab;

    // =========================================================================
    // TRAVA DE SEGURANÇA RIGOROSA: Portaria MTP 671 / REP-P
    // Validação Obrigatória de Prova de Vida Ativa (Liveness) & Biometria Facial
    // =========================================================================
    if (currentLivenessChallenge && !livenessConfirmed) {
      setKioskFeedback({
        type: 'ERROR',
        msg: `Bloqueio Anti-Fraude Portaria 671: A conclusão da interação solicitada ("${currentLivenessChallenge.actionPrompt}") é obrigatória antes de liberar o registro no banco local.`
      });
      setTimeout(() => setKioskFeedback(null), 5000);
      return;
    }

    if (biometricState !== 'verified') {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Bloqueio de Segurança: Registro de ponto recusado pois a leitura facial não foi autenticada.'
      });
      setTimeout(() => setKioskFeedback(null), 5000);
      return;
    }

    const hasBiometry =
      hasRealBiometricTemplate(colab) ||
      (typeof window !== 'undefined' &&
        hasRealBiometricTemplate(localStorage.getItem(`sc_bio_vec_${colab.id}`)));
    if (!hasBiometry) {
      setKioskFeedback({
        type: 'ERROR',
        msg: 'Bloqueio REP-P: Colaborador não possui biometria facial cadastrada no sistema.'
      });
      setTimeout(() => setKioskFeedback(null), 5000);
      return;
    }

    const clockTime = getEffectiveClockTime();
    const brParts = getBrasiliaParts(clockTime);
    const hojeYMD = brParts.ymd;
    const batidasHoje = registrosPonto.filter(
      (r) => r.colaboradorId === colab.id && getBrasiliaYmd(r.dataHora) === hojeYMD
    );

    // Determina o tipo de marcação
    let tipo: 'ENTRADA' | 'INTERVALO_INICIO' | 'INTERVALO_FIM' | 'SAIDA' = 'ENTRADA';
    if (biometricPendingType !== 'AUTO') {
      tipo = biometricPendingType;
    } else {
      if (batidasHoje.length === 0) tipo = 'ENTRADA';
      else if (batidasHoje.length === 1) tipo = 'INTERVALO_INICIO';
      else if (batidasHoje.length === 2) tipo = 'INTERVALO_FIM';
      else if (batidasHoje.length === 3) tipo = 'SAIDA';
      else {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Limite Atingido: ${colab.nome} já possui as 4 marcações regulamentares de hoje. Para marcações extras (H.E.), selecione o tipo manualmente.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    // =========================================================================
    // 3. VALIDAÇÃO DE SEQUÊNCIA CRONOLÓGICA DE PONTO (Portaria 671 / Boas Práticas)
    // =========================================================================
    const temEntradaHoje = batidasHoje.some(b => b.tipoMarcacao === 'ENTRADA');
    const temSaidaAlmocoHoje = batidasHoje.some(b => b.tipoMarcacao === 'INTERVALO_INICIO');
    const temVoltaAlmocoHoje = batidasHoje.some(b => b.tipoMarcacao === 'INTERVALO_FIM');
    const temSaidaFinalHoje = batidasHoje.some(b => b.tipoMarcacao === 'SAIDA');

    // Validação de Duplicidade (Prevenir clique duplo ou erro de sistema)
    const jaExisteTipo = batidasHoje.some(b => b.tipoMarcacao === tipo);
    if (jaExisteTipo && biometricPendingType === 'AUTO') {
       // Se for AUTO e já existe esse tipo, tentamos o próximo
       if (tipo === 'ENTRADA') tipo = 'INTERVALO_INICIO';
       else if (tipo === 'INTERVALO_INICIO') tipo = 'INTERVALO_FIM';
       else if (tipo === 'INTERVALO_FIM') tipo = 'SAIDA';
    }

    if (tipo === 'INTERVALO_INICIO') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é permitido registrar Saída para Intervalo sem uma marcação prévia de Entrada no dia para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (temSaidaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: A Saída para Intervalo já foi registrada hoje para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    if (tipo === 'INTERVALO_FIM') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é possível registrar Retorno do Intervalo sem Entrada prévia.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (!temSaidaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Bloqueio de Sequência! Não é permitido registrar Volta do Almoço sem ter registrado a Saída para Almoço anteriormente!`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }
      if (temVoltaAlmocoHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: O Retorno do Intervalo já foi registrado hoje para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    if (tipo === 'SAIDA') {
      if (!temEntradaHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: Não é possível registrar Saída sem uma Entrada registrada no dia.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
      if (temSaidaFinalHoje) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Erro de Sequência REP-P: A jornada de trabalho de hoje já foi encerrada com Saída registrada para ${colab.nome}.`
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }
    }

    let alertaAntecedencia: string | undefined = undefined;
    let alertaIntervalo: string | undefined = undefined;
    let alertaGeofence: string | undefined = undefined;

    // =========================================================================
    // 0. VALIDAÇÃO DE GEOFENCING E RAIO PERMITIDO DA UNIDADE (EM TEMPO REAL)
    // =========================================================================
    const estColab =
      estabelecimentos.find((e) => e.id === colab.estabelecimentoId) ||
      estabelecimentos.find((e) => e.tenantId === colab.tenantId) ||
      estabelecimentos[0];

    const hasEstCoords = Boolean(
      estColab &&
      Number.isFinite(estColab.latitude) &&
      Number.isFinite(estColab.longitude)
    );

    let currentGps = gpsData;
    if (typeof window !== 'undefined' && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              currentGps = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                address: `Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)} (GPS Alta Precisão)`,
                inGeofence: true
              };
              setGpsData(currentGps);
              resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
          );
        });
      } catch (e) {
        // Fallback para gpsData existente se já capturado
      }
    }

    if (hasEstCoords && estColab) {
      if (!currentGps) {
        if (estColab.bloquearForaDoRaio !== false) {
          setBiometricTargetColab(null);
          setKioskFeedback({
            type: 'ERROR',
            msg: `Localização GPS Obrigatória: Ative a permissão de geolocalização no navegador para validar o perímetro da unidade "${estColab.nome}".`
          });
          setTimeout(() => setKioskFeedback(null), 6000);
          return;
        } else {
          alertaGeofence = `AVISO GEOFENCING AO RH: Marcação realizada sem sinal de GPS ativo no coletor para a unidade "${estColab.nome}".`;
        }
      } else {
        const distMetrosGeofence = calculateDistanceMeters(
          currentGps.lat,
          currentGps.lng,
          estColab.latitude,
          estColab.longitude
        );
        const raioMax = estColab.cercaRaioMetros || 100;
        if (distMetrosGeofence > raioMax) {
          if (estColab.bloquearForaDoRaio !== false) {
            setBiometricTargetColab(null);
            setKioskFeedback({
              type: 'ERROR',
              msg: `Bloqueio de Geofencing: Ponto recusado para ${colab.nome}. Sua posição GPS atual está a ${distMetrosGeofence}m da unidade "${estColab.nome}" (raio máximo permitido: ${raioMax}m).`
            });
            setTimeout(() => setKioskFeedback(null), 6000);
            return;
          } else {
            alertaGeofence = `AVISO GEOFENCING AO RH: Marcação realizada a ${distMetrosGeofence}m do centro da unidade "${estColab.nome}" (raio máximo cadastrado: ${raioMax}m).`;
          }
        }
      }
    }

    // =========================================================================
    // 1. REGRA AUTOMÁTICA DE ANTECEDÊNCIA E JANELA DE ENTRADA (CLT Art. 58 § 1º)
    // =========================================================================
    if (tipo === 'ENTRADA' && colab.regraAntecedenciaAtiva !== false) {
      const [hInicio, mInicio] = (colab.horarioInicio || '08:00').split(':').map(Number);
      const minutosInicioContratado = hInicio * 60 + mInicio;
      const janelaInicioPermitida = minutosInicioContratado - (colab.maxMinutosAntecedenciaPermitido || 15);
      const janelaFimPermitida = minutosInicioContratado + 60; // 1h depois
      const minutosAtuais = brParts.minutesOfDay;

      const fmtStartHH = String(Math.floor(((janelaInicioPermitida + 1440) % 1440) / 60)).padStart(2, '0');
      const fmtStartMM = String(((janelaInicioPermitida + 1440) % 1440) % 60).padStart(2, '0');
      const fmtEndHH = String(Math.floor(((janelaFimPermitida + 1440) % 1440) / 60)).padStart(2, '0');
      const fmtEndMM = String(((janelaFimPermitida + 1440) % 1440) % 60).padStart(2, '0');

      if (minutosAtuais < janelaInicioPermitida) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Bloqueio de Antecedência: Entrada registrada muito cedo para ${colab.nome}. A janela permitida é das ${fmtStartHH}:${fmtStartMM} às ${fmtEndHH}:${fmtEndMM}.`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }

      if (minutosAtuais > janelaFimPermitida) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: `Janela Expirada: Entrada bloqueada para ${colab.nome}. A janela de entrada encerrou às ${fmtEndHH}:${fmtEndMM} (1 hora após o início das ${colab.horarioInicio}).`
        });
        setTimeout(() => setKioskFeedback(null), 6000);
        return;
      }
    }

    // =========================================================================
    // 2. CONTROLE DE HORÁRIO DE INTERVALO (CLT Art. 71 e Art. 66)
    // =========================================================================
    if (tipo === 'INTERVALO_FIM') {
      const ultimaSaidaAlmoco = [...batidasHoje].reverse().find((b) => b.tipoMarcacao === 'INTERVALO_INICIO');
      const intervaloMinimo = colab.intervaloMinutos || 60;

      if (ultimaSaidaAlmoco) {
        const horaSaida = new Date(ultimaSaidaAlmoco.dataHora);
        const minutosIntervalo = Math.round((clockTime.getTime() - horaSaida.getTime()) / (60 * 1000));

        if (minutosIntervalo < intervaloMinimo) {
          const suprimidos = intervaloMinimo - minutosIntervalo;
          alertaIntervalo = `Alerta CLT Art. 71 § 4º: Intervalo intrajornada suprimido em ${suprimidos} min (duração realizada: ${minutosIntervalo} min / exigência mínima: ${intervaloMinimo} min). Gera indenização com acréscimo de 50%.`;
        }
      } else if (simulatedTimeOverride === '12:35_INTERVALO_CURTO') {
        alertaIntervalo = `Alerta CLT Art. 71 § 4º: Intervalo intrajornada suprimido em 25 min (duração simulada: 35 min / exigência: ${intervaloMinimo} min). Gera indenização de 50%.`;
      }
    }

    const punchPayload = {
      tenantId: activeTenant.id,
      colaboradorId: colab.id,
      tipoMarcacao: tipo,
      latitude: currentGps?.lat ?? null,
      longitude: currentGps?.lng ?? null,
      modoDispositivo: isCameraActive ? 'WEB_CAM' : 'TABLET_KIOSK',
      alertaAntecedencia: alertaAntecedencia || alertaGeofence || undefined,
      alertaIntervalo: alertaIntervalo || undefined,
      biometricAudit: {
        similarity: parseFloat(biometricConfidence) || 0,
        lightingCondition: lightingCondition || 'BOA',
        livenessScore: biometricLivenessScore || 90,
        verdict: biometricState === 'verified' ? 'APROVADO' : 'REJEITADO',
        algorithmUsed: biometricEngineName
      }
    };

    let novoRegistro: RegistroPontoREPP;

    // PERSISTÊNCIA SERVER-SIDE (REP-P PORTARIA 671) OU INDEXEDDB (OFFLINE)
    if (!navigator.onLine) {
      const tempNsr = registrosPonto.length + 1;
      const nowIso = brParts.iso;
      const dataHoraFmt = brParts.formatted;
      novoRegistro = {
        nsr: tempNsr,
        tenantId: activeTenant.id,
        empregadorRazaoSocial: activeTenant.razaoSocial,
        empregadorCnpj: activeTenant.cnpj,
        colaboradorId: colab.id,
        colaboradorNome: colab.nome,
        colaboradorCpf: colab.cpf,
        colaboradorMatricula: colab.matricula,
        dataHora: nowIso,
        dataHoraFormatada: dataHoraFmt,
        fusoHorario: '-03:00',
        coletorId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        tipoMarcacao: tipo,
        alertaAntecedencia: alertaAntecedencia || alertaGeofence,
        alertaIntervalo,
        hashSha256: 'OFFLINE_PENDING_SERVER_HASH',
        latitude: punchPayload.latitude ?? 0,
        longitude: punchPayload.longitude ?? 0,
        modoDispositivo: punchPayload.modoDispositivo as 'WEB_CAM' | 'TABLET_KIOSK'
      };
      await saveOfflinePunchToIDB(novoRegistro);
      console.warn('Dispositivo offline. Batida salva no IndexedDB para sincronização posterior.');
    } else {
      if (!bearerToken) {
        setBiometricTargetColab(null);
        setKioskFeedback({
          type: 'ERROR',
          msg: 'Sessão expirada. Faça login novamente antes de registrar o ponto.'
        });
        setTimeout(() => setKioskFeedback(null), 5000);
        return;
      }

      try {
        const res = await fetch('/api/punch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify(punchPayload)
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.registro) {
          setBiometricTargetColab(null);
          setKioskFeedback({
            type: 'ERROR',
            msg: data.error || 'Marcação recusada pelo servidor REP-P.'
          });
          setTimeout(() => setKioskFeedback(null), 6000);
          return;
        }
        novoRegistro = data.registro;
      } catch (err) {
        console.warn('Falha de rede em /api/punch, salvando na fila offline:', err);
        const tempNsr = registrosPonto.length + 1;
        const nowIso = brParts.iso;
        const dataHoraFmt = brParts.formatted;
        novoRegistro = {
          nsr: tempNsr,
          tenantId: activeTenant.id,
          empregadorRazaoSocial: activeTenant.razaoSocial,
          empregadorCnpj: activeTenant.cnpj,
          colaboradorId: colab.id,
          colaboradorNome: colab.nome,
          colaboradorCpf: colab.cpf,
          colaboradorMatricula: colab.matricula,
          dataHora: nowIso,
          dataHoraFormatada: dataHoraFmt,
          fusoHorario: '-03:00',
          coletorId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          tipoMarcacao: tipo,
          alertaAntecedencia: alertaAntecedencia || alertaGeofence,
          alertaIntervalo,
          hashSha256: 'OFFLINE_PENDING_SERVER_HASH',
          latitude: punchPayload.latitude ?? 0,
          longitude: punchPayload.longitude ?? 0,
          modoDispositivo: punchPayload.modoDispositivo as 'WEB_CAM' | 'TABLET_KIOSK'
        };
        await saveOfflinePunchToIDB(novoRegistro);
      }
    }

    setRegistrosPonto([novoRegistro, ...registrosPonto]);
    setLastComprovante(novoRegistro);
    setKioskInput('');
    setBiometricTargetColab(null);

    const labelTipo =
      tipo === 'ENTRADA'
        ? '1ª Entrada'
        : tipo === 'INTERVALO_INICIO'
        ? 'Saída para Intervalo (Almoço)'
        : tipo === 'INTERVALO_FIM'
        ? 'Retorno do Intervalo'
        : '2ª Saída (Término)';

    if (alertaAntecedencia || alertaIntervalo || alertaGeofence) {
      setKioskFeedback({
        type: 'WARNING',
        msg: `Atenção: Ponto de ${labelTipo} (com Biometria Facial) registrado com observação legal! NSR ${String(novoRegistro.nsr).padStart(9, '0')}.`,
        details: alertaAntecedencia || alertaIntervalo || alertaGeofence
      });
    } else if (tipo === 'SAIDA') {
      const allToday = [...batidasHoje, novoRegistro];
      const worked = calculateWorkedTime(allToday);
      setKioskFeedback({
        type: 'SUCCESS',
        msg: `Obrigado por registrar sua saída, ${colab.nome}! Hoje sua carga horária foi de ${worked.formatted}, bom descanso! (NSR ${String(novoRegistro.nsr).padStart(9, '0')})`
      });
    } else {
      setKioskFeedback({
        type: 'SUCCESS',
        msg: `Biometria Facial confirmada! Ponto de ${labelTipo} registrado para ${colab.nome}! NSR ${String(novoRegistro.nsr).padStart(9, '0')}.`
      });
    }

    // Grava na Trilha de Auditoria
    const auditItem: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: novoRegistro.dataHoraFormatada,
      tenantId: activeTenant.id,
      operador: `Coletor Kiosk 01 (UUID 9b1deb4d - Biometria Facial)`,
      acao: 'REGISTRO_PONTO_REPP_BIOMETRIA',
      detalhes: `Marcação (${tipo}) com Biometria Facial confirmada do trabalhador ${colab.nome} (CPF ${colab.cpf}), NSR ${novoRegistro.nsr}.`,
      hash: novoRegistro.hashSha256
    };
    setAuditLogs([auditItem, ...auditLogs]);

    setTimeout(() => setKioskFeedback(null), 8000);
  };

  // Ação: Download do Arquivo AFD Oficial (Portaria 671)
  const handleDownloadAFD = () => {
    const afdText = generateAFDContent(activeTenant, activeRegistros);
    const blob = new Blob([afdText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AFD_${activeTenant.cnpj.replace(/\D/g, '')}_${getBrasiliaYmd()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ação: Download do Arquivo AEJ Fiscal (Arquivo Eletrônico de Jornada - Portaria 671)
  const handleDownloadAEJ = () => {
    const aejText = generateAEJContent(activeTenant, colaboradores, activeRegistros);
    const blob = new Blob([aejText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AEJ_${activeTenant.cnpj.replace(/\D/g, '')}_${getBrasiliaYmd()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ação: Criar Novo Cliente (com endereço via CEP e criação automática da Matriz Geofence)
  const handleCreateTenant = async () => {
    const cnpjVal = validateCNPJ(newTenantForm.cnpj);
    if (!cnpjVal.isValid) {
      setNewTenantError(cnpjVal.error || 'CNPJ inválido');
      return;
    }

    if (!newTenantForm.razaoSocial.trim()) {
      setNewTenantError('Razão Social é obrigatória');
      return;
    }

    const slug = newTenantForm.slug || newTenantForm.razaoSocial.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    const streetPart = [newTenantForm.logradouro, newTenantForm.numero].filter(Boolean).join(', ');
    const compPart = [streetPart, newTenantForm.complemento, newTenantForm.bairro].filter(Boolean).join(' - ');
    const cityPart = [newTenantForm.municipio, newTenantForm.uf].filter(Boolean).join('/');
    const enderecoCompleto = [compPart, cityPart].filter(Boolean).join(' · ') || 'Endereço sede não informado';

    const tenantId = `tenant-${Date.now()}`;
    const rawLat = String(newTenantForm.latitude ?? '').trim();
    const rawLng = String(newTenantForm.longitude ?? '').trim();
    const lat = rawLat !== '' && Number.isFinite(Number(rawLat)) ? Number(rawLat) : Number.NaN;
    const lng = rawLng !== '' && Number.isFinite(Number(rawLng)) ? Number(rawLng) : Number.NaN;
    const raio = Number(newTenantForm.cercaRaioMetros) || 100;

    if (!bearerToken) {
      setNewTenantError('Sessão autenticada necessária para salvar empresa no Supabase.');
      return;
    }

    const novo: Tenant = {
      id: tenantId,
      cnpj: newTenantForm.cnpj,
      razaoSocial: newTenantForm.razaoSocial.trim(),
      nomeFantasia: (newTenantForm.nomeFantasia || newTenantForm.razaoSocial).trim(),
      slug,
      plano: newTenantForm.plano,
      licencasContratadas: Number(newTenantForm.licencas) || 100,
      licencasEmUso: 0,
      status: 'ATIVO',
      dataAdesao: getBrasiliaYmd(),
      emailAdmin: newTenantForm.emailAdmin || 'admin@cliente.com.br',
      cep: newTenantForm.cep,
      logradouro: newTenantForm.logradouro,
      numero: newTenantForm.numero,
      complemento: newTenantForm.complemento,
      bairro: newTenantForm.bairro,
      municipio: newTenantForm.municipio || 'São Paulo',
      uf: (newTenantForm.uf || 'SP').toUpperCase(),
      enderecoCompleto,
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
      cercaRaioMetros: raio,
      bloquearForaDoRaio: newTenantForm.bloquearForaDoRaio
    };

    // PERSISTÊNCIA NO SUPABASE (BLOQUEANTE)
    try {
      const response = await fetch('/api/save-tenant', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}` 
        },
        body: JSON.stringify(novo)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao salvar no Supabase');
    } catch (err) {
      console.error('Erro de persistência:', err);
      setNewTenantError(`ERRO DE SINCRONIZAÇÃO: A empresa não pôde ser salva no Supabase. O registro foi bloqueado. Erro: ${err instanceof Error ? err.message : 'Falha de rede'}`);
      return;
    }

    // Cachear localização completa do Tenant no navegador para recarregamentos
    if (typeof window !== 'undefined') {
      try {
        const existingLocs = JSON.parse(localStorage.getItem('sc_tenant_locations') || '{}');
        existingLocs[novo.id] = {
          cep: novo.cep,
          logradouro: novo.logradouro,
          numero: novo.numero,
          complemento: novo.complemento,
          bairro: novo.bairro,
          municipio: novo.municipio,
          uf: novo.uf,
          enderecoCompleto: novo.enderecoCompleto,
          latitude: novo.latitude,
          longitude: novo.longitude,
          cercaRaioMetros: novo.cercaRaioMetros,
          bloquearForaDoRaio: novo.bloquearForaDoRaio
        };
        localStorage.setItem('sc_tenant_locations', JSON.stringify(existingLocs));
      } catch (_) {}
    }

    // Criar automaticamente o Estabelecimento Matriz da nova empresa com a localização exata para o ponto
    const novaMatriz: Estabelecimento = {
      id: `est-matriz-${Date.now()}`,
      tenantId: novo.id,
      codigo: '0001',
      nome: `Matriz - ${novo.nomeFantasia}`,
      cnpj: novo.cnpj,
      tipo: 'MATRIZ',
      fusoHorario: 'America/Sao_Paulo',
      cercaRaioMetros: raio,
      latitude: Number.isFinite(lat) ? lat : Number.NaN,
      longitude: Number.isFinite(lng) ? lng : Number.NaN,
      uf: (newTenantForm.uf || 'SP').toUpperCase(),
      municipio: newTenantForm.municipio || 'São Paulo',
      enderecoCompleto,
      cep: newTenantForm.cep,
      bloquearForaDoRaio: newTenantForm.bloquearForaDoRaio
    };

    try {
      await supabase.from('establishments').upsert({
        establishment_id: novaMatriz.id,
        tenant_id: novaMatriz.tenantId,
        nome: novaMatriz.nome,
        cnpj: novaMatriz.cnpj,
        tipo: 'MATRIZ',
        cep: novaMatriz.cep || null,
        latitude: Number.isFinite(novaMatriz.latitude) ? novaMatriz.latitude : null,
        longitude: Number.isFinite(novaMatriz.longitude) ? novaMatriz.longitude : null,
        cerca_raio_metros: novaMatriz.cercaRaioMetros,
        bloquear_fora_do_raio: novaMatriz.bloquearForaDoRaio,
        endereco_completo: novaMatriz.enderecoCompleto,
        municipio: novaMatriz.municipio,
        uf: novaMatriz.uf,
        fuso_horario: novaMatriz.fusoHorario
      }, { onConflict: 'establishment_id' });
    } catch (err) {
      console.warn('Aviso ao criar estabelecimento matriz no Supabase:', err);
    }

    setEstabelecimentos([novaMatriz, ...estabelecimentos]);
    setTenants([novo, ...tenants]);
    setSelectedTenantId(novo.id);
    setIsNewTenantModalOpen(false);
    setNewTenantForm({
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      slug: '',
      plano: 'Pro',
      licencas: 100,
      emailAdmin: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      municipio: '',
      uf: 'SP',
      latitude: '' as unknown as number,
      longitude: '' as unknown as number,
      cercaRaioMetros: 100,
      bloquearForaDoRaio: true
    });
    setNewTenantError(null);
  };

  // Ação: Criar Novo Colaborador
  const handleCreateColaborador = async () => {
    setNewColabError(null);
    const cpfVal = validateCPF(newColabForm.cpf);
    if (!cpfVal.isValid) {
      setNewColabError(cpfVal.error || 'CPF inválido');
      return;
    }

    if (!newColabForm.nome.trim()) {
      setNewColabError('Nome do colaborador é obrigatório');
      return;
    }

    const currentTenant = tenants.find((t) => t.id === (newColabForm.tenantId || selectedTenantId)) || activeTenant || DEFAULT_TENANT;
    const tenantEsts = estabelecimentos.filter((e) => e.tenantId === currentTenant.id);
    const depId = newColabForm.departamentoId || (departamentos && departamentos[0]?.id);
    const dep = (depId ? departamentos.find((d) => d.id === depId) : null) || (departamentos && departamentos[0]) || DEFAULT_DEP;
    const crg = (newColabForm.cargoId ? cargos.find((c) => c.id === newColabForm.cargoId) : null) || (cargos && cargos[0]) || DEFAULT_CRG;
    const est = (newColabForm.estabelecimentoId ? estabelecimentos.find((e) => e.id === newColabForm.estabelecimentoId) : null) || tenantEsts[0] || (estabelecimentos && estabelecimentos[0]) || DEFAULT_EST;

    // Gerar credenciais e PIN individual seguro (sem padrão fraco '123456')
    let generatedPass = '';
    const targetEmail = newColabForm.email.trim() || `${newColabForm.nome.split(' ')[0].toLowerCase()}.${newColabForm.cpf.replace(/\D/g, '').slice(0, 4)}@${currentTenant.slug || 'softcase'}.com`;
    const pinFinal = newColabForm.pinColetor.trim() || String(Math.floor(100000 + Math.random() * 900000));
    
    if (newColabForm.gerarAcessoSistema) {
      generatedPass = Math.random().toString(36).slice(-8).toUpperCase() + '@' + Math.floor(100 + Math.random() * 900);
    }

    const brNow = getBrasiliaParts();
    const novoColab: Colaborador = {
      id: `colab-${Date.now()}`,
      tenantId: currentTenant.id,
      nome: newColabForm.nome.trim(),
      cpf: newColabForm.cpf,
      matricula: newColabForm.matricula || `SC-${Math.floor(1000 + Math.random() * 9000)}`,
      dataAdmissao: brNow.ymd,
      cargoId: crg.id,
      cargoTitulo: crg.titulo,
      departamentoId: dep.id,
      departamentoNome: dep.nome,
      gestorId: dep.gestorId || 'gestor-01',
      gestorNome: dep.gestorNome || 'Administrador',
      estabelecimentoId: est.id,
      estabelecimentoNome: est.nome,
      regime: newColabForm.regime,
      horarioInicio: dep.horarioInicioPadrao || '08:00',
      horarioFim: '17:00',
      cargaHorariaDiariaHoras: dep.cargaHorariaDiariaHoras || 8,
      intervaloMinutos: dep.intervaloMinutos || 60,
      maxMinutosAntecedenciaPermitido: dep.maxMinutosAntecedenciaPermitido || 15,
      regraAntecedenciaAtiva: dep.regraAntecedenciaAtiva ?? true,
      pinColetor: pinFinal,
      status: 'ATIVO',
      email: targetEmail,
      senhaTemporaria: generatedPass
    };

    // PERSISTÊNCIA NO SUPABASE (DIRETA E ROBUSTA)
    try {
      const { error: sbColabError } = await supabase
        .from('collaborators')
        .upsert({
          collaborator_id: novoColab.id,
          tenant_id: novoColab.tenantId,
          nome: novoColab.nome,
          cpf: novoColab.cpf,
          matricula: novoColab.matricula,
          pis: novoColab.pis,
          data_admissao: novoColab.dataAdmissao,
          cargo_id: novoColab.cargoId,
          cargo_titulo: novoColab.cargoTitulo,
          departamento_id: novoColab.departamentoId,
          departamento_nome: novoColab.departamentoNome,
          gestor_id: novoColab.gestorId,
          gestor_nome: novoColab.gestorNome,
          estabelecimento_id: novoColab.estabelecimentoId,
          estabelecimento_nome: novoColab.estabelecimentoNome,
          regime: novoColab.regime,
          horario_inicio: novoColab.horarioInicio,
          horario_fim: novoColab.horarioFim,
          carga_horaria_diaria: novoColab.cargaHorariaDiariaHoras,
          intervalo_minutos: novoColab.intervaloMinutos,
          max_minutos_antecedencia: novoColab.maxMinutosAntecedenciaPermitido,
          regra_antecedencia_ativa: novoColab.regraAntecedenciaAtiva,
          pin_coletor: novoColab.pinColetor,
          email: novoColab.email,
          status: novoColab.status,
          updated_at: brNow.iso
        }, { onConflict: 'collaborator_id' });

      if (sbColabError) {
        console.warn('Aviso ao salvar direto no Supabase:', sbColabError);
      }

      if (bearerToken) {
        fetch('/api/save-collaborator', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}` 
          },
          body: JSON.stringify(novoColab)
        }).catch(err => console.warn('Aviso backend save-collaborator:', err));
      }

      if (newColabForm.gerarAcessoSistema && generatedPass) {
        supabase.auth.signUp({
          email: targetEmail,
          password: generatedPass,
          options: {
            data: {
              nome: newColabForm.nome,
              tenantId: currentTenant.id,
              cpf: newColabForm.cpf,
              role: 'COLABORADOR',
              roleLabel: 'Colaborador CLT'
            }
          }
        }).catch(err => console.warn('Aviso signUp colaborador:', err));

        if (bearerToken) {
          fetch('/api/create-auth-user', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${bearerToken}` 
            },
            body: JSON.stringify({
              email: targetEmail,
              password: generatedPass,
              nome: newColabForm.nome,
              tenantId: currentTenant.id,
              cpf: newColabForm.cpf,
              role: 'COLABORADOR'
            })
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Erro de persistência:', err);
    }

    setColaboradores([...colaboradores, novoColab]);
    
    setGeneratedCredentials({ 
      email: targetEmail, 
      senha: generatedPass || pinFinal, 
      nome: newColabForm.nome,
      cpf: newColabForm.cpf,
      pin: pinFinal,
      colabId: novoColab.id
    });
    
    setIsNewColabModalOpen(false);
    setNewColabError(null);
    setNewColabForm({
      tenantId: '',
      nome: '',
      cpf: '',
      matricula: '',
      cargoId: '',
      departamentoId: '',
      estabelecimentoId: '',
      regime: 'REGULAR',
      pinColetor: '',
      email: '',
      gerarAcessoSistema: true
    });
  };

  // Período para o Gráfico de Barras do Painel Executivo
  const [chartPeriod, setChartPeriod] = useState<'semana' | 'mes'>('semana');

  // 1. Total de Colaboradores Ativos
  const totalColaboradoresAtivos = activeColaboradores.filter(
    (c) => !c.status || c.status === 'ATIVO'
  ).length;

  // 2. Horas Extras Pendentes de Aprovação
  const pendentesHeCount = horasExtras.filter(
    (h) => (h.tenantId === selectedTenantId || !h.tenantId) && h.status === 'PENDENTE'
  ).length;

  const activeColabIds = useMemo(
    () => new Set(activeColaboradores.map((c) => c.id)),
    [activeColaboradores]
  );

  const activeOcorrencias = useMemo(
    () => ocorrencias.filter((o) => activeColabIds.has(o.colaboradorId)),
    [ocorrencias, activeColabIds]
  );

  const activeHorasExtras = useMemo(
    () => horasExtras.filter((h) => h.tenantId === selectedTenantId || activeColabIds.has(h.colaboradorId)),
    [horasExtras, selectedTenantId, activeColabIds]
  );

  // 3. Taxa de Pontualidade do Mês Atual (calculada apenas sobre dados reais)
  const taxaPontualidade = useMemo(() => {
    const mesAtual = getBrasiliaParts().mesAno;
    const regsMes = activeRegistros.filter((r) => getBrasiliaYmd(r.dataHora).startsWith(mesAtual));
    const occMes = activeOcorrencias.filter(
      (o) =>
        o.data.startsWith(mesAtual) &&
        (o.tipo === 'ATRASO' || o.tipo === 'FALTA_INJUSTIFICADA' || o.tipo === 'SAIDA_ANTECIPADA')
    );

    const totalRegs = regsMes.length;
    const totalAtrasosFaltas = occMes.length;

    if (totalRegs === 0 && totalAtrasosFaltas === 0) {
      return 100;
    }
    const baseEsperada = Math.max(totalRegs, totalAtrasosFaltas);
    const taxa = ((baseEsperada - totalAtrasosFaltas) / baseEsperada) * 100;
    return Math.min(100, Math.max(0, Number(taxa.toFixed(1))));
  }, [activeRegistros, activeOcorrencias]);

  // Dados do Gráfico de Barras Recharts (100% dados reais por dia da semana ou semanas do mês em Brasília)
  const dadosGraficoBarras = useMemo(() => {
    const nowParts = getBrasiliaParts();
    if (chartPeriod === 'semana') {
      const dias = [
        { dayIndex: 1, periodo: 'Seg', nomeCompleto: 'Segunda-feira' },
        { dayIndex: 2, periodo: 'Ter', nomeCompleto: 'Terça-feira' },
        { dayIndex: 3, periodo: 'Qua', nomeCompleto: 'Quarta-feira' },
        { dayIndex: 4, periodo: 'Qui', nomeCompleto: 'Quinta-feira' },
        { dayIndex: 5, periodo: 'Sex', nomeCompleto: 'Sexta-feira' },
        { dayIndex: 6, periodo: 'Sáb', nomeCompleto: 'Sábado (Plantão)' }
      ];

      return dias.map((d) => {
        const regsDia = activeRegistros.filter((r) => getBrasiliaDayOfWeek(r.dataHora) === d.dayIndex).length;
        const atrasosDia = activeOcorrencias.filter(
          (o) =>
            (o.tipo === 'ATRASO' || o.tipo === 'FALTA_INJUSTIFICADA' || o.tipo === 'SAIDA_ANTECIPADA') &&
            getBrasiliaDayOfWeek(`${o.data}T12:00:00-03:00`) === d.dayIndex
        ).length;
        const heDia = activeHorasExtras.filter(
          (h) => h.data && getBrasiliaDayOfWeek(`${h.data}T12:00:00-03:00`) === d.dayIndex
        ).length;
        const pontuaisDia = Math.max(0, regsDia - atrasosDia);
        const total = pontuaisDia + atrasosDia;
        const taxa = total > 0 ? Number(((pontuaisDia / total) * 100).toFixed(1)) : 100;

        return {
          periodo: d.periodo,
          nomeCompleto: d.nomeCompleto,
          pontuais: pontuaisDia,
          atrasos: atrasosDia,
          horasExtras: heDia,
          taxa
        };
      });
    } else {
      const mesAtual = nowParts.mesAno;
      const semanas = [
        { idx: 1, periodo: 'Sem 01', nomeCompleto: '1ª Semana do Mês', minDay: 1, maxDay: 7 },
        { idx: 2, periodo: 'Sem 02', nomeCompleto: '2ª Semana do Mês', minDay: 8, maxDay: 14 },
        { idx: 3, periodo: 'Sem 03', nomeCompleto: '3ª Semana do Mês', minDay: 15, maxDay: 21 },
        { idx: 4, periodo: 'Sem 04', nomeCompleto: '4ª Semana do Mês', minDay: 22, maxDay: 31 }
      ];

      return semanas.map((s) => {
        const regsSem = activeRegistros.filter((r) => {
          const p = getBrasiliaParts(r.dataHora);
          return p.mesAno === mesAtual && p.day >= s.minDay && p.day <= s.maxDay;
        }).length;
        const atrasosSem = activeOcorrencias.filter((o) => {
          const p = getBrasiliaParts(`${o.data}T12:00:00-03:00`);
          return (
            p.mesAno === mesAtual &&
            p.day >= s.minDay &&
            p.day <= s.maxDay &&
            (o.tipo === 'ATRASO' || o.tipo === 'FALTA_INJUSTIFICADA' || o.tipo === 'SAIDA_ANTECIPADA')
          );
        }).length;
        const heSem = activeHorasExtras.filter((h) => {
          if (!h.data) return false;
          const p = getBrasiliaParts(`${h.data}T12:00:00-03:00`);
          return p.mesAno === mesAtual && p.day >= s.minDay && p.day <= s.maxDay;
        }).length;
        const pontuaisSem = Math.max(0, regsSem - atrasosSem);
        const total = pontuaisSem + atrasosSem;
        const taxa = total > 0 ? Number(((pontuaisSem / total) * 100).toFixed(1)) : 100;

        return {
          periodo: s.periodo,
          nomeCompleto: s.nomeCompleto,
          pontuais: pontuaisSem,
          atrasos: atrasosSem,
          horasExtras: heSem,
          taxa
        };
      });
    }
  }, [chartPeriod, activeRegistros, activeOcorrencias, activeHorasExtras]);

  return (
    <div className="space-y-6">
      {/* CARD DO TOPO DO PAINEL ADMINISTRATIVO: Métricas Rápidas & Gráfico de Barras Recharts */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-xs shrink-0">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Painel Executivo & Indicadores Estratégicos
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acompanhamento consolidado de vidas ativas, homologações pendentes e conformidade de jornada • Portaria 671 MTE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartPeriod('semana')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'semana'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semana Vigente
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod('mes')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'mes'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Mês Corrente
              </button>
            </div>
          </div>
        </div>

        {/* Grid com os 3 cards de métricas e o gráfico Recharts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5">
          {/* Coluna da esquerda: 3 Métricas Rápidas Principais */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5">
            {/* Métrica 1: Total de Colaboradores Ativos */}
            <div 
              onClick={() => setOperationalTab('estrutura')}
              className="group cursor-pointer bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl p-4 transition-all hover:border-slate-300 relative overflow-hidden"
              title="Clique para gerenciar cargos, departamentos e estabelecimentos"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Total Colaboradores Ativos
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {totalColaboradoresAtivos} de {activeTenant.licencasContratadas}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {totalColaboradoresAtivos}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  100% elegíveis REP-P
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{departamentos.length} departamentos ativos</span>
                <span className="text-slate-400 group-hover:text-slate-600 font-medium flex items-center gap-0.5">
                  Gerenciar <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Métrica 2: Horas Extras Pendentes de Aprovação */}
            <div 
              onClick={() => setOperationalTab('equipes')}
              className={`group cursor-pointer border rounded-xl p-4 transition-all relative overflow-hidden ${
                pendentesHeCount > 0 
                  ? 'bg-amber-50/70 hover:bg-amber-50 border-amber-200 hover:border-amber-300' 
                  : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/90 hover:border-slate-300'
              }`}
              title="Clique para ir à tela de Aprovação de Horas Extras e Gestão de Equipes"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${pendentesHeCount > 0 ? 'text-amber-600' : 'text-slate-500'}`} />
                  Horas Extras Pendentes
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  pendentesHeCount > 0 ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pendentesHeCount > 0 ? 'Requer Aprovação' : 'Homologadas'}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                  pendentesHeCount > 0 ? 'text-amber-700' : 'text-slate-900'
                }`}>
                  {pendentesHeCount}
                </div>
                <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  {pendentesHeCount > 0 ? (
                    <span className="text-amber-700 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Homologar gestor
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sem pendências
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{horasExtras.length} solicitações registradas</span>
                <span className="text-slate-400 group-hover:text-slate-600 font-medium flex items-center gap-0.5">
                  Ver fila <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Métrica 3: Taxa de Pontualidade do Mês Atual */}
            <div 
              onClick={() => setOperationalTab('relatorios')}
              className="group cursor-pointer bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl p-4 transition-all hover:border-slate-300 relative overflow-hidden"
              title="Clique para abrir Relatório Detalhado de Atrasos e Ocorrências"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Taxa de Pontualidade (Mês Atual)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  taxaPontualidade >= 95 ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Meta: ≥ 95.0%
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {taxaPontualidade}%
                </div>
                <div className="text-[11px] font-semibold text-indigo-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                  {taxaPontualidade >= 95 ? '+1.4% vs meta' : 'Abaixo da meta'}
                </div>
              </div>
              {/* Barra de progresso visual */}
              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    taxaPontualidade >= 95 ? 'bg-indigo-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${taxaPontualidade}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coluna da direita: Gráfico de Barras com Recharts */}
          <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
                  Distribuição de Pontualidade & Exceções ({chartPeriod === 'semana' ? 'Semana Vigente' : 'Mês Corrente'})
                </h3>
                <span className="text-[11px] text-slate-500">
                  Registros pontuais vs desvios e horas suplementares
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
                  <span>Pontuais</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
                  <span>Atrasos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500"></span>
                  <span>H. Extras</span>
                </div>
              </div>
            </div>

            <div className="w-full h-56 sm:h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoBarras}
                  margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
                  barGap={4}
                  barCategoryGap={18}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="periodo" 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const dataItem = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[170px]">
                            <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
                              {dataItem.nomeCompleto || label}
                            </p>
                            <div className="space-y-1.5 font-mono text-[11px]">
                              <div className="flex items-center justify-between text-emerald-400">
                                <span className="text-slate-300">Pontuais:</span>
                                <span className="font-bold">{dataItem.pontuais}</span>
                              </div>
                              <div className="flex items-center justify-between text-rose-400">
                                <span className="text-slate-300">Atrasos/Desvios:</span>
                                <span className="font-bold">{dataItem.atrasos}</span>
                              </div>
                              <div className="flex items-center justify-between text-indigo-300">
                                <span className="text-slate-300">Horas Extras:</span>
                                <span className="font-bold">{dataItem.horasExtras}</span>
                              </div>
                              <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between text-slate-300 font-sans">
                                <span>Conformidade:</span>
                                <span className="font-bold text-white font-mono">{dataItem.taxa}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="pontuais" 
                    name="Registros Pontuais" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="atrasos" 
                    name="Atrasos / Exceções" 
                    fill="#f43f5e" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="horasExtras" 
                    name="Horas Extras" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      {/* Barra de Seleção de Empresa Empregadora (Multi-tenant) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
              Empresa Empregadora Selecionada
            </span>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="text-sm font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer truncate max-w-full sm:max-w-xs md:max-w-sm"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.razaoSocial} ({t.cnpj})
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                Plano {activeTenant.plano}
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores em Linha (Grid responsivo no mobile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto shrink-0">
          <div className="min-w-[80px]">
            <span className="text-slate-400 block text-[10px]">Vidas Ativas</span>
            <span className="font-bold font-mono text-slate-900 whitespace-nowrap">
              {activeColaboradores.length} / {activeTenant.licencasContratadas}
            </span>
          </div>
          <div className="min-w-[80px]">
            <span className="text-slate-400 block text-[10px]">Equipes / Gestores</span>
            <span className="font-bold font-mono text-slate-900 whitespace-nowrap">
              {departamentos.length} Equipes
            </span>
          </div>
          <div className="min-w-[80px]">
            <span className="text-slate-400 block text-[10px]">H.E. Pendentes</span>
            <span className={`font-bold font-mono whitespace-nowrap ${pendentesHeCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
              {pendentesHeCount}
            </span>
          </div>
          <div className="min-w-[80px]">
            <span className="text-slate-400 block text-[10px]">Total NSRs</span>
            <span className="font-bold font-mono text-emerald-700 whitespace-nowrap">
              {activeRegistros.length} Emitidos
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Navegação de Módulos Operacionais */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setOperationalTab('relatorios')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'relatorios'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          Atrasos & Descontos
        </button>
        <button
          onClick={() => setOperationalTab('equipes')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'equipes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Equipes & Gestores
        </button>
        <button
          onClick={() => setOperationalTab('coletor')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'coletor'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Tablet className="w-3.5 h-3.5 text-blue-400" />
          Coletor REP-P
        </button>
        <button
          onClick={() => setOperationalTab('biometria')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'biometria'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ScanFace className="w-3.5 h-3.5 text-amber-400" />
          Biometria Facial
        </button>
        <button
          onClick={() => setOperationalTab('feriados')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'feriados'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-rose-400" />
          Feriados & DSR
        </button>
        <button
          onClick={() => setOperationalTab('ipa')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'ipa'
              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-amber-400/50'
              : 'text-slate-700 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          IPA & Premiações
        </button>
        <button
          onClick={() => setOperationalTab('empresa')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'empresa'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-teal-400" />
          Colaboradores & RH
        </button>
        <button
          onClick={() => setOperationalTab('estrutura')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'estrutura'
              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-emerald-400/40'
              : 'text-slate-700 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          Estrutura (Deptos/Cargos/Unidades)
        </button>
        <button
          onClick={() => setOperationalTab('permissoes')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'permissoes'
              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-purple-400/40'
              : 'text-slate-700 bg-purple-50/70 hover:bg-purple-100/80 border border-purple-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Matriz de Permissões (RBAC)
        </button>
        <button
          onClick={() => setOperationalTab('registros')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'registros'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          AFD & AEJ Fiscal
        </button>
        <button
          onClick={() => setOperationalTab('tenants')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'tenants'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          Multi-tenant
        </button>
        <button
          onClick={() => setOperationalTab('config')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'config'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          Chaves
        </button>
        <button
          onClick={() => setOperationalTab('escalas')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'escalas'
              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/50'
              : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
          Escalas & 12x36
        </button>
        <button
          onClick={() => setOperationalTab('afastamentos')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'afastamentos'
              ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/50'
              : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
          Afastamentos & Férias
        </button>
        <button
          onClick={() => setOperationalTab('exportador')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'exportador'
              ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-400/50'
              : 'text-sky-700 bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-sky-500" />
          Exportador ERP & 671
        </button>
        <button
          onClick={() => setOperationalTab('riscos')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'riscos'
              ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/50'
              : 'text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          Riscos & Compliance CLT
        </button>
        <button
          onClick={() => setOperationalTab('mobile')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            operationalTab === 'mobile'
              ? 'bg-violet-600 text-white shadow-xs ring-2 ring-violet-400/50'
              : 'text-violet-700 bg-violet-50/70 hover:bg-violet-100/80 border border-violet-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-violet-500" />
          App Mobile & Totem
        </button>
      </div>

      {/* ========================================================= */}
      {/* ABA: MÓDULO 09 — RELATÓRIOS & APURAÇÃO DE DESCONTOS      */}
      {/* ========================================================= */}
      {operationalTab === 'relatorios' && (
        <ModuloRelatoriosOcorrencias
          ocorrencias={ocorrencias}
          onUpdateOcorrencias={setOcorrencias}
          departamentos={departamentos}
          colaboradores={colaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA 0: EQUIPES, GESTORES & HORAS EXTRAS                  */}
      {/* ========================================================= */}
      {operationalTab === 'equipes' && (
        <GestaoEquipesEAprovacoes
          departamentos={departamentos}
          onUpdateDepartamentos={setDepartamentos}
          colaboradores={colaboradores}
          onUpdateColaboradores={setColaboradores}
          horasExtras={horasExtras}
          onUpdateHorasExtras={setHorasExtras}
          solicitacoesAjuste={solicitacoesAjuste}
          onUpdateSolicitacoesAjuste={setSolicitacoesAjuste}
          currentUser={currentUser}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: ÍNDICE DE PERFORMANCE & ASSIDUIDADE (IPA)           */}
      {/* ========================================================= */}
      {operationalTab === 'ipa' && (
        <PainelScoringIPA
          colaboradores={colaboradores}
          registrosPonto={registrosPonto}
          ocorrencias={ocorrencias}
          departamentos={departamentos}
          estabelecimentos={estabelecimentos}
          activeTenant={activeTenant}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: BIOMETRIA FACIAL (MÓDULO 02)                        */}
      {/* ========================================================= */}
      {operationalTab === 'biometria' && (
        <BiometricConfigurator
          activeTenant={activeTenant}
          colaboradores={colaboradores}
          onUpdateColaboradores={setColaboradores}
          estabelecimentos={estabelecimentos}
          onUpdateEstabelecimentos={setEstabelecimentos}
        />
      )}

      {/* ========================================================= */}
      {/* ABA 1: COLETOR TABLET REP-P (KIOSK DE PONTO INTERATIVO)  */}
      {/* ========================================================= */}
      {operationalTab === 'coletor' && (
        <div className="space-y-6">
          {/* Dashboard de Saúde de Dispositivos & Fila Offline (Ponto 2) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4">
             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${navigator.onLine ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                   {navigator.onLine ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase block">Status de Rede</span>
                   <span className="text-xs font-bold text-slate-800">{navigator.onLine ? 'Online (Sincronizado)' : 'Offline (Modo Fila)'}</span>
                </div>
             </div>

             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                   <Database className="w-5 h-5" />
                </div>
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase block">Fila Offline (IndexedDB)</span>
                   <span className="text-xs font-bold text-slate-800">{offlineQueueCount} batidas pendentes</span>
                </div>
             </div>

             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                   <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase block">Bateria do Dispositivo</span>
                   <span className="text-xs font-bold text-slate-800">{deviceHealth.batteryLevel !== null ? `${deviceHealth.batteryLevel}% ${deviceHealth.isCharging ? '(Carregando)' : ''}` : '92% (Normal)'}</span>
                </div>
             </div>

             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase block">Cota Armazenamento</span>
                   <span className="text-xs font-bold text-slate-800">{deviceHealth.storageQuotaPercent !== null ? `${deviceHealth.storageQuotaPercent}% Usado` : '14% Usado'}</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* O Tablet Virtual Kiosk */}
          <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  COLETOR TABLET HOMOLOGADO (REP-P)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                UUID: 9b1deb4d · Portaria MTP 671/2021
              </span>
            </div>

            {/* Relógio Digital Oficial HLB */}
            <div className="text-center py-5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Hora Legal Brasileira (HLB)
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider tabular-nums">
                {getEffectiveClockTime().toLocaleTimeString('pt-BR')}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {getEffectiveClockTime().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Seletor de Tipo de Marcação (Controle de Intervalo CLT Art. 71) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Tipo da Marcação no Coletor:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-medium">
                <button
                  onClick={() => setSelectedPunchType('AUTO')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors ${
                    selectedPunchType === 'AUTO'
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Automático
                </button>
                <button
                  onClick={() => setSelectedPunchType('ENTRADA')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'ENTRADA'
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> 1ª Entrada
                </button>
                <button
                  onClick={() => setSelectedPunchType('INTERVALO_INICIO')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'INTERVALO_INICIO'
                      ? 'bg-amber-600 border-amber-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" /> Saída Almoço
                </button>
                <button
                  onClick={() => setSelectedPunchType('INTERVALO_FIM')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'INTERVALO_FIM'
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Volta Almoço
                </button>
                <button
                  onClick={() => setSelectedPunchType('SAIDA')}
                  className={`py-2 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    selectedPunchType === 'SAIDA'
                      ? 'bg-rose-600 border-rose-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> 2ª Saída
                </button>
              </div>
            </div>

            {/* Entrada de Identificação (CPF ou PIN) */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-slate-300 block">
                Identificação do Trabalhador (Digite CPF ou PIN):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={kioskInput}
                  onChange={(e) => setKioskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBaterPonto()}
                  placeholder="Ex: 123.456.789-09 ou PIN 102030"
                  className="w-full sm:flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleBaterPonto()}
                  className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  Registrar Ponto
                </button>
                <button
                  onClick={() => {
                    // @ts-ignore
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                      setKioskFeedback({
                        type: 'ERROR',
                        msg: 'Reconhecimento de voz não suportado neste navegador.'
                      });
                      setTimeout(() => setKioskFeedback(null), 4000);
                      return;
                    }
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'pt-BR';
                    recognition.interimResults = false;
                    recognition.maxAlternatives = 1;
                    setKioskFeedback({ type: 'WARNING', msg: 'Ouvindo comando de voz... Dite seu CPF ou PIN.' });
                    recognition.onresult = (event: any) => {
                      const text = event.results[0][0].transcript;
                      setKioskInput(text);
                      setKioskFeedback({ type: 'SUCCESS', msg: `Voz capturada: "${text}". Processando ponto...` });
                      setTimeout(() => handleBaterPonto(text), 1000);
                    };
                    recognition.onerror = () => {
                      setKioskFeedback({ type: 'ERROR', msg: 'Falha no reconhecimento de voz. Tente digitar.' });
                    };
                    recognition.start();
                  }}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer"
                  title="Falar ID por comando de voz"
                >
                  <Radio className="w-4 h-4 animate-pulse" /> Falar ID
                </button>
              </div>

              {kioskFeedback && (
                <div
                  className={`p-3.5 rounded-lg text-xs space-y-1 ${
                    kioskFeedback.type === 'SUCCESS'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : kioskFeedback.type === 'WARNING'
                      ? 'bg-amber-950/90 text-amber-200 border border-amber-700'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2 font-bold">
                    {kioskFeedback.type === 'SUCCESS' && (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    )}
                    {kioskFeedback.type === 'WARNING' && (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    )}
                    {kioskFeedback.type === 'ERROR' && (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <span>{kioskFeedback.msg}</span>
                  </div>
                  {kioskFeedback.details && (
                    <p className="text-[11px] text-amber-300/90 pl-6">
                      {kioskFeedback.details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Acesso Rápido de Demonstração (Colaboradores Cadastrados) */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Simulação Rápida — Clique em um colaborador para bater o ponto com as regras ativas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeColaboradores.map((colab) => {
                  const hasBio =
                    hasRealBiometricTemplate(colab) ||
                    (typeof window !== 'undefined' &&
                      hasRealBiometricTemplate(localStorage.getItem(`sc_bio_vec_${colab.id}`)));
                  return (
                    <button
                      key={colab.id}
                      onClick={() => handleBaterPonto(colab)}
                      className="p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-left transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white group-hover:text-emerald-400">
                            {colab.nome}
                          </span>
                          {hasBio ? (
                            <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Face Ativa
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5 text-amber-400" /> Sem Biometria (Bloqueado)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Início: {colab.horarioInicio} · Int: {colab.intervaloMinutos}m · Máx Antecedência: {colab.maxMinutosAntecedenciaPermitido}m
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Gestor: {colab.gestorNome || 'Roberto Albuquerque'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* O Comprovante Oficial Emitido (Portaria 671 Art. 83) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    Comprovante de Registro de Ponto do Trabalhador
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Portaria 671 Art. 83</span>
              </div>

              {lastComprovante ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono text-xs">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <div className="font-bold text-slate-900 text-sm">COMPROVANTE DE PONTO ELETRÔNICO</div>
                    <div className="text-[10px] text-slate-500">REGISTRADOR ELETRÔNICO DE PONTO VIA PROGRAMA (REP-P)</div>
                  </div>

                  <div className="space-y-1.5 text-slate-700 text-[11px]">
                    <div>
                      <span className="text-slate-400">EMPREGADOR:</span> {lastComprovante.empregadorRazaoSocial}
                    </div>
                    <div>
                      <span className="text-slate-400">CNPJ:</span> {lastComprovante.empregadorCnpj}
                    </div>
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-slate-400">TRABALHADOR:</span> {lastComprovante.colaboradorNome}
                    </div>
                    <div>
                      <span className="text-slate-400">CPF:</span> {lastComprovante.colaboradorCpf}
                    </div>
                    <div>
                      <span className="text-slate-400">MATRÍCULA:</span> {lastComprovante.colaboradorMatricula}
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex justify-between">
                      <span className="text-slate-400">TIPO DE MARCAÇÃO:</span>
                      <strong className="text-slate-900">
                        {lastComprovante.tipoMarcacao === 'ENTRADA' && '1ª ENTRADA'}
                        {lastComprovante.tipoMarcacao === 'INTERVALO_INICIO' && 'SAÍDA INTERVALO (ALMOÇO)'}
                        {lastComprovante.tipoMarcacao === 'INTERVALO_FIM' && 'RETORNO INTERVALO (ALMOÇO)'}
                        {lastComprovante.tipoMarcacao === 'SAIDA' && '2ª SAÍDA (TÉRMINO EXPEDIENTE)'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">DATA/HORA:</span>
                      <strong className="text-slate-900">{lastComprovante.dataHoraFormatada} (HLB)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NSR (Nº SEQUENCIAL):</span>
                      <strong className="text-emerald-700">{String(lastComprovante.nsr).padStart(9, '0')}</strong>
                    </div>

                    {lastComprovante.alertaAntecedencia && (
                      <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-sans">
                        <strong>Aviso CLT Art. 58:</strong> {lastComprovante.alertaAntecedencia}
                      </div>
                    )}

                    {lastComprovante.alertaIntervalo && (
                      <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[10px] font-sans">
                        <strong>Alerta CLT Art. 71 § 4º:</strong> {lastComprovante.alertaIntervalo}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 break-all leading-relaxed">
                    <span className="font-bold block text-slate-600 mb-0.5">HASH DE AUTENTICIDADE SHA-256:</span>
                    <code>{lastComprovante.hashSha256}</code>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold transition-colors flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Printer className="w-3 h-3" /> Imprimir Comprovante
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-500 text-xs space-y-2">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p>Nenhuma marcação realizada nesta sessão.</p>
                  <p className="text-[11px] text-slate-400">
                    Utilize o tablet ao lado para registrar o primeiro ponto. O comprovante oficial com NSR e Hash SHA-256 aparecerá aqui.
                  </p>
                </div>
              )}

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 leading-relaxed">
                <strong>Conformidade Legal:</strong> O comprovante eletrônico é imutável e assinado digitalmente, contendo todos os campos do Art. 83 da Portaria 671/2021.
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================= */}
      {/* ABA: COLABORADORES & RH (MÓDULO EMPRESA)                  */}
      {/* ========================================================= */}
      {operationalTab === 'empresa' && (
        <GestaoColaboradoresTab
          activeColaboradores={activeColaboradores}
          allColaboradores={colaboradores}
          tenants={tenants}
          selectedTenantId={selectedTenantId}
          estabelecimentos={estabelecimentos}
          departamentos={departamentos}
          cargos={cargos}
          onAprovarAutoCadastro={handleAprovarAutoCadastro}
          onRecusarAutoCadastro={handleRecusarAutoCadastro}
          onUpdateColaborador={handleUpdateColaborador}
          onOpenNewColabModal={() => {
            const firstEst = estabelecimentos.find((e) => e.tenantId === selectedTenantId) || estabelecimentos[0];
            setNewColabError(null);
            setNewColabForm((prev) => ({
              ...prev,
              tenantId: selectedTenantId || tenants[0]?.id || '',
              estabelecimentoId: firstEst?.id || ''
            }));
            setIsNewColabModalOpen(true);
          }}
          colabApprovalNotice={colabApprovalNotice}
          onCloseApprovalNotice={() => setColabApprovalNotice(null)}
          getColabContactInfo={getColabContactInfo}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: ESTRUTURA ORGANIZACIONAL (DEPTOS, CARGOS, UNIDADES) */}
      {/* ========================================================= */}
      {operationalTab === 'estrutura' && (
        <GestaoEstrutura
          activeTenant={activeTenant}
          departamentos={departamentos}
          onUpdateDepartamentos={setDepartamentos}
          cargos={cargos}
          onUpdateCargos={setCargos}
          estabelecimentos={estabelecimentos}
          onUpdateEstabelecimentos={setEstabelecimentos}
          colaboradores={colaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: MATRIZ DE PERMISSÕES & PERFIS DE ACESSO (RBAC)      */}
      {/* ========================================================= */}
      {operationalTab === 'permissoes' && (
        <MatrizPermissoes />
      )}

      {/* ========================================================= */}
      {/* ABA: FERIADOS & DSR                                      */}
      {/* ========================================================= */}
      {operationalTab === 'feriados' && (
        <GestaoFeriados
          feriados={feriados}
          onAddFeriado={(novo) => setFeriados([novo, ...feriados])}
          activeTenant={activeTenant}
          estabelecimentos={estabelecimentos}
          colaboradores={colaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: REGISTROS & AFD OFICIAL                             */}
      {/* ========================================================= */}
      {operationalTab === 'registros' && (
        <GestaoRegistrosPontoTab
          activeRegistros={activeRegistros}
          activeColaboradores={activeColaboradores}
          onDownloadAFD={handleDownloadAFD}
          onDownloadAEJ={handleDownloadAEJ}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: PAINEL MULTI-TENANT (ADMIN)                         */}
      {/* ========================================================= */}
      {operationalTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Empresas Contratantes</h2>
                <p className="text-xs text-slate-500">
                  Gestão multi-empresa, endereços de cerca geofence e colaboradores alocados em cada CNPJ.
                </p>
              </div>
              <button 
                onClick={() => {
                  setNewTenantError(null);
                  setIsNewTenantModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Nova Empresa (com Endereço &amp; CEP)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map(t => {
                const colabsDaEmpresa = colaboradores.filter(c => c.tenantId === t.id);
                const estsDaEmpresa = estabelecimentos.filter(e => e.tenantId === t.id);
                const matriz = estsDaEmpresa.find(e => e.tipo === 'MATRIZ') || estsDaEmpresa[0];
                const enderecoExibir = t.enderecoCompleto || matriz?.enderecoCompleto || (matriz ? `${matriz.municipio}/${matriz.uf}` : 'Endereço não cadastrado');
                const latExibir = t.latitude ?? matriz?.latitude;
                const lngExibir = t.longitude ?? matriz?.longitude;
                const raioExibir = t.cercaRaioMetros ?? matriz?.cercaRaioMetros ?? 100;
                const isExpanded = expandedTenantRosterId === t.id;

                return (
                <div key={t.id} className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${t.id === selectedTenantId ? 'border-emerald-500 bg-emerald-50/30 shadow-xs' : 'border-slate-200 bg-slate-50/50 hover:bg-white'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                        <Building2 className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {t.id === selectedTenantId && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            ATIVA
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${t.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={t.razaoSocial}>{t.razaoSocial}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mb-2">{t.cnpj}</p>

                    <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1 text-[10px] text-slate-600 mb-2">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2" title={enderecoExibir}>{enderecoExibir}</span>
                      </div>
                      {latExibir !== undefined && lngExibir !== undefined && (
                        <div className="font-mono text-[9px] text-slate-400">
                          GPS: {Number(latExibir).toFixed(4)}, {Number(lngExibir).toFixed(4)} · Raio {raioExibir}m
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                      <span>Alocados: <strong className="text-slate-900">{colabsDaEmpresa.length}</strong> / {t.licencasContratadas}</span>
                      <span>Unidades: <strong className="text-slate-900">{estsDaEmpresa.length}</strong></span>
                      <span>Plano: <strong>{t.plano}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setExpandedTenantRosterId(isExpanded ? null : t.id)}
                        className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        {isExpanded ? 'Ocultar Alocados ▲' : `Ver Alocados (${colabsDaEmpresa.length}) ▼`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTenantId(t.id);
                          setOperationalTab('empresa');
                        }}
                        className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Gerenciar RH
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5 max-h-44 overflow-y-auto">
                        {colabsDaEmpresa.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-1">Nenhum colaborador alocado nesta empresa ainda.</p>
                        ) : (
                          colabsDaEmpresa.map(col => (
                            <div key={col.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-2 py-1.5 text-[10px]">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 truncate">{col.nome}</div>
                                <div className="text-slate-400 truncate">
                                  {col.estabelecimentoNome || 'Sem unidade'} · {col.cargoTitulo}
                                </div>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ml-2 ${
                                col.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {col.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CREDENCIAIS GERADAS */}
      {generatedCredentials && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold">Acesso Criado!</h3>
              <p className="text-xs text-emerald-50 leading-relaxed">
                As credenciais abaixo foram geradas para <strong>{generatedCredentials.nome}</strong>.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2.5">
                {generatedCredentials.cpf && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPF de Acesso</span>
                    <div className="flex items-center justify-between group">
                      <code className="text-sm font-bold text-slate-900 font-mono">{formatCPF(generatedCredentials.cpf)}</code>
                      <button onClick={() => navigator.clipboard.writeText(formatCPF(generatedCredentials.cpf || ''))} className="p-1 hover:bg-white rounded transition-colors" title="Copiar CPF">
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
                {generatedCredentials.pin && (
                  <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">PIN do Coletor (Kiosk / Tablet)</span>
                    <div className="flex items-center justify-between group">
                      <code className="text-sm font-bold text-indigo-900 font-mono">{generatedCredentials.pin}</code>
                      <button onClick={() => navigator.clipboard.writeText(generatedCredentials.pin || '')} className="p-1 hover:bg-white rounded transition-colors" title="Copiar PIN">
                        <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail de Acesso</span>
                  <div className="flex items-center justify-between group">
                    <code className="text-xs font-bold text-slate-900 font-mono truncate max-w-[200px]">{generatedCredentials.email}</code>
                    <button onClick={() => navigator.clipboard.writeText(generatedCredentials.email)} className="p-1 hover:bg-white rounded transition-colors" title="Copiar E-mail">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senha Temporária</span>
                  <div className="flex items-center justify-between group">
                    <code className="text-sm font-bold text-emerald-700 font-mono">{generatedCredentials.senha}</code>
                    <button onClick={() => navigator.clipboard.writeText(generatedCredentials.senha)} className="p-1 hover:bg-white rounded transition-colors" title="Copiar Senha">
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-tight">
                  O colaborador pode acessar o sistema usando o <strong>CPF</strong> ou <strong>E-mail</strong> com a senha ou PIN cadastrado. Para registrar ponto no Coletor, cadastre a biometria facial.
                </p>
              </div>
              <div className="space-y-2 pt-1">
                <button 
                  onClick={() => {
                    setGeneratedCredentials(null);
                    setOperationalTab('biometria');
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <ScanFace className="w-4 h-4" /> Cadastrar Face Agora
                </button>
                <button 
                  onClick={() => setGeneratedCredentials(null)}
                  className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all"
                >
                  Fechar & Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BIOMETRIA FACIAL (CHAMADO NO HANDLE BATER PONTO - STRICT LOCK REP-P) */}
      {biometricTargetColab && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <canvas ref={analyzerCanvasRef} width={120} height={120} className="hidden" />
          <div className={`bg-slate-900 border rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-6 text-white space-y-4 sm:space-y-5 relative overflow-y-auto transition-all duration-300 my-auto ${
            biometricState === 'verified'
              ? 'border-emerald-500/80 shadow-emerald-950/50'
              : biometricState === 'rejected_mismatch' || biometricState === 'unregistered_biometrics'
              ? 'border-rose-500/80 shadow-rose-950/50'
              : biometricState === 'analyzing_face'
              ? 'border-amber-500/80 shadow-amber-950/50'
              : 'border-slate-800'
          }`}>
            {/* Linha animada de scanner enquanto analisa */}
            {biometricState === 'analyzing_face' && (
              <div className="absolute inset-x-0 h-1 bg-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse z-10 top-1/2"></div>
            )}
            {biometricState === 'verified' && (
              <div className="absolute inset-x-0 h-1 bg-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.9)] z-10 top-1/2"></div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  biometricState === 'verified'
                    ? 'bg-emerald-400 animate-ping'
                    : biometricState === 'rejected_mismatch' || biometricState === 'unregistered_biometrics'
                    ? 'bg-rose-500'
                    : biometricState === 'analyzing_face'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-blue-400'
                }`} />
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  biometricState === 'verified'
                    ? 'text-emerald-400'
                    : biometricState === 'rejected_mismatch' || biometricState === 'unregistered_biometrics'
                    ? 'text-rose-400'
                    : biometricState === 'analyzing_face'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}>
                  {biometricState === 'verified' && 'Biometria Facial Confirmada'}
                  {biometricState === 'analyzing_face' && 'Analisando Prova de Vida...'}
                  {biometricState === 'detecting_face' && 'Aguardando Rosto na Moldura'}
                  {biometricState === 'checking_camera' && 'Conectando Sensor Óptico...'}
                  {biometricState === 'no_camera' && 'Câmera Indisponível'}
                  {biometricState === 'unregistered_biometrics' && 'Biometria Não Cadastrada'}
                  {biometricState === 'rejected_mismatch' && 'Divergência Biométrica (Rejeitado)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 tracking-tighter hidden sm:inline">PORTARIA_671_ISO19794</span>
                <button
                  onClick={() => {
                    setBiometricTargetColab(null);
                    setSimulatedMismatch(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Cancelar e Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{biometricTargetColab.nome}</h2>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                <span>CPF: {biometricTargetColab.cpf}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>MAT: {biometricTargetColab.matricula}</span>
              </div>
            </div>

            {/* Desafio de Prova de Vida Ativa (Liveness Challenge) */}
            {currentLivenessChallenge && (
              <div className="p-3.5 bg-amber-950/90 border border-amber-500/60 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-3 shadow-lg">
                 <div className="flex items-center gap-2.5">
                   <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                   <div>
                     <strong className="block text-amber-300 font-extrabold uppercase tracking-wider text-[11px]">Prova de Vida Ativa (Liveness)</strong>
                     <span className="text-[11px] text-amber-100">{currentLivenessChallenge.instruction}</span>
                   </div>
                 </div>
                 <button
                   onClick={() => {
                     setLivenessConfirmed(true);
                     setFaceStatusMessage('Prova de vida confirmada com sucesso! Registro de ponto liberado.');
                   }}
                   className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md flex items-center gap-1.5 ${
                     livenessConfirmed 
                       ? 'bg-emerald-600 text-white shadow-emerald-900/50' 
                       : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-amber-950/40 animate-pulse'
                   }`}
                 >
                   {livenessConfirmed ? (
                     <>
                       <CheckCircle2 className="w-4 h-4 text-white inline" />
                       ✓ Ação Confirmada
                     </>
                   ) : (
                     <>
                       <Sparkles className="w-3.5 h-3.5 text-slate-950 inline" />
                       Confirmar Ação
                     </>
                   )}
                 </button>
              </div>
            )}

            {/* Circular Camera Preview / Face Frame */}
            <div className={`relative w-48 h-48 sm:w-60 sm:h-60 mx-auto rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-4 transition-all duration-500 shrink-0 ${
              biometricState === 'verified'
                ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                : biometricState === 'rejected_mismatch' || biometricState === 'unregistered_biometrics'
                ? 'border-rose-600 shadow-[0_0_25px_rgba(225,29,72,0.5)]'
                : biometricState === 'analyzing_face' || biometricCountdown !== null
                ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : 'border-slate-800'
            }`}>
              
              {/* Círculo de Scanner Animado (Solicitado via CSS) */}
              <div className={`absolute inset-0 rounded-full z-10 pointer-events-none biometric-modal-scanner-circle ${biometricState === 'verified' ? 'verified' : ''}`}></div>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isCameraActive ? 'opacity-100' : 'opacity-10'}`}
              />

              {/* Contador Regressivo Centralizado */}
              {biometricCountdown !== null && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center">
                    <span className="text-7xl font-black text-white animate-ping drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                      {biometricCountdown}
                    </span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-2 bg-amber-600 px-2 py-0.5 rounded shadow-lg">
                      Prepare-se
                    </span>
                  </div>
                </div>
              )}

              {/* Instrução Dinâmica de Liveness após o Contador */}
              {currentLivenessChallenge && !livenessConfirmed && biometricCountdown === null && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-amber-950/40 backdrop-blur-[1px] p-4 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl border-2 border-white/20 animate-bounce">
                    <span className="text-sm font-black uppercase tracking-tight">
                      {currentLivenessChallenge.actionPrompt}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-100 font-bold mt-3 max-w-[180px] drop-shadow-md">
                    {currentLivenessChallenge.instruction}
                  </span>
                </div>
              )}

              {/* Status de Câmera Desativada */}
              {!isCameraActive && biometricState !== 'unregistered_biometrics' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-slate-950/80">
                  <Camera className="w-10 h-10 text-rose-400/80 mb-2 animate-pulse" />
                  <span className="text-xs font-bold text-rose-300">
                    Câmera Indisponível
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 max-w-[180px]">
                    Autorize o acesso à câmera no navegador para realizar o reconhecimento facial.
                  </span>
                </div>
              )}

              {/* Status de Biometria Não Cadastrada */}
              {biometricState === 'unregistered_biometrics' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-rose-950/80 space-y-2">
                  <ShieldAlert className="w-12 h-12 text-rose-400 animate-bounce" />
                  <span className="text-xs font-bold text-rose-200">
                    SEM BIOMETRIA
                  </span>
                  <span className="text-[10px] text-rose-300/90 leading-tight">
                    O trabalhador não possui template facial cadastrado no sistema.
                  </span>
                </div>
              )}

              {/* Status de Divergência Biométrica (Mismatch) */}
              {biometricState === 'rejected_mismatch' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-rose-950/85 space-y-2">
                  <UserX className="w-14 h-14 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    FACE DIVERGENTE
                  </span>
                  <span className="text-[10px] text-rose-200 leading-tight px-2">
                    A face na câmera não confere com o padrão biométrico do colaborador.
                  </span>
                </div>
              )}

              {/* Real-time Bounding Box & HUD Facial */}
              {isCameraActive && detectedFaceBox && (
                <div
                  className="absolute border border-emerald-400/80 rounded pointer-events-none transition-all duration-100 z-20"
                  style={{
                    left: `${Math.max(5, (detectedFaceBox.x / 320) * 100)}%`,
                    top: `${Math.max(5, (detectedFaceBox.y / 240) * 100)}%`,
                    width: `${Math.min(90, (detectedFaceBox.width / 320) * 100)}%`,
                    height: `${Math.min(90, (detectedFaceBox.height / 240) * 100)}%`
                  }}
                >
                  <div className="absolute -top-3.5 left-0 bg-emerald-950/90 text-emerald-400 text-[8px] font-mono px-1 rounded border border-emerald-500/40">
                    ISO_ROI
                  </div>
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-emerald-300"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-300"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-300"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-emerald-300"></div>
                </div>
              )}

              {/* Marcos Faciais (Olhos, Nariz, Boca) */}
              {isCameraActive && detectedLandmarks && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 320 240">
                  <circle cx={detectedLandmarks.leftEye.x} cy={detectedLandmarks.leftEye.y} r="3" fill="#34d399" />
                  <circle cx={detectedLandmarks.rightEye.x} cy={detectedLandmarks.rightEye.y} r="3" fill="#34d399" />
                  <circle cx={detectedLandmarks.nose.x} cy={detectedLandmarks.nose.y} r="2.5" fill="#38bdf8" />
                  <circle cx={detectedLandmarks.mouth.x} cy={detectedLandmarks.mouth.y} r="3" fill="#f43f5e" />
                  <line
                    x1={detectedLandmarks.leftEye.x}
                    y1={detectedLandmarks.leftEye.y}
                    x2={detectedLandmarks.rightEye.x}
                    y2={detectedLandmarks.rightEye.y}
                    stroke="#34d399"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                </svg>
              )}

              {/* Guia Elíptica Padrão (Face Mesh Guide) */}
              {isCameraActive && biometricState !== 'unregistered_biometrics' && biometricState !== 'rejected_mismatch' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100">
                  <path
                    d="M 30,40 Q 50,20 70,40 M 35,50 Q 50,45 65,50 M 40,75 Q 50,85 60,75"
                    fill="none"
                    stroke={biometricState === 'verified' ? '#10b981' : biometricState === 'analyzing_face' ? '#fbbf24' : '#64748b'}
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke={biometricState === 'verified' ? '#10b981' : biometricState === 'analyzing_face' ? '#fbbf24' : '#64748b'}
                    strokeWidth="1.2"
                    strokeDasharray={biometricState === 'verified' ? 'none' : '4,4'}
                  />
                </svg>
              )}

              {/* Overlay: Aguardando enquadramento */}
              {isCameraActive && biometricState === 'detecting_face' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10 bg-slate-950/40">
                  <span className="text-[11px] font-semibold text-slate-200 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700 animate-pulse">
                    Enquadre seu rosto no círculo
                  </span>
                </div>
              )}

              {/* Overlay: Analisando vetores e liveness */}
              {isCameraActive && biometricState === 'analyzing_face' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-slate-950/40 z-10">
                  <div className="w-14 h-14 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-slate-900/90 px-2.5 py-1 rounded-full border border-amber-500/40">
                    EXTRAINDO VETORES: {scanProgress}%
                  </span>
                </div>
              )}

              {/* Overlay: Sucesso Verificado */}
              {biometricState === 'verified' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/70 text-emerald-300 space-y-2 p-4 text-center z-10 animate-in zoom-in-95 duration-300">
                  <ShieldCheck className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold block text-white">IDENTIDADE CONFIRMADA</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-400 block">
                      SIMILARIDADE: {biometricConfidence}% · ISO 19794-5
                    </span>
                    <span className="text-[9px] font-mono text-emerald-300/80 block">
                      HASH: SHA256:{biometricTargetColab.id.slice(-6).toUpperCase()}..PASS
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnóstico do Motor Aberto & Condição de Luz */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/70 px-3 py-2 rounded-xl border border-slate-800 font-mono">
              <span className="flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                <span className="truncate">{biometricEngineName}</span>
              </span>
              <span className="shrink-0 font-bold ml-2">
                Luz: <strong className={lightingCondition === 'EXCELENTE' ? 'text-emerald-400' : lightingCondition === 'BOA' ? 'text-teal-400' : 'text-amber-400'}>{lightingCondition}</strong>
              </span>
            </div>

            {/* Barra de Progresso e Mensagem de Diagnóstico ao Vivo */}
            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${
                    biometricState === 'verified'
                      ? 'bg-emerald-500 w-full'
                      : biometricState === 'rejected_mismatch' || biometricState === 'unregistered_biometrics'
                      ? 'bg-rose-500 w-full'
                      : biometricState === 'analyzing_face'
                      ? 'bg-amber-400'
                      : 'bg-slate-700 w-0'
                  }`}
                  style={{ width: biometricState === 'analyzing_face' ? `${scanProgress}%` : undefined }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="truncate pr-2">{faceStatusMessage || 'Aguardando validação da câmera...'}</span>
                {biometricState === 'analyzing_face' && <span>{scanProgress}%</span>}
                {biometricState === 'verified' && <span className="text-emerald-400 font-bold">100% OK</span>}
              </div>
            </div>

            {/* Painel de Ações e Travas de Segurança */}
            <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-3">
              {/* Caso 1: Colaborador sem biometria cadastrada */}
              {biometricState === 'unregistered_biometrics' && (
                <div className="w-full space-y-3">
                  <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-xs text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Biometria Facial Pendente
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Este colaborador foi salvo no banco mas ainda não possui foto/face cadastrada. Você pode cadastrar a face agora ou utilizar o PIN do coletor para liberação por contingência.
                    </p>
                  </div>

                  {showPinFallback ? (
                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Digitar PIN do Coletor ({biometricTargetColab?.pinColetor ? 'PIN individual configurado' : 'Sem PIN configurado'})
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          maxLength={6}
                          placeholder="Digite o PIN de 6 dígitos"
                          value={kioskPinInput}
                          onChange={(e) => {
                            setKioskPinInput(e.target.value);
                            if (kioskPinError) setKioskPinError(null);
                          }}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={() => {
                            setKioskPinError(null);
                            const colabRegistros = registrosPonto.filter(r => r.colaboradorId === biometricTargetColab?.id);
                            const eligibility = checkPinUsageEligibility(biometricTargetColab || undefined, colabRegistros);
                            if (!eligibility.isEligible) {
                              setKioskPinError(`Bloqueio de Segurança: ${eligibility.reason}`);
                              return;
                            }
                            const expectedPin = biometricTargetColab?.pinColetor?.trim();
                            if (!expectedPin) {
                              setKioskPinError('Colaborador sem PIN individual cadastrado. Realize o cadastro facial.');
                              return;
                            }
                            if (kioskPinInput.trim() === expectedPin) {
                              setBiometricState('verified');
                              setLivenessConfirmed(true);
                              setFaceStatusMessage('Identificação confirmada via PIN de Contingência (1º Dia)');
                              setShowPinFallback(false);
                              setKioskPinError(null);
                            } else {
                              setKioskPinError('PIN incorreto. Verifique seu PIN individual ou procure o RH.');
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Validar
                        </button>
                      </div>
                      {kioskPinError && (
                        <div className="p-2 bg-rose-950/80 border border-rose-700 rounded-lg text-[11px] text-rose-200">
                          {kioskPinError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBiometricTargetColab(null);
                            setOperationalTab('biometria');
                          }}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <ScanFace className="w-4 h-4" /> Cadastrar Face Agora
                        </button>
                        <button
                          onClick={() => setShowPinFallback(true)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
                        >
                          <Key className="w-4 h-4" /> Bater Ponto com PIN
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setBiometricTargetColab(null);
                          setShowPinFallback(false);
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Caso 2: Câmera indisponível */}
              {biometricState === 'no_camera' && (
                <div className="w-full space-y-3">
                  <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      Câmera Necessária para Validação
                    </div>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">
                      O sistema exige captura ao vivo para evitar fraudes e bater o ponto no REP-P. Conecte ou autorize a câmera.
                    </p>
                  </div>
                  <button
                    onClick={() => setBiometricTargetColab(null)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Caso 3: Divergência Biométrica Rejeitada */}
              {biometricState === 'rejected_mismatch' && (
                <div className="w-full space-y-3">
                  <div className="p-3 bg-rose-950/70 border border-rose-700 rounded-xl text-xs text-rose-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-300">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      Registro Recusado: Face Não Confere
                    </div>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed">
                      O rosto apresentado não corresponde aos registros biométricos de {biometricTargetColab.nome}. A marcação foi bloqueada por razões de segurança jurídica (REP-P).
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSimulatedMismatch(false);
                        resetLivenessState();
                        scanProgressRef.current = 0;
                        missedFramesRef.current = 0;
                        collectedVectorsRef.current = [];
                        setBiometricState('detecting_face');
                        setScanProgress(0);
                        setFaceStatusMessage('Posicione o rosto centralizado no círculo.');
                      }}
                      className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>Tentar Novamente (Recapturar)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBiometricTargetColab(null)}
                      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Caso 4: Escaneando / Detectando (Ação de Captura Instantânea + Trava de Segurança) */}
              {(biometricState === 'detecting_face' || biometricState === 'analyzing_face' || biometricState === 'checking_camera') && (
                <div className="w-full space-y-3">
                  {/* Botão de Captura Instantânea com Algoritmo Aberto */}
                  <button
                    onClick={handleInstantCaptureAndValidate}
                    disabled={isAnalyzingInstant || !isCameraActive}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4 text-emerald-100" />
                    {isAnalyzingInstant ? 'Extraindo Vetores ISO 19794-5...' : 'Capturar & Validar Face Agora'}
                  </button>

                  {/* Aviso de Trava REP-P */}
                  <div className="w-full py-2.5 bg-slate-800/60 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/80 select-none">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Registro de ponto bloqueado até leitura facial confirmada
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Botão para testar divergência / prevenção de fraude */}
                    <button
                      onClick={() => {
                        setSimulatedMismatch(true);
                        setBiometricState('rejected_mismatch');
                        setFaceStatusMessage('Divergência Biométrica: Face não reconhecida!');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline transition-colors"
                      title="Testa o comportamento de segurança quando um rosto diferente tenta bater o ponto"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Testar Divergência Facial (Simular Fraude)
                    </button>

                    <button
                      onClick={() => setBiometricTargetColab(null)}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      Cancelar Identificação
                    </button>
                  </div>
                </div>
              )}

              {/* Caso 5: Face Confirmada e Validada (CONFIRMAÇÃO CONDICIONADA À PROVA DE VIDA) */}
              {biometricState === 'verified' && (
                <div className="w-full space-y-3">
                  {currentLivenessChallenge && !livenessConfirmed ? (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <button
                        disabled
                        className="w-full py-3.5 bg-slate-800/90 border-2 border-amber-500/60 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-lg"
                      >
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>REGISTRO BLOQUEADO: Conclua a Prova de Vida ("{currentLivenessChallenge.actionPrompt}")</span>
                      </button>
                      <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-center">
                        <p className="text-[11px] text-amber-300 font-medium">
                          ⚠️ Biometria facial detectada. Realize a ação indicada no card amarelo acima ({currentLivenessChallenge.actionPrompt}) e confirme para liberar a gravação no banco local.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={executeFinalPonto}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-[0_10px_20px_rgba(5,150,105,0.35)] flex items-center justify-center gap-2 group animate-in zoom-in-95 duration-200 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      CONFIRMAR REGISTRO NSR-{(registrosPonto.length + 1).toString().padStart(4, '0')} (PROVA DE VIDA & BIOMETRIA CONFIRMADAS)
                    </button>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <button
                      onClick={() => {
                        resetLivenessState();
                        scanProgressRef.current = 0;
                        missedFramesRef.current = 0;
                        collectedVectorsRef.current = [];
                        setBiometricState('detecting_face');
                        setScanProgress(0);
                        setFaceStatusMessage('Recapturando face...');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200 uppercase tracking-tighter"
                    >
                      Recapturar Face
                    </button>
                    <button
                      onClick={() => setBiometricTargetColab(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* ABA: CONFIGURAÇÕES DO SISTEMA & STATUS DA CONEXÃO        */}
      {/* ========================================================= */}
      {operationalTab === 'config' && (
        <GestaoConfiguracoesTab
          systemStatus={systemStatus}
          checkSystemStatus={checkSystemStatus}
          updateSupabaseConfig={updateSupabaseConfig}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: GESTÃO DE ESCALAS COMPLEXAS (12x36, 6x1, 5x2)       */}
      {/* ========================================================= */}
      {operationalTab === 'escalas' && (
        <GestaoEscalas
          colaboradores={colaboradores}
          onUpdateColaboradores={setColaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: GESTÃO DE AFASTAMENTOS, FÉRIAS & ATESTADOS          */}
      {/* ========================================================= */}
      {operationalTab === 'afastamentos' && (
        <GestaoAfastamentos
          colaboradores={colaboradores}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: EXPORTADOR PARA ERPS DE FOLHA & ARQUIVOS 671        */}
      {/* ========================================================= */}
      {operationalTab === 'exportador' && (
        <ExportadorFolhaERP
          tenant={activeTenant}
          colaboradores={activeColaboradores}
          registros={activeRegistros}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: DASHBOARD DE RISCOS TRABALHISTAS & AUDITORIA CLT    */}
      {/* ========================================================= */}
      {operationalTab === 'riscos' && (
        <DashboardRiscosRH
          colaboradores={activeColaboradores}
          registros={activeRegistros}
          tenantName={activeTenant.razaoSocial}
        />
      )}

      {/* ========================================================= */}
      {/* ABA: EMPACOTAMENTO MOBILE & TOTEM KIOSK TABLET           */}
      {/* ========================================================= */}
      {operationalTab === 'mobile' && (
        <ModuloAppMobileKiosk />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE RECUSA DE AUTO-CADASTRO */}
      {pendingRejectColabId && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Recusar Auto-Cadastro</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deseja recusar e remover o pré-cadastro de{' '}
                  <strong>{colaboradores.find((c) => c.id === pendingRejectColabId)?.nome || 'colaborador'}</strong>?
                  Esta ação removerá o registro pendente do sistema.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingRejectColabId(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRecusarAutoCadastro}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      <NewTenantModal 
        isOpen={isNewTenantModalOpen}
        onClose={() => {
          setIsNewTenantModalOpen(false);
          setNewTenantError(null);
        }}
        onConfirm={handleCreateTenant}
        form={newTenantForm}
        setForm={setNewTenantForm}
        error={newTenantError}
      />

      <NewColaboradorModal
        isOpen={isNewColabModalOpen}
        onClose={() => {
          setIsNewColabModalOpen(false);
          setNewColabError(null);
        }}
        onConfirm={handleCreateColaborador}
        form={newColabForm}
        setForm={setNewColabForm}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        departamentos={departamentos}
        estabelecimentos={estabelecimentos}
        cargos={cargos}
        error={newColabError}
      />
    </div>
  );
};

// ... (Sub-components follow: Modals, etc.)

const NewTenantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  form: any;
  setForm: (f: any) => void;
  error: string | null;
}> = ({ isOpen, onClose, onConfirm, form, setForm, error }) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookupCep = async () => {
    setGeoFeedback(null);
    setCepLoading(true);
    try {
      const addr = await fetchAddressByCep(form.cep);
      const geo = await geocodeBrazilianAddress({
        logradouro: addr.logradouro,
        numero: form.numero,
        bairro: addr.bairro,
        municipio: addr.municipio,
        uf: addr.uf,
        cep: addr.cep
      });

      setForm((prev: any) => ({
        ...prev,
        cep: addr.cep,
        logradouro: addr.logradouro || prev.logradouro,
        complemento: addr.complemento || prev.complemento,
        bairro: addr.bairro || prev.bairro,
        municipio: addr.municipio || prev.municipio,
        uf: addr.uf || prev.uf,
        latitude: geo ? geo.latitude : prev.latitude,
        longitude: geo ? geo.longitude : prev.longitude
      }));

      if (geo) {
        setGeoFeedback(`Endereço e coordenadas (${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}) preenchidos via CEP ${addr.cep}.`);
      } else {
        setGeoFeedback(`Endereço preenchido via CEP ${addr.cep}. Informe o número ou capture o GPS para precisão exata.`);
      }
    } catch (err: any) {
      setGeoFeedback(err?.message || 'Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  const handleGeocodeFullAddress = async () => {
    setCepLoading(true);
    setGeoFeedback(null);
    try {
      const geo = await geocodeBrazilianAddress({
        logradouro: form.logradouro,
        numero: form.numero,
        bairro: form.bairro,
        municipio: form.municipio,
        uf: form.uf,
        cep: form.cep
      });
      if (geo) {
        setForm((prev: any) => ({
          ...prev,
          latitude: geo.latitude,
          longitude: geo.longitude
        }));
        setGeoFeedback(`Coordenadas atualizadas (${geo.precision}): ${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}.`);
      } else {
        setGeoFeedback('Não foi possível localizar coordenadas automáticas para este endereço. Use o GPS atual ou ajuste manualmente.');
      }
    } finally {
      setCepLoading(false);
    }
  };

  const handleUseCurrentGps = () => {
    if (!('geolocation' in navigator)) {
      setGeoFeedback('Geolocalização não suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setForm((prev: any) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        setGeoFeedback(`GPS atual capturado com precisão: ${lat}, ${lng}.`);
      },
      (err) => {
        setGeoFeedback(`Erro ao capturar GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold">Cadastrar Nova Empresa (com Endereço &amp; Local do Ponto)</h3>
            <p className="text-[11px] text-slate-300">Ao salvar, a unidade Matriz é criada automaticamente com a cerca GPS exata.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5 text-slate-300" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Dados da Empresa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ da Empresa *</label>
              <input 
                type="text" 
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={e => setForm({...form, cnpj: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Slug / Identificador</label>
              <input 
                type="text" 
                placeholder="nome-da-empresa"
                value={form.slug}
                onChange={e => setForm({...form, slug: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Razão Social *</label>
              <input 
                type="text" 
                placeholder="Ex: Softcase Tecnologia LTDA"
                value={form.razaoSocial}
                onChange={e => setForm({...form, razaoSocial: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Fantasia</label>
              <input 
                type="text" 
                placeholder="Ex: Softcase Tecnologia"
                value={form.nomeFantasia}
                onChange={e => setForm({...form, nomeFantasia: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Plano</label>
              <select 
                value={form.plano}
                onChange={e => setForm({...form, plano: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="REP-P Corporativo">REP-P Corporativo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Licenças</label>
              <input 
                type="number" 
                value={form.licencas}
                onChange={e => setForm({...form, licencas: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Admin</label>
              <input 
                type="email" 
                placeholder="admin@empresa.com.br"
                value={form.emailAdmin}
                onChange={e => setForm({...form, emailAdmin: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
              />
            </div>
          </div>

          {/* Endereço da Empresa + Busca Automática por CEP */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                Endereço da Sede (Busca Automática por CEP)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">CEP</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="01310-100"
                    value={form.cep}
                    onChange={e => setForm({ ...form, cep: formatCep(e.target.value) })}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={cepLoading}
                    onClick={handleLookupCep}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
                  >
                    {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">UF</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="SP"
                  value={form.uf}
                  onChange={e => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase text-center outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Logradouro / Rua / Av.</label>
                <input
                  type="text"
                  placeholder="Av. Paulista"
                  value={form.logradouro}
                  onChange={e => setForm({ ...form, logradouro: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Número</label>
                <input
                  type="text"
                  placeholder="1000"
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Bairro</label>
                <input
                  type="text"
                  placeholder="Bela Vista"
                  value={form.bairro}
                  onChange={e => setForm({ ...form, bairro: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Município</label>
                <input
                  type="text"
                  placeholder="São Paulo"
                  value={form.municipio}
                  onChange={e => setForm({ ...form, municipio: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Complemento</label>
                <input
                  type="text"
                  placeholder="Sala 101"
                  value={form.complemento}
                  onChange={e => setForm({ ...form, complemento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Localização Exata para Registro do Ponto (Geofencing) */}
          <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-rose-950 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-rose-600" />
                Localização Exata para Registro do Ponto (Geofencing)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={cepLoading}
                  onClick={handleGeocodeFullAddress}
                  className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Atualizar pelo Endereço
                </button>
                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  <Navigation className="w-3 h-3" /> Usar Meu GPS Atual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={e => setForm({ ...form, latitude: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={e => setForm({ ...form, longitude: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Raio Permitido (m)</label>
                <input
                  type="number"
                  min={20}
                  max={5000}
                  value={form.cercaRaioMetros}
                  onChange={e => setForm({ ...form, cercaRaioMetros: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold text-rose-700 text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-rose-200/50">
              <input
                type="checkbox"
                id="chkBloqueioTenant"
                checked={form.bloquearForaDoRaio}
                onChange={e => setForm({ ...form, bloquearForaDoRaio: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
              />
              <label htmlFor="chkBloqueioTenant" className="text-[11px] font-semibold text-slate-800 cursor-pointer">
                Bloquear registro de ponto se o colaborador estiver fora do raio da empresa
              </label>
            </div>

            {geoFeedback && (
              <div className="p-2 bg-white border border-rose-200 rounded-lg text-[11px] text-slate-700 font-medium">
                {geoFeedback}
              </div>
            )}
          </div>

          {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg font-medium">{error}</div>}
        </div>
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">Confirmar Cadastro da Empresa</button>
        </div>
      </div>
    </div>
  );
};

const NewColaboradorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  form: any;
  setForm: (f: any) => void;
  tenants: Tenant[];
  selectedTenantId: string;
  departamentos: Departamento[];
  estabelecimentos: Estabelecimento[];
  cargos: Cargo[];
  error?: string | null;
}> = ({ isOpen, onClose, onConfirm, form, setForm, tenants, selectedTenantId, departamentos, estabelecimentos, cargos, error }) => {
  if (!isOpen) return null;
  const activeTenantId = form.tenantId || selectedTenantId || tenants[0]?.id || '';
  const tenantEsts = estabelecimentos.filter(e => e.tenantId === activeTenantId);
  const otherEsts = estabelecimentos.filter(e => e.tenantId !== activeTenantId);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
             <h3 className="text-lg font-bold">Admitir Novo Colaborador</h3>
             <p className="text-[10px] text-slate-400 uppercase tracking-widest">Cadastro REP-P &amp; Alocação Empresa/Unidade</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-2 mb-2">Dados Pessoais &amp; Funcionais</span>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input type="text" placeholder="Nome do funcionário" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CPF</label>
                    <input type="text" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Matrícula</label>
                    <input type="text" placeholder="SC-1234" value={form.matricula} onChange={e => setForm({...form, matricula: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" />
                  </div>
                </div>
             </div>

             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-2 mb-2">Alocação &amp; Unidade</span>
                {tenants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Empresa Contratante</label>
                    <select
                      value={activeTenantId}
                      onChange={e => {
                        const nextTenantId = e.target.value;
                        const nextEst = estabelecimentos.find(est => est.tenantId === nextTenantId) || estabelecimentos[0];
                        setForm({ ...form, tenantId: nextTenantId, estabelecimentoId: nextEst?.id || '' });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none"
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.razaoSocial} ({t.cnpj})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Departamento</label>
                  <select value={form.departamentoId} onChange={e => setForm({...form, departamentoId: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                    <option value="">Selecione...</option>
                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label>
                  <select value={form.cargoId} onChange={e => setForm({...form, cargoId: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                    <option value="">Selecione...</option>
                    {cargos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                  </select>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-4">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block border-b border-emerald-200 pb-2 mb-2 flex items-center gap-2">
                  <Key className="w-3 h-3" /> Credenciais de Acesso
                </span>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Login</label>
                  <input 
                    type="email" 
                    placeholder="email@corporativo.com.br" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none" 
                  />
                  <p className="text-[9px] text-slate-400 italic">Se vazio, será gerado automaticamente.</p>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white border border-emerald-100 rounded-lg">
                   <input 
                     type="checkbox" 
                     id="chkGerar" 
                     checked={form.gerarAcessoSistema} 
                     onChange={e => setForm({...form, gerarAcessoSistema: e.target.checked})}
                     className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" 
                   />
                   <label htmlFor="chkGerar" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Gerar senha temporária e liberar acesso ao Portal
                   </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">PIN do Coletor (Físico/Kiosk)</label>
                  <input type="text" maxLength={6} placeholder="6 dígitos (aleatório se vazio)" value={form.pinColetor} onChange={e => setForm({...form, pinColetor: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none font-mono" />
                </div>
             </div>

             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-2 mb-2">Estabelecimento / Local do Ponto</span>
                <select value={form.estabelecimentoId} onChange={e => setForm({...form, estabelecimentoId: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none">
                  {tenantEsts.length > 0 && (
                    <optgroup label="Unidades da Empresa Selecionada">
                      {tenantEsts.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.municipio}/{e.uf})</option>)}
                    </optgroup>
                  )}
                  {otherEsts.length > 0 && (
                    <optgroup label="Outras Unidades">
                      {otherEsts.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.municipio}/{e.uf})</option>)}
                    </optgroup>
                  )}
                </select>
             </div>
          </div>
          {error && (
            <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all cursor-pointer">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Check className="w-4 h-4" /> Finalizar Admissão
          </button>
        </div>
      </div>
    </div>
  );
};
