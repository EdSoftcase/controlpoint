export interface FieldValidation {
  name: string;
  type: string;
  required: boolean;
  mask?: string;
  validationRule: string;
  businessImpact: string;
}

export interface ButtonAction {
  label: string;
  type: 'primary' | 'secondary' | 'danger' | 'ghost';
  shortcut?: string;
  loadingStateBehavior: string;
  actionDescription: string;
}

export interface BusinessRule {
  code: string;
  title: string;
  rule: string;
  legalImpact: string;
  invarianceLevel: 'CRITICAL' | 'STRICT' | 'STANDARD';
}

export interface PermissionItem {
  role: string;
  accessLevel: 'TOTAL' | 'CONSULTA' | 'CONDICIONAL' | 'SEM_ACESSO';
  description: string;
}

export interface ErrorMessageSpec {
  code: string;
  message: string;
  cause: string;
  resolution: string;
}

export interface ExpectedBehavior {
  scenario: string;
  expectedBehavior: string;
}

export interface TestCaseSpec {
  id: string;
  title: string;
  given: string;
  when: string;
  then: string;
  legalComplianceCheck: string;
}

export interface ScreenSpec {
  id: string;
  code: string;
  title: string;
  module: 
    | 'Módulo 01 — Administração da Plataforma' 
    | 'Módulo 02 — Cadastro e Estrutura Organizacional' 
    | 'Módulo 03 — Jornadas e Escalas'
    | 'Módulo 04 — Registro Eletrônico REP-P'
    | 'Módulo 05 — Aplicativo do Colaborador'
    | 'Módulo 06 — Coletor de Ponto'
    | 'Módulo 07 — Gestão de RH e Gestores'
    | 'Módulo 08 — Apuração e PTRP'
    | 'Módulo 09 — Relatórios e Integrações'
    | 'Módulo 10 — Segurança e Conformidade';
  subtitle: string;
  legalBasis: string[];
  aparenciaOrganizacao: {
    wireframeDescription: string;
    zones: { name: string; description: string; elements: string[] }[];
    gridResponsiveness: string;
  };
  camposEValidacoes: FieldValidation[];
  botoesEAcoes: ButtonAction[];
  regrasDeNegocio: BusinessRule[];
  permissoes: PermissionItem[];
  mensagensDeErro: ErrorMessageSpec[];
  comportamentosEsperados: ExpectedBehavior[];
  criteriosDeTeste: TestCaseSpec[];
}
