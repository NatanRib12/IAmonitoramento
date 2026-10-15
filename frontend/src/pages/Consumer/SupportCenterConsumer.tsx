import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  History,
  MessageSquare,
  Loader2,
  Calendar,
  RotateCcw,
  Building2,
  ShoppingBag
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

// Perguntas Frequentes voltadas para o Consumidor / Comprador
const faqListConsumer: FAQItem[] = [
  {
    question: 'Como funciona a reserva de lotes na plataforma?',
    answer: 'Ao navegar pelos lotes no Mercado, clique no botão "Reservar Lote". O lote mudará para o status de reserva e ficará vinculado a você enquanto o produtor analisa os detalhes e envia a proposta comercial com quantidade e valores.'
  },
  {
    question: 'O que acontece se eu recusar uma proposta enviada pelo produtor?',
    answer: 'Na primeira recusa, a proposta retorna para o produtor reavaliar os valores. Se você recusar a proposta do mesmo lote pela segunda vez, o processo de compra é encerrado sem nenhuma penalidade para você, e o lote volta a ficar público no mercado.'
  },
  {
    question: 'Onde posso visualizar as compras que já finalizei?',
    answer: 'Todas as propostas aceitas e compras confirmadas ficam registradas na aba "Compras Anteriores". Lá você encontra o histórico detalhado separado por mês, valor total investido e o contato direto com o vendedor.'
  },
  {
    question: 'Como funciona o Radar de Alertas de Lotes?',
    answer: 'No menu "Radar de Alertas", você pode cadastrar a região e a quantidade de gado que deseja comprar. Assim que um produtor publicar um lote auditado por IA compatível com seus critérios, você receberá um alerta imediato.'
  },
  {
    question: 'Como entrar em contato direto com o produtor do lote?',
    answer: 'Em cada card de lote na sua lista de reservas ou no mercado, disponibilizamos o botão "Falar no WhatsApp", que abre uma conversa direta com o fazendeiro responsável pelo lote.'
  }
];

export function SupportCenterConsumer() {
  const { userSession } = useFarm();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estados do formulário
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loadingSend, setLoadingSend] = useState(false);

  // Lista de chamados vindos da API
  const [chamados, setChamados] = useState<ChamadoItem[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);

  // Estado de Filtro por Data
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  // Estado do pop-up de confirmação
  const [showPopup, setShowPopup] = useState(false);

  const consumidorId = userSession?.id || localStorage.getItem('@AgroIntelli:userId');
  const nomeEmpresa = userSession?.empresa || localStorage.getItem('@AgroIntelli:userEmpresa') || 'Comprador Parceiro';

  // Busca histórico de chamados do consumidor no banco de dados
  useEffect(() => {
    if (consumidorId) {
      setLoadingChamados(true);
      api.get(`/api/chamados/usuario/${consumidorId}`)
        .then((res) => {
          if (res.data?.sucesso && Array.isArray(res.data.chamados)) {
            setChamados(res.data.chamados);
          }
        })
        .catch((err) => console.error('Erro ao buscar chamados do consumidor:', err))
        .finally(() => setLoadingChamados(false));
    } else {
      setLoadingChamados(false);
    }
  }, [consumidorId]);

  // Filtro Dinâmico de Chamados por Data
  const chamadosFiltrados = useMemo(() => {
    return chamados.filter((item) => {
      if (selectedDateFilter) {
        if (!item.createdAt) return false;
        const dataItemISO = new Date(item.createdAt).toISOString().split('T')[0];
        if (dataItemISO !== selectedDateFilter) return false;
      }
      return true;
    });
  }, [chamados, selectedDateFilter]);

  // Envio do formulário de mensagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    if (!consumidorId) {
      alert('Sessão não identificada. Por favor, faça login novamente.');
      return;
    }

    setLoadingSend(true);

    try {
      const response = await api.post('/api/chamados', {
        usuarioId: consumidorId,
        subject: subject.trim(),
        message: message.trim(),
        fazendaNome: `Empresa: ${nomeEmpresa}`
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Título e Badge da Empresa */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Central de Suporte ao Comprador
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{nomeEmpresa}</span>
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Obtenha ajuda com suas negociações, tire dúvidas sobre propostas ou envie uma mensagem direta para a equipe AgroIntelli.
        </p>
      </div>

      {/* Canais Rápidos de Atendimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Atendimento por E-mail</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">compradores@agrointelli.com.br</p>
            </div>
          </div>
          <a
            href="mailto:compradores@agrointelli.com.br"
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
        
        {/* ESQUERDA: FAQ + HISTÓRICO DE CHAMADOS */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* FAQ DO CONSUMIDOR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Perguntas Frequentes</h2>
                <p className="text-xs text-slate-400">Respostas rápidas sobre compras, propostas e reservas</p>
              </div>
            </div>

            <div className="space-y-3">
              {faqListConsumer.map((faq, idx) => {
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
                  <p className="text-xs text-slate-400">Acompanhe as solicitações enviadas para a equipe de suporte</p>
                </div>
              </div>

              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar Filtro</span>
                </button>
              )}
            </div>

            {/* FILTRO POR DATA */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Filtrar por Data de Envio:</span>
              </label>
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              />
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
                    : 'Nenhum chamado encontrado para a data selecionada.'}
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.status === 'Em análise'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.status === 'Respondido'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.status || 'Em análise'}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Origem: <strong className="text-slate-700">{item.fazendaNome || nomeEmpresa}</strong></span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* DIREITA: FORMULÁRIO DE ENVIO DE MENSAGEM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 space-y-1">
            <h2 className="text-base font-bold text-slate-900">Fale Conosco</h2>
            <p className="text-xs text-slate-400">
              Envie sua dúvida ou solicitação. Seu chamado será vinculado à sua conta corporativa (<strong className="text-slate-700">{nomeEmpresa}</strong>).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Sobre o que é a mensagem? <span className="text-[11px] font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Dúvida sobre proposta, negociação de lote, etc."
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
                placeholder="Descreva detalhadamente sua solicitação..."
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
              O chamado foi registrado para <strong>{nomeEmpresa}</strong> e nossa equipe de suporte retornará em breve.
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

export default SupportCenterConsumer;