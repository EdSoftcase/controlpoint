import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// State for Supabase client
let supabase: any = null;
let currentConfig = {
  url: process.env.VITE_SUPABASE_URL || 'https://aadrcdajajiqgpufixkt.supabase.co',
  key:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_a4i82ZX8uVCVN1rEhjV0Eg_E1QeOMnu'
};

function initSupabase(url: string, key: string) {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      currentConfig = { url, key };
      console.log('Supabase client (re)initialized successfully.');
      return true;
    } catch (err) {
      console.error('Error initializing Supabase:', err);
      return false;
    }
  }
  return false;
}

initSupabase(currentConfig.url, currentConfig.key);

export const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security: AES-256-GCM Encryption & HMAC Session Signing
const ALGORITHM = 'aes-256-gcm';
const SECRET_SEED =
  process.env.SESSION_SECRET ||
  process.env.ENCRYPTION_KEY ||
  crypto.createHash('sha256').update(`point-control-${currentConfig.url}`).digest('hex');
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || SECRET_SEED, 'point-control-salt', 32);
const IV_LENGTH = 12;

export function encryptBiometricTemplate(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin.trim(), salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPin(inputPin: string, storedPin: string): { valid: boolean; needsUpgrade: boolean } {
  const cleanInput = String(inputPin || '').trim();
  const cleanStored = String(storedPin || '').trim();
  if (!cleanInput || !cleanStored) {
    return { valid: false, needsUpgrade: false };
  }

  if (cleanStored.startsWith('scrypt$')) {
    const parts = cleanStored.split('$');
    if (parts.length !== 3) return { valid: false, needsUpgrade: false };
    const [, salt, expectedHex] = parts;
    try {
      const actualBuf = crypto.scryptSync(cleanInput, salt, 32);
      const expectedBuf = Buffer.from(expectedHex, 'hex');
      if (actualBuf.length !== expectedBuf.length) return { valid: false, needsUpgrade: false };
      return { valid: crypto.timingSafeEqual(actualBuf, expectedBuf), needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  const inputDigest = crypto.createHash('sha256').update(cleanInput).digest();
  const storedDigest = crypto.createHash('sha256').update(cleanStored).digest();
  const valid = crypto.timingSafeEqual(inputDigest, storedDigest);
  return { valid, needsUpgrade: valid };
}

function getBrasiliaTimeParts(dateInput: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short'
  });

  const partsMap: Record<string, string> = {};
  for (const part of formatter.formatToParts(dateInput)) {
    partsMap[part.type] = part.value;
  }

  const year = Number(partsMap.year);
  const month = Number(partsMap.month);
  const day = Number(partsMap.day);
  let hour = Number(partsMap.hour);
  if (hour === 24) hour = 0;
  const minute = Number(partsMap.minute);
  const second = Number(partsMap.second);

  const weekdayLookup: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  };
  const weekdayStr = (partsMap.weekday || '').toLowerCase().slice(0, 3);
  const dayOfWeek = weekdayLookup[weekdayStr] ?? new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = `${year}-${pad(month)}-${pad(day)}`;
  const mesAno = `${year}-${pad(month)}`;
  const hhmm = `${pad(hour)}:${pad(minute)}`;
  const hhmmss = `${hhmm}:${pad(second)}`;
  const ddmmyyyy = `${pad(day)}/${pad(month)}/${year}`;
  const formatted = `${ddmmyyyy} ${hhmmss}`;
  const iso = `${ymd}T${hhmmss}-03:00`;

  return {
    epochMs: dateInput.getTime(),
    year,
    month,
    day,
    hour,
    minute,
    second,
    ymd,
    mesAno,
    hhmm,
    hhmmss,
    ddmmyyyy,
    formatted,
    iso,
    dayOfWeek,
    minutesOfDay: hour * 60 + minute
  };
}

function getClientIp(req: express.Request): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff || req.ip || req.socket?.remoteAddress || '';
  return String(raw).split(',')[0].trim().replace('::ffff:', '') || '127.0.0.1';
}

function signSessionToken(userPayload: {
  id: string;
  email: string;
  user_metadata: {
    nome: string;
    role: string;
    roleLabel?: string;
    tenantId: string;
    tenantNome?: string;
    collaboratorId?: string;
    cpf?: string;
  };
}, ttlMs = 1000 * 60 * 60 * 12): string {
  const payload = {
    ...userPayload,
    exp: Date.now() + ttlMs,
    iat: Date.now()
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET_SEED).update(payloadB64).digest('base64url');
  return `sc_sess_${payloadB64}.${sig}`;
}

function verifySignedSessionToken(token: string): any | null {
  if (!token || !token.startsWith('sc_sess_')) return null;
  const raw = token.slice('sc_sess_'.length);
  const dotIdx = raw.indexOf('.');
  if (dotIdx === -1) return null;
  const payloadB64 = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);
  if (!payloadB64 || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SECRET_SEED).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed?.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function getAuthenticatedUser(token: string): Promise<any | null> {
  if (!token) return null;

  // 1. Verificar token HMAC assinado pelo servidor
  const hmacUser = verifySignedSessionToken(token);
  if (hmacUser) return hmacUser;

  // 2. Verificar token JWT válido do Supabase Auth
  if (!supabase) return null;
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);
    if (!error && user) return user;
  } catch {
    // ignore
  }

  return null;
}

function isSuperAdmin(user: any): boolean {
  return user?.user_metadata?.role === 'SUPER_ADMIN';
}

function isManagerOrAdmin(user: any): boolean {
  const role = user?.user_metadata?.role;
  return role === 'SUPER_ADMIN' || role === 'RH_ADMIN' || role === 'GESTOR';
}

function canAccessTenant(user: any, tenantId?: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!tenantId) return true;
  if (!user.user_metadata?.tenantId) return false;
  return user.user_metadata.tenantId === tenantId;
}

function canActForCollaborator(user: any, collaboratorId: string): boolean {
  if (!user) return false;
  if (isManagerOrAdmin(user)) return true;
  return user.user_metadata?.collaboratorId === collaboratorId;
}

// Logging utility
async function logEvent(tenantId: string, event: string) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('logs').insert({
      tenant_id: tenantId || 'system',
      event,
      timestamp: getBrasiliaTimeParts().iso
    });
    if (error) console.error('Error logging event:', error.message);
  } catch (err) {
    console.error('Error logging event exception:', err);
  }
}

// Helper: Calculate distance (Haversine in meters)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const rad1 = (lat1 * Math.PI) / 180;
  const rad2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function parseColabEmail(colab: any): string {
  if (colab?.email) return String(colab.email).trim().toLowerCase();
  if (colab?.biometric_template) {
    try {
      const parsed =
        typeof colab.biometric_template === 'string'
          ? JSON.parse(colab.biometric_template)
          : colab.biometric_template;
      if (parsed?.email) return String(parsed.email).trim().toLowerCase();
    } catch {
      // ignore
    }
  }
  return '';
}

function parseColabPhone(colab: any): string {
  if (colab?.telefone) return String(colab.telefone).trim();
  if (colab?.biometric_template) {
    try {
      const parsed =
        typeof colab.biometric_template === 'string'
          ? JSON.parse(colab.biometric_template)
          : colab.biometric_template;
      if (parsed?.telefone) return String(parsed.telefone).trim();
    } catch {
      // ignore
    }
  }
  return '';
}

function resolveCollaboratorRole(cargoTitulo?: string): 'SUPER_ADMIN' | 'RH_ADMIN' | 'GESTOR' | 'COLABORADOR' {
  const cargoLower = String(cargoTitulo || '').toLowerCase();
  if (/\bsuper\s*admin/i.test(cargoLower)) return 'SUPER_ADMIN';
  if (/\b(rh|dp|recursos humanos|departamento pessoal)\b/i.test(cargoLower)) return 'RH_ADMIN';
  if (/\b(gestor|supervisor|coordenador|gerente|lider|líder)\b/i.test(cargoLower)) return 'GESTOR';
  return 'COLABORADOR';
}

function mapCollaboratorRow(c: any) {
  const colabEmail = parseColabEmail(c);
  const colabPhone = parseColabPhone(c);
  const rawBio = c.biometric_template || c.biometria_hash_template || undefined;
  let parsedBioObj: any = null;
  if (rawBio) {
    try {
      parsedBioObj = typeof rawBio === 'string' ? JSON.parse(rawBio) : rawBio;
      if (typeof parsedBioObj === 'string') parsedBioObj = JSON.parse(parsedBioObj);
    } catch {
      parsedBioObj = null;
    }
  }
  return {
    id: c.collaborator_id || c.id,
    tenantId: c.tenant_id || 'tenant-01',
    nome: c.nome,
    cpf: c.cpf,
    matricula: c.matricula || 'MAT-001',
    pis: c.pis || '',
    email: colabEmail,
    telefone: colabPhone,
    dataAdmissao: c.data_admissao || '2024-01-01',
    cargoId: c.cargo_id || 'crg-01',
    cargoTitulo: c.cargo_titulo || parsedBioObj?.pretensaoCargo || 'Colaborador',
    departamentoId: c.departamento_id || 'dep-01',
    departamentoNome: c.departamento_nome || parsedBioObj?.pretensaoDepto || 'Geral',
    gestorId: c.gestor_id || 'colab-admin',
    gestorNome: c.gestor_nome || 'Administrador',
    estabelecimentoId: c.estabelecimento_id || 'est-01',
    estabelecimentoNome: c.estabelecimento_nome || 'Matriz',
    regime: c.regime || 'REGULAR',
    horarioInicio: c.horario_inicio || '08:00',
    horarioFim: c.horario_fim || '17:00',
    cargaHorariaDiariaHoras: Number(c.carga_horaria_diaria) || 8,
    intervaloMinutos: Number(c.intervalo_minutos) || 60,
    maxMinutosAntecedenciaPermitido: Number(c.max_minutos_antecedencia ?? 15),
    regraAntecedenciaAtiva: c.regra_antecedencia_ativa ?? true,
    pinColetor: '',
    biometriaCadastrada: Boolean(c.biometria_cadastrada),
    biometriaHashTemplate: rawBio,
    limiarConfiancaMinimo: Number(c.limiar_confianca_minimo) || 82.0,
    tipoEscala: c.tipo_escala || '5x2',
    turmaEscala: c.turma_escala || 'A',
    diasFolgaSemana: Array.isArray(c.dias_folga_semana) ? c.dias_folga_semana : undefined,
    anualFolgas: c.anual_folgas && typeof c.anual_folgas === 'object' ? c.anual_folgas : undefined,
    dataBaseCiclo: c.data_base_ciclo || '2026-01-01',
    status: c.status || 'ATIVO',
    pretensaoDepto: parsedBioObj?.pretensaoDepto || '',
    pretensaoCargo: parsedBioObj?.pretensaoCargo || ''
  };
}

// Horário Oficial de Brasília (NTP-aligned Server Time)
app.get('/api/time', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(getBrasiliaTimeParts());
});

// Lista pública reduzida de empresas ativas (para auto-cadastro na tela de login)
app.get('/api/public-tenants', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({
        tenants: [{ id: 'tenant-01', razaoSocial: 'Softcase Tecnologia', nomeFantasia: 'Softcase', slug: 'softcase' }]
      });
    }
    const { data, error } = await supabase
      .from('tenants')
      .select('tenant_id, razao_social, nome_fantasia, slug, status')
      .eq('status', 'ATIVO')
      .order('razao_social', { ascending: true });

    if (error || !data || data.length === 0) {
      return res.json({
        tenants: [{ id: 'tenant-01', razaoSocial: 'Softcase Tecnologia', nomeFantasia: 'Softcase', slug: 'softcase' }]
      });
    }

    res.json({
      tenants: data.map((t: any) => ({
        id: t.tenant_id,
        razaoSocial: t.razao_social,
        nomeFantasia: t.nome_fantasia || t.razao_social,
        slug: t.slug
      }))
    });
  } catch {
    res.json({
      tenants: [{ id: 'tenant-01', razaoSocial: 'Softcase Tecnologia', nomeFantasia: 'Softcase', slug: 'softcase' }]
    });
  }
});

// Hardcoded Admin Defaults (password should come from env in production)
const DEFAULT_ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin@softcase.com.br',
  password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Softcase@2026',
  nome: 'Super Administrador Softcase'
};

// Server-side Authentication Endpoint (Emits signed HMAC session tokens)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { mode, email, password, identificador, senha } = req.body;

    if (mode === 'ADMIN') {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPass = String(password || '').trim();
      if (!cleanEmail || !cleanPass) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      // 1. Tentar autenticar no Supabase Auth
      if (supabase) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass
          });
          if (!authErr && authData?.session?.access_token && authData?.user) {
            return res.json({
              success: true,
              token: authData.session.access_token,
              supabaseSession: authData.session,
              user: authData.user
            });
          }
        } catch {
          // Segue para validação local administrativa
        }
      }

      // 2. Verificar credenciais do Super Admin padrão do ambiente
      if (cleanEmail === DEFAULT_ADMIN.email.toLowerCase() && cleanPass === DEFAULT_ADMIN.password) {
        const adminUser = {
          id: 'admin-master',
          email: DEFAULT_ADMIN.email,
          user_metadata: {
            nome: DEFAULT_ADMIN.nome,
            role: 'SUPER_ADMIN',
            roleLabel: 'Super Administrador Softcase',
            tenantId: 'tenant-01',
            tenantNome: 'Softcase Tecnologia'
          }
        };
        const token = signSessionToken(adminUser);
        await logEvent('tenant-01', `Login administrativo realizado por ${cleanEmail}`);
        return res.json({ success: true, token, user: adminUser });
      }

      return res.status(401).json({ error: 'E-mail ou senha inválidos para acesso corporativo.' });
    }

    // Login de Colaborador / Gestor / RH por CPF, E-mail ou Matrícula + PIN/Senha
    const cleanIdent = String(identificador || '').trim();
    const cleanSenha = String(senha || '').trim();
    if (!cleanIdent || !cleanSenha) {
      return res.status(400).json({ error: 'Informe seu identificador (CPF, E-mail ou Matrícula) e sua senha/PIN.' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Base de dados Supabase indisponível para autenticação.' });
    }

    const cleanDigits = cleanIdent.replace(/\D/g, '');
    const lowerIdent = cleanIdent.toLowerCase();

    const { data: allColabs, error: fetchErr } = await supabase
      .from('collaborators')
      .select('*');
    if (fetchErr) throw fetchErr;

    const colab = (allColabs || []).find((c: any) => {
      const cCpfDigits = (c.cpf || '').replace(/\D/g, '');
      const cEmail = parseColabEmail(c);
      return (
        (cleanDigits.length === 11 && cCpfDigits === cleanDigits) ||
        (c.cpf || '').trim() === cleanIdent ||
        (c.matricula || '').trim().toLowerCase() === lowerIdent ||
        (cEmail && cEmail === lowerIdent)
      );
    });

    if (!colab) {
      return res.status(401).json({ error: 'Colaborador não encontrado. Verifique CPF, E-mail ou Matrícula.' });
    }

    if (colab.status === 'DESLIGADO') {
      return res.status(403).json({ error: 'Acesso bloqueado: colaborador com vínculo desligado.' });
    }
    if (colab.status === 'PENDENTE') {
      return res.status(403).json({ error: 'Seu auto-cadastro ainda está pendente de aprovação pelo RH.' });
    }

    const pinCheck = verifyPin(cleanSenha, colab.pin_coletor || '');
    if (!pinCheck.valid) {
      return res.status(401).json({ error: 'Senha/PIN incorreto. Em caso de dúvida, utilize "Esqueci meu acesso" ou procure o RH.' });
    }

    if (pinCheck.needsUpgrade) {
      await supabase
        .from('collaborators')
        .update({ pin_coletor: hashPin(cleanSenha), updated_at: getBrasiliaTimeParts().iso })
        .eq('collaborator_id', colab.collaborator_id);
    }

    // Buscar nome do tenant
    let tenantNome = 'Softcase Tecnologia';
    const { data: tenantRow } = await supabase
      .from('tenants')
      .select('razao_social, nome_fantasia')
      .eq('tenant_id', colab.tenant_id)
      .maybeSingle();
    if (tenantRow) {
      tenantNome = tenantRow.nome_fantasia || tenantRow.razao_social;
    }

    const role = resolveCollaboratorRole(colab.cargo_titulo);
    const colabEmail = parseColabEmail(colab) || `${colab.collaborator_id}@pointcontrol.local`;
    const sessionUser = {
      id: `user-${colab.collaborator_id}`,
      email: colabEmail,
      user_metadata: {
        nome: colab.nome,
        role,
        roleLabel: colab.cargo_titulo || 'Colaborador',
        tenantId: colab.tenant_id,
        tenantNome,
        collaboratorId: colab.collaborator_id,
        cpf: colab.cpf
      }
    };

    const token = signSessionToken(sessionUser);
    await logEvent(colab.tenant_id, `Login de ${colab.nome} (${role}) efetuado com sucesso.`);

    return res.json({
      success: true,
      token,
      user: sessionUser,
      colaborador: mapCollaboratorRow(colab)
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error?.message || 'Erro interno ao autenticar.' });
  }
});

// Valida e reidrata a sessão persistida no refresh da página
app.get('/api/auth/session', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente.' });

  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await getAuthenticatedUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const collaboratorId = user.user_metadata?.collaboratorId;
    let colaborador: any = null;

    if (supabase && collaboratorId) {
      const { data: colabRow, error: colabErr } = await supabase
        .from('collaborators')
        .select('*')
        .eq('collaborator_id', collaboratorId)
        .maybeSingle();

      if (colabErr) throw colabErr;
      if (colabRow) {
        if (colabRow.status === 'DESLIGADO' || colabRow.status === 'PENDENTE') {
          return res.status(403).json({ error: 'Vínculo bloqueado ou pendente de aprovação.' });
        }
        colaborador = mapCollaboratorRow(colabRow);
      }
    }

    res.json({
      success: true,
      user,
      colaborador
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro ao validar sessão.' });
  }
});

// Update Supabase Config Dynamically (Protected: SUPER_ADMIN only)
app.post('/api/update-config', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.split('Bearer ')[1];
  const user = await getAuthenticatedUser(token);
  if (!user || !isSuperAdmin(user)) {
    return res.status(403).json({ error: 'Forbidden: Somente SUPER_ADMIN pode reconfigurar o servidor.' });
  }

  const { url, key } = req.body;
  if (!url || !key) return res.status(400).json({ error: 'URL and Key are required' });

  const success = initSupabase(url, key);
  if (success) {
    res.json({ success: true, message: 'Configuração atualizada para esta sessão do servidor.' });
  } else {
    res.status(500).json({ error: 'Falha ao inicializar Supabase com as novas chaves.' });
  }
});

// Bootstrap Admin User (Protected: requires SUPER_ADMIN token OR empty DB with setupSecret)
app.post('/api/bootstrap-admin', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

  const authHeader = req.headers.authorization;
  let authorized = false;

  if (authHeader?.startsWith('Bearer ')) {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (user && isSuperAdmin(user)) authorized = true;
  }

  if (!authorized) {
    const setupSecret = req.body?.setupSecret;
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || DEFAULT_ADMIN.password;
    const { count } = await supabase.from('collaborators').select('*', { count: 'exact', head: true });
    if ((count === 0 || count === null) && setupSecret === expectedSecret) {
      authorized = true;
    }
  }

  if (!authorized) {
    return res.status(403).json({ error: 'Forbidden: Necessário token de Super Admin para executar bootstrap.' });
  }

  const email = req.body?.email || DEFAULT_ADMIN.email;
  const password = req.body?.password || DEFAULT_ADMIN.password;
  const nome = req.body?.nome || DEFAULT_ADMIN.nome;

  try {
    try {
      if (supabase.auth?.admin?.createUser) {
        const { error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            nome,
            role: 'SUPER_ADMIN',
            roleLabel: 'Super Administrador Softcase',
            tenantId: 'tenant-01',
            tenantNome: 'Softcase Tecnologia'
          }
        });
        if (authError && authError.message !== 'User already exists') {
          console.warn('Auth admin warning, falling back to signUp:', authError.message);
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nome,
                role: 'SUPER_ADMIN',
                roleLabel: 'Super Administrador Softcase',
                tenantId: 'tenant-01',
                tenantNome: 'Softcase Tecnologia'
              }
            }
          });
        }
      }
    } catch (authErr) {
      console.warn('GoTrue create user warning:', authErr);
    }

    await supabase.from('tenants').upsert(
      {
        tenant_id: 'tenant-01',
        cnpj: '00.000.000/0001-91',
        razao_social: 'Softcase Tecnologia',
        nome_fantasia: 'Softcase',
        slug: 'softcase',
        plano: 'REP-P Corporativo',
        licencas_contratadas: 9999,
        email_admin: email,
        status: 'ATIVO'
      },
      { onConflict: 'tenant_id' }
    );

    await supabase.from('collaborators').upsert(
      {
        collaborator_id: 'colab-admin-01',
        tenant_id: 'tenant-01',
        nome,
        cpf: '000.000.000-00',
        matricula: 'ADM-001',
        email,
        data_admissao: '2024-01-01',
        cargo_titulo: 'Super Administrador',
        departamento_nome: 'Tecnologia / RH',
        status: 'ATIVO'
      },
      { onConflict: 'collaborator_id' }
    );

    res.json({
      success: true,
      message: 'Admin configurado e persistido no Supabase com sucesso.',
      adminEmail: email
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Decision Logic and Auth Middleware
app.post('/api/validate-point', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const user = await getAuthenticatedUser(token);
    if (!user) {
      await logEvent('unknown', 'Unauthorized access attempt');
      return res.status(401).send('Unauthorized');
    }

    const { tenantId, collaboratorId, lat, lng, establishment } = req.body;

    if (!canAccessTenant(user, tenantId)) {
      await logEvent(user.user_metadata?.tenantId || 'unknown', `Forbidden access attempt to tenant ${tenantId}`);
      return res.status(403).send('Forbidden');
    }

    const distance = calculateDistanceMeters(lat, lng, establishment.latitude, establishment.longitude);
    if (distance > establishment.cercaRaioMetros && establishment.bloquearForaDoRaio) {
      await logEvent(tenantId, `Point rejected: Outside geofence for ${collaboratorId}`);
      return res.status(403).json({ valid: false, reason: 'Outside geofence', distance });
    }

    await logEvent(tenantId, `Point validation successful for collaborator ${collaboratorId}`);
    res.json({ valid: true, distance });
  } catch (error) {
    await logEvent('error', `Server error: ${error}`);
    res.status(503).send('Service Unavailable');
  }
});

// Store encrypted biometric template
app.post('/api/save-biometric', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const { collaboratorId, encryptedTemplate, tenantId, vector } = req.body;
    if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, collaboratorId)) {
      return res.status(403).send('Forbidden');
    }

    let existingMeta: Record<string, any> = {};
    if (supabase) {
      try {
        const { data: existingRow } = await supabase
          .from('collaborators')
          .select('biometric_template, email, telefone')
          .eq('collaborator_id', collaboratorId)
          .maybeSingle();
        if (existingRow?.email) existingMeta.email = existingRow.email;
        if (existingRow?.telefone) existingMeta.telefone = existingRow.telefone;
        if (existingRow?.biometric_template) {
          const parsed =
            typeof existingRow.biometric_template === 'string'
              ? JSON.parse(existingRow.biometric_template)
              : existingRow.biometric_template;
          if (parsed && typeof parsed === 'object') {
            if (parsed.email) existingMeta.email = parsed.email;
            if (parsed.telefone) existingMeta.telefone = parsed.telefone;
            if (parsed.pretensaoDepto) existingMeta.pretensaoDepto = parsed.pretensaoDepto;
            if (parsed.pretensaoCargo) existingMeta.pretensaoCargo = parsed.pretensaoCargo;
          }
        }
      } catch {
        // Ignora parse
      }
    }

    const secureTemplate =
      encryptedTemplate && encryptedTemplate.includes(':')
        ? encryptedTemplate
        : encryptBiometricTemplate(encryptedTemplate || `template_${collaboratorId}_${Date.now()}`);

    const lgpdEnvelope = JSON.stringify({
      ...existingMeta,
      standard: 'ISO/IEC 19794-5',
      encryption: 'AES-256-GCM',
      lgpd_compliant: true,
      enrolled: true,
      consent_timestamp: getBrasiliaTimeParts().iso,
      template: secureTemplate,
      ...(Array.isArray(vector) && vector.length === 64 ? { vector } : {})
    });

    if (supabase) {
      const { error: dbError } = await supabase
        .from('collaborators')
        .update({
          biometric_template: lgpdEnvelope,
          biometria_cadastrada: true,
          updated_at: getBrasiliaTimeParts().iso
        })
        .eq('collaborator_id', collaboratorId);

      if (dbError) {
        throw dbError;
      }
    }

    await logEvent(tenantId || 'tenant-01', `Biometric template updated and AES-256 encrypted for collaborator ${collaboratorId}`);
    res.json({ success: true, encrypted: true, template: lgpdEnvelope });
  } catch (error) {
    console.error('Save biometric error:', error);
    await logEvent('error', `Save biometric error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Remove biometric template cleanly (preserving contact metadata)
app.post('/api/remove-biometric', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const { collaboratorId, tenantId } = req.body;
    if (!collaboratorId) return res.status(400).json({ error: 'collaboratorId obrigatório.' });
    if (!canAccessTenant(user, tenantId) || !isManagerOrAdmin(user)) {
      return res.status(403).send('Forbidden');
    }

    let preservedMeta: Record<string, any> = {};
    if (supabase) {
      const { data: existingRow } = await supabase
        .from('collaborators')
        .select('biometric_template, email, telefone')
        .eq('collaborator_id', collaboratorId)
        .maybeSingle();

      if (existingRow?.email) preservedMeta.email = existingRow.email;
      if (existingRow?.telefone) preservedMeta.telefone = existingRow.telefone;
      if (existingRow?.biometric_template) {
        try {
          const parsed =
            typeof existingRow.biometric_template === 'string'
              ? JSON.parse(existingRow.biometric_template)
              : existingRow.biometric_template;
          if (parsed && typeof parsed === 'object') {
            if (parsed.email) preservedMeta.email = parsed.email;
            if (parsed.telefone) preservedMeta.telefone = parsed.telefone;
            if (parsed.pretensaoDepto) preservedMeta.pretensaoDepto = parsed.pretensaoDepto;
            if (parsed.pretensaoCargo) preservedMeta.pretensaoCargo = parsed.pretensaoCargo;
          }
        } catch {
          // ignore
        }
      }

      const nextTemplateValue = Object.keys(preservedMeta).length > 0 ? JSON.stringify(preservedMeta) : null;

      const { error: updateErr } = await supabase
        .from('collaborators')
        .update({
          biometric_template: nextTemplateValue,
          biometria_cadastrada: false,
          updated_at: getBrasiliaTimeParts().iso
        })
        .eq('collaborator_id', collaboratorId);

      if (updateErr) throw updateErr;
    }

    await logEvent(tenantId || 'tenant-01', `Biometria removida pelo RH para colaborador ${collaboratorId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove biometric error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Biometric audit summary per collaborator (replaces fake frontend random metrics)
app.get('/api/biometric-audit-summary', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!supabase) return res.json({ summary: {} });

    const { data, error } = await supabase
      .from('biometric_audit_logs')
      .select('collaborator_id, similarity, liveness_score, verdict, timestamp')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) return res.json({ summary: {} });

    const summary: Record<string, { count: number; avgSimilarity: number; lastVerdict: string; lastTimestamp: string }> = {};
    const accum: Record<string, { sumSim: number; count: number; lastVerdict: string; lastTimestamp: string }> = {};

    for (const row of data || []) {
      const id = row.collaborator_id;
      if (!accum[id]) {
        accum[id] = {
          sumSim: Number(row.similarity || 0),
          count: 1,
          lastVerdict: row.verdict || '',
          lastTimestamp: row.timestamp || ''
        };
      } else {
        accum[id].sumSim += Number(row.similarity || 0);
        accum[id].count += 1;
      }
    }

    for (const [id, st] of Object.entries(accum)) {
      summary[id] = {
        count: st.count,
        avgSimilarity: Math.round((st.sumSim / st.count) * 10) / 10,
        lastVerdict: st.lastVerdict,
        lastTimestamp: st.lastTimestamp
      };
    }

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Store Biometric Audit Log (Portaria 671)
app.post('/api/save-biometric-audit', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const auditData = req.body;
    if (!canAccessTenant(user, auditData.tenantId)) {
      return res.status(403).send('Forbidden');
    }

    const insertPayload: Record<string, any> = {
      tenant_id: auditData.tenantId || 'tenant-01',
      collaborator_id: auditData.collaboratorId,
      timestamp: auditData.timestamp || getBrasiliaTimeParts().iso,
      similarity: auditData.similarity,
      lighting_condition: auditData.lightingCondition,
      liveness_score: auditData.livenessScore,
      verdict: auditData.verdict,
      algorithm_used: auditData.algorithmUsed || 'ISO19794-5',
      hash_template: auditData.hashTemplate || 'ISO19794-5'
    };
    if (auditData.contingencySelfieDataUrl) {
      insertPayload.contingency_selfie_url = auditData.contingencySelfieDataUrl;
    }

    let { data, error: dbError } = await supabase
      .from('biometric_audit_logs')
      .insert(insertPayload)
      .select();

    if (dbError && insertPayload.contingency_selfie_url && String(dbError.message || '').includes('contingency_selfie_url')) {
      delete insertPayload.contingency_selfie_url;
      const retry = await supabase.from('biometric_audit_logs').insert(insertPayload).select();
      data = retry.data;
      dbError = retry.error;
    }

    if (dbError) {
      throw dbError;
    }

    await logEvent(
      auditData.tenantId || 'tenant-01',
      `Biometric audit recorded for ${auditData.collaboratorId}: Verdict=${auditData.verdict}, Similarity=${auditData.similarity}%, Liveness=${auditData.livenessScore}%`
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error('Save biometric audit error:', error);
    await logEvent('error', `Save biometric audit error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Create/Update Collaborator
app.post('/api/save-collaborator', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const collaborator = req.body;
    if (!canAccessTenant(user, collaborator.tenantId) || !isManagerOrAdmin(user)) {
      return res.status(403).send('Forbidden');
    }

    // Preservar template biométrico real caso exista e o payload não envie novo vetor
    let nextTemplate = collaborator.biometriaHashTemplate;
    let nextBioCadastrada = collaborator.biometriaCadastrada;

    const { data: existingRow } = await supabase
      .from('collaborators')
      .select('biometric_template, biometria_cadastrada')
      .eq('collaborator_id', collaborator.id)
      .maybeSingle();

    if (existingRow?.biometric_template) {
      try {
        const existingParsed =
          typeof existingRow.biometric_template === 'string'
            ? JSON.parse(existingRow.biometric_template)
            : existingRow.biometric_template;
        if (existingParsed && typeof existingParsed === 'object' && Array.isArray(existingParsed.vector)) {
          const merged = {
            ...existingParsed,
            ...(collaborator.email ? { email: collaborator.email } : {}),
            ...(collaborator.telefone ? { telefone: collaborator.telefone } : {})
          };
          nextTemplate = JSON.stringify(merged);
          nextBioCadastrada = true;
        }
      } catch {
        // ignore
      }
    }

    if (!nextTemplate && (collaborator.email || collaborator.telefone)) {
      nextTemplate = JSON.stringify({
        email: collaborator.email || '',
        telefone: collaborator.telefone || ''
      });
    }

    const payload: Record<string, any> = {
      collaborator_id: collaborator.id,
      tenant_id: collaborator.tenantId,
      nome: collaborator.nome,
      cpf: collaborator.cpf,
      matricula: collaborator.matricula,
      pis: collaborator.pis,
      email: collaborator.email || null,
      telefone: collaborator.telefone || null,
      data_admissao: collaborator.dataAdmissao,
      cargo_id: collaborator.cargoId,
      cargo_titulo: collaborator.cargoTitulo,
      departamento_id: collaborator.departamentoId,
      departamento_nome: collaborator.departamentoNome,
      gestor_id: collaborator.gestorId,
      gestor_nome: collaborator.gestorNome,
      estabelecimento_id: collaborator.estabelecimentoId,
      estabelecimento_nome: collaborator.estabelecimentoNome,
      regime: collaborator.regime,
      horario_inicio: collaborator.horarioInicio,
      horario_fim: collaborator.horarioFim,
      carga_horaria_diaria: collaborator.cargaHorariaDiariaHoras,
      intervalo_minutos: collaborator.intervaloMinutos,
      max_minutos_antecedencia: collaborator.maxMinutosAntecedenciaPermitido,
      regra_antecedencia_ativa: collaborator.regraAntecedenciaAtiva,
      tipo_escala: collaborator.tipoEscala || '5x2',
      turma_escala: collaborator.turmaEscala || 'A',
      dias_folga_semana: collaborator.diasFolgaSemana ?? null,
      anual_folgas: collaborator.anualFolgas ?? null,
      limiar_confianca_minimo: collaborator.limiarConfiancaMinimo ?? 82,
      biometria_cadastrada: Boolean(nextBioCadastrada),
      status: collaborator.status,
      updated_at: getBrasiliaTimeParts().iso
    };

    if (collaborator.dataBaseCiclo) {
      payload.data_base_ciclo = collaborator.dataBaseCiclo;
    }

    if (collaborator.pinColetor && String(collaborator.pinColetor).trim().length > 0) {
      const rawPin = String(collaborator.pinColetor).trim();
      payload.pin_coletor = rawPin.startsWith('scrypt$') ? rawPin : hashPin(rawPin);
    }

    if (nextTemplate !== undefined) {
      payload.biometric_template = nextTemplate;
    }

    let { data, error: dbError } = await supabase
      .from('collaborators')
      .upsert(payload, { onConflict: 'collaborator_id' })
      .select();

    if (dbError && payload.data_base_ciclo && String(dbError.message || '').includes('data_base_ciclo')) {
      delete payload.data_base_ciclo;
      const retry = await supabase.from('collaborators').upsert(payload, { onConflict: 'collaborator_id' }).select();
      data = retry.data;
      dbError = retry.error;
    }

    if (dbError) throw dbError;

    await logEvent(collaborator.tenantId, `Collaborator ${collaborator.nome} (${collaborator.matricula}) saved/updated.`);
    res.json({ success: true, data });
  } catch (error) {
    await logEvent('error', `Save collaborator error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Auto-cadastro de Colaborador (Pendente de Aprovação pelo Gestor/RH)
app.post('/api/self-register', async (req, res) => {
  try {
    const { nome, cpf, email, telefone, departamentoNome, cargoTitulo, senha, tenantId: reqTenantId } = req.body;
    if (!nome || !cpf) {
      return res.status(400).json({ error: 'Nome e CPF são campos obrigatórios.' });
    }
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return res.status(400).json({ error: 'CPF deve conter exatamente 11 dígitos numéricos.' });
    }
    if (!senha || String(senha).trim().length < 4) {
      return res.status(400).json({ error: 'Defina uma senha/PIN pessoal com pelo menos 4 caracteres.' });
    }

    let tenantId = (reqTenantId || 'tenant-01').trim();
    if (supabase) {
      const { data: tenantCheck } = await supabase
        .from('tenants')
        .select('tenant_id, status')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (!tenantCheck || tenantCheck.status !== 'ATIVO') {
        return res.status(400).json({ error: 'Empresa selecionada inválida ou inativa.' });
      }
    }

    const colabId = `colab-auto-${cleanCpf.slice(-6)}-${Date.now().toString().slice(-4)}`;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedTelefone = (telefone || '').trim();
    const normalizedDepto = departamentoNome || 'A Definir pelo Gestor';
    const normalizedCargo = cargoTitulo || 'A Definir pelo Gestor';
    const formattedCpf = `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9)}`;

    const metadataBio = JSON.stringify({
      email: normalizedEmail,
      telefone: normalizedTelefone,
      pretensaoDepto: normalizedDepto,
      pretensaoCargo: normalizedCargo
    });

    if (!supabase) {
      return res.status(503).json({ error: 'Banco de dados indisponível para concluir o auto-cadastro.' });
    }

    const { data: allColabs, error: lookupErr } = await supabase
      .from('collaborators')
      .select('collaborator_id, cpf, email, biometric_template, status');
    if (lookupErr) throw lookupErr;

    const duplicate = (allColabs || []).find((c: any) => {
      const existingCpfDigits = String(c.cpf || '').replace(/\D/g, '');
      const existingEmail = parseColabEmail(c);
      return existingCpfDigits === cleanCpf || (normalizedEmail && existingEmail === normalizedEmail);
    });

    if (duplicate) {
      return res.status(409).json({
        error:
          duplicate.status === 'PENDENTE'
            ? 'Já existe um auto-cadastro pendente de aprovação para este CPF ou e-mail.'
            : 'Já existe um cadastro ativo ou registrado com este CPF ou e-mail. Utilize a aba "Entrar" ou "Esqueci meu acesso".'
      });
    }

    const hashedPin = hashPin(String(senha).trim());
    const { data, error: insertErr } = await supabase
      .from('collaborators')
      .insert({
        collaborator_id: colabId,
        tenant_id: tenantId,
        nome: nome.trim(),
        cpf: formattedCpf,
        matricula: `PEND-${cleanCpf.slice(0, 4)}`,
        email: normalizedEmail || null,
        telefone: normalizedTelefone || null,
        data_admissao: getBrasiliaTimeParts().ymd,
        cargo_titulo: normalizedCargo,
        departamento_nome: normalizedDepto,
        status: 'PENDENTE',
        pin_coletor: hashedPin,
        biometria_cadastrada: false,
        biometric_template: metadataBio,
        updated_at: getBrasiliaTimeParts().iso
      })
      .select();

    if (insertErr) throw insertErr;
    const savedData = data && data[0] ? data[0] : null;

    await logEvent(tenantId, `Novo auto-cadastro de colaborador pendente: ${nome} (CPF: ${formattedCpf})`);

    res.json({
      success: true,
      message: 'Cadastro recebido com sucesso! Suas informações foram enviadas para aprovação do gestor de RH.',
      colabId,
      data: savedData
        ? {
            ...savedData,
            pin_coletor: undefined,
            email: normalizedEmail,
            telefone: normalizedTelefone,
            pretensaoDepto: normalizedDepto,
            pretensaoCargo: normalizedCargo
          }
        : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao processar auto-cadastro' });
  }
});

// Recuperação de Acesso / Redefinição de Senha ou PIN (Exige 3 fatores: CPF + E-mail/Matrícula + Data de Admissão)
app.post('/api/recover-access', async (req, res) => {
  try {
    const { identificador, segundoFator, dataAdmissao, novaSenha } = req.body;
    if (!identificador || !identificador.trim()) {
      return res.status(400).json({ error: 'Informe seu CPF.' });
    }
    if (!segundoFator || !segundoFator.trim()) {
      return res.status(400).json({ error: 'Informe o 2º fator de validação (E-mail corporativo ou Matrícula).' });
    }
    if (!dataAdmissao || !String(dataAdmissao).trim()) {
      return res.status(400).json({ error: 'Informe o 3º fator de validação (Data de Admissão).' });
    }

    if (!supabase) {
      return res.status(503).json({ error: 'Supabase não configurado.' });
    }

    const cleanCpfDigits = identificador.replace(/\D/g, '');
    const cleanSecond = segundoFator.trim().toLowerCase();
    const cleanAdmissao = String(dataAdmissao).trim().slice(0, 10);

    const { data: allColabs, error } = await supabase.from('collaborators').select('*');
    if (error) throw error;

    const colabEncontrado = (allColabs || []).find((c: any) => {
      const cCpfDigits = (c.cpf || '').replace(/\D/g, '');
      const cpfMatch =
        (cleanCpfDigits.length === 11 && cCpfDigits === cleanCpfDigits) ||
        (c.cpf || '').trim() === identificador.trim();
      if (!cpfMatch) return false;

      const cEmail = parseColabEmail(c);
      const cMat = (c.matricula || '').trim().toLowerCase();
      const secondOk = (cEmail && cEmail === cleanSecond) || (cMat && cMat === cleanSecond);
      if (!secondOk) return false;

      const cAdmissao = String(c.data_admissao || '').trim().slice(0, 10);
      return cAdmissao === cleanAdmissao;
    });

    if (!colabEncontrado) {
      return res.status(404).json({
        error: 'Os três fatores informados (CPF + E-mail/Matrícula + Data de Admissão) não conferem com nenhum cadastro ativo. Procure o RH.'
      });
    }

    if (colabEncontrado.status === 'DESLIGADO') {
      return res.status(403).json({ error: 'Colaborador desligado não pode redefinir acesso.' });
    }
    if (colabEncontrado.status === 'PENDENTE') {
      return res.status(403).json({ error: 'Auto-cadastro pendente de aprovação pelo RH ainda não possui acesso liberado.' });
    }

    const targetRole = resolveCollaboratorRole(colabEncontrado.cargo_titulo);
    if (targetRole === 'SUPER_ADMIN' || targetRole === 'RH_ADMIN') {
      return res.status(403).json({
        error: 'Contas administrativas (Super Admin / RH) não podem ser redefinidas por recuperação simplificada. Solicite intervenção administrativa.'
      });
    }

    if (novaSenha && String(novaSenha).trim().length > 0) {
      if (String(novaSenha).trim().length < 4) {
        return res.status(400).json({ error: 'A nova senha/PIN deve possuir pelo menos 4 caracteres.' });
      }
      const { error: updateErr } = await supabase
        .from('collaborators')
        .update({ pin_coletor: hashPin(String(novaSenha).trim()), updated_at: getBrasiliaTimeParts().iso })
        .eq('collaborator_id', colabEncontrado.collaborator_id);

      if (updateErr) throw updateErr;

      await logEvent(
        colabEncontrado.tenant_id,
        `Redefinição de senha via triplo fator concluída para ${colabEncontrado.nome}`
      );

      return res.json({
        success: true,
        message: `Senha de ${colabEncontrado.nome} atualizada com sucesso! Faça login com a nova senha.`,
        nome: colabEncontrado.nome
      });
    }

    return res.json({
      success: true,
      message: `Identidade confirmada para ${colabEncontrado.nome}. Defina sua nova senha abaixo.`,
      nome: colabEncontrado.nome
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao recuperar acesso' });
  }
});

// Save/Update Tenant (inclui endereço completo, CEP, coordenadas e geofence)
app.post('/api/save-tenant', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const tenant = req.body;
    const isOwnRhAdmin = user.user_metadata?.role === 'RH_ADMIN' && user.user_metadata?.tenantId === tenant.id;
    if (!isSuperAdmin(user) && !isOwnRhAdmin) {
      return res.status(403).send('Forbidden: Only SUPER_ADMIN or Tenant RH_ADMIN can manage tenants');
    }

    const { data, error: dbError } = await supabase
      .from('tenants')
      .upsert(
        {
          tenant_id: tenant.id,
          cnpj: tenant.cnpj,
          razao_social: tenant.razaoSocial,
          nome_fantasia: tenant.nomeFantasia,
          slug: tenant.slug,
          plano: tenant.plano,
          licencas_contratadas: tenant.licencasContratadas,
          email_admin: tenant.emailAdmin,
          status: tenant.status,
          cep: tenant.cep || null,
          logradouro: tenant.logradouro || null,
          numero: tenant.numero || null,
          complemento: tenant.complemento || null,
          bairro: tenant.bairro || null,
          municipio: tenant.municipio || null,
          uf: tenant.uf || null,
          endereco_completo: tenant.enderecoCompleto || null,
          latitude: tenant.latitude ?? null,
          longitude: tenant.longitude ?? null,
          cerca_raio_metros: tenant.cercaRaioMetros ?? 150,
          bloquear_fora_do_raio: tenant.bloquearForaDoRaio ?? true
        },
        { onConflict: 'tenant_id' }
      )
      .select();

    if (dbError) throw dbError;

    await logEvent(tenant.id || 'system', `Tenant saved/updated: ${tenant.razaoSocial}`);
    res.json({ success: true, data });
  } catch (error) {
    await logEvent('error', `Save tenant error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Save Point Registration
app.post('/api/save-point', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const registration = req.body;
    if (!canAccessTenant(user, registration.tenantId)) {
      return res.status(403).send('Forbidden');
    }

    const { data, error: dbError } = await supabase
      .from('point_registrations')
      .insert({
        nsr: registration.nsr,
        tenant_id: registration.tenantId,
        collaborator_id: registration.colaboradorId,
        data_hora: registration.dataHora,
        tipo_marcacao: registration.tipoMarcacao,
        latitude: registration.latitude,
        longitude: registration.longitude,
        hash_sha256: registration.hashSha256,
        modo_dispositivo: registration.modoDispositivo,
        detalhes: JSON.stringify(registration)
      })
      .select();

    if (dbError) throw dbError;

    await logEvent(registration.tenantId, `Point registered for ${registration.colaboradorId} (${registration.tipoMarcacao})`);
    res.json({ success: true, data });
  } catch (error) {
    await logEvent('error', `Save point error: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Save Point Signature (Espelho de Ponto)
app.post('/api/save-signature', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const signature = req.body;
    if (!canAccessTenant(user, signature.tenantId) || !canActForCollaborator(user, signature.colaboradorId)) {
      return res.status(403).send('Forbidden');
    }

    const realIp = getClientIp(req);
    const { data, error: dbError } = await supabase
      .from('point_signatures')
      .insert({
        tenant_id: signature.tenantId,
        collaborator_id: signature.colaboradorId,
        mes_ano: signature.mesAno,
        data_hora_assinatura: signature.dataHoraAssinatura || getBrasiliaTimeParts().iso,
        hash_assinatura_sha256: signature.hashAssinaturaSha256,
        ip_address: realIp,
        dispositivo_info: signature.dispositivoInfo,
        rubrica_data_url: signature.rubricaDataUrl,
        status: signature.status || 'ASSINADO'
      })
      .select();

    if (dbError) throw dbError;

    await logEvent(signature.tenantId, `Point sheet signed for ${signature.colaboradorId} (Month: ${signature.mesAno})`);
    res.json({ success: true, data, ipAddress: realIp });
  } catch (error) {
    console.error('Save signature error:', error);
    await logEvent('error', `Save signature error: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Save/Update Point Adjustment Request
app.post('/api/save-adjustment', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const adjustment = req.body;
    if (!canAccessTenant(user, adjustment.tenantId) || !canActForCollaborator(user, adjustment.colaboradorId)) {
      return res.status(403).send('Forbidden');
    }

    const { data, error: dbError } = await supabase
      .from('adjustment_requests')
      .upsert(
        {
          request_id: adjustment.id,
          tenant_id: adjustment.tenantId,
          collaborator_id: adjustment.colaboradorId,
          data: adjustment.data,
          tipo: adjustment.tipo,
          horario_ajuste: adjustment.horarioAjuste,
          tipo_marcacao_ajuste: adjustment.tipoMarcacaoAjuste,
          cid10: adjustment.cid10,
          nome_documento_anexo: adjustment.nomeDocumentoAnexo,
          anexo_url: adjustment.anexoUrl || null,
          gestor_id: adjustment.gestorId || null,
          gestor_nome: adjustment.gestorNome || null,
          data_hora_envio: adjustment.dataHoraEnvio || getBrasiliaTimeParts().iso,
          justificativa: adjustment.justificativa,
          status: adjustment.status || 'PENDENTE',
          resposta_gestor: adjustment.respostaGestor,
          data_decisao: adjustment.dataDecisao,
          detalhes: JSON.stringify(adjustment)
        },
        { onConflict: 'request_id' }
      )
      .select();

    if (dbError) throw dbError;

    await logEvent(adjustment.tenantId, `Adjustment request ${adjustment.status} for ${adjustment.colaboradorId}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Save adjustment error:', error);
    await logEvent('error', `Save adjustment error: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Save/Update Paystub (Holerite) in Supabase
app.post('/api/save-holerite', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const holerite = req.body;
    if (!canAccessTenant(user, holerite.tenantId) || !isManagerOrAdmin(user)) {
      return res.status(403).send('Forbidden');
    }

    const { data, error: dbError } = await supabase
      .from('paystubs')
      .upsert(
        {
          paystub_id: holerite.id,
          tenant_id: holerite.tenantId || 'tenant-01',
          collaborator_id: holerite.colaboradorId,
          collaborator_cpf: holerite.colaboradorCpf,
          collaborator_name: holerite.colaboradorNome,
          mes_ano: holerite.mesAno,
          competencia: holerite.competencia,
          salario_bruto: holerite.salarioBruto,
          descontos: holerite.descontos,
          salario_liquido: holerite.liquido,
          arquivo_nome: holerite.arquivoNome,
          arquivo_url: holerite.arquivoUrl || null,
          data_upload: getBrasiliaTimeParts().iso,
          status: holerite.status || 'EMITIDO_EMPRESA',
          observacao: holerite.observacao || null
        },
        { onConflict: 'paystub_id' }
      )
      .select();

    if (dbError) throw dbError;

    await logEvent(holerite.tenantId || 'tenant-01', `Holerite ${holerite.competencia} salvo no Supabase para ${holerite.colaboradorNome}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Save holerite error:', error);
    await logEvent('error', `Save holerite error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Confirm/Sign Paystub Receipt (CLT Art. 464 Compliance)
app.post('/api/confirm-holerite', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const { paystubId, tenantId, colaboradorId } = req.body;
    if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, colaboradorId)) {
      return res.status(403).send('Forbidden');
    }

    const clientIp = getClientIp(req);
    const nowIso = getBrasiliaTimeParts().iso;
    const rawPayload = `${paystubId}|${colaboradorId}|${nowIso}|${clientIp}|RECIBO_HOLERITE_CLT_464`;
    const hashSignature = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const { data, error: dbError } = await supabase
      .from('paystubs')
      .update({
        status: 'CONFIRMADO_PELO_COLABORADOR',
        confirmado_em: nowIso,
        confirmado_ip: clientIp,
        confirmado_hash: hashSignature
      })
      .eq('paystub_id', paystubId)
      .select();

    if (dbError) throw dbError;

    await logEvent(tenantId || 'tenant-01', `Recibo de holerite ${paystubId} assinado digitalmente (Art. 464 CLT) por ${colaboradorId}`);
    res.json({
      success: true,
      confirmadoEm: nowIso,
      confirmadoIp: clientIp,
      confirmadoHash: hashSignature,
      data
    });
  } catch (error) {
    console.error('Confirm holerite error:', error);
    await logEvent('error', `Confirm holerite error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Save Income Tax Annual Statement (Informe de Rendimentos IRPF)
app.post('/api/save-informe-irpf', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const informe = req.body;
    if (!canAccessTenant(user, informe.tenantId) || !isManagerOrAdmin(user)) {
      return res.status(403).send('Forbidden');
    }

    const { data, error: dbError } = await supabase
      .from('tax_reports')
      .upsert(
        {
          report_id: informe.id,
          tenant_id: informe.tenantId || 'tenant-01',
          collaborator_id: informe.colaboradorId,
          collaborator_cpf: informe.colaboradorCpf,
          collaborator_name: informe.colaboradorNome,
          ano_calendario: informe.anoCalendario,
          rendimentos_tributaveis: informe.rendimentosTributaveis,
          contribuicao_previdenciaria: informe.contribuicaoPrevidenciaria,
          imposto_retido_fonte: informe.impostoRetidoFonte,
          arquivo_nome: informe.arquivoNome,
          arquivo_url: informe.arquivoUrl || null,
          data_upload: getBrasiliaTimeParts().iso,
          status: 'DISPONIVEL'
        },
        { onConflict: 'report_id' }
      )
      .select();

    if (dbError) throw dbError;

    await logEvent(informe.tenantId || 'tenant-01', `Informe IRPF ${informe.anoCalendario} publicado para ${informe.colaboradorNome}`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Save informe IRPF error:', error);
    await logEvent('error', `Save informe IRPF error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Create Auth User (requires Service Role Key + Admin)
app.post('/api/create-auth-user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const adminUser = await getAuthenticatedUser(token);
    if (!adminUser) return res.status(401).send('Unauthorized');

    if (!isManagerOrAdmin(adminUser)) {
      return res.status(403).send('Forbidden: Insufficient permissions');
    }

    const { email, password, nome, tenantId, role: targetRole, cpf } = req.body;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        tenantId,
        role: targetRole || 'COLABORADOR',
        cpf
      }
    });

    if (error) throw error;

    await logEvent(tenantId, `Auth user created for ${email} (${nome})`);
    res.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Error creating auth user:', error);
    res.status(500).json({ error: String(error) });
  }
});

async function executeValidatedPunch(params: {
  user: any;
  tenantId: string;
  colaboradorId: string;
  tipoMarcacao: string;
  latitude?: number;
  longitude?: number;
  modoDispositivo?: string;
  coletorId?: string;
  alertaAntecedencia?: string;
  alertaIntervalo?: string;
  biometricAudit?: any;
  punchDate?: Date;
  offlineClientHash?: string;
}) {
  const {
    user,
    tenantId,
    colaboradorId,
    tipoMarcacao,
    latitude,
    longitude,
    modoDispositivo,
    coletorId,
    alertaAntecedencia,
    alertaIntervalo,
    biometricAudit,
    punchDate,
    offlineClientHash
  } = params;

  if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, colaboradorId)) {
    return { status: 403, body: { error: 'Permissão negada para registrar ponto neste colaborador/empresa.' } };
  }

  const targetDate = punchDate && !Number.isNaN(punchDate.getTime()) ? punchDate : new Date();
  const brasilia = getBrasiliaTimeParts(targetDate);

  const { data: colaborador, error: colabErr } = await supabase
    .from('collaborators')
    .select('*')
    .eq('collaborator_id', colaboradorId)
    .maybeSingle();

  if (colabErr) throw colabErr;
  if (!colaborador) {
    return { status: 404, body: { error: 'Colaborador não localizado na base oficial.' } };
  }

  if (colaborador.status === 'DESLIGADO') {
    return { status: 403, body: { error: 'Marcação bloqueada: colaborador desligado.' } };
  }
  if (colaborador.status === 'PENDENTE') {
    return { status: 403, body: { error: 'Marcação bloqueada: cadastro ainda pendente de aprovação.' } };
  }

  const isDispensaArt62 = colaborador.regime === 'DISPENSA_ART_62';

  // 1. Verificar Exceções Anuais / Férias / Folgas (exceto DISPENSA_ART_62 salvo exceção explícita em férias)
  const anualFolgas = colaborador.anual_folgas && typeof colaborador.anual_folgas === 'object' ? colaborador.anual_folgas : null;
  let isFolgaHoje = false;

  if (anualFolgas && Object.prototype.hasOwnProperty.call(anualFolgas, brasilia.ymd)) {
    isFolgaHoje = Boolean(anualFolgas[brasilia.ymd]);
  } else if (!isDispensaArt62) {
    if (colaborador.tipo_escala === '12x36') {
      const [y, m, d] = brasilia.ymd.split('-').map(Number);
      const todayUtc = Date.UTC(y, m - 1, d);
      const baseStr = String(colaborador.data_base_ciclo || '2026-01-01').slice(0, 10);
      const [by, bm, bd] = baseStr.split('-').map(Number);
      const baseUtc = Number.isFinite(by) && Number.isFinite(bm) && Number.isFinite(bd)
        ? Date.UTC(by, bm - 1, bd)
        : Date.UTC(2026, 0, 1);
      const diffDays = Math.floor((todayUtc - baseUtc) / (1000 * 60 * 60 * 24));
      const turma = colaborador.turma_escala || 'A';
      const isPar = Math.abs(diffDays) % 2 === 0;
      const trabalha = turma === 'A' ? isPar : !isPar;
      isFolgaHoje = !trabalha;
    } else {
      let diasFolga = colaborador.dias_folga_semana;
      if (!diasFolga || !Array.isArray(diasFolga)) {
        if (colaborador.tipo_escala === '6x1') diasFolga = [0];
        else if (colaborador.tipo_escala === '5x2') diasFolga = [0, 6];
        else diasFolga = [];
      }
      isFolgaHoje = diasFolga.includes(brasilia.dayOfWeek);
    }
  }

  if (isFolgaHoje) {
    await logEvent(tenantId, `Tentativa de ponto bloqueada (folga ${brasilia.ymd}): colaborador=${colaboradorId}`);
    return {
      status: 403,
      body: { error: 'Marcação bloqueada: Hoje é seu dia de folga conforme escala atribuída.' }
    };
  }

  // 2. Validar regra de antecedência máxima na ENTRADA com suporte a turnos noturnos (aritmética circular)
  if (
    !isDispensaArt62 &&
    tipoMarcacao === 'ENTRADA' &&
    colaborador.regra_antecedencia_ativa &&
    colaborador.horario_inicio &&
    typeof colaborador.horario_inicio === 'string'
  ) {
    const [hStr, mStr] = colaborador.horario_inicio.split(':');
    const startMin = Number(hStr) * 60 + Number(mStr);
    const maxAntecedencia = Number(colaborador.max_minutos_antecedencia ?? 15);
    if (!Number.isNaN(startMin)) {
      const minsBeforeStart = (startMin - brasilia.minutesOfDay + 1440) % 1440;
      if (minsBeforeStart > maxAntecedencia && minsBeforeStart < 720) {
        return {
          status: 403,
          body: {
            error: `Marcação antecipada bloqueada: entrada liberada apenas ${maxAntecedencia} min antes de ${colaborador.horario_inicio} (agora: ${brasilia.hhmm} BRT).`
          }
        };
      }
    }
  }

  // 3. Validar duplicidade e sequência cronológica no mesmo dia de Brasília
  const dayStartIso = `${brasilia.ymd}T00:00:00-03:00`;
  const dayEndIso = `${brasilia.ymd}T23:59:59-03:00`;
  const { data: sameDayRows, error: dayErr } = await supabase
    .from('point_registrations')
    .select('tipo_marcacao, data_hora')
    .eq('tenant_id', tenantId)
    .eq('collaborator_id', colaboradorId)
    .gte('data_hora', dayStartIso)
    .lte('data_hora', dayEndIso)
    .order('data_hora', { ascending: true });

  if (dayErr) throw dayErr;

  const dayList = sameDayRows || [];
  if (dayList.some((r: any) => r.tipo_marcacao === tipoMarcacao)) {
    return {
      status: 400,
      body: { error: `A marcação "${tipoMarcacao}" já foi registrada hoje (${brasilia.ddmmyyyy}).` }
    };
  }

  const hasEntrada = dayList.some((r: any) => r.tipo_marcacao === 'ENTRADA');
  const hasIntIni = dayList.some((r: any) => r.tipo_marcacao === 'INTERVALO_INICIO');
  const hasIntFim = dayList.some((r: any) => r.tipo_marcacao === 'INTERVALO_FIM');
  const hasSaida = dayList.some((r: any) => r.tipo_marcacao === 'SAIDA');

  if (hasSaida) {
    return { status: 400, body: { error: 'Jornada diária já encerrada com SAÍDA registrada hoje.' } };
  }
  if (tipoMarcacao === 'INTERVALO_INICIO' && !hasEntrada) {
    return { status: 400, body: { error: 'Registre primeiro a ENTRADA antes de iniciar o intervalo.' } };
  }
  if (tipoMarcacao === 'INTERVALO_FIM' && !hasIntIni) {
    return { status: 400, body: { error: 'Registre primeiro a SAÍDA P/ INTERVALO antes do retorno do intervalo.' } };
  }
  if (tipoMarcacao === 'SAIDA') {
    if (!hasEntrada) {
      return { status: 400, body: { error: 'Registre primeiro a ENTRADA antes de encerrar a jornada.' } };
    }
    if (hasIntIni && !hasIntFim) {
      return { status: 400, body: { error: 'Finalize o intervalo (RETORNO DO INTERVALO) antes de registrar a SAÍDA.' } };
    }
  }

  if (dayList.length > 0) {
    const lastTs = new Date(dayList[dayList.length - 1].data_hora).getTime();
    if (Number.isFinite(lastTs) && brasilia.epochMs < lastTs - 1000) {
      return {
        status: 400,
        body: { error: 'Horário cronologicamente anterior à última marcação registrada no dia.' }
      };
    }
  }

  // 4. Carregar Empresa (Tenant) e Estabelecimento alocado para validar Cerca Geográfica (Geofencing)
  let tenant: any = null;
  let establishment: any = null;

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (tenantData) tenant = tenantData;

  if (colaborador.estabelecimento_id) {
    const { data: estRow } = await supabase
      .from('establishments')
      .select('*')
      .eq('establishment_id', colaborador.estabelecimento_id)
      .maybeSingle();
    if (estRow) establishment = estRow;
  }
  if (!establishment) {
    const { data: fallbackEst } = await supabase
      .from('establishments')
      .select('*')
      .eq('tenant_id', tenantId)
      .limit(1);
    if (fallbackEst && fallbackEst.length > 0) {
      establishment = fallbackEst[0];
    }
  }

  const refLat = establishment?.latitude ?? tenant?.latitude;
  const refLng = establishment?.longitude ?? tenant?.longitude;
  const raioPermitido = Number(establishment?.cerca_raio_metros ?? tenant?.cerca_raio_metros ?? 150);
  const bloquearFora = establishment?.bloquear_fora_do_raio ?? tenant?.bloquear_fora_do_raio ?? true;

  const hasValidGps =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0;

  let distanciaCentroMetros = 0;
  let foraDoRaioGeofence = false;

  if (!isDispensaArt62) {
    if (refLat != null && refLng != null && Number.isFinite(Number(refLat)) && Number.isFinite(Number(refLng))) {
      if (!hasValidGps) {
        foraDoRaioGeofence = true;
        if (bloquearFora) {
          return {
            status: 403,
            body: {
              error: 'Geolocalização GPS obrigatória para este local de trabalho. Ative o GPS do dispositivo e tente novamente.'
            }
          };
        }
      } else {
        distanciaCentroMetros = calculateDistanceMeters(latitude!, longitude!, Number(refLat), Number(refLng));
        foraDoRaioGeofence = distanciaCentroMetros > raioPermitido;
        if (foraDoRaioGeofence && bloquearFora) {
          await logEvent(
            tenantId,
            `Ponto bloqueado por cerca geográfica: colaborador=${colaboradorId}, dist=${distanciaCentroMetros}m > ${raioPermitido}m`
          );
          return {
            status: 403,
            body: {
              error: `Fora da área permitida (${distanciaCentroMetros}m do local, limite ${raioPermitido}m).`,
              distanciaCentroMetros,
              raioPermitido
            }
          };
        }
      }
    } else if (!hasValidGps && bloquearFora) {
      return {
        status: 403,
        body: {
          error: 'Não foi possível capturar sua localização GPS. Habilite a permissão de localização.'
        }
      };
    }
  }

  const empregadorRazaoSocial = tenant?.razao_social || 'Softcase Tecnologia';
  const empregadorCnpj = tenant?.cnpj || '00.000.000/0001-91';
  const colaboradorNome = colaborador.nome || 'Colaborador';
  const colaboradorCpf = colaborador.cpf || '000.000.000-00';
  const colaboradorMatricula = colaborador.matricula || 'MAT-001';

  let nextNsr = 1;
  let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

  const { data: lastPoints, error: lastPointErr } = await supabase
    .from('point_registrations')
    .select('nsr, hash_sha256')
    .eq('tenant_id', tenantId)
    .order('nsr', { ascending: false })
    .limit(1);

  if (!lastPointErr && lastPoints && lastPoints.length > 0) {
    nextNsr = Number(lastPoints[0].nsr) + 1;
    previousHash = lastPoints[0].hash_sha256 || previousHash;
  }

  const nowIso = brasilia.iso;
  const dataHoraFormatada = brasilia.formatted;
  const resolvedModo = modoDispositivo || 'WEB_CAM';
  const sanitizedColetorId =
    coletorId && String(coletorId).trim()
      ? String(coletorId).trim().slice(0, 64)
      : resolvedModo === 'MOBILE_GPS'
      ? 'COLETOR_MOBILE_GPS'
      : resolvedModo === 'TABLET_KIOSK'
      ? 'COLETOR_TABLET_KIOSK'
      : 'COLETOR_WEB_CAM';

  const rawPayload = `${nextNsr}|${empregadorCnpj}|${colaboradorCpf}|${nowIso}|-03:00|${tipoMarcacao}|${previousHash}|BIOMETRIA_FACIAL_OK`;
  const hashSha256 = crypto.createHash('sha256').update(rawPayload).digest('hex');

  const localizacaoEndereco =
    establishment?.endereco_completo ||
    (establishment ? `${establishment.nome}${establishment.municipio ? ` — ${establishment.municipio}/${establishment.uf}` : ''}` : '') ||
    tenant?.endereco_completo ||
    'GPS validado no coletor';

  const registroOficial: Record<string, any> = {
    nsr: nextNsr,
    tenantId,
    empregadorRazaoSocial,
    empregadorCnpj,
    colaboradorId,
    colaboradorNome,
    colaboradorCpf,
    colaboradorMatricula,
    dataHora: nowIso,
    dataHoraFormatada,
    fusoHorario: '-03:00',
    coletorId: sanitizedColetorId,
    tipoMarcacao,
    alertaAntecedencia: isDispensaArt62 ? 'Dispensa Art. 62 CLT' : (alertaAntecedencia || null),
    alertaIntervalo: alertaIntervalo || null,
    hashSha256,
    latitude: hasValidGps ? latitude : null,
    longitude: hasValidGps ? longitude : null,
    distanciaCentroMetros,
    foraDoRaioGeofence,
    localizacaoEndereco,
    modoDispositivo: resolvedModo,
    ...(offlineClientHash ? { offlineClientHash } : {})
  };

  const { error: insertError } = await supabase.from('point_registrations').insert({
    nsr: nextNsr,
    tenant_id: tenantId,
    collaborator_id: colaboradorId,
    data_hora: nowIso,
    tipo_marcacao: tipoMarcacao,
    latitude: registroOficial.latitude,
    longitude: registroOficial.longitude,
    hash_sha256: hashSha256,
    modo_dispositivo: registroOficial.modoDispositivo,
    detalhes: registroOficial
  });

  if (insertError) throw insertError;

  if (biometricAudit) {
    await supabase.from('biometric_audit_logs').insert({
      tenant_id: tenantId,
      collaborator_id: colaboradorId,
      timestamp: nowIso,
      similarity: biometricAudit.similarity || 0,
      lighting_condition: biometricAudit.lightingCondition || 'NORMAL',
      liveness_score: biometricAudit.livenessScore || 0,
      verdict: biometricAudit.verdict || 'MATCH',
      algorithm_used: biometricAudit.algorithmUsed || 'ISO19794-5',
      hash_template: hashSha256
    });
  }

  await logEvent(tenantId, `Ponto REP-P oficial registrado server-side: NSR ${nextNsr} para ${colaboradorNome} (${tipoMarcacao})`);

  return { status: 200, body: { success: true, registro: registroOficial } };
}

// REP-P Server-Side Punch Endpoint (Portaria 671 Compliance)
app.post('/api/punch', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const {
      tenantId,
      colaboradorId,
      tipoMarcacao,
      latitude,
      longitude,
      modoDispositivo,
      coletorId,
      alertaAntecedencia,
      alertaIntervalo,
      biometricAudit
    } = req.body;

    if (!tenantId || !colaboradorId || !tipoMarcacao) {
      return res.status(400).json({ error: 'tenantId, colaboradorId e tipoMarcacao são obrigatórios.' });
    }

    const result = await executeValidatedPunch({
      user,
      tenantId,
      colaboradorId,
      tipoMarcacao,
      latitude,
      longitude,
      modoDispositivo,
      coletorId,
      alertaAntecedencia,
      alertaIntervalo,
      biometricAudit
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro no endpoint /api/punch:', error);
    await logEvent('error', `Punch error: ${error}`);
    res.status(500).json({ error: String(error) });
  }
});

// Sincronização em lote de marcações capturadas offline (PWA Background Sync)
app.post('/api/sync-offline-punches', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const token = authHeader.split('Bearer ')[1];
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });
    const user = await getAuthenticatedUser(token);
    if (!user) return res.status(401).send('Unauthorized');

    const punches: any[] = Array.isArray(req.body?.punches) ? req.body.punches : [];
    const sorted = [...punches].sort(
      (a, b) => new Date(a?.dataHora || 0).getTime() - new Date(b?.dataHora || 0).getTime()
    );

    const syncedIds: string[] = [];
    const syncedRecords: any[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const item of sorted) {
      const localId = String(item?.id || item?.offlineId || '');
      try {
        const tenantId = item?.tenantId || user.user_metadata?.tenantId || 'tenant-01';
        const colabId = item?.colaboradorId || item?.collaboratorId;
        const tipoMarcacao = item?.tipoMarcacao;
        const clientHash = String(item?.hashSha256 || '').trim();

        if (!colabId || !tipoMarcacao) {
          failed.push({ id: localId, error: 'Payload offline inválido.' });
          continue;
        }

        // Checa idempotência caso a batida offline já tenha sido sincronizada antes
        const { data: existingRows } = await supabase
          .from('point_registrations')
          .select('nsr, detalhes')
          .eq('tenant_id', tenantId)
          .eq('collaborator_id', colabId)
          .eq('tipo_marcacao', tipoMarcacao)
          .limit(50);

        const alreadySynced = (existingRows || []).find((r: any) => {
          const det = typeof r.detalhes === 'string' ? (() => { try { return JSON.parse(r.detalhes); } catch { return {}; } })() : r.detalhes;
          return clientHash && det?.offlineClientHash === clientHash;
        });

        if (alreadySynced) {
          syncedIds.push(localId);
          continue;
        }

        const punchDate = item?.dataHora ? new Date(item.dataHora) : new Date();
        const result = await executeValidatedPunch({
          user,
          tenantId,
          colaboradorId: colabId,
          tipoMarcacao,
          latitude: typeof item?.latitude === 'number' ? item.latitude : undefined,
          longitude: typeof item?.longitude === 'number' ? item.longitude : undefined,
          modoDispositivo: 'OFFLINE_SYNC_PWA',
          coletorId: item?.coletorId || 'COLETOR_OFFLINE_PWA',
          alertaAntecedencia: item?.alertaAntecedencia,
          alertaIntervalo: item?.alertaIntervalo,
          punchDate,
          offlineClientHash: clientHash || `offline-${localId}`
        });

        if (result.status === 200) {
          syncedIds.push(localId);
          if ((result.body as any)?.registro) syncedRecords.push((result.body as any).registro);
        } else {
          failed.push({ id: localId, error: String((result.body as any)?.error || 'Recusado na validação.') });
        }
      } catch (itemErr: any) {
        failed.push({ id: localId, error: itemErr?.message || 'Erro ao sincronizar batida offline.' });
      }
    }

    res.json({ success: true, syncedIds, syncedRecords, failed });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erro no sync offline.' });
  }
});

// Endpoint: Salvar / Publicar Comunicado da Empresa no Mural
app.post('/api/save-announcement', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');

    const { id, tenantId = 'tenant-01', titulo, conteudo, categoria, autorNome, fixado, exigeConfirmacaoLeitura, anexoNome, anexoUrl } = req.body;
    if (!canAccessTenant(user, tenantId) || !isManagerOrAdmin(user)) {
      return res.status(403).send('Forbidden');
    }

    const annId = id || `ann-${Date.now()}`;
    const announcementObj = {
      announcement_id: annId,
      tenant_id: tenantId,
      titulo,
      conteudo,
      categoria: categoria || 'COMUNICADO_GERAL',
      autor_nome: autorNome || 'RH',
      fixado: !!fixado,
      exige_confirmacao_leitura: exigeConfirmacaoLeitura !== false,
      anexo_nome: anexoNome || null,
      anexo_url: anexoUrl || null
    };

    if (supabase) {
      const { error } = await supabase.from('company_announcements').upsert(announcementObj, { onConflict: 'announcement_id' });
      if (error) throw error;
    }

    res.json({ success: true, announcement: { id: annId, ...announcementObj } });
  } catch (err) {
    console.error('Save announcement error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Endpoint: Confirmar Leitura de Comunicado pelo Colaborador
app.post('/api/read-announcement', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');

    const { announcementId, userCpf, userName, userId } = req.body;
    if (!announcementId || !userId) return res.status(400).json({ error: 'announcementId e userId obrigatórios.' });
    if (!canActForCollaborator(user, userId)) return res.status(403).send('Forbidden');

    const ip = getClientIp(req);
    const timestamp = getBrasiliaTimeParts().formatted;

    const readEntry = {
      colaboradorId: userId,
      colaboradorCpf: userCpf,
      colaboradorNome: userName,
      dataHora: timestamp,
      ip
    };

    if (supabase) {
      const { data, error: fetchErr } = await supabase
        .from('company_announcements')
        .select('tenant_id, confirmacoes_leitura')
        .eq('announcement_id', announcementId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!data) return res.status(404).json({ error: 'Comunicado não encontrado.' });
      if (!canAccessTenant(user, data.tenant_id)) return res.status(403).send('Forbidden');

      let currentReads = data.confirmacoes_leitura || [];
      if (!Array.isArray(currentReads)) currentReads = [];

      const userCpfClean = (userCpf || '').replace(/\D/g, '');
      if (
        !currentReads.some(
          (r: any) =>
            (userId && r.colaboradorId === userId) ||
            (userCpfClean && (r.colaboradorCpf || '').replace(/\D/g, '') === userCpfClean)
        )
      ) {
        currentReads.push(readEntry);
        const { error: updErr } = await supabase
          .from('company_announcements')
          .update({ confirmacoes_leitura: currentReads })
          .eq('announcement_id', announcementId);
        if (updErr) throw updErr;
      }
    }

    res.json({ success: true, readEntry });
  } catch (err) {
    console.error('Read announcement error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Endpoint: Criar / Responder Chamado "Fale com o DP / RH"
app.post('/api/save-ticket', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');

    const {
      id,
      tenantId = 'tenant-01',
      collaboratorId,
      collaboratorCpf,
      collaboratorName,
      departamentoNome,
      assunto,
      titulo,
      mensagemInicial,
      anexoNome,
      anexoUrl,
      prioridade,
      resposta
    } = req.body;

    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    const ticketId = id || `ticket-${Date.now()}`;

    if (supabase) {
      if (resposta) {
        const { data: ticketRow, error: fetchErr } = await supabase
          .from('rh_tickets')
          .select('tenant_id, collaborator_id, respostas')
          .eq('ticket_id', ticketId)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!ticketRow) return res.status(404).json({ error: 'Chamado não encontrado.' });

        if (!canAccessTenant(user, ticketRow.tenant_id)) return res.status(403).send('Forbidden');
        if (!isManagerOrAdmin(user) && ticketRow.collaborator_id !== user.user_metadata?.collaboratorId) {
          return res.status(403).send('Forbidden');
        }

        let existingRespostas = ticketRow.respostas || [];
        if (!Array.isArray(existingRespostas)) existingRespostas = [];
        existingRespostas.push({
          ...resposta,
          eDoRh: isManagerOrAdmin(user)
        });

        const { error: updErr } = await supabase
          .from('rh_tickets')
          .update({
            respostas: existingRespostas,
            updated_at: getBrasiliaTimeParts().iso
          })
          .eq('ticket_id', ticketId);
        if (updErr) throw updErr;
      } else {
        if (!canActForCollaborator(user, collaboratorId)) {
          return res.status(403).send('Forbidden');
        }
        const ticketObj = {
          ticket_id: ticketId,
          tenant_id: tenantId,
          collaborator_id: collaboratorId,
          collaborator_cpf: collaboratorCpf,
          collaborator_name: collaboratorName,
          departamento_nome: departamentoNome || 'Geral',
          assunto,
          titulo,
          mensagem_inicial: mensagemInicial,
          anexo_nome: anexoNome || null,
          anexo_url: anexoUrl || null,
          status: 'ABERTO',
          prioridade: prioridade || 'MEDIA',
          respostas: []
        };

        const { error } = await supabase.from('rh_tickets').upsert(ticketObj, { onConflict: 'ticket_id' });
        if (error) throw error;
      }
    }

    res.json({ success: true, ticketId });
  } catch (err) {
    console.error('Save ticket error:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Endpoint: Atualizar Status de Chamado do DP / RH
app.post('/api/update-ticket-status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user || !isManagerOrAdmin(user)) return res.status(403).send('Forbidden');

    const { ticketId, status } = req.body;
    if (supabase) {
      const { data: ticketRow, error: fetchErr } = await supabase
        .from('rh_tickets')
        .select('tenant_id')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!ticketRow) return res.status(404).json({ error: 'Chamado não encontrado.' });
      if (!canAccessTenant(user, ticketRow.tenant_id)) return res.status(403).send('Forbidden');

      const { error: updErr } = await supabase
        .from('rh_tickets')
        .update({
          status,
          updated_at: getBrasiliaTimeParts().iso
        })
        .eq('ticket_id', ticketId);
      if (updErr) throw updErr;
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// =========================================================================
// NOVOS ENDPOINTS AUTENTICADOS (BOOTSTRAP, PORTAL, RBAC, CONFIG, CLT)
// =========================================================================

app.get('/api/bootstrap-data', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const requestedTenant = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    const tenantScope = isSuperAdmin(user) && !req.query.tenantId ? null : requestedTenant;
    if (tenantScope && !canAccessTenant(user, tenantScope)) {
      return res.status(403).send('Forbidden');
    }

    const q = (table: string, orderCol?: string, asc = true) => {
      let query = supabase.from(table).select('*');
      if (tenantScope && table !== 'tenants') {
        query = query.eq('tenant_id', tenantScope);
      }
      if (orderCol) {
        query = query.order(orderCol, { ascending: asc });
      }
      return query;
    };

    const [
      tenantsRes,
      colabsRes,
      estsRes,
      deptsRes,
      holisRes,
      overtimesRes,
      pointsRes,
      sigsRes,
      adjsRes,
      positionsRes
    ] = await Promise.all([
      isSuperAdmin(user) ? supabase.from('tenants').select('*') : supabase.from('tenants').select('*').eq('tenant_id', requestedTenant),
      q('collaborators'),
      q('establishments'),
      q('departments'),
      q('holidays', 'data', true),
      q('overtime_requests', 'data', false),
      q('point_registrations', 'data_hora', false),
      q('point_signatures', 'created_at', false),
      q('adjustment_requests', 'created_at', false),
      q('positions')
    ]);

    const appSettingsRes = await supabase
      .from('app_settings')
      .select('*')
      .eq('tenant_id', requestedTenant)
      .maybeSingle();

    const rolePermsRes = await supabase
      .from('role_permissions')
      .select('*')
      .eq('tenant_id', requestedTenant);

    const colaboradores = (colabsRes.data || []).map(mapCollaboratorRow);

    res.json({
      success: true,
      tenants: tenantsRes.data || [],
      colaboradores,
      estabelecimentos: estsRes.data || [],
      departamentos: deptsRes.data || [],
      cargos: positionsRes.data || [],
      feriados: holisRes.data || [],
      horasExtras: overtimesRes.data || [],
      registros: pointsRes.data || [],
      assinaturas: sigsRes.data || [],
      ajustes: adjsRes.data || [],
      appSettings: appSettingsRes.error ? null : appSettingsRes.data,
      rolePermissions: rolePermsRes.error ? [] : (rolePermsRes.data || [])
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar dados do tenant.' });
  }
});

app.get('/api/portal-documents', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    const collaboratorId = String(req.query.collaboratorId || user.user_metadata?.collaboratorId || '');
    const cleanCpf = String(req.query.cpf || user.user_metadata?.cpf || '').replace(/\D/g, '');
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 6)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (collaboratorId && !canActForCollaborator(user, collaboratorId)) return res.status(403).send('Forbidden');

    const paystubsQuery = supabase
      .from('paystubs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('data_upload', { ascending: false })
      .range(offset, offset + limit - 1);

    if (collaboratorId) {
      paystubsQuery.eq('collaborator_id', collaboratorId);
    }

    const [payRes, irpfRes, annRes, tickRes, absRes, vacRes, swapRes] = await Promise.all([
      paystubsQuery,
      supabase.from('tax_reports').select('*').eq('tenant_id', tenantId).order('ano_calendario', { ascending: false }),
      supabase.from('company_announcements').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('rh_tickets').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('absences').select('*').eq('tenant_id', tenantId).order('data_inicio', { ascending: false }),
      supabase.from('vacations').select('*').eq('tenant_id', tenantId).order('data_inicio_ferias', { ascending: false }),
      supabase.from('shift_swaps').select('*').eq('tenant_id', tenantId).order('data_solicitacao', { ascending: false })
    ]);

    const matchColab = (rColabId?: string, rCpf?: string) => {
      if (collaboratorId && rColabId === collaboratorId) return true;
      const d = String(rCpf || '').replace(/\D/g, '');
      return Boolean(cleanCpf && d && cleanCpf === d);
    };

    const paystubs = (payRes.data || []).filter((p: any) => !collaboratorId || matchColab(p.collaborator_id, p.collaborator_cpf));
    const totalPaystubs = Number(payRes.count ?? paystubs.length);

    res.json({
      success: true,
      paystubs,
      totalPaystubs,
      hasMorePaystubs: offset + limit < totalPaystubs,
      irpfList: (irpfRes.data || []).filter((t: any) => !collaboratorId || matchColab(t.collaborator_id, t.collaborator_cpf)),
      announcements: annRes.data || [],
      tickets: (tickRes.data || []).filter((tk: any) => isManagerOrAdmin(user) || matchColab(tk.collaborator_id, tk.collaborator_cpf)),
      absences: (absRes.data || []).filter((a: any) => !collaboratorId || a.collaborator_id === collaboratorId),
      vacations: (vacRes.data || []).filter((v: any) => !collaboratorId || matchColab(v.collaborator_id, v.collaborator_cpf)),
      shiftSwaps: (swapRes.data || []).filter((s: any) =>
        isManagerOrAdmin(user) || !collaboratorId || s.solicitante_id === collaboratorId || s.substituto_id === collaboratorId
      )
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar documentos do portal.' });
  }
});

app.post('/api/save-personal-holerite', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { id, tenantId = 'tenant-01', colaboradorId, colaboradorCpf, colaboradorNome, mesAno, competencia, arquivoNome, arquivoUrl } = req.body;
    if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, colaboradorId)) {
      return res.status(403).send('Forbidden');
    }

    const { data, error: dbError } = await supabase
      .from('paystubs')
      .upsert({
        paystub_id: id || `hol-pessoal-${Date.now()}`,
        tenant_id: tenantId,
        collaborator_id: colaboradorId,
        collaborator_cpf: colaboradorCpf || '',
        collaborator_name: colaboradorNome || 'Colaborador',
        mes_ano: mesAno,
        competencia,
        salario_bruto: 0,
        descontos: 0,
        salario_liquido: 0,
        arquivo_nome: arquivoNome,
        arquivo_url: arquivoUrl || null,
        data_upload: getBrasiliaTimeParts().iso,
        status: 'ANEXADO_PELO_COLABORADOR'
      }, { onConflict: 'paystub_id' })
      .select();

    if (dbError) throw dbError;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao anexar holerite pessoal.' });
  }
});

app.get('/api/role-permissions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.json({ permissionsByRole: {} });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('role_permissions')
      .select('role, permissions, updated_at')
      .eq('tenant_id', tenantId);

    if (error) {
      return res.json({ permissionsByRole: {}, warning: error.message });
    }

    const permissionsByRole: Record<string, string[]> = {};
    for (const row of data || []) {
      if (row.role && Array.isArray(row.permissions)) {
        permissionsByRole[row.role] = row.permissions;
      }
    }
    res.json({ success: true, permissionsByRole });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar permissões RBAC.' });
  }
});

app.post('/api/role-permissions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const tenantId = String(req.body?.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const matrix = req.body?.permissionsByRole;
    if (!matrix || typeof matrix !== 'object') {
      return res.status(400).json({ error: 'permissionsByRole inválido.' });
    }

    const nowIso = getBrasiliaTimeParts().iso;
    const rows = Object.entries(matrix).map(([role, permissions]) => ({
      tenant_id: tenantId,
      role,
      permissions: Array.isArray(permissions) ? permissions : [],
      updated_by: user.email || user.id,
      updated_at: nowIso
    }));

    const { error } = await supabase.from('role_permissions').upsert(rows, { onConflict: 'tenant_id,role' });
    if (error) throw error;

    await logEvent(tenantId, `Matriz de permissões RBAC atualizada por ${user.user_metadata?.nome || user.email}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar permissões RBAC.' });
  }
});

app.get('/api/app-settings', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.json({ biometricThreshold: 82.0, settings: {} });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('app_settings')
      .select('biometric_threshold, settings')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      return res.json({ biometricThreshold: 82.0, settings: {} });
    }

    res.json({
      success: true,
      biometricThreshold: Number(data?.biometric_threshold ?? 82.0),
      settings: data?.settings || {}
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao buscar configurações do app.' });
  }
});

app.post('/api/app-settings', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const tenantId = String(req.body?.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const threshold = Math.min(99.5, Math.max(70.0, Number(req.body?.biometricThreshold ?? 82.0)));
    const settings = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {};

    const { error } = await supabase.from('app_settings').upsert({
      tenant_id: tenantId,
      biometric_threshold: threshold,
      settings,
      updated_by: user.email || user.id,
      updated_at: getBrasiliaTimeParts().iso
    }, { onConflict: 'tenant_id' });

    if (error) throw error;
    await logEvent(tenantId, `Política de limiar biométrico ajustada para ${threshold}%`);
    res.json({ success: true, biometricThreshold: threshold });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar configurações.' });
  }
});

app.get('/api/occurrence-treatments', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.json({ treatments: [] });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('occurrence_treatments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('treated_at', { ascending: false });

    if (error) return res.json({ treatments: [] });
    res.json({ success: true, treatments: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao buscar tratamentos de ocorrências.' });
  }
});

app.post('/api/occurrence-treatments', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user || !isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = String(body.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const treatmentId = body.treatmentId || `${body.collaboratorId}_${body.occurrenceDate}_${body.occurrenceType}`;
    const { data, error } = await supabase
      .from('occurrence_treatments')
      .upsert({
        treatment_id: treatmentId,
        tenant_id: tenantId,
        collaborator_id: body.collaboratorId,
        occurrence_date: body.occurrenceDate,
        occurrence_type: body.occurrenceType,
        status: body.status,
        justificativa: body.justificativa || null,
        cid10: body.cid10 || null,
        observacao: body.observacao || null,
        treated_by: user.user_metadata?.nome || user.email,
        treated_at: getBrasiliaTimeParts().iso
      }, { onConflict: 'treatment_id' })
      .select();

    if (error) throw error;
    await logEvent(tenantId, `Ocorrência ${treatmentId} tratada como ${body.status}`);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar tratamento de ocorrência.' });
  }
});

app.get('/api/ipa-reward-batches', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.json({ batches: [] });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('ipa_reward_batches')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('processed_at', { ascending: false });

    if (error) return res.json({ batches: [] });
    res.json({ success: true, batches: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao listar lotes IPA.' });
  }
});

app.post('/api/ipa-reward-batches', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user || !isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = String(body.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const batchId = body.batchId || `ipa-${Date.now()}`;
    const beneficiaries = Array.isArray(body.beneficiaries) ? body.beneficiaries : [];
    const { data, error } = await supabase
      .from('ipa_reward_batches')
      .insert({
        batch_id: batchId,
        tenant_id: tenantId,
        competencia: body.competencia || getBrasiliaTimeParts().mesAno,
        beneficiaries,
        total_beneficiaries: Number(body.totalBeneficiaries ?? beneficiaries.length),
        total_payout: Number(body.totalPayout ?? 0),
        processed_by: user.user_metadata?.nome || user.email,
        processed_at: getBrasiliaTimeParts().iso
      })
      .select();

    if (error) throw error;
    await logEvent(tenantId, `Lote de premiação IPA ${batchId} homologado (${beneficiaries.length} beneficiários)`);
    res.json({ success: true, batch: data?.[0] || null });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao processar lote IPA.' });
  }
});

app.get('/api/shift-swaps', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.json({ swaps: [] });

    const tenantId = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('shift_swaps')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_solicitacao', { ascending: false });

    if (error) throw error;

    const colabId = user.user_metadata?.collaboratorId;
    const filtered = (data || []).filter((s: any) =>
      isManagerOrAdmin(user) || (colabId && (s.solicitante_id === colabId || s.substituto_id === colabId))
    );

    res.json({ success: true, swaps: filtered });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao listar trocas de turno.' });
  }
});

app.post('/api/shift-swaps', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const swap = req.body || {};
    const tenantId = String(swap.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, swap.colaboradorOrigemId)) {
      return res.status(403).send('Forbidden');
    }

    const swapId = swap.id || `troca-${Date.now()}`;
    const { data, error } = await supabase
      .from('shift_swaps')
      .upsert({
        swap_id: swapId,
        tenant_id: tenantId,
        solicitante_id: swap.colaboradorOrigemId,
        solicitante_nome: swap.colaboradorOrigemNome,
        substituto_id: swap.colaboradorDestinoId,
        substituto_nome: swap.colaboradorDestinoNome,
        data_turno_original: swap.dataPlantaoOrigem,
        data_turno_compensacao: swap.dataPlantaoDestino,
        motivo: swap.motivo || 'Troca de escala entre colaboradores.',
        status: 'PENDENTE_SUPERVISOR',
        supervisor_id: swap.supervisorDecisorId || null,
        supervisor_nome: swap.supervisorDecisorNome || null,
        data_solicitacao: getBrasiliaTimeParts().iso,
        regra_clt_ok: swap.validacaoInterjornadaOk !== false,
        alerta_conflito: swap.alertaConflito || null
      }, { onConflict: 'swap_id' })
      .select();

    if (error) throw error;
    await logEvent(tenantId, `Troca de plantão ${swapId} solicitada por ${swap.colaboradorOrigemNome}`);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao registrar troca de turno.' });
  }
});

app.post('/api/update-shift-swap', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user || !isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { swapId, status, alertaConflito } = req.body || {};
    if (!swapId || !status) return res.status(400).json({ error: 'swapId e status obrigatórios.' });

    const { data: row, error: fetchErr } = await supabase
      .from('shift_swaps')
      .select('tenant_id')
      .eq('swap_id', swapId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!row) return res.status(404).json({ error: 'Troca de turno não encontrada.' });
    if (!canAccessTenant(user, row.tenant_id)) return res.status(403).send('Forbidden');

    const { data, error } = await supabase
      .from('shift_swaps')
      .update({
        status,
        supervisor_id: user.user_metadata?.collaboratorId || user.id,
        supervisor_nome: user.user_metadata?.nome || user.email,
        data_aprovacao: getBrasiliaTimeParts().iso,
        ...(alertaConflito !== undefined ? { alerta_conflito: alertaConflito } : {})
      })
      .eq('swap_id', swapId)
      .select();

    if (error) throw error;
    await logEvent(row.tenant_id, `Troca de plantão ${swapId} alterada para ${status}`);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar troca de turno.' });
  }
});

app.post('/api/save-overtime', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const he = req.body || {};
    const tenantId = String(he.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!isManagerOrAdmin(user) && he.colaboradorId !== user.user_metadata?.collaboratorId) {
      return res.status(403).send('Forbidden');
    }

    const payload: Record<string, any> = {
      request_id: he.id,
      tenant_id: tenantId,
      collaborator_id: he.colaboradorId,
      collaborator_name: he.colaboradorNome || '',
      collaborator_cpf: he.colaboradorCpf || '',
      departamento_id: he.departamentoId || '',
      departamento_nome: he.departamentoNome || '',
      gestor_id: he.gestorId || '',
      gestor_nome: he.gestorNome || '',
      data: he.data,
      horario_contratado: he.horarioContratado || '',
      horario_realizado: he.horarioRealizado || '',
      minutos_extras: Number(he.minutosExtras || 0),
      horas_extras_formatadas: he.horasExtrasFormatadas || '00:00h',
      tipo_hora_extra: he.tipoHoraExtra || 'NORMAL_50',
      destino_aprovacao: he.destinoAprovacao || 'BANCO_HORAS',
      justificativa: he.justificativa || '',
      status: isManagerOrAdmin(user) ? (he.status || 'PENDENTE') : 'PENDENTE',
      motivo_recusa: he.motivoRecusa || null,
      data_decisao: he.dataDecisao || null
    };

    let { data, error } = await supabase
      .from('overtime_requests')
      .upsert(payload, { onConflict: 'request_id' })
      .select();

    if (error && String(error.message || '').includes('destino_aprovacao')) {
      delete payload.destino_aprovacao;
      const retry = await supabase.from('overtime_requests').upsert(payload, { onConflict: 'request_id' }).select();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar solicitação de hora extra.' });
  }
});

app.post('/api/delete-collaborator', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const ids: string[] = Array.isArray(req.body?.ids)
      ? req.body.ids
      : req.body?.collaboratorId
      ? [req.body.collaboratorId]
      : [];

    if (ids.length === 0) return res.status(400).json({ error: 'ids obrigatório.' });

    const { data: targets, error: fetchErr } = await supabase
      .from('collaborators')
      .select('collaborator_id, tenant_id')
      .in('collaborator_id', ids);

    if (fetchErr) throw fetchErr;
    for (const row of targets || []) {
      if (!canAccessTenant(user, row.tenant_id)) {
        return res.status(403).send('Forbidden');
      }
    }

    const { error } = await supabase.from('collaborators').delete().in('collaborator_id', ids);
    if (error) throw error;
    res.json({ success: true, deletedCount: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao excluir colaborador.' });
  }
});

// Validação server-side segura de PIN de contingência (1º dia sem expor o hash ao cliente)
app.post('/api/verify-pin', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');

  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { tenantId = user.user_metadata?.tenantId || 'tenant-01', collaboratorId, pin } = req.body || {};
    if (!collaboratorId || !pin) {
      return res.status(400).json({ valid: false, error: 'Colaborador e PIN são obrigatórios.' });
    }
    if (!canAccessTenant(user, tenantId) || !canActForCollaborator(user, collaboratorId)) {
      return res.status(403).send('Forbidden');
    }

    const { data: colab, error } = await supabase
      .from('collaborators')
      .select('collaborator_id, tenant_id, pin_coletor')
      .eq('collaborator_id', collaboratorId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;
    if (!colab) return res.status(404).json({ valid: false, error: 'Colaborador não encontrado.' });
    if (!colab.pin_coletor) {
      return res.status(400).json({ valid: false, error: 'Colaborador sem PIN individual cadastrado. Realize o cadastro facial.' });
    }

    const check = verifyPin(String(pin), colab.pin_coletor);
    if (!check.valid) {
      return res.status(401).json({ valid: false, error: 'PIN incorreto. Verifique o código informado pelo RH e tente novamente.' });
    }

    if (check.needsUpgrade) {
      await supabase
        .from('collaborators')
        .update({ pin_coletor: hashPin(String(pin).trim()), updated_at: getBrasiliaTimeParts().iso })
        .eq('collaborator_id', collaboratorId);
    }

    res.json({ valid: true });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err?.message || 'Erro ao validar PIN.' });
  }
});

// =========================================================================
// ENDPOINTS AUTENTICADOS DE ESTRUTURA, FERIADOS, AFASTAMENTOS E AJUSTES
// =========================================================================

app.get('/api/vacations', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const requestedTenant = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, requestedTenant)) return res.status(403).send('Forbidden');

    let query = supabase.from('vacations').select('*').order('created_at', { ascending: false });
    if (!isSuperAdmin(user) || req.query.tenantId) {
      query = query.eq('tenant_id', requestedTenant);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, vacations: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar férias.' });
  }
});

app.post('/api/vacations', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = body.tenantId || user.user_metadata?.tenantId || 'tenant-01';
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!body.id || !body.colaboradorId || !body.dataInicioFerias || !body.dataFimFerias) {
      return res.status(400).json({ error: 'Dados obrigatórios de férias ausentes.' });
    }

    const row = {
      vacation_id: body.id,
      tenant_id: tenantId,
      collaborator_id: body.colaboradorId,
      collaborator_name: body.colaboradorNome || '',
      collaborator_cpf: body.colaboradorCpf || '',
      periodo_aquisitivo_inicio: body.periodoAquisitivoInicio || null,
      periodo_aquisitivo_fim: body.periodoAquisitivoFim || null,
      periodo_concessivo_inicio: body.periodoConcessivoInicio || null,
      periodo_concessivo_fim: body.periodoConcessivoFim || null,
      data_inicio_ferias: body.dataInicioFerias,
      data_fim_ferias: body.dataFimFerias,
      dias_gozo: Number(body.diasGozo ?? 30),
      dias_abono_pecuniario: Number(body.diasAbonoPecuniario ?? 0),
      status: body.status || 'PROGRAMADO',
      observacao: body.observacao || null
    };
    const { error } = await supabase.from('vacations').upsert(row, { onConflict: 'vacation_id' });
    if (error) throw error;
    res.json({ success: true, vacation: row });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar programação de férias.' });
  }
});

app.get('/api/absences', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const requestedTenant = String(req.query.tenantId || user.user_metadata?.tenantId || 'tenant-01');
    if (!canAccessTenant(user, requestedTenant)) return res.status(403).send('Forbidden');

    let query = supabase.from('absences').select('*').order('data_registro', { ascending: false });
    if (!isSuperAdmin(user) || req.query.tenantId) {
      query = query.eq('tenant_id', requestedTenant);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, absences: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao carregar afastamentos.' });
  }
});

app.post('/api/absences', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = body.tenantId || user.user_metadata?.tenantId || 'tenant-01';
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!body.id || !body.colaboradorId || !body.tipo || !body.dataInicio || !body.dataFim) {
      return res.status(400).json({ error: 'Dados obrigatórios do afastamento ausentes.' });
    }

    const row = {
      absence_id: body.id,
      tenant_id: tenantId,
      collaborator_id: body.colaboradorId,
      collaborator_name: body.colaboradorNome || '',
      departamento_nome: body.departamentoNome || '',
      tipo: body.tipo,
      data_inicio: body.dataInicio,
      data_fim: body.dataFim,
      dias_totais: Number(body.totalDias ?? 1),
      cid10: body.cid10 || null,
      crm_medico: body.crmMedico || null,
      observacao: body.observacoes || body.observacao || null,
      status: body.status || 'HOMOLOGADO',
      abona_ponto: body.abonaMarcacoesPonto ?? true
    };
    const { error } = await supabase.from('absences').upsert(row, { onConflict: 'absence_id' });
    if (error) throw error;
    res.json({ success: true, absence: row });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar afastamento.' });
  }
});

app.post('/api/holidays', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = body.tenantId || user.user_metadata?.tenantId || 'tenant-01';
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!body.id || !body.nome || !body.data || !body.tipo) {
      return res.status(400).json({ error: 'Dados obrigatórios do feriado ausentes.' });
    }

    const row = {
      holiday_id: body.id,
      tenant_id: tenantId,
      nome: body.nome,
      data: body.data,
      tipo: body.tipo,
      uf: body.uf || null,
      municipio: body.municipio || null,
      recorrente_anual: body.recorrenteAnual ?? true,
      legislacao_base: body.legislacaoBase || null,
      adicional_hora_extra_percentual: Number(body.adicionalHoraExtraPercentual ?? 100),
      gera_folga_compensatoria: body.geraFolgaCompensatoria ?? false,
      afeta_dsr: body.afetaDSR ?? true
    };
    const { error } = await supabase.from('holidays').upsert(row, { onConflict: 'holiday_id' });
    if (error) throw error;
    res.json({ success: true, holiday: row });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar feriado.' });
  }
});

app.post('/api/departments', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = body.tenantId || user.user_metadata?.tenantId || 'tenant-01';
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!body.id || !body.nome) {
      return res.status(400).json({ error: 'id e nome do departamento são obrigatórios.' });
    }

    const row = {
      department_id: body.id,
      tenant_id: tenantId,
      nome: body.nome,
      codigo: body.codigo || 'DEP-01',
      gestor_id: body.gestorId || 'gestor-01',
      gestor_nome: body.gestorNome || 'Gestor Responsável',
      gestor_email: body.gestorEmail || null,
      horario_inicio_padrao: body.horarioInicioPadrao || '08:00',
      carga_horaria_diaria: Number(body.cargaHorariaDiariaHoras ?? 8),
      intervalo_minutos: Number(body.intervaloMinutos ?? 60),
      max_minutos_antecedencia: Number(body.maxMinutosAntecedenciaPermitido ?? 15),
      regra_antecedencia_ativa: body.regraAntecedenciaAtiva ?? true
    };
    const { error } = await supabase.from('departments').upsert(row, { onConflict: 'department_id' });
    if (error) throw error;
    res.json({ success: true, department: row });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar departamento.' });
  }
});

app.delete('/api/departments/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { data: existing, error: fetchErr } = await supabase
      .from('departments')
      .select('department_id, tenant_id')
      .eq('department_id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (existing && !canAccessTenant(user, existing.tenant_id)) {
      return res.status(403).send('Forbidden');
    }

    const { error } = await supabase.from('departments').delete().eq('department_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao excluir departamento.' });
  }
});

app.post('/api/positions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const body = req.body || {};
    const tenantId = body.tenantId || user.user_metadata?.tenantId || 'tenant-01';
    if (!canAccessTenant(user, tenantId)) return res.status(403).send('Forbidden');
    if (!body.id || !body.titulo) {
      return res.status(400).json({ error: 'id e titulo do cargo são obrigatórios.' });
    }

    const row = {
      position_id: body.id,
      tenant_id: tenantId,
      titulo: body.titulo,
      codigo: body.codigo || null,
      cbo: body.cbo || '4110-10',
      cbo_descricao: body.cboDescricao || null,
      carga_horaria_semanal: Number(body.cargaHorariaSemanal ?? 40)
    };
    const { error } = await supabase.from('positions').upsert(row, { onConflict: 'position_id' });
    if (error) throw error;
    res.json({ success: true, position: row });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao salvar cargo.' });
  }
});

app.delete('/api/positions/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { data: existing, error: fetchErr } = await supabase
      .from('positions')
      .select('position_id, tenant_id')
      .eq('position_id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (existing && !canAccessTenant(user, existing.tenant_id)) {
      return res.status(403).send('Forbidden');
    }

    const { error } = await supabase.from('positions').delete().eq('position_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao excluir cargo.' });
  }
});

app.post('/api/establishments', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const items = Array.isArray(req.body?.establishments) ? req.body.establishments : [req.body];
    if (items.length === 0 || !items[0]?.id || !items[0]?.nome) {
      return res.status(400).json({ error: 'Dados obrigatórios do estabelecimento ausentes.' });
    }

    const rows = items.map((e: any) => {
      const tId = e.tenantId || user.user_metadata?.tenantId || 'tenant-01';
      if (!canAccessTenant(user, tId)) {
        throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
      }
      const lat = Number(e.latitude);
      const lng = Number(e.longitude);
      return {
        establishment_id: e.id,
        tenant_id: tId,
        nome: e.nome,
        cnpj: e.cnpj || '00.000.000/0001-91',
        tipo: e.tipo || 'FILIAL',
        cep: e.cep || null,
        latitude: Number.isFinite(lat) ? lat : 0,
        longitude: Number.isFinite(lng) ? lng : 0,
        cerca_raio_metros: Number(e.cercaRaioMetros) || 100,
        bloquear_fora_do_raio: e.bloquearForaDoRaio ?? true,
        endereco_completo: e.enderecoCompleto || null,
        municipio: e.municipio || 'São Paulo',
        uf: e.uf || 'SP',
        fuso_horario: e.fusoHorario || 'America/Sao_Paulo'
      };
    });

    const { error } = await supabase.from('establishments').upsert(rows, { onConflict: 'establishment_id' });
    if (error) throw error;
    res.json({ success: true, establishments: rows });
  } catch (err: any) {
    if (err?.statusCode === 403) return res.status(403).send('Forbidden');
    res.status(500).json({ error: err?.message || 'Erro ao salvar estabelecimento.' });
  }
});

app.delete('/api/establishments/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    const actorRole = user.user_metadata?.role;
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'RH_ADMIN') {
      return res.status(403).send('Forbidden');
    }
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { data: existing, error: fetchErr } = await supabase
      .from('establishments')
      .select('establishment_id, tenant_id')
      .eq('establishment_id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (existing && !canAccessTenant(user, existing.tenant_id)) {
      return res.status(403).send('Forbidden');
    }

    const { error } = await supabase.from('establishments').delete().eq('establishment_id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao excluir estabelecimento.' });
  }
});

app.post('/api/update-adjustment-status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).send('Unauthorized');
  try {
    const user = await getAuthenticatedUser(authHeader.split('Bearer ')[1]);
    if (!user) return res.status(401).send('Unauthorized');
    if (!isManagerOrAdmin(user)) return res.status(403).send('Forbidden');
    if (!supabase) return res.status(503).json({ error: 'Supabase não configurado.' });

    const { requestId, status } = req.body || {};
    if (!requestId || (status !== 'APROVADO' && status !== 'REJEITADO')) {
      return res.status(400).json({ error: 'requestId e status válido (APROVADO/REJEITADO) são obrigatórios.' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('adjustment_requests')
      .select('request_id, tenant_id, collaborator_id')
      .eq('request_id', requestId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) return res.status(404).json({ error: 'Solicitação de ajuste não encontrada.' });
    if (!canAccessTenant(user, existing.tenant_id)) return res.status(403).send('Forbidden');

    const nowBrt = getBrasiliaTimeParts();
    const { error } = await supabase
      .from('adjustment_requests')
      .update({ status, data_decisao: nowBrt.iso })
      .eq('request_id', requestId);
    if (error) throw error;

    await supabase.from('logs').insert({
      tenant_id: existing.tenant_id,
      event: `AJUSTE_PONTO_${status}`,
      details: {
        requestId,
        collaboratorId: existing.collaborator_id,
        decidedBy: user.user_metadata?.nome || user.email
      }
    });

    res.json({ success: true, status, dataDecisao: nowBrt.iso, dataDecisaoFormatted: nowBrt.formatted });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao atualizar solicitação de ajuste.' });
  }
});

// Health Check / Connection Status (sem exposição de segredos)
app.get('/api/status', async (_req, res) => {
  let connected = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('logs').select('count', { count: 'exact', head: true });
      connected = !error;
    } catch {
      connected = false;
    }
  }

  res.json({
    supabaseConnected: connected,
    brasiliaTime: getBrasiliaTimeParts(),
    timestamp: getBrasiliaTimeParts().iso
  });
});

app.all('/api/auth/login', (_req, res) => {
  res.status(405).json({ error: 'Method Not Allowed. Use POST /api/auth/login.' });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';
const isVercel = Boolean(process.env.VERCEL);

async function startServer() {
  if (!isVercel) {
    if (isProd) {
      app.use(express.static('dist'));
      app.get('*', (_req, res) => {
        res.sendFile('dist/index.html', { root: '.' });
      });
    } else {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  }
}
if (!isVercel) {
  startServer();
}
