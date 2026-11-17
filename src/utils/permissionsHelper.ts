import { UserRole } from '../types/auth';
import { DEFAULT_ROLE_PERMISSIONS, RolePermissionsMap } from '../types/permissions';

export function hasPermission(
  permissions: RolePermissionsMap | undefined,
  role: UserRole | undefined,
  key: string | null | undefined
): boolean {
  if (!key) return true;
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  const map = permissions || DEFAULT_ROLE_PERMISSIONS;
  const allowed = map[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
  return allowed.includes(key);
}

export const TAB_PERMISSION_MAP: Record<string, string | null> = {
  dashboard: null,
  relatorios: null,
  equipes: 'hora_extra_aprovar',
  coletor: 'ponto_registrar',
  biometria: 'ponto_biometria',
  feriados: 'estrutura_visualizar',
  ipa: 'colaborador_visualizar',
  empresa: 'colaborador_visualizar',
  estrutura: 'estrutura_visualizar',
  permissoes: 'permissoes_gerenciar',
  registros: 'fiscal_exportar_afd',
  tenants: 'tenants_gerenciar',
  config: 'config_api',
  escalas: 'colaborador_gerenciar',
  afastamentos: 'colaborador_gerenciar',
  exportador: 'fiscal_exportar_aej',
  riscos: 'fiscal_auditoria',
  mobile: 'ponto_registrar'
};
