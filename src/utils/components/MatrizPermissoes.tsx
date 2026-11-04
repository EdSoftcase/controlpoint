import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  Search, 
  HelpCircle,
  FileCheck,
  UserCheck,
  Building2,
  Clock,
  Key,
  Eye,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { UserRole } from '../types/auth';
import { 
  ALL_PERMISSIONS, 
  PERMISSION_CATEGORIES, 
  DEFAULT_ROLE_PERMISSIONS, 
  ROLE_LABELS, 
  RolePermissionsMap,
  PermissionDefinition 
} from '../types/permissions';
import { useAuth } from './AuthContext';

const STORAGE_KEY_PERMISSIONS = 'sc_role_permissions_matrix';

export const MatrizPermissoes: React.FC = () => {
  const { supabase } = useAuth();
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ROLE_PERMISSIONS;
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [selectedRoleForSim, setSelectedRoleForSim] = useState<UserRole>('GESTOR');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const rolesList: UserRole[] = ['SUPER_ADMIN', 'RH_ADMIN', 'GESTOR', 'COLABORADOR'];

  const togglePermission = (role: UserRole, permKey: string) => {
    // Super admin deve manter permissões essenciais de segurança, mas permitimos customização total
    setRolePermissions(prev => {
      const currentList = prev[role] || [];
      const has = currentList.includes(permKey);
      const updated = has ? currentList.filter(k => k !== permKey) : [...currentList, permKey];
      return {
        ...prev,
        [role]: updated
      };
    });
  };

  const toggleAllForCategory = (role: UserRole, category: string, enable: boolean) => {
    const permsInCategory = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
    setRolePermissions(prev => {
      const current = new Set(prev[role] || []);
      permsInCategory.forEach(key => {
        if (enable) current.add(key);
        else current.delete(key);
      });
      return {
        ...prev,
        [role]: Array.from(current)
      };
    });
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(rolePermissions));
      
      // Tentativa de salvar no Supabase (em tabela role_permissions se configurada)
      try {
        for (const role of rolesList) {
          await supabase.from('role_permissions').upsert({
            role: role,
            permissions: rolePermissions[role],
            updated_at: new Date().toISOString()
          }, { onConflict: 'role' });
        }
      } catch (err) {
        console.warn('Aviso sincronismo Supabase role_permissions:', err);
      }

      setFeedback({ message: 'Matriz de permissões RBAC salva com sucesso no sistema!', type: 'success' });
    } catch (e) {
      setFeedback({ message: 'Erro ao salvar matriz de permissões.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as permissões recomendadas pela Portaria MTP 671/2021 e CLT?')) {
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      setFeedback({ message: 'Permissões restauradas para o padrão oficial de conformidade!', type: 'info' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Filtragem de permissões
  const filteredPermissions = ALL_PERMISSIONS.filter(p => {
    const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : feedback.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header da Matriz */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Matriz de Permissões & Perfis de Acesso (RBAC)</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Portaria MTP 671 & LGPD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Controle granular de acesso a funcionalidades, relatórios e homologações por nível de autorização.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              title="Restaurar permissões padrão recomendadas"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
            </button>
            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Simulador / Resumo do Perfil Ativo */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">Simulador de Autorização por Perfil:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map(role => {
                const isSelected = selectedRoleForSim === role;
                const info = ROLE_LABELS[role];
                const count = (rolePermissions[role] || []).length;
                return (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleForSim(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{info.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {count}/{ALL_PERMISSIONS.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Resumo do Papel Selecionado */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${ROLE_LABELS[selectedRoleForSim].color}`}>
                  {ROLE_LABELS[selectedRoleForSim].title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({selectedRoleForSim})</span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                {ROLE_LABELS[selectedRoleForSim].subtitle}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] shrink-0">
              <div>
                <span className="text-slate-400 block text-[10px]">Permissões Ativas</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {(rolePermissions[selectedRoleForSim] || []).length} de {ALL_PERMISSIONS.length}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <span className="text-slate-400 block text-[10px]">Nível de Governança</span>
                <span className="font-bold text-slate-800">
                  {selectedRoleForSim === 'SUPER_ADMIN' ? 'Total (Nível 4)' : selectedRoleForSim === 'RH_ADMIN' ? 'Operacional Pleno (Nível 3)' : selectedRoleForSim === 'GESTOR' ? 'Liderança Tática (Nível 2)' : 'Usuário Final (Nível 1)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca de Permissões */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({ALL_PERMISSIONS.length})
            </button>
            {PERMISSION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar permissão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Tabela Matriz Interativa (Grid) */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-1/3 min-w-[280px]">Funcionalidade / Ação</th>
                {rolesList.map(role => (
                  <th key={role} className="py-3 px-3 text-center min-w-[120px]">
                    <div className="font-bold text-white">{ROLE_LABELS[role].title}</div>
                    <div className="text-[9px] font-mono text-emerald-400 font-normal">
                      {(rolePermissions[role] || []).length} liberadas
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map((perm, idx) => {
                const prevPerm = filteredPermissions[idx - 1];
                const isNewCategory = !prevPerm || prevPerm.category !== perm.category;

                return (
                  <React.Fragment key={perm.key}>
                    {isNewCategory && (
                      <tr className="bg-slate-100/80 border-t border-b border-slate-200 font-bold text-slate-700">
                        <td colSpan={5} className="py-2 px-4 uppercase text-[10px] tracking-wider text-slate-600">
                          {perm.categoryLabel}
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {perm.label}
                          {perm.legalBasis && (
                            <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {perm.legalBasis}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">ID: {perm.key}</div>
                      </td>

                      {rolesList.map(role => {
                        const isGranted = (rolePermissions[role] || []).includes(perm.key);
                        return (
                          <td key={role} className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => togglePermission(role, perm.key)}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                isGranted 
                                  ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600' 
                                  : 'bg-slate-100 text-slate-300 border border-slate-200 hover:bg-slate-200 hover:text-slate-500'
                              }`}
                              title={`${isGranted ? 'Revogar' : 'Conceder'} permissão para ${ROLE_LABELS[role].title}`}
                            >
                              {isGranted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé Informativo de Segurança */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Garantia de Imutabilidade Portaria MTP 671/2021:</strong> Nenhuma permissão de sistema autoriza a exclusão ou alteração de marcações de ponto originais no Arquivo Fonte de Dados (AFD).
            </span>
          </div>
          <button
            onClick={handleSaveMatrix}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-2xs"
          >
            Confirmar e Salvar Matriz
          </button>
        </div>
      </div>
    </div>
  );
};
