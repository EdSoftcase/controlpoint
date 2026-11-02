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

-- Habilitar RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Acesso Total Backend" ON public.logs FOR ALL USING (true);
CREATE POLICY "Acesso Total Backend" ON public.collaborators FOR ALL USING (true);
CREATE POLICY "Acesso Total Backend" ON public.point_registrations FOR ALL USING (true);
CREATE POLICY "Acesso Total Backend" ON public.establishments FOR ALL USING (true);
CREATE POLICY "Acesso Total Backend" ON public.tenants FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_colab_tenant ON public.collaborators(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_tenant ON public.point_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_colab ON public.point_registrations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_tenant_cnpj ON public.tenants(cnpj);
