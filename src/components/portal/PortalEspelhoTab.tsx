import React, { useMemo } from 'react';
import { Colaborador, RegistroPontoREPP } from '../../types/operational';
import {
  Printer,
  CheckCircle2,
  PenTool,
  ShieldCheck,
  Clock,
  Scale,
  CalendarDays,
} from 'lucide-react';
import { calculateWorkedTime } from '../../utils/jornadaCalculator';
import {
  formatBrasiliaDate,
  formatBrasiliaTime,
  getBrasiliaMonthYear,
  getBrasiliaNow,
  getBrasiliaYmd,
  getMonthLabelPtBr,
} from '../../utils/brasiliaClock';
import { calcularHorasNoturnasIntervalo, calcularReflexoDSR } from '../../utils/cltCalculators';

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
  const competenciaAtual = getMonthLabelPtBr(getBrasiliaMonthYear());
  const dataHojeFormatada = formatBrasiliaDate();
  const mesAnoAtual = getBrasiliaMonthYear();

  const registrosMesAtual = useMemo(
    () => meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora).startsWith(mesAnoAtual)),
    [meusRegistros, mesAnoAtual]
  );

  // Apuração real de horas noturnas reduzidas no mês (22h às 05h) usando os registros do mês
  const apuracaoNoturnaMes = useMemo(() => {
    const porDia = new Map<string, RegistroPontoREPP[]>();
    for (const r of registrosMesAtual) {
      const ymd = getBrasiliaYmd(r.dataHora);
      if (!porDia.has(ymd)) porDia.set(ymd, []);
      porDia.get(ymd)!.push(r);
    }

    let totalMinComputados = 0;
    let totalMinExtras = 0;
    const jornadaContratadaMin = (userColab?.cargaHorariaDiariaHoras || 8) * 60;

    for (const [, regs] of porDia) {
      const ordenados = [...regs].sort(
        (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
      );
      for (let i = 0; i + 1 < ordenados.length; i += 2) {
        const resNoturna = calcularHorasNoturnasIntervalo(
          ordenados[i].dataHora,
          ordenados[i + 1].dataHora
        );
        totalMinComputados += resNoturna.minutosNoturnosComputados;
      }

      const worked = calculateWorkedTime(ordenados);
      if (worked.totalMinutes > jornadaContratadaMin) {
        totalMinExtras += worked.totalMinutes - jornadaContratadaMin;
      }
    }

    const hNot = Math.floor(totalMinComputados / 60);
    const mNot = totalMinComputados % 60;
    const hExt = Math.floor(totalMinExtras / 60);
    const mExt = totalMinExtras % 60;

    const salarioHoraEstimado =
      userColab?.salarioBase && userColab.salarioBase > 0 ? userColab.salarioBase / 220 : 0;
    const valorExtras = (totalMinExtras / 60) * salarioHoraEstimado * 1.5;
    const valorNoturno = (totalMinComputados / 60) * salarioHoraEstimado * 0.2;
    const dsr = calcularReflexoDSR(valorExtras, valorNoturno);

    return {
      noturnoFormatado: `${String(hNot).padStart(2, '0')}h ${String(mNot).padStart(2, '0')}m`,
      extrasFormatado: `${String(hExt).padStart(2, '0')}h ${String(mExt).padStart(2, '0')}m`,
      totalMinExtras,
      temSalarioBase: Boolean(salarioHoraEstimado > 0),
      dsr,
    };
  }, [registrosMesAtual, userColab]);

  const horarioContratado = userColab?.horarioInicio || '08:00';
  const toleranciaAntecedencia = userColab?.maxMinutosAntecedenciaPermitido ?? 15;
  const intervaloMinimo = userColab?.intervaloMinutos ?? 60;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Espelho de Ponto Eletrônico — Competência {competenciaAtual}
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
          Resumo da Jornada de Hoje ({dataHojeFormatada})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const dayRegistros = meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === hojeStr);
            const getT = (type: string) => {
              const r = dayRegistros.find((reg) => reg.tipoMarcacao === type);
              return r ? formatBrasiliaTime(r.dataHora, false) : '--:--';
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
              const dayRegistros = meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === hojeStr);
              if (dayRegistros.length === 0) return 'Você ainda não registrou nenhum ponto hoje.';
              const summary: string[] = [];
              const e = dayRegistros.find((r) => r.tipoMarcacao === 'ENTRADA');
              if (e) summary.push(`Bateu o ponto de entrada às ${formatBrasiliaTime(e.dataHora, false)}h`);
              const si = dayRegistros.find((r) => r.tipoMarcacao === 'INTERVALO_INICIO');
              if (si) summary.push(`intervalo às ${formatBrasiliaTime(si.dataHora, false)}h`);
              const vi = dayRegistros.find((r) => r.tipoMarcacao === 'INTERVALO_FIM');
              if (vi) summary.push(`volta do intervalo às ${formatBrasiliaTime(vi.dataHora, false)}h`);
              const s = dayRegistros.find((r) => r.tipoMarcacao === 'SAIDA');
              if (s) summary.push(`e por fim segunda saída às ${formatBrasiliaTime(s.dataHora, false)}h`);

              const workedInfo = calculateWorkedTime(dayRegistros);
              let text = summary.join(', ').replace(/, ([^,]*)$/, ' $1') + '.';
              if (workedInfo.hasPunches && workedInfo.formatted !== '-' && workedInfo.formatted !== 'Em curso') {
                text += ` Total trabalhado hoje: ${workedInfo.formatted}.`;
              }
              return text;
            })()}
          </p>
          {meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === hojeStr).length > 0 && (
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
              // Agrupar registros dos últimos 30 dias em Horário Oficial de Brasília
              const last30Days: string[] = [];
              const baseNow = getBrasiliaNow();
              for (let i = 0; i < 30; i++) {
                const d = new Date(baseNow.getTime() - i * 86_400_000);
                last30Days.push(getBrasiliaYmd(d));
              }

              const schedule = {
                ENTRADA: userColab?.horarioInicio || '08:00',
                INTERVALO_INICIO: '12:00',
                INTERVALO_FIM: '13:00',
                SAIDA: userColab?.horarioFim || '17:00',
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

              return last30Days
                .map((dateStr) => {
                  const dayRegistros = meusRegistros.filter((r) => getBrasiliaYmd(r.dataHora) === dateStr);
                  const isToday = dateStr === hojeStr;

                  const entrada = dayRegistros.find((r) => r.tipoMarcacao === 'ENTRADA');
                  const saidaAlmoco = dayRegistros.find((r) => r.tipoMarcacao === 'INTERVALO_INICIO');
                  const voltaAlmoco = dayRegistros.find((r) => r.tipoMarcacao === 'INTERVALO_FIM');
                  const saidaFinal = dayRegistros.find((r) => r.tipoMarcacao === 'SAIDA');

                  const fmtTime = (iso: string | undefined) =>
                    iso ? formatBrasiliaTime(iso, false) : '--:--';

                  const d = new Date(`${dateStr}T12:00:00-03:00`);
                  const dayLabel = isToday
                    ? 'Hoje'
                    : d.toLocaleDateString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      });
                  const weekDay = d.toLocaleDateString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    weekday: 'long',
                  });

                  if (dayRegistros.length === 0 && !isToday) return null;

                  return (
                    <tr
                      key={dateStr}
                      className={`hover:bg-slate-50/60 transition-colors ${isToday ? 'bg-emerald-50/10' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900">{dayLabel}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600 capitalize">{weekDay}</td>
                      <td
                        className={`py-2.5 px-3 ${checkColor(
                          entrada ? formatBrasiliaTime(entrada.dataHora, false) : undefined,
                          schedule.ENTRADA
                        )}`}
                      >
                        {fmtTime(entrada?.dataHora)}
                      </td>
                      <td
                        className={`py-2.5 px-3 ${checkColor(
                          saidaAlmoco ? formatBrasiliaTime(saidaAlmoco.dataHora, false) : undefined,
                          schedule.INTERVALO_INICIO
                        )}`}
                      >
                        {fmtTime(saidaAlmoco?.dataHora)}
                      </td>
                      <td
                        className={`py-2.5 px-3 ${checkColor(
                          voltaAlmoco ? formatBrasiliaTime(voltaAlmoco.dataHora, false) : undefined,
                          schedule.INTERVALO_FIM
                        )}`}
                      >
                        {fmtTime(voltaAlmoco?.dataHora)}
                      </td>
                      <td
                        className={`py-2.5 px-3 ${checkColor(
                          saidaFinal ? formatBrasiliaTime(saidaFinal.dataHora, false) : undefined,
                          schedule.SAIDA
                        )}`}
                      >
                        {fmtTime(saidaFinal?.dataHora)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {saidaAlmoco && voltaAlmoco
                          ? `${Math.round(
                              (new Date(voltaAlmoco.dataHora).getTime() -
                                new Date(saidaAlmoco.dataHora).getTime()) /
                                60000
                            )} min`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {calculateWorkedTime(dayRegistros).formatted}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            dayRegistros.length >= 4
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                              : 'text-amber-800 bg-amber-50 border-amber-200'
                          }`}
                        >
                          {dayRegistros.length >= 4 ? 'Jornada Completa' : `${dayRegistros.length} batidas`}
                        </span>
                      </td>
                    </tr>
                  );
                })
                .filter(Boolean);
            })()}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Validações Conforme Legislação:</strong> Intervalo intrajornada garantido de no mínimo{' '}
          {intervaloMinimo} minutos (CLT Art. 71) e limite de chegada antecipada configurado para{' '}
          {toleranciaAntecedencia} minutos em relação ao horário contratado ({horarioContratado}), resguardando o
          empregado e o empregador.
        </div>
      </div>

      {/* Apuração Real de Horas Noturnas Reduzidas & Reflexo DSR (CLT Art. 73 e Súmula 172 TST) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hora Noturna Reduzida (CLT Art. 73)
          </span>
          <div className="text-base font-bold font-mono text-emerald-400">
            {apuracaoNoturnaMes.noturnoFormatado}{' '}
            <span className="text-[10px] text-slate-400 font-normal">(computada a 52m30s)</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Período das 22h às 05h com fator oficial de 1.1428 e adicional de 20% apurado sobre suas batidas de{' '}
            {competenciaAtual}.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-emerald-600" /> Reflexo no DSR (Súmula 172 TST)
          </span>
          <div className="text-base font-bold font-mono text-slate-900">
            {apuracaoNoturnaMes.temSalarioBase
              ? `R$ ${apuracaoNoturnaMes.dsr.valorReflexoDSR.toFixed(2).replace('.', ',')}`
              : apuracaoNoturnaMes.extrasFormatado}{' '}
            <span className="text-[10px] text-emerald-600 font-semibold">
              ({apuracaoNoturnaMes.dsr.domingosEFeriadosMes} DSRs / {apuracaoNoturnaMes.dsr.diasUteisMes} dias úteis)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            {apuracaoNoturnaMes.totalMinExtras > 0
              ? `Excedente apurado em ${competenciaAtual}: ${apuracaoNoturnaMes.extrasFormatado}. Incidência legal sobre repouso semanal.`
              : `Sem horas extras excedentes apuradas nas batidas de ${competenciaAtual}.`}
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> Vigência do Banco de Horas
          </span>
          <div className="text-base font-bold font-mono text-slate-900">Acordo Semestral (6 meses)</div>
          <p className="text-[10px] text-slate-500 leading-tight">
            CLT Art. 59 § 2º e § 5º: compensação individual em até 6 meses (ou 12 meses via CCT) com teto legal de 2h
            extras/dia.
          </p>
        </div>
      </div>
    </div>
  );
};

