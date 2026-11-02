-- TABELA DE LOGS (Auditoria WORM conforme Portaria 671)
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    details JSONB
);

-- TABELA DE COLABORADORES
-- Nota: Esta tabela deve ser sincronizada com os usuários do Auth
CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    collaborator_id TEXT UNIQUE NOT NULL, -- ID Legado ou Matrícula
    tenant_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    biometric_template TEXT, -- Template criptografado (AES-256 no backend)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABELA DE REGISTROS DE PONTO (REP-P)
CREATE TABLE IF NOT EXISTS public.point_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nsr INTEGER NOT NULL, -- Número Seqüencial de Registro
    tenant_id TEXT NOT NULL,
    collaborator_id TEXT NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    tipo_marcacao TEXT NOT NULL, -- 'ENTRADA', 'SAIDA', etc.
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    hash_sha256 TEXT NOT NULL,
    modo_dispositivo TEXT NOT NULL, -- 'BROWSER', 'APP', 'TABLET'
    detalhes JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Exemplos básicos - Ajustar conforme necessidade)
CREATE POLICY "Serviço Backend pode tudo" ON public.logs FOR ALL USING (true);
CREATE POLICY "Serviço Backend pode tudo" ON public.collaborators FOR ALL USING (true);
CREATE POLICY "Serviço Backend pode tudo" ON public.point_registrations FOR ALL USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_point_tenant ON public.point_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_point_colab ON public.point_registrations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_colab_cpf ON public.collaborators(cpf);
