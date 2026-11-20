import React, { useEffect, useState } from 'react';
import { RegistroPontoREPP, Colaborador } from '../../types/operational';
import { Download, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface GestaoRegistrosPontoTabProps {
  activeRegistros: RegistroPontoREPP[];
  activeColaboradores: Colaborador[];
  onDownloadAFD: () => void;
  onDownloadAEJ: () => void;
}

interface BiometricAuditStat {
  total: number;
  success: number;
  failed: number;
  avgSimilarity: number;
  lastVerdict: string;
}

export const GestaoRegistrosPontoTab: React.FC<GestaoRegistrosPontoTabProps> = ({
  activeRegistros,
  activeColaboradores,
  onDownloadAFD,
  onDownloadAEJ
}) => {
  const { authToken, session } = useAuth();
  const bearerToken = authToken || session?.access_token || '';
  const [auditStats, setAuditStats] = useState<Record<string, BiometricAuditStat>>({});

  useEffect(() => {
    let active = true;
    async function loadAuditStats() {
      const tenantId = activeColaboradores[0]?.tenantId || activeRegistros[0]?.tenantId;
      if (!tenantId || !bearerToken) return;
      try {
        const res = await fetch(`/api/biometric-audit-summary?tenantId=${encodeURIComponent(tenantId)}`, {
          headers: { Authorization: `Bearer ${bearerToken}` }
        });
        if (!res.ok || !active) return;
        const json = await res.json();
        const summary = json?.summary || {};
        const formatted: Record<string, BiometricAuditStat> = {};
        for (const [cid, st] of Object.entries<any>(summary)) {
          const total = Number(st?.count || 0);
          const success = Number(st?.successCount ?? total);
          const failed = Number(st?.failedCount ?? Math.max(0, total - success));
          formatted[cid] = {
            total,
            success,
            failed,
            avgSimilarity: Number(st?.avgSimilarity || 0),
            lastVerdict: st?.lastVerdict || ''
          };
        }
        if (active) setAuditStats(formatted);
      } catch {
        // ignore
      }
    }
    loadAuditStats();
    return () => {
      active = false;
    };
  }, [bearerToken, activeColaboradores, activeRegistros.length]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Trilha de Auditoria & AFD</h2>
            <p className="text-xs text-slate-500">Histórico completo de NSRs e exportação fiscal (Portaria 671).</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onDownloadAFD} 
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> AFD Oficial
            </button>
            <button 
              onClick={onDownloadAEJ} 
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> AEJ Fiscal
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <th className="pb-3 px-2">NSR</th>
                <th className="pb-3 px-2">Data/Hora</th>
                <th className="pb-3 px-2">Colaborador</th>
                <th className="pb-3 px-2">Evento</th>
                <th className="pb-3 px-2">Dispositivo</th>
                <th className="pb-3 px-2 text-right">Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeRegistros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    Nenhum registro de ponto encontrado para esta empresa.
                  </td>
                </tr>
              ) : (
                activeRegistros.map((reg, idx) => (
                  <tr key={`${reg.id || reg.nsr}-${reg.hashSha256 || idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{String(reg.nsr).padStart(6, '0')}</td>
                    <td className="py-2.5 px-2 text-slate-600">{reg.dataHoraFormatada}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-700">{reg.colaboradorNome}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase ${
                        reg.tipoMarcacao === 'ENTRADA' ? 'bg-blue-50 text-blue-700' :
                        reg.tipoMarcacao === 'SAIDA' ? 'bg-rose-50 text-rose-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {reg.tipoMarcacao}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500">{reg.modoDispositivo}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-[8px] text-slate-400 truncate max-w-[100px]">{reg.hashSha256}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Seção de Auditoria de Liveness / Prova de Vida Real por Colaborador */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Auditoria de Taxa de Sucesso & Prova de Vida (biometric_audit_logs)
              </h3>
              <p className="text-[11px] text-slate-500">Métricas reais de verificação biométrica e vivacidade auditadas no Supabase.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">Colaborador</th>
                  <th className="pb-3 px-2">Total Tentativas</th>
                  <th className="pb-3 px-2">Sucessos (Liveness OK)</th>
                  <th className="pb-3 px-2">Falhas / Suspeitas</th>
                  <th className="pb-3 px-2">Taxa de Sucesso (%)</th>
                  <th className="pb-3 px-2">Status de Risco</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeColaboradores.map((colab) => {
                  const stat = auditStats[colab.id];
                  const totalAttempts = stat?.total || 0;
                  const successAttempts = stat?.success || 0;
                  const failedAttempts = stat?.failed || 0;
                  const successRate = totalAttempts > 0 ? Math.round((successAttempts / totalAttempts) * 100) : null;
                  const isSuspicious = successRate !== null && successRate < 85;

                  return (
                    <tr key={colab.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-bold text-slate-900">{colab.nome}</div>
                        <div className="text-[10px] text-slate-500 font-mono">CPF: {colab.cpf}</div>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-700">{totalAttempts}</td>
                      <td className="py-3 px-2 font-mono text-emerald-600 font-semibold">{successAttempts}</td>
                      <td className="py-3 px-2 font-mono text-rose-600 font-semibold">{failedAttempts}</td>
                      <td className="py-3 px-2">
                        {successRate !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className={`h-full ${successRate >= 90 ? 'bg-emerald-500' : successRate >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${successRate}%` }}></div>
                            </div>
                            <span className="font-mono font-bold text-slate-800">{successRate}%</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem auditorias registradas</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {successRate === null ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 w-fit inline-block">
                            Aguardando 1º registro
                          </span>
                        ) : isSuspicious ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Suspeito / Alerta
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Conforme
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
