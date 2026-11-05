import { ScreenSpec } from '../types/specification';

export const SPECIFICATION_SCREENS: ScreenSpec[] = [
  // ==========================================
  // MÓDULO 01 — ADMINISTRAÇÃO DA PLATAFORMA
  // ==========================================
  {
    id: 'adm-01',
    code: 'ADM-01',
    title: 'Painel Geral da Softcase (SaaS Master Dashboard)',
    module: 'Módulo 01 — Administração da Plataforma',
    subtitle: 'Visão executiva global de clientes contratantes, consumo de licenças e integridade de registros REP-P',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 73 a 84 - Governança REP-P)',
      'LGPD - Lei nº 13.709/2018 (Art. 46 - Segurança e Auditoria)',
      'Marco Civil da Internet (Lei nº 12.965/2014 - Guarda de Logs)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Layout desktop 1440px estruturado em barra lateral persistente (260px) com menu corporativo Softcase, barra superior de navegação com breadcrumbs e perfil do operador, e canvas principal com 4 cartões de indicadores executivos, grade analítica de tenants com alerta de consumo de licenças e gráfico de volume de marcações REP-P das últimas 24 horas.',
      zones: [
        {
          name: 'Zona 1: Faixa Superior de Métricas Globais',
          description: '4 métricas-chave em linha única com números tabulares e comparativo mensal.',
          elements: ['Total de Clientes Ativos', 'Licenças Contratadas vs. Em Uso', 'Coletores Conectados (Tablets/Mobile)', 'Marcações Processadas Hoje (REP-P)']
        },
        {
          name: 'Zona 2: Tabela de Tenants e Saúde Operacional',
          description: 'Grid tabular de alta densidade listando cada cliente corporativo com barra de busca rápida, filtro por status e ações contextuais.',
          elements: ['Razão Social / CNPJ', 'Plano Contratado', 'Capacidade de Licenças', 'Status Operacional', 'Última Transmissão AFD', 'Menu de Ações']
        },
        {
          name: 'Zona 3: Painel Lateral de Alertas Críticos',
          description: 'Feed de monitoramento com pendências jurídicas e técnicas dos clientes.',
          elements: ['Clientes com >95% de licenças atingidas', 'Coletores com atraso de sincronização de relógio > 30s', 'Certificados digitais com vencimento < 30 dias']
        }
      ],
      gridResponsiveness: 'Desktop padrão 1440px (3 colunas na faixa de indicadores, tabela de largura total com rolagem horizontal contida). Em tablets (>768px), o painel lateral de alertas colapsa para gaveta acionável.'
    },
    camposEValidacoes: [
      {
        name: 'Filtro de Busca de Cliente',
        type: 'Texto',
        required: false,
        mask: 'Livre / CNPJ',
        validationRule: 'Mínimo 2 caracteres; se digitado 14 números, aplica auto-máscara de CNPJ.',
        businessImpact: 'Localização instantânea de cliente sem recarregamento da página.'
      },
      {
        name: 'Filtro por Status do Cliente',
        type: 'Select Segmentado',
        required: true,
        validationRule: 'Valores permitidos: [Todos, Ativo, Em Implantação, Suspenso, Inadimplente]. Padrão: "Todos".',
        businessImpact: 'Permite à equipe de suporte e faturamento isolar contas bloqueadas ou ativas.'
      },
      {
        name: 'Filtro por Faixa de Licenças',
        type: 'Select',
        required: false,
        validationRule: 'Faixas: [Até 50 vidas, 51 a 200, 201 a 1000, Acima de 1000].',
        businessImpact: 'Segmentação por porte de cliente corporativo para gestão de capacidade de banco de dados.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Novo Cliente',
        type: 'primary',
        shortcut: 'Alt + N',
        loadingStateBehavior: 'Exibe spinner sutil e abre modal de onboarding de cliente.',
        actionDescription: 'Inicia o fluxo guiado de criação de novo tenant (empresa cliente).'
      },
      {
        label: 'Exportar Relatório Global',
        type: 'secondary',
        shortcut: 'Alt + E',
        loadingStateBehavior: 'Gera relatório executivo em CSV/PDF em background e dispara download seguro.',
        actionDescription: 'Exporta o consolidado de todos os clientes e consumo de licenças para auditoria financeira.'
      },
      {
        label: 'Ver Auditoria',
        type: 'ghost',
        loadingStateBehavior: 'Redireciona para tela ADM-04.',
        actionDescription: 'Abre a trilha forense de segurança de operações da plataforma.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ADM-01.1',
        title: 'Isolamento Absoluto de Dados Multi-tenant',
        rule: 'O painel ADM é de uso exclusivo da operadora Softcase. Nenhum cliente ou administrador de empresa pode ter acesso a dados ou métricas de outras empresas.',
        legalImpact: 'Conformidade com a LGPD e sigilo comercial.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-01.2',
        title: 'Integridade de Monitoramento do REP-P',
        rule: 'O totalizador de registros de ponto deve refletir exatamente a quantidade de NSRs (Número Sequencial de Registro) gerados no dia corrente por todos os coletores homologados.',
        legalImpact: 'Portaria 671/2021 Art. 76 — Garantia de unicidade e rastreabilidade dos registros.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-01.3',
        title: 'Alerta de Esgotamento de Licenças',
        rule: 'Quando um cliente atinge 95% ou 100% das licenças contratadas, o painel deve exibir status de alerta, mas a plataforma JAMAIS deve impedir o registro de ponto de colaboradores já cadastrados.',
        legalImpact: 'A legislação trabalhista proíbe a recusa arbitrária de marcação de jornada por motivo de cobrança.',
        invarianceLevel: 'STRICT'
      }
    ],
    permissoes: [
      { role: 'Super Admin Softcase', accessLevel: 'TOTAL', description: 'Acesso irrestrito a visualização, métricas, suspensão e ativação de tenants.' },
      { role: 'Suporte / Operações Softcase', accessLevel: 'CONSULTA', description: 'Visualização de métricas e diagnóstico técnico sem permissão de exclusão.' },
      { role: 'Administrador do Cliente', accessLevel: 'SEM_ACESSO', description: 'Não possui acesso a este painel global da fornecedora.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ADM-001',
        message: 'Falha ao sincronizar métricas em tempo real dos coletores.',
        cause: 'Instabilidade transitória na fila de telemetria.',
        resolution: 'O painel exibe dados do último snapshot com indicação visual de cache e botão de tentar novamente.'
      },
      {
        code: 'ERR-ADM-002',
        message: 'Acesso negado: credenciais administrativas Softcase ausentes ou expiradas.',
        cause: 'Tentativa de acesso com token de tenant comum ou sessão de Super Admin expirada.',
        resolution: 'Redirecionamento automático para login corporativo com MFA.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Abertura inicial da página',
        expectedBehavior: 'Carregamento com skeletons cinzas de altura idêntica às métricas; tempo de resposta <= 200ms; atualização periódica sem piscamento de tela.'
      },
      {
        scenario: 'Lista sem resultados na busca',
        expectedBehavior: 'Exibe mensagem amigável "Nenhum cliente encontrado para o termo pesquisado" com botão de limpar filtro.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ADM-01-01',
        title: 'Validação do isolamento de tenants no painel global',
        given: 'Um operador da Softcase logado com perfil de Super Admin',
        when: 'Visualiza a lista de empresas clientes no Painel ADM-01',
        then: 'Deve visualizar apenas os dados agregados permitidos e links individuais de impersonação auditada.',
        legalComplianceCheck: 'LGPD Art. 46 — Controles de acesso estritos.'
      },
      {
        id: 'CT-ADM-01-02',
        title: 'Soma exata de registros diários vs NSRs emitidos',
        given: '10 clientes ativos emitindo registros REP-P simultâneos',
        when: 'A métrica de marcações de hoje é consultada',
        then: 'A contagem deve bater com a soma dos registros gerados nos bancos de dados de todos os tenants sem perdas.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 83.'
      }
    ]
  },

  {
    id: 'adm-02',
    code: 'ADM-02',
    title: 'Cadastro e Gestão de Clientes Multi-tenant (Tenant Directory)',
    module: 'Módulo 01 — Administração da Plataforma',
    subtitle: 'Onboarding de empresas contratantes, provisionamento de subdomínio e ciclo de vida do cliente',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 74 e 75 - Identificação do Empregador)',
      'Código Civil (Art. 421 - Contratos Empresariais)',
      'LGPD (Lei nº 13.709/2018 - Responsabilidade do Operador e Controlador)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela mestre-detalhe composta por: (1) Cabeçalho com botão primário "+ Novo Cliente", estatísticas de clientes por plano; (2) Barra de filtros compostos (CNPJ, Razão Social, UF, Status); (3) Tabela densa com paginação de 20 itens por página; (4) Drawer lateral expansível contendo a ficha completa do cliente com abas: Dados Cadastrais, Licenças, Contratos, Coletores e Trilha de Auditoria.',
      zones: [
        {
          name: 'Zona 1: Cabeçalho e Ações Principais',
          description: 'Identificação da página e botão de ação primária de onboarding.',
          elements: ['Título "Gestão de Clientes"', 'Contador de Tenants Ativos/Total', 'Botão "+ Adicionar Cliente"', 'Botão "Importar em Lote"']
        },
        {
          name: 'Zona 2: Tabela de Gestão de Clientes',
          description: 'Grid com colunas essenciais para monitoramento e intervenção.',
          elements: ['Tenant ID / Subdomínio', 'Razão Social e CNPJ', 'Plano Atual', 'Vidas Ativas / Contratadas', 'Data de Adesão', 'Status', 'Ações (Editar, Suspender, Detalhes)']
        },
        {
          name: 'Zona 3: Modal de Onboarding (Novo Cliente)',
          description: 'Formulário em 3 etapas para criação de nova empresa contratante.',
          elements: ['Etapa 1: Dados Jurídicos (CNPJ com consulta)', 'Etapa 2: Plano & Licenças', 'Etapa 3: Administrador Raiz do Cliente']
        }
      ],
      gridResponsiveness: 'Tabela com rolagem horizontal nos breakpoints menores que 1024px. Drawer lateral ocupa 540px à direita em desktop e 100% da largura em telas menores.'
    },
    camposEValidacoes: [
      {
        name: 'CNPJ da Empresa Contratante',
        type: 'Texto com Máscara',
        required: true,
        mask: '99.999.999/9999-99',
        validationRule: 'Validação estrita de 14 dígitos com cálculo matemático dos 2 dígitos verificadores (módulo 11). Não aceita sequências repetidas.',
        businessImpact: 'Garante que o empregador seja uma pessoa jurídica real, pré-requisito legal para o REP-P.'
      },
      {
        name: 'Razão Social',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 3 caracteres, máximo 150 caracteres. Não pode conter apenas caracteres especiais.',
        businessImpact: 'Nome oficial que constará no Atestado Técnico, no AFD e no espelho de ponto.'
      },
      {
        name: 'Nome Fantasia',
        type: 'Texto',
        required: false,
        validationRule: 'Máximo 100 caracteres.',
        businessImpact: 'Exibição amigável no app do colaborador e coletor de ponto.'
      },
      {
        name: 'Identificador do Tenant (Slug / Subdomínio)',
        type: 'Texto Alfanumérico',
        required: true,
        validationRule: 'Somente letras minúsculas, números e hífens. Mínimo 3 caracteres. Deve ser estritamente ÚNICO em toda a plataforma Softcase.',
        businessImpact: 'Chave de particionamento de banco de dados e rota de acesso (ex: cliente.softcaseponto.com.br).'
      },
      {
        name: 'Plano Contratado',
        type: 'Select',
        required: true,
        validationRule: 'Deve ser um plano ativo cadastrado na tabela de planos da Softcase.',
        businessImpact: 'Define os limites de vidas, recursos liberados e valor faturado.'
      },
      {
        name: 'Quantidade de Licenças (Vidas)',
        type: 'Número Inteiro',
        required: true,
        validationRule: 'Mínimo 1, máximo 50.000.',
        businessImpact: 'Limite contratual de colaboradores ativos que o cliente pode cadastrar.'
      },
      {
        name: 'E-mail do Administrador Inicial',
        type: 'E-mail',
        required: true,
        validationRule: 'Formato RFC 5322 válido. Não pode ser e-mail descartável.',
        businessImpact: 'Destinatário do link seguro de ativação da conta da empresa.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Salvar e Provisionar Cliente',
        type: 'primary',
        loadingStateBehavior: 'Exibe "Provisionando banco de dados isolado..." e desativa o formulário durante a transação.',
        actionDescription: 'Cria o tenant, cria o schema do cliente, gera chaves criptográficas e envia convite ao admin da empresa.'
      },
      {
        label: 'Suspender Cliente',
        type: 'danger',
        loadingStateBehavior: 'Solicita confirmação com digitação do nome da empresa e motivo da suspensão.',
        actionDescription: 'Bloqueia o acesso ao portal web da empresa por inadimplência ou encerramento de contrato.'
      },
      {
        label: 'Reativar Cliente',
        type: 'secondary',
        loadingStateBehavior: 'Exibe spinner e restaura permissões operacionais do tenant.',
        actionDescription: 'Restaura a operação plena do cliente após regularização.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ADM-02.1',
        title: 'Unicidade de CNPJ no Sistema',
        rule: 'Não é permitido cadastrar dois clientes corporativos com o mesmo CNPJ Raiz (primeiros 8 dígitos), a menos que se trate de contrato corporativo com filiais unificadas.',
        legalImpact: 'Evita duplicidade de contratos e inconsistências tributárias.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-02.2',
        title: 'Preservação de Registros Históricos em Caso de Suspensão',
        rule: 'A suspensão de um cliente suspende o acesso ao portal administrativo, mas os dados históricos de ponto, arquivos AFD e espelhos devem ser mantidos intactos por no mínimo 5 anos conforme legislação trabalhista.',
        legalImpact: 'CLT Art. 11 e Portaria 671/2021 — Prazo prescricional trabalhista e fiscalizatório.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-02.3',
        title: 'Geração de Certificado e Chave Criptográfica por Tenant',
        rule: 'Ao provisionar uma nova empresa, o sistema deve gerar automaticamente um par de chaves assimétricas dedicadas para assinatura eletrônica dos comprovantes REP-P daquela empresa.',
        legalImpact: 'Portaria 671/2021 Art. 83 — Autenticidade e integridade dos comprovantes de marcação.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Super Admin Softcase', accessLevel: 'TOTAL', description: 'Criação, edição cadastral, suspensão e cancelamento de tenants.' },
      { role: 'Comercial / Suporte Softcase', accessLevel: 'CONDICIONAL', description: 'Criação de novos clientes e consulta, sem poder de cancelamento de dados.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ADM-0201',
        message: 'CNPJ inválido ou com dígitos verificadores incorretos.',
        cause: 'O usuário digitou um número com cálculo do módulo 11 inválido.',
        resolution: 'Corrija o CNPJ conferindo o comprovante de inscrição no site da Receita Federal.'
      },
      {
        code: 'ERR-ADM-0202',
        message: 'Subdomínio já em uso por outro cliente na plataforma.',
        cause: 'O slug informado já existe na tabela de tenants.',
        resolution: 'Escolha outro identificador alfanumérico para a URL do cliente.'
      },
      {
        code: 'ERR-ADM-0203',
        message: 'Limite de licenças deve ser maior ou igual ao número atual de colaboradores ativos.',
        cause: 'Tentativa de downgrade de licenças para um valor inferior ao total de vidas em uso.',
        resolution: 'Desative os colaboradores desligados antes de reduzir o pacote de licenças contratadas.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Digitação de CNPJ existente',
        expectedBehavior: 'O sistema realiza checagem assíncrona com debounce de 400ms e avisa se o CNPJ já está ativo na plataforma antes do envio.'
      },
      {
        scenario: 'Provisionamento bem-sucedido',
        expectedBehavior: 'Fecha o modal, emite notificação toast verde "Cliente [Nome] cadastrado com sucesso", inclui a nova linha no topo da tabela e dispara e-mail de ativação.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ADM-02-01',
        title: 'Rejeição de CNPJs inválidos e repetidos',
        given: 'Formulário de novo cliente aberto',
        when: 'O usuário digita "11.111.111/1111-11" ou um CNPJ com dígito verificador errado',
        then: 'O botão de salvar permanece desabilitado e uma mensagem de erro vermelha aparece abaixo do campo.',
        legalComplianceCheck: 'Validação oficial da Receita Federal.'
      },
      {
        id: 'CT-ADM-02-02',
        title: 'Geração imediata de credenciais de assinatura REP-P',
        given: 'Novo cliente validado e salvo com sucesso',
        when: 'O tenant é criado no banco de dados',
        then: 'O registro deve possuir chave pública/privada para assinatura e identificador de software gerado.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 75 § 1º.'
      }
    ]
  },

  {
    id: 'adm-03',
    code: 'ADM-03',
    title: 'Gestão de Planos, Assinaturas e Licenças (Plans & Limits)',
    module: 'Módulo 01 — Administração da Plataforma',
    subtitle: 'Parametrização de pacotes comerciais, recursos do sistema e limites operacionais por empresa',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Normas de comercialização de REP-P)',
      'Código de Defesa do Consumidor e Marco Civil da Internet'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela de 2 zonas estruturada com: (1) Grade de cartões de planos comerciais ativos (ex: Starter, Pro, Enterprise, REP-P Corporativo), com detalhamento de faixa de vidas, preço por vida adicional e toggles de módulos inclusos; (2) Tabela inferior de matriz comparativa de recursos (App Colaborador, Coletor Tablet Kiosk, Reconhecimento Facial, Ponto por Exceção, Exportação AFD/AEJ, Integração Folha CNAB/API).',
      zones: [
        {
          name: 'Zona 1: Catálogo de Planos Comerciais',
          description: 'Cartões horizontais dos planos cadastrados com botão de edição de limites e precificação.',
          elements: ['Nome do Plano', 'Faixa de Vidas (Mín/Máx)', 'Valor Base Mensal', 'Módulos Inclusos', 'Clientes Vinculados']
        },
        {
          name: 'Zona 2: Matriz de Recursos e Módulos',
          description: 'Lista de permissões funcionais parametrizáveis por plano.',
          elements: ['Módulo Coletor Tablet (Kiosk)', 'Módulo Reconhecimento Facial', 'Módulo Banco de Horas Avançado', 'Módulo Ponto por Exceção (CLT Art. 74 § 4º)', 'Exportação de Folha de Pagamento']
        }
      ],
      gridResponsiveness: 'Grid de planos responsivo (3 colunas em desktop 1440px, 2 colunas em notebook 1024px e 1 coluna em tablet).'
    },
    camposEValidacoes: [
      {
        name: 'Nome do Plano',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 3 caracteres, alfanumérico.',
        businessImpact: 'Identificação contratual e na fatura do cliente.'
      },
      {
        name: 'Limite Máximo de Vidas Padrão',
        type: 'Número',
        required: true,
        validationRule: 'Número inteiro > 0.',
        businessImpact: 'Teto operacional antes de acionar cobrança excedente.'
      },
      {
        name: 'Limite de Coletores Tablets Permitidos',
        type: 'Número',
        required: true,
        validationRule: 'Número inteiro >= 0.',
        businessImpact: 'Controla a quantidade de tablets físicos de ponto compartilhado autorizados.'
      },
      {
        name: 'Recurso: Reconhecimento Facial com Liveness',
        type: 'Toggle Booleano',
        required: true,
        validationRule: 'Verdadeiro ou Falso.',
        businessImpact: 'Habilita IA anti-fraude na marcação mobile e tablet.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Criar Novo Plano',
        type: 'primary',
        loadingStateBehavior: 'Abre drawer de configuração de plano.',
        actionDescription: 'Permite criar uma nova oferta comercial para novos contratos.'
      },
      {
        label: 'Salvar Alterações de Limites',
        type: 'secondary',
        loadingStateBehavior: 'Aplica novos limites sem interromper tenants existentes.',
        actionDescription: 'Atualiza parametrizações para novas contratações.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ADM-03.1',
        title: 'Módulo REP-P e AFD Obrigatório em Todos os Planos',
        rule: 'A emissão de comprovante ao colaborador e a exportação do arquivo AFD nunca podem ser desabilitadas ou vendidas como "adicional pago", pois constituem exigência legal da Portaria 671/2021.',
        legalImpact: 'Portaria 671/2021 Art. 83 e 84 — Requisitos mandatórios do sistema.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-03.2',
        title: 'Vigência de Contratos em Alterações de Planos',
        rule: 'Modificações de preço ou limites em um plano não afetam clientes com contratos vigentes até a data de renovação.',
        legalImpact: 'Segurança jurídica e direito adquirido contratual.',
        invarianceLevel: 'STANDARD'
      }
    ],
    permissoes: [
      { role: 'Super Admin Softcase', accessLevel: 'TOTAL', description: 'Criação e edição de planos comerciais e políticas de licenciamento.' },
      { role: 'Outros Perfis', accessLevel: 'SEM_ACESSO', description: 'Sem acesso a configurações comerciais da fornecedora.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ADM-0301',
        message: 'Não é possível excluir plano vinculado a clientes ativos.',
        cause: 'Existem empresas contratantes atreladas a este pacote.',
        resolution: 'Migre as empresas ativas para outro plano antes de arquivar este pacote.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Edição de limites de plano',
        expectedBehavior: 'Exibe indicador visual de quantas empresas serão impactadas na próxima renovação contratual.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ADM-03-01',
        title: 'Impossibilidade de desativar recursos regulatórios do REP-P',
        given: 'Formulário de criação ou edição de plano comercial',
        when: 'O operador inspeciona os switches de AFD e Comprovante de Ponto',
        then: 'Os switches devem estar permanentemente marcados como "Obrigatório por Lei" e desabilitados para desativação.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 83 e 84.'
      }
    ]
  },

  {
    id: 'adm-04',
    code: 'ADM-04',
    title: 'Trilha de Auditoria Global Softcase (Platform Security & Audit)',
    module: 'Módulo 01 — Administração da Plataforma',
    subtitle: 'Registro cronológico imutável de ações operacionais e eventos de segurança em conformidade com a LGPD',
    legalBasis: [
      'LGPD - Lei nº 13.709/2018 (Art. 37 - Registro das Operações de Tratamento)',
      'Portaria MTP nº 671/2021 (Art. 73 a 84 - Não-repúdio e Rastreabilidade)',
      'Marco Civil da Internet (Lei nº 12.965/2014 - Art. 15)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela de investigação forense com: (1) Barra de filtros avançados por Intervalo de Data/Hora, Usuário Operador, IP de Origem, Tenant Afetado e Categoria de Ação; (2) Tabela de registros auditados em formato monospaçado e tabular; (3) Modal de inspeção com payload JSON do evento antes e depois da modificação.',
      zones: [
        {
          name: 'Zona 1: Filtros de Investigação',
          description: 'Seleção precisa de eventos com suporte a busca textual livre.',
          elements: ['Data Inicial / Final', 'Tenant de Origem', 'Operador Responsável', 'Tipo de Ação (Login, Suspensão, Alteração de Limites)', 'Nível de Criticidade']
        },
        {
          name: 'Zona 2: Tabela de Logs Imutáveis',
          description: 'Grid com ordenação cronológica decrescente estrita.',
          elements: ['Timestamp UTC com fuso BRT', 'Hash do Registro (SHA-256)', 'Operador', 'Tenant', 'Ação Realizada', 'IP / User-Agent', 'Botão "Inspecionar Payload"']
        }
      ],
      gridResponsiveness: 'Layout de alta densidade otimizado para desktop 1440px com fonte tabular monospaçada para timestamps e hashes.'
    },
    camposEValidacoes: [
      {
        name: 'Período de Consulta',
        type: 'Intervalo de Datas',
        required: true,
        validationRule: 'Intervalo máximo de 90 dias por consulta para performance.',
        businessImpact: 'Garante tempos de resposta rápidos em bases com milhões de eventos.'
      },
      {
        name: 'Hash de Integridade',
        type: 'Texto Hexadecimal (SHA-256)',
        required: false,
        validationRule: '64 caracteres hexadecimais.',
        businessImpact: 'Permite buscar um evento específico para validação pericial.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Exportar Trilha Forense (CSV Assinado)',
        type: 'primary',
        shortcut: 'Alt + X',
        loadingStateBehavior: 'Calcula hash criptográfico do arquivo gerado e entrega download com checksum.',
        actionDescription: 'Gera documento pericial auditável para comprovação em juízo ou auditoria do MTP.'
      },
      {
        label: 'Verificar Encadeamento Criptográfico',
        type: 'secondary',
        loadingStateBehavior: 'Executa verificação de integridade da cadeia de blocos de logs.',
        actionDescription: 'Comprova que nenhum registro foi apagado ou adulterado na base de dados.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ADM-04.1',
        title: 'Imutabilidade Estrita dos Logs (Write-Once-Read-Many)',
        rule: 'Os registros de auditoria NUNCA podem ser alterados ou excluídos, nem mesmo pelo Super Administrador da Softcase. Apenas inserções contínuas são permitidas.',
        legalImpact: 'Portaria 671/2021 e Código de Processo Civil — Validade probatória de documentos digitais.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ADM-04.2',
        title: 'Guarda Obrigatória por 5 Anos',
        rule: 'Todos os logs relativos a modificações em empresas, planos e parâmetros de ponto devem ser preservados por no mínimo 5 anos.',
        legalImpact: 'Prazo prescricional trabalhista (CF/88 Art. 7º XXIX).',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Super Admin Softcase', accessLevel: 'TOTAL', description: 'Consulta e exportação forense de logs de todos os tenants.' },
      { role: 'Encarregado de Dados (DPO) Softcase', accessLevel: 'TOTAL', description: 'Inspeção e atendimento a solicitações da ANPD e titulares.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ADM-0401',
        message: 'Falha na validação do hash de integridade: encadeamento rompido.',
        cause: 'Indício de anomalia ou corrupção no armazenamento de logs.',
        resolution: 'Acionar imediatamente o comitê de segurança e engenharia da Softcase.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Consulta de log com hash inválido',
        expectedBehavior: 'Apresenta alerta visual com badge vermelho alertando discrepância criptográfica.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ADM-04-01',
        title: 'Impossibilidade de exclusão de logs via API ou interface',
        given: 'Um operador com perfil de Super Admin logado',
        when: 'Tenta emitir requisição DELETE para a rota de logs de auditoria',
        then: 'O servidor deve responder com status HTTP 405 Method Not Allowed e gravar um alerta de tentativa indevida.',
        legalComplianceCheck: 'Segurança e integridade LGPD / MTP.'
      }
    ]
  },

  // ==========================================
  // MÓDULO 02 — CADASTRO E ESTRUTURA ORGANIZACIONAL
  // ==========================================
  {
    id: 'org-01',
    code: 'ORG-01',
    title: 'Cadastro da Empresa Empregadora (Identificação Legal Portaria 671)',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Parametrização dos dados fiscais e jurídicos da empresa cliente exigidos pelo REP-P e PTRP',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 74 - Informações Obrigatórias do Empregador)',
      'Portaria MTP nº 671/2021 (Art. 75 - Registro do Programa REP-P no MTP)',
      'CLT - Consolidação das Leis do Trabalho (Art. 74)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela de formulário corporativo em 4 blocos visuais bem delimitados por divisores discretos: (1) Bloco Legal: Razão Social, Nome Fantasia, CNPJ/CPF do Empregador, Inscrições; (2) Bloco de Localização Fiscal: Endereço completo, CEP, Município, UF e Fuso Horário Legal; (3) Bloco de Instrumento Regulatório: Tipo de Acordo/CCT autorizador do REP-P conforme Art. 75 e vigência; (4) Bloco do Responsável Legal perante o MTP.',
      zones: [
        {
          name: 'Zona 1: Dados do Empregador (Portaria 671 Art. 74)',
          description: 'Campos que constarão obrigatoriamente no cabeçalho do arquivo AFD, nos comprovantes e no espelho de ponto.',
          elements: ['Tipo de Inscrição (CNPJ / CPF / CAEPF / CNO)', 'Número de Inscrição Formatado', 'Razão Social Completa', 'CNAE Principal']
        },
        {
          name: 'Zona 2: Endereço e Fuso Horário',
          description: 'Parâmetros territoriais para a apuração da jornada e sincronização de horário.',
          elements: ['CEP (com busca automática)', 'Logradouro, Número, Complemento, Bairro, Cidade, UF', 'Fuso Horário Padrão (Horário de Brasília UTC-3 ou Regional)']
        },
        {
          name: 'Zona 3: Instrumento Coletivo / Autorização Legal REP-P',
          description: 'Vínculo com o acordo que autorizou a utilização de sistema eletrônico alternativo.',
          elements: ['Tipo de Instrumento (Acordo Coletivo de Trabalho / Convenção Coletiva)', 'Número de Registro no Sistema MEDIADOR do MTP', 'Upload do Termo em PDF', 'Data de Início e Término da Vigência']
        },
        {
          name: 'Zona 4: Responsável Legal pelo Ponto',
          description: 'Pessoa física com poderes de representação que assinará o Atestado Técnico.',
          elements: ['Nome Completo', 'CPF', 'Cargo', 'E-mail Corporativo', 'Telefone de Contato']
        }
      ],
      gridResponsiveness: 'Grid de 2 colunas simétricas em desktop (1440px), colapsando em coluna única em telas móveis e tablets.'
    },
    camposEValidacoes: [
      {
        name: 'Tipo de Inscrição do Empregador',
        type: 'Select',
        required: true,
        validationRule: 'Valores válidos: [CNPJ, CPF (Empregador Doméstico/Produtor Rural), CAEPF, CNO].',
        businessImpact: 'Define o formato do cabeçalho do Arquivo Fonte de Dados (AFD) conforme Portaria 671 Anexo V.'
      },
      {
        name: 'Número de Inscrição (CNPJ/CPF)',
        type: 'Texto com Máscara',
        required: true,
        mask: '99.999.999/9999-99 ou 999.999.999-99',
        validationRule: 'Validação matemática estrita de dígitos verificadores (módulo 11).',
        businessImpact: 'Identificador único do empregador no Ministério do Trabalho e Previdência.'
      },
      {
        name: 'Razão Social Completa',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 3 caracteres, sem caracteres inválidos. Deve coincidir com o cartão CNPJ.',
        businessImpact: 'Impresso em todos os comprovantes de marcação emitidos aos colaboradores.'
      },
      {
        name: 'CNAE Principal',
        type: 'Texto com Máscara',
        required: true,
        mask: '9999-9/99',
        validationRule: '7 dígitos correspondentes à tabela oficial do IBGE/Concla.',
        businessImpact: 'Determina regras de enquadramento sindical e adicionais de insalubridade/periculosidade.'
      },
      {
        name: 'Fuso Horário Padrão do Empregador',
        type: 'Select',
        required: true,
        validationRule: 'Opções: [America/Sao_Paulo (UTC-3 Brasília), America/Manaus (UTC-4), America/Rio_Branco (UTC-5), America/Noronha (UTC-2)].',
        businessImpact: 'Referência legal obrigatória para timestamp dos registros e prevenção de adulteração de horas.'
      },
      {
        name: 'Número de Registro no MEDIADOR MTP',
        type: 'Texto',
        required: false,
        validationRule: 'Formato padrão: UF000000/AAAA.',
        businessImpact: 'Comprova perante a Auditoria-Fiscal do Trabalho a legalidade do acordo coletivo para ponto por exceção ou escalas especiais.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Salvar Configurações Legais',
        type: 'primary',
        shortcut: 'Ctrl + S',
        loadingStateBehavior: 'Exibe "Validando regras junto à Portaria 671..." com bloqueio temporário do formulário.',
        actionDescription: 'Persiste os dados da empresa e recalcula parâmetros de cabeçalho para futuros AFDs.'
      },
      {
        label: 'Emitir Atestado Técnico e Termo de Responsabilidade',
        type: 'secondary',
        shortcut: 'Alt + P',
        loadingStateBehavior: 'Gera PDF oficial conforme modelo da Portaria 671/2021 com assinatura digital.',
        actionDescription: 'Gera o documento regulatório obrigatório assinado pelo desenvolvedor Softcase e pelo empregador.'
      },
      {
        label: 'Cancelar Alterações',
        type: 'ghost',
        loadingStateBehavior: 'Restaura os valores salvos no banco.',
        actionDescription: 'Descarta modificações não persistidas no formulário.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-01.1',
        title: 'Imutabilidade Histórica da Razão Social em Registros Emitidos',
        rule: 'Se a empresa alterar sua Razão Social, a alteração terá validade a partir da data da alteração cadastral. Os registros antigos (NSRs anteriores) mantêm o cabeçalho original arquivado no AFD histórico.',
        legalImpact: 'Portaria 671/2021 Art. 84 § 2º — Proibição de reescrita retroativa de dados do AFD.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-01.2',
        title: 'Obrigatoriedade de Fuso Horário Legal Brasileiro',
        rule: 'Todas as marcações do REP-P devem registrar a data, hora e fuso horário oficial (Offset UTC) correspondente à localidade física do estabelecimento do trabalhador.',
        legalImpact: 'Portaria 671/2021 Art. 78 — Exatidão cronológica e sincronização oficial com a Hora Legal Brasileira (HLB/Observatório Nacional).',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-01.3',
        title: 'Validação de Instrumento Coletivo para Ponto por Exceção',
        rule: 'A empresa somente poderá habilitar a modalidade de "Ponto por Exceção" se preencher o campo do Acordo Coletivo e anexar a certidão do MEDIADOR válida.',
        legalImpact: 'CLT Art. 74 § 4º — "Fica permitida a utilização de registro de ponto por exceção à jornada regular de trabalho, mediante acordo individual escrito, convenção coletiva ou acordo coletivo de trabalho".',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Edição dos dados cadastrais da própria empresa e emissão de atestados.' },
      { role: 'Analista de RH / DP', accessLevel: 'CONSULTA', description: 'Visualização dos dados fiscais sem permissão de alteração do CNPJ raiz.' },
      { role: 'Gestor / Colaborador', accessLevel: 'SEM_ACESSO', description: 'Sem permissão de acesso a configurações institucionais da empresa.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0101',
        message: 'CNPJ do empregador inválido. Verifique o número digitado.',
        cause: 'Dígitos verificadores do CNPJ falharam no cálculo matemático.',
        resolution: 'Insira o número exato constante no Comprovante de Inscrição e Situação Cadastral da RFB.'
      },
      {
        code: 'ERR-ORG-0102',
        message: 'A data de vigência do Acordo Coletivo no MEDIADOR está expirada.',
        cause: 'A data de término informada é anterior à data de hoje.',
        resolution: 'Renove o acordo com o sindicato laboral ou desabilite as regras de flexibilização de jornada.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Preenchimento do CEP',
        expectedBehavior: 'Ao digitar 8 dígitos de CEP válidos, o sistema consulta a base de endereços e autopreenche Logradouro, Bairro, Cidade e UF em < 300ms.'
      },
      {
        scenario: 'Tentativa de alteração do CNPJ após emissão de registros de ponto',
        expectedBehavior: 'O campo CNPJ é bloqueado para edição direta; uma mensagem explica que alterações de CNPJ exigem criação de nova entidade ou sucessão trabalhista registrada na auditoria.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-01-01',
        title: 'Bloqueio de alteração arbitrária de CNPJ com registros emitidos',
        given: 'Uma empresa com 100 registros de ponto já gerados no mês',
        when: 'O usuário tenta alterar o CNPJ no formulário ORG-01',
        then: 'O campo deve estar desabilitado (disabled/read-only) com tooltip explicativo do requisito legal.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 74 — Integridade do registro empregador no AFD.'
      },
      {
        id: 'CT-ORG-01-02',
        title: 'Emissão fiel do Atestado Técnico e Termo de Responsabilidade',
        given: 'Dados do empregador e software preenchidos corretamente',
        when: 'O botão "Emitir Atestado Técnico" é acionado',
        then: 'O arquivo PDF gerado deve conter todos os campos do modelo do Anexo II da Portaria 671/2021, incluindo identificação do desenvolvedor Softcase e do empregador.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 75 § 1º.'
      }
    ]
  },

  {
    id: 'org-02',
    code: 'ORG-02',
    title: 'Estabelecimentos, Filiais e Coletores Físicos/Tablets REP-P',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Gestão de filiais (CNPJ/CNO) e homologação de tablets e dispositivos móveis autorizados para registro coletivo',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 73 a 84 - Especificações do REP-P e Coletores)',
      'CLT Art. 74 § 2º (Controle de ponto nos estabelecimentos com mais de 20 trabalhadores)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela dividida em duas abas integradas: Aba A: "Estabelecimentos & Filiais" (lista de locais com CNPJ, endereço e cerca geográfica); Aba B: "Coletores de Ponto (Tablets Kiosk)" (dispositivos autorizados com token de hardware, versão do app e status de conectividade). Inclui mapa de visualização de cerca eletrônica configurada para geolocalização.',
      zones: [
        {
          name: 'Zona 1: Lista de Estabelecimentos e Filiais',
          description: 'Gestão das unidades físicas da empresa.',
          elements: ['Código da Filial', 'CNPJ da Filial / CNO de Obra', 'Nome da Unidade (ex: Matriz, Fábrica 01, Loja Shopping)', 'Total de Colaboradores Vinculados', 'Fuso Horário Local']
        },
        {
          name: 'Zona 2: Cadastro de Coletor Físico (Tablet Kiosk)',
          description: 'Autorização e emparelhamento seguro de tablets compartilhados.',
          elements: ['Nome do Dispositivo (ex: Tablet Recepção Principal)', 'Identificador Único do Dispositivo (UUID/Hardware ID)', 'Estabelecimento Vinculado', 'Chave de Pareamento / QR Code de Ativação', 'Status (Online / Offline / Sincronizado)']
        },
        {
          name: 'Zona 3: Parâmetros de Geolocalização e Tolerância',
          description: 'Configuração de cerca eletrônica (Geofencing) para marcações móveis no estabelecimento.',
          elements: ['Latitude e Longitude Centrais', 'Raio de Tolerância em Metros (ex: 150m)', 'Modo Estrito (Bloquear marcação fora do raio / Registrar advertência)']
        }
      ],
      gridResponsiveness: 'Layout expansível com suporte a visualização lado a lado em telas >= 1280px (Lista à esquerda, Detalhes e Mapa de Cerca à direita).'
    },
    camposEValidacoes: [
      {
        name: 'CNPJ da Filial / Estabelecimento',
        type: 'Texto com Máscara',
        required: true,
        mask: '99.999.999/9999-99',
        validationRule: 'Validação matemática de 14 dígitos. Os primeiros 8 dígitos devem coincidir com o CNPJ raiz da empresa.',
        businessImpact: 'Conformidade fiscal na emissão de comprovantes por estabelecimento empregador.'
      },
      {
        name: 'Nome da Unidade / Filial',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 3 caracteres, máximo 80 caracteres.',
        businessImpact: 'Identificação nos relatórios e nos espelhos de ponto.'
      },
      {
        name: 'Raio da Cerca Geográfica (metros)',
        type: 'Número',
        required: true,
        validationRule: 'Entre 20 metros e 5.000 metros. Padrão recomendado: 100 metros.',
        businessImpact: 'Previne fraudes de colaboradores registrando ponto remotamente sem estar presente na empresa.'
      },
      {
        name: 'Identificador do Dispositivo Coletor (UUID)',
        type: 'Texto UUIDv4',
        required: true,
        validationRule: 'UUID criptograficamente gerado pelo aplicativo instalador no tablet.',
        businessImpact: 'Identificação inconfundível do coletor exigida nos registros do REP-P (Portaria 671 Art. 78).'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Adicionar Filial / Estabelecimento',
        type: 'primary',
        shortcut: 'Alt + F',
        loadingStateBehavior: 'Abre modal de dados da filial com mapa interativo.',
        actionDescription: 'Cadastra nova unidade física para alocação de equipes.'
      },
      {
        label: 'Parear Novo Tablet Coletor',
        type: 'secondary',
        shortcut: 'Alt + T',
        loadingStateBehavior: 'Gera token temporal de pareamento com QR Code na tela.',
        actionDescription: 'Permite ao gestor ler o QR Code no tablet físico para autenticação mútua imediata.'
      },
      {
        label: 'Revogar Acesso do Coletor',
        type: 'danger',
        loadingStateBehavior: 'Invalida imediatamente o token de comunicação do tablet.',
        actionDescription: 'Utilizado em caso de furto, perda ou desativação do equipamento físico na empresa.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-02.1',
        title: 'Identificação do Coletor em Toda Marcação REP-P',
        rule: 'Cada registro eletrônico de ponto deve conter a identificação do equipamento coletor (ID do tablet ou ID da sessão mobile) e sua versão homologada de software.',
        legalImpact: 'Portaria 671/2021 Art. 78 — Requisito mandatório do cabeçalho de marcação.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-02.2',
        title: 'Operação Offline do Coletor com Criptografia Local',
        rule: 'O coletor tablet deve permitir a marcação de ponto mesmo em momentos de perda transitória de conexão com a internet. Os registros devem ser salvos em banco local criptografado e transmitidos automaticamente assim que o sinal for restabelecido, mantendo o timestamp original inalterado.',
        legalImpact: 'Portaria 671/2021 Art. 79 — Continuidade operacional do ponto sem prejuízo ao trabalhador.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-02.3',
        title: 'Proibição de Bloqueio Físico de Marcação',
        rule: 'O coletor tablet compartilhado JAMAIS pode exigir senha complexa que impeça o trabalhador de bater o ponto no horário devido. A identificação deve ser rápida (PIN pessoal + CPF ou Reconhecimento Facial).',
        legalImpact: 'Portaria 671/2021 Art. 74 — Garantia de livre acesso ao registro de jornada.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Criação de filiais, autorização e revogação de tablets coletores.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Monitoramento de coletores online e pareamento de novos dispositivos.' },
      { role: 'Gestor de Unidade', accessLevel: 'CONSULTA', description: 'Visualização do status do coletor de sua filial específica.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0201',
        message: 'CNPJ da filial deve pertencer à mesma raiz do CNPJ da matriz da empresa.',
        cause: 'Os primeiros 8 dígitos do CNPJ da filial não conferem com o cadastro da empresa.',
        resolution: 'Confira se a filial informada realmente pertence ao mesmo grupo econômico.'
      },
      {
        code: 'ERR-ORG-0202',
        message: 'Limite de coletores tablets do plano atingido.',
        cause: 'A quantidade de tablets pareados atingiu o teto contratado.',
        resolution: 'Contrate coletores adicionais no plano da Softcase ou desative um tablet obsoleto.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Geração de QR Code de pareamento',
        expectedBehavior: 'O QR Code exibido possui validade de 15 minutos; após escaneado pelo app do tablet, a tela se atualiza sozinha confirmando o pareamento.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-02-01',
        title: 'Validação de coerência do CNPJ de filial',
        given: 'Empresa cadastrada com CNPJ raiz 12.345.678/0001-90',
        when: 'Usuário tenta cadastrar filial com CNPJ 98.765.432/0001-11',
        then: 'O sistema deve recusar o cadastro alertando divergência de raiz CNPJ com a matriz.',
        legalComplianceCheck: 'Estrutura legal da Receita Federal.'
      },
      {
        id: 'CT-ORG-02-02',
        title: 'Geração correta do Identificador de Coletor no AFD',
        given: 'Um tablet pareado sob o ID "TAB-REC-01"',
        when: 'Uma marcação é registrada através deste equipamento',
        then: 'O registro de ponto gerado no banco e exportado no AFD deve carregar o identificador exato do equipamento.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 84.'
      }
    ]
  },

  {
    id: 'org-03',
    code: 'ORG-03',
    title: 'Estrutura Organizacional: Departamentos, Centros de Custo e Cargos (CBO)',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Mapeamento hierárquico da empresa, códigos CBO do MTP e centros de custo para rateio de horas extras',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 74 - Dados do Vínculo Empregatício)',
      'Tabela CBO - Classificação Brasileira de Ocupações (MTP)',
      'eSocial (Tabela 10 - Tipos de Lotação e Cargos)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela modular em 3 seções acessíveis por abas horizontais ou painéis expansíveis: (1) Departamentos & Setores (árvore hierárquica visual com gestores responsáveis); (2) Cargos & CBOs (tabela com busca inteligente conectada à tabela oficial de CBOs do Ministério do Trabalho); (3) Centros de Custo (código contábil, descrição e percentual de rateio).',
      zones: [
        {
          name: 'Zona 1: Árvore de Departamentos',
          description: 'Visualização da hierarquia corporativa da empresa.',
          elements: ['Código do Setor', 'Nome do Departamento (ex: Operações, Vendas, TI)', 'Departamento Pai (hierarquia)', 'Gestor Titular / Substituto', 'Ações de Edição']
        },
        {
          name: 'Zona 2: Catálogo de Cargos com CBO Oficial',
          description: 'Relação de cargos com exigência do código CBO de 6 dígitos.',
          elements: ['Título do Cargo (ex: Auxiliar Administrativo)', 'Código CBO Oficial (com autocompletar da base do MTP)', 'Descrição Sumária', 'Carga Horária Semanal Padrão (ex: 44h)', 'Colaboradores Ativos no Cargo']
        },
        {
          name: 'Zona 3: Centros de Custo',
          description: 'Códigos contábeis para integração com a folha de pagamento.',
          elements: ['Código Contábil (ex: CC-1020)', 'Descrição do Centro de Custo', 'Estabelecimento Vinculado']
        }
      ],
      gridResponsiveness: 'Layout flexível com navegação por abas em desktop e pilha vertical em telas menores.'
    },
    camposEValidacoes: [
      {
        name: 'Código CBO (Classificação Brasileira de Ocupações)',
        type: 'Texto com Máscara e Autocompletar',
        required: true,
        mask: '9999-99',
        validationRule: 'Deve corresponder a um código válido existente na tabela oficial do CBO do Ministério do Trabalho e Previdência.',
        businessImpact: 'Obrigatório para conformidade com o eSocial e fiscalização trabalhista de desvio de função.'
      },
      {
        name: 'Título do Cargo',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 2 caracteres, máximo 80 caracteres.',
        businessImpact: 'Exibido no espelho de ponto oficial do colaborador.'
      },
      {
        name: 'Nome do Departamento',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 2 caracteres, alfanumérico.',
        businessImpact: 'Agrupamento para relatórios de absenteísmo e horas extras.'
      },
      {
        name: 'Carga Horária Semanal Contratual Padrão (Horas)',
        type: 'Número',
        required: true,
        validationRule: 'Número entre 1 e 44 horas semanais (limite constitucional).',
        businessImpact: 'CF/88 Art. 7º XIII — Base de cálculo para horas extras e divisor mensal.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Adicionar Cargo',
        type: 'primary',
        loadingStateBehavior: 'Abre modal de criação de cargo com busca instantânea de CBO.',
        actionDescription: 'Permite cadastrar nova função na empresa com CBO validado.'
      },
      {
        label: 'Adicionar Departamento',
        type: 'secondary',
        loadingStateBehavior: 'Abre gaveta para cadastro de setor e atribuição de gestor.',
        actionDescription: 'Cria nova área organizacional na estrutura.'
      },
      {
        label: 'Exportar Estrutura em CSV',
        type: 'ghost',
        loadingStateBehavior: 'Download instantâneo da estrutura completa.',
        actionDescription: 'Facilita conferência com sistema de folha ou ERP.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-03.1',
        title: 'Obrigatoriedade de CBO Válido para o Vínculo',
        rule: 'Nenhum cargo pode ser salvo sem um CBO oficial válido de 6 dígitos. A ausência de CBO impede a correta apuração de adicionais legais e integração com eSocial.',
        legalImpact: 'Portaria MTP eSocial — Campo mandatório na qualificação cadastral.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-03.2',
        title: 'Bloqueio de Exclusão de Cargo em Uso',
        rule: 'Um cargo ou departamento que possua colaboradores ativos ou registros históricos de ponto nos últimos 5 anos não pode ser excluído fisicamente da base, apenas inativado.',
        legalImpact: 'Manutenção da integridade histórica dos espelhos de ponto emitidos.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Gestão completa da estrutura organizacional.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Criação e manutenção de cargos, CBOs e setores.' },
      { role: 'Gestor de Departamento', accessLevel: 'CONSULTA', description: 'Visualização da estrutura do seu próprio departamento.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0301',
        message: 'Código CBO não encontrado na base oficial do Ministério do Trabalho.',
        cause: 'O código digitado não corresponde à tabela oficial vigente.',
        resolution: 'Utilize a busca por nome da ocupação para selecionar o CBO correto.'
      },
      {
        code: 'ERR-ORG-0302',
        message: 'Não é possível inativar departamento com colaboradores ativos vinculados.',
        cause: 'Existem trabalhadores alocados neste setor.',
        resolution: 'Transfira os colaboradores para outro departamento antes de inativar.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Busca por termo de ocupação (ex: "Programador")',
        expectedBehavior: 'O campo CBO exibe dropdown de sugestões em tempo real com código e descrição oficial (ex: "2124-05 - Especialista em desenvolvimento de softwares").'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-03-01',
        title: 'Validação da tabela oficial de CBOs no cadastro de cargos',
        given: 'Formulário de cadastro de cargo aberto',
        when: 'O usuário tenta salvar um cargo com código CBO fictício "9999-99"',
        then: 'O sistema bloqueia a gravação e apresenta alerta "CBO inválido na base do MTP".',
        legalComplianceCheck: 'Conformidade com a tabela oficial de ocupações do MTP.'
      }
    ]
  },

  {
    id: 'org-04',
    code: 'ORG-04',
    title: 'Cadastro Completo do Colaborador (Trabalhador & Vínculo Empregatício)',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Ficha funcional do trabalhador com dados obrigatórios para o REP-P, enquadramento na CLT e regras de ponto',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 74 - Identificação do Trabalhador no REP-P)',
      'CLT Art. 74 (Obrigatoriedade e Modalidades de Controle)',
      'CLT Art. 62 (Exceções de Controle de Jornada)',
      'CLT Art. 74 § 4º (Regras para Ponto por Exceção)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Formulário mestre dividido em 4 abas estruturadas: (Aba 1) Dados Pessoais & Documentos: Nome Completo (sem abreviação), CPF, PIS/NIS/eSocial, Data de Nascimento, E-mail, Celular; (Aba 2) Contrato de Trabalho: Matrícula interna, Data de Admissão, Tipo de Vínculo (CLT, Estágio, Aprendiz), Cargo, Departamento, Filial de Lotação; (Aba 3) Parâmetros de Ponto: Regime de Jornada, Dispensa de Ponto (Art. 62 CLT), Ponto por Exceção (Art. 74 § 4º), Tolerância de Atraso; (Aba 4) Biometria & Coletor: PIN Pessoal de 4-6 dígitos para tablet coletor, Foto de Referência para Reconhecimento Facial, Status do Cadastro Biométrico.',
      zones: [
        {
          name: 'Zona 1: Identificação Civil e Previdenciária',
          description: 'Campos essenciais para qualificação no REP-P e nos arquivos fiscais.',
          elements: ['Nome Completo Oficial (sem abreviações)', 'CPF (validado com cálculo módulo 11)', 'PIS / PASEP / NIS (quando aplicável ou matrícula eSocial)', 'Data de Nascimento', 'Foto de Perfil 1:1']
        },
        {
          name: 'Zona 2: Dados Contratuais e Lotação',
          description: 'Vínculo formal com a empresa.',
          elements: ['Matrícula do Empregado (única por empresa)', 'Data de Admissão', 'Tipo de Contrato (CLT Indeterminado, Determinado, Jovem Aprendiz, Estágio)', 'Cargo (CBO)', 'Departamento', 'Estabelecimento']
        },
        {
          name: 'Zona 3: Parâmetros Jurídicos de Controle de Jornada',
          description: 'Enquadramento legal do colaborador perante a CLT.',
          elements: [
            'Modalidade de Controle (Ponto Eletrônico Regular / Dispensa Art. 62 / Ponto por Exceção)',
            'Regime de Jornada (Mensalista, Horista)',
            'Jornada de Trabalho Padrão Vinculada (Escala 5x2, 6x1, 12x36)',
            'Anexo de Acordo Escrito para Ponto por Exceção (quando aplicável)'
          ]
        },
        {
          name: 'Zona 4: Credenciais do Coletor Compartilhado (Tablet)',
          description: 'Segurança e agilidade para marcação no tablet físico da empresa.',
          elements: ['PIN Numérico Individual (4 a 6 dígitos)', 'Cadastro Facial Ativo (com captura da webcam ou upload de foto nítida)', 'Status: Pronto para Marcação']
        }
      ],
      gridResponsiveness: 'Grid em 2 colunas com navegação por abas superiores; no mobile, as abas viram carrossel horizontal deslizável.'
    },
    camposEValidacoes: [
      {
        name: 'Nome Completo do Colaborador',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 2 palavras (nome e sobrenome). Proibido abreviações no primeiro nome. Máximo 100 caracteres.',
        businessImpact: 'Exibido no comprovante de registro de ponto (Portaria 671 Art. 83).'
      },
      {
        name: 'CPF do Colaborador',
        type: 'Texto com Máscara',
        required: true,
        mask: '999.999.999-99',
        validationRule: '11 dígitos com cálculo estrito dos 2 dígitos verificadores (módulo 11). Deve ser estritamente ÚNICO dentro da empresa contratante.',
        businessImpact: 'Chave primária de identificação do trabalhador no REP-P, no AFD e no eSocial.'
      },
      {
        name: 'Número de Matrícula Interna',
        type: 'Texto Alfanumérico',
        required: true,
        validationRule: 'Mínimo 1 caractere, máximo 30 caracteres. Único por empresa contratante.',
        businessImpact: 'Identificador do vínculo para importação e exportação de folha de pagamento.'
      },
      {
        name: 'PIS / PASEP / NIS',
        type: 'Texto com Máscara',
        required: false,
        mask: '999.99999.99-9',
        validationRule: 'Se preenchido, validação de 11 dígitos com cálculo módulo 11 do PIS.',
        businessImpact: 'Histórico cadastral para emissão do AFD formato legado quando solicitado por fiscal.'
      },
      {
        name: 'Data de Admissão',
        type: 'Data',
        required: true,
        validationRule: 'Data válida não superior a 30 dias no futuro.',
        businessImpact: 'Início da contagem de frequência e cálculo do espelho de ponto.'
      },
      {
        name: 'Enquadramento Legal da Jornada',
        type: 'Select',
        required: true,
        validationRule: 'Opções: [Controle Regular Obrigatório, Dispensa Art. 62 I (Atividade Externa Incompatível), Dispensa Art. 62 II (Cargo de Confiança/Gerência), Dispensa Art. 62 III (Teletrabalho por Produção), Ponto por Exceção CLT Art. 74 § 4º].',
        businessImpact: 'Determina se o colaborador tem espelho de ponto apurado e se gera passivo por ausência de registro.'
      },
      {
        name: 'PIN de Acesso ao Coletor Tablet',
        type: 'Senha Numérica',
        required: true,
        mask: '999999',
        validationRule: '4 a 6 dígitos numéricos. Não pode ser sequência trivial (1234, 0000, ano de nascimento).',
        businessImpact: 'Garante autenticação individual e rápida no tablet compartilhado sem gerar filas.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Salvar Colaborador',
        type: 'primary',
        shortcut: 'Ctrl + S',
        loadingStateBehavior: 'Valida unicidade de CPF e matrícula; exibe spinner e fecha aba.',
        actionDescription: 'Grava o colaborador e libera imediatamente para registro no app móvel e nos tablets coletores.'
      },
      {
        label: 'Capturar Foto Facial com Câmera',
        type: 'secondary',
        shortcut: 'Alt + C',
        loadingStateBehavior: 'Abre modal com feed de webcam e detecção de enquadramento facial.',
        actionDescription: 'Cadastra o vetor biométrico facial para uso no coletor tablet e no celular.'
      },
      {
        label: 'Desligar Colaborador (Rescisão)',
        type: 'danger',
        loadingStateBehavior: 'Abre modal de data de desligamento e encerramento de vínculo.',
        actionDescription: 'Inativa o colaborador para novos pontos mantendo histórico intocado para apuração final.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-04.1',
        title: 'Unicidade de CPF por Empresa',
        rule: 'Não é permitido cadastrar dois colaboradores ativos com o mesmo CPF na mesma empresa, exceto se houver dois contratos distintos (ex: professor com dois turnos ou médico com dois vínculos formais e matrículas separadas).',
        legalImpact: 'Portaria 671/2021 — Distinção clara de vínculos e contratos.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-04.2',
        title: 'Impossibilidade de Registro Retroativo de Admissão sem Justificativa',
        rule: 'A data de admissão não pode ser alterada para data posterior a registros de ponto já existentes para aquele CPF.',
        legalImpact: 'Incoerência cronológica vedada no AFD e perante a fiscalização do trabalho.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-04.3',
        title: 'Regra Estrita de Ponto por Exceção (CLT Art. 74 § 4º)',
        rule: 'Se o colaborador for marcado como "Ponto por Exceção", o sistema exige obrigatoriamente a declaração de que há acordo individual ou coletivo vigente. O colaborador registrará APENAS as exceções (horas extras, atrasos, faltas, saídas antecipadas), sendo os dias regulares presumidos como cumpridos conforme a escala contratada.',
        legalImpact: 'CLT Art. 74 § 4º e Portaria 671/2021 Art. 83 — Validade da presunção de jornada.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-04.4',
        title: 'Consentimento e Privacidade Biométrica (LGPD)',
        rule: 'A coleta de dados biométricos faciais é tratada como dado sensível (LGPD Art. 11), tendo como base legal o cumprimento de obrigação legal e prevenção à fraude na identificação do titular.',
        legalImpact: 'LGPD Art. 11 II "g" — Prevenção à fraude e segurança do titular.',
        invarianceLevel: 'STRICT'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Criação, edição e desligamento de colaboradores.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Gestão cadastral completa, atribuição de escalas e biometria.' },
      { role: 'Gestor de Equipe', accessLevel: 'CONSULTA', description: 'Consulta aos dados funcionais dos liderados de sua equipe.' },
      { role: 'Colaborador', accessLevel: 'CONDICIONAL', description: 'Visualização dos próprios dados cadastrais e atualização de contato.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0401',
        message: 'CPF inválido: os dígitos verificadores calculados não conferem.',
        cause: 'Digitação incorreta do CPF.',
        resolution: 'Confira o número digitado na carteira de trabalho digital ou cartão CPF.'
      },
      {
        code: 'ERR-ORG-0402',
        message: 'Já existe um colaborador ativo cadastrado com este CPF nesta empresa.',
        cause: 'Duplicidade de cadastro.',
        resolution: 'Se for um segundo contrato do mesmo trabalhador, cadastre como Vínculo Adicional com nova matrícula.'
      },
      {
        code: 'ERR-ORG-0403',
        message: 'PIN do coletor muito fraco. Evite sequências simples como 123456 ou números repetidos.',
        cause: 'O PIN informado não atende aos requisitos de entropia mínima.',
        resolution: 'Escolha uma combinação numérica com dígitos alternados.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Salvar colaborador com sucesso',
        expectedBehavior: 'Os dados são salvos; o tablet coletor sincroniza o novo colaborador em menos de 10 segundos via WebSocket ou polling e já permite a primeira batida de ponto com o PIN cadastrado.'
      },
      {
        scenario: 'Seleção de "Dispensa Art. 62"',
        expectedBehavior: 'O sistema oculta os campos de Escala e Jornada Padrão e exibe banner informativo: "Colaborador dispensado do controle de ponto formal. Não gerará espelho de ponto nem apontamento de horas extras".'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-04-01',
        title: 'Validação matemática estrita de CPF no cadastro de colaborador',
        given: 'Formulário de colaborador aberto na aba de dados pessoais',
        when: 'O usuário tenta gravar com CPF "000.000.000-00" ou CPF com dígito inválido',
        then: 'A submissão é bloqueada com feedback visual vermelho e mensagem acionável.',
        legalComplianceCheck: 'Receita Federal / MTP identificação de trabalhadores.'
      },
      {
        id: 'CT-ORG-04-02',
        title: 'Comportamento correto de ponto por exceção',
        given: 'Colaborador cadastrado no regime de Ponto por Exceção com escala 08:00 às 17:00',
        when: 'O colaborador não realiza marcações em um dia útil comum',
        then: 'O motor PTRP considera automaticamente cumprida a jornada de 8h sem gerar apontamento de falta indevida.',
        legalComplianceCheck: 'CLT Art. 74 § 4º.'
      }
    ]
  },

  {
    id: 'org-05',
    code: 'ORG-05',
    title: 'Gestão de Usuários, Perfis e Permissões (RBAC Multi-nível)',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Controle de acesso granular para RH, Gestores, Fiscais e Colaboradores com auditoria de privilégios e MFA',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Art. 82 - Responsabilidades no Tratamento do Ponto PTRP)',
      'LGPD Lei nº 13.709/2018 (Art. 46 - Medidas de Segurança da Informação)',
      'ISO/IEC 27001 (Controle de Acesso Baseado em Funções)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela de gestão de acessos com 2 áreas fundamentais: (1) Lista de usuários com foto, nome, e-mail, perfil atribuído (Administrador, RH/DP, Gestor de Equipe, Auditor Trabalhista, Colaborador), status de MFA (Ativo/Inativo) e último acesso; (2) Matriz interativa de permissões por módulo onde o administrador pode inspecionar ou customizar direitos por perfil (ex: Visualizar Ponto, Tratar Ponto, Aprovar Justificativas, Fechar Período de Folha, Emitir AFD/AEJ).',
      zones: [
        {
          name: 'Zona 1: Diretório de Usuários da Empresa',
          description: 'Relação de operadores humanos do portal web.',
          elements: ['Nome e E-mail', 'Perfil / Papel de Acesso', 'Status de MFA (Autenticação em Duas Etapas)', 'Vínculo com Colaborador (se houver)', 'Ações de Gestão (Reset de Senha, Bloquear, Editar)']
        },
        {
          name: 'Zona 2: Matriz RBAC de Permissões',
          description: 'Grade de direitos funcionais com separação clara de poderes.',
          elements: ['Módulo Cadastros', 'Módulo Jornadas & Escalas', 'Módulo Tratamento PTRP (Portaria 671)', 'Módulo Banco de Horas & Fechamento', 'Módulo Exportação AFD/AEJ']
        }
      ],
      gridResponsiveness: 'Tabela de usuários full-width com drawer lateral de detalhes de permissão e histórico de logins.'
    },
    camposEValidacoes: [
      {
        name: 'E-mail Corporativo do Usuário',
        type: 'E-mail',
        required: true,
        validationRule: 'Formato válido RFC 5322. Deve ser único em toda a plataforma.',
        businessImpact: 'Chave de login e recebimento de tokens de segurança.'
      },
      {
        name: 'Perfil de Acesso (Role)',
        type: 'Select',
        required: true,
        validationRule: 'Opções pré-configuradas: [Administrador da Empresa, Analista de RH/DP, Gestor de Equipe, Auditor / Fiscal Externo, Colaborador].',
        businessImpact: 'Garante o princípio do menor privilégio e conformidade jurídica.'
      },
      {
        name: 'Obrigatoriedade de Autenticação Multifator (MFA)',
        type: 'Toggle Booleano',
        required: true,
        validationRule: 'Obrigatório ATIVO para todos os usuários com perfil de Administrador e RH/DP.',
        businessImpact: 'Evita vazamento de credenciais e alterações fraudulentas em registros de ponto de funcionários.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Convidar Novo Usuário',
        type: 'primary',
        loadingStateBehavior: 'Envia convite por e-mail com link temporal de primeiro acesso.',
        actionDescription: 'Permite cadastrar um novo analista de RH ou gestor na empresa.'
      },
      {
        label: 'Forçar Reset de Senha',
        type: 'secondary',
        loadingStateBehavior: 'Invalida sessões ativas do usuário e envia e-mail de redefinição.',
        actionDescription: 'Procedimento imediato em caso de suspeita de comprometimento de conta.'
      },
      {
        label: 'Bloquear Usuário Imediatamente',
        type: 'danger',
        loadingStateBehavior: 'Bloqueia o login e encerra a sessão ativa do usuário.',
        actionDescription: 'Aplicado imediatamente no desligamento de gestores ou operadores de RH.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-05.1',
        title: 'Identificação Pessoal Obrigatória de Quem Trata o Ponto (PTRP)',
        rule: 'A Portaria 671/2021 proíbe contas genéricas compartilhadas (ex: "rh@empresa.com" ou "ponto@empresa.com") para realizar tratamento, abonos ou correções de registros de ponto. Todo tratamento deve registrar o CPF e nome do usuário operador no arquivo AEJ e na auditoria.',
        legalImpact: 'Portaria 671/2021 Art. 82 — Rastreabilidade inequívoca do autor do tratamento do ponto.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-05.2',
        title: 'Perfil Específico de Auditor Fiscal do Trabalho',
        rule: 'O sistema deve disponibilizar um perfil com acesso exclusivo de leitura aos arquivos fiscais (AFD, AEJ e espelhos de ponto), sem permitir qualquer alteração ou acesso a dados financeiros não trabalhistas.',
        legalImpact: 'Portaria 671/2021 Art. 85 — Acesso à Auditoria-Fiscal do Trabalho.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Criação e bloqueio de usuários, atribuição de perfis e exigência de MFA.' },
      { role: 'Analista de RH / DP', accessLevel: 'CONSULTA', description: 'Visualização da lista de gestores sem permissão de alterar perfis de administradores.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0501',
        message: 'MFA obrigatório para este perfil de acesso.',
        cause: 'Usuários com permissão de tratamento de ponto (PTRP) não podem desabilitar o MFA.',
        resolution: 'Configure o aplicativo autenticador (Google Authenticator ou similar) antes de prosseguir.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Desativação de usuário',
        expectedBehavior: 'Ao clicar em "Bloquear Usuário", qualquer token JWT ativo é revogado na blacklist Redis em menos de 1 segundo.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-05-01',
        title: 'Bloqueio de contas genéricas para perfis de tratamento PTRP',
        given: 'Formulário de convite de novo usuário',
        when: 'O administrador tenta cadastrar usuário com perfil de RH usando nome genérico sem vincular a um operador identificado',
        then: 'O sistema exige o preenchimento obrigatório do CPF e Nome Completo do operador para fins de auditoria no AEJ.',
        legalComplianceCheck: 'Portaria 671/2021 Art. 82.'
      }
    ]
  },

  {
    id: 'org-06',
    code: 'ORG-06',
    title: 'Importação e Sincronização em Lote de Cadastros (Batch Onboarding)',
    module: 'Módulo 02 — Cadastro e Estrutura Organizacional',
    subtitle: 'Importação em massa de colaboradores, departamentos e cargos via planilha padronizada ou API REST de folha',
    legalBasis: [
      'Portaria MTP nº 671/2021 (Validação de Dados Cadastrais)',
      'eSocial (Padronização de leiautes cadastrais S-2200 / S-2206)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela de 3 etapas no estilo assistente (Wizard): (Etapa 1) Download do modelo de planilha oficial (CSV/XLSX) e área de drop de arquivo; (Etapa 2) Validador prévio em tempo real com matriz de inconsistências (apontando número da linha, campo com erro e sugestão de correção antes de gravar qualquer dado no banco); (Etapa 3) Confirmação com barra de progresso de gravação e resumo final de registros inseridos/atualizados.',
      zones: [
        {
          name: 'Zona 1: Área de Upload e Template',
          description: 'Zona de arrastar e soltar arquivo com instrução dos campos obrigatórios.',
          elements: ['Botão "Baixar Modelo de Planilha Padronizada"', 'Caixa de Drag & Drop para arquivos .CSV e .XLSX', 'Seletor de Ação: "Apenas Novos" ou "Atualizar Existentes por CPF"']
        },
        {
          name: 'Zona 2: Prévia e Relatório de Validação',
          description: 'Tabela de pré-visualização das linhas da planilha com sinalizadores de erro.',
          elements: ['Total de Linhas Processadas', 'Linhas Válidas (Verdes)', 'Linhas com Erros Críticos (Vermelhas)', 'Filtro para Exibir Somente Erros', 'Botão "Ignorar Inválidos e Importar Válidos"']
        },
        {
          name: 'Zona 3: Histórico de Lotes Importados',
          description: 'Relação de importações anteriores com logs de auditoria e opção de download do log.',
          elements: ['Data/Hora da Importação', 'Operador Responsável', 'Arquivo Original', 'Qtd Sucesso / Falha', 'Download do Log de Erros']
        }
      ],
      gridResponsiveness: 'Interface focada em desktop para conferência confortável de planilhas de grande porte (até 5.000 linhas por lote).'
    },
    camposEValidacoes: [
      {
        name: 'Arquivo de Importação',
        type: 'Arquivo (.CSV ou .XLSX)',
        required: true,
        validationRule: 'Tamanho máximo de 15MB. Deve conter cabeçalhos obrigatórios: CPF, NOME, MATRICULA, ADMISSAO, CARGO_CBO, DEPARTAMENTO.',
        businessImpact: 'Previne falhas de processamento e arquivos corrompidos.'
      },
      {
        name: 'Regra de Tratamento de Duplicidades',
        type: 'Radio',
        required: true,
        validationRule: 'Opções: [Rejeitar linha se CPF já existir, Atualizar cadastro do colaborador existente].',
        businessImpact: 'Evita sobrescrita acidental de dados contratuais históricos.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Processar e Validar Arquivo',
        type: 'primary',
        loadingStateBehavior: 'Lê o arquivo no navegador, executa cálculos de CPF e CBO sem enviar ao banco e exibe o resumo em < 2s.',
        actionDescription: 'Permite ao operador checar erros antes de efetivar a importação no banco.'
      },
      {
        label: 'Confirmar Importação de X Colaboradores',
        type: 'primary',
        loadingStateBehavior: 'Executa transação em lote no backend com barra de progresso percentual.',
        actionDescription: 'Persiste os registros válidos e cria os colaboradores na base da empresa.'
      },
      {
        label: 'Baixar Planilha com Correções Apontadas',
        type: 'secondary',
        loadingStateBehavior: 'Gera planilha contendo apenas as linhas reprovadas com uma coluna extra explicando o motivo exato.',
        actionDescription: 'Agiliza a correção pelo RH.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-ORG-06.1',
        title: 'Atomicidade e Rollback em Caso de Falha Estrutural',
        rule: 'Se a opção selecionada for "Tudo ou Nada", qualquer erro crítico aborta a transação inteira garantindo que a base não fique em estado inconsistente.',
        legalImpact: 'Integridade referencial do banco de dados relacional.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-ORG-06.2',
        title: 'Validação Matemática Estrita de Todos os CPFs da Planilha',
        rule: 'Cada linha da planilha passa pelo mesmo algoritmo rigoroso do módulo 11. Linhas com CPFs fictícios ou repetidos são imediatamente destacadas.',
        legalImpact: 'Prevenção de poluição cadastral no REP-P.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Execução de importações em lote de dados da empresa.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Upload e conferência de cadastros via planilha.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-ORG-0601',
        message: 'Cabeçalho da planilha incompatível com o leiaute oficial do Softcase Ponto.',
        cause: 'Colunas obrigatórias como CPF ou MATRICULA não foram encontradas na linha 1.',
        resolution: 'Baixe o modelo oficial de planilha e copie seus dados para as colunas corretas.'
      },
      {
        code: 'ERR-ORG-0602',
        message: 'Limite de licenças do plano seria ultrapassado com esta importação.',
        cause: 'O número de novos colaboradores ativos somado aos atuais excede o plano contratado.',
        resolution: 'Reduza a quantidade de novos colaboradores ou solicite upgrade de plano à Softcase.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Upload de arquivo com 300 colaboradores e 2 CPFs inválidos',
        expectedBehavior: 'O sistema lista os 298 colaboradores válidos com status verde e as 2 linhas com erro em vermelho indicando exatamente: "Linha 45: CPF 123.456.789-00 possui dígito verificador inválido".'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-ORG-06-01',
        title: 'Identificação cirúrgica de linha com CPF inválido na planilha',
        given: 'Arquivo CSV com 5 colaboradores, onde o 3º colaborador tem CPF 111.111.111-11',
        when: 'O arquivo é processado na etapa 2 do validador',
        then: 'A tabela de validação deve apontar exatamente a Linha 3 com erro impeditivo e permitir filtrar apenas linhas com falha.',
        legalComplianceCheck: 'Qualificação cadastral eSocial / MTP.'
      }
    ]
  },

  // ==========================================
  // MÓDULO 03 — JORNADAS E ESCALAS
  // ==========================================
  {
    id: 'jrn-01',
    code: 'JRN-01',
    title: 'Gestão de Feriados, Escalas e Reflexos Trabalhistas em DSR e Horas Extras',
    module: 'Módulo 03 — Jornadas e Escalas',
    subtitle: 'Cadastro de feriados Nacionais, Estaduais e Municipais por empresa e associação ao calendário individual do trabalhador',
    legalBasis: [
      'Lei Federal nº 605/1949 (Repouso Semanal Remunerado e Feriados Civis e Religiosos)',
      'Lei Federal nº 9.093/1995 (Competência dos Feriados Municipais e Estaduais)',
      'Lei Federal nº 10.607/2002 e Lei nº 14.759/2023 (Feriados Nacionais Oficiais)',
      'Súmula nº 146 do Tribunal Superior do Trabalho (TST - Trabalho em Feriado não compensado pago em dobro)',
      'CLT Art. 70 (Proibição de trabalho em dias de feriados nacionais e religiosos, salvo autorização legal)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Tela dividida em duas visões estratégicas: Visão 1: "Catálogo de Feriados da Empresa" (lista tabular densa com badges de tipo Nacional/Estadual/Municipal, UF/Cidade e adicional legal de 100%); Visão 2: "Calendário Individual do Trabalhador & Calculadora DSR" (seletor de colaborador com filtro por filial, herança automática de feriados aplicáveis da UF/Cidade e simulador interativo da memória de cálculo de horas extras em feriado e reflexo no DSR).',
      zones: [
        {
          name: 'Zona 1: Catálogo de Feriados por Empresa',
          description: 'Gestão dos feriados civis e religiosos aplicáveis aos contratos.',
          elements: ['Data (YYYY-MM-DD)', 'Nome do Feriado', 'Tipo (Nacional, Estadual, Municipal, Ponto Facultativo)', 'UF e Município de Abrangência', 'Adicional de Horas Extras (+100%)', 'Impacto em DSR']
        },
        {
          name: 'Zona 2: Herança de Calendário do Colaborador',
          description: 'Cruzamento automático da localidade de lotação do trabalhador com a base de feriados.',
          elements: ['Colaborador Selecionado', 'Filial de Lotação', 'Lista Filtrada de Feriados Aplicáveis', 'Status de Escala em Feriado']
        },
        {
          name: 'Zona 3: Memória de Cálculo Auditável de H.E. e DSR',
          description: 'Simulação da fórmula da folha: (Horas Extras / Dias Úteis) × Repousos (Domingos + Feriados).',
          elements: ['Valor Hora Normal', 'Adicional 100% (Súmula 146 TST)', 'Horas Extras Feriado', 'Reflexo no DSR', 'Total a Pagar']
        }
      ],
      gridResponsiveness: 'Layout de 2 colunas simétricas em desktop 1440px com painel de parâmetros à esquerda e memória de cálculo à direita.'
    },
    camposEValidacoes: [
      {
        name: 'Nome do Feriado',
        type: 'Texto',
        required: true,
        validationRule: 'Mínimo 3 caracteres, máximo 100 caracteres.',
        businessImpact: 'Identificação na folha de pagamento e no espelho de ponto oficial do colaborador.'
      },
      {
        name: 'Data do Feriado',
        type: 'Data (YYYY-MM-DD)',
        required: true,
        validationRule: 'Data válida no calendário gregoriano.',
        businessImpact: 'Data de incidência do adicional de repouso ou apuração de horas extras.'
      },
      {
        name: 'Tipo de Feriado',
        type: 'Select',
        required: true,
        validationRule: 'Opções válidas: [Nacional, Estadual, Municipal, Ponto Facultativo].',
        businessImpact: 'Determina a abrangência jurídica da dispensa de jornada ou obrigatoriedade de pagamento em dobro.'
      },
      {
        name: 'Unidade Federativa (UF)',
        type: 'Select',
        required: false,
        validationRule: 'Obrigatório quando o tipo for "Estadual" ou "Municipal". Sigla válida de 2 letras (SP, RJ, MG, etc.).',
        businessImpact: 'Vinculação exclusiva aos estabelecimentos situados naquele estado.'
      },
      {
        name: 'Município',
        type: 'Texto',
        required: false,
        validationRule: 'Obrigatório quando o tipo for "Municipal". Máximo 4 feriados municipais por cidade (Lei 9.093/1995).',
        businessImpact: 'Restringe o feriado aos colaboradores daquela cidade específica.'
      },
      {
        name: 'Adicional de Hora Extra em Feriado',
        type: 'Número Percentual',
        required: true,
        validationRule: 'Padrão 100% (mínimo legal da Súmula 146 TST), podendo ser superior por Acordo/CCT (ex: 120%, 150%).',
        businessImpact: 'Cálculo de acréscimo patrimonial do trabalhador que prestar serviços no feriado sem folga compensatória.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Cadastrar Novo Feriado',
        type: 'primary',
        loadingStateBehavior: 'Abre modal com campos condicionais de UF e Cidade.',
        actionDescription: 'Permite incluir feriado civil ou religioso para a empresa.'
      },
      {
        label: 'Carregar Feriados Oficiais Brasileiros',
        type: 'secondary',
        loadingStateBehavior: 'Popula os feriados nacionais oficiais (Leis 10.607/02 e 14.759/23) com 1 clique.',
        actionDescription: 'Evita digitação manual dos 10 feriados nacionais vigentes no Brasil.'
      },
      {
        label: 'Simular Memória de Cálculo DSR',
        type: 'primary',
        loadingStateBehavior: 'Executa a fórmula matemática e projeta o espelho da semana.',
        actionDescription: 'Permite ao RH verificar se o cálculo está aderente à Súmula 146 TST e Lei 605/49.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-JRN-01.1',
        title: 'Herança Hierárquica de Feriados por Localidade',
        rule: 'O calendário do colaborador é montado automaticamente pela composição: Feriados Nacionais + Feriados Estaduais da UF da filial de lotação + Feriados Municipais da Cidade da filial. Colaboradores de filiais distintas nunca herdam feriados municipais alheios.',
        legalImpact: 'Lei nº 9.093/1995 Art. 1º e 2º — Territorialidade dos feriados civis e religiosos.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-JRN-01.2',
        title: 'Trabalho em Feriado Pago em Dobro (Súmula 146 TST)',
        rule: 'O trabalho realizado em dia de feriado que não seja compensado com outra folga na mesma semana deve ser remunerado com adicional de no mínimo 100% (pago em dobro), sem prejuízo da remuneração ordinária do repouso já inclusa no salário mensalista.',
        legalImpact: 'Súmula 146 do TST e Lei nº 605/1949 Art. 9º.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-JRN-01.3',
        title: 'Reflexo de Horas Extras no DSR da Semana com Feriado',
        rule: 'Na semana em que ocorrer feriado, o feriado é considerado dia de repouso remunerado para apuração do divisor/multiplicador do DSR: Reflexo DSR = (Total Horas Extras / Dias Úteis) × (Domingos + Feriados).',
        legalImpact: 'Lei nº 605/1949 Art. 3º e Súmula 172 do TST.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Cadastro e exclusão de feriados da empresa.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Gestão de calendários e parametrização de reflexos de folha.' },
      { role: 'Gestor de Equipe', accessLevel: 'CONSULTA', description: 'Visualização dos feriados da equipe para montagem de escalas.' },
      { role: 'Colaborador', accessLevel: 'CONSULTA', description: 'Visualização dos feriados aplicáveis ao seu próprio calendário no app móvel.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-JRN-0101',
        message: 'Feriado estadual requer obrigatoriamente a seleção da UF.',
        cause: 'Campo UF não preenchido ao cadastrar feriado de abrangência estadual.',
        resolution: 'Selecione a Unidade Federativa correspondente.'
      },
      {
        code: 'ERR-JRN-0102',
        message: 'Limite de 4 feriados municipais para este município foi atingido.',
        cause: 'A Lei Federal nº 9.093/1995 limita a 4 os feriados religiosos municipais por ano, incluída a Sexta-Feira da Paixão.',
        resolution: 'Verifique se o novo feriado é oficial ou classifique-o como Ponto Facultativo.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Colaborador transferido de São Paulo/SP para Rio de Janeiro/RJ',
        expectedBehavior: 'Ao alterar a filial de lotação do colaborador, seu calendário de ponto recalcula instantaneamente, desvinculando os feriados de SP (09/07 e 25/01) e vinculando os feriados do RJ (23/04 e 20/01).'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-JRN-01-01',
        title: 'Herança correta de feriados estaduais e municipais por filial',
        given: 'Um colaborador lotado na filial de São Paulo (SP)',
        when: 'O calendário anual do colaborador é consultado',
        then: 'Deve conter o feriado estadual de 09/07 e o municipal de 25/01, e NÃO deve conter o feriado de São Jorge (23/04 do RJ).',
        legalComplianceCheck: 'Lei 9.093/1995 — Competência municipal/estadual de feriados.'
      },
      {
        id: 'CT-JRN-01-02',
        title: 'Cálculo de hora extra 100% e reflexo de DSR em feriado trabalhado',
        given: 'Colaborador com jornada de 8h em 02/11/2026 (Finados) sem folga compensatória',
        when: 'O motor PTRP apura o espelho de ponto',
        then: 'Deve lançar 8 horas com adicional de 100% e computar o reflexo do feriado no DSR da semana.',
        legalComplianceCheck: 'Súmula 146 TST e Lei 605/1949.'
      }
    ]
  },

  // ==========================================
  // MÓDULO 09 — RELATÓRIOS E INTEGRAÇÕES
  // ==========================================
  {
    id: 'rel-01',
    code: 'REL-01',
    title: 'Apuração de Atrasos, Faltas e Descontos em Folha',
    module: 'Módulo 09 — Relatórios e Integrações',
    subtitle: 'Painel analítico e gerencial para apuração automática de ocorrências de frequência, reflexos em DSR e exportação para folha de pagamento',
    legalBasis: [
      'CLT Art. 58 § 1º (Tolerâncias legais de 5 e 10 minutos)',
      'CLT Art. 473 (Hipóteses legais de faltas justificadas)',
      'Lei Federal nº 605/1949 (Art. 6º - Perda do Descanso Semanal Remunerado por falta)',
      'Portaria MTP nº 671/2021 (Art. 84 - Padrões de exportação de dados e tratamento)'
    ],
    aparenciaOrganizacao: {
      wireframeDescription:
        'Interface com barra de filtros avançados por período e departamento, 5 cartões de indicadores consolidados de impacto em horas e financeiro, seletor de 3 visões (Sintético com gráficos, Analítico por trabalhador e Detalhado por evento) e modal de tratamento de ocorrências para inclusão de CID-10 e abono.',
      zones: [
        {
          name: 'Zona 1: Filtros de Apuração & Atalhos de Período',
          description: 'Seleção rápida de competência (mês atual, anterior), departamento, tipo de ocorrência e busca textual.',
          elements: ['Data Inicial / Final', 'Seletor de Departamento', 'Tipo (Atraso/Falta/Saída)', 'Status do Tratamento', 'Busca por Colaborador/Matrícula']
        },
        {
          name: 'Zona 2: Cartões de Impacto & Resumo Executivo',
          description: 'Métricas tabulares com volume de eventos, horas a descontar, faltas injustificadas, perda de DSRs e valor total em reais.',
          elements: ['Total de Ocorrências', 'Horas a Descontar (HH:MM)', 'Faltas Injustificadas', 'Reflexo Perda DSR', 'Desconto Estimado Total (R$)']
        },
        {
          name: 'Zona 3: Visualização do Relatório (Sintético / Analítico / Detalhado)',
          description: 'Gráficos comparativos de absenteísmo por departamento e composição por tipo de falta no modo Sintético; tabelas agregadas no Analítico e espelho com ações de abono/desconto no Detalhado.',
          elements: ['Gráfico de Barras Departamental', 'Gráfico Segmentado de Composição', 'Tabela Analítica por Colaborador', 'Espelho Detalhado de Ocorrências com CID']
        }
      ],
      gridResponsiveness: 'Layout responsivo em grid com flex-wrap em tablets e empilhamento em telas móveis.'
    },
    camposEValidacoes: [
      {
        name: 'Data Inicial / Final',
        type: 'Data ISO',
        required: true,
        validationRule: 'Data final deve ser maior ou igual à data inicial.',
        businessImpact: 'Define o período de fechamento contábil do ponto.'
      },
      {
        name: 'Tolerância Legal (Art. 58 § 1º)',
        type: 'Cálculo Automático',
        required: true,
        validationRule: 'Variações de até 5 minutos por registro (máx. 10 diários) não geram desconto. Ultrapassado o limite, desconta-se a totalidade dos minutos perdidos.',
        businessImpact: 'Evita passivos e contestações trabalhistas quanto ao limite de tolerância.'
      },
      {
        name: 'Reflexo de Perda de DSR (Lei 605/1949)',
        type: 'Cálculo Automático',
        required: true,
        validationRule: 'Falta injustificada durante a semana de trabalho acarreta a perda da remuneração do repouso semanal subsequente.',
        businessImpact: 'Cumprimento estrito da Lei 605/1949 na integração com a folha de pagamento.'
      }
    ],
    botoesEAcoes: [
      {
        label: 'Exportar Folha (CSV)',
        type: 'primary',
        actionDescription: 'Exporta arquivo estruturado com código de rubricas e valores líquidos para integração com a folha de pagamento.',
        loadingStateBehavior: 'Gera e descarrega o arquivo CSV instantaneamente.'
      },
      {
        label: 'Imprimir Relatório Oficial',
        type: 'secondary',
        actionDescription: 'Gera visualização de impressão e relatório gerencial com timbre e resumo departamental.',
        loadingStateBehavior: 'Abre a caixa de diálogo nativa do navegador para impressão/PDF.'
      },
      {
        label: 'Tratar Ocorrência',
        type: 'secondary',
        actionDescription: 'Abre modal para abonar falta/atraso por atestado médico ou confirmar desconto em folha.',
        loadingStateBehavior: 'Exibe janela modal com validação de CID-10.'
      }
    ],
    regrasDeNegocio: [
      {
        code: 'RN-REL-0901',
        title: 'Tolerância Legal de Pontualidade (CLT Art. 58 § 1º e Súmula 366 TST)',
        rule: 'Não serão descontadas nem computadas como jornada extraordinária as variações de horário no registro de ponto não excedentes a cinco minutos, observado o limite máximo de dez minutos diários. Ultrapassado esse limite, será considerada como extra a totalidade do tempo excedente da jornada normal.',
        legalImpact: 'Inibe descontos indevidos e resguarda o empregador contra passivos da Súmula 366 do TST.',
        invarianceLevel: 'CRITICAL'
      },
      {
        code: 'RN-REL-0902',
        title: 'Perda do Descanso Semanal Remunerado por Falta Injustificada (Lei 605/1949 Art. 6º)',
        rule: 'A ausência integral injustificada na semana de apuração enseja, além do desconto do dia útil não trabalhado, o desconto do valor correspondente ao dia de repouso semanal remunerado (DSR).',
        legalImpact: 'Reflexo financeiro automatizado em consonância com a Lei Federal nº 605/1949.',
        invarianceLevel: 'CRITICAL'
      }
    ],
    permissoes: [
      { role: 'Administrador do Cliente', accessLevel: 'TOTAL', description: 'Visualização e exportação de todos os relatórios.' },
      { role: 'Analista de RH / DP', accessLevel: 'TOTAL', description: 'Tratamento de faltas, abono de atestados e fechamento de descontos.' },
      { role: 'Gestor de Equipe', accessLevel: 'TOTAL', description: 'Visualização analítica e sintética dos colaboradores de sua equipe.' },
      { role: 'Colaborador', accessLevel: 'CONSULTA', description: 'Acesso apenas ao seu espelho individual de ocorrências no portal do colaborador.' }
    ],
    mensagensDeErro: [
      {
        code: 'ERR-REL-0901',
        message: 'Abono por motivo de saúde requer obrigatoriamente a indicação do CID-10 ou motivo médico.',
        cause: 'Operador tentou abonar sem preencher o campo de atestado.',
        resolution: 'Preencha o CID-10 constante no atestado médico apresentado pelo colaborador.'
      }
    ],
    comportamentosEsperados: [
      {
        scenario: 'Atraso de 12 minutos na entrada (início 08:00, registro 08:12)',
        expectedBehavior: 'Como excedeu a tolerância diária de 10 minutos (Art. 58 § 1º CLT), o sistema calcula o desconto integral de 12 minutos (e não apenas 2 minutos excedentes), conforme jurisprudência pacífica do TST.'
      }
    ],
    criteriosDeTeste: [
      {
        id: 'CT-REL-09-01',
        title: 'Aplicação correta da Súmula 366 do TST para tolerância de 10 minutos',
        given: 'Colaborador que registrou entrada às 08:11 (tolerância ultrapassada)',
        when: 'O relatório de atrasos é processado',
        then: 'Deve apontar 11 minutos de atraso descontável integralmente.',
        legalComplianceCheck: 'CLT Art. 58 § 1º e Súmula 366 TST.'
      },
      {
        id: 'CT-REL-09-02',
        title: 'Perda automática do DSR em caso de falta injustificada',
        given: 'Colaborador com falta injustificada na quarta-feira',
        when: 'O relatório de ocorrências calcula os descontos',
        then: 'Deve registrar o desconto de 8h de salário mais 1 dia adicional correspondente à perda do DSR da semana.',
        legalComplianceCheck: 'Lei Federal nº 605/1949 Art. 6º.'
      }
    ]
  }
];

export const LEGAL_MATRIX_ITEMS = [
  {
    artigo: 'Art. 73 a 84 da Portaria MTP nº 671/2021',
    tema: 'Requisitos do Registrador Eletrônico de Ponto via Programa (REP-P)',
    exigenciaLegal: 'Software executado em servidor ou nuvem dedicado exclusivamente ao registro de ponto, com emissão de comprovante ao trabalhador, arquivo AFD e proteção contra alteração indevida de dados.',
    implementacaoSoftcase: 'Módulo 01 (Isolamento de tenants, geração de certificados por empresa, auditoria imutável) e Módulo 02 (Cadastro do Empregador e Estabelecimentos, homologação de coletores físicos).'
  },
  {
    artigo: 'Art. 75 da Portaria MTP nº 671/2021',
    tema: 'Atestado Técnico e Termo de Responsabilidade do REP-P',
    exigenciaLegal: 'O desenvolvedor e o empregador devem emitir e assinar atestado técnico declarando que o programa cumpre integralmente os requisitos da portaria, sem dispositivos que permitam adulterações ou marcações automáticas.',
    implementacaoSoftcase: 'Tela ORG-01: Ação de emissão automática do Atestado Técnico conforme modelo oficial do Anexo II com assinatura digital e hash criptográfico.'
  },
  {
    artigo: 'Art. 83 da Portaria MTP nº 671/2021',
    tema: 'Comprovante de Registro de Ponto do Trabalhador',
    exigenciaLegal: 'Disponibilização do comprovante impresso ou eletrônico em formato PDF com assinatura digital ou código de autenticidade (hash), contendo dados do empregador, trabalhador, horário e NSR.',
    implementacaoSoftcase: 'Telas ADM-02, ORG-01 e ORG-04: Parametrização dos dados mandatórios e motor de assinatura digital individual por empresa.'
  },
  {
    artigo: 'Art. 84 da Portaria MTP nº 671/2021',
    tema: 'Arquivo Fonte de Dados (AFD)',
    exigenciaLegal: 'Geração do arquivo texto inalterável com cabeçalho contendo identificador do empregador (CNPJ/CPF) e registros com NSR, data, hora, fuso horário e identificador do coletor.',
    implementacaoSoftcase: 'Telas ADM-04, ORG-01 e ORG-02: Garantia de imutabilidade do fuso horário e UUID de equipamento coletor em cada batida.'
  },
  {
    artigo: 'Art. 74 § 4º da CLT',
    tema: 'Ponto por Exceção',
    exigenciaLegal: 'Permissão de registro exclusivo das exceções (horas extras, atrasos, faltas) mediante acordo individual escrito, convenção coletiva ou acordo coletivo de trabalho válido.',
    implementacaoSoftcase: 'Telas ORG-01 e ORG-04: Exigência obrigatória de anexo de acordo coletivo válido no MEDIADOR para habilitar o modo exceção no perfil do trabalhador.'
  },
  {
    artigo: 'Lei nº 605/1949 e Súmula 146 do TST',
    tema: 'Feriados, DSR e Trabalho em Feriado Pago em Dobro (100%)',
    exigenciaLegal: 'O trabalho em dias feriados civis e religiosos não compensado deve ser pago em dobro (adicional de 100%), sem prejuízo da remuneração do repouso, com reflexo no Descanso Semanal Remunerado.',
    implementacaoSoftcase: 'Módulo 03 (Tela JRN-01): Gestão de feriados Nacionais, Estaduais e Municipais com herança automática por filial e memória de cálculo de horas extras e DSR na apuração PTRP.'
  },
  {
    artigo: 'Art. 71 e Art. 66 da CLT',
    tema: 'Controle de Intervalo Intrajornada e Interjornadas',
    exigenciaLegal: 'Obrigatoriedade de intervalo para repouso ou alimentação de no mínimo 1 hora em jornadas superiores a 6 horas. A não concessão ou supressão parcial acarreta pagamento de indenização com acréscimo de 50% sobre o período suprimido (Art. 71 § 4º). Intervalo de no mínimo 11 horas consecutivas entre duas jornadas (Art. 66).',
    implementacaoSoftcase: 'Módulo 03 e 04: Suporte a 4 marcações no coletor REP-P (Entrada, Saída Intervalo, Retorno Intervalo, Saída) com alerta e apuração automática de supressão de intervalo.'
  },
  {
    artigo: 'Art. 4º e Art. 58 § 1º da CLT',
    tema: 'Tempo à Disposição e Tolerância de Antecedência Máxima',
    exigenciaLegal: 'A permanência do colaborador na empresa sem execução de ordens não configura tempo à disposição (Art. 4º § 2º). Variações de até 5 minutos por batida (máx. 10 minutos diários) não configuram horas extras (Art. 58 § 1º).',
    implementacaoSoftcase: 'Módulo 03 e 04: Regra opcional parametrizável de limite de registro antecipado de no máximo 15 minutos em relação ao horário contratado, prevenindo passivo trabalhista.'
  },
  {
    artigo: 'Art. 59 da CLT e Art. 84 da Portaria MTP 671/2021',
    tema: 'Horas Extras, Banco de Horas e Aprovação por Gestor de Equipe',
    exigenciaLegal: 'Horas suplementares limitadas a 2 horas diárias mediante acordo, pagas com acréscimo mínimo de 50% ou compensadas em banco de horas. Cada equipe deve possuir segregação hierárquica de aprovação.',
    implementacaoSoftcase: 'Módulo 07: Atribuição de gestor dedicado por equipe, fila de autorização prévia de horas extras e opção de destinação entre banco de horas ou pagamento em folha.'
  },
  {
    artigo: 'Art. 11 e 46 da LGPD (Lei nº 13.709/2018)',
    tema: 'Segurança de Dados Pessoais e Biometria',
    exigenciaLegal: 'Proteção de dados biométricos faciais como dados sensíveis, controle de acesso estrito e registro das operações de tratamento.',
    implementacaoSoftcase: 'Telas ADM-04 e ORG-05: RBAC granular, MFA obrigatório para operadores de RH e trilha de auditoria WORM (Write-Once-Read-Many).'
  }
];

