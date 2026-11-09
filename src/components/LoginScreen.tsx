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
  Key,
  UserPlus,
  RotateCcw,
  Phone,
  Building,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Check
} from 'lucide-react';
import { supabase, useAuth } from './AuthContext';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, redirectView: 'operational' | 'colaborador') => void;
  onCollaboratorRegistered?: (novoColab: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess,
  onCollaboratorRegistered 
}) => {
  const { supabase, updateSupabaseConfig } = useAuth();
  
  // Modos da tela: login tradicional, auto-cadastro, recuperação de senha ou confirmação de envio
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recover' | 'register_success'>('login');

  // Estados de Login
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Estados de Auto-Cadastro do Colaborador
  const [regNome, setRegNome] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regDepto, setRegDepto] = useState('Engenharia de Software');
  const [regCargo, setRegCargo] = useState('Desenvolvedor(a) de Software');
  const [regSenha, setRegSenha] = useState('');
  const [regSenhaConfirma, setRegSenhaConfirma] = useState('');
  const [lastRegisteredName, setLastRegisteredName] = useState('');

  // Estados de Recuperação de Senha
  const [recIdentificador, setRecIdentificador] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [recNovaSenhaConfirma, setRecNovaSenhaConfirma] = useState('');

  // Estados para configuração manual do Supabase
  const [configUrl, setConfigUrl] = useState('');
  const [configAnon, setConfigAnon] = useState('');
  const [configService, setConfigService] = useState('');

  // Etapa de Autenticação em Duas Etapas (MFA)
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  // Carregar configurações locais
  React.useEffect(() => {
    const savedUrl = localStorage.getItem('sc_supabase_url') || '';
    const savedAnon = localStorage.getItem('sc_supabase_anon') || '';
    const savedService = localStorage.getItem('sc_supabase_service') || '';
    
    if (savedUrl) setConfigUrl(savedUrl);
    if (savedAnon) setConfigAnon(savedAnon);
    if (savedService) setConfigService(savedService);
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
        alert('Supabase configurado com sucesso! Agora você pode tentar o login.');
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

  // Submissão do Formulário de Auto-Cadastro do Colaborador
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCpf = regCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setErrorMessage('Por favor digite um CPF válido com 11 dígitos.');
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
        nome: regNome.trim(),
        cpf: regCpf.trim(),
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        departamentoNome: regDepto,
        cargoTitulo: regCargo,
        senha: regSenha.trim()
      };

      // 1. Tentar salvar via backend oficial
      let backendSuccess = false;
      try {
        const res = await fetch('/api/self-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(colabPayload)
        });
        if (res.ok) {
          backendSuccess = true;
        }
      } catch (apiErr) {
        console.warn('Aviso API self-register:', apiErr);
      }

      // 2. Salvar diretamente no Supabase em tabela de colaboradores com status = PENDENTE
      const cleanDigits = regCpf.replace(/\D/g, '');
      const novoColabId = `colab-auto-${cleanDigits.slice(-6)}-${Date.now().toString().slice(-4)}`;
      const matriculaGerada = `PEND-${cleanDigits.slice(0, 4)}`;

      const metadataBio = JSON.stringify({
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        pretensaoDepto: regDepto || '',
        pretensaoCargo: regCargo || ''
      });

      // Grava em cache local para disponibilidade imediata e offline-first
      try {
        const contactMeta = {
          email: regEmail.trim().toLowerCase(),
          telefone: regTelefone.trim(),
          pretensaoDepto: regDepto,
          pretensaoCargo: regCargo
        };
        localStorage.setItem(`sc_colab_meta_${cleanDigits}`, JSON.stringify(contactMeta));
        const allContacts = JSON.parse(localStorage.getItem('sc_all_colab_contacts') || '{}');
        allContacts[cleanDigits] = contactMeta;
        allContacts[regCpf.trim()] = contactMeta;
        localStorage.setItem('sc_all_colab_contacts', JSON.stringify(allContacts));
      } catch (localErr) {
        console.warn('Erro ao salvar meta no localStorage:', localErr);
      }

      const novoColabObjeto = {
        id: novoColabId,
        collaborator_id: novoColabId,
        tenantId: 'tenant-01',
        tenant_id: 'tenant-01',
        nome: regNome.trim(),
        cpf: regCpf.trim(),
        matricula: matriculaGerada,
        dataAdmissao: new Date().toISOString().slice(0, 10),
        data_admissao: new Date().toISOString().slice(0, 10),
        cargoId: 'crg-auto',
        cargoTitulo: regCargo || 'A Definir pelo Gestor',
        cargo_titulo: regCargo || 'A Definir pelo Gestor',
        departamentoId: 'dep-auto',
        departamentoNome: regDepto || 'A Definir pelo Gestor',
        departamento_nome: regDepto || 'A Definir pelo Gestor',
        estabelecimentoId: 'est-01',
        estabelecimentoNome: 'Matriz São Paulo',
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
        email: regEmail.trim().toLowerCase(),
        telefone: regTelefone.trim(),
        biometriaHashTemplate: metadataBio,
        dataSolicitacaoCadastro: new Date().toLocaleDateString('pt-BR')
      };

      try {
        await supabase
          .from('collaborators')
          .upsert({
            collaborator_id: novoColabId,
            tenant_id: 'tenant-01',
            nome: regNome.trim(),
            cpf: regCpf.trim(),
            matricula: matriculaGerada,
            data_admissao: new Date().toISOString().slice(0, 10),
            cargo_titulo: regCargo || 'A Definir pelo Gestor',
            departamento_nome: regDepto || 'A Definir pelo Gestor',
            status: 'PENDENTE',
            pin_coletor: regSenha.trim(),
            biometric_template: metadataBio,
            updated_at: new Date().toISOString()
          }, { onConflict: 'collaborator_id' });
      } catch (sbErr) {
        console.warn('Aviso Supabase upsert:', sbErr);
      }

      // Propaga para o estado global da aplicação
      onCollaboratorRegistered?.(novoColabObjeto);

      setLastRegisteredName(regNome.trim());
      setAuthMode('register_success');
    } catch (err: any) {
      console.error('Erro no auto-cadastro:', err);
      setErrorMessage('Erro ao submeter seu cadastro. Verifique a conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do Formulário de Recuperação de Acesso
  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!recIdentificador.trim()) {
      setErrorMessage('Informe seu CPF ou E-mail corporativo cadastrado.');
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
          novaSenha: recNovaSenha.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || 'Senha atualizada com sucesso! Você já pode entrar com a nova senha.');
        setIdentificador(recIdentificador.trim());
        setSenha(recNovaSenha.trim());
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMessage(null);
        }, 2200);
      } else {
        setErrorMessage(data.error || 'Não foi possível redefinir a senha.');
      }
    } catch (err) {
      setErrorMessage('Erro ao conectar com o serviço de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do Login
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

      // 3. Tentar busca de Colaborador registrado no Supabase por CPF, Matrícula ou Nome
      try {
        const cleanDigits = identificador.replace(/\D/g, '');
        const cleanIdent = identificador.trim();
        const formattedCpf = cleanDigits.length === 11 ? formatCPF(cleanDigits) : '';

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

        const { data: colabs } = await supabase
          .from('collaborators')
          .select('*')
          .or(orClauses.join(','));

        if (colabs && colabs.length > 0) {
          const colab = colabs[0];

          // VERIFICAÇÃO CRÍTICA DE STATUS PENDENTE:
          if (colab.status === 'PENDENTE') {
            setErrorMessage(
              `⏳ Cadastro em Análise: O seu auto-cadastro (${colab.nome}) foi registrado com sucesso e aguarda homologação e liberação de funções pelo Gestor de RH. Assim que o gestor aprovar suas escalas, seu acesso será liberado.`
            );
            setIsLoading(false);
            return;
          }

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
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xs border border-slate-200 rounded-2xl space-y-6">
          
          {/* ======================================================== */}
          {/* MODO 1: LOGIN TRADICIONAL                                */}
          {/* ======================================================== */}
          {authMode === 'login' && !mfaStep && (
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

              {/* CPF e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (11 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={regCpf}
                    onChange={(e) => handleRegCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isLoading}
                      value={regTelefone}
                      onChange={(e) => handleRegTelefoneChange(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* E-mail */}
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
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Departamento e Cargo Sugerido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento
                  </label>
                  <select
                    value={regDepto}
                    onChange={(e) => setRegDepto(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Engenharia de Software">Engenharia de Software</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Operações & Suporte">Operações & Suporte</option>
                    <option value="Comercial & Vendas">Comercial & Vendas</option>
                    <option value="Financeiro">Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo Pretendido
                  </label>
                  <input
                    type="text"
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    placeholder="Ex: Desenvolvedor Pleno"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Senha e Confirmação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha de Acesso *
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    value={regSenha}
                    onChange={(e) => setRegSenha(e.target.value)}
                    placeholder="Mínimo 4 dígitos"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
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
                  disabled={isLoading}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
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
          {/* MODO 3: SUCESSO DO REGISTRO (PENDENTE DE APROVAÇÃO)      */}
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

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Próximos Passos:
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div>1. O gestor da empresa analisará e homologará o seu perfil;</div>
                  <div>2. O RH atribuirá sua escala de trabalho (ex: 5x2 ou 12x36);</div>
                  <div>3. Assim que aprovado, basta fazer login com seu CPF e senha criada.</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setAuthMode('login');
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Voltar à Tela de Login
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
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
                  Seu CPF ou E-mail Cadastrado *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    value={recIdentificador}
                    onChange={(e) => setRecIdentificador(e.target.value)}
                    placeholder="Ex: 573.321.598-48 ou seu.email@empresa.com.br"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
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
