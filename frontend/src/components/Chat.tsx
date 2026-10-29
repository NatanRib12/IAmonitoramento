// src/components/Chat.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AgroIntelliChatWidgetProps {
  entityId?: string;
  perfil: 'PRODUTOR' | 'CONSUMIDOR';
  telaAtual: string;
  entidadeAtiva?: { nome?: string; id?: string; tipo?: string };
}

const TAMANHO_PADRAO = { width: 480, height: 620 };

const SUGESTOES_POR_TELA: Record<string, string[]> = {
  'grafico-analise': [
    'Qual foi o faturamento total em Outubro de 2026?',
    'Quantas cabeças restam no pasto?',
    'Qual a taxa de comercialização atual?'
  ],
  'lotes-mercado': [
    'Quais lotes tenho disponíveis no mercado?',
    'Como funciona a central de interesses e propostas?'
  ],
  'historico-lotes': [
    'Qual o lote com maior valor de venda?',
    'Resumo das transações concluídas'
  ],
  'analisar-video': [
    'Como funciona a contagem por IA e drone?',
    'Quais modelos de visão computacional são usados?'
  ],
  'mudar-fazenda': [
    'Como funciona o mapeamento via KML/CAR?',
    'Qual a capacidade de suporte dos meus pastos?'
  ],
  'lotes-disponiveis': [
    'Quais lotes auditados por visão computacional estão disponíveis?',
    'Filtrar lotes com mais de 50 cabeças'
  ],
  'radar-alertas': [
    'Como funciona o Radar de Alertas do comprador?',
    'Quais são os meus alertas ativos?'
  ],
  'compras-anteriores': [
    'Resumo das minhas últimas aquisições',
    'Qual foi meu maior volume de compra?'
  ],
  'analise-fazenda': [
    'Qual o tempo médio de giro e velocidade dessa fazenda?',
    'Qual o estoque de gado restante no pasto aqui?'
  ]
};

export default function AgroIntelliChatWidget({
  entityId,
  perfil,
  telaAtual,
  entidadeAtiva
}: AgroIntelliChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para redimensionamento dinâmico
  const [size, setSize] = useState(TAMANHO_PADRAO);
  const [isResizing, setIsResizing] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Reseta o tamanho para o padrão sempre que o chat for fechado
  useEffect(() => {
    if (!isOpen) {
      setSize(TAMANHO_PADRAO);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Lógica de Redimensionamento via Arraste (Canto Superior Esquerdo)
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height
    };
  }, [size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      const deltaX = resizeRef.current.startX - e.clientX;
      const deltaY = resizeRef.current.startY - e.clientY;

      const newWidth = Math.max(340, Math.min(950, resizeRef.current.startW + deltaX));
      const newHeight = Math.max(450, Math.min(900, resizeRef.current.startH + deltaY));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResetSize = () => {
    setSize(TAMANHO_PADRAO);
  };

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
            entityId,
            entidadeAtiva
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
    'O que é a plataforma AgroIntelli?',
    'Como posso utilizar o Copilot nesta tela?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div
          style={{ width: `${size.width}px`, height: `${size.height}px` }}
          className="mb-4 rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-75 relative select-none"
        >
          {/* ALÇA DE REDIMENSIONAMENTO (Canto Superior Esquerdo) */}
          <div
            onMouseDown={startResizing}
            title="Arraste para redimensionar o chat"
            className="absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-30 group flex items-center justify-center"
          >
            <div className="w-2 h-2 border-t-2 border-l-2 border-slate-400 group-hover:border-emerald-400 transition-colors" />
          </div>

          {/* Cabeçalho */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
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

            <div className="flex items-center gap-1">
              {/* BOTÃO DE RESETAR TAMANHO */}
              <button
                onClick={handleResetSize}
                title="Restaurar tamanho padrão"
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
              </button>

              {/* BOTÃO DE FECHAR */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
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
                    ? 'Tire dúvidas sobre a AgroIntelli, auditoria por drones, vendas de lotes e pastos.'
                    : 'Tire dúvidas sobre a vitrine de lotes, radar de alertas e análise de fornecedores.'}
                </p>

                <div className="flex flex-col gap-1.5 w-full">
                  {sugestoes.map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(undefined, sugestao)}
                      className="text-xs text-left bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 px-3 py-2 rounded-xl transition-all flex items-center gap-2 shadow-2xs group cursor-pointer"
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
                  className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed overflow-x-auto">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                  <span>Consultando inteligência da plataforma...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input de Envio */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua dúvida sobre a plataforma..."
              className="flex-1 text-sm bg-slate-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}