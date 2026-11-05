import {
  Tenant,
  Colaborador,
  RegistroPontoREPP
} from '../types/operational';

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
  const cnpjClean = tenant.cnpj.replace(/\D/g, '').padStart(14, '0');
  const razaoPadded = tenant.razaoSocial.padEnd(150, ' ').slice(0, 150);
  const now = new Date();
  const dataInicio = '01112026';
  const dataFim = '02112026';
  const dataGeracao = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  // Linha 000000000: Registro de Cabeçalho do Empregador
  let afd = `00000000011${cnpjClean}${razaoPadded}00000000000000000${dataInicio}${dataFim}${dataGeracao}\r\n`;

  // Linhas de detalhe (Registro tipo 3 - Marcação de Ponto)
  registros.forEach((r) => {
    const nsrStr = String(r.nsr).padStart(9, '0');
    const cpfClean = r.colaboradorCpf.replace(/\D/g, '').padStart(11, '0');
    const d = new Date(r.dataHora);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = String(d.getFullYear());
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const dataHoraStr = `${dia}${mes}${ano}${hora}${min}`;
    const fusoClean = (r.fusoHorario || '-03:00').replace(':', '');
    const hashClean = (r.hashSha256 || '').slice(0, 64);

    // Formato Portaria 671 Tipo 3
    afd += `${nsrStr}3${dataHoraStr}${fusoClean}${cpfClean}${hashClean}\r\n`;
  });

  // Linha de Trailer
  const totalRegistros = registros.length;
  const nsrTrailer = String(totalRegistros + 1).padStart(9, '0');
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
  const cnpjClean = tenant.cnpj.replace(/\D/g, '').padStart(14, '0');
  const now = new Date();
  const dataGeracao = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  // Registro 1: Cabeçalho do Empregador (Tipo 1, Versão 001, Sistema REP-P tipo 3)
  let aej = `1|001|3|${cnpjClean}|${tenant.razaoSocial.trim()}|2026-10-01|2026-11-30|${dataGeracao}\r\n`;

  // Registro 2: Cadastro de Trabalhadores (Tipo 2)
  colaboradores.forEach((c) => {
    const cpfClean = c.cpf.replace(/\D/g, '');
    aej += `2|${cpfClean}|${c.pis || '123.45678.90-1'}|${c.nome}|${c.matricula}|${c.cargoTitulo}|${c.dataAdmissao}\r\n`;
  });

  // Registro 3: Registros de Marcação (Tipo 3)
  registros.forEach((r) => {
    const cpfClean = r.colaboradorCpf.replace(/\D/g, '');
    const d = new Date(r.dataHora);
    const dataFmt = d.toISOString().slice(0, 10);
    const horaFmt = d.toTimeString().slice(0, 8);
    const gpsInfo = r.latitude && r.longitude ? `${r.latitude.toFixed(6)},${r.longitude.toFixed(6)}` : 'REPP_FACIAL_LOCAL';
    aej += `3|${String(r.nsr).padStart(9, '0')}|${cpfClean}|${dataFmt}|${horaFmt}|${r.tipoMarcacao}|${r.coletorId}|${gpsInfo}|${r.hashSha256}\r\n`;
  });

  // Registro 9: Trailer (Totalização)
  const totalLinhas = 1 + colaboradores.length + registros.length + 1;
  aej += `9|${totalLinhas}|${colaboradores.length}|${registros.length}\r\n`;

  return aej;
}
