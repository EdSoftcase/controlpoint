-- ========================================================
-- SCHEMA CORRIGIDO SUPABASE - SOFTCASE PONTO
-- Resolve erro de tipos incompatíveis (TEXT vs UUID)
-- ========================================================

-- LIMPEZA DE TABELAS (Garante que não haverá erro de tipo incompatível)
DROP TABLE IF EXISTS public.point_registrations CASCADE;
DROP TABLE IF EXISTS public.points CASCADE; -- Limpa tabela legada mencionada no erro
DROP TABLE IF EXISTS public.collaborators CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.establishments CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;

-- 1. TABELA DE LOGS
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB
);

-- 2. TABELA DE COLABORADORES
-- Nota: collaborator_id é TEXT para aceitar IDs do frontend como 'colab-1730582000000'
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id TEXT UNIQUE NOT NULL, -- Chave única usada para referências
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    matricula TEXT NOT NULL,
    pis TEXT,
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
    status TEXT NOT NULL DEFAULT 'ATIVO',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE REGISTROS DE PONTO (REP-P)
CREATE TABLE IF NOT EXISTS public.point_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nsr INTEGER NOT NULL,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL, -- Tipo TEXT para bater com o collaborator_id da tabela acima
    data_hora TIMESTAMPTZ NOT NULL,
    tipo_marcacao TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    hash_sha256 TEXT NOT NULL,
    modo_dispositivo TEXT NOT NULL,
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Constraint de Foreign Key explícita com tipos garantidos
    CONSTRAINT fk_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id)
);

-- 4. TABELA DE ESTABELECIMENTOS
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    establishment_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cnpj TEXT NOT NULL,
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

-- 5. TABELA DE TENANTS (CLIENTES)
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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABELA DE AUDITORIA BIOMÉTRICA (Portaria 671 / REP-P)
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

-- 7. TABELA DE ASSINATURAS DE ESPELHO (Portaria 671 / PTRP)
CREATE TABLE IF NOT EXISTS public.point_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    mes_ano TEXT NOT NULL, -- ex: "2026-10"
    data_hora_assinatura TIMESTAMPTZ DEFAULT now(),
    hash_assinatura_sha256 TEXT NOT NULL,
    ip_address TEXT,
    dispositivo_info TEXT,
    rubrica_data_url TEXT, -- Base64 da rubrica
    status TEXT NOT NULL DEFAULT 'ASSINADO',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_signature_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- 8. TABELA DE SOLICITAÇÕES DE AJUSTE E ATESTADOS
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
    data_hora_envio TIMESTAMPTZ DEFAULT now(),
    justificativa TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    resposta_gestor TEXT,
    data_decisao TIMESTAMPTZ,
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_adjustment_collaborator FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(collaborator_id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_requests ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.biometric_audit_logs;
CREATE POLICY "Acesso Total Backend" ON public.biometric_audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.point_signatures;
CREATE POLICY "Acesso Total Backend" ON public.point_signatures FOR ALL USING (true);

DROP POLICY IF EXISTS "Acesso Total Backend" ON public.adjustment_requests;
CREATE POLICY "Acesso Total Backend" ON public.adjustment_requests FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_colab_tenant ON public.collaborators(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_tenant ON public.point_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_colab ON public.point_registrations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_tenant_cnpj ON public.tenants(cnpj);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_tenant ON public.biometric_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_biometric_audit_colab ON public.biometric_audit_logs(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_adj_tenant ON public.adjustment_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_adj_colab ON public.adjustment_requests(collaborator_id);

-- 7. DADOS INICIAIS (SEED)
INSERT INTO public.tenants (tenant_id, cnpj, razao_social, nome_fantasia, slug, plano, licencas_contratadas, email_admin, status)
VALUES ('tenant-01', '00.000.000/0001-91', 'Softcase Tecnologia', 'Softcase', 'softcase', 'REP-P Corporativo', 9999, 'admin@softcase.com.br', 'ATIVO')
ON CONFLICT (tenant_id) DO NOTHING;


