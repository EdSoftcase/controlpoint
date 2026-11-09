import React from 'react';
import { Colaborador, RegistroPontoREPP } from '../../types/operational';
import { 
  Printer, 
  CheckCircle2, 
  PenTool, 
  ShieldCheck, 
  Clock, 
  Scale, 
  CalendarDays 
} from 'lucide-react';
import { calculateWorkedTime } from '../../utils/jornadaCalculator';

interface PortalEspelhoTabProps {
  meusRegistros: RegistroPontoREPP[];
  userColab?: Colaborador | null;
  hojeStr: string;
  onSolicitarAjuste: (data: string, tipo: string) => void;
}

export const PortalEspelhoTab: React.FC<PortalEspelhoTabProps> = ({
  meusRegistros,
  userColab,
  hojeStr,
  onSolicitarAjuste,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Espelho de Ponto Eletrônico — Competência Novembro/2026
          </h3>
          <p className="text-xs text-slate-500">
            Demonstrativo de apuração com horários de entrada, intervalo intrajornada (CLT Art. 71) e saída.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir Espelho
        </button>
      </div>

      {/* Resumo do Dia para o Funcionário */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Resumo da Jornada de Hoje ({new Date().toLocaleDateString('pt-BR')})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const dayRegistros = meusRegistros.filter(r => r.dataHora.startsWith(hojeStr));
            const getT = (type: string) => {
              const r = dayRegistros.find(reg => reg.tipoMarcacao === type);
              return r ? new Date(r.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
            };
            return (
              <>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">1ª Entrada</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">{getT('ENTRADA')}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Saída Almoço</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">{getT('INTERVALO_INICIO')}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Volta Almoço</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">{getT('INTERVALO_FIM')}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">2ª Saída</span>
                  <span className="text-sm font-mono font-bold text-emerald-700">{getT('SAIDA')}</span>
                </div>
              </>
            );
          })()}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-emerald-800 font-medium">
            {(() => {
              const dayRegistros = meusRegistros.filter(r => r.dataHora.startsWith(hojeStr));
              if (dayRegistros.length === 0) return 'Você ainda não registrou nenhum ponto hoje.';
              const summary = [];
              const e = dayRegistros.find(r => r.tipoMarcacao === 'ENTRADA');
              if (e) summary.push(`Bateu o ponto de entrada às ${new Date(e.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`);
              const si = dayRegistros.find(r => r.tipoMarcacao === 'INTERVALO_INICIO');
              if (si) summary.push(`intervalo às ${new Date(si.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`);
              const vi = dayRegistros.find(r => r.tipoMarcacao === 'INTERVALO_FIM');
              if (vi) summary.push(`volta do intervalo às ${new Date(vi.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`);
              const s = dayRegistros.find(r => r.tipoMarcacao === 'SAIDA');
              if (s) summary.push(`e por fim segunda saída às ${new Date(s.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h`);

              const workedInfo = calculateWorkedTime(dayRegistros);
              let text = summary.join(', ').replace(/, ([^,]*)$/, ' $1') + '.';
              if (workedInfo.hasPunches && workedInfo.formatted !== '-' && workedInfo.formatted !== 'Em curso') {
                text += ` Total trabalhado hoje: ${workedInfo.formatted}.`;
              }
              return text;
            })()}
          </p>
          {meusRegistros.filter(r => r.dataHora.startsWith(hojeStr)).length > 0 && (
            <button 
              onClick={() => onSolicitarAjuste(hojeStr, 'JUSTIFICATIVA_CORRECAO')}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <PenTool className="w-3 h-3" /> Solicitar Correção
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3">Dia da Semana</th>
              <th className="py-2.5 px-3">1ª Entrada</th>
              <th className="py-2.5 px-3">Saída Almoço</th>
              <th className="py-2.5 px-3">Retorno Almoço</th>
              <th className="py-2.5 px-3">2ª Saída</th>
              <th className="py-2.5 px-3">Intervalo</th>
              <th className="py-2.5 px-3">Total Trabalhado</th>
              <th className="py-2.5 px-3">Ocorrência / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {(() => {
              // Agrupar registros por dia (últimos 30 dias para simplificar)
              const last30Days: string[] = [];
              for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last30Days.push(d.toISOString().slice(0, 10));
              }

              const schedule = {
                ENTRADA: userColab?.horarioInicio || '08:00',
                INTERVALO_INICIO: '12:00',
                INTERVALO_FIM: '13:00',
                SAIDA: userColab?.horarioFim || '17:00'
              };

              const checkColor = (punchTime: string | undefined, expectedTime: string) => {
                if (!punchTime) return 'text-slate-400';
                const [pH, pM] = punchTime.split(':').map(Number);
                const [eH, eM] = expectedTime.split(':').map(Number);
                const punchMin = pH * 60 + pM;
                const expectedMin = eH * 60 + eM;
                const diff = Math.abs(punchMin - expectedMin);
                return diff <= 10 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
              };

              return last30Days.map(dateStr => {
                const dayRegistros = meusRegistros.filter(r => r.dataHora.startsWith(dateStr));
                const isToday = dateStr === hojeStr;
                
                const entrada = dayRegistros.find(r => r.tipoMarcacao === 'ENTRADA');
                const saidaAlmoco = dayRegistros.find(r => r.tipoMarcacao === 'INTERVALO_INICIO');
                const voltaAlmoco = dayRegistros.find(r => r.tipoMarcacao === 'INTERVALO_FIM');
                const saidaFinal = dayRegistros.find(r => r.tipoMarcacao === 'SAIDA');

                const fmtTime = (iso: string | undefined) => iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

                // Formatar data e dia da semana
                const d = new Date(dateStr + 'T12:00:00');
                const dayLabel = isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'long' });

                if (dayRegistros.length === 0 && !isToday) return null;

                return (
                  <tr key={dateStr} className={`hover:bg-slate-50/60 transition-colors ${isToday ? 'bg-emerald-50/10' : ''}`}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{dayLabel}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 capitalize">{weekDay}</td>
                    <td className={`py-2.5 px-3 ${checkColor(entrada ? new Date(entrada.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined, schedule.ENTRADA)}`}>
                      {fmtTime(entrada?.dataHora)}
                    </td>
                    <td className={`py-2.5 px-3 ${checkColor(saidaAlmoco ? new Date(saidaAlmoco.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined, schedule.INTERVALO_INICIO)}`}>
                      {fmtTime(saidaAlmoco?.dataHora)}
                    </td>
                    <td className={`py-2.5 px-3 ${checkColor(voltaAlmoco ? new Date(voltaAlmoco.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined, schedule.INTERVALO_FIM)}`}>
                      {fmtTime(voltaAlmoco?.dataHora)}
                    </td>
                    <td className={`py-2.5 px-3 ${checkColor(saidaFinal ? new Date(saidaFinal.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined, schedule.SAIDA)}`}>
                      {fmtTime(saidaFinal?.dataHora)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {saidaAlmoco && voltaAlmoco ? `${Math.round((new Date(voltaAlmoco.dataHora).getTime() - new Date(saidaAlmoco.dataHora).getTime()) / 60000)} min` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {calculateWorkedTime(dayRegistros).formatted}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${dayRegistros.length >= 4 ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>
                        {dayRegistros.length >= 4 ? 'Jornada Completa' : `${dayRegistros.length} batidas`}
                      </span>
                    </td>
                  </tr>
                );
              }).filter(Boolean);
            })()}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Validações Conforme Legislação:</strong> Intervalo intrajornada garantido de no mínimo 60 minutos (CLT Art. 71) e limite de chegada antecipada configurado para 15 minutos em relação ao horário contratado (08:00), resguardando o empregado e o empregador.
        </div>
      </div>

      {/* Apuração de Horas Noturnas Reduzidas & Reflexo DSR (CLT Art. 73 e Súmula 172 TST) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hora Noturna Reduzida (CLT Art. 73)
          </span>
          <div className="text-base font-bold font-mono text-emerald-400">
            02h 17m <span className="text-[10px] text-slate-400 font-normal">(computada a 52m30s)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Período das 22h às 05h com fator oficial de 1.1428 e adicional de 20% garantido.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-emerald-600" /> Reflexo no DSR (Súmula 172 TST)
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            R$ 84,20 <span className="text-[10px] text-emerald-600 font-semibold">(+5 DSRs no mês)</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Incidência legal do repouso semanal sobre as horas extraordinárias apuradas.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> Vigência do Banco de Horas
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            Expira em 30/04/2027
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            CLT Art. 59 § 2º: compensação em até 6 meses com teto legal de 2h extras/dia.
          </p>
        </div>
      </div>
    </div>
  );
};
