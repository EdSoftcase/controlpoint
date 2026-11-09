import React, { useState } from 'react';
import { 
  BookOpen, 
  UserCheck, 
  Users, 
  CalendarDays, 
  Clock, 
  Plane, 
  ShieldCheck, 
  Tablet, 
  ScanFace, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Award, 
  HelpCircle, 
  FileCheck, 
  Building2, 
  Smartphone, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
  CheckSquare
} from 'lucide-react';

interface GuiaBoasVindasProps {
  initialAudience?: 'rh' | 'colaborador';
  onNavigateToTab?: (tab: string) => void;
  onNavigateToView?: (view: 'operational' | 'colaborador' | 'spec' | 'prototype' | 'legal') => void;
  currentUserRole?: string;
}

export function GuiaBoasVindas({
  initialAudience = 'rh',
  onNavigateToTab,
  onNavigateToView,
  currentUserRole = 'SUPER_ADMIN'
}: GuiaBoasVindasProps) {
  const [audience, setAudience] = useState<'rh' | 'colaborador'>(
    currentUserRole === 'SUPER_ADMIN' ? initialAudience : 'colaborador'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Checklist de Onboarding RH
  const [rhChecklist, setRhChecklist] = useState<Record<string, boolean>>({
    empresa: true,
    escalas: true,
    feriados: true,
    ferias: false,
    coletor: false,
    afd: false
  });

  // Checklist de Onboarding Colaborador
  const [colabChecklist, setColabChecklist] = useState<Record<string, boolean>>({
    cadastro: true,
    primeiroPonto: false,
    conhecerEscala: false,
    lerTolerancias: false
  });

  const toggleRhItem = (key: string) => {
    setRhChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleColabItem = (key: string) => {
    setColabChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopySummary = () => {
    const textToCopy = audience === 'rh' 
      ? `=== MANUAL DE BOAS-VINDAS DO RH & GESTÃO - CONTROL POINT (PORTARIA MTP 671/2021) ===\n\n` +
        `O Control Point é a plataforma oficial de REP-P e PTRP da Softcase Tecnologia.\n\n` +
        `PRINCIPAIS RECURSOS DO RH:\n` +
        `1. Apuração diária com tolerância legal da CLT Art. 58 (5 min / 10 min diários);\n` +
        `2. Gestão de Férias Inteligente (CLT Art. 134 e 137 com cálculo automático de término e alertas de dobro);\n` +
        `3. Escalas 12x36, 5x2, 6x1 e folgas DSR compensatórias;\n` +
        `4. Coletor Tablet Totem e Biometria Facial com prova de vida (liveness);\n` +
        `5. Emissão de AFD e AEJ fiscais oficiais assinados digitalmente;\n` +
        `6. Assinatura eletrônica de espelho com validade probatória jurídica.\n\n` +
        `Acesse o sistema e configure os departamentos e escalas da sua equipe!`
      : `=== GUIA RÁPIDO DO COLABORADOR - BEM-VINDO AO CONTROL POINT ===\n\n` +
        `Olá! Este é o seu portal oficial para registro e acompanhamento de ponto.\n\n` +
        `COMO USAR NO SEU DIA A DIA:\n` +
        `1. BATER PONTO: Acesse pelo celular ou computador, tire sua foto facial e confirme sua localização;\n` +
        `2. MEU ESPELHO: Acompanhe suas 4 batidas diárias (Entrada, Almoço, Volta e Saída) e seu saldo;\n` +
        `3. MINHA ESCALA: Veja seus dias de trabalho, folgas e plantões no calendário mensal;\n` +
        `4. MINHAS FÉRIAS: Programe seu período de descanso com cálculo automático de volta e solicite abono pecuniário (venda de 10 dias);\n` +
        `5. ATESTADOS: Envie fotos de atestados médicos ou solicite ajustes com facilidade;\n` +
        `6. ASSINATURA MENSAL: No final do mês, confira e assine digitalmente seu espelho sem papel.\n\n` +
        `Dúvidas? Consulte o RH da sua empresa ou acesse o menu de ajuda do app!`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const faqsRh = [
    {
      q: 'O sistema atende integralmente à Portaria MTP nº 671/2021?',
      a: 'Sim. O Control Point opera rigorosamente nos padrões de REP-P (Programa de Registro Eletrônico de Ponto) e PTRP (Programa de Tratamento de Registro de Ponto). Gera comprovantes assinados com hash SHA-256, proíbe marcações automáticas ou restrições arbitrárias, e exporta os arquivos fiscais oficiais AFD e AEJ.'
    },
    {
      q: 'Como funciona a regra legal de tolerância no ponto?',
      a: 'Conforme o Art. 58 § 1º da CLT, variações no registro de ponto não excedentes a 5 minutos, observado o limite máximo diário de 10 minutos, não são computadas como jornada extraordinária nem descontadas do colaborador.'
    },
    {
      q: 'Como o cálculo automático de férias protege a empresa de multas?',
      a: 'O sistema calcula o Período Concessivo (12 meses após o período aquisitivo). Se faltarem menos de 60 dias para o vencimento sem agendamento, emite alerta amarelo; se vencer sem gozo, emite alerta vermelho de pagamento em dobro (Art. 137 CLT), auxiliando o RH a agir proativamente.'
    },
    {
      q: 'É possível exportar os dados para sistemas de folha de pagamento externos?',
      a: 'Sim. Na aba "Exportador ERP", o sistema gera layouts estruturados para Totvs RM/Datasul, Senior Sistemas, Domínio Thomson Reuters, SAP e formato padronizado CSV/TXT com horas normais, extras diurnas/noturnas e DSR.'
    }
  ];

  const faqsColab = [
    {
      q: 'Como sei que o meu ponto foi registrado com sucesso?',
      a: 'Após a captura da foto facial e confirmação da localização, o app exibe uma confirmação em verde com o Comprovante de Registro de Ponto (REP-P), contendo data, hora exata no segundo, código SHA-256 e botão para salvar o comprovante.'
    },
    {
      q: 'O que fazer se eu esquecer de registrar a entrada ou saída?',
      a: 'Acesse o menu "Ajustes & Atestados" dentro do Portal do Colaborador. Indique o dia, o horário que esqueceu de bater e o motivo. O seu gestor/RH receberá uma notificação e validará o ajuste no espelho.'
    },
    {
      q: 'Posso vender 10 dias das minhas férias (Abono Pecuniário)?',
      a: 'Sim! Pelo Art. 143 da CLT, o colaborador tem direito de converter 1/3 do seu período de férias em abono pecuniário. Ao abrir o agendamento no app, basta selecionar 20 dias de gozo e marcar a opção "10 dias de abono (Venda de 1/3)".'
    },
    {
      q: 'Preciso imprimir o espelho de ponto no final do mês?',
      a: 'Não! O Control Point conta com Assinatura Eletrônica integrada. No encerramento do mês, você revisa suas batidas na tela e clica em "Assinar Digitalmente". O documento ganha validade jurídica probatória instantânea.'
    }
  ];

  const currentFaqs = audience === 'rh' ? faqsRh : faqsColab;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Banner Principal de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Centro de Boas-Vindas & Treinamento Oficial
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Bem-vindo ao Control Point
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            A solução definitiva para registro eletrônico de ponto (REP-P) e tratamento de jornada (PTRP) 
            em conformidade total com a <strong>Portaria MTP nº 671/2021</strong> e a <strong>CLT</strong>.
          </p>

          {/* Toggle de Audiência (RH vs Colaborador) */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 bg-slate-800/90 rounded-xl border border-slate-700">
              <button
                onClick={() => setAudience('rh')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  audience === 'rh'
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Para o RH & Gestão (Visão Completa)
              </button>

              <button
                onClick={() => setAudience('colaborador')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  audience === 'colaborador'
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Para o Colaborador (Passo a Passo)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                title="Copiar resumo para compartilhar por e-mail ou WhatsApp"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado para a Área de Transferência!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Copiar Manual para Compartilhar
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                title="Imprimir ou salvar manual em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEÇÃO 1: AUDIÊNCIA RH & GESTÃO                          */}
      {/* ======================================================== */}
      {audience === 'rh' && (
        <div className="space-y-6">
          {/* Card Resumo com Métricas de Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Compliance Legal</div>
                <div className="text-sm font-bold text-slate-900">Portaria MTP 671/21</div>
                <div className="text-[10px] text-emerald-700 font-semibold">REP-P & PTRP Ativos</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Controle de Férias</div>
                <div className="text-sm font-bold text-slate-900">CLT Art. 134 e 137</div>
                <div className="text-[10px] text-blue-700 font-semibold">Cálculo Automático & Alertas</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Escalas & Turnos</div>
                <div className="text-sm font-bold text-slate-900">12x36, 5x2, 6x1</div>
                <div className="text-[10px] text-indigo-700 font-semibold">Controle de Folgas DSR</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Segurança Biométrica</div>
                <div className="text-sm font-bold text-slate-900">Liveness & Totem</div>
                <div className="text-[10px] text-amber-700 font-semibold">Geofencing & Anti-fraude</div>
              </div>
            </div>
          </div>

          {/* Checklist de Implantação para o RH */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Checklist de Configuração Inicial do RH
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {Object.values(rhChecklist).filter(Boolean).length} de {Object.keys(rhChecklist).length} concluídos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                onClick={() => toggleRhItem('empresa')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.empresa 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.empresa} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">1. Cadastro de Estabelecimento & Deptos</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">CNPJ, razão social, departamentos e cargos vinculados.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleRhItem('escalas')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.escalas 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.escalas} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">2. Definição de Escalas & Turnos</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Configurar jornadas padrão e escalas 12x36 dos setores.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleRhItem('feriados')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.feriados 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.feriados} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">3. Calendário de Feriados Oficiais</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Feriados nacionais e municipais da sede da empresa.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleRhItem('ferias')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.ferias 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.ferias} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">4. Programar Férias com Alertas CLT</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Agendar descansos antes do vencimento do período concessivo.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleRhItem('coletor')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.coletor 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.coletor} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">5. Ativar Modo Coletor Tablet Kiosk</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Instalar totem de parede com biometria facial e câmera.</p>
                </div>
              </div>

              <div 
                onClick={() => toggleRhItem('afd')}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                  rhChecklist.afd 
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={rhChecklist.afd} 
                  onChange={() => {}} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5" 
                />
                <div>
                  <div className="font-bold text-slate-900">6. Validar Exportação AFD & Folha ERP</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gerar arquivo fiscal de auditoria e exportar para a contabilidade.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Módulos e Capacidades Detalhadas da Plataforma */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bloco 1: Gestão de Férias & Afastamentos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Plane className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    CLT Art. 134 e 137
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Gestão Inteligente de Férias & Afastamentos
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  O sistema automatiza integralmente a contagem de períodos concessivos a partir da data de admissão.
                </p>

                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Cálculo Automático de Retorno:</strong> Ao digitar a data de início e os dias de gozo (ex: 20 ou 30), a data de término é preenchida no mesmo instante.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Prevenção de Dobra (Art. 137):</strong> Monitoramento dos 12 meses do período concessivo com alertas visuais preventivos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Abono Pecuniário & Fracionamento:</strong> Suporte à venda de 1/3 (10 dias) e fracionamento em até 3 períodos conforme a Reforma Trabalhista.</span>
                  </li>
                </ul>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => {
                    onNavigateToView && onNavigateToView('operational');
                    onNavigateToTab('afastamentos');
                  }}
                  className="w-full mt-2 py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-emerald-200"
                >
                  Abrir Módulo de Férias & Alertas CLT
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bloco 2: Escalas de Trabalho e Turnos 12x36 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Calendário Anual
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Escalas Flexíveis, Plantões & 12x36
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Criação e gestão de escalas complexas para hospitais, fábricas, portarias e empresas com regime contínuo.
                </p>

                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Plantões 12x36 e Alternância Par/Ímpar:</strong> Definição da data-base para projeção automática de dias de trabalho e folgas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>DSR Compensatório & Feriados:</strong> Aplicação de regras da Súmula 444 do TST e cálculo de dias trabalhados em feriados.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Visualização Mensal Integrada:</strong> O gestor enxerga todos os colaboradores e seus turnos em uma grade unificada.</span>
                  </li>
                </ul>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => {
                    onNavigateToView && onNavigateToView('operational');
                    onNavigateToTab('escalas');
                  }}
                  className="w-full mt-2 py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-200"
                >
                  Abrir Módulo de Escalas & Turnos
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bloco 3: Apuração, Tolerâncias & Horas Extras */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Art. 58 § 1º CLT
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Apuração de Ponto, Atrasos & Horas Extras
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Motor de cálculo conforme rigorosas regras trabalhistas brasileiras para fechamento de folha.
                </p>

                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Tolerância de 5 Minutos:</strong> Não desconta nem gera horas extras para pequenas variações diárias até 10 minutos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Hora Noturna Reduzida (52m30s):</strong> Cálculo automático de adicional noturno entre 22h e 05h da manhã.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Abonos & Justificativas:</strong> Análise de atestados médicos e aprovação de ajustes em tempo real.</span>
                  </li>
                </ul>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => {
                    onNavigateToView && onNavigateToView('operational');
                    onNavigateToTab('relatorios');
                  }}
                  className="w-full mt-2 py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-blue-200"
                >
                  Abrir Apuração Diária & Atrasos
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Bloco 4: Coletor Tablet Totem & Biometria Facial */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Modo Kiosk Offline
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">
                  Coletor Tablet Totem & Biometria Facial
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Transforme qualquer tablet Android/iPad ou computador com webcam em um relógio de ponto moderno (REP-P).
                </p>

                <ul className="text-xs text-slate-600 space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Reconhecimento Facial com Liveness:</strong> Desafio de prova de vida (sorriso, piscar de olhos) para barrar fotos de celulares.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Modo Kiosk Bloqueado:</strong> Tela cheia dedicada ao registro dos funcionários na portaria da empresa.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Armazenamento Offline (IDB):</strong> Se a internet cair, o totem armazena as batidas e sincroniza assim que a conexão retornar.</span>
                  </li>
                </ul>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => {
                    onNavigateToView && onNavigateToView('operational');
                    onNavigateToTab('coletor');
                  }}
                  className="w-full mt-2 py-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-amber-200"
                >
                  Abrir Coletor Tablet REP-P
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 2: AUDIÊNCIA COLABORADOR                          */}
      {/* ======================================================== */}
      {audience === 'colaborador' && (
        <div className="space-y-6">
          {/* Card Inicial com o Passo a Passo */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Como Usar Seu Portal de Ponto no Dia a Dia
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Siga os 4 passos fundamentais para manter suas batidas, férias e escalas 100% regulares:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Passo 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Bater o Ponto</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ao chegar, no almoço e na saída, clique no botão <strong>"Registrar Ponto"</strong>, posicione o rosto na câmera e confirme.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Conferir seu Espelho</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Acompanhe seus horários de entrada e saída, total de horas cumpridas no dia e seu saldo de banco de horas.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Ajustes & Atestados</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Esqueceu de bater ou foi ao médico? Anexe a foto do atestado ou justifique para o seu gestor aprovar na hora.
                </p>
              </div>

              {/* Passo 4 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center mb-3">
                  4
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Assinar no Fim do Mês</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  No fechamento mensal, revise suas horas e assine digitalmente na tela com validade jurídica, sem precisar imprimir papel.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Funcionais para o Colaborador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Registro de Ponto com Biometria */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <ScanFace className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Registro de Ponto com Foto & Localização
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  O sistema utiliza inteligência facial para certificar que é você mesmo registrando o ponto, 
                  assegurando sua integridade e garantindo um comprovante digital instantâneo.
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 mb-4">
                  <div className="font-semibold text-slate-800">Dicas para uma batida rápida:</div>
                  <div>• Esteja em local bem iluminado;</div>
                  <div>• Olhe diretamente para a câmera sem óculos escuros ou máscara;</div>
                  <div>• Permita o acesso à localização do navegador quando solicitado.</div>
                </div>
              </div>

              {onNavigateToView && (
                <button
                  onClick={() => onNavigateToView('colaborador')}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  Ir para Meu Espelho de Ponto
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Como Agendar Férias CLT */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
                  <Plane className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Programação de Férias & Venda de 1/3 (Abono)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Você não precisa mais preencher formulários impressos para pedir suas férias. 
                  O sistema calcula automaticamente a data em que você voltará ao trabalho.
                </p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5 mb-4">
                  <div className="font-semibold text-slate-800">Regras da CLT:</div>
                  <div>• O descanso pode ser de 30 dias integrais ou fracionado em períodos de no mínimo 14 e 5 dias;</div>
                  <div>• Você pode vender até 10 dias de férias (abono pecuniário);</div>
                  <div>• O início das férias não pode coincidir com 2 dias antes do repouso semanal remunerado (DSR).</div>
                </div>
              </div>

              {onNavigateToView && (
                <button
                  onClick={() => onNavigateToView('colaborador')}
                  className="w-full mt-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-blue-200"
                >
                  Consultar Meu Período de Férias
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SEÇÃO 3: PERGUNTAS FREQUENTES (FAQ)                     */}
      {/* ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Dúvidas Frequentes ({audience === 'rh' ? 'Para Gestores e RH' : 'Para Colaboradores'})
          </h3>
        </div>

        <div className="space-y-3">
          {currentFaqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-900 flex items-center justify-between gap-3 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 text-xs text-slate-600 bg-white border-t border-slate-200 leading-relaxed animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
