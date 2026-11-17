// Gerador e Exportador de Arquivos para Softwares de Folha de Pagamento (ERPs)
// Formatos: TOTVS Protheus, Senior Vetorh, Domínio Sistemas e Alterdata

import { Colaborador, RegistroPontoREPP } from '../types/operational';
import { SistemaERPAlvo } from '../types/rhAvancado';
import { getBrasiliaParts } from './brasiliaClock';

export interface ParametrosGeracaoERP {
  sistema: SistemaERPAlvo;
  mesAnoCompetencia: string; // YYYY-MM
  empresaCnpj: string;
  codigoFilial: string;
  colaboradores: Colaborador[];
  registros: RegistroPontoREPP[];
}

function formatarData(dataIso: string, formato: 'DDMMAAAA' | 'AAAAMMDD' | 'DD/MM/AAAA'): string {
  const p = getBrasiliaParts(dataIso);
  const dia = String(p.day).padStart(2, '0');
  const mes = String(p.month).padStart(2, '0');
  const ano = p.year;

  if (formato === 'DDMMAAAA') return `${dia}${mes}${ano}`;
  if (formato === 'AAAAMMDD') return `${ano}${mes}${dia}`;
  return p.ddmmyyyy;
}

function formatarHora(dataIso: string, formato: 'HHMM' | 'HH:MM'): string {
  const p = getBrasiliaParts(dataIso);
  if (formato === 'HHMM') return p.hhmm.replace(':', '');
  return p.hhmm;
}

function formatarMatriculaPosicional(raw: string, length: number, padChar: string = '0'): string {
  const cleanAlnum = (raw || '').replace(/[^a-zA-Z0-9]/g, '');
  const digitsOnly = (raw || '').replace(/\D/g, '');
  const base = digitsOnly.length > 0 ? digitsOnly : (cleanAlnum || '1');
  return base.slice(-length).padStart(length, padChar);
}

/**
 * Gera arquivo posicional para TOTVS Protheus (Layout padrão de importação de batidas)
 */
export function exportarLayoutTOTVSProtheus(params: ParametrosGeracaoERP): string {
  const { codigoFilial, colaboradores, registros, mesAnoCompetencia } = params;
  const filial = (codigoFilial || '01').slice(0, 2).padEnd(2, '0');
  const linhas: string[] = [];

  linhas.push(`00${filial}${mesAnoCompetencia.replace('-', '')}SOFTCASE_PONTO_REPP_PROTHEUS_V12`);

  const registrosCompetencia = registros.filter(
    (r) => getBrasiliaParts(r.dataHora).mesAno === mesAnoCompetencia
  );

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(
      (c) =>
        c.id === reg.colaboradorId ||
        (c.cpf && reg.colaboradorCpf && c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''))
    );
    const matriculaRaw = colab?.matricula || reg.colaboradorMatricula || '000001';
    const matricula = formatarMatriculaPosicional(matriculaRaw, 6, '0');

    const dataStr = formatarData(reg.dataHora, 'DDMMAAAA');
    const horaStr = formatarHora(reg.dataHora, 'HHMM');

    let tipoNum = '1';
    if (reg.tipoMarcacao === 'INTERVALO_INICIO') tipoNum = '2';
    else if (reg.tipoMarcacao === 'INTERVALO_FIM') tipoNum = '3';
    else if (reg.tipoMarcacao === 'SAIDA') tipoNum = '4';

    const numRelogio = '001';
    linhas.push(`10${filial}${matricula}${dataStr}${horaStr}${tipoNum}${numRelogio}`);
  }

  linhas.push(`99${String(linhas.length - 1).padStart(6, '0')}`);
  return linhas.join('\r\n');
}

/**
 * Gera arquivo para Senior Sistemas (Vetorh / Ronda Ponto)
 */
export function exportarLayoutSeniorVetorh(params: ParametrosGeracaoERP): string {
  const { colaboradores, registros, mesAnoCompetencia } = params;
  const linhas: string[] = [];

  const registrosCompetencia = registros.filter(
    (r) => getBrasiliaParts(r.dataHora).mesAno === mesAnoCompetencia
  );

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(
      (c) =>
        c.id === reg.colaboradorId ||
        (c.cpf && reg.colaboradorCpf && c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''))
    );
    const matriculaRaw = colab?.matricula || reg.colaboradorMatricula || '1';
    const matricula = formatarMatriculaPosicional(matriculaRaw, 10, '0');

    const dataStr = formatarData(reg.dataHora, 'DD/MM/AAAA');
    const horaStr = formatarHora(reg.dataHora, 'HH:MM');
    const relogioCod = '001';

    linhas.push(`${dataStr};${horaStr};${matricula};${relogioCod};${reg.tipoMarcacao}`);
  }

  return linhas.join('\r\n');
}

/**
 * Gera arquivo para Domínio Sistemas (Thomson Reuters)
 */
export function exportarLayoutDominioSistemas(params: ParametrosGeracaoERP): string {
  const { colaboradores, registros, mesAnoCompetencia } = params;
  const linhas: string[] = [];

  const mapaPorColabData = new Map<string, { matricula: string; ymd: string; regs: RegistroPontoREPP[] }>();

  const registrosCompetencia = registros.filter(
    (r) => getBrasiliaParts(r.dataHora).mesAno === mesAnoCompetencia
  );

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(
      (c) =>
        c.id === reg.colaboradorId ||
        (c.cpf && reg.colaboradorCpf && c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''))
    );
    const matricula = colab?.matricula || reg.colaboradorMatricula || reg.colaboradorId || '1';
    const dataYmd = getBrasiliaParts(reg.dataHora).ymd;
    const chave = `${colab?.id || reg.colaboradorId || matricula}__${dataYmd}`;

    if (!mapaPorColabData.has(chave)) {
      mapaPorColabData.set(chave, { matricula, ymd: dataYmd, regs: [] });
    }
    mapaPorColabData.get(chave)!.regs.push(reg);
  }

  mapaPorColabData.forEach(({ matricula, ymd, regs }) => {
    const codEmpregado = formatarMatriculaPosicional(matricula, 7, ' ');
    const [ano, mes, dia] = ymd.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    regs.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

    const e1 = regs[0] ? formatarHora(regs[0].dataHora, 'HH:MM') : '     ';
    const s1 = regs[1] ? formatarHora(regs[1].dataHora, 'HH:MM') : '     ';
    const e2 = regs[2] ? formatarHora(regs[2].dataHora, 'HH:MM') : '     ';
    const s2 = regs[3] ? formatarHora(regs[3].dataHora, 'HH:MM') : '     ';

    linhas.push(`${codEmpregado} ${dataFormatada} ${e1} ${s1} ${e2} ${s2}`);
  });

  return linhas.join('\r\n');
}

/**
 * Dispara o download de um conteúdo textual no navegador
 */
export function dispararDownloadTexto(nomeArquivo: string, conteudo: string, mime: string = 'text/plain') {
  const blob = new Blob([conteudo], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
