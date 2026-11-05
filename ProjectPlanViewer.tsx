import React from 'react';
import { Calendar, CheckCircle2, Clock, Layers, Award } from 'lucide-react';

export const ProjectPlanViewer: React.FC = () => {
  const modulos = [
    { num: '01', title: 'Administração da plataforma', desc: 'Cadastro de clientes, gestão de planos e assinaturas, controle de licenças e usuários.' },
    { num: '02', title: 'Cadastro e estrutura organizacional', desc: 'Empresas, filiais, estabelecimentos, departamentos, cargos, colaboradores, vínculos e RBAC.' },
    { num: '03', title: 'Jornadas e escalas', desc: 'Jornadas fixas e flexíveis, escalas 5x2, 6x1, 12x36, turnos alternados e feriados.' },
    { num: '04', title: 'Registro eletrônico REP-P', desc: 'Marcação de ponto, intervalos, NSR, sincronização de relógio, integridade e arquivo AFD.' },
    { num: '05', title: 'Aplicativo do colaborador', desc: 'Registro móvel, espelho de ponto, extrato de banco de horas, justificativas e anexos.' },
    { num: '06', title: 'Coletor de ponto (Tablet)', desc: 'Interface tablet kiosk, identificação individual por PIN/facial e operação offline.' },
    { num: '07', title: 'Gestão de RH e gestores', desc: 'Painel de frequência em tempo real, atrasos, faltas, aprovação de justificativas e fechamento.' },
    { num: '08', title: 'Apuração e PTRP', desc: 'Cálculo de horas trabalhadas, horas extras, tolerâncias legais CLT, DSR, AEJ e espelho.' },
    { num: '09', title: 'Relatórios e integrações', desc: 'Exportação para folha de pagamento, arquivos fiscais AFD/AEJ e relatórios gerenciais.' },
    { num: '10', title: 'Segurança e conformidade', desc: 'Isolamento por tenant, criptografia, MFA, trilha de auditoria WORM e LGPD.' }
  ];

  const cronograma = [
    { fase: 'Planejamento e especificação', semanas: 'Semanas 1–4', status: 'Em andamento (Doc 02)' },
    { fase: 'Arquitetura e estrutura técnica', semanas: 'Semanas 5–8', status: 'Planejado' },
    { fase: 'Cadastros e administração', semanas: 'Semanas 9–14', status: 'Planejado' },
    { fase: 'Jornadas e escalas', semanas: 'Semanas 15–19', status: 'Planejado' },
    { fase: 'REP-P e registros', semanas: 'Semanas 20–26', status: 'Planejado' },
    { fase: 'Aplicativo e coletor', semanas: 'Semanas 27–32', status: 'Planejado' },
    { fase: 'PTRP e relatórios', semanas: 'Semanas 33–38', status: 'Planejado' },
    { fase: 'Testes e preparação para piloto', semanas: 'Semanas 39–44', status: 'Planejado' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
              DOCUMENTO 01
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">
              Plano Geral de Desenvolvimento — Versão 1.0
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Estruturação formal do projeto <strong>Softcase Ponto</strong> como plataforma SaaS de controle e gestão de jornada em estrita conformidade com a Portaria MTP nº 671/2021 (REP-P e PTRP).
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Duração Total Estimada</span>
            <span className="text-base font-bold font-mono text-slate-900">44 Semanas</span>
          </div>
        </div>

        {/* Diretriz Oficial */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
          <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Diretriz Fundamental do Projeto:</strong> Não programar funcionalidades sem antes definir seu comportamento detalhado, seus requisitos legais e como será testada. Uma falha no ponto eletrônico gera sérias consequências trabalhistas e regulatórias.
          </div>
        </div>
      </div>

      {/* Os 10 Módulos do Sistema */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          Escopo Funcional: 10 Módulos do Produto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {modulos.map((m) => (
            <div
              key={m.num}
              className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-[11px] text-slate-900 px-1.5 py-0.5 bg-slate-200 rounded">
                  MÓDULO {m.num}
                </span>
                <span className="font-bold text-slate-900">{m.title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed pl-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cronograma Preliminar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" />
          Cronograma Preliminar (44 Semanas)
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Fase de Engenharia</th>
                <th className="py-2.5 px-3">Período Estimado</th>
                <th className="py-2.5 px-3">Status do Entregável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cronograma.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{c.fase}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{c.semanas}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        c.status.includes('Em andamento')
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
