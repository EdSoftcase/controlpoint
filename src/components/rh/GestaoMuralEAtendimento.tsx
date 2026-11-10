import React, { useState, useEffect } from 'react';
import { AuthUser } from '../../types/auth';
import { ComunicadoEmpresa, ChamadoAtendimentoRh, CategoriaComunicado, AssuntoChamadoRh } from '../../types/rhAvancado';
import { useAuth } from '../AuthContext';
import {
  Megaphone,
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  Pin,
  Paperclip,
  Send,
  User,
  Filter,
  Eye,
  ShieldCheck,
  Search,
  Check,
  X,
  AlertCircle,
  FileText
} from 'lucide-react';

interface GestaoMuralEAtendimentoProps {
  currentUser: AuthUser;
}

export const GestaoMuralEAtendimento: React.FC<GestaoMuralEAtendimentoProps> = ({ currentUser }) => {
  const { supabase } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'mural' | 'atendimento'>('mural');

  // ==========================================
  // ESTADOS DO MURAL DIGITAL DE COMUNICADOS
  // ==========================================
  const [comunicados, setComunicados] = useState<ComunicadoEmpresa[]>(() => {
    try {
      const saved = localStorage.getItem('sc_comunicados_all');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'ann-01',
        tenantId: 'tenant-01',
        titulo: 'Feriado de Proclamação da República e Emenda de Ponte',
        conteudo: 'Informamos a todos os colaboradores que no dia 15/11 (sexta-feira) não haverá expediente em virtude do feriado nacional. As atividades retornarão normalmente na segunda-feira subsequente.',
        categoria: 'FERIADOS',
        autorNome: 'Luciana Mendonça (Coordenação de RH)',
        fixado: true,
        exigeConfirmacaoLeitura: true,
        confirmacoesLeitura: [
          { colaboradorId: 'colab-01', colaboradorCpf: '123.456.789-01', colaboradorNome: 'Carlos Silva', dataHora: '08/11/2026 14:20', ip: '189.120.45.88' }
        ],
        criadoEm: '08/11/2026'
      },
      {
        id: 'ann-02',
        tenantId: 'tenant-01',
        titulo: 'Campanha de Vacinação Corporativa contra Gripe H1N1',
        conteudo: 'Na próxima quarta-feira (18/11), a equipe médica da empresa estará no auditório da matriz disponibilizando a vacinação gratuita para todos os funcionários contratados CLT.',
        categoria: 'CAMPANHA_SAUDE',
        autorNome: 'Departamento de Medicina do Trabalho',
        fixado: false,
        exigeConfirmacaoLeitura: true,
        confirmacoesLeitura: [],
        criadoEm: '07/11/2026'
      }
    ];
  });

  const [isNovoComunicadoModalOpen, setIsNovoComunicadoModalOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoConteudo, setNovoConteudo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<CategoriaComunicado>('FERIADOS');
  const [novoFixado, setNovoFixado] = useState(false);
  const [novoExigeConfirmacao, setNovoExigeConfirmacao] = useState(true);
  const [novoAnexoNome, setNovoAnexoNome] = useState('');
  const [novoAnexoUrl, setNovoAnexoUrl] = useState('');
  const [verificandoLeitoresModal, setVerificandoLeitoresModal] = useState<ComunicadoEmpresa | null>(null);

  // ==========================================
  // ESTADOS DO CANAL "FALE COM O DP / RH"
  // ==========================================
  const [chamados, setChamados] = useState<ChamadoAtendimentoRh[]>(() => {
    try {
      const saved = localStorage.getItem('sc_chamados_rh_all');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'ticket-01',
        tenantId: 'tenant-01',
        colaboradorId: 'colab-01',
        colaboradorNome: 'Carlos Silva',
        colaboradorCpf: '123.456.789-01',
        departamentoNome: 'Engenharia de Software',
        assunto: 'VALE_TRANSPORTE',
        titulo: 'Atualização de Endereço para Linha de Ônibus / VT',
        mensagemInicial: 'Olá equipe de RH, mudei de residência recentemente para o bairro Pinheiros e gostaria de solicitar a alteração da rota do meu cartão SPTrans Vale-Transporte.',
        status: 'EM_ATENDIMENTO',
        prioridade: 'MEDIA',
        respostas: [
          {
            id: 'resp-01',
            autorId: 'user-02',
            autorNome: 'Luciana Mendonça (RH)',
            eDoRh: true,
            mensagem: 'Olá Carlos! Por favor anexe o novo comprovante de residência em seu nome para atualizarmos o benefício no sistema.',
            dataHora: '08/11/2026 15:30'
          }
        ],
        criadoEm: '08/11/2026 10:15',
        atualizadoEm: '08/11/2026 15:30'
      },
      {
        id: 'ticket-02',
        tenantId: 'tenant-01',
        colaboradorId: 'colab-03',
        colaboradorNome: 'Marcos Ribeiro',
        colaboradorCpf: '345.678.901-23',
        departamentoNome: 'Logística & Expedição',
        assunto: 'DUVIDA_HOLERITE',
        titulo: 'Dúvida sobre desconto de INSS no holerite de Out/2026',
        mensagemInicial: 'Gostaria de solicitar o detalhamento da faixa de alíquota progressiva do INSS calculada no meu holerite deste mês.',
        status: 'ABERTO',
        prioridade: 'ALTA',
        respostas: [],
        criadoEm: '09/11/2026 09:00',
        atualizadoEm: '09/11/2026 09:00'
      }
    ];
  });

  const [selectedTicket, setSelectedTicket] = useState<ChamadoAtendimentoRh | null>(null);
  const [respostaRhInput, setRespostaRhInput] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'TODOS' | 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO'>('TODOS');
  const [ticketSearchFilter, setTicketSearchFilter] = useState('');

  // Sincronização inicial com Banco de Dados Supabase
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        if (supabase) {
          const { data } = await supabase.from('company_announcements').select('*');
          if (data && data.length > 0) {
            const mapped: ComunicadoEmpresa[] = data.map((a: any) => ({
              id: a.announcement_id || a.id,
              tenantId: a.tenant_id,
              titulo: a.titulo,
              conteudo: a.conteudo,
              categoria: a.categoria,
              autorNome: a.autor_nome,
              fixado: a.fixado,
              exigeConfirmacaoLeitura: a.exige_confirmacao_leitura,
              anexoNome: a.anexo_nome,
              anexoUrl: a.anexo_url,
              confirmacoesLeitura: Array.isArray(a.confirmacoes_leitura) ? a.confirmacoes_leitura : [],
              criadoEm: a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : 'Hoje'
            }));

            setComunicados(prev => {
              const merged = [...prev];
              for (const item of mapped) {
                const idx = merged.findIndex(m => m.id === item.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
                else merged.unshift(item);
              }
              return merged;
            });
          }
        }
      } catch (_) {}
    }

    async function fetchTickets() {
      try {
        if (supabase) {
          const { data } = await supabase.from('rh_tickets').select('*');
          if (data && data.length > 0) {
            const mapped: ChamadoAtendimentoRh[] = data.map((t: any) => ({
              id: t.ticket_id || t.id,
              tenantId: t.tenant_id,
              colaboradorId: t.collaborator_id,
              colaboradorNome: t.collaborator_name,
              colaboradorCpf: t.collaborator_cpf,
              departamentoNome: t.departamento_nome,
              assunto: t.assunto,
              titulo: t.titulo,
              mensagemInicial: t.mensagem_inicial,
              anexoNome: t.anexo_nome,
              anexoUrl: t.anexo_url,
              status: t.status,
              prioridade: t.prioridade,
              respostas: Array.isArray(t.respostas) ? t.respostas : [],
              criadoEm: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : 'Hoje',
              atualizadoEm: t.updated_at ? new Date(t.updated_at).toLocaleDateString('pt-BR') : 'Hoje'
            }));

            setChamados(prev => {
              const merged = [...prev];
              for (const item of mapped) {
                const idx = merged.findIndex(m => m.id === item.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
                else merged.unshift(item);
              }
              return merged;
            });
          }
        }
      } catch (_) {}
    }

    fetchAnnouncements();
    fetchTickets();
  }, [supabase]);

  // Ação RH: Publicar Comunicado
  const handlePublicarComunicado = async () => {
    if (!novoTitulo.trim() || !novoConteudo.trim()) {
      alert('Informe o título e o conteúdo do comunicado.');
      return;
    }

    const annId = `ann-${Date.now()}`;
    const novo: ComunicadoEmpresa = {
      id: annId,
      tenantId: currentUser.tenantId || 'tenant-01',
      titulo: novoTitulo.trim(),
      conteudo: novoConteudo.trim(),
      categoria: novaCategoria,
      autorNome: `${currentUser.nome} (RH)`,
      fixado: novoFixado,
      exigeConfirmacaoLeitura: novoExigeConfirmacao,
      anexoNome: novoAnexoNome || undefined,
      anexoUrl: novoAnexoUrl || undefined,
      confirmacoesLeitura: [],
      criadoEm: new Date().toLocaleDateString('pt-BR')
    };

    const updated = [novo, ...comunicados];
    setComunicados(updated);
    localStorage.setItem('sc_comunicados_all', JSON.stringify(updated));

    // Backend sync
    try {
      await fetch('/api/save-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo)
      });
    } catch (_) {}

    setIsNovoComunicadoModalOpen(false);
    setNovoTitulo('');
    setNovoConteudo('');
    setNovoAnexoNome('');
    setNovoAnexoUrl('');
    alert('Comunicado publicado com sucesso no Mural Digital dos Colaboradores!');
  };

  // Ação RH: Enviar Resposta a um Chamado do DP
  const handleEnviarRespostaRh = async (ticket: ChamadoAtendimentoRh) => {
    if (!respostaRhInput.trim()) return;

    const novaResposta = {
      id: `resp-${Date.now()}`,
      autorId: currentUser.id,
      autorNome: `${currentUser.nome} (RH)`,
      eDoRh: true,
      mensagem: respostaRhInput.trim(),
      dataHora: new Date().toLocaleString('pt-BR')
    };

    const updatedTicket: ChamadoAtendimentoRh = {
      ...ticket,
      status: ticket.status === 'ABERTO' ? 'EM_ATENDIMENTO' : ticket.status,
      respostas: [...ticket.respostas, novaResposta],
      atualizadoEm: new Date().toLocaleString('pt-BR')
    };

    const updatedList = chamados.map(t => t.id === ticket.id ? updatedTicket : t);
    setChamados(updatedList);
    localStorage.setItem('sc_chamados_rh_all', JSON.stringify(updatedList));
    setSelectedTicket(updatedTicket);
    setRespostaRhInput('');

    // Backend sync
    try {
      await fetch('/api/save-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticket.id,
          resposta: novaResposta
        })
      });
    } catch (_) {}
  };

  // Ação RH: Alterar Status do Chamado (ex: Concluir)
  const handleAlterarStatusTicket = async (ticketId: string, novoStatus: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO') => {
    const updatedList = chamados.map(t => {
      if (t.id === ticketId) {
        const u = { ...t, status: novoStatus, atualizadoEm: new Date().toLocaleString('pt-BR') };
        if (selectedTicket?.id === ticketId) setSelectedTicket(u);
        return u;
      }
      return t;
    });

    setChamados(updatedList);
    localStorage.setItem('sc_chamados_rh_all', JSON.stringify(updatedList));

    try {
      await fetch('/api/update-ticket-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: novoStatus })
      });
    } catch (_) {}
  };

  const filteredTickets = chamados.filter(t => {
    if (ticketStatusFilter !== 'TODOS' && t.status !== ticketStatusFilter) return false;
    if (ticketSearchFilter.trim()) {
      const q = ticketSearchFilter.toLowerCase();
      const matchColab = t.colaboradorNome.toLowerCase().includes(q) || t.colaboradorCpf.includes(q);
      const matchTitulo = t.titulo.toLowerCase().includes(q) || t.mensagemInicial.toLowerCase().includes(q);
      return matchColab || matchTitulo;
    }
    return true;
  });

  const chamadosAbertosCount = chamados.filter(t => t.status === 'ABERTO').length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção de Comunicação & DP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Comunicação Interna & Central de Atendimento DP/RH
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Publique comunicados institucionais com confirmação de leitura e atenda solicitações de funcionários sobre holerites, VT e alterações cadastrais.
          </p>
        </div>

        {/* Abas Superiores RH */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveSubTab('mural')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'mural' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4 text-indigo-600" />
            <span>Mural de Comunicados</span>
          </button>
          <button
            onClick={() => setActiveSubTab('atendimento')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'atendimento' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Atendimento DP/RH</span>
            {chamadosAbertosCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-mono animate-pulse">
                {chamadosAbertosCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: MURAL DIGITAL DE COMUNICADOS */}
      {activeSubTab === 'mural' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                Mural Digital da Empresa ({comunicados.length} Publicações)
              </h3>
              <p className="text-xs text-slate-500">
                Comunicados oficiais, avisos de pontes, campanhas de vacinação e metas operacionais do mês.
              </p>
            </div>
            <button
              onClick={() => setIsNovoComunicadoModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Comunicado Oficial</span>
            </button>
          </div>

          <div className="space-y-4">
            {comunicados.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.fixado
                    ? 'bg-gradient-to-r from-indigo-50/60 via-slate-50 to-indigo-50/40 border-indigo-200 shadow-xs'
                    : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {item.fixado && (
                      <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-current" /> Destaque Fixado
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono font-bold text-[10px] uppercase">
                      {item.categoria === 'FERIADOS' && '🏖️ Feriado / Ponte'}
                      {item.categoria === 'CAMPANHA_SAUDE' && '🏥 Campanha de Saúde'}
                      {item.categoria === 'METAS_MES' && '🎯 Metas do Mês'}
                      {item.categoria === 'COMUNICADO_GERAL' && '📢 Geral'}
                      {item.categoria === 'SEGURANCA_TRABALHO' && '🛡️ Segurança do Trabalho'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.titulo}</h4>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium shrink-0">
                    Publicado em: <strong>{item.criadoEm}</strong> por {item.autorNome}
                  </div>
                </div>

                <div className="py-3 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {item.conteudo}
                </div>

                {item.anexoNome && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between max-w-md my-2">
                    <span className="text-slate-700 font-mono truncate" title={item.anexoNome}>📄 {item.anexoNome}</span>
                    {item.anexoUrl && (
                      <a href={item.anexoUrl} download={item.anexoNome} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">
                        Download Anexo
                      </a>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Confirmações de Leitura: <strong className="text-emerald-700">{item.confirmacoesLeitura?.length || 0} leituras registradas</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setVerificandoLeitoresModal(item)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver Leitores ({item.confirmacoesLeitura?.length || 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CENTRAL DE ATENDIMENTO DP / RH */}
      {activeSubTab === 'atendimento' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Chamados de Atendimento dos Colaboradores ({chamados.length})
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie solicitações diretas sobre contracheques, vale-transporte, divergências e alteração cadastral.
              </p>
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                aria-label="Filtro de Status de Atendimento DP"
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TODOS">Todos os Status ({chamados.length})</option>
                <option value="ABERTO">Pendentes Abertos ({chamadosAbertosCount})</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="CONCLUIDO">Concluídos / Resolvidos</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Chamados do DP */}
            <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador ou assunto..."
                  value={ticketSearchFilter}
                  onChange={(e) => setTicketSearchFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Nenhum chamado encontrado com os filtros selecionados.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.status === 'ABERTO' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          t.status === 'EM_ATENDIMENTO' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {t.status === 'ABERTO' ? '🟡 Aberto' : t.status === 'EM_ATENDIMENTO' ? '🔵 Em Atendimento' : '🟢 Concluído'}
                        </span>
                        <span className="text-[10px] text-slate-400">{t.criadoEm}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{t.titulo}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{t.mensagemInicial}</p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/80">
                        <span className="font-bold text-slate-700">👤 {t.colaboradorNome}</span>
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {t.assunto === 'DUVIDA_HOLERITE' && 'Holerite'}
                          {t.assunto === 'VALE_TRANSPORTE' && 'Vale-Transporte'}
                          {t.assunto === 'ALTERACAO_CADASTRAL' && 'Alt. Cadastral'}
                          {t.assunto === 'DUVIDA_PONTO' && 'Espelho Ponto'}
                          {t.assunto === 'OUTROS' && 'Outros'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Visualizador do Thread / Atendimento Ativo */}
            <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between min-h-[500px]">
              {selectedTicket ? (
                <div className="flex flex-col h-full justify-between space-y-4">
                  {/* Informações do Solicitante */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{selectedTicket.titulo}</span>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ID: {selectedTicket.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTicket.status !== 'CONCLUIDO' ? (
                          <button
                            onClick={() => handleAlterarStatusTicket(selectedTicket.id, 'CONCLUIDO')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Concluído
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAlterarStatusTicket(selectedTicket.id, 'EM_ATENDIMENTO')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Reabrir Chamado
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-mono pt-2 border-t border-slate-100">
                      <div><strong>Colaborador:</strong> {selectedTicket.colaboradorNome} (CPF {selectedTicket.colaboradorCpf})</div>
                      <div><strong>Departamento:</strong> {selectedTicket.departamentoNome || 'Geral'}</div>
                    </div>

                    <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mensagem Inicial do Trabalhador:</span>
                      <p>{selectedTicket.mensagemInicial}</p>
                    </div>

                    {selectedTicket.anexoNome && (
                      <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                        <span>Anexo enviado: <strong>{selectedTicket.anexoNome}</strong></span>
                        {selectedTicket.anexoUrl && (
                          <a href={selectedTicket.anexoUrl} download={selectedTicket.anexoNome} target="_blank" rel="noreferrer" className="font-bold underline text-indigo-700">
                            Visualizar Documento
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thread de Respostas */}
                  <div className="flex-1 overflow-y-auto space-y-3 p-2 max-h-[300px]">
                    {selectedTicket.respostas.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-8">
                        Nenhuma resposta enviada pelo RH ainda. Digite a resposta no campo abaixo para orientar o colaborador.
                      </div>
                    ) : (
                      selectedTicket.respostas.map((r) => (
                        <div
                          key={r.id}
                          className={`p-3.5 rounded-xl text-xs space-y-1 max-w-[85%] ${
                            r.eDoRh
                              ? 'bg-indigo-900 text-white ml-auto border border-indigo-700 shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] opacity-80">
                            <span className="font-bold">{r.autorNome}</span>
                            <span>{r.dataHora}</span>
                          </div>
                          <p className="leading-relaxed">{r.mensagem}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Campo de Envio de Resposta RH */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Digite a resposta oficial do DP/RH para este chamado..."
                      value={respostaRhInput}
                      onChange={(e) => setRespostaRhInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEnviarRespostaRh(selectedTicket);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleEnviarRespostaRh(selectedTicket)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>Responder</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400 py-20">
                  <MessageSquare className="w-12 h-12 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-600">Selecione um Chamado ao Lado</h4>
                  <p className="text-xs max-w-xs">
                    Clique em um chamado da lista para visualizar a solicitação completa do colaborador e responder.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO COMUNICADO OFICIAL */}
      {isNovoComunicadoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                Publicar Novo Comunicado no Mural Digital
              </h3>
              <button onClick={() => setIsNovoComunicadoModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Aviso:</label>
                <input
                  type="text"
                  placeholder="Ex: Comunicado sobre Feriado de Carnaval e Escala de Trabalho"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Categoria:</label>
                <select
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="FERIADOS">🏖️ Feriados / Pontes & Recessos</option>
                  <option value="CAMPANHA_SAUDE">🏥 Campanha de Saúde & Vacinação</option>
                  <option value="METAS_MES">🎯 Metas & Indicadores do Mês</option>
                  <option value="COMUNICADO_GERAL">📢 Comunicado Geral Institucional</option>
                  <option value="SEGURANCA_TRABALHO">🛡️ Segurança do Trabalho & CIPA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Conteúdo do Comunicado:</label>
                <textarea
                  rows={5}
                  placeholder="Escreva a mensagem completa que aparecerá para os colaboradores no portal..."
                  value={novoConteudo}
                  onChange={(e) => setNovoConteudo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <label className="flex items-center gap-2 font-semibold text-indigo-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoFixado}
                    onChange={(e) => setNovoFixado(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Fixar Destaque no Topo do Mural</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-indigo-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoExigeConfirmacao}
                    onChange={(e) => setNovoExigeConfirmacao(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Exigir Botão de Confirmação de Leitura</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Anexo em PDF / Imagem (Opcional):</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNovoAnexoNome(file.name);
                      const reader = new FileReader();
                      reader.onload = (evt) => setNovoAnexoUrl(evt.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNovoComunicadoModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublicarComunicado}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Publicar no Mural Digital
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFICAÇÃO DE LEITORES DO COMUNICADO */}
      {verificandoLeitoresModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Relatório de Confirmação de Leitura
              </h3>
              <button onClick={() => setVerificandoLeitoresModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800">
              <strong>Comunicado:</strong> "{verificandoLeitoresModal.titulo}"
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {verificandoLeitoresModal.confirmacoesLeitura.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Nenhum colaborador confirmou leitura até o momento.
                </div>
              ) : (
                verificandoLeitoresModal.confirmacoesLeitura.map((r, i) => (
                  <div key={i} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-slate-900">{r.colaboradorNome}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">CPF {r.colaboradorCpf}</span>
                    </div>
                    <div className="text-right text-[10px] font-mono text-emerald-800">
                      <div>Confirmed em: {r.dataHora}</div>
                      <div>IP: {r.ip}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setVerificandoLeitoresModal(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl"
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
