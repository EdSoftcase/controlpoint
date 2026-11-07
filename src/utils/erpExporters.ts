// Gerador e Exportador de Arquivos para Softwares de Folha de Pagamento (ERPs)
// Formatos: TOTVS Protheus, Senior Vetorh, Domínio Sistemas e Alterdata

import { Colaborador, RegistroPontoREPP } from '../types/operational';
import { SistemaERPAlvo } from '../types/rhAvancado';

export interface ParametrosGeracaoERP {
  sistema: SistemaERPAlvo;
  mesAnoCompetencia: string; // YYYY-MM
  empresaCnpj: string;
  codigoFilial: string;
  colaboradores: Colaborador[];
  registros: RegistroPontoREPP[];
}

/**
 * Converte data ISO em formato DDMMAAAA ou AAAAMMDD
 */
function formatarData(dataIso: string, formato: 'DDMMAAAA' | 'AAAAMMDD' | 'DD/MM/AAAA'): string {
  const d = new Date(dataIso);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  if (formato === 'DDMMAAAA') return `${dia}${mes}${ano}`;
  if (formato === 'AAAAMMDD') return `${ano}${mes}${dia}`;
  return `${dia}/${mes}/${ano}`;
}

/**
 * Converte data ISO em HHMM ou HH:MM
 */
function formatarHora(dataIso: string, formato: 'HHMM' | 'HH:MM'): string {
  const d = new Date(dataIso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (formato === 'HHMM') return `${hh}${mm}`;
  return `${hh}:${mm}`;
}

/**
 * Gera arquivo posicional para TOTVS Protheus (Layout padrão de importação de batidas)
 * Estrutura clássica de arquivo TXT:
 * Filial (2) + Matrícula (6) + Data (8 - DDMMAAAA) + Hora (4 - HHMM) + Tipo (1) + Relógio (3)
 */
export function exportarLayoutTOTVSProtheus(params: ParametrosGeracaoERP): string {
  const { codigoFilial, colaboradores, registros, mesAnoCompetencia } = params;
  const filial = (codigoFilial || '01').slice(0, 2).padEnd(2, '0');
  const linhas: string[] = [];

  // Cabeçalho de lote TOTVS
  linhas.push(`00${filial}${mesAnoCompetencia.replace('-', '')}SOFTCASE_PONTO_REPP_PROTHEUS_V12`);

  // Filtra registros do mês de competência
  const registrosCompetencia = registros.filter(r => r.dataHora.startsWith(mesAnoCompetencia));

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(c => c.id === reg.colaboradorId || c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''));
    const matriculaRaw = colab?.matricula || reg.colaboradorMatricula || '000001';
    const matricula = matriculaRaw.replace(/\D/g, '').slice(0, 6).padStart(6, '0');
    
    const dataStr = formatarData(reg.dataHora, 'DDMMAAAA');
    const horaStr = formatarHora(reg.dataHora, 'HHMM');
    
    // Mapeamento de tipo de marcação TOTVS (1=Entrada, 2=Saída intervalo, 3=Volta intervalo, 4=Saída dia)
    let tipoNum = '1';
    if (reg.tipoMarcacao === 'INTERVALO_INICIO') tipoNum = '2';
    else if (reg.tipoMarcacao === 'INTERVALO_FIM') tipoNum = '3';
    else if (reg.tipoMarcacao === 'SAIDA') tipoNum = '4';

    const numRelogio = '001'; // REP-P

    // Registro Tipo 10 - Batida de Ponto
    linhas.push(`10${filial}${matricula}${dataStr}${horaStr}${tipoNum}${numRelogio}`);
  }

  // Traço final de arquivo TOTVS
  linhas.push(`99${String(linhas.length - 1).padStart(6, '0')}`);

  return linhas.join('\r\n');
}

/**
 * Gera arquivo para Senior Sistemas (Vetorh / Ronda Ponto)
 * Layout: Data (DD/MM/AAAA) + Hora (HH:MM) + Matrícula (10) + Código Evento (04)
 */
export function exportarLayoutSeniorVetorh(params: ParametrosGeracaoERP): string {
  const { colaboradores, registros, mesAnoCompetencia } = params;
  const linhas: string[] = [];

  const registrosCompetencia = registros.filter(r => r.dataHora.startsWith(mesAnoCompetencia));

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(c => c.id === reg.colaboradorId || c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''));
    const matriculaRaw = colab?.matricula || reg.colaboradorMatricula || '1';
    const matricula = matriculaRaw.replace(/\D/g, '').slice(0, 10).padStart(10, '0');

    const dataStr = formatarData(reg.dataHora, 'DD/MM/AAAA');
    const horaStr = formatarHora(reg.dataHora, 'HH:MM');
    const relogioCod = '001';

    linhas.push(`${dataStr};${horaStr};${matricula};${relogioCod};${reg.tipoMarcacao}`);
  }

  return linhas.join('\r\n');
}

/**
 * Gera arquivo para Domínio Sistemas (Thomson Reuters)
 * Layout de Cartão Ponto: Código Empregado (7) + Data (DD/MM/AAAA) + Entrada 1 + Saída 1 + Entrada 2 + Saída 2
 */
export function exportarLayoutDominioSistemas(params: ParametrosGeracaoERP): string {
  const { colaboradores, registros, mesAnoCompetencia } = params;
  const linhas: string[] = [];

  // Agrupa batidas por colaborador e por data
  const mapaPorColabData = new Map<string, RegistroPontoREPP[]>();

  const registrosCompetencia = registros.filter(r => r.dataHora.startsWith(mesAnoCompetencia));

  for (const reg of registrosCompetencia) {
    const colab = colaboradores.find(c => c.id === reg.colaboradorId || c.cpf.replace(/\D/g, '') === reg.colaboradorCpf.replace(/\D/g, ''));
    const matricula = colab?.matricula || reg.colaboradorMatricula || '1';
    const dataYmd = reg.dataHora.slice(0, 10);
    const chave = `${matricula}__${dataYmd}`;

    if (!mapaPorColabData.has(chave)) {
      mapaPorColabData.set(chave, []);
    }
    mapaPorColabData.get(chave)!.push(reg);
  }

  // Ordena por horário e monta linha consolidada do dia
  mapaPorColabData.forEach((regs, chave) => {
    const [matriculaRaw, dataYmd] = chave.split('__');
    const codEmpregado = matriculaRaw.replace(/\D/g, '').slice(0, 7).padStart(7, ' ');
    const [ano, mes, dia] = dataYmd.split('-');
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
