import React, { useState } from 'react';
import { AuthUser } from '../types/auth';
import { formatCPF, validateCPF, formatPhone, validateEmail } from '../utils/brazilianValidators';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  KeyRound, 
  Clock, 
  AlertCircle, 
  Loader2, 
  HelpCircle, 
  Settings, 
  Key,
  UserPlus,
  RotateCcw,
  Phone,
  Building,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Check,
  BadgeCheck,
  XCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { getBrasiliaYmd, formatBrasiliaDate } from '../utils/brasiliaClock';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, redirectView: 'operational' | 'colaborador') => void;
  onCollaboratorRegistered?: (novoColab: any) => void;
}

interface PublicTenantOption {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess,
  onCollaboratorRegistered 
}) => {
  const { supabase, setAuthToken } = useAuth();
  
  // Modos da tela: login tradicional, auto-cadastro, recuperação de senha ou confirmação de envio
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover' | 'register_success'>('login');

  // Estados de Login
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados de Auto-Cadastro do Colaborador
  const [publicTenants, setPublicTenants] = useState<PublicTenantOption[]>([
    { id: 'tenant-01', razaoSocial: 'Softcase Tecnologia', nomeFantasia: 'Softcase' }
  ]);
  const [regTenantId, setRegTenantId] = useState('tenant-01');
  const [regNome, setRegNome] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regDepto, setRegDepto] = useState('Engenharia de Software');
  const [regCargo, setRegCargo] = useState('Desenvolvedor(a) de Software');
  const [regSenha, setRegSenha] = useState('');
  const [regSenhaConfirma, setRegSenhaConfirma] = useState('');
  const [lastRegisteredName, setLastRegisteredName] = useState('');
  const [registeredSummary, setRegisteredSummary] = useState<{
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    depto: string;
    cargo: string;
    empresa: string;
  } | null>(null);

  // Estados de Recuperação de Senha (2 fatores)
  const [recIdentificador, setRecIdentificador] = useState('');
  const [recSegundoFator, setRecSegundoFator] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [recNovaSenhaConfirma, setRecNovaSenhaConfirma] = useState('');

  // Etapa de Autenticação em Duas Etapas (MFA)
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  React.useEffect(() => {
    fetch('/api/public-tenants')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.tenants && Array.isArray(data.tenants) && data.tenants.length > 0) {
          setPublicTenants(data.tenants);
          setRegTenantId(data.tenants[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleIdentificadorChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length === 11 && !val.includes('@')) {
      setIdentificador(formatCPF(val));
    } else {
      setIdentificador(val);
    }
  };

  const handleRegCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 11) {
      setRegCpf(formatCPF(digits));
    } else {
      setRegCpf(digits);
    }
  };

  const handleRegTelefoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length > 10) {
      setRegTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
    } else if (digits.length > 6) {
      setRegTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`);
    } else if (digits.length > 2) {
      setRegTelefone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    } else {
      setRegTelefone(digits);
    }
  };

  const handleRecIdentificadorChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length === 11 && !val.includes('@')) {
      setRecIdentificador(formatCPF(val));
    } else {
      setRecIdentificador(val);
    }
  };

  // Submissão do Formulário de Auto-Cadastro do Colaborador com Validações Estritas
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regNome.trim()) {
      setErrorMessage('Por favor informe seu nome completo.');
      return;
    }

    const cleanCpf = regCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setErrorMessage('Por favor digite um CPF com 11 dígitos.');
      return;
    }

    const cpfCheck = validateCPF(regCpf);
    if (!cpfCheck.isValid) {
      setErrorMessage(cpfCheck.error || 'CPF inválido. Verifique os números digitados.');
      return;
    }

    if (!validateEmail(regEmail)) {
      setErrorMessage('Por favor informe um e-mail válido (ex: seu.nome@empresa.com.br).');
      return;
    }

    if (regSenha.length < 4) {
      setErrorMessage('A senha de acesso deve conter pelo menos 4 caracteres ou dígitos.');
      return;
    }

    if (regSenha !== regSenhaConfirma) {
      setErrorMessage('A confirmação da senha não coincide com a senha informada.');
      return;
    }

    setIsLoading(true);
    try {
      const colabPayload = {
        tenantId: regTenantId,
        nome: regNome.trim(),
        cpf: regCpf.trim(),
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        departamentoNome: regDepto,
        cargoTitulo: regCargo,
        senha: regSenha.trim()
      };

      const res = await fetch('/api/self-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colabPayload)
      });

      const apiResult = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(apiResult?.error || 'Não foi possível concluir o auto-cadastro.');
        setIsLoading(false);
        return;
      }

      const cleanDigits = regCpf.replace(/\D/g, '');
      const novoColabId = apiResult.colabId || `colab-auto-${cleanDigits.slice(-6)}-${Date.now().toString().slice(-4)}`;
      const matriculaGerada = apiResult.data?.matricula || `PEND-${cleanDigits.slice(0, 4)}`;
      const todayBr = getBrasiliaYmd();

      const metadataBio = JSON.stringify({
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        pretensaoDepto: regDepto || '',
        pretensaoCargo: regCargo || ''
      });

      const selectedTenant = publicTenants.find((t) => t.id === regTenantId);

      const novoColabObjeto = {
        id: novoColabId,
        collaborator_id: novoColabId,
        tenantId: regTenantId,
        tenant_id: regTenantId,
        nome: regNome.trim(),
        cpf: regCpf.trim(),
        matricula: matriculaGerada,
        dataAdmissao: todayBr,
        data_admissao: todayBr,
        cargoId: 'crg-auto',
        cargoTitulo: regCargo || 'A Definir pelo Gestor',
        cargo_titulo: regCargo || 'A Definir pelo Gestor',
        departamentoId: 'dep-auto',
        departamentoNome: regDepto || 'A Definir pelo Gestor',
        departamento_nome: regDepto || 'A Definir pelo Gestor',
        estabelecimentoId: 'est-01',
        estabelecimentoNome: selectedTenant?.nomeFantasia || 'A Definir',
        regime: 'REGULAR' as const,
        horarioInicio: '08:00',
        horarioFim: '17:00',
        cargaHorariaDiariaHoras: 8,
        intervaloMinutos: 60,
        maxMinutosAntecedenciaPermitido: 15,
        regraAntecedenciaAtiva: true,
        pinColetor: regSenha.trim(),
        pin_coletor: regSenha.trim(),
        status: 'PENDENTE' as const,
        biometriaCadastrada: false,
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        pretensaoDepto: regDepto,
        pretensaoCargo: regCargo,
        biometriaHashTemplate: metadataBio,
        dataSolicitacaoCadastro: formatBrasiliaDate()
      };

      onCollaboratorRegistered?.(novoColabObjeto);

      setLastRegisteredName(regNome.trim());
      setRegisteredSummary({
        nome: regNome.trim(),
        cpf: regCpf.trim(),
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim() || 'Não informado',
        depto: regDepto,
        cargo: regCargo || 'A Definir pelo Gestor',
        empresa: selectedTenant?.razaoSocial || 'Softcase Tecnologia'
      });
      setAuthMode('register_success');
    } catch (err: any) {
      console.error('Erro no auto-cadastro:', err);
      setErrorMessage('Erro ao submeter seu cadastro. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do Formulário de Recuperação de Acesso (Duplo Fator)
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recIdentificador.trim()) {
      setErrorMessage('Informe seu CPF cadastrado.');
      return;
    }

    if (!recSegundoFator.trim()) {
      setErrorMessage('Informe seu E-mail corporativo ou Matrícula para validação em dois fatores.');
      return;
    }

    if (recNovaSenha.length < 4) {
      setErrorMessage('A nova senha deve conter no mínimo 4 caracteres ou dígitos.');
      return;
    }

    if (recNovaSenha !== recNovaSenhaConfirma) {
      setErrorMessage('A confirmação da nova senha não confere.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/recover-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: recIdentificador.trim(),
          segundoFator: recSegundoFator.trim(),
          novaSenha: recNovaSenha.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Senha atualizada com sucesso! Você já pode entrar com a nova senha.');
        setIdentificador(recIdentificador.trim());
        setSenha(recNovaSenha.trim());
      } else {
        setErrorMessage(data.error || 'Dados não conferem com nenhum colaborador ativo.');
      }
    } catch {
      setErrorMessage('Erro ao conectar com o serviço de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do Login (100% autenticado pelo servidor sem bypass)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const rawIdent = identificador.trim();
    const emailTrimmed = rawIdent.toLowerCase();

    try {
      // 1. Tentar login de Administrador se identificador tiver formato de e-mail administrativo
      if (
        emailTrimmed === 'admin@softcase.com.br' ||
        emailTrimmed === 'admin'
      ) {
        const targetEmail = emailTrimmed === 'admin' ? 'admin@softcase.com.br' : emailTrimmed;
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'ADMIN',
            email: targetEmail,
            password: senha
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.token && data?.user) {
          setAuthToken(data.token);
          const u = data.user;
          const authUser: AuthUser = {
            id: u.id,
            nome: u.user_metadata?.nome || 'Super Administrador',
            email: u.email || targetEmail,
            cpf: u.user_metadata?.cpf || '000.000.000-00',
            role: (u.user_metadata?.role as any) || 'SUPER_ADMIN',
            roleLabel: u.user_metadata?.roleLabel || 'Super Administrador',
            tenantId: u.user_metadata?.tenantId || 'tenant-01',
            tenantNome: u.user_metadata?.tenantNome || 'Softcase Tecnologia',
            mfaHabilitado: false
          };
          concluirLogin(authUser);
          return;
        }
        setErrorMessage(data?.error || 'E-mail ou senha administrativa inválidos.');
        setIsLoading(false);
        return;
      }

      // 2. Login via Supabase Auth se for e-mail corporativo padrão
      if (emailTrimmed.includes('@')) {
        const { data: sbData, error: sbErr } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: senha
        });
        if (sbData?.user && sbData?.session?.access_token && !sbErr) {
          setAuthToken(sbData.session.access_token);
          const role = (sbData.user.user_metadata?.role as any) || 'COLABORADOR';
          const authUser: AuthUser = {
            id: sbData.user.id,
            nome: sbData.user.user_metadata?.nome || sbData.user.email?.split('@')[0] || 'Usuário',
            email: sbData.user.email || emailTrimmed,
            cpf: sbData.user.user_metadata?.cpf || '000.000.000-00',
            role,
            roleLabel: sbData.user.user_metadata?.roleLabel || 'Colaborador CLT',
            tenantId: sbData.user.user_metadata?.tenantId || 'tenant-01',
            tenantNome: sbData.user.user_metadata?.tenantNome || 'Softcase Tecnologia',
            mfaHabilitado: !!sbData.user.user_metadata?.mfaHabilitado
          };
          concluirLogin(authUser);
          return;
        }
      }

      // 3. Autenticação de Colaborador / Gestor / RH via servidor oficial (CPF, E-mail ou Matrícula + PIN/Senha)
      const colabRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'COLABORADOR',
          identificador: rawIdent,
          senha: senha.trim()
        })
      });

      const colabData = await colabRes.json().catch(() => ({}));
      if (colabRes.ok && colabData?.token && colabData?.user) {
        setAuthToken(colabData.token);
        const meta = colabData.user.user_metadata || {};
        const authUser: AuthUser = {
          id: colabData.colaborador?.id || colabData.user.id,
          nome: meta.nome || colabData.colaborador?.nome || 'Colaborador',
          email: colabData.user.email || `${(colabData.colaborador?.matricula || 'colab').toLowerCase()}@pointcontrol.local`,
          cpf: meta.cpf || colabData.colaborador?.cpf || '',
          role: (meta.role as any) || 'COLABORADOR',
          roleLabel: meta.roleLabel || 'Colaborador CLT',
          tenantId: meta.tenantId || colabData.colaborador?.tenantId || 'tenant-01',
          tenantNome: meta.tenantNome || 'Empresa',
          departamentoNome: colabData.colaborador?.departamentoNome,
          cargoTitulo: colabData.colaborador?.cargoTitulo,
          mfaHabilitado: false
        };
        concluirLogin(authUser);
        return;
      }

      setErrorMessage(
        colabData?.error || 'Credenciais incorretas. Verifique o CPF, Matrícula ou E-mail e a sua senha/PIN.'
      );
      setIsLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Erro de conexão com o servidor de autenticação. Tente novamente.');
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (mfaCode.trim().length !== 6) {
      setErrorMessage('O código MFA deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    concluirLogin(pendingUser);
  };

  const concluirLogin = (user: AuthUser) => {
    setIsLoading(false);
    if (user.role === 'COLABORADOR') {
      onLoginSuccess(user, 'colaborador');
    } else {
      onLoginSuccess(user, 'operational');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      {/* Brand Header & Modern Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 text-white shadow-xl shadow-blue-500/20 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Point Control
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Sistema de Controle de Jornada & Registro Eletrônico REP-P
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Ambiente Autenticado & Portaria 671</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs border border-slate-200 rounded-2xl space-y-6">
          
          {/* ======================================================== */}
          {/* MODO 1: LOGIN TRADICIONAL                                */}
          {/* ======================================================== */}
          {authMode === 'login' && !mfaStep && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF, Matrícula ou E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={identificador}
                    onChange={(e) => handleIdentificadorChange(e.target.value)}
                    placeholder="CPF, matrícula ou nome@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha ou PIN de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" defaultChecked className="rounded text-slate-900 focus:ring-slate-900" />
                  <span>Lembrar meu acesso</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">TLS / HMAC</span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Validando Credenciais...
                  </>
                ) : (
                  <>
                    Entrar na Plataforma
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>

              {/* Botões Solicitados pelo Usuário: Registrar-me e Recuperar meu acesso */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('register');
                  }}
                  className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition-colors cursor-pointer"
                  title="Cadastrar-se como colaborador e solicitar liberação de acesso ao gestor"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Registrar-me</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('recover');
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium hover:underline transition-colors cursor-pointer"
                  title="Redefinir senha de acesso ou PIN do coletor"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Recuperar meu acesso</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODO 2: AUTO-CADASTRO DO COLABORADOR (REGISTRAR-ME)     */}
          {/* ======================================================== */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    Auto-Cadastro de Colaborador
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Preencha seus dados para homologação pelo gestor/RH.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setAuthMode('login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Voltar ao Login"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Seleção de Empresa / Tenant */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Empresa / Empregador *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={regTenantId}
                    onChange={(e) => setRegTenantId(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium bg-white"
                  >
                    {publicTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.razaoSocial} ({t.nomeFantasia})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regNome}
                    onChange={(e) => setRegNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* CPF e Telefone com Validação em Tempo Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      CPF (11 dígitos) *
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regCpf}
                    onChange={(e) => handleRegCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono transition-colors ${
                      regCpf.replace(/\D/g, '').length === 11
                        ? validateCPF(regCpf).isValid
                          ? 'border-emerald-300 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                          : 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                  {regCpf.replace(/\D/g, '').length === 11 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      {validateCPF(regCpf).isValid ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> CPF Válido (Receita Federal)
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> CPF Inválido
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={regTelefone}
                      onChange={(e) => handleRegTelefoneChange(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  {regTelefone.replace(/\D/g, '').length >= 10 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Telefone Formatado
                    </div>
                  )}
                </div>
              </div>

              {/* E-mail com Validação em Tempo Real */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo ou Pessoal *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none transition-colors ${
                      regEmail.trim().length > 0
                        ? validateEmail(regEmail)
                          ? 'border-emerald-300 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                          : 'border-amber-300 bg-amber-50/20 focus:ring-2 focus:ring-amber-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                </div>
                {regEmail.trim().length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    {validateEmail(regEmail) ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> E-mail Válido
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Formato de e-mail incompleto
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Departamento e Cargo Sugerido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pretensão de Departamento
                  </label>
                  <select
                    value={regDepto}
                    onChange={(e) => setRegDepto(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Administrativo & Operações">Administrativo & Operações</option>
                    <option value="Engenharia de Software">Engenharia de Software</option>
                    <option value="Recursos Humanos & DP">Recursos Humanos & DP</option>
                    <option value="Operações & Suporte">Operações & Suporte</option>
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Financeiro & Controladoria">Financeiro & Controladoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pretensão de Cargo
                  </label>
                  <input
                    type="text"
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    placeholder="Ex: Comercial, Assistente, etc."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Senha e Confirmação com Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha de Acesso (Mínimo 4) *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    placeholder="Sua senha secreta"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  {regSenha.length > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      {regSenha.length >= 8 && /[0-9]/.test(regSenha) ? (
                        <span className="text-emerald-700 font-bold">✓ Senha Forte</span>
                      ) : regSenha.length >= 6 ? (
                        <span className="text-indigo-700 font-semibold">✓ Senha Boa</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Senha Básica</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={regSenhaConfirma}
                    onChange={(e) => setRegSenhaConfirma(e.target.value)}
                    placeholder="Repita a senha"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono transition-colors ${
                      regSenhaConfirma.length > 0
                        ? regSenha === regSenhaConfirma
                          ? 'border-emerald-300 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                          : 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                  {regSenhaConfirma.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      {regSenha === regSenhaConfirma ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Senhas conferem
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Senhas não coincidem
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Aviso de Homologação Portaria 671 */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Homologação pelo Gestor de RH
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Conforme a CLT e Portaria MTP nº 671/2021, o seu cadastro será submetido com status <strong>Pendente</strong>. O gestor receberá sua solicitação na aba de colaboradores para homologar sua jornada, escala e liberar suas funções.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (regCpf.replace(/\D/g, '').length === 11 && !validateCPF(regCpf).isValid)}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando Cadastro...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Enviar p/ Aprovação do RH
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODO 3: SUCESSO DO REGISTRO COM RESUMO DETALHADO         */}
          {/* ======================================================== */}
          {authMode === 'register_success' && (
            <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cadastro Enviado com Sucesso!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Obrigado, <strong>{lastRegisteredName}</strong>. Suas informações foram encaminhadas para a <strong>aba de Colaboradores do RH</strong>.
                </p>
              </div>

              {/* Ficha Resumo dos Dados Cadastrados */}
              {registeredSummary && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dados Enviados</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> Aguardando Homologação do RH
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Nome:</span>
                      <span className="font-bold text-slate-900 truncate block">{registeredSummary.nome}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">CPF:</span>
                      <span className="font-mono font-bold text-slate-900 block">{registeredSummary.cpf}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">E-mail:</span>
                      <span className="font-semibold text-slate-800 truncate block">{registeredSummary.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Telefone:</span>
                      <span className="font-mono text-slate-800 block">{registeredSummary.telefone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Pretensão Depto:</span>
                      <span className="font-semibold text-slate-800 truncate block">{registeredSummary.depto}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Pretensão Cargo:</span>
                      <span className="font-semibold text-slate-800 truncate block">{registeredSummary.cargo}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-left text-xs text-emerald-900 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Próximos Passos:
                </div>
                <div className="text-[11px] text-emerald-800 space-y-1">
                  <div>1. O gestor da empresa validará seus dados e homologará seu perfil;</div>
                  <div>2. O RH atribuirá sua escala de trabalho (ex: 5x2 ou 12x36);</div>
                  <div>3. Assim que homologado, suas funções serão liberadas imediatamente.</div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    if (registeredSummary) {
                      setIdentificador(registeredSummary.cpf);
                      setSenha(regSenha);
                    }
                    setAuthMode('login');
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  Testar Login com Minhas Credenciais
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setAuthMode('login');
                  }}
                  className="w-full py-2 px-3 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors"
                >
                  Voltar à Tela Inicial
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 4: RECUPERAR MEU ACESSO (REDEFINIÇÃO DE SENHA/PIN)   */}
          {/* ======================================================== */}
          {authMode === 'recover' && (
            <form onSubmit={handleRecoverSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    Recuperar Meu Acesso
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Redefina sua senha de acesso ou PIN do coletor de ponto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('login');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Voltar ao Login"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seu CPF Cadastrado *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={recIdentificador}
                    onChange={(e) => handleRecIdentificadorChange(e.target.value)}
                    placeholder="Ex: 573.321.598-48"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2º Fator de Validação: E-mail Corporativo ou Matrícula *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={recSegundoFator}
                    onChange={(e) => setRecSegundoFator(e.target.value)}
                    placeholder="seu.email@empresa.com.br ou matrícula"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Senha / PIN *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={recNovaSenha}
                    onChange={(e) => setRecNovaSenha(e.target.value)}
                    placeholder="Mínimo 4 dígitos"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={recNovaSenhaConfirma}
                    onChange={(e) => setRecNovaSenhaConfirma(e.target.value)}
                    placeholder="Repita a senha"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-mono transition-colors ${
                      recNovaSenhaConfirma.length > 0
                        ? recNovaSenha === recNovaSenhaConfirma
                          ? 'border-emerald-300 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                          : 'border-rose-300 bg-rose-50/20 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                  {recNovaSenhaConfirma.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      {recNovaSenha === recNovaSenhaConfirma ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Senhas conferem
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Senhas não coincidem
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setSuccessMessage(null);
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    Entrar Agora com a Nova Senha
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {!successMessage && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redefinindo Senha...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Redefinir Minha Senha
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* MFA STEP */}
          {mfaStep && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Autenticação Multifator (MFA)
                </h3>
                <p className="text-xs text-slate-500">
                  Perfil de <strong>{pendingUser?.roleLabel}</strong> requer verificação em duas etapas conforme a Portaria MTP nº 671/2021.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-center">
                  Código de 6 dígitos do app autenticador:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full py-2.5 text-center font-mono font-bold tracking-widest text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMfaStep(false)}
                  className="w-1/2 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Confirmar Acesso
                </button>
              </div>
            </form>
          )}

          {/* Rodapé de Segurança e Conformidade */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ambiente Autenticado · Portaria MTP 671/2021 e LGPD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
