// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgroIntelliChatWidgetProps {
  entityId?: string;
  perfil: 'PRODUTOR' | 'CONSUMIDOR';
  telaAtual: string;
}

const SUGESTOES_POR_TELA: Record<string, string[]> = {
  // Produtor
  'grafico-analise': [
    'Qual foi o faturamento total deste ano?',
    'Quantas cabeças restam no pasto?',
    'Resumo de vendas de Outubro'
  ],
  'lotes-mercado': [
    'Quais lotes tenho disponíveis no mercado?',
    'Como crio um novo anúncio de lote?'
  ],
  'historico-lotes': [
    'Qual o lote com maior valor de venda?',
    'Resumo de vendas concluídas'
  ],
  'analisar-video': [
    'Como funciona a contagem por IA?',
    'Quais formatos de vídeo são aceitos?'
  ],
  'mudar-fazenda': [
    'Qual a capacidade total dos meus pastos?',
    'Resumo da fazenda selecionada'
  ],
  // Consumidor / Comprador
  'lotes-disponiveis': [
    'Quais lotes de gado estão disponíveis no mercado?',
    'Filtrar lotes com mais de 50 cabeças'
  ],
  'radar-alertas': [
    'Quais são os meus alertas de compra ativos?',
    'Como criar um alerta para a região de Barretos?'
  ],
  'compras-anteriores': [
    'Resumo das minhas últimas aquisições',
    'Qual foi meu maior volume de compra?'
  ]
};

export default function AgroIntelliChatWidget({ entityId, perfil, telaAtual }: AgroIntelliChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    setInputMessage('');

    const updatedMessages: ChatMessage[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3333/api/chat/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: textToSend,
          contexto: {
            perfil,
            telaAtual,
            entityId
          },
          historicoMensagens: updatedMessages
        })
      });

      const data = await response.json();

      if (data.resposta) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.resposta }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Desculpe, ocorreu uma falha ao processar a solicitação.' }
        ]);
      }
    } catch (error) {
      console.error('Erro no chat:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro de conexão com o servidor do AgroIntelli Copilot.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sugestoes = SUGESTOES_POR_TELA[telaAtual] || [
    'Como posso utilizar o AgroIntelli Copilot?',
    'Quais informações posso consultar nesta tela?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        /* Janela Expandida: w-[440px] sm:w-[500px] h-[620px] */
        <div className="mb-4 h-[620px] w-[440px] sm:w-[500px] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300">
          
          {/* Cabeçalho */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-slate-950 font-bold">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-none">AgroIntelli Copilot</h3>
                <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block mt-1">
                  Modo: {perfil} • Tela: {telaAtual}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 && (
              <div className="text-center my-auto py-6 px-2 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bot size={24} />
                </div>
                <h4 className="font-medium text-slate-800 text-sm mb-1">
                  {perfil === 'PRODUTOR' ? 'Assistente do Produtor Rural' : 'Assistente do Comprador / Frigorífico'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {perfil === 'PRODUTOR'
                    ? 'Consulte dados da sua fazenda, vendas de lotes, pastos e contagens por drone.'
                    : 'Consulte lotes disponíveis para compra no mercado, alertas do radar e histórico de aquisições.'}
                </p>

                {/* Chips de Sugestões Rápidas */}
                <div className="flex flex-col gap-1.5 w-full">
                  {sugestoes.map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(undefined, sugestao)}
                      className="text-xs text-left bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 px-3 py-2 rounded-xl transition-all flex items-center gap-2 shadow-2xs group"
                    >
                      <Sparkles size={14} className="text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                      <span>{sugestao}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                   {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                        <ReactMarkdown>
                        {msg.content}
                        </ReactMarkdown>
                    </div>
                    ) : (
                    msg.content
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-2xs flex items-center gap-2 text-slate-500 text-xs">
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                  <span>Consultando informações da plataforma...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Campo de Entrada de Texto */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite a sua mensagem..."
              className="flex-1 text-sm bg-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}