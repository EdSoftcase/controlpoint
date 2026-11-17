import {
  Tenant,
  Colaborador,
  RegistroPontoREPP
} from '../types/operational';
import { getBrasiliaParts } from '../utils/brasiliaClock';

export const INITIAL_TENANTS: any[] = [];
export const INITIAL_ESTABELECIMENTOS: any[] = [];
export const INITIAL_FERIADOS: any[] = [];
export const INITIAL_COLETORES: any[] = [];
export const INITIAL_CARGOS: any[] = [];
export const INITIAL_DEPARTAMENTOS: any[] = [];
export const INITIAL_COLABORADORES: any[] = [];
export const INITIAL_HORAS_EXTRAS: any[] = [];
export const INITIAL_REGISTROS: any[] = [];
export const INITIAL_AUDIT_LOGS: any[] = [];
export const INITIAL_SOLICITACOES_AJUSTE: any[] = [];
export const INITIAL_ASSINATURAS_ESPELHO: any[] = [];
export const INITIAL_OCORRENCIAS_DESCONTO: any[] = [];

/**
 * Geração oficial do AFD (Arquivo Fonte de Dados) conforme Portaria MTP 671/2021 Anexo V
 */
export function generateAFDContent(tenant: Tenant, registros: RegistroPontoREPP[]): string {
  const cnpjClean = (tenant.cnpj || '').replace(/\D/g, '').padStart(14, '0');
  const razaoPadded = (tenant.razaoSocial || '').padEnd(150, ' ').slice(0, 150);
  const nowParts = getBrasiliaParts();
  const dataGeracao = `${nowParts.ddmmyyyy.replace(/\//g, '')}${nowParts.hhmm.replace(':', '')}`;

  const sortedRegistros = [...registros].sort((a, b) => {
    const nsrDiff = (Number(a.nsr) || 0) - (Number(b.nsr) || 0);
    if (nsrDiff !== 0) return nsrDiff;
    return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
  });

  let dataInicio = nowParts.ddmmyyyy.replace(/\//g, '');
  let dataFim = nowParts.ddmmyyyy.replace(/\//g, '');
  if (sortedRegistros.length > 0) {
    const timestamps = sortedRegistros
      .map((r) => new Date(r.dataHora).getTime())
      .filter((t) => !Number.isNaN(t));
    if (timestamps.length > 0) {
      const minParts = getBrasiliaParts(Math.min(...timestamps));
      const maxParts = getBrasiliaParts(Math.max(...timestamps));
      dataInicio = minParts.ddmmyyyy.replace(/\//g, '');
      dataFim = maxParts.ddmmyyyy.replace(/\//g, '');
    }
  }

  // Linha 000000000: Registro de Cabeçalho do Empregador
  let afd = `00000000011${cnpjClean}${razaoPadded}00000000000000000${dataInicio}${dataFim}${dataGeracao}\r\n`;

  let lastNsr = 0;
  // Linhas de detalhe (Registro tipo 3 - Marcação de Ponto)
  sortedRegistros.forEach((r) => {
    const nsrVal = Number(r.nsr) || 0;
    if (nsrVal > lastNsr) lastNsr = nsrVal;
    const nsrStr = String(nsrVal).padStart(9, '0');
    const cpfClean = (r.colaboradorCpf || '').replace(/\D/g, '').padStart(11, '0');
    const p = getBrasiliaParts(r.dataHora);
    const dataHoraStr = `${p.ddmmyyyy.replace(/\//g, '')}${p.hhmm.replace(':', '')}`;
    const fusoClean = (r.fusoHorario || '-03:00').replace(':', '');
    const hashClean = (r.hashSha256 || '').slice(0, 64);

    // Formato Portaria 671 Tipo 3
    afd += `${nsrStr}3${dataHoraStr}${fusoClean}${cpfClean}${hashClean}\r\n`;
  });

  // Linha de Trailer
  const totalRegistros = sortedRegistros.length;
  const nsrTrailer = String((lastNsr > 0 ? lastNsr : totalRegistros) + 1).padStart(9, '0');
  afd += `${nsrTrailer}9${String(totalRegistros).padStart(9, '0')}\r\n`;

  return afd;
}

/**
 * Geração oficial do AEJ (Arquivo Eletrônico de Jornada) conforme Portaria MTP 671/2021 Anexo VI
 */
export function generateAEJContent(
  tenant: Tenant,
  colaboradores: Colaborador[],
  registros: RegistroPontoREPP[]
): string {
  const cnpjClean = (tenant.cnpj || '').replace(/\D/g, '').padStart(14, '0');
  const nowParts = getBrasiliaParts();
  const dataGeracao = `${nowParts.ddmmyyyy.replace(/\//g, '')}${nowParts.hhmm.replace(':', '')}`;

  const sortedRegistros = [...registros].sort((a, b) => {
    const nsrDiff = (Number(a.nsr) || 0) - (Number(b.nsr) || 0);
    if (nsrDiff !== 0) return nsrDiff;
    return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
  });

  let periodoInicioYmd = nowParts.ymd;
  let periodoFimYmd = nowParts.ymd;
  if (sortedRegistros.length > 0) {
    const timestamps = sortedRegistros
      .map((r) => new Date(r.dataHora).getTime())
      .filter((t) => !Number.isNaN(t));
    if (timestamps.length > 0) {
      periodoInicioYmd = getBrasiliaParts(Math.min(...timestamps)).ymd;
      periodoFimYmd = getBrasiliaParts(Math.max(...timestamps)).ymd;
    }
  }

  // Registro 1: Cabeçalho do Empregador (Tipo 1, Versão 001, Sistema REP-P tipo 3)
  let aej = `1|001|3|${cnpjClean}|${(tenant.razaoSocial || '').trim()}|${periodoInicioYmd}|${periodoFimYmd}|${dataGeracao}\r\n`;

  // Registro 2: Cadastro de Trabalhadores (Tipo 2)
  colaboradores.forEach((c) => {
    const cpfClean = (c.cpf || '').replace(/\D/g, '');
    aej += `2|${cpfClean}|${c.pis || ''}|${c.nome}|${c.matricula}|${c.cargoTitulo}|${c.dataAdmissao}\r\n`;
  });

  // Registro 3: Registros de Marcação (Tipo 3)
  sortedRegistros.forEach((r) => {
    const cpfClean = (r.colaboradorCpf || '').replace(/\D/g, '');
    const p = getBrasiliaParts(r.dataHora);
    const dataFmt = p.ymd;
    const horaFmt = p.hhmmss;
    const gpsInfo = r.latitude && r.longitude ? `${r.latitude.toFixed(6)},${r.longitude.toFixed(6)}` : 'REPP_FACIAL_LOCAL';
    aej += `3|${String(r.nsr).padStart(9, '0')}|${cpfClean}|${dataFmt}|${horaFmt}|${r.tipoMarcacao}|${r.coletorId}|${gpsInfo}|${r.hashSha256}\r\n`;
  });

  // Registro 9: Trailer (Totalização)
  const totalLinhas = 1 + colaboradores.length + sortedRegistros.length + 1;
  aej += `9|${totalLinhas}|${colaboradores.length}|${sortedRegistros.length}\r\n`;

  return aej;
}
