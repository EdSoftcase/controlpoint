import React from 'react';
import {
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Key,
  AlertTriangle,
  UserCheck,
  Globe
} from 'lucide-react';

export interface SystemStatusData {
  supabaseConnected: boolean;
  env: { url: boolean; key: boolean; encryption?: boolean };
  lastChecked: string;
  loading: boolean;
}

interface GestaoConfiguracoesTabProps {
  systemStatus: SystemStatusData;
  checkSystemStatus: () => Promise<void>;
  updateSupabaseConfig: (url: string, anonKey: string) => void;
}

export const GestaoConfiguracoesTab: React.FC<GestaoConfiguracoesTabProps> = ({
  systemStatus,
  checkSystemStatus,
  updateSupabaseConfig,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configurações de Integração</h2>
              <p className="text-xs text-slate-500">Monitore e valide a conexão com o Supabase e chaves de acesso.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={checkSystemStatus}
              disabled={systemStatus.loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${systemStatus.loading ? 'animate-spin' : ''}`} />
              {systemStatus.loading ? 'Verificando...' : 'Atualizar Status'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status da Conexão Principal */}
          <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center space-y-3 ${
            systemStatus.supabaseConnected 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {systemStatus.supabaseConnected ? (
              <Wifi className="w-10 h-10 text-emerald-600" />
            ) : (
              <WifiOff className="w-10 h-10 text-rose-600" />
            )}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider">Status da Conexão</div>
              <div className="text-2xl font-black">{systemStatus.supabaseConnected ? 'CONECTADO' : 'SEM CONEXÃO'}</div>
            </div>
            <div className="text-[10px] opacity-60 font-mono">Última checagem: {systemStatus.lastChecked}</div>
            {!systemStatus.supabaseConnected && (
              <p className="text-[10px] leading-tight">
                Verifique as chaves e se o RLS permite leitura na tabela <code>logs</code>.
              </p>
            )}
          </div>

          {/* Formulário de Update de Chaves */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                <Key className="w-4 h-4 text-emerald-600" />
                Configurar Chaves Supabase (Sessão Atual)
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Supabase Project URL</label>
                  <input 
                    type="text" 
                    id="ui_supabase_url"
                    placeholder="https://abc.supabase.co"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-slate-900" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Anon Key (Frontend)</label>
                    <input 
                      type="password" 
                      id="ui_supabase_anon"
                      placeholder="sb_publishable_..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-slate-900" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Service Role Key (Backend)</label>
                    <input 
                      type="password" 
                      id="ui_supabase_key"
                      placeholder="sb_secret_..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-slate-900" 
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={async () => {
                  const url = (document.getElementById('ui_supabase_url') as HTMLInputElement).value;
                  const key = (document.getElementById('ui_supabase_key') as HTMLInputElement).value;
                  const anon = (document.getElementById('ui_supabase_anon') as HTMLInputElement).value;
                  if (!url || !key || !anon) return alert('Preencha URL, Anon Key e Service Key');
                  try {
                    const res = await fetch('/api/update-config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url, key })
                    });
                    if (res.ok) {
                      updateSupabaseConfig(url, anon);
                      alert('Configuração atualizada com sucesso!');
                      checkSystemStatus();
                    } else {
                      const err = await res.json();
                      alert(`Erro: ${err.error}`);
                    }
                  } catch (e) {
                    alert('Erro de conexão com o servidor.');
                  }
                }}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Aplicar Estas Chaves Agora
              </button>
              <p className="text-[9px] text-slate-500 italic">
                * Chaves inseridas aqui valem apenas para a sessão atual do servidor. Para persistir, use o menu "Secrets" do AI Studio.
              </p>
            </div>
          </div>
        </div>

        {/* Bootstrap Section: Criar Primeiro Administrador Real */}
        {!systemStatus.supabaseConnected ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-amber-900">Importante: Supabase não está pronto</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Você precisa configurar as chaves corretamente acima. Após conectar, você poderá criar seu usuário "Super Admin" real para parar de usar os usuários Mock e começar a salvar dados de verdade no Supabase.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-900 text-white rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold text-lg">Criar Primeiro Super-Admin (Real)</h3>
            </div>
            <p className="text-xs text-emerald-100 opacity-80">
              O Supabase está conectado! Crie agora sua conta de administrador oficial. Com ela, você poderá logar no sistema "para valer" e todos os dados criados serão persistidos nas tabelas do seu projeto.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-950/40 p-4 rounded-xl border border-emerald-700/50">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">E-mail</label>
                <input type="email" id="boot_email" defaultValue="admin@suaempresa.com.br" className="w-full px-3 py-2 bg-emerald-950 border border-emerald-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Senha</label>
                <input type="password" id="boot_pass" defaultValue="Softcase@2026" className="w-full px-3 py-2 bg-emerald-950 border border-emerald-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-400" />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={async () => {
                    const email = (document.getElementById('boot_email') as HTMLInputElement).value;
                    const password = (document.getElementById('boot_pass') as HTMLInputElement).value;
                    try {
                      const res = await fetch('/api/bootstrap-admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password, nome: 'Administrador Softcase' })
                      });
                      if (res.ok) {
                        alert('Usuário Super Admin criado com sucesso! Agora saia (Logout) e logue com este novo e-mail e senha.');
                      } else {
                        const err = await res.json();
                        alert(`Erro: ${err.error}`);
                      }
                    } catch (e) {
                      alert('Erro ao criar usuário.');
                    }
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-lg text-xs transition-all cursor-pointer"
                >
                  Criar Conta Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual de Configuração */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Globe className="w-5 h-5" />
            <h3 className="font-bold">Como Persistir as Chaves Permanentemente</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Para que as chaves não precisem ser digitadas toda vez que o servidor reiniciar, adicione-as nos "Secrets" do ambiente AI Studio:
              </p>
              <ol className="text-xs space-y-3 list-decimal list-inside text-slate-300">
                <li>Vá em <strong>"Project Settings"</strong> (ícone de engrenagem no topo).</li>
                <li>Clique na aba <strong>"Secrets"</strong>.</li>
                <li>Adicione <code>VITE_SUPABASE_URL</code> e <code>SUPABASE_SERVICE_ROLE_KEY</code>.</li>
                <li>Clique em <strong>"Save"</strong> e reinicie o servidor.</li>
              </ol>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-[10px]">
              <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2">Valores Atuais Detectados no .env:</div>
              <div className="flex justify-between items-center">
                <code className="text-emerald-400">URL</code>
                <span className={systemStatus.env.url ? "text-emerald-500" : "text-rose-500"}>{systemStatus.env.url ? 'CONFIGURADO OK' : 'AUSENTE'}</span>
              </div>
              <div className="flex justify-between items-center">
                <code className="text-emerald-400">SERVICE_KEY</code>
                <span className={systemStatus.env.key ? "text-emerald-500" : "text-rose-500"}>{systemStatus.env.key ? 'CONFIGURADO OK' : 'AUSENTE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
