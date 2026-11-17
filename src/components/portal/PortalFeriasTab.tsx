import React from 'react';
import { Colaborador } from '../../types/operational';
import { getBrasiliaYmd } from '../../utils/brasiliaClock';
import { Plane } from 'lucide-react';

interface PortalFeriasTabProps {
  userColab?: Colaborador;
  minhasFeriasAgendadas: any[];
}

export const PortalFeriasTab: React.FC<PortalFeriasTabProps> = ({
  userColab,
  minhasFeriasAgendadas
}) => {
  const hojeYmd = getBrasiliaYmd();
  const [hY, hM, hD] = hojeYmd.split('-').map(Number);
  const hoje = new Date(Date.UTC(hY, hM - 1, hD, 12, 0, 0));

  const rawAdm = userColab?.dataAdmissao || '';
  const admValida = /^\d{4}-\d{2}-\d{2}$/.test(rawAdm.slice(0, 10));
  const [anoAdm, mesAdm, diaAdm] = (admValida ? rawAdm.slice(0, 10) : hojeYmd).split('-').map(Number);
  const admDate = new Date(Date.UTC(anoAdm, mesAdm - 1, diaAdm, 12, 0, 0));

  let aquisitivoInicio = new Date(admDate.getTime());
  let aquisitivoFim = new Date(aquisitivoInicio.getTime());
  aquisitivoFim.setUTCFullYear(aquisitivoFim.getUTCFullYear() + 1);
  aquisitivoFim.setUTCDate(aquisitivoFim.getUTCDate() - 1);

  while (hoje > aquisitivoFim) {
    aquisitivoInicio = new Date(aquisitivoFim.getTime());
    aquisitivoInicio.setUTCDate(aquisitivoInicio.getUTCDate() + 1);
    aquisitivoFim = new Date(aquisitivoInicio.getTime());
    aquisitivoFim.setUTCFullYear(aquisitivoFim.getUTCFullYear() + 1);
    aquisitivoFim.setUTCDate(aquisitivoFim.getUTCDate() - 1);
  }

  const concessivoInicio = new Date(aquisitivoFim.getTime());
  concessivoInicio.setUTCDate(concessivoInicio.getUTCDate() + 1);
  const concessivoFim = new Date(concessivoInicio.getTime());
  concessivoFim.setUTCFullYear(concessivoFim.getUTCFullYear() + 1);
  concessivoFim.setUTCDate(concessivoFim.getUTCDate() - 1);

  const formatarData = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  const formatarDataStr = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoStr;
  };

  const vencido = admValida ? hoje > concessivoFim : false;
  const dataGozoApartirDe = admValida ? formatarData(concessivoInicio) : 'Aguardando cadastro da admissão';
  const temAgendamento = minhasFeriasAgendadas.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Minhas Férias & Períodos Aquisitivos (CLT)
          </h3>
          <p className="text-xs text-slate-500">
            Consulta de direito a férias regulamentares, período aquisitivo, concessivo e agendamentos confirmados pelo RH.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
          Direito CLT: 30 Dias / Ano
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Data de Admissão</span>
            <span className="text-base font-bold text-slate-900">
              {admValida ? formatarData(admDate) : 'Não informada'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {admValida ? 'Vínculo CLT Ativo' : 'Solicite atualização cadastral ao RH'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Período Aquisitivo Atual</span>
            <span className="text-sm font-bold font-mono text-slate-900">
              {admValida ? `${formatarData(aquisitivoInicio)} a ${formatarData(aquisitivoFim)}` : 'Aguardando data de admissão'}
            </span>
            <span className="text-[10px] text-slate-500 block">12 meses de trabalho (CLT Art. 130)</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Período de Gozo</span>
            <span className={`text-sm font-bold font-mono ${temAgendamento ? 'text-emerald-700' : (vencido ? 'text-rose-600' : 'text-slate-800')}`}>
              {temAgendamento 
                ? `${formatarDataStr(minhasFeriasAgendadas[0].dataInicioFerias)} a ${formatarDataStr(minhasFeriasAgendadas[0].dataFimFerias)}` 
                : (admValida ? `A partir de ${dataGozoApartirDe}` : dataGozoApartirDe)}
            </span>
            <span className={`text-[10px] font-bold block ${temAgendamento ? 'text-emerald-600' : (vencido ? 'text-rose-600' : 'text-slate-500')}`}>
              {temAgendamento 
                ? 'Programado pelo RH' 
                : (!admValida ? 'Sem previsão calculada' : vencido ? 'Férias Vencidas (Art. 137 CLT)' : `Limite concessivo: ${formatarData(concessivoFim)}`)}
            </span>
          </div>
        </div>

        {/* Exibição condicional: se houver agendamento real ou se ainda não foi agendado pelo RH */}
        {temAgendamento ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-600" />
                Férias Agendadas e Homologadas pelo RH
              </h4>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                {minhasFeriasAgendadas[0].status || 'PROGRAMADO'}
              </span>
            </div>
            <div className="space-y-2">
              {minhasFeriasAgendadas.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-white border border-emerald-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      Período de Gozo ({f.diasGozo} dias{f.diasAbonoPecuniario > 0 ? ` + ${f.diasAbonoPecuniario} dias abono pecuniário` : ''})
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Início: {formatarDataStr(f.dataInicioFerias)} até {formatarDataStr(f.dataFimFerias)}
                    </div>
                    {f.observacao && (
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        Obs: {f.observacao}
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold self-start sm:self-auto">
                    Aprovado pelo RH
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                  <Plane className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Programação de Férias Regulamentares (CLT)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Aguardando realização do agendamento oficial pelo RH
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[10px] uppercase self-start sm:self-auto">
                Não Agendada
              </span>
            </div>

            {/* Destaque principal solicitado pelo colaborador */}
            <div className="p-4 bg-white border border-amber-200/90 rounded-xl shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Previsão de Elegibilidade para Gozo:
              </div>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                <span>Período de gozo a partir de:</span>
                <span className="text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-sm sm:text-base">
                  {dataGozoApartirDe}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Conforme os <strong>Arts. 134 e 135 da CLT</strong>, a definição e confirmação das datas de férias cabem ao empregador (RH). Nenhuma data foi agendada previamente; a programação será realizada pelo RH no momento oportuno.
              </p>
            </div>

            {/* Informações legais do período aquisitivo e concessivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="p-3 bg-white/80 rounded-lg border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-0.5">🗓️ Período Concessivo (Art. 134 CLT)</span>
                <span>As férias poderão ser usufruídas entre <strong>{dataGozoApartirDe}</strong> e <strong>{formatarData(concessivoFim)}</strong> após 12 meses de vigência do contrato.</span>
              </div>
              <div className="p-3 bg-white/80 rounded-lg border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-0.5">💰 Abono Pecuniário (Art. 143 CLT)</span>
                <span>É facultado ao colaborador converter 1/3 do período (10 dias) em abono financeiro mediante solicitação ao RH até 15 dias antes do fim do aquisitivo.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
