-- ========================================================
-- SCHEMA COMPLETO & IDEMPOTENTE SUPABASE - POINT CONTROL REP-P
-- Seguro para criação inicial e migração sem perda de dados
-- ========================================================

-- 1. TABELA DE LOGS
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB
);

-- 2. TABELA DE COLABORADORES
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    matricula TEXT NOT NULL,
    pis TEXT,
    email TEXT,
    telefone TEXT,
    data_admissao DATE NOT NULL,
    cargo_id TEXT,
    cargo_titulo TEXT,
    departamento_id TEXT,
    departamento_nome TEXT,
    gestor_id TEXT,
    gestor_nome TEXT,
    estabelecimento_id TEXT,
    estabelecimento_nome TEXT,
    regime TEXT NOT NULL DEFAULT 'REGULAR',
    horario_inicio TEXT,
    horario_fim TEXT,
    carga_horaria_diaria NUMERIC(4,2),
    intervalo_minutos INTEGER,
    max_minutos_antecedencia INTEGER DEFAULT 15,
    regra_antecedencia_ativa BOOLEAN DEFAULT TRUE,
    pin_coletor TEXT,
    biometric_template TEXT,
    biometria_cadastrada BOOLEAN DEFAULT FALSE,
    limiar_confianca_minimo INTEGER DEFAULT 65,
    tipo_escala TEXT DEFAULT '5x2',
    turma_escala TEXT DEFAULT 'A',
    dias_folga_semana JSONB,
    anual_folgas JSONB,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS biometria_cadastrada BOOLEAN DEFAULT FALSE;
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS limiar_confianca_minimo INTEGER DEFAULT 65;
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS tipo_escala TEXT DEFAULT '5x2';
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS turma_escala TEXT DEFAULT 'A';
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS dias_folga_semana JSONB;
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS anual_folgas JSONB;

-- 3. TABELA DE REGISTROS DE PONTO (REP-P)
CREATE TABLE IF NOT EXISTS public.point_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nsr INTEGER NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    tipo_marcacao TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    hash_sha256 TEXT NOT NULL,
    modo_dispositivo TEXT NOT NULL,
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id)
);

-- 4. TABELA DE ESTABELECIMENTOS
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    establishment_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    tipo TEXT DEFAULT 'MATRIZ',
    cep TEXT,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    cerca_raio_metros INTEGER NOT NULL DEFAULT 100,
    bloquear_fora_do_raio BOOLEAN DEFAULT TRUE,
    endereco_completo TEXT,
    municipio TEXT,
    uf TEXT,
    fuso_horario TEXT DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'MATRIZ';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS bloquear_fora_do_raio BOOLEAN DEFAULT TRUE;

-- 5. TABELA DE TENANTS (EMPRESAS / CLIENTES)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT UNIQUE NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    slug TEXT UNIQUE NOT NULL,
    plano TEXT NOT NULL,
    licencas_contratadas INTEGER NOT NULL,
    email_admin TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    municipio TEXT,
    uf TEXT,
    endereco_completo TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    cerca_raio_metros INTEGER DEFAULT 150,
    bloquear_fora_do_raio BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS cerca_raio_metros INTEGER DEFAULT 150;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS bloquear_fora_do_raio BOOLEAN DEFAULT TRUE;

-- 6. TABELA DE DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL,
    gestor_id TEXT,
    gestor_nome TEXT,
    gestor_email TEXT,
    horario_inicio_padrao TEXT DEFAULT '08:00',
    carga_horaria_diaria NUMERIC(4,2) DEFAULT 8,
    intervalo_minutos INTEGER DEFAULT 60,
    max_minutos_antecedencia INTEGER DEFAULT 15,
    regra_antecedencia_ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABELA DE CARGOS
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    position_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    codigo TEXT,
    cbo TEXT,
    cbo_descricao TEXT,
    carga_horaria_semanal INTEGER DEFAULT 44,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABELA DE FERIADOS
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    data DATE NOT NULL,
    tipo TEXT NOT NULL,
    uf TEXT,
    municipio TEXT,
    estabelecimento_id TEXT,
    recorrente_anual BOOLEAN DEFAULT TRUE,
    legislacao_base TEXT,
    adicional_hora_extra_percentual INTEGER DEFAULT 100,
    gera_folga_compensatoria BOOLEAN DEFAULT FALSE,
    afeta_dsr BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABELA DE HORAS EXTRAS
CREATE TABLE IF NOT EXISTS public.overtime_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_name TEXT,
    collaborator_cpf TEXT,
    departamento_id TEXT,
    departamento_nome TEXT,
    gestor_id TEXT,
    gestor_nome TEXT,
    data DATE NOT NULL,
    horario_contratado TEXT,
    horario_realizado TEXT,
    minutos_extras INTEGER DEFAULT 0,
    horas_extras_formatadas TEXT,
    tipo_hora_extra TEXT DEFAULT 'NORMAL_50',
    justificativa TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    motivo_recusa TEXT,
    data_decisao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABELA DE FÉRIAS
CREATE TABLE IF NOT EXISTS public.vacations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vacation_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_name TEXT,
    collaborator_cpf TEXT,
    periodo_aquisitivo_inicio DATE,
    periodo_aquisitivo_fim DATE,
    periodo_concessivo_inicio DATE,
    periodo_concessivo_fim DATE,
    data_inicio_ferias DATE NOT NULL,
    data_fim_ferias DATE NOT NULL,
    dias_gozo INTEGER DEFAULT 30,
    dias_abono_pecuniario INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PROGRAMADO',
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABELA DE AFASTAMENTOS & LICENÇAS
CREATE TABLE IF NOT EXISTS public.absences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    absence_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_name TEXT,
    departamento_nome TEXT,
    tipo TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    dias_totais INTEGER DEFAULT 1,
    cid10 TEXT,
    crm_medico TEXT,
    documento_anexo TEXT,
    observacao TEXT,
    status TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    abona_ponto BOOLEAN DEFAULT TRUE,
    afasta_folha_inss BOOLEAN DEFAULT FALSE,
    data_registro TIMESTAMPTZ DEFAULT now()
);

-- 12. TABELA DE TROCA DE TURNOS
CREATE TABLE IF NOT EXISTS public.shift_swaps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swap_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    solicitante_id TEXT NOT NULL,
    solicitante_nome TEXT,
    substituto_id TEXT NOT NULL,
    substituto_nome TEXT,
    data_turno_original DATE NOT NULL,
    data_turno_compensacao DATE,
    motivo TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE_SUPERVISOR',
    supervisor_id TEXT,
    supervisor_nome TEXT,
    data_solicitacao TIMESTAMPTZ DEFAULT now(),
    data_aprovacao TIMESTAMPTZ,
    regra_clt_ok BOOLEAN DEFAULT TRUE,
    alerta_conflito TEXT
);

-- 13. TABELA DE AUDITORIA BIOMÉTRICA (Portaria 671 / REP-P)
CREATE TABLE IF NOT EXISTS public.biometric_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    similarity NUMERIC(5,2) NOT NULL,
    lighting_condition TEXT NOT NULL,
    liveness_score NUMERIC(5,2) NOT NULL,
    verdict TEXT NOT NULL,
    algorithm_used TEXT,
    hash_template TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_biometric_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- 14. TABELA DE ASSINATURAS DE ESPELHO (Portaria 671 / PTRP)
CREATE TABLE IF NOT EXISTS public.point_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    mes_ano TEXT NOT NULL,
    data_hora_assinatura TIMESTAMPTZ DEFAULT now(),
    hash_assinatura_sha256 TEXT NOT NULL,
    ip_address TEXT,
    dispositivo_info TEXT,
    rubrica_data_url TEXT,
    status TEXT NOT NULL DEFAULT 'ASSINADO',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_signature_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- 15. TABELA DE SOLICITAÇÕES DE AJUSTE E ATESTADOS
CREATE TABLE IF NOT EXISTS public.adjustment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    data DATE NOT NULL,
    tipo TEXT NOT NULL,
    horario_ajuste TEXT,
    tipo_marcacao_ajuste TEXT,
    cid10 TEXT,
    nome_documento_anexo TEXT,
    anexo_url TEXT,
    gestor_id TEXT,
    gestor_nome TEXT,
    data_hora_envio TIMESTAMPTZ DEFAULT now(),
    justificativa TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    resposta_gestor TEXT,
    data_decisao TIMESTAMPTZ,
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_adjustment_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

ALTER TABLE public.adjustment_requests ADD COLUMN IF NOT EXISTS anexo_url TEXT;
ALTER TABLE public.adjustment_requests ADD COLUMN IF NOT EXISTS gestor_id TEXT;
ALTER TABLE public.adjustment_requests ADD COLUMN IF NOT EXISTS gestor_nome TEXT;

-- 16. TABELA DE HOLERITES E CONTRACHEQUES (CLT)
CREATE TABLE IF NOT EXISTS public.paystubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paystub_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_cpf TEXT NOT NULL,
    collaborator_name TEXT NOT NULL,
    mes_ano TEXT NOT NULL,
    competencia TEXT NOT NULL,
    salario_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
    descontos NUMERIC(10,2) NOT NULL DEFAULT 0,
    salario_liquido NUMERIC(10,2) NOT NULL DEFAULT 0,
    arquivo_nome TEXT NOT NULL,
    arquivo_url TEXT,
    data_upload TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'EMITIDO_EMPRESA',
    observacao TEXT,
    confirmado_em TIMESTAMPTZ,
    confirmado_ip TEXT,
    confirmado_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_paystub_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

ALTER TABLE public.paystubs ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMPTZ;
ALTER TABLE public.paystubs ADD COLUMN IF NOT EXISTS confirmado_ip TEXT;
ALTER TABLE public.paystubs ADD COLUMN IF NOT EXISTS confirmado_hash TEXT;

-- 17. TABELA DE INFORMES DE RENDIMENTOS (IRPF)
CREATE TABLE IF NOT EXISTS public.tax_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_cpf TEXT NOT NULL,
    collaborator_name TEXT NOT NULL,
    ano_calendario TEXT NOT NULL,
    rendimentos_tributaveis NUMERIC(12,2) NOT NULL DEFAULT 0,
    contribuicao_previdenciaria NUMERIC(12,2) NOT NULL DEFAULT 0,
    imposto_retido_fonte NUMERIC(12,2) NOT NULL DEFAULT 0,
    arquivo_nome TEXT NOT NULL,
    arquivo_url TEXT,
    data_upload TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'DISPONIVEL',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_tax_report_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- 18. TABELA DE MURAL DIGITAL DE COMUNICADOS
CREATE TABLE IF NOT EXISTS public.company_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'COMUNICADO_GERAL',
    autor_nome TEXT NOT NULL,
    fixado BOOLEAN DEFAULT FALSE,
    exige_confirmacao_leitura BOOLEAN DEFAULT TRUE,
    anexo_nome TEXT,
    anexo_url TEXT,
    confirmacoes_leitura JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. TABELA DE ATENDIMENTO E CANAL FALE COM O DP/RH
CREATE TABLE IF NOT EXISTS public.rh_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    collaborator_cpf TEXT NOT NULL,
    collaborator_name TEXT NOT NULL,
    departamento_nome TEXT,
    assunto TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem_inicial TEXT NOT NULL,
    anexo_nome TEXT,
    anexo_url TEXT,
    status TEXT NOT NULL DEFAULT 'ABERTO',
    prioridade TEXT NOT NULL DEFAULT 'MEDIA',
    respostas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_rh_ticket_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paystubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Idempotentes
DROP POLICY IF EXISTS "Acesso Total Backend" ON public.logs;
CREATE POLICY "Acesso Total Backend" ON public.logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.collaborators;
CREATE POLICY "Acesso Total Backend" ON public.collaborators FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.point_registrations;
CREATE POLICY "Acesso Total Backend" ON public.point_registrations FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.establishments;
CREATE POLICY "Acesso Total Backend" ON public.establishments FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.tenants;
CREATE POLICY "Acesso Total Backend" ON public.tenants FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.departments;
CREATE POLICY "Acesso Total Backend" ON public.departments FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.positions;
CREATE POLICY "Acesso Total Backend" ON public.positions FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.holidays;
CREATE POLICY "Acesso Total Backend" ON public.holidays FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.overtime_requests;
CREATE POLICY "Acesso Total Backend" ON public.overtime_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.vacations;
CREATE POLICY "Acesso Total Backend" ON public.vacations FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.absences;
CREATE POLICY "Acesso Total Backend" ON public.absences FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.shift_swaps;
CREATE POLICY "Acesso Total Backend" ON public.shift_swaps FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.biometric_audit_logs;
CREATE POLICY "Acesso Total Backend" ON public.biometric_audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.point_signatures;
CREATE POLICY "Acesso Total Backend" ON public.point_signatures FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.adjustment_requests;
CREATE POLICY "Acesso Total Backend" ON public.adjustment_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.paystubs;
CREATE POLICY "Acesso Total Backend" ON public.paystubs FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.tax_reports;
CREATE POLICY "Acesso Total Backend" ON public.tax_reports FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.company_announcements;
CREATE POLICY "Acesso Total Backend" ON public.company_announcements FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.rh_tickets;
CREATE POLICY "Acesso Total Backend" ON public.rh_tickets FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_colab_tenant ON public.collaborators(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_tenant ON public.point_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_colab ON public.point_registrations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_tenant_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_dept_tenant ON public.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_tenant ON public.positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_holiday_tenant ON public.holidays(tenant_id);
CREATE INDEX IF NOT EXISTS idx_overtime_tenant ON public.overtime_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vacation_tenant ON public.vacations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_absence_tenant ON public.absences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_swap_tenant ON public.shift_swaps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_tenant ON public.biometric_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_colab ON public.biometric_audit_logs(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_adj_tenant ON public.adjustment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_adj_colab ON public.adjustment_requests(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_paystubs_tenant ON public.paystubs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_paystubs_colab ON public.paystubs(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_tax_reports_tenant ON public.tax_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcements_tenant ON public.company_announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON public.rh_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_colab ON public.rh_tickets(collaborator_id);

-- SEED INICIAL IDEMPOTENTE
INSERT INTO public.tenants (tenant_id, cnpj, razao_social, nome_fantasia, slug, plano, licencas_contratadas, email_admin, status)
VALUES ('tenant-01', '00.000.000/0001-91', 'Softcase Tecnologia', 'Softcase', 'softcase', 'REP-P Corporativo', 9999, 'admin@softcase.com.br', 'ATIVO')
ON CONFLICT (tenant_id) DO NOTHING;
