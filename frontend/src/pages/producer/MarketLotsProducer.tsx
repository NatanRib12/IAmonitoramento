import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Building2, 
  User, 
  MessageSquare, 
  Loader2,
  Tag,
  Hash,
  X,
  DollarSign,
  RotateCw,
  XCircle,
  Info,
  Send,
  PlusCircle,
  Boxes,
  Archive
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

export interface MarketLotItem {
  id: string;
  quantidadeCabecas: number;
  quantidadeNegociada: number;
  valorTotal?: number;
  status: 'DISPONIVEL' | 'RESERVADO' | 'ANALISE_CLIENTE' | 'RECUSADO_CLIENTE' | 'VENDIDO' | 'RESERVA';
  createdAt: string;
  videoProcessadoUrl?: string;
  metadadosOrigem?: {
    qtdIaOriginal: number;
    qtdProposta: number;
  };
  interessado?: {
    consumidorNome: string;
    consumidorEmpresa: string;
    consumidorTelefone: string;
    dataInteresse: string;
  };
}

export const MarketLotsProducer: React.FC = () => {
  const { activeFarm } = useFarm();
  
  const [abaAtiva, setAbaAtiva] = useState<'anunciados' | 'interesse' | 'reserva'>('anunciados');
  const [lotes, setLotes] = useState<MarketLotItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalNegociacaoAberto, setModalNegociacaoAberto] = useState(false);
  const [loteEmAjuste, setLoteEmAjuste] = useState<MarketLotItem | null>(null);

  // Modal para Sobras de Gado (Abordagem 1 e 2)
  const [modalSobraAberto, setModalSobraAberto] = useState(false);
  const [sobraQuantidade, setSobraQuantidade] = useState<number>(0);
  const [opcaoSobraSelecionada, setOpcaoSobraSelecionada] = useState<'CRIAR_LOTE' | 'RESERVA'>('CRIAR_LOTE');
  const [valorNovoLoteInput, setValorNovoLoteInput] = useState<number | ''>('');

  // Pop-up Informativo ("Analisar processo")
  const [loteModalStatus, setLoteModalStatus] = useState<MarketLotItem | null>(null);

  // Pop-up de Sucesso Customizado
  const [modalSucesso, setModalSucesso] = useState<{ aberto: boolean; titulo: string; mensagem: string }>({
    aberto: false,
    titulo: '',
    mensagem: ''
  });
  
  const [qtdGadoInput, setQtdGadoInput] = useState<number | ''>('');
  const [valorDinheiroInput, setValorDinheiroInput] = useState<number | ''>('');
  const [processandoAjuste, setProcessandoAjuste] = useState(false);

  const carregarLotesDoMercado = async () => {
    if (!activeFarm?.id) return;
    setLoading(true);

    try {
      const res = await api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`);
      if (res.data?.lotes) {
        const lotesMapeados: MarketLotItem[] = res.data.lotes
          .filter((l: any) => 
            l.status === 'DISPONIVEL' || 
            l.status === 'RESERVADO' || 
            l.status === 'ANALISE_CLIENTE' || 
            l.status === 'RECUSADO_CLIENTE' ||
            l.status === 'RESERVA'
          )
          .map((l: any) => {
            const temInteressado = ['RESERVADO', 'ANALISE_CLIENTE', 'RECUSADO_CLIENTE'].includes(l.status);

            let propQtd = Number(l.quantidadeCabecas || 0);
            let propVal = Number(l.valorTotal || l.valor || l.valor_total || l.valorLote) || 0;
            let metadadosOrigem: { qtdIaOriginal: number; qtdProposta: number } | undefined = undefined;

            if (l.consumerPhone && typeof l.consumerPhone === 'string' && l.consumerPhone.startsWith('{')) {
              try {
                const parsed = JSON.parse(l.consumerPhone);
                if (parsed.propostaQtd) propQtd = Number(parsed.propostaQtd);
                if (parsed.propostaValor !== undefined) propVal = Number(parsed.propostaValor);
                if (parsed.qtdIaOriginal) {
                  metadadosOrigem = {
                    qtdIaOriginal: Number(parsed.qtdIaOriginal),
                    qtdProposta: Number(parsed.qtdProposta || 0)
                  };
                }
              } catch (e) {
                console.error('Erro ao ler metadados do lote:', e);
              }
            }

            return {
              id: l.id,
              quantidadeCabecas: Number(l.quantidadeCabecas || 0),
              quantidadeNegociada: propQtd,
              valorTotal: propVal,
              status: l.status,
              createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : 'Data n/d',
              videoProcessadoUrl: l.videoProcessadoUrl || '',
              metadadosOrigem,
              interessado: temInteressado ? {
                consumidorNome: l.consumerName || 'Comprador Interessado',
                consumidorEmpresa: l.consumerCompany || 'Frigorífico / Empresa',
                consumidorTelefone: l.consumerPhone || '',
                dataInteresse: l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : 'Data n/d'
              } : undefined
            };
          });

        setLotes(lotesMapeados);
      }
    } catch (err) {
      console.error('Erro ao buscar lotes no mercado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLotesDoMercado();
  }, [activeFarm?.id]);

  const lotesAnunciados = lotes.filter((l) => l.status === 'DISPONIVEL');
  const lotesComInteresse = lotes.filter((l) => 
    l.status === 'RESERVADO' || 
    l.status === 'ANALISE_CLIENTE' || 
    l.status === 'RECUSADO_CLIENTE' || 
    !!l.interessado
  );
  const lotesEmReserva = lotes.filter((l) => l.status === 'RESERVA');

  const getWhatsAppLink = (telefone?: string, quantidade?: number) => {
    if (!telefone) return '#';
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Vi que você reservou o meu lote de ${quantidade} gados na plataforma AgroIntelli. Vamos alinhar os detalhes?`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  const handleAbrirPopUp = (lote: MarketLotItem) => {
    if (lote.status === 'ANALISE_CLIENTE') return;
    setLoteEmAjuste(lote);
    setQtdGadoInput(lote.quantidadeNegociada || lote.quantidadeCabecas);
    setValorDinheiroInput(lote.valorTotal || '');
    setModalNegociacaoAberto(true);
  };

  const handleSubmeterFormularioProposta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteEmAjuste || !qtdGadoInput) return;

    const novaQtd = Number(qtdGadoInput);
    const qtdOriginal = loteEmAjuste.quantidadeCabecas;

    if (novaQtd > qtdOriginal) {
      alert(`A quantidade negociada (${novaQtd}) não pode ser maior do que a quantidade analisada do lote (${qtdOriginal} cabeças).`);
      return;
    }

    if (novaQtd < qtdOriginal) {
      const sobra = qtdOriginal - novaQtd;
      setSobraQuantidade(sobra);
      setValorNovoLoteInput('');
      setOpcaoSobraSelecionada('CRIAR_LOTE');
      setModalSobraAberto(true);
    } else {
      executarEnvioProposta(novaQtd, 'NENHUMA');
    }
  };

  const executarEnvioProposta = async (novaQtd: number, opcaoDestinoSobra: 'CRIAR_LOTE' | 'RESERVA' | 'NENHUMA') => {
    if (!loteEmAjuste) return;

    setProcessandoAjuste(true);

    try {
      const novoValorProposta = valorDinheiroInput !== '' ? Number(valorDinheiroInput) : 0;

      await api.put(`/api/lotes/${loteEmAjuste.id}/confirmar-negociacao`, {
        quantidadeCabecas: novaQtd,
        valorTotal: novoValorProposta
      });

      if (opcaoDestinoSobra === 'CRIAR_LOTE' && sobraQuantidade > 0 && activeFarm?.id) {
        const valorNovoLote = valorNovoLoteInput !== '' ? Number(valorNovoLoteInput) : 0;

        await api.post('/api/lotes/publicar', {
          fazendaId: activeFarm.id,
          quantidadeCabecas: sobraQuantidade,
          valorTotal: valorNovoLote,
          videoProcessadoUrl: loteEmAjuste.videoProcessadoUrl || ''
        });
      }

      if (opcaoDestinoSobra === 'RESERVA' && sobraQuantidade > 0 && activeFarm?.id) {
        const metadadosReserva = JSON.stringify({
          qtdIaOriginal: loteEmAjuste.quantidadeCabecas,
          qtdProposta: novaQtd,
          dataCriacaoOrigem: loteEmAjuste.createdAt
        });

        await api.post('/api/videos/salvar-galeria', {
          fazendaId: activeFarm.id,
          quantidadeCabecas: sobraQuantidade,
          valorTotal: 0,
          videoOriginalUrl: loteEmAjuste.videoProcessadoUrl || '',
          videoProcessadoUrl: loteEmAjuste.videoProcessadoUrl || '',
          status: 'RESERVA',
          consumerPhone: metadadosReserva
        });
      }

      setModalNegociacaoAberto(false);
      setModalSobraAberto(false);
      setLoteEmAjuste(null);

      await carregarLotesDoMercado();

      setModalSucesso({
        aberto: true,
        titulo: 'Proposta Enviada!',
        mensagem: opcaoDestinoSobra === 'CRIAR_LOTE'
          ? `Proposta de ${novaQtd} cabeças enviada! O lote com as ${sobraQuantidade} cabeças restantes foi anunciado no mercado.`
          : opcaoDestinoSobra === 'RESERVA'
          ? `Proposta de ${novaQtd} cabeças enviada! As ${sobraQuantidade} cabeças restantes foram armazenadas na sua Reserva do Rebanho.`
          : 'O status do lote foi alterado para "Análise Cliente". Aguarde a decisão do consumidor.'
      });
    } catch (err) {
      console.error('Erro ao enviar proposta:', err);
      alert('Ocorreu uma falha ao processar a proposta. Tente novamente.');
    } finally {
      setProcessandoAjuste(false);
    }
  };

  const getDescricaoStatusProdutor = (status: string) => {
    switch (status) {
      case 'RESERVADO':
        return {
          titulo: 'Lote Reservado pelo Comprador',
          texto: 'Um comprador reservou este lote. Clique em "Enviar Proposta" para definir a quantidade final de gado e o valor total negociado.'
        };
      case 'ANALISE_CLIENTE':
        return {
          titulo: 'Análise do Cliente',
          texto: 'Sua proposta foi enviada com sucesso ao comprador. O lote está aguardando a decisão dele. Você não poderá alterar a proposta enquanto o cliente analisa.'
        };
      case 'RECUSADO_CLIENTE':
        return {
          titulo: 'Proposta Recusada pelo Comprador',
          texto: 'O comprador recusou a proposta anterior. Você pode clicar em "Refazer Proposta" para reavaliar a quantidade ou valor e reenviar.'
        };
      case 'VENDIDO':
        return {
          titulo: 'Venda Confirmada',
          texto: 'O comprador aceitou a proposta! A negociação foi concluída com sucesso.'
        };
      case 'RESERVA':
        return {
          titulo: 'Gado em Reserva',
          texto: 'Este lote contém gado sobressalente guardado na reserva da propriedade para adição em futuros anúncios.'
        };
      default:
        return {
          titulo: 'Aguardando Ação',
          texto: 'Acompanhe as interações do mercado neste lote.'
        };
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lotes Disponíveis no Mercado
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{activeFarm?.name || 'Sua Fazenda'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os lotes ativos da sua propriedade, sobras de rebanho e acompanhe o interesse direto dos compradores.
          </p>
        </div>
      </div>

      {/* Botões de Abas + REFRESH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 w-full sm:w-max gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setAbaAtiva('anunciados')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              abaAtiva === 'anunciados'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Lotes Anunciados ({lotesAnunciados.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('interesse')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              abaAtiva === 'interesse'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Interesse do Mercado ({lotesComInteresse.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('reserva')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
              abaAtiva === 'reserva'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-4 h-4 text-emerald-600" />
            <span>Reserva de Rebanho ({lotesEmReserva.length})</span>
          </button>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={carregarLotesDoMercado}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Atualizando...' : 'Atualizar Dados'}</span>
        </button>
      </div>

      {loading && lotes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 flex items-center justify-center gap-2 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Carregando lotes do mercado...</span>
        </div>
      ) : (
        <>
          {/* ABA 1: LOTES ANUNCIADOS */}
          {abaAtiva === 'anunciados' && (
            <div className="space-y-4">
              {lotesAnunciados.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3 shadow-xs">
                  <Tag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhum lote anunciado no momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lotesAnunciados.map((lote) => {
                    const valorNum = Number(lote.valorTotal || 0);

                    return (
                      <div
                        key={lote.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
                      >
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                            Disponível
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {lote.createdAt}
                          </span>
                        </div>

                        <div className="flex items-baseline flex-wrap gap-1.5">
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {lote.quantidadeCabecas}
                          </span>
                          <span className="text-xs font-bold text-slate-500">gados analisados</span>
                          
                          {valorNum > 0 ? (
                            <span className="text-sm font-extrabold text-emerald-700 ml-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 italic ml-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                              Sob consulta
                            </span>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>Aguardando demonstração de interesse dos compradores.</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: INTERESSE DO MERCADO */}
          {abaAtiva === 'interesse' && (
            <div className="space-y-4">
              {lotesComInteresse.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3 shadow-xs">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhum comprador demonstrou interesse ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lotesComInteresse.map((lote) => {
                    const valorNum = Number(lote.valorTotal || 0);
                    const isReservado = lote.status === 'RESERVADO';
                    const isAnaliseCliente = lote.status === 'ANALISE_CLIENTE';
                    const isRecusado = lote.status === 'RECUSADO_CLIENTE';

                    return (
                      <div
                        key={lote.id}
                        className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition relative ${
                          isRecusado
                            ? 'border-rose-300 ring-2 ring-rose-400/20'
                            : isAnaliseCliente
                            ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                            : 'border-amber-300 ring-2 ring-amber-400/20'
                        }`}
                      >
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          {isReservado && (
                            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              Lote reservado
                            </span>
                          )}

                          {isAnaliseCliente && (
                            <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                              Análise Cliente
                            </span>
                          )}

                          {isRecusado && (
                            <span className="text-[10px] font-extrabold bg-rose-50 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Proposta Recusada
                            </span>
                          )}

                          <span className="text-xs text-slate-400 font-semibold">
                            {lote.createdAt}
                          </span>
                        </div>

                        <div>
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {lote.quantidadeNegociada}
                          </span>
                          <span className="text-xs font-bold text-slate-500 ml-1.5">cabeças negociadas</span>
                          {valorNum > 0 ? (
                            <p className="text-sm font-extrabold text-emerald-700 mt-1">
                              {valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-amber-700 mt-1 italic">
                              Aguardando sua proposta
                            </p>
                          )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 border border-slate-200/80 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{lote.interessado?.consumidorNome || 'Comprador'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {lote.interessado?.consumidorEmpresa || 'Empresa'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isAnaliseCliente}
                            onClick={() => handleAbrirPopUp(lote)}
                            className={`py-2.5 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 ${
                              isAnaliseCliente
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {isAnaliseCliente 
                                ? 'Proposta Enviada' 
                                : isRecusado 
                                ? 'Refazer Proposta' 
                                : 'Enviar Proposta'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLoteModalStatus(lote)}
                            className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-600" />
                            <span>Analisar processo</span>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: RESERVA DE REBANHO (ABORDAGEM 2) */}
          {abaAtiva === 'reserva' && (
            <div className="space-y-4">
              {lotesEmReserva.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3 shadow-xs">
                  <Archive className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhum gado armazenado na reserva.</p>
                  <p className="text-xs text-slate-400">As sobras não comercializadas em propostas ficam guardadas aqui para uso em lançamentos futuros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lotesEmReserva.map((lote) => {
                    return (
                      <div
                        key={lote.id}
                        className="bg-white rounded-2xl border border-emerald-300 p-6 shadow-xs space-y-4 hover:border-emerald-400 transition"
                      >
                        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                            <Archive className="w-3 h-3 text-emerald-600" />
                            Em Reserva
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {lote.createdAt}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                              {lote.quantidadeCabecas}
                            </span>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              cabeças sobressalentes
                            </span>
                          </div>
                        </div>

                        {lote.metadadosOrigem && (
                          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                            <p className="text-[11px] text-slate-500">
                              IA Inicial: <strong className="text-slate-800">{lote.metadadosOrigem.qtdIaOriginal} cabeças</strong>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Proposta Negociada: <strong className="text-slate-800">{lote.metadadosOrigem.qtdProposta} cabeças</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* POP-UP FORMULÁRIO 1: ENVIAR PROPOSTA */}
      {modalNegociacaoAberto && loteEmAjuste && (
        <div 
          onClick={() => setModalNegociacaoAberto(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setModalNegociacaoAberto(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className={`p-2.5 rounded-xl ${
                loteEmAjuste.status === 'RECUSADO_CLIENTE' 
                  ? 'bg-rose-100 text-rose-800' 
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {loteEmAjuste.status === 'RECUSADO_CLIENTE' ? 'Refazer Proposta' : 'Enviar Proposta de Venda'}
                </h3>
                <p className="text-xs text-slate-500">{loteEmAjuste.interessado?.consumidorNome || 'Comprador'}</p>
              </div>
            </div>

            {loteEmAjuste.status === 'RECUSADO_CLIENTE' && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
                O consumidor recusou a última proposta. Defina uma nova quantidade ou ajuste o valor total do lote para reenviar.
              </div>
            )}

            <a
              href={getWhatsAppLink(loteEmAjuste.interessado?.consumidorTelefone, loteEmAjuste.quantidadeNegociada)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Falar no WhatsApp com o Consumidor</span>
            </a>

            <form onSubmit={handleSubmeterFormularioProposta} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 block">
                    Quantidade de Gado Negociada *
                  </label>
                  <span className="text-[11px] font-extrabold text-slate-400">
                    Max: {loteEmAjuste.quantidadeCabecas}
                  </span>
                </div>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    max={loteEmAjuste.quantidadeCabecas}
                    value={qtdGadoInput}
                    onChange={(e) => setQtdGadoInput(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Valor Total Negociado (R$) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 85000.00"
                    value={valorDinheiroInput}
                    onChange={(e) => setValorDinheiroInput(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNegociacaoAberto(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={processandoAjuste}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {processandoAjuste ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>{loteEmAjuste.status === 'RECUSADO_CLIENTE' ? 'Reenviar Proposta' : 'Enviar Proposta'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP FORMULÁRIO 2: DESTINO DO REBANHO RESTANTE */}
      {modalSobraAberto && loteEmAjuste && (
        <div 
          onClick={() => setModalSobraAberto(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-[60] animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setModalSobraAberto(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Destino do Rebanho Restante
                </h3>
                <p className="text-xs text-slate-500">
                  Defina o que fazer com os gados que não entraram na proposta
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Lote Analisado: <strong>{loteEmAjuste.quantidadeCabecas} cabeças</strong></span>
                <span>Proposta: <strong>{qtdGadoInput} cabeças</strong></span>
              </div>
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  Restante no Pasto:
                </span>
                <span className="text-lg font-black text-amber-700 bg-white px-3 py-0.5 rounded-lg border border-amber-300">
                  {sobraQuantidade} cabeças
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700">
                Escolha como deseja tratar o rebanho restante:
              </p>

              {/* OPÇÃO 1: ABORDAGEM 1 */}
              <div 
                onClick={() => setOpcaoSobraSelecionada('CRIAR_LOTE')}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-3 ${
                  opcaoSobraSelecionada === 'CRIAR_LOTE'
                    ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    opcaoSobraSelecionada === 'CRIAR_LOTE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      Criar novo lote com o restante e publicar diretamente no mercado
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Um novo lote contendo as <strong>{sobraQuantidade} cabeças restantes</strong> será criado e ficará disponível no mercado.
                    </p>
                  </div>
                </div>

                {opcaoSobraSelecionada === 'CRIAR_LOTE' && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="pt-2 border-t border-emerald-200/80 space-y-1.5"
                  >
                    <label className="text-xs font-bold text-slate-800 block">
                      Valor Total do Novo Lote de {sobraQuantidade} cabeças (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 15000.00 (ou deixe em branco para 'Sob consulta')"
                        value={valorNovoLoteInput}
                        onChange={(e) => setValorNovoLoteInput(e.target.value ? Number(e.target.value) : '')}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* OPÇÃO 2: ABORDAGEM 2 (RESERVA VERDE) */}
              <div 
                onClick={() => setOpcaoSobraSelecionada('RESERVA')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  opcaoSobraSelecionada === 'RESERVA'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  opcaoSobraSelecionada === 'RESERVA' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Archive className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      Armazenar na Reserva do Rebanho
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Armazena as <strong>{sobraQuantidade} cabeças sobressalentes</strong> na sua aba de Reserva de Rebanho para você gerenciar ou utilizar em novos vídeos.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalSobraAberto(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                disabled={processandoAjuste}
                onClick={() => executarEnvioProposta(Number(qtdGadoInput), opcaoSobraSelecionada)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {processandoAjuste ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar e Enviar Proposta</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POP-UP DE CONFIRMAÇÃO DE ENVIO */}
      {modalSucesso.aberto && (
        <div 
          onClick={() => setModalSucesso({ aberto: false, titulo: '', mensagem: '' })}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 text-center relative"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{modalSucesso.titulo}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{modalSucesso.mensagem}</p>
            </div>

            <button
              type="button"
              onClick={() => setModalSucesso({ aberto: false, titulo: '', mensagem: '' })}
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
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Detalhes do Processo</h3>
                <p className="text-xs text-slate-500">Lote com {loteModalStatus.quantidadeCabecas} gados</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <strong className="text-xs font-black uppercase text-slate-800 block">
                {getDescricaoStatusProdutor(loteModalStatus.status).titulo}
              </strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                {getDescricaoStatusProdutor(loteModalStatus.status).texto}
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

export default MarketLotsProducer;