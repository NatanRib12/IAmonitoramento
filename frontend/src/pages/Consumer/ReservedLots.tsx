import React, { useState, useEffect } from 'react';
import { 
  BookmarkCheck, 
  MessageSquare, 
  MapPin, 
  User, 
  Clock,
  Loader2,
  RotateCw,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

export interface LoteReservado {
  id: string;
  quantidadeCabecas: number;
  valorTotal?: number;
  status: string;
  dataReserva: string;
  fazendaNome: string;
  localizacao: string;
  produtorNome: string;
  produtorTelefone: string;
}

export const ReservedLots: React.FC = () => {
  const { userSession } = useFarm();
  const [reservados, setReservados] = useState<LoteReservado[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const [loteModalStatus, setLoteModalStatus] = useState<LoteReservado | null>(null);

  const [modalFeedback, setModalFeedback] = useState<{
    aberto: boolean;
    titulo: string;
    mensagem: string;
    submensagem?: string;
    tipo: 'sucesso' | 'atencao' | 'cancelado';
  }>({
    aberto: false,
    titulo: '',
    mensagem: '',
    tipo: 'sucesso'
  });

  const consumidorId = userSession?.id || localStorage.getItem('@AgroIntelli:userId');

  const carregarReservas = async () => {
    if (!consumidorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/api/lotes/reservados/consumidor/${consumidorId}`);
      const lotesRecebidos = res.data?.lotes || (Array.isArray(res.data) ? res.data : []);

      if (Array.isArray(lotesRecebidos)) {
        const mapeados: LoteReservado[] = lotesRecebidos.map((lote: any) => ({
          id: lote.id || Math.random().toString(),
          quantidadeCabecas: Number(lote.quantidadeCabecas) || 0,
          valorTotal: Number(lote.valorTotal || lote.valor || lote.valor_total) || 0,
          status: lote.status || 'RESERVADO',
          dataReserva: lote.createdAt ? new Date(lote.createdAt).toLocaleDateString('pt-BR') : 'Data n/d',
          fazendaNome: lote.fazenda?.nome || 'Fazenda',
          localizacao: lote.fazenda?.localizacao || 'Não informada',
          produtorNome: lote.fazenda?.usuario?.nome || 'Produtor',
          produtorTelefone: lote.fazenda?.usuario?.telefone || ''
        }));

        setReservados(mapeados);
      }
    } catch (err) {
      console.error('Erro ao buscar lotes reservados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarReservas();
  }, [consumidorId]);

    const handleAceitarProposta = async (id: string) => {
        setProcessandoId(id);
        try {
        await api.put(`/api/lotes/${id}/aceitar-proposta`);
        
        // REMOVE O LOTE DA LISTA DE RESERVAS ATIVAS
        setReservados((prev) => prev.filter((lote) => lote.id !== id));

        setModalFeedback({
            aberto: true,
            titulo: 'Proposta Aceita!',
            mensagem: 'A compra do lote foi confirmada com sucesso! O registro foi transferido para a sua tela de "Compras Anteriores".',
            tipo: 'sucesso'
        });
        } catch (err) {
        console.error('Erro ao aceitar proposta:', err);
        } finally {
        setProcessandoId(null);
        }
    };
    
  const handleRecusarProposta = async (id: string) => {
    setProcessandoId(id);
    try {
      const res = await api.put(`/api/lotes/${id}/recusar-proposta`);
      const eSegundaRecusa = res.data?.segundaRecusa === true;

      if (eSegundaRecusa) {
        setReservados((prev) => prev.filter((lote) => lote.id !== id));

        setModalFeedback({
          aberto: true,
          titulo: 'Processo de Compra Cancelado',
          mensagem: 'Você recusou a proposta pela segunda vez. O lote foi disponibilizado de volta para o mercado público.',
          submensagem: 'Fique tranquilo: você não foi prejudicado nem penalizado de nenhuma forma e continua livre para negociar outros lotes.',
          tipo: 'cancelado'
        });
      } else {
        setReservados((prev) =>
          prev.map((lote) => (lote.id === id ? { ...lote, status: 'RECUSADO_CLIENTE' } : lote))
        );

        setModalFeedback({
          aberto: true,
          titulo: 'Proposta Recusada',
          mensagem: 'O lote retornou para análise do produtor para que ele possa reavaliar os valores e enviar uma nova proposta.',
          submensagem: 'Atenção: Se você recusar a proposta deste lote novamente, o processo de compra será definitivamente encerrado e o lote voltará ao mercado público. Você não será prejudicado por isso.',
          tipo: 'atencao'
        });
      }
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
    } finally {
      setProcessandoId(null);
    }
  };

  const getWhatsAppLink = (telefone: string, quantidade: number, fazenda: string) => {
    if (!telefone) return '#';
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Gostaria de conversar sobre a proposta do lote de ${quantidade} gados da ${fazenda} na AgroIntelli.`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  const getDescricaoStatusConsumidor = (status: string) => {
    switch (status) {
      case 'RESERVADO':
        return {
          titulo: 'Análise Fazendeiro',
          texto: 'É necessário que o produtor analise o lote e dê continuidade no processo.'
        };
      case 'ANALISE_CLIENTE':
        return {
          titulo: 'Analisar proposta',
          texto: 'Pedimos que verifique as informações passadas neste lote, para que possa continuar com o processo de compra.'
        };
      case 'RECUSADO_CLIENTE':
        return {
          titulo: 'Proposta Recusada',
          texto: 'O lote voltará para análise do produtor, pedimos que aguarde um retorno.'
        };
      case 'VENDIDO':
        return {
          titulo: 'Proposta Aceita',
          texto: 'Os valores foram atualizados dentro do sistema e a compra foi confirmada.'
        };
      default:
        return {
          titulo: 'Status em Atualização',
          texto: 'Acompanhe as atualizações da negociação.'
        };
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reservas de Lotes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhe o status das suas reservas e analise as propostas enviadas pelo produtor.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={carregarReservas}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Atualizando...' : 'Atualizar Reservas'}</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Carregando suas reservas...</span>
        </div>
      ) : reservados.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-2 shadow-xs">
          <BookmarkCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Você não possui nenhum lote em reserva no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservados.map((item) => {
            const valorNum = Number(item.valorTotal || 0);
            const isEmAnaliseFazendeiro = item.status === 'RESERVADO';
            const isAnalisarProposta = item.status === 'ANALISE_CLIENTE';
            const isRecusadoCliente = item.status === 'RECUSADO_CLIENTE';
            const isVendido = item.status === 'VENDIDO';

            return (
              <div 
                key={item.id} 
                className={`bg-white p-6 rounded-2xl border shadow-xs space-y-5 transition ${
                  isAnalisarProposta 
                    ? 'border-blue-400 ring-2 ring-blue-500/20' 
                    : isRecusadoCliente
                    ? 'border-rose-300 ring-2 ring-rose-500/10'
                    : isVendido 
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20' 
                    : 'border-slate-200'
                }`}
              >
                {/* STATUS BADGE DINÂMICO */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  {isEmAnaliseFazendeiro && (
                    <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Análise Fazendeiro
                    </span>
                  )}

                  {isAnalisarProposta && (
                    <span className="text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-blue-600 animate-bounce" /> Analisar proposta
                    </span>
                  )}

                  {isRecusadoCliente && (
                    <span className="text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" /> Proposta Recusada
                    </span>
                  )}

                  {isVendido && (
                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Proposta Aceita
                    </span>
                  )}

                  <span className="text-xs text-slate-400 font-semibold">
                    Data: {item.dataReserva}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">{item.fazendaNome}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.localizacao}
                  </p>
                </div>

                {/* BLOCO DE VALORES/QUANTIDADE */}
                <div className="p-4 bg-slate-50 rounded-xl flex items-baseline justify-between border border-slate-100">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{item.quantidadeCabecas}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1.5">gados propostos</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Valor Proposto</span>
                    <span className="text-base font-black text-emerald-700">
                      {valorNum > 0
                        ? valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : 'Aguardando produtor'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-semibold">Produtor / Vendedor:</span>
                  <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    {item.produtorNome}
                  </p>
                </div>

                {/* PAINEL DE AÇÕES DE PROPOSTA: APENAS EM ANALISE_CLIENTE */}
                {isAnalisarProposta && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-700">
                      O produtor definiu a proposta acima. Deseja aceitar ou recusar?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={processandoId === item.id}
                        onClick={() => handleRecusarProposta(item.id)}
                        className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {processandoId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        <span>Recusar</span>
                      </button>

                      <button
                        type="button"
                        disabled={processandoId === item.id}
                        onClick={() => handleAceitarProposta(item.id)}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {processandoId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>Aceitar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* BOTÕES FIXOS: WHATSAPP + ANALISAR PROCESSO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <a
                    href={getWhatsAppLink(item.produtorTelefone, item.quantidadeCabecas, item.fazendaNome)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setLoteModalStatus(item)}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Info className="w-4 h-4 text-slate-600" />
                    <span>Analisar processo</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* POP-UP DE FEEDBACK CUSTOMIZADO */}
      {modalFeedback.aberto && (
        <div 
          onClick={() => setModalFeedback({ aberto: false, titulo: '', mensagem: '', tipo: 'sucesso' })}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 text-center relative"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              modalFeedback.tipo === 'sucesso' 
                ? 'bg-emerald-100 text-emerald-600' 
                : modalFeedback.tipo === 'atencao'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-rose-100 text-rose-600'
            }`}>
              {modalFeedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : modalFeedback.tipo === 'atencao' ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{modalFeedback.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{modalFeedback.mensagem}</p>
              
              {modalFeedback.submensagem && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2 text-left mt-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{modalFeedback.submensagem}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalFeedback({ aberto: false, titulo: '', mensagem: '', tipo: 'sucesso' })}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* POP-UP INFORMATIVO: DESCRIÇÃO DO PROCESSO */}
      {loteModalStatus && (
        <div 
          onClick={() => setLoteModalStatus(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setLoteModalStatus(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Status do Processo</h3>
                <p className="text-xs text-slate-500">{loteModalStatus.fazendaNome}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <strong className="text-xs font-black uppercase text-slate-800 block">
                {getDescricaoStatusConsumidor(loteModalStatus.status).titulo}
              </strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                {getDescricaoStatusConsumidor(loteModalStatus.status).texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLoteModalStatus(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReservedLots;