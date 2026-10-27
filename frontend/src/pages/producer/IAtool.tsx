import React, { useRef, useEffect, useState } from 'react';
import { 
  UploadCloud, 
  Loader2, 
  Bell, 
  ShieldCheck, 
  Edit3, 
  X, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Trash2,
  Tractor,
  DollarSign,
  MapPin,
  Archive,
  Lock,
  PlusCircle
} from 'lucide-react';
import { useVideoProcessing } from '../../context/VideoProcessing';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

interface Pasto {
  id: string;
  nome: string;
}

interface LoteReserva {
  id: string;
  quantidadeCabecas: number;
  createdAt: string;
}

export function ProducerDashboard() {
  const { activeFarm } = useFarm();
  const {
    videoUrl,
    status,
    totalCabecasIa,
    totalCabecasAnuncio,
    valorLoteAnuncio,
    pastoSelecionadoId,
    setValorLoteAnuncio,
    setPastoSelecionadoId,
    isDragging,
    notificado,
    enviandoNotificacao,
    modalContagemAberta,
    tempoRestante,
    salvandoGaleria,

    setIsDragging,
    setTotalCabecasAnuncio,
    setStatus,
    processFile,
    handleCancelarProcessamento,
    handleVideoFim,
    abrirModalConfirmacao,
    cancelarContagemRegressiva,
    limparEProximoVideo,
    salvarNasGaleriasELimpar
  } = useVideoProcessing();

  const videoRef = useRef<HTMLVideoElement>(null);
  const isConcluido = status === 'concluido';

  // Lista local de pastos cadastrados na fazenda ativa
  const [pastos, setPastos] = useState<Pasto[]>([]);
  const [carregandoPastos, setCarregandoPastos] = useState(false);

  // Estados para Gestão de Anexo de Reserva do Rebanho
  const [lotesReserva, setLotesReserva] = useState<LoteReserva[]>([]);
  const [carregandoReservas, setCarregandoReservas] = useState(false);
  const [modalReservaAberto, setModalReservaAberto] = useState(false);
  const [reservaAnexada, setReservaAnexada] = useState<{ id: string; quantidade: number } | null>(null);

  useEffect(() => {
    if (status === 'reproduzindo' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay prevenido pelo navegador:", err);
      });
    }
  }, [status]);

  // Carrega pastos e lotes de reserva da fazenda ativa
  useEffect(() => {
    if (activeFarm?.id) {
      setCarregandoPastos(true);
      api.get(`/api/fazendas/${activeFarm.id}/pastos`)
        .then((res) => {
          if (res.data?.sucesso && Array.isArray(res.data.pastos)) {
            setPastos(res.data.pastos);
          } else {
            setPastos([]);
          }
        })
        .catch((err) => {
          console.error('Erro ao buscar pastos da fazenda:', err);
          setPastos([]);
        })
        .finally(() => setCarregandoPastos(false));

      setCarregandoReservas(true);
      api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`)
        .then((res) => {
          if (res.data?.lotes) {
            const reservas = res.data.lotes
              .filter((l: any) => l.status === 'RESERVA')
              .map((l: any) => ({
                id: l.id,
                quantidadeCabecas: Number(l.quantidadeCabecas || 0),
                createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR') : 'Data n/d'
              }));
            setLotesReserva(reservas);
          }
        })
        .catch((err) => console.error('Erro ao carregar reservas:', err))
        .finally(() => setCarregandoReservas(false));
    }
  }, [activeFarm?.id]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Trata a alteração de quantidade do anúncio (desabilitado quando a reserva é anexada)
  const handleQuantidadeAnuncioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (reservaAnexada) return; // Trava contra modificação manual

    const valorDigitado = e.target.value;
    if (valorDigitado === '') {
      setTotalCabecasAnuncio('');
      return;
    }

    const num = Number(valorDigitado);
    const limiteMaximo = totalCabecasIa ?? 0;

    if (num < 0) return;

    if (num > limiteMaximo) {
      setTotalCabecasAnuncio(limiteMaximo.toString());
    } else {
      setTotalCabecasAnuncio(valorDigitado);
    }
  };

  // Anexa o gado de um lote da reserva e TRAVA o input
  const handleConfirmarAnexoReserva = (reserva: LoteReserva) => {
    const qtdBaseIa = totalCabecasIa ?? 0;
    const qtdFinalAnuncio = qtdBaseIa + reserva.quantidadeCabecas;

    setTotalCabecasAnuncio(qtdFinalAnuncio.toString());
    setReservaAnexada({
      id: reserva.id,
      quantidade: reserva.quantidadeCabecas
    });
    setModalReservaAberto(false);
  };

  // Permite remover a reserva anexada para destravar o input
  const handleRemoverReservaAnexada = () => {
    setTotalCabecasAnuncio((totalCabecasIa ?? 0).toString());
    setReservaAnexada(null);
  };

  const handlePreventNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', 'e', 'E', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleValorLoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setValorLoteAnuncio?.('');
      return;
    }

    const num = Number(val);
    if (!isNaN(num) && num >= 0) {
      setValorLoteAnuncio?.(val);
    }
  };

  const isQtdValida = 
    totalCabecasAnuncio !== '' && 
    Number(totalCabecasAnuncio) > 0;

  const isValorValido = 
    valorLoteAnuncio !== '' && 
    valorLoteAnuncio !== null && 
    valorLoteAnuncio !== undefined && 
    Number(valorLoteAnuncio) > 0;

  const podeNotificar = isConcluido && isQtdValida && isValorValido && !notificado && !enviandoNotificacao;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Análise de Vídeo
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
              <Tractor className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Fazenda: {activeFarm?.name || 'Não selecionada'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Envie o vídeo aéreo do drone para contagem automatizada por IA e certificação de lote.
          </p>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Área do Player de Vídeo */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-slate-900 rounded-2xl overflow-hidden relative min-h-[460px] flex items-center justify-center border transition-all duration-300 ${
              isDragging 
                ? 'border-emerald-500 bg-slate-800/90 ring-4 ring-emerald-500/20' 
                : 'border-slate-800 shadow-sm'
            }`}
          >
            {status === 'ocioso' && (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/40 transition duration-300 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-emerald-400">
                  <UploadCloud className={`w-8 h-8 transition-transform ${isDragging ? 'scale-110' : ''}`} />
                </div>
                <p className="text-white font-bold text-base">
                  {isDragging ? 'Solte o arquivo do vídeo aqui' : 'Arraste ou clique para enviar o vídeo'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Suporta formato MP4 gravado por drone
                </p>
                <input type="file" accept="video/mp4" className="hidden" onChange={handleUpload} />
              </label>
            )}

            {status === 'processando' && (
              <div className="flex flex-col items-center justify-center text-white/90 p-8 text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                <div>
                  <h3 className="text-lg font-bold">Processando vídeo com IA...</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Executando detecção de corpo inteiro com YOLOv8 e ByteTrack
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelarProcessamento}
                  className="mt-2 px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  Cancelar Processamento
                </button>
              </div>
            )}

            {status === 'erro' && (
              <div className="flex flex-col items-center justify-center text-rose-400 p-8 text-center">
                <AlertCircle className="w-12 h-12 mb-3" />
                <h3 className="text-base font-bold text-white">Falha no processamento do vídeo</h3>
                <button 
                  onClick={() => setStatus('ocioso')}
                  className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {(status === 'reproduzindo' || status === 'concluido') && videoUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-2">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  muted
                  playsInline
                  onEnded={handleVideoFim}
                  className="w-full max-h-[480px] aspect-video object-contain rounded-xl"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => salvarNasGaleriasELimpar()}
              disabled={!isConcluido || salvandoGaleria}
              className={`group px-4 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${
                isConcluido && !salvandoGaleria
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {salvandoGaleria ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <FolderPlus className="w-4 h-4" />}
              <span>Salvar nas Galerias</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReservaAnexada(null);
                limparEProximoVideo();
              }}
              disabled={!isConcluido}
              className={`group px-4 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${
                isConcluido
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover Vídeo Anterior</span>
            </button>
          </div>
        </div>

        {/* Coluna Direita: Resultados da Análise */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          <h2 className="text-lg font-bold text-slate-900">Resultados da Análise</h2>

          {/* Card 1: Contagem e Edição de Quantidade, Valor e Pasto */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contagem da IA
              </span>
              {isConcluido && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Auditado
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-2 text-center">
              {isConcluido ? (
                <>
                  <span className="text-6xl font-extrabold text-slate-900 tracking-tight">
                    {totalCabecasIa ?? 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                    Gado Detectado no Vídeo
                  </span>
                </>
              ) : (
                <div className="py-6 flex flex-col items-center opacity-40">
                  <Loader2 className={`w-8 h-8 text-slate-400 ${status === 'processando' ? 'animate-spin' : ''}`} />
                  <span className="text-xs text-slate-400 font-medium mt-3">
                    Aguardando envio do vídeo...
                  </span>
                </div>
              )}
            </div>

            {/* FORMULÁRIO DE EDIÇÃO DOS DADOS DO ANÚNCIO */}
            {isConcluido && (
              <div className="pt-3 border-t border-slate-100 space-y-4">
                
                {/* BOTÃO PARA ANEXAR RESERVA DE REBANHO */}
                {lotesReserva.length > 0 && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-emerald-600" />
                        Gado em Reserva ({lotesReserva.length} lote{lotesReserva.length > 1 ? 's' : ''})
                      </span>

                      {!reservaAnexada ? (
                        <button
                          type="button"
                          onClick={() => setModalReservaAberto(true)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Adicionar Reserva</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRemoverReservaAnexada}
                          className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-extrabold text-[10px] rounded-md transition cursor-pointer"
                        >
                          Desanexar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* INPUT 1: SELEÇÃO DA ÁREA / PASTO ANALISADO */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Pasto / Área de Análise
                  </label>
                  {carregandoPastos ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      Carregando demarcações da fazenda...
                    </div>
                  ) : (
                    <select
                      value={pastoSelecionadoId || ''}
                      onChange={(e) => setPastoSelecionadoId?.(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer"
                    >
                      <option value="">Selecione o pasto (opcional)</option>
                      {pastos.map((pasto) => (
                        <option key={pasto.id} value={pasto.id}>
                          {pasto.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* INPUT 2: QUANTIDADE DE GADO (COM TRAVA DE SEGURANÇA SE A RESERVA FOR SOMADA) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      Quantidade Final para Anúncio *
                    </label>
                    {reservaAnexada && (
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-700" /> Campo Trava
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      disabled={!!reservaAnexada}
                      onKeyDown={handlePreventNegativeKeys}
                      value={totalCabecasAnuncio}
                      onChange={handleQuantidadeAnuncioChange}
                      className={`w-full px-3.5 py-2 border rounded-lg text-sm font-bold transition-all ${
                        reservaAnexada
                          ? 'bg-slate-100 border-slate-300 text-slate-700 cursor-not-allowed opacity-90'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                      }`}
                      placeholder="Informe a quantidade"
                    />
                  </div>

                  {/* ALERTA EXPLÍCITO DE IMPOSSIBILIDADE DE ALTERAÇÃO MANUAL */}
                  {reservaAnexada && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-semibold space-y-1">
                      <p className="flex items-center gap-1 font-bold text-amber-900">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        Alteração manual desabilitada!
                      </p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Foram adicionadas <strong>+{reservaAnexada.quantidade} cabeças</strong> vindas da Reserva de Rebanho. O valor final ({totalCabecasAnuncio} cabeças) está bloqueado para manter a consistência da auditoria.
                      </p>
                    </div>
                  )}

                  {!isQtdValida && totalCabecasAnuncio !== '' && (
                    <p className="text-[11px] text-rose-500 font-semibold">
                      Quantidade deve ser maior que 0.
                    </p>
                  )}
                </div>

                {/* INPUT 3: VALOR TOTAL DO LOTE (R$) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Valor Total do Lote (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    onKeyDown={handlePreventNegativeKeys}
                    value={valorLoteAnuncio || ''}
                    onChange={handleValorLoteChange}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    placeholder="Ex: 85000.00"
                  />
                </div>

              </div>
            )}
          </div>

          {/* Card 2: Ação para Mercado */}
          <div className={`bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-4 transition-all ${
            !isConcluido ? 'opacity-50 grayscale pointer-events-none' : ''
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mercado</span>
              <Bell className={`w-4 h-4 ${notificado ? 'text-emerald-600' : 'text-slate-400'}`} />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Disponibilize o lote certificado no mercado público com contagem de cabeças e valor total auditado.
            </p>

            <button 
              type="button"
              onClick={() => abrirModalConfirmacao()}
              disabled={!podeNotificar}
              className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                !podeNotificar
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : notificado
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
              }`}
            >
              {enviandoNotificacao ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : notificado ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Lote Notificado aos Compradores
                </>
              ) : (
                'Notificar Consumidores'
              )}
            </button>
          </div>

        </div>

      </div>

      {/* POP-UP: SELEÇÃO DE GADO DA RESERVA */}
      {modalReservaAberto && (
        <div 
          onClick={() => setModalReservaAberto(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setModalReservaAberto(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Selecionar Gado da Reserva
                </h3>
                <p className="text-xs text-slate-500">
                  Soma o saldo de sobras anteriores ao gado analisado neste vídeo
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {lotesReserva.map((res) => (
                <div 
                  key={res.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-emerald-400 transition"
                >
                  <div>
                    <span className="text-lg font-black text-slate-900">
                      +{res.quantidadeCabecas} cabeças
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Salvo em {res.createdAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmarAnexoReserva(res)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Somar ao Anúncio
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModalReservaAberto(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Pop-up de Contagem Regressiva */}
      {modalContagemAberta && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Disparando Notificação</h3>
                  <p className="text-xs text-slate-500">Janela de cancelamento ativa</p>
                </div>
              </div>

              <button 
                onClick={cancelarContagemRegressiva}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500">O lote será publicado em:</p>
              <div className="text-5xl font-black text-emerald-600">00:0{tempoRestante}</div>
              <p className="text-xs font-semibold text-slate-700 pt-1">
                Lote com <span className="text-emerald-700 font-extrabold">{totalCabecasAnuncio} gados</span> por <span className="text-emerald-700 font-extrabold">{Number(valorLoteAnuncio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelarContagemRegressiva}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}