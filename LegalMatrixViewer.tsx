import React from 'react';
import { LEGAL_MATRIX_ITEMS } from '../data/specificationDoc';
import { ShieldCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';

export const LegalMatrixViewer: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Matriz de Conformidade Legal e Regulatória (Portaria MTP 671/2021)
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Mapeamento mandatório entre os artigos da legislação trabalhista brasileira vigente,
              as obrigações do <strong>REP-P (Registrador Eletrônico de Ponto via Programa)</strong> e do <strong>PTRP (Programa de Tratamento de Registro de Ponto)</strong>, e a arquitetura técnica especificada no Softcase Ponto.
            </p>
          </div>
        </div>

        {/* Pilares regulatórios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-sm">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Imutabilidade do AFD
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Portaria 671/2021 Art. 84: Proibição absoluta de alteração ou exclusão de registros originais do trabalhador.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Comprovante & Assinatura
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Art. 83: Emissão de comprovante em PDF assinado digitalmente ou com hash verificável pelo empregado.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              Atestado Técnico (INPI/MTP)
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Art. 75: Termo de Responsabilidade emitido e registrado pelo responsável técnico da Softcase.
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de rastreabilidade */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Rastreabilidade Artigo por Artigo</h3>
            <p className="text-xs text-slate-500 mt-0.5">Critérios de conformidade jurídica exigidos em auditorias do Ministério do Trabalho</p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
            6 Artigos Fundamentais Mapeados
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {LEGAL_MATRIX_ITEMS.map((item, index) => (
            <div key={index} className="p-6 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="lg:w-1/3">
                  <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block mb-1.5">
                    {item.artigo}
                  </span>
                  <h4 className="text-base font-semibold text-slate-900">{item.tema}</h4>
                </div>

                <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Exigência Legal (Portaria / CLT)
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700">{item.exigenciaLegal}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/70">
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
                      Implementação no Softcase Ponto
                    </span>
                    <p className="text-xs leading-relaxed text-emerald-950 font-medium">
                      {item.implementacaoSoftcase}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
