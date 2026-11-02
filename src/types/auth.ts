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

export const REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  // 1. Perfil RH / Administrador do Empregador
  {
    user: {
      id: 'user-02',
      nome: 'Luciana Mendonça',
      email: 'rh@softcase.com.br',
      cpf: '234.567.890-12',
      role: 'RH_ADMIN',
      roleLabel: 'RH & Departamento Pessoal',
      tenantId: 'tenant-01',
      tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
      departamentoNome: 'Recursos Humanos & DP',
      cargoTitulo: 'Coordenadora de Recursos Humanos',
      mfaHabilitado: true
    },
    senhasAceitas: ['Rh@2026', 'Senha@123', 'rh123'],
    status: 'ATIVO'
  },
  // 2. Perfil Colaborador (Trabalhador) - Mariana
  {
    user: {
      id: 'user-04',
      nome: 'Mariana Silva Santos',
      email: 'mariana@softcase.com.br',
      cpf: '123.456.789-09',
      role: 'COLABORADOR',
      roleLabel: 'Colaborador (Trabalhador)',
      tenantId: 'tenant-01',
      tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
      departamentoNome: 'Engenharia de Software',
      cargoTitulo: 'Engenheira de Software Sênior',
      mfaHabilitado: false
    },
    senhasAceitas: ['Colab@2026', 'Senha@123', 'mariana123'],
    status: 'ATIVO'
  },
  // 3. Perfil Colaborador - Carlos
  {
    user: {
      id: 'user-05',
      nome: 'Carlos Eduardo Ferreira',
      email: 'carlos@softcase.com.br',
      cpf: '987.654.321-00',
      role: 'COLABORADOR',
      roleLabel: 'Colaborador (Trabalhador)',
      tenantId: 'tenant-01',
      tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
      departamentoNome: 'Recursos Humanos',
      cargoTitulo: 'Analista de Recursos Humanos',
      mfaHabilitado: false
    },
    senhasAceitas: ['Senha@123', 'carlos123'],
    status: 'ATIVO'
  },
  // 4. Perfil Super Admin da Softcase
  {
    user: {
      id: 'user-01',
      nome: 'Super Administrador Softcase',
      email: 'admin@softcase.com.br',
      cpf: '000.000.000-00',
      role: 'SUPER_ADMIN',
      roleLabel: 'Super Admin Softcase',
      tenantId: 'tenant-01',
      tenantNome: 'Softcase Plataforma Global',
      mfaHabilitado: true
    },
    senhasAceitas: ['Admin@2026', 'Senha@123', 'admin123'],
    status: 'ATIVO'
  },
  // 5. Perfil Gestor de Equipe
  {
    user: {
      id: 'user-03',
      nome: 'Roberto Albuquerque',
      email: 'gestor@softcase.com.br',
      cpf: '345.678.901-23',
      role: 'GESTOR',
      roleLabel: 'Gestor de Equipe',
      tenantId: 'tenant-01',
      tenantNome: 'Softcase Tecnologia e Sistemas Ltda',
      departamentoNome: 'Engenharia de Software',
      cargoTitulo: 'Líder Técnico',
      mfaHabilitado: false
    },
    senhasAceitas: ['Gestor@2026', 'Senha@123'],
    status: 'ATIVO'
  }
];

export const PRESET_USERS: AuthUser[] = REGISTERED_ACCOUNTS.map((acc) => acc.user);

/**
 * Serviço de autenticação simulada contra a base de usuários registrados
 */
export async function authenticateCredentials(
  identificador: string,
  senhaDigitada: string
): Promise<{
  success: boolean;
  user?: AuthUser;
  requiresMfa?: boolean;
  error?: string;
}> {
  // Simula latência realista de rede/criptografia (350ms)
  await new Promise((resolve) => setTimeout(resolve, 350));

  const cleanInput = (identificador || '').trim().toLowerCase();
  const digitsOnly = cleanInput.replace(/\D/g, '');

  if (!cleanInput) {
    return { success: false, error: 'Informe seu e-mail corporativo ou CPF.' };
  }

  if (!senhaDigitada) {
    return { success: false, error: 'Informe sua senha de acesso.' };
  }

  // Busca na lista de contas cadastradas por e-mail ou por CPF
  const account = REGISTERED_ACCOUNTS.find((acc) => {
    const emailMatch = acc.user.email.toLowerCase() === cleanInput;
    const cpfMatch = digitsOnly.length === 11 && acc.user.cpf.replace(/\D/g, '') === digitsOnly;
    return emailMatch || cpfMatch;
  });

  if (!account) {
    return {
      success: false,
      error: 'Usuário não encontrado. Verifique o e-mail ou CPF digitado.'
    };
  }

  if (account.status === 'BLOQUEADO') {
    return {
      success: false,
      error: 'Conta de usuário temporariamente bloqueada por segurança. Contate o suporte.'
    };
  }

  // Validação da senha
  const passwordMatch = account.senhasAceitas.some(
    (pwd) => pwd.toLowerCase() === senhaDigitada.trim().toLowerCase()
  );

  if (!passwordMatch) {
    return {
      success: false,
      error: 'Senha incorreta. Verifique suas credenciais e tente novamente.'
    };
  }

  return {
    success: true,
    user: account.user,
    requiresMfa: account.user.mfaHabilitado
  };
}
