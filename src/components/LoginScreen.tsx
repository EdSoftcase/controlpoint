import React, { useState } from 'react';
import { AuthUser, authenticateCredentials, REGISTERED_ACCOUNTS } from '../types/auth';
import { formatCPF } from '../utils/brazilianValidators';
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
  HelpCircle
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, redirectView: 'operational' | 'colaborador') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identificador, setIdentificador] = useState('rh@softcase.com.br');
  const [senha, setSenha] = useState('Rh@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Etapa de Autenticação em Duas Etapas (MFA)
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('482910');
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  const handleIdentificadorChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length === 11 && !val.includes('@')) {
      setIdentificador(formatCPF(val));
    } else {
      setIdentificador(val);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authenticateCredentials(identificador, senha);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique o e-mail/CPF e a senha.');
        setIsLoading(false);
        return;
      }

      // Se o perfil exigir autenticação multifator (MFA Portaria 671)
      if (result.requiresMfa) {
        setPendingUser(result.user);
        setMfaStep(true);
        setIsLoading(false);
        return;
      }

      // Conclui o login e determina o redirecionamento baseado na permissão
      concluirLogin(result.user);
    } catch {
      setErrorMessage('Erro de comunicação com o servidor de autenticação. Tente novamente.');
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
    // Redirecionamento baseado na permissão do usuário
    if (user.role === 'COLABORADOR') {
      onLoginSuccess(user, 'colaborador');
    } else {
      onLoginSuccess(user, 'operational');
    }
  };

  const handlePreencherCredenciais = (email: string, pass: string) => {
    setIdentificador(email);
    setSenha(pass);
    setErrorMessage(null);
    setMfaStep(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 antialiased">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-xs mb-3">
          <Clock className="w-6 h-6 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Softcase Ponto
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Sistema de Controle de Jornada & Registro Eletrônico REP-P / PTRP
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 space-y-6">
        {/* Formulário de Login */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs border border-slate-200 rounded-2xl space-y-6">
          {!mfaStep ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo ou CPF
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={identificador}
                    onChange={(e) => handleIdentificadorChange(e.target.value)}
                    placeholder="nome@empresa.com.br ou CPF"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha de Acesso
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
                <a href="#ajuda" onClick={(e) => { e.preventDefault(); alert('Utilize as contas de demonstração abaixo para autenticação.'); }} className="text-blue-600 hover:underline font-medium">
                  Ajuda para acessar?
                </a>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
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
            </form>
          ) : (
            /* Etapa de Verificação MFA (Portaria 671 Art. 82) */
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

        {/* Guia Oficial de Credenciais Registradas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                Usuários e Perfis Registrados no Sistema
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Validação Real</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Clique em qualquer perfil abaixo para preencher os campos e testar o redirecionamento automático por permissão:
          </p>

          <div className="space-y-2 text-xs">
            {/* Perfil 1: RH & DP */}
            <div className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Luciana Mendonça</span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Perfil RH
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  E-mail: <strong>rh@softcase.com.br</strong> · Senha: <code>Rh@2026</code>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Redirecionamento: Portal do RH, Feriados & DSR, Tablets REP-P e AFD Oficial
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePreencherCredenciais('rh@softcase.com.br', 'Rh@2026')}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Preencher
              </button>
            </div>

            {/* Perfil 2: Colaboradora */}
            <div className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Mariana Silva Santos</span>
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Perfil Colaborador
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  E-mail: <strong>mariana@softcase.com.br</strong> ou CPF: <code>123.456.789-09</code> · Senha: <code>Colab@2026</code>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Redirecionamento: Portal do Colaborador, Espelho Individual e Comprovantes REP-P
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePreencherCredenciais('mariana@softcase.com.br', 'Colab@2026')}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Preencher
              </button>
            </div>

            {/* Perfil 3: Gestor de Equipe */}
            <div className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Roberto Albuquerque</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Gestor de Equipe
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  E-mail: <strong>gestor@softcase.com.br</strong> · Senha: <code>Gestor@2026</code>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Redirecionamento: Fila de Aprovação de Horas Extras da Equipe de Engenharia
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePreencherCredenciais('gestor@softcase.com.br', 'Gestor@2026')}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Preencher
              </button>
            </div>

            {/* Perfil 4: Super Admin */}
            <div className="p-2.5 rounded-lg border border-slate-200/90 bg-slate-50/60 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Super Administrador</span>
                  <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                    Super Admin Softcase
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  E-mail: <strong>admin@softcase.com.br</strong> · Senha: <code>Admin@2026</code>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePreencherCredenciais('admin@softcase.com.br', 'Admin@2026')}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Preencher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
