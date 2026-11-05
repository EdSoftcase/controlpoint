import { UserRole } from './auth';

export type PermissionCategory = 
  | 'ponto'
  | 'espelho'
  | 'ajustes'
  | 'estrutura'
  | 'colaboradores'
  | 'fiscal'
  | 'seguranca';

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: PermissionCategory;
  categoryLabel: string;
  legalBasis?: string; // Portaria MTP 671 / Art. CLT
}

export const PERMISSION_CATEGORIES: { id: PermissionCategory; label: string; icon: string }[] = [
  { id: 'ponto', label: 'Marcação de Ponto & REP-P', icon: 'Clock' },
  { id: 'espelho', label: 'Espelho de Ponto & Cartão Ponto', icon: 'FileText' },
  { id: 'ajustes', label: 'Ajustes, Abonos & Horas Extras', icon: 'CheckSquare' },
  { id: 'estrutura', label: 'Estrutura Organizacional', icon: 'Building2' },
  { id: 'colaboradores', label: 'Gestão de Pessoas & RH', icon: 'Users' },
  { id: 'fiscal', label: 'Auditoria & Arquivos Fiscais (Portaria 671)', icon: 'ShieldCheck' },
  { id: 'seguranca', label: 'Segurança, Permissões & Multi-Tenant', icon: 'Key' },
];

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // 1. Marcação de Ponto & REP-P
  {
    key: 'ponto_registrar',
    label: 'Registrar Batida de Ponto',
    description: 'Efetuar marcação de ponto via Coletor Tablet, Desktop ou Mobile homologado REP-P.',
    category: 'ponto',
    categoryLabel: 'Marcação de Ponto & REP-P',
    legalBasis: 'Portaria MTP 671/2021 Art. 75'
  },
  {
    key: 'ponto_biometria',
    label: 'Autenticação Facial & Liveness',
    description: 'Utilizar validação biométrica facial com detecção de prova de vida em tempo real.',
    category: 'ponto',
    categoryLabel: 'Marcação de Ponto & REP-P',
    legalBasis: 'Portaria MTP 671/2021 Art. 77'
  },
  {
    key: 'ponto_geofence_bypass',
    label: 'Bypass de Cerca Geográfica (Geofence)',
    description: 'Permitir marcação de ponto fora do raio delimitado do estabelecimento.',
    category: 'ponto',
    categoryLabel: 'Marcação de Ponto & REP-P'
  },
  {
    key: 'ponto_offline',
    label: 'Contingência Offline com Hash SHA-256',
    description: 'Permitir registro e armazenamento local assinado quando não houver internet.',
    category: 'ponto',
    categoryLabel: 'Marcação de Ponto & REP-P',
    legalBasis: 'Portaria MTP 671/2021 Art. 83'
  },

  // 2. Espelho de Ponto
  {
    key: 'espelho_proprio',
    label: 'Visualizar Próprio Espelho de Ponto',
    description: 'Acessar extrato diário com entradas, saídas, intervalos e saldos do mês.',
    category: 'espelho',
    categoryLabel: 'Espelho de Ponto & Cartão Ponto',
    legalBasis: 'Portaria MTP 671/2021 Art. 84'
  },
  {
    key: 'espelho_equipe',
    label: 'Visualizar Espelho de Ponto da Equipe',
    description: 'Consultar cartões de ponto dos colaboradores subordinados ou do departamento.',
    category: 'espelho',
    categoryLabel: 'Espelho de Ponto & Cartão Ponto'
  },
  {
    key: 'espelho_geral',
    label: 'Visualizar Espelho de Toda a Empresa',
    description: 'Acessar espelhos de ponto de todos os colaboradores do tenant.',
    category: 'espelho',
    categoryLabel: 'Espelho de Ponto & Cartão Ponto'
  },
  {
    key: 'espelho_assinar',
    label: 'Assinatura Eletrônica do Espelho Mensal',
    description: 'Assinar eletronicamente o fechamento da folha e espelho de ponto mensal.',
    category: 'espelho',
    categoryLabel: 'Espelho de Ponto & Cartão Ponto',
    legalBasis: 'Portaria MTP 671/2021 Art. 84 §2º'
  },

  // 3. Ajustes, Abonos & Horas Extras
  {
    key: 'ajuste_solicitar',
    label: 'Solicitar Inclusão / Ajuste de Ponto',
    description: 'Enviar justificativas e anexar atestados médicos para batidas ausentes ou errôneas.',
    category: 'ajustes',
    categoryLabel: 'Ajustes, Abonos & Horas Extras',
    legalBasis: 'CLT Art. 473'
  },
  {
    key: 'ajuste_aprovar',
    label: 'Aprovar / Indeferir Solicitações de Ajuste',
    description: 'Decidir sobre abonos e ajustes de ponto sem adulteração do registro original no AFD.',
    category: 'ajustes',
    categoryLabel: 'Ajustes, Abonos & Horas Extras',
    legalBasis: 'Portaria MTP 671/2021 Art. 82'
  },
  {
    key: 'hora_extra_solicitar',
    label: 'Solicitar Autorização de Hora Extra',
    description: 'Requerer permissão formal para realização de jornada extraordinária.',
    category: 'ajustes',
    categoryLabel: 'Ajustes, Abonos & Horas Extras',
    legalBasis: 'CLT Art. 59'
  },
  {
    key: 'hora_extra_aprovar',
    label: 'Aprovar / Indeferir Horas Extras',
    description: 'Aprovar ou rejeitar solicitações de horas extras e compensações em banco de horas.',
    category: 'ajustes',
    categoryLabel: 'Ajustes, Abonos & Horas Extras',
    legalBasis: 'CLT Art. 59 §2º'
  },

  // 4. Estrutura Organizacional
  {
    key: 'estrutura_visualizar',
    label: 'Consultar Estrutura Organizacional',
    description: 'Visualizar departamentos, cargos, ocupações CBO e estabelecimentos cadastrados.',
    category: 'estrutura',
    categoryLabel: 'Estrutura Organizacional'
  },
  {
    key: 'departamentos_gerenciar',
    label: 'Cadastrar / Editar Departamentos',
    description: 'Criar setores, vincular gestores e estabelecer regras de antecedência de jornada.',
    category: 'estrutura',
    categoryLabel: 'Estrutura Organizacional'
  },
  {
    key: 'cargos_gerenciar',
    label: 'Cadastrar / Editar Cargos & CBO',
    description: 'Criar cargos, definir códigos CBO do MTE e cargas horárias semanais contratuais.',
    category: 'estrutura',
    categoryLabel: 'Estrutura Organizacional'
  },
  {
    key: 'estabelecimentos_gerenciar',
    label: 'Cadastrar / Editar Estabelecimentos & Cercas',
    description: 'Gerenciar Matriz, Filiais, coordenadas GPS e raios de cerca virtual (Geofence).',
    category: 'estrutura',
    categoryLabel: 'Estrutura Organizacional'
  },

  // 5. Gestão de Pessoas & RH
  {
    key: 'colaborador_visualizar',
    label: 'Visualizar Ficha Funcional de Colaboradores',
    description: 'Consultar dados cadastrais, cargo, departamento, regime CLT e histórico.',
    category: 'colaboradores',
    categoryLabel: 'Gestão de Pessoas & RH'
  },
  {
    key: 'colaborador_gerenciar',
    label: 'Cadastrar / Editar Colaboradores',
    description: 'Admitir, atualizar e gerenciar colaboradores com validação de CPF e matrícula.',
    category: 'colaboradores',
    categoryLabel: 'Gestão de Pessoas & RH'
  },
  {
    key: 'colaborador_credenciais',
    label: 'Emitir Credenciais de Acesso ao Sistema',
    description: 'Gerar e-mail corporativo e senha provisória criptografada no Supabase Auth.',
    category: 'colaboradores',
    categoryLabel: 'Gestão de Pessoas & RH'
  },

  // 6. Auditoria & Arquivos Fiscais
  {
    key: 'fiscal_exportar_afd',
    label: 'Exportar AFD Oficial (Portaria MTP 671)',
    description: 'Gerar e baixar o Arquivo Fonte de Dados no padrão oficial da inspeção do trabalho.',
    category: 'fiscal',
    categoryLabel: 'Auditoria & Arquivos Fiscais (Portaria 671)',
    legalBasis: 'Portaria MTP 671/2021 Anexo V'
  },
  {
    key: 'fiscal_exportar_aej',
    label: 'Exportar AEJ Fiscal (Arquivo Eletrônico de Jornada)',
    description: 'Gerar arquivo AEJ estruturado com cálculos, eventos e dados de colaboradores.',
    category: 'fiscal',
    categoryLabel: 'Auditoria & Arquivos Fiscais (Portaria 671)',
    legalBasis: 'Portaria MTP 671/2021 Anexo VI'
  },
  {
    key: 'fiscal_auditoria',
    label: 'Consultar Trilha de Auditoria & Imutabilidade',
    description: 'Verificar logs de eventos e integridade dos registros via hashes criptográficos SHA-256.',
    category: 'fiscal',
    categoryLabel: 'Auditoria & Arquivos Fiscais (Portaria 671)',
    legalBasis: 'LGPD Art. 37 & Portaria 671'
  },

  // 7. Segurança, Permissões & Multi-Tenant
  {
    key: 'permissoes_gerenciar',
    label: 'Configurar Matriz de Permissões (RBAC)',
    description: 'Atribuir ou revogar permissões por papel de usuário (Super Admin, RH, Gestor, Colaborador).',
    category: 'seguranca',
    categoryLabel: 'Segurança, Permissões & Multi-Tenant'
  },
  {
    key: 'tenants_gerenciar',
    label: 'Cadastrar / Gerenciar Empresas Empregadoras',
    description: 'Administrar contratos multi-tenant, planos contratados e limites de vidas ativas.',
    category: 'seguranca',
    categoryLabel: 'Segurança, Permissões & Multi-Tenant'
  },
  {
    key: 'config_api',
    label: 'Gerenciar Chaves Supabase & Conexão Backend',
    description: 'Acessar painel de chaves seguras, URL do projeto e status de sincronismo.',
    category: 'seguranca',
    categoryLabel: 'Segurança, Permissões & Multi-Tenant'
  }
];

export type RolePermissionsMap = Record<UserRole, string[]>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  SUPER_ADMIN: ALL_PERMISSIONS.map(p => p.key),
  RH_ADMIN: [
    'ponto_registrar',
    'ponto_biometria',
    'ponto_geofence_bypass',
    'ponto_offline',
    'espelho_proprio',
    'espelho_equipe',
    'espelho_geral',
    'espelho_assinar',
    'ajuste_solicitar',
    'ajuste_aprovar',
    'hora_extra_solicitar',
    'hora_extra_aprovar',
    'estrutura_visualizar',
    'departamentos_gerenciar',
    'cargos_gerenciar',
    'estabelecimentos_gerenciar',
    'colaborador_visualizar',
    'colaborador_gerenciar',
    'colaborador_credenciais',
    'fiscal_exportar_afd',
    'fiscal_exportar_aej',
    'fiscal_auditoria',
    'permissoes_gerenciar'
  ],
  GESTOR: [
    'ponto_registrar',
    'ponto_biometria',
    'ponto_offline',
    'espelho_proprio',
    'espelho_equipe',
    'espelho_assinar',
    'ajuste_solicitar',
    'ajuste_aprovar',
    'hora_extra_solicitar',
    'hora_extra_aprovar',
    'estrutura_visualizar',
    'colaborador_visualizar'
  ],
  COLABORADOR: [
    'ponto_registrar',
    'ponto_biometria',
    'ponto_offline',
    'espelho_proprio',
    'espelho_assinar',
    'ajuste_solicitar',
    'hora_extra_solicitar',
    'estrutura_visualizar'
  ]
};

export const ROLE_LABELS: Record<UserRole, { title: string; subtitle: string; color: string; bg: string }> = {
  SUPER_ADMIN: {
    title: 'Super Administrador',
    subtitle: 'Acesso Irrestrito, Multi-tenant e Chaves de Infraestrutura',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200'
  },
  RH_ADMIN: {
    title: 'RH & Departamento Pessoal',
    subtitle: 'Gestão Completa de Jornada, Cadastros e Compliance Portaria 671',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200'
  },
  GESTOR: {
    title: 'Gestor de Equipe',
    subtitle: 'Supervisão de Jornada, Aprovações de H.E. e Abonos da Equipe',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200'
  },
  COLABORADOR: {
    title: 'Colaborador (CLT)',
    subtitle: 'Registro de Ponto, Consulta de Espelho e Solicitação de Ajustes',
    color: 'text-slate-700',
    bg: 'bg-slate-50 border-slate-200'
  }
};
