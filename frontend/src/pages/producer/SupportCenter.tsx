import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  Clock,
  History,
  MessageSquare,
  Loader2,
  Filter,
  Tractor,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface FAQItem {
  question: string;
  answer: string;
}

interface ChamadoItem {
  id: string;
  subject: string;
  message: string;
  status: string;
  fazendaNome?: string;
  createdAt: string;
}

const faqList: FAQItem[] = [
  {
    question: 'Como funciona a contagem automatizada de gado por IA?',
    answer: 'Nossa inteligência artificial analisa os frames do vídeo aéreo enviado pelo drone, identificando individualmente cada animal por detecção visual, gerando a contagem automaticamente.'
  },
  {
    question: 'Quais formatos de vídeo de drone são aceitos pela plataforma?',
    answer: 'Aceitamos arquivos no formato MP4 gravados por qualquer drone (como modelos DJI). Recomendamos voos com altura constante entre 15 e 30 metros para melhor precisão.'
  },
  {
    question: 'Como posso alterar ou cadastrar novas fazendas?',
    answer: 'Acesse o menu "Mudar de Fazenda" no painel lateral. Lá você poderá cadastrar novas propriedades, alterar a unidade de medida da área (hectares, m² ou alqueires) e atualizar a capacidade de gado.'
  },
  {
    question: 'Como notificar os compradores sobre um lote certificado?',
    answer: 'Após a análise do vídeo na ferramenta de IA, clique no botão "Notificar Consumidores". O sistema iniciará uma janela de segurança de 5 segundos antes de disponibilizar o lote com o vídeo auditado aos compradores parceiros.'
  },
  {
    question: 'O que fazer se a contagem da IA for diferente do esperado?',
    answer: 'Você pode ajustar o campo "Quantidade para Anúncio (Editável)" logo após o processamento da IA para adequar ao número exato de cabeças que deseja colocar à venda.'
  }
];

export function SupportCenter() {
  const { userId, activeFarm, userFarms } = useFarm();
  const [searchTerm] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estados do formulário
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);

  // Lista de chamados reais vindos do Banco de Dados
  const [chamados, setChamados] = useState<ChamadoItem[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);

  // Estados de Filtro
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<string>('TODAS');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Estado do pop-up
  const [showPopup, setShowPopup] = useState(false);

  // Busca chamados do banco
  useEffect(() => {
    const currentUserId = userId || localStorage.getItem('@AgroIntelli:userId');

    if (currentUserId) {
      setLoadingChamados(true);
      api.get(`/api/chamados/usuario/${currentUserId}`)
        .then((res) => {
          if (res.data?.sucesso && Array.isArray(res.data.chamados)) {
            setChamados(res.data.chamados);
          }
        })
        .catch((err) => console.error('Erro ao buscar chamados no banco:', err))
        .finally(() => setLoadingChamados(false));
    } else {
      setLoadingChamados(false);
    }
  }, [userId]);

  // Filtro de Perguntas Frequentes
  const filteredFaqs = faqList.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtro Dinâmico de Chamados por Fazenda e Data
  const chamadosFiltrados = useMemo(() => {
    return chamados.filter((item) => {
      // Filtro por Fazenda
      if (selectedFarmFilter !== 'TODAS') {
        const nomeFazendaItem = (item.fazendaNome || '').toLowerCase().trim();
        const nomeFiltro = selectedFarmFilter.toLowerCase().trim();
        if (nomeFazendaItem !== nomeFiltro) return false;
      }

      // Filtro por Data (yyyy-mm-dd)
      if (selectedDateFilter) {
        if (!item.createdAt) return false;
        const dataItemISO = new Date(item.createdAt).toISOString().split('T')[0];
        if (dataItemISO !== selectedDateFilter) return false;
      }

      return true;
    });
  }, [chamados, selectedFarmFilter, selectedDateFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const currentUserId = userId || localStorage.getItem('@AgroIntelli:userId');

    if (!currentUserId) {
      alert('Sessão do usuário não identificada. Por favor, faça login novamente.');
      return;
    }

    setLoadingSend(true);

    try {
      const response = await api.post('/api/chamados', {
        usuarioId: currentUserId,
        subject: subject.trim(),
        message: message.trim(),
        fazendaNome: activeFarm?.name || 'Não especificada'
      });

      if (response.data?.sucesso && response.data?.chamado) {
        setChamados((prev) => [response.data.chamado, ...prev]);
        setShowPopup(true);
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      console.error('Erro ao enviar chamado:', err);
      alert('Falha ao registrar chamado. Tente novamente em instantes.');
    } finally {
      setLoadingSend(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showPopup) {
      timer = setTimeout(() => {
        setShowPopup(false);
      }, 3 * 60 * 1000);
    }
    return () => clearTimeout(timer);
  }, [showPopup]);

  const formatData = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString('pt-BR');
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const limparFiltros = () => {
    setSelectedFarmFilter('TODAS');
    setSelectedDateFilter('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Título */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Central de Suporte
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
              <Tractor className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Fazenda: {activeFarm?.name || 'Não selecionada'}</span>
            </span>
          </div>
        <p className="text-slate-500 text-sm mt-1">
          Obtenha ajuda rápida, tire suas dúvidas ou envie uma mensagem direta para a equipe da AgroIntelli.
        </p>
      </div>

      {/* Canais Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Atendimento por E-mail</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">suporte@agrointelli.com.br</p>
            </div>
          </div>
          <a
            href="mailto:suporte@agrointelli.com.br"
            className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            Enviar E-mail
          </a>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Atendimento por Telefone</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">0800 770 2470 / (11) 4003-8922</p>
            </div>
          </div>
          <a
            href="tel:08007702470"
            className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all"
          >
            Ligar Agora
          </a>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ESQUERDA: FAQ + HISTÓRICO COM FILTROS */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Perguntas Frequentes</h2>
                <p className="text-xs text-slate-400">Respostas rápidas para as dúvidas mais comuns</p>
              </div>
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-slate-200/80 rounded-xl overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-bold text-slate-800 text-xs flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 bg-white border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHAMADOS REALIZADOS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Chamados Realizados</h2>
                  <p className="text-xs text-slate-400">Acompanhe seus chamados e veja em qual fazenda foram abertos</p>
                </div>
              </div>

              {(selectedFarmFilter !== 'TODAS' || selectedDateFilter !== '') && (
                <button
                  onClick={limparFiltros}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>

            {/* SEÇÃO DE FILTROS (POR FAZENDA E POR DATA) */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Filtro por Fazenda */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tractor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filtrar por Fazenda</span>
                </label>
                <select
                  value={selectedFarmFilter}
                  onChange={(e) => setSelectedFarmFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="TODAS">Todas as Fazendas</option>
                  {userFarms.map((farm) => (
                    <option key={farm.id} value={farm.name}>
                      {farm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Data */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Filtrar por Data</span>
                </label>
                <input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                />
              </div>
            </div>

            {/* LISTA DE CHAMADOS */}
            {loadingChamados ? (
              <div className="p-8 text-center text-slate-400 space-y-2 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <p className="text-xs font-semibold">Carregando seus chamados...</p>
              </div>
            ) : chamadosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">
                  {chamados.length === 0 
                    ? 'Nenhum chamado enviado até o momento.' 
                    : 'Nenhum chamado encontrado com os filtros selecionados.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {chamadosFiltrados.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate" title={item.subject}>
                        {item.subject || 'Sem assunto'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Enviado em: {formatData(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                      {/* Pílula de Status */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'Em análise'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.status === 'Respondido'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.status || 'Em análise'}
                      </span>

                      {/* Nome da Fazenda ativa no lançamento */}
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Tractor className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Fazenda: <strong className="text-slate-700">{item.fazendaNome || 'Não informada'}</strong></span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* DIREITA: FORMULÁRIO DE MENSAGEM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 space-y-1">
            <h2 className="text-base font-bold text-slate-900">Fale Conosco</h2>
            <p className="text-xs text-slate-400">
              Envie sua mensagem para nossa equipe. Seu chamado será vinculado à fazenda ativa atual (<strong className="text-slate-700">{activeFarm?.name}</strong>).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Sobre o que é a mensagem? <span className="text-[11px] font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Dúvida na contagem, problema na fazenda, etc."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mensagem
              </label>
              <textarea
                rows={5}
                placeholder="Descreva detalhadamente a sua solicitação..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingSend}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loadingSend ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enviando Chamado...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensagem</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>

      {/* POP-UP DE CONFIRMAÇÃO */}
      {showPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Seu chamado foi enviado com sucesso!
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              O chamado foi registrado para a fazenda <strong>{activeFarm?.name}</strong> e nossa equipe retornará em breve.
            </p>

            <button
              onClick={() => setShowPopup(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}