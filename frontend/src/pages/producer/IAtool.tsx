import React, { useRef, useEffect } from 'react';
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
  Tractor
} from 'lucide-react';
import { useVideoProcessing } from '../../context/VideoProcessing';
import { useFarm } from '../../context/FarmContext'; // IMPORTAR O CONTEXTO DA FAZENDA

export function ProducerDashboard() {
  const { activeFarm } = useFarm(); // RESGATAR A FAZENDA ATIVA
  const {
    videoUrl,
    status,
    totalCabecasIa,
    totalCabecasAnuncio,
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

  useEffect(() => {
    if (status === 'reproduzindo' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay prevenido pelo navegador:", err);
      });
    }
  }, [status]);

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

  // Garante que o valor digitado nunca ultrapasse a quantidade contada pela IA
  const handleQuantidadeAnuncioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    
    if (valorDigitado === '') {
      setTotalCabecasAnuncio('');
      return;
    }

    const num = Number(valorDigitado);
    const limiteMaximo = totalCabecasIa ?? 0;

    if (num > limiteMaximo) {
      setTotalCabecasAnuncio(limiteMaximo.toString());
    } else {
      setTotalCabecasAnuncio(valorDigitado);
    }
  };

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
        
        {/* Área de Vídeo */}
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
                  <p className="text-emerald-400/80 text-[11px] font-semibold mt-2">
                    💡 Você pode navegar para outras telas enquanto o vídeo é analisado em segundo plano.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCancelarProcessamento}
                  className="mt-2 px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
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
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Ocorreu um erro ao analisar os frames. Verifique o arquivo e tente novamente.
                </p>
                <button 
                  onClick={() => setStatus('ocioso')}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
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

            {(status === 'reproduzindo' || status === 'concluido') && (
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                IA Ativa • Rastreamento de IDs
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={salvarNasGaleriasELimpar}
              disabled={!isConcluido || salvandoGaleria}
              className={`group px-4 py-2.5 rounded-xl font-bold text-xs border shadow-xs transition-all flex items-center gap-2 ${
                isConcluido && !salvandoGaleria
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                  : 'bg-slate-100 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {salvandoGaleria ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FolderPlus className={`w-4 h-4 transition-colors ${isConcluido ? 'text-slate-500 group-hover:text-emerald-600' : 'text-slate-400'}`} />
              )}
              <span>Salvar nas Galerias</span>
            </button>

            <button
              type="button"
              onClick={limparEProximoVideo}
              disabled={!isConcluido}
              className={`group px-4 py-2.5 rounded-xl font-bold text-xs border shadow-xs transition-all flex items-center gap-2 ${
                isConcluido
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                  : 'bg-slate-100 border-slate-200/80 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Trash2 className={`w-4 h-4 transition-colors ${isConcluido ? 'text-slate-500 group-hover:text-emerald-600' : 'text-slate-400'}`} />
              <span>Remover Vídeo Anterior</span>
            </button>
          </div>
        </div>

        {/* Coluna Direita: Resultados da Análise */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          <h2 className="text-lg font-bold text-slate-900">Resultados da Análise</h2>

          {/* Card 1: Contagem e Edição */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contagem da IA
              </span>
              {isConcluido && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
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
                    Gado Detectado
                  </span>
                </>
              ) : (
                <div className="py-6 flex flex-col items-center opacity-40">
                  <Loader2 className={`w-8 h-8 text-slate-400 ${status === 'processando' ? 'animate-spin' : ''}`} />
                  <span className="text-xs text-slate-400 font-medium mt-3">
                    {status === 'reproduzindo' 
                      ? 'Exibindo vídeo... Aguarde a finalização' 
                      : 'Aguardando envio do vídeo...'}
                  </span>
                </div>
              )}
            </div>

            {/* Input de Edição Pós-IA com Limite Travado */}
            {isConcluido && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  Quantidade para Anúncio (Editável)
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalCabecasIa ?? undefined}
                  value={totalCabecasAnuncio}
                  onChange={handleQuantidadeAnuncioChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  placeholder="Informe a quantidade desejada"
                />
                <p className="text-[11px] text-slate-400">
                  A quantidade não pode ultrapassar o total auditado pela IA ({totalCabecasIa ?? 0}).
                </p>
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
              Disponibilize o lote certificado para frigoríficos e distribuidores parceiros com vídeo comprobatório.
            </p>

            <button 
              onClick={() => abrirModalConfirmacao()}
              disabled={
                !isConcluido || 
                notificado || 
                enviandoNotificacao || 
                !totalCabecasAnuncio || 
                Number(totalCabecasAnuncio) > (totalCabecasIa ?? 0)
              }
              className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                !isConcluido || !totalCabecasAnuncio || Number(totalCabecasAnuncio) > (totalCabecasIa ?? 0)
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
                  <h3 className="text-base font-bold text-slate-900">
                    Disparando Notificação
                  </h3>
                  <p className="text-xs text-slate-500">
                    Janela de cancelamento ativa
                  </p>
                </div>
              </div>

              <button 
                onClick={cancelarContagemRegressiva}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center space-y-2">
              <p className="text-xs text-slate-500">O lote será publicado em:</p>
              <div className="text-5xl font-black text-emerald-600">
                00:0{tempoRestante}
              </div>
              <p className="text-xs font-semibold text-slate-700 pt-1">
                Lote com <span className="text-emerald-700 font-extrabold">{totalCabecasAnuncio} gados</span> de gado.
              </p>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 transition-all duration-1000 ease-linear"
                style={{ width: `${(tempoRestante / 5) * 100}%` }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelarContagemRegressiva}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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