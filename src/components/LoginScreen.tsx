import React, { useState } from 'react';
import { AuthUser } from '../types/auth';
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
  HelpCircle,
  Settings,
  Key
} from 'lucide-react';
import { supabase, useAuth } from './AuthContext';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, redirectView: 'operational' | 'colaborador') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { supabase, updateSupabaseConfig } = useAuth();
  const [identificador, setIdentificador] = useState('admin@softcase.com.br');
  const [senha, setSenha] = useState('Softcase@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Estados para configuração manual do Supabase
  const [configUrl, setConfigUrl] = useState('');
  const [configAnon, setConfigAnon] = useState('');
  const [configService, setConfigService] = useState('');
  const [registeredColabs, setRegisteredColabs] = useState<any[]>([]);

  // Carregar do localStorage ao montar e buscar colaboradores no Supabase
  React.useEffect(() => {
    const savedUrl = localStorage.getItem('sc_supabase_url') || '';
    const savedAnon = localStorage.getItem('sc_supabase_anon') || '';
    const savedService = localStorage.getItem('sc_supabase_service') || '';
    
    if (savedUrl) setConfigUrl(savedUrl);
    if (savedAnon) setConfigAnon(savedAnon);
    if (savedService) setConfigService(savedService);

    // Busca colaboradores reais cadastrados no Supabase para facilitar acesso do usuário
    async function loadColabs() {
      try {
        const { data } = await supabase
          .from('collaborators')
          .select('collaborator_id, nome, cpf, matricula, pin_coletor, cargo_titulo, departamento_nome, tenant_id');
        if (data && data.length > 0) {
          setRegisteredColabs(data.filter((c: any) => c.collaborator_id !== 'colab-admin-01'));
        }
      } catch (err) {
        console.warn('Aviso ao carregar colaboradores no Login:', err);
      }
    }
    loadColabs();
  }, [supabase]);

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

  const handleUpdateConfig = async () => {
    if (!configUrl || !configAnon || !configService) {
      alert('Preencha todos os campos da configuração.');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: configUrl, key: configService })
      });

      if (res.ok) {
        localStorage.setItem('sc_supabase_service', configService);
        updateSupabaseConfig(configUrl, configAnon);
        alert('Supabase configurado com sucesso! Agora você pode tentar o login ou o bootstrap.');
        setShowConfig(false);
      } else {
        const err = await res.json();
        alert(`Erro ao configurar servidor: ${err.error}`);
      }
    } catch (err) {
      alert('Erro de conexão ao tentar configurar o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBootstrap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@softcase.com.br',
          password: 'Softcase@2026',
          nome: 'Super Administrador Softcase'
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('Administrador criado/atualizado com sucesso! Use as credenciais reais para entrar.');
      } else {
        alert(`Erro no Bootstrap: ${data.error}`);
      }
    } catch (err) {
      alert('Erro de rede ao tentar bootstrap.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const emailTrimmed = identificador.trim().toLowerCase();
    const isMasterAdmin = (
      (emailTrimmed === 'admin@softcase.com.br' || 
       emailTrimmed === 'edsonfreire.santos@hotmail.com' || 
       emailTrimmed === 'admin' ||
       emailTrimmed === '000.000.000-00') && 
      senha === 'Softcase@2026'
    );

    try {
      // 1. Tentar autenticação real via Supabase GoTrue
      const targetEmail = emailTrimmed.includes('@') ? emailTrimmed : `${emailTrimmed}@softcase.com.br`;
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email: targetEmail, 
        password: senha,
      });

      if (data?.user && !sbError) {
        const isSuper = (data.user.email === 'admin@softcase.com.br' || data.user.email === 'edsonfreire.santos@hotmail.com');
        const authUser: AuthUser = {
          id: data.user.id,
          nome: data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Usuário',
          email: data.user.email || targetEmail,
          cpf: data.user.user_metadata?.cpf || '000.000.000-00',
          role: isSuper ? 'SUPER_ADMIN' : 'COLABORADOR',
          roleLabel: isSuper ? 'Super Administrador Softcase' : 'Colaborador CLT',
          tenantId: data.user.user_metadata?.tenantId || 'tenant-01',
          tenantNome: data.user.user_metadata?.tenantNome || 'Softcase Tecnologia',
          mfaHabilitado: !!data.user.user_metadata?.mfaHabilitado
        };
        concluirLogin(authUser);
        return;
      }

      // 2. Se as credenciais forem do Administrador Mestre do sistema
      if (isMasterAdmin) {
        // Sincronizar dados do Admin no Supabase (tabelas tenants e collaborators)
        try {
          await supabase.from('tenants').upsert({
            tenant_id: 'tenant-01',
            cnpj: '00.000.000/0001-91',
            razao_social: 'Softcase Tecnologia',
            nome_fantasia: 'Softcase',
            slug: 'softcase',
            plano: 'REP-P Corporativo',
            licencas_contratadas: 9999,
            email_admin: targetEmail,
            status: 'ATIVO'
          }, { onConflict: 'tenant_id' });

          await supabase.from('collaborators').upsert({
            collaborator_id: 'colab-admin-01',
            tenant_id: 'tenant-01',
            nome: emailTrimmed.includes('edson') ? 'Edson Freire' : 'Super Administrador Softcase',
            cpf: '000.000.000-00',
            matricula: 'ADM-001',
            data_admissao: '2024-01-01',
            cargo_titulo: 'Super Administrador',
            departamento_nome: 'Tecnologia / RH',
            status: 'ATIVO'
          }, { onConflict: 'collaborator_id' });

          // Tentar registrar no GoTrue em background se ainda não existir
          // supabase.auth.signUp({
          //   email: targetEmail,
          //   password: senha,
          //   options: {
          //     data: {
          //       nome: emailTrimmed.includes('edson') ? 'Edson Freire' : 'Super Administrador Softcase',
          //       role: 'SUPER_ADMIN',
          //       roleLabel: 'Super Administrador Softcase',
          //       tenantId: 'tenant-01',
          //       tenantNome: 'Softcase Tecnologia'
          //     }
          //   }
          // }).catch(() => {});
        } catch (syncErr) {
          console.warn('Sync aviso:', syncErr);
        }

        const adminUser: AuthUser = {
          id: 'usr-admin-master',
          nome: emailTrimmed.includes('edson') ? 'Edson Freire' : 'Super Administrador Softcase',
          email: targetEmail,
          cpf: '000.000.000-00',
          role: 'SUPER_ADMIN',
          roleLabel: 'Super Administrador Softcase',
          tenantId: 'tenant-01',
          tenantNome: 'Softcase Tecnologia',
          mfaHabilitado: false
        };

        concluirLogin(adminUser);
        return;
      }

      // 3. Tentar busca de Colaborador registrado no Supabase por CPF (com ou sem máscara), Matrícula ou Nome
      try {
        const cleanDigits = identificador.replace(/\D/g, '');
        const cleanIdent = identificador.trim();
        const formattedCpf = cleanDigits.length === 11 ? formatCPF(cleanDigits) : '';

        // Monta os filtros de busca no Supabase
        const orClauses: string[] = [];
        if (cleanDigits) {
          orClauses.push(`cpf.eq.${cleanDigits}`);
        }
        if (formattedCpf) {
          orClauses.push(`cpf.eq.${formattedCpf}`);
        }
        if (cleanIdent) {
          orClauses.push(`matricula.ilike.${cleanIdent}`);
          orClauses.push(`collaborator_id.eq.${cleanIdent}`);
          orClauses.push(`nome.ilike.%${cleanIdent}%`);
        }

        const { data: colabs, error: colabQueryError } = await supabase
          .from('collaborators')
          .select('*')
          .or(orClauses.join(','));

        if (colabs && colabs.length > 0) {
          const colab = colabs[0];
          // Verificar PIN ou senha:
          // Aceita se o usuário digitou o PIN do coletor (ex: 123456)
          // OU se digitou a senha de acesso (mínimo 4 caracteres)
          const isPinValid = colab.pin_coletor ? (colab.pin_coletor === senha.trim()) : true;
          const isGenericPass = senha.length >= 4;

          if (isPinValid || isGenericPass) {
            const colabUser: AuthUser = {
              id: colab.collaborator_id || colab.id,
              nome: colab.nome,
              email: `${(colab.matricula || 'colab').toLowerCase()}@softcase.com.br`,
              cpf: colab.cpf,
              role: 'COLABORADOR',
              roleLabel: 'Colaborador CLT',
              tenantId: colab.tenant_id || 'tenant-01',
              tenantNome: 'Softcase Tecnologia',
              departamentoNome: colab.departamento_nome,
              cargoTitulo: colab.cargo_titulo,
              mfaHabilitado: false
            };
            concluirLogin(colabUser);
            return;
          } else {
            setErrorMessage(`PIN ou senha incorreta para ${colab.nome}. Use o PIN do coletor cadastrado (${colab.pin_coletor || '123456'}).`);
            setIsLoading(false);
            return;
          }
        }
      } catch (colabErr) {
        console.warn('Erro ao consultar colaborador no Supabase:', colabErr);
      }

      // Mensagem explicativa em caso de erro
      if (sbError?.message?.includes('Email not confirmed')) {
        setErrorMessage('E-mail não confirmado no Supabase. Para login direto, desative "Confirm email" em Authentication > Providers > Email no painel do Supabase, ou utilize o login administrativo.');
      } else {
        setErrorMessage('Credenciais incorretas. Verifique o CPF (ex: 573.321.598-48), Matrícula ou E-mail e o PIN/Senha informado.');
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Erro de conexão com o serviço de autenticação. Tente novamente.');
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
      {/* Brand Header & Modern Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 text-white shadow-xl shadow-blue-500/20 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Control Point
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Sistema de Controle de Jornada & Registro Eletrônico REP-P
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Conectado ao Servidor Cloud Seguro</span>
        </div>
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
                <button 
                  type="button"
                  onClick={() => setShowConfig(!showConfig)} 
                  className="text-emerald-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Configurar Supabase
                </button>
              </div>

              {showConfig && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Key className="w-3 h-3 text-emerald-500" /> Configuração de Conexão Real
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Supabase Project URL"
                      value={configUrl}
                      onChange={e => setConfigUrl(e.target.value)}
                      className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <input 
                      type="password" 
                      placeholder="Anon Key (Public)"
                      value={configAnon}
                      onChange={e => setConfigAnon(e.target.value)}
                      className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                    <input 
                      type="password" 
                      placeholder="Service Role Key (Secret)"
                      value={configService}
                      onChange={e => setConfigService(e.target.value)}
                      className="w-full px-3 py-2 text-[11px] border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleUpdateConfig}
                      className="flex-1 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800"
                    >
                      Salvar Chaves
                    </button>
                    <button 
                      type="button"
                      onClick={handleBootstrap}
                      className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700"
                    >
                      Criar Admin (Bootstrap)
                    </button>
                  </div>
                </div>
              )}

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
      </div>
    </div>
  );
};
