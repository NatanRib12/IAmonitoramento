import React, { useState, useEffect } from 'react';
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
  MessageSquare
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface ChamadoItem {
  id: string;
  subject: string;
  date: string;
  status: 'Em análise' | 'Respondido' | 'Concluído';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estados do formulário
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Lista de chamados realizados pelo usuário (Sem mensagem, apenas data e assunto)
  const [chamados, setChamados] = useState<ChamadoItem[]>([
    {
      id: 'ch-01',
      subject: 'Dúvida sobre contagem de gado em área de sombra de árvores',
      date: '02/10/2026',
      status: 'Respondido'
    },
    {
      id: 'ch-02',
      subject: 'Solicitação de alteração nos dados do proprietário da Fazenda Santa Maria',
      date: '28/09/2026',
      status: 'Concluído'
    }
  ]);

  // Estado do pop-up
  const [showPopup, setShowPopup] = useState(false);

  // Filtro dinâmico das perguntas
  const filteredFaqs = faqList.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const dataHoje = new Date().toLocaleDateString('pt-BR');

    // Adiciona o novo chamado ao histórico
    const novoChamado: ChamadoItem = {
      id: `ch-${Date.now()}`,
      subject: subject.trim(),
      date: dataHoje,
      status: 'Em análise'
    };

    setChamados((prev) => [novoChamado, ...prev]);

    setShowPopup(true);
    setSubject('');
    setMessage('');
  };

  // Temporizador para o pop-up desaparecer automaticamente após 3 minutos (180.000 ms)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showPopup) {
      timer = setTimeout(() => {
        setShowPopup(false);
      }, 3 * 60 * 1000); // 3 minutos
    }
    return () => clearTimeout(timer);
  }, [showPopup]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Título e Descrição da Página */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Central de Suporte
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Obtenha ajuda rápida, tire suas dúvidas ou envie uma mensagem direta para a equipe da AgroIntelli.
        </p>
      </div>

      {/* Duas Opções de Contato Direto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cartão 1: Suporte por E-mail */}
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

        {/* Cartão 2: Suporte Por Telefone */}
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

      {/* Grid Principal: Esquerda (FAQ + Chamados) / Direita (Formulário) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA DA ESQUERDA: FAQ + HISTÓRICO DE CHAMADOS */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* FAQ - Perguntas Frequentes */}
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

            {/* Lista de Acordeões */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Nenhuma pergunta encontrada para sua busca.
                </p>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200/80 rounded-xl overflow-hidden transition-all"
                    >
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
                })
              )}
            </div>
          </div>

          {/* NOVO: HISTÓRICO DE CHAMADOS REALIZADOS (POSICIONADO LOGO ABAIXO DO FAQ) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Chamados Realizados</h2>
                <p className="text-xs text-slate-400">Acompanhe os seus envios anteriores e o status do atendimento</p>
              </div>
            </div>

            {chamados.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Nenhum chamado enviado até o momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {chamados.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate" title={item.subject}>
                        {item.subject}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Enviado em: {item.date}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                      item.status === 'Em análise'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : item.status === 'Respondido'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* COLUNA DA DIREITA: FORMULÁRIO DE MENSAGEM */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 space-y-1">
            <h2 className="text-base font-bold text-slate-900">Fale Conosco</h2>
            <p className="text-xs text-slate-400">
              Envie sua mensagem ou reclamação para nossa equipe técnica. Respondemos em até 24h.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input 1: Sobre o que é a mensagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Sobre o que é a mensagem?
              </label>
              <input
                type="text"
                placeholder="Ex: Dúvida na contagem, problema na fazenda, etc."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                required
              />
            </div>

            {/* Input 2: Mensagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Mensagem
              </label>
              <textarea
                rows={5}
                placeholder="Descreva detalhadamente a sua solicitação ou reclamação..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all resize-none"
                required
              />
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Mensagem
            </button>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" /> Tempo médio de resposta: 2 a 4 horas úteis
            </p>

          </form>
        </div>

      </div>

      {/* Pop-up de Confirmação (Desaparece após 3 minutos) */}
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
              Nossa equipe já recebeu sua mensagem e retornará o contato o mais rápido possível.
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