import {
  Tenant,
  Estabelecimento,
  ColetorTablet,
  Cargo,
  Departamento,
  Colaborador,
  RegistroPontoREPP,
  AuditLogItem
} from '../types/operational';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-01',
    cnpj: '00.000.000/0001-91',
    razaoSocial: 'Softcase Tecnologia e Sistemas Ltda',
    nomeFantasia: 'Softcase Matriz',
    slug: 'softcase-matriz',
    plano: 'REP-P Corporativo',
    licencasContratadas: 500,
    licencasEmUso: 3,
    status: 'ATIVO',
    dataAdesao: '2026-01-15',
    emailAdmin: 'admin@softcase.com.br'
  },
  {
    id: 'tenant-02',
    cnpj: '33.000.167/0001-01',
    razaoSocial: 'Indústrias Alfa Manufatura e Logística S/A',
    nomeFantasia: 'Alfa Logística',
    slug: 'alfa-logistica',
    plano: 'Pro',
    licencasContratadas: 200,
    licencasEmUso: 145,
    status: 'ATIVO',
    dataAdesao: '2026-02-10',
    emailAdmin: 'dp@alfamanufatura.com.br'
  },
  {
    id: 'tenant-03',
    cnpj: '60.701.190/0001-04',
    razaoSocial: 'Varejo Comercial Estrela S/A',
    nomeFantasia: 'Lojas Estrela',
    slug: 'lojas-estrela',
    plano: 'Starter',
    licencasContratadas: 50,
    licencasEmUso: 48,
    status: 'ATIVO',
    dataAdesao: '2026-02-28',
    emailAdmin: 'rh@lojasestrela.com.br'
  }
];

export const INITIAL_ESTABELECIMENTOS: Estabelecimento[] = [
  {
    id: 'est-01',
    tenantId: 'tenant-01',
    codigo: '0001',
    nome: 'Sede Administrativa - Av. Paulista',
    cnpj: '00.000.000/0001-91',
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
    nome: 'Centro de Desenvolvimento de Software',
    cnpj: '00.000.000/0002-72',
    tipo: 'FILIAL',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 150,
    latitude: -23.55052,
    longitude: -46.633308,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: 'Praça da Sé, 100 - Centro, São Paulo - SP',
    bloquearForaDoRaio: true
  },
  {
    id: 'est-03',
    tenantId: 'tenant-01',
    codigo: '0003',
    nome: 'Polo Logístico & Operações Faria Lima',
    cnpj: '00.000.000/0003-53',
    tipo: 'FILIAL',
    fusoHorario: 'America/Sao_Paulo',
    cercaRaioMetros: 200,
    latitude: -23.587416,
    longitude: -46.682025,
    uf: 'SP',
    municipio: 'São Paulo',
    enderecoCompleto: 'Av. Brig. Faria Lima, 3477 - Itaim Bibi, São Paulo - SP',
    bloquearForaDoRaio: false
  }
];

export const INITIAL_FERIADOS: import('../types/operational').Feriado[] = [
  // Feriados Nacionais (Lei 10.607/2002 e Lei 14.759/2023)
  {
    id: 'fer-01',
    tenantId: 'tenant-01',
    nome: 'Confraternização Universal (Ano Novo)',
    data: '2026-01-01',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-02',
    tenantId: 'tenant-01',
    nome: 'Sexta-Feira da Paixão',
    data: '2026-04-03',
    tipo: 'NACIONAL',
    recorrenteAnual: false,
    legislacaoBase: 'Lei Federal nº 9.093/1995',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-03',
    tenantId: 'tenant-01',
    nome: 'Tiradentes',
    data: '2026-04-21',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-04',
    tenantId: 'tenant-01',
    nome: 'Dia Mundial do Trabalho',
    data: '2026-05-01',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-05',
    tenantId: 'tenant-01',
    nome: 'Independência do Brasil',
    data: '2026-09-07',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-06',
    tenantId: 'tenant-01',
    nome: 'Nossa Senhora Aparecida (Padroeira do Brasil)',
    data: '2026-10-12',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 6.802/1980',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-07',
    tenantId: 'tenant-01',
    nome: 'Finados',
    data: '2026-11-02',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-08',
    tenantId: 'tenant-01',
    nome: 'Proclamação da República',
    data: '2026-11-15',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-09',
    tenantId: 'tenant-01',
    nome: 'Dia Nacional de Zumbi e da Consciência Negra',
    data: '2026-11-20',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 14.759/2023',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  {
    id: 'fer-10',
    tenantId: 'tenant-01',
    nome: 'Natal',
    data: '2026-12-25',
    tipo: 'NACIONAL',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Federal nº 10.607/2002',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  // Feriado Estadual SP
  {
    id: 'fer-11',
    tenantId: 'tenant-01',
    nome: 'Revolução Constitucionalista de 1932',
    data: '2026-07-09',
    tipo: 'ESTADUAL',
    uf: 'SP',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Estadual SP nº 9.497/1997',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  // Feriado Municipal São Paulo
  {
    id: 'fer-12',
    tenantId: 'tenant-01',
    nome: 'Aniversário da Cidade de São Paulo',
    data: '2026-01-25',
    tipo: 'MUNICIPAL',
    uf: 'SP',
    municipio: 'São Paulo',
    recorrenteAnual: true,
    legislacaoBase: 'Lei Municipal SP nº 14.485/2007',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: true
  },
  // Ponto Facultativo Corpus Christi
  {
    id: 'fer-13',
    tenantId: 'tenant-01',
    nome: 'Corpus Christi (Facultativo)',
    data: '2026-06-04',
    tipo: 'PONTO_FACULTATIVO',
    recorrenteAnual: false,
    legislacaoBase: 'Decreto Municipal SP / Portaria Federal MGI',
    adicionalHoraExtraPercentual: 100,
    geraFolgaCompensatoria: true,
    afetaDSR: false
  }
];

export const INITIAL_COLETORES: ColetorTablet[] = [
  {
    id: 'col-01',
    tenantId: 'tenant-01',
    estabelecimentoId: 'est-01',
    nome: 'Tablet Recepção Principal (Kiosk 01)',
    uuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    status: 'ONLINE',
    versaoApp: 'v1.0.4-repp',
    ultimoSincronismo: '2026-11-02 07:55:00'
  },
  {
    id: 'col-02',
    tenantId: 'tenant-01',
    estabelecimentoId: 'est-01',
    nome: 'Tablet Refeitório (Kiosk 02)',
    uuid: 'a4c5e891-72ef-4672-8821-39841f481c9a',
    status: 'ONLINE',
    versaoApp: 'v1.0.4-repp',
    ultimoSincronismo: '2026-11-02 07:54:12'
  }
];

export const INITIAL_CARGOS: Cargo[] = [
  {
    id: 'crg-01',
    tenantId: 'tenant-01',
    titulo: 'Engenheiro de Software Sênior',
    cbo: '2124-05',
    cboDescricao: 'Especialista em desenvolvimento de softwares',
    cargaHorariaSemanal: 40
  },
  {
    id: 'crg-02',
    tenantId: 'tenant-01',
    titulo: 'Analista de Recursos Humanos',
    cbo: '2524-05',
    cboDescricao: 'Profissionais de recursos humanos',
    cargaHorariaSemanal: 44
  },
  {
    id: 'crg-03',
    tenantId: 'tenant-01',
    titulo: 'Assistente Administrativo',
    cbo: '4110-10',
    cboDescricao: 'Assistente de escritório',
    cargaHorariaSemanal: 44
  }
];

export const INITIAL_DEPARTAMENTOS: Departamento[] = [
  {
    id: 'dep-01',
    tenantId: 'tenant-01',
    nome: 'Engenharia de Software',
    codigo: 'ENG-01',
    gestorId: 'user-03',
    gestorNome: 'Roberto Albuquerque',
    gestorEmail: 'gestor@softcase.com.br',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  },
  {
    id: 'dep-02',
    tenantId: 'tenant-01',
    nome: 'Recursos Humanos & Departamento Pessoal',
    codigo: 'RH-01',
    gestorId: 'user-02',
    gestorNome: 'Luciana Mendonça',
    gestorEmail: 'rh@softcase.com.br',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  },
  {
    id: 'dep-03',
    tenantId: 'tenant-01',
    nome: 'Operações e Infraestrutura',
    codigo: 'OPS-01',
    gestorId: 'user-06',
    gestorNome: 'Marcelo Vieira',
    gestorEmail: 'marcelo@softcase.com.br',
    horarioInicioPadrao: '08:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true
  }
];

export const INITIAL_COLABORADORES: Colaborador[] = [
  {
    id: 'colab-01',
    tenantId: 'tenant-01',
    nome: 'Mariana Silva Santos',
    cpf: '123.456.789-09',
    matricula: 'SC-0482',
    pis: '120.45892.15-4',
    dataAdmissao: '2025-03-01',
    cargoId: 'crg-01',
    cargoTitulo: 'Engenheiro de Software Sênior',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    gestorId: 'user-03',
    gestorNome: 'Roberto Albuquerque',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Sede Administrativa - Av. Paulista',
    regime: 'REGULAR',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '102030',
    status: 'ATIVO'
  },
  {
    id: 'colab-02',
    tenantId: 'tenant-01',
    nome: 'Carlos Eduardo Ferreira',
    cpf: '987.654.321-00',
    matricula: 'SC-0115',
    pis: '124.99281.82-1',
    dataAdmissao: '2024-08-15',
    cargoId: 'crg-02',
    cargoTitulo: 'Analista de Recursos Humanos',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    gestorId: 'user-02',
    gestorNome: 'Luciana Mendonça',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Sede Administrativa - Av. Paulista',
    regime: 'EXCECAO',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '554433',
    status: 'ATIVO'
  },
  {
    id: 'colab-03',
    tenantId: 'tenant-01',
    nome: 'Fernanda Lima Oliveira',
    cpf: '345.678.901-23',
    matricula: 'SC-0720',
    pis: '131.77492.33-9',
    dataAdmissao: '2026-01-08',
    cargoId: 'crg-03',
    cargoTitulo: 'Assistente Administrativo',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    gestorId: 'user-02',
    gestorNome: 'Luciana Mendonça',
    estabelecimentoId: 'est-01',
    estabelecimentoNome: 'Sede Administrativa - Av. Paulista',
    regime: 'REGULAR',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    cargaHorariaDiariaHoras: 8,
    intervaloMinutos: 60,
    maxMinutosAntecedenciaPermitido: 15,
    regraAntecedenciaAtiva: true,
    pinColetor: '908070',
    status: 'ATIVO'
  }
];

export const INITIAL_HORAS_EXTRAS: import('../types/operational').SolicitacaoHoraExtra[] = [
  {
    id: 'he-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    gestorId: 'user-03',
    gestorNome: 'Roberto Albuquerque',
    data: '2026-11-02',
    horarioContratado: '08:00 às 17:00 (8h diárias, 1h almoço)',
    horarioRealizado: '07:48 às 19:15',
    minutosExtras: 135,
    horasExtrasFormatadas: '02:15h',
    tipoHoraExtra: 'NORMAL_50',
    justificativa: 'Deploy em produção do release 1.0.4 e monitoramento pós-lançamento da API.',
    status: 'PENDENTE'
  },
  {
    id: 'he-02',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Carlos Eduardo Ferreira',
    colaboradorCpf: '987.654.321-00',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    gestorId: 'user-02',
    gestorNome: 'Luciana Mendonça',
    data: '2026-10-30',
    horarioContratado: '08:00 às 17:00 (8h diárias, 1h almoço)',
    horarioRealizado: '08:00 às 18:45',
    minutosExtras: 105,
    horasExtrasFormatadas: '01:45h',
    tipoHoraExtra: 'NORMAL_50',
    justificativa: 'Fechamento da folha de pagamento mensal e apuração de espelhos.',
    status: 'APROVADO',
    dataDecisao: '2026-10-31 09:12'
  }
];

export const INITIAL_REGISTROS: RegistroPontoREPP[] = [
  {
    nsr: 1,
    tenantId: 'tenant-01',
    empregadorRazaoSocial: 'Softcase Tecnologia e Sistemas Ltda',
    empregadorCnpj: '00.000.000/0001-91',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    colaboradorMatricula: 'SC-0482',
    dataHora: '2026-11-02T08:00:15-03:00',
    dataHoraFormatada: '02/11/2026 08:00:15',
    fusoHorario: '-03:00',
    coletorId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    tipoMarcacao: 'ENTRADA',
    hashSha256: '4a5e128b9f8471da9c0a6b7201d4a9ec85b2e9184fb27019f72b53a47981de54'
  },
  {
    nsr: 2,
    tenantId: 'tenant-01',
    empregadorRazaoSocial: 'Softcase Tecnologia e Sistemas Ltda',
    empregadorCnpj: '00.000.000/0001-91',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Carlos Eduardo Ferreira',
    colaboradorCpf: '987.654.321-00',
    colaboradorMatricula: 'SC-0115',
    dataHora: '2026-11-02T08:14:42-03:00',
    dataHoraFormatada: '02/11/2026 08:14:42',
    fusoHorario: '-03:00',
    coletorId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    tipoMarcacao: 'ENTRADA',
    hashSha256: '9b4f2c019d854e7a8b1c4e9f7a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-01',
    timestamp: '2026-11-02 07:45:10',
    tenantId: 'tenant-01',
    operador: 'Super Admin Softcase (sistema@softcase.com.br)',
    acao: 'PROVISIONAMENTO_TENANT',
    detalhes: 'Tenant "Softcase Matriz" provisionado com par de chaves REP-P ativo.',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'log-02',
    timestamp: '2026-11-02 07:55:00',
    tenantId: 'tenant-01',
    operador: 'Kiosk 01 (UUID: 9b1deb4d)',
    acao: 'SINCRONISMO_COLETOR',
    detalhes: 'Sincronização de relógio atômico HLB realizada (delta 0.04s).',
    hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
  }
];

/**
 * Geração oficial do AFD (Arquivo Fonte de Dados) conforme Portaria MTP 671/2021 Anexo V
 */
export function generateAFDContent(tenant: Tenant, registros: RegistroPontoREPP[]): string {
  const cnpjClean = tenant.cnpj.replace(/\D/g, '').padStart(14, '0');
  const razaoPadded = tenant.razaoSocial.padEnd(150, ' ').slice(0, 150);
  const now = new Date();
  const dataInicio = '01112026';
  const dataFim = '02112026';
  const dataGeracao = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  // Linha 000000000: Registro de Cabeçalho do Empregador
  let afd = `00000000011${cnpjClean}${razaoPadded}00000000000000000${dataInicio}${dataFim}${dataGeracao}\r\n`;

  // Linhas de detalhe (Registro tipo 3 - Marcação de Ponto)
  registros.forEach((r) => {
    const nsrStr = String(r.nsr).padStart(9, '0');
    const cpfClean = r.colaboradorCpf.replace(/\D/g, '').padStart(11, '0');
    const d = new Date(r.dataHora);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear());
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const dataHoraStr = `${dia}${mes}${ano}${hora}${min}`;
    const fusoClean = r.fusoHorario.replace(':', '');
    const hashClean = r.hashSha256.slice(0, 64);

    // Formato Portaria 671 Tipo 3
    afd += `${nsrStr}3${dataHoraStr}${fusoClean}${cpfClean}${hashClean}\r\n`;
  });

  // Linha de Trailer
  const totalRegistros = registros.length;
  const nsrTrailer = String(totalRegistros + 1).padStart(9, '0');
  afd += `${nsrTrailer}9${String(totalRegistros).padStart(9, '0')}\r\n`;

  return afd;
}

/**
 * Geração oficial do AEJ (Arquivo Eletrônico de Jornada) conforme Portaria MTP 671/2021 Anexo VI
 * Substituiu o antigo ACJEF para auditoria fiscal do trabalho e integração contábil.
 */
export function generateAEJContent(
  tenant: Tenant,
  colaboradores: Colaborador[],
  registros: RegistroPontoREPP[]
): string {
  const cnpjClean = tenant.cnpj.replace(/\D/g, '').padStart(14, '0');
  const now = new Date();
  const dataGeracao = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  // Registro 1: Cabeçalho do Empregador (Tipo 1, Versão 001, Sistema REP-P tipo 3)
  let aej = `1|001|3|${cnpjClean}|${tenant.razaoSocial.trim()}|2026-10-01|2026-11-30|${dataGeracao}\r\n`;

  // Registro 2: Cadastro de Trabalhadores (Tipo 2)
  colaboradores.forEach((c) => {
    const cpfClean = c.cpf.replace(/\D/g, '');
    aej += `2|${cpfClean}|${c.pis || '123.45678.90-1'}|${c.nome}|${c.matricula}|${c.cargoTitulo}|${c.dataAdmissao}\r\n`;
  });

  // Registro 3: Registros de Marcação (Tipo 3)
  registros.forEach((r) => {
    const cpfClean = r.colaboradorCpf.replace(/\D/g, '');
    const d = new Date(r.dataHora);
    const dataFmt = d.toISOString().slice(0, 10);
    const horaFmt = d.toTimeString().slice(0, 8);
    const gpsInfo = r.latitude && r.longitude ? `${r.latitude.toFixed(6)},${r.longitude.toFixed(6)}` : 'REPP_FACIAL_LOCAL';
    aej += `3|${String(r.nsr).padStart(9, '0')}|${cpfClean}|${dataFmt}|${horaFmt}|${r.tipoMarcacao}|${r.coletorId}|${gpsInfo}|${r.hashSha256}\r\n`;
  });

  // Registro 9: Trailer (Totalização)
  const totalLinhas = 1 + colaboradores.length + registros.length + 1;
  aej += `9|${totalLinhas}|${colaboradores.length}|${registros.length}\r\n`;

  return aej;
}

export const INITIAL_SOLICITACOES_AJUSTE: import('../types/operational').SolicitacaoAjustePonto[] = [
  {
    id: 'ajuste-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    gestorId: 'user-03',
    gestorNome: 'Roberto Albuquerque',
    data: '2026-10-20',
    tipo: 'ATESTADO_MEDICO',
    cid10: 'CID J06.9 (Infecção aguda das vias aéreas superiores)',
    nomeDocumentoAnexo: 'atestado_medico_mariana_20102026.pdf',
    dataHoraEnvio: '20/10/2026 14:30',
    justificativa: 'Atestado médico de 1 dia relativo a consulta e medicação emergencial.',
    status: 'APROVADO',
    respostaGestor: 'Atestado abonado conforme legislação CLT Art. 473.',
    dataDecisao: '21/10/2026 09:15'
  },
  {
    id: 'ajuste-02',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Carlos Eduardo Ferreira',
    colaboradorCpf: '987.654.321-00',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    gestorId: 'user-02',
    gestorNome: 'Luciana Mendonça',
    data: '2026-11-01',
    tipo: 'INCLUSAO_PONTO_ESQUECIDO',
    horarioAjuste: '17:05',
    tipoMarcacaoAjuste: 'SAIDA',
    dataHoraEnvio: '01/11/2026 18:00',
    justificativa: 'Esquecimento de registro na saída devido a reunião presencial até 17:05.',
    status: 'PENDENTE'
  }
];

export const INITIAL_ASSINATURAS_ESPELHO: import('../types/operational').AssinaturaEspelhoPonto[] = [
  {
    id: 'ass-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    mesAno: '2026-10',
    dataHoraAssinatura: '31/10/2026 17:45:12',
    hashAssinaturaSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    ipAddress: '177.135.24.12',
    dispositivoInfo: 'Chrome / Windows 11 (Autenticado via Portal do Colaborador)',
    status: 'ASSINADO'
  }
];

export const INITIAL_OCORRENCIAS_DESCONTO: import('../types/operational').OcorrenciaDesconto[] = [
  {
    id: 'ocorr-01',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    colaboradorMatricula: 'SC-0482',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    cargoTitulo: 'Engenheira de Software Sênior',
    data: '2026-10-29',
    tipo: 'ATRASO',
    horarioPrevisto: '08:00 às 17:00',
    horarioRealizado: '08:28 às 17:00',
    minutosPerdidos: 28,
    toleranciaAplicadaMinutos: 10,
    minutosADescontar: 28,
    valorHoraEstimado: 45.45,
    valorEstimadoDesconto: 21.21,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'PENDENTE_DESCONTO',
    justificativa: 'Problemas no trânsito na Marginal Pinheiros.'
  },
  {
    id: 'ocorr-02',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    colaboradorMatricula: 'SC-0482',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    cargoTitulo: 'Engenheira de Software Sênior',
    data: '2026-10-14',
    tipo: 'ATRASO',
    horarioPrevisto: '08:00 às 17:00',
    horarioRealizado: '08:45 às 17:00',
    minutosPerdidos: 45,
    toleranciaAplicadaMinutos: 10,
    minutosADescontar: 0,
    valorHoraEstimado: 45.45,
    valorEstimadoDesconto: 0,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'ABONADO_ATESTADO',
    justificativa: 'Consulta odontológica de urgência com declaração médica.',
    atestadoCid: 'CID K04.4 (Periodontite Apical Aguda)',
    dataTratamento: '15/10/2026 10:15',
    operadorTratamento: 'Luciana Mendonça (RH)'
  },
  {
    id: 'ocorr-03',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Carlos Eduardo Ferreira',
    colaboradorCpf: '987.654.321-00',
    colaboradorMatricula: 'SC-0115',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    cargoTitulo: 'Analista de Recursos Humanos',
    data: '2026-10-28',
    tipo: 'FALTA_INJUSTIFICADA',
    horarioPrevisto: '08:00 às 17:00 (8 horas)',
    horarioRealizado: 'Sem marcação (Ausência Integral)',
    minutosPerdidos: 480,
    toleranciaAplicadaMinutos: 0,
    minutosADescontar: 480,
    valorHoraEstimado: 25.00,
    valorEstimadoDesconto: 200.00,
    perdeDsr: true,
    valorDescontoDsr: 200.00,
    status: 'CONFIRMADO_DESCONTO',
    justificativa: 'Falta não justificada e sem atestado médico apresentado em 48h (CLT Art. 473).',
    dataTratamento: '30/10/2026 16:30',
    operadorTratamento: 'Luciana Mendonça (Coord. RH)'
  },
  {
    id: 'ocorr-04',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-02',
    colaboradorNome: 'Carlos Eduardo Ferreira',
    colaboradorCpf: '987.654.321-00',
    colaboradorMatricula: 'SC-0115',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    cargoTitulo: 'Analista de Recursos Humanos',
    data: '2026-10-23',
    tipo: 'SAIDA_ANTECIPADA',
    horarioPrevisto: '08:00 às 17:00',
    horarioRealizado: '08:00 às 16:10',
    minutosPerdidos: 50,
    toleranciaAplicadaMinutos: 10,
    minutosADescontar: 50,
    valorHoraEstimado: 25.00,
    valorEstimadoDesconto: 20.83,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'COMPENSADO_BANCO',
    justificativa: 'Saída antecipada autorizada pelo gestor para compensação em banco de horas.',
    dataTratamento: '24/10/2026 09:00',
    operadorTratamento: 'Roberto Albuquerque (Gestor)'
  },
  {
    id: 'ocorr-05',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-03',
    colaboradorNome: 'Fernanda Lima Oliveira',
    colaboradorCpf: '345.678.901-23',
    colaboradorMatricula: 'SC-0720',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    cargoTitulo: 'Assistente Administrativo',
    data: '2026-10-30',
    tipo: 'ATRASO',
    horarioPrevisto: '08:00 às 17:00',
    horarioRealizado: '08:35 às 17:00',
    minutosPerdidos: 35,
    toleranciaAplicadaMinutos: 10,
    minutosADescontar: 35,
    valorHoraEstimado: 15.00,
    valorEstimadoDesconto: 8.75,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'PENDENTE_DESCONTO',
    justificativa: 'Atraso nos transportes públicos.'
  },
  {
    id: 'ocorr-06',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-03',
    colaboradorNome: 'Fernanda Lima Oliveira',
    colaboradorCpf: '345.678.901-23',
    colaboradorMatricula: 'SC-0720',
    departamentoId: 'dep-02',
    departamentoNome: 'Recursos Humanos & Departamento Pessoal',
    cargoTitulo: 'Assistente Administrativo',
    data: '2026-10-16',
    tipo: 'INTERVALO_EXCEDIDO',
    horarioPrevisto: '12:00 às 13:00 (60 min)',
    horarioRealizado: '12:00 às 13:30 (90 min)',
    minutosPerdidos: 30,
    toleranciaAplicadaMinutos: 0,
    minutosADescontar: 30,
    valorHoraEstimado: 15.00,
    valorEstimadoDesconto: 7.50,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'PENDENTE_DESCONTO',
    justificativa: 'Excesso de intervalo de refeição não autorizado.'
  },
  {
    id: 'ocorr-07',
    tenantId: 'tenant-01',
    colaboradorId: 'colab-01',
    colaboradorNome: 'Mariana Silva Santos',
    colaboradorCpf: '123.456.789-09',
    colaboradorMatricula: 'SC-0482',
    departamentoId: 'dep-01',
    departamentoNome: 'Engenharia de Software',
    cargoTitulo: 'Engenheira de Software Sênior',
    data: '2026-11-03',
    tipo: 'SAIDA_ANTECIPADA',
    horarioPrevisto: '08:00 às 17:00',
    horarioRealizado: '08:00 às 16:30',
    minutosPerdidos: 30,
    toleranciaAplicadaMinutos: 10,
    minutosADescontar: 30,
    valorHoraEstimado: 45.45,
    valorEstimadoDesconto: 22.73,
    perdeDsr: false,
    valorDescontoDsr: 0,
    status: 'PENDENTE_DESCONTO',
    justificativa: 'Saída antecipada para compromisso médico particular.'
  }
];
