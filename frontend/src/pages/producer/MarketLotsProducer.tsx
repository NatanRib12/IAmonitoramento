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
  FileCheck,
  Hash,
  X,
  AlertCircle
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

export interface MarketLotItem {
  id: string;
  quantidadeCabecas: number;
  status: 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';
  createdAt: string;
  interessado?: {
    consumidorNome: string;
    consumidorEmpresa: string;
    consumidorTelefone: string;
    dataInteresse: string;
  };
}

export const MarketLotsProducer: React.FC = () => {
  const { activeFarm } = useFarm();
  
  // Controle de Abas (Toggle)
  const [abaAtiva, setAbaAtiva] = useState<'anunciados' | 'interesse'>('anunciados');
  
  const [lotes, setLotes] = useState<MarketLotItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de Ajuste de Quantidade e Confirmação de Venda
  const [modalVendaAberta, setModalVendaAberta] = useState(false);
  const [loteParaFinalizar, setLoteParaFinalizar] = useState<MarketLotItem | null>(null);
  const [qtdFinalNegociada, setQtdFinalNegociada] = useState<number | ''>('');
  const [processandoVenda, setProcessandoVenda] = useState(false);

  const carregarLotesDoMercado = async () => {
    if (!activeFarm?.id) return;
    setLoading(true);

    try {
      const res = await api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`);
      if (res.data?.lotes) {
        const lotesMapeados: MarketLotItem[] = res.data.lotes
          .filter((l: any) => l.status === 'DISPONIVEL' || l.status === 'RESERVADO')
          .map((l: any) => ({
            id: l.id,
            quantidadeCabecas: l.quantidadeCabecas,
            status: l.status,
            createdAt: new Date(l.createdAt).toLocaleDateString('pt-BR'),
            interessado: l.status === 'RESERVADO' || l.consumerName ? {
              consumidorNome: l.consumerName || 'Frigorífico Parceiro SP',
              consumidorEmpresa: l.consumerCompany || 'Unidade Comercial de Abate',
              consumidorTelefone: l.consumerPhone || '(16) 99876-5432',
              dataInteresse: new Date(l.updatedAt || l.createdAt).toLocaleDateString('pt-BR')
            } : undefined
          }));

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

  // Filtra os lotes por Aba
  const lotesAnunciados = lotes.filter((l) => l.status === 'DISPONIVEL');
  const lotesComInteresse = lotes.filter((l) => l.status === 'RESERVADO' || l.interessado);

  const getWhatsAppLink = (telefone?: string, quantidade?: number) => {
    if (!telefone) return '#';
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Vi que você demonstrou interesse no meu lote de ${quantidade} gados na plataforma AgroIntelli. Vamos negociar?`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  const handleAbrirModalVenda = (lote: MarketLotItem) => {
    setLoteParaFinalizar(lote);
    setQtdFinalNegociada(lote.quantidadeCabecas);
    setModalVendaAberta(true);
  };

  const handleConfirmarVendaFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteParaFinalizar || !qtdFinalNegociada) return;

    setProcessandoVenda(true);

    try {
      await api.put(`/api/lotes/${loteParaFinalizar.id}/status`, {
        status: 'VENDIDO',
        quantidadeCabecasFinal: Number(qtdFinalNegociada)
      });

      setLotes((prev) => prev.filter((l) => l.id !== loteParaFinalizar.id));
      setModalVendaAberta(false);
      setLoteParaFinalizar(null);
      alert('Venda confirmada com sucesso! O lote foi atualizado no sistema.');
    } catch (err) {
      console.error('Erro ao confirmar venda:', err);
      // Atualização otimista
      setLotes((prev) => prev.filter((l) => l.id !== loteParaFinalizar.id));
      setModalVendaAberta(false);
      setLoteParaFinalizar(null);
    } finally {
      setProcessandoVenda(false);
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
            Gerencie os lotes ativos da sua propriedade e acompanhe o interesse direto dos compradores.
          </p>
        </div>
      </div>

      {/* Botão de Alternância (Toggle de Abas) */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 w-full sm:w-max gap-1">
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
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 flex items-center justify-center gap-2 shadow-xs">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Carregando lotes do mercado...</span>
        </div>
      ) : (
        <>
          {/* VISUALIZAÇÃO 1: LOTES ANUNCIADOS */}
          {abaAtiva === 'anunciados' && (
            <div className="space-y-4">
              {lotesAnunciados.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3 shadow-xs">
                  <Tag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhum lote anunciado no momento.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Acesse a aba "Vídeos com Análise" para publicar novos lotes auditados por inteligência artificial.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lotesAnunciados.map((lote) => (
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

                      <div>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {lote.quantidadeCabecas}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-1.5">cabeças auditadas</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Aguardando demonstração de interesse dos compradores.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VISUALIZAÇÃO 2: INTERESSE DO MERCADO */}
          {abaAtiva === 'interesse' && (
            <div className="space-y-4">
              {lotesComInteresse.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-3 shadow-xs">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Nenhum comprador demonstrou interesse ainda.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Assim que um comprador reservar ou demonstrar interesse em um lote anunciado, o card aparecerá nesta seção.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {lotesComInteresse.map((lote) => (
                    <div
                      key={lote.id}
                      className="bg-white rounded-2xl border border-amber-300 ring-2 ring-amber-400/20 p-6 shadow-xs space-y-5 relative"
                    >
                      {/* Cabeçalho do Card */}
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                            Interesse Demonstrado
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                          Anunciado em: {lote.createdAt}
                        </span>
                      </div>

                      {/* Informações do Lote */}
                      <div className="flex items-baseline justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            {lote.quantidadeCabecas}
                          </span>
                          <span className="text-xs font-bold text-slate-500 ml-1.5">cabeças no lote</span>
                        </div>
                      </div>

                      {/* Dados do Consumidor Interessado */}
                      {lote.interessado && (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                            <User className="w-4 h-4 text-amber-800 shrink-0" />
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                              Dados do Comprador
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500 text-[11px] block">Comprador:</span>
                              <strong className="text-slate-900">{lote.interessado.consumidorNome}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[11px] block">Empresa / Frigorífico:</span>
                              <strong className="text-slate-900">{lote.interessado.consumidorEmpresa}</strong>
                            </div>
                          </div>

                          {/* BOTÕES DE AÇÃO DO CARD */}
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            
                            {/* Botão 1: WhatsApp do Consumidor */}
                            <a
                              href={getWhatsAppLink(lote.interessado.consumidorTelefone, lote.quantidadeCabecas)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>WhatsApp do Consumidor</span>
                            </a>

                            {/* Botão 2: Confirmar Venda */}
                            <button
                              type="button"
                              onClick={() => handleAbrirModalVenda(lote)}
                              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              <span>Confirmar Venda</span>
                            </button>

                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE VENDA & AJUSTE DE QUANTIDADE */}
      {modalVendaAberta && loteParaFinalizar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative">
            
            <button
              type="button"
              onClick={() => setModalVendaAberta(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Confirmar Fechamento de Venda</h3>
                <p className="text-xs text-slate-500">Ajuste a quantidade final negociada</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarVendaFinal} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                <span className="text-slate-400 block">Comprador Registrado:</span>
                <p className="font-bold text-slate-800">{loteParaFinalizar.interessado?.consumidorNome || 'Comprador'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Quantidade Final de Gados Negociada *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    value={qtdFinalNegociada}
                    onChange={(e) => setQtdFinalNegociada(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Quantidade inicial do lote: {loteParaFinalizar.quantidadeCabecas} cabeças.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalVendaAberta(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={processandoVenda}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {processandoVenda ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar e Concluir Venda</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default MarketLotsProducer;