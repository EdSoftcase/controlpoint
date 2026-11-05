export type UserRole = 'SUPER_ADMIN' | 'RH_ADMIN' | 'GESTOR' | 'COLABORADOR';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  role: UserRole;
  roleLabel: string;
  tenantId: string;
  tenantNome: string;
  departamentoNome?: string;
  cargoTitulo?: string;
  mfaHabilitado: boolean;
}

export interface RegisteredAccount {
  user: AuthUser;
  senhasAceitas: string[];
  status: 'ATIVO' | 'BLOQUEADO';
  ultimoAcesso?: string;
}

// Global accounts list removed to favor real Supabase Auth
export const PRESET_USERS: AuthUser[] = [];
