import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';
import { useFarm } from '../context/FarmContext';

export type ProcessingStatus = 'ocioso' | 'processando' | 'reproduzindo' | 'concluido' | 'erro';

export interface RawVideoItem {
  id: string;
  dbLoteId?: string;
  title: string;
  date: string;
  rawDate: string;
  videoUrl: string;
  duration?: string;
}

export interface AnalyzedVideoItem {
  id: string;
  dbLoteId?: string;
  title: string;
  date: string;
  rawDate: string;
  cattleCount: number;
  videoUrl: string;
  isNotified?: boolean;
}

interface VideoProcessingContextType {
  videoUrl: string | null;
  rawVideoUrl: string | null;
  status: ProcessingStatus;
  totalCabecasIa: number | null;
  totalCabecasAnuncio: number | string;
  videoTitle: string;
  isDragging: boolean;
  notificado: boolean;
  enviandoNotificacao: boolean;
  modalContagemAberta: boolean;
  tempoRestante: number;
  salvandoGaleria: boolean;

  savedRawVideos: RawVideoItem[];
  savedAnalyzedVideos: AnalyzedVideoItem[];

  setIsDragging: (value: boolean) => void;
  setTotalCabecasAnuncio: (value: number | string) => void;
  setVideoTitle: (value: string) => void;
  setStatus: (status: ProcessingStatus) => void;
  
  processFile: (file: File) => Promise<void>;
  handleCancelarProcessamento: () => void;
  handleVideoFim: () => void;
  abrirModalConfirmacao: (videoGaleriaId?: string) => void;
  cancelarContagemRegressiva: () => void;
  executarNotificacao: () => Promise<void>;
  limparEProximoVideo: () => void;
  salvarNasGaleriasELimpar: (jaNotificado?: boolean | any) => Promise<void>;

  deletarRawVideo: (id: string) => Promise<void>;
  editarRawVideo: (id: string, newTitle: string, newRawDate: string) => void;
  deletarAnalyzedVideo: (id: string) => Promise<void>;
  editarAnalyzedVideo: (id: string, newTitle: string, newRawDate: string, newCattleCount: number) => void;
  notificarItemGaleria: (id: string) => void;
}

const VideoProcessingContext = createContext<VideoProcessingContextType | undefined>(undefined);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const VideoProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeFarm } = useFarm();

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [rawVideoUrl, setRawVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('ocioso');
  
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [totalCabecasIa, setTotalCabecasIa] = useState<number | null>(null);
  const [totalCabecasAnuncio, setTotalCabecasAnuncio] = useState<number | string>('');
  
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [notificado, setNotificado] = useState(false);
  const [enviandoNotificacao, setEnviandoNotificacao] = useState(false);
  const [salvandoGaleria, setSalvandoGaleria] = useState(false);

  const [itemGaleriaParaNotificar, setItemGaleriaParaNotificar] = useState<string | null>(null);

  const [savedRawVideos, setSavedRawVideos] = useState<RawVideoItem[]>([]);
  const [savedAnalyzedVideos, setSavedAnalyzedVideos] = useState<AnalyzedVideoItem[]>([]);

  const [modalContagemAberta, setModalContagemAberta] = useState(false);
  const [tempoRestante, setTempoRestante] = useState<number>(5);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Travas de execução única para impedir duplicação
  const executingRef = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (activeFarm?.id) {
      api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`)
        .then((res) => {
          if (res.data?.lotes) {
            const analisados: AnalyzedVideoItem[] = [];
            const brutos: RawVideoItem[] = [];

            res.data.lotes.forEach((lote: any) => {
              const dataFormatada = new Date(lote.createdAt).toLocaleDateString('pt-BR');
              const rawDate = new Date(lote.createdAt).toISOString().split('T')[0];

              if (lote.videoProcessadoUrl) {
                analisados.push({
                  id: `ana-${lote.id}`,
                  dbLoteId: lote.id,
                  title: `Lote Analisado - ${dataFormatada}`,
                  date: dataFormatada,
                  rawDate,
                  cattleCount: lote.quantidadeCabecas,
                  videoUrl: lote.videoProcessadoUrl,
                  isNotified: lote.status === 'DISPONIVEL'
                });
              }

              if (lote.videoOriginalUrl) {
                brutos.push({
                  id: `raw-${lote.id}`,
                  dbLoteId: lote.id,
                  title: `Vídeo Bruto - ${dataFormatada}`,
                  date: dataFormatada,
                  rawDate,
                  videoUrl: lote.videoOriginalUrl
                });
              }
            });

            setSavedAnalyzedVideos(analisados);
            setSavedRawVideos(brutos);
          }
        })
        .catch((err) => console.error('Erro ao carregar vídeos da fazenda:', err));
    }
  }, [activeFarm?.id]);

  // TEMPORIZADOR LIMPO (Sem efeitos colaterais dentro de setState)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (modalContagemAberta) {
      executingRef.current = false;
      setTempoRestante(5);

      interval = setInterval(() => {
        setTempoRestante((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [modalContagemAberta]);

  // DISPARO ÚNICO DA NOTIFICAÇÃO AO ZERAR O TEMPO
  useEffect(() => {
    if (modalContagemAberta && tempoRestante === 0) {
      if (!executingRef.current) {
        executarNotificacao();
      }
    }
  }, [tempoRestante, modalContagemAberta]);

  const abrirModalConfirmacao = (videoGaleriaId?: string) => {
    if (videoGaleriaId) {
      setItemGaleriaParaNotificar(videoGaleriaId);
    }
    setModalContagemAberta(true);
  };

  const cancelarContagemRegressiva = () => {
    setModalContagemAberta(false);
    setItemGaleriaParaNotificar(null);
    setTempoRestante(5);
    executingRef.current = false;
  };

  const executarNotificacao = async () => {
    if (executingRef.current) return;
    executingRef.current = true;

    setModalContagemAberta(false);

    if (!activeFarm?.id) {
      alert('Nenhuma fazenda ativa encontrada. Por favor, selecione uma fazenda.');
      executingRef.current = false;
      return;
    }

    setEnviandoNotificacao(true);

    try {
      if (itemGaleriaParaNotificar) {
        const item = savedAnalyzedVideos.find((v) => v.id === itemGaleriaParaNotificar);
        if (item) {
          await api.post('/api/lotes/publicar', {
            loteId: item.dbLoteId,
            quantidadeCabecas: item.cattleCount,
            videoProcessadoUrl: item.videoUrl,
            fazendaId: activeFarm.id
          });

          setSavedAnalyzedVideos((prev) =>
            prev.map((v) => (v.id === itemGaleriaParaNotificar ? { ...v, isNotified: true } : v))
          );
        }
      } else {
        setNotificado(true);
        await salvarNasGaleriasELimpar(true);
      }
    } catch (error) {
      console.error('Erro ao notificar:', error);
      alert('Erro ao disponibilizar lote para o mercado.');
    } finally {
      setEnviandoNotificacao(false);
      setItemGaleriaParaNotificar(null);
      executingRef.current = false;
    }
  };

  const handleCancelarProcessamento = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    limparEProximoVideo();
  };

  const limparEProximoVideo = () => {
    setVideoUrl(null);
    setRawVideoUrl(null);
    setStatus('ocioso');
    setPendingCount(null);
    setTotalCabecasIa(null);
    setTotalCabecasAnuncio('');
    setVideoTitle('');
    setNotificado(false);
    setEnviandoNotificacao(false);
    setModalContagemAberta(false);
  };

  const salvarNasGaleriasELimpar = async (jaNotificado: boolean | any = false) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSalvandoGaleria(true);

    const isActuallyNotified = jaNotificado === true;

    if (!activeFarm?.id) {
      console.error('Nenhuma fazenda selecionada.');
      setSalvandoGaleria(false);
      savingRef.current = false;
      return;
    }

    const hoje = new Date();
    const rawDateStr = hoje.toISOString().split('T')[0];
    const dateFormatted = hoje.toLocaleDateString('pt-BR');
    const tituloFinal = videoTitle.trim() || `Lote Analisado ${dateFormatted}`;
    const newId = `vid-${Date.now()}`;

    try {
      const res = await api.post('/api/videos/salvar-galeria', {
        fazendaId: activeFarm.id,
        quantidadeCabecas: Number(totalCabecasAnuncio) || totalCabecasIa || 0,
        videoOriginalUrl: rawVideoUrl,
        videoProcessadoUrl: videoUrl,
        status: isActuallyNotified ? 'DISPONIVEL' : 'RASCUNHO'
      });

      const dbLoteId = res.data?.lote?.id;

      if (rawVideoUrl) {
        const rawItem: RawVideoItem = {
          id: `raw-${newId}`,
          dbLoteId: dbLoteId,
          title: tituloFinal,
          date: dateFormatted,
          rawDate: rawDateStr,
          videoUrl: rawVideoUrl
        };
        setSavedRawVideos((prev) => [rawItem, ...prev]);
      }

      if (videoUrl) {
        const analyzedItem: AnalyzedVideoItem = {
          id: `ana-${newId}`,
          dbLoteId: dbLoteId,
          title: tituloFinal,
          date: dateFormatted,
          rawDate: rawDateStr,
          cattleCount: Number(totalCabecasAnuncio) || totalCabecasIa || 0,
          videoUrl: videoUrl,
          isNotified: isActuallyNotified
        };
        setSavedAnalyzedVideos((prev) => [analyzedItem, ...prev]);
      }
    } catch (err) {
      console.error('Erro ao salvar vídeo no banco de dados:', err);
    } finally {
      setSalvandoGaleria(false);
      savingRef.current = false;
      limparEProximoVideo();
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    try {
      const base64Str = await fileToBase64(file);
      setRawVideoUrl(base64Str);
      setVideoUrl(base64Str);
      setStatus('processando');
      setPendingCount(null);
      setTotalCabecasIa(null);
      setNotificado(false);

      const nomeLimpo = file.name.replace(/\.[^/.]+$/, "");
      setVideoTitle(nomeLimpo);

      const formData = new FormData();
      formData.append('file', file);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await api.post('/api/videos/processar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal
      });

      if (response.data.sucesso) {
        const qtdIa = response.data.totalCabecas;
        setPendingCount(qtdIa);

        if (response.data.videoProcessadoUrl) {
          setVideoUrl(response.data.videoProcessadoUrl);
        }

        setStatus('reproduzindo');
      } else {
        throw new Error('Falha no processamento.');
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      console.error(error);
      setStatus('erro');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleVideoFim = () => {
    if (pendingCount !== null) {
      setTotalCabecasIa(pendingCount);
      setTotalCabecasAnuncio(pendingCount);
    }
    setStatus('concluido');
  };

  const deletarRawVideo = async (id: string) => {
    const item = savedRawVideos.find((v) => v.id === id);
    const dbId = item?.dbLoteId || id.replace('raw-', '');

    setSavedRawVideos((prev) => prev.filter((v) => v.id !== id));

    if (dbId) {
      try {
        await api.delete(`/api/videos/${dbId}`);
      } catch (error) {
        console.error('Erro ao excluir vídeo bruto do banco de dados:', error);
      }
    }
  };

  const deletarAnalyzedVideo = async (id: string) => {
    const item = savedAnalyzedVideos.find((v) => v.id === id);
    const dbId = item?.dbLoteId || id.replace('ana-', '');

    setSavedAnalyzedVideos((prev) => prev.filter((v) => v.id !== id));

    if (dbId) {
      try {
        await api.delete(`/api/videos/${dbId}`);
      } catch (error) {
        console.error('Erro ao excluir vídeo analisado do banco de dados:', error);
      }
    }
  };

  const editarRawVideo = (id: string, newTitle: string, newRawDate: string) => {
    const [ano, mes, dia] = newRawDate.split('-');
    const dataFormatted = `${dia}/${mes}/${ano}`;
    setSavedRawVideos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle, rawDate: newRawDate, date: dataFormatted } : item))
    );
  };

  const editarAnalyzedVideo = (id: string, newTitle: string, newRawDate: string, newCattleCount: number) => {
    const [ano, mes, dia] = newRawDate.split('-');
    const dataFormatted = `${dia}/${mes}/${ano}`;
    setSavedAnalyzedVideos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle, rawDate: newRawDate, date: dataFormatted, cattleCount: newCattleCount } : item))
    );
  };

  const notificarItemGaleria = (id: string) => {
    abrirModalConfirmacao(id);
  };

  return (
    <VideoProcessingContext.Provider
      value={{
        videoUrl,
        rawVideoUrl,
        status,
        totalCabecasIa,
        totalCabecasAnuncio,
        videoTitle,
        isDragging,
        notificado,
        enviandoNotificacao,
        modalContagemAberta,
        tempoRestante,
        salvandoGaleria,

        savedRawVideos,
        savedAnalyzedVideos,

        setIsDragging,
        setTotalCabecasAnuncio,
        setVideoTitle,
        setStatus,
        processFile,
        handleCancelarProcessamento,
        handleVideoFim,
        abrirModalConfirmacao,
        cancelarContagemRegressiva,
        executarNotificacao,
        limparEProximoVideo,
        salvarNasGaleriasELimpar,

        deletarRawVideo,
        editarRawVideo,
        deletarAnalyzedVideo,
        editarAnalyzedVideo,
        notificarItemGaleria
      }}
    >
      {children}
    </VideoProcessingContext.Provider>
  );
};

export const useVideoProcessing = () => {
  const context = useContext(VideoProcessingContext);
  if (!context) {
    throw new Error('useVideoProcessing deve ser usado dentro de VideoProcessingProvider');
  }
  return context;
};