import React, { useState } from 'react';
import { Tenant, Colaborador, RegistroPontoREPP } from '../types/operational';
import { SistemaERPAlvo } from '../types/rhAvancado';
import {
  exportarLayoutTOTVSProtheus,
  exportarLayoutSeniorVetorh,
  exportarLayoutDominioSistemas,
  dispararDownloadTexto
} from '../utils/erpExporters';
import {
  generateAFDContent,
  generateAEJContent
} from '../data/operationalStore';
import {
  Download,
  FileText,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  Eye,
  Sparkles,
  Server,
  Layers,
  Settings
} from 'lucide-react';

interface ExportadorFolhaERPProps {
  tenant: Tenant;
  colaboradores: Colaborador[];
  registros: RegistroPontoREPP[];
}

export function ExportadorFolhaERP({ tenant, colaboradores, registros }: ExportadorFolhaERPProps) {
  const [sistemaSelecionado, setSistemaSelecionado] = useState<SistemaERPAlvo>('TOTVS_PROTHEUS');
  const [competencia, setCompetencia] = useState<string>('2026-11');
  const [codigoFilial, setCodigoFilial] = useState<string>('01');
  const [previewConteudo, setPreviewConteudo] = useState<string>('');
  const [previewTipo, setPreviewTipo] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);
  const [feedbackDownload, setFeedbackDownload] = useState<string | null>(null);

  const totalRegistrosCompetencia = registros.filter(r => r.dataHora.startsWith(competencia)).length;

  const handleGerarExportacaoERP = (sistema: SistemaERPAlvo) => {
    let conteudo = '';
    let extensao = 'txt';
    let nomeArquivo = '';

    const params = {
      sistema,
      mesAnoCompetencia: competencia,
      empresaCnpj: tenant.cnpj,
      codigoFilial,
      colaboradores,
      registros
    };

    if (sistema === 'TOTVS_PROTHEUS') {
      conteudo = exportarLayoutTOTVSProtheus(params);
      nomeArquivo = `PONTO_TOTVS_PROTHEUS_${competencia.replace('-', '')}.txt`;
    } else if (sistema === 'SENIOR_VETORH') {
      conteudo = exportarLayoutSeniorVetorh(params);
      nomeArquivo = `PONTO_SENIOR_VETORH_${competencia.replace('-', '')}.txt`;
    } else if (sistema === 'DOMINIO_SISTEMAS') {
      conteudo = exportarLayoutDominioSistemas(params);
      nomeArquivo = `PONTO_DOMINIO_SISTEMAS_${competencia.replace('-', '')}.txt`;
    } else {
      conteudo = exportarLayoutTOTVSProtheus(params);
      nomeArquivo = `PONTO_ALTERDATA_${competencia.replace('-', '')}.txt`;
    }

    setPreviewConteudo(conteudo);
    setPreviewTipo(`Layout ${sistema} (${conteudo.split('\r\n').length} linhas)`);
    dispararDownloadTexto(nomeArquivo, conteudo, 'text/plain');

    setFeedbackDownload(`Arquivo ${nomeArquivo} gerado e baixado com sucesso!`);
    setTimeout(() => setFeedbackDownload(null), 4000);
  };

  const handleGerarAFD = () => {
    const afdContent = generateAFDContent(tenant, registros);
    const nome = `AFD_PORTARIA671_${tenant.cnpj.replace(/\D/g, '')}_${competencia.replace('-', '')}.txt`;
    setPreviewConteudo(afdContent);
    setPreviewTipo(`AFD Fiscal Portaria 671/2021 (${registros.length} marcações)`);
    dispararDownloadTexto(nome, afdContent, 'text/plain');
    setFeedbackDownload(`Arquivo fiscal AFD baixado com sucesso!`);
    setTimeout(() => setFeedbackDownload(null), 4000);
  };

  const handleGerarAEJ = () => {
    const aejContent = generateAEJContent(tenant, colaboradores, registros);
    const nome = `AEJ_PORTARIA671_${tenant.cnpj.replace(/\D/g, '')}_${competencia.replace('-', '')}.txt`;
    setPreviewConteudo(aejContent);
    setPreviewTipo(`AEJ Fiscal Portaria 671/2021 (${colaboradores.length} colaboradores, ${registros.length} batidas)`);
    dispararDownloadTexto(nome, aejContent, 'text/plain');
    setFeedbackDownload(`Arquivo fiscal AEJ baixado com sucesso!`);
    setTimeout(() => setFeedbackDownload(null), 4000);
  };

  const handleCopiarPreview = () => {
    if (!previewConteudo) return;
    navigator.clipboard.writeText(previewConteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-900/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Server className="w-4 h-4" />
            Central de Integração & Folha de Pagamento
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Exportação para ERPs & Arquivos Fiscais 671</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Exporte as batidas de ponto nos formatos posicionais exatos dos principais ERPs de RH do Brasil (TOTVS, Senior, Domínio) ou emita os arquivos fiscais oficiais AFD e AEJ auditados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-300 text-xs font-mono">
            {totalRegistrosCompetencia} marcações na competência
          </div>
        </div>
      </div>

      {feedbackDownload && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackDownload}</span>
        </div>
      )}

      {/* Grid: Controles de Exportação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel 1: Exportadores ERP de Folha */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
            <Layers className="w-4 h-4 text-sky-400" />
            1. Layouts de Folha (ERPs)
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Mês de Competência</label>
              <input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Código da Filial no ERP</label>
              <input
                type="text"
                value={codigoFilial}
                onChange={(e) => setCodigoFilial(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-sky-500 font-mono"
                placeholder="Ex: 01"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleGerarExportacaoERP('TOTVS_PROTHEUS')}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-sky-600/20 border border-slate-700 hover:border-sky-500 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-300">TOTVS Protheus</div>
                <div className="text-[11px] text-slate-400">Layout PONM010 posicional fixo (.txt)</div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
            </button>

            <button
              onClick={() => handleGerarExportacaoERP('SENIOR_VETORH')}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-sky-600/20 border border-slate-700 hover:border-sky-500 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-300">Senior Sistemas (Vetorh)</div>
                <div className="text-[11px] text-slate-400">Layout Ronda Ponto com ponto-e-vírgula</div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
            </button>

            <button
              onClick={() => handleGerarExportacaoERP('DOMINIO_SISTEMAS')}
              className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-sky-600/20 border border-slate-700 hover:border-sky-500 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-300">Domínio Sistemas</div>
                <div className="text-[11px] text-slate-400">Layout Cartão de Ponto com 4 batidas/dia</div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-sky-400" />
            </button>
          </div>
        </div>

        {/* Painel 2: Arquivos Oficiais Portaria 671 (MTE / Fiscal) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            2. Arquivos Fiscais Portaria 671/2021
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Arquivos exigidos em auditorias do Ministério do Trabalho e Emprego (MTE). Gerados pelo REP-P com hashes SHA-256 e numeração sequencial de registro (NSR) imutável.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  AFD (Arquivo Fonte de Dados)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  Anexo V
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contém todas as marcações originais brutas, NSR, CPF e o hash criptográfico SHA-256 de cada batida.
              </p>
              <button
                onClick={handleGerarAFD}
                className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo AFD (.txt)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" />
                  AEJ (Arquivo Eletrônico de Jornada)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                  Anexo VI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Arquivo com os dados do empregador, cadastro de colaboradores e as marcações tratadas com geolocalização.
              </p>
              <button
                onClick={handleGerarAEJ}
                className="w-full mt-2 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo AEJ (.txt)
              </button>
            </div>
          </div>
        </div>

        {/* Painel 3: Pré-visualizador Posicional em Tempo Real */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-indigo-400" />
                Prévia do Arquivo Gerado
              </div>
              {previewConteudo && (
                <button
                  onClick={handleCopiarPreview}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                </button>
              )}
            </div>

            {previewTipo && (
              <div className="text-[11px] font-mono text-indigo-400 mt-2">
                {previewTipo}
              </div>
            )}

            <div className="mt-2 h-72 overflow-auto bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono text-[10px] text-emerald-400/90 leading-relaxed whitespace-pre select-all">
              {previewConteudo || '// Selecione um formato ao lado (TOTVS, Senior, Domínio, AFD ou AEJ)\n// para gerar a pré-visualização e disparar o download imediato.'}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Formato homologado conforme especificações técnicas oficiais da Portaria MTP 671/2021.
          </div>
        </div>
      </div>
    </div>
  );
}
