import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Loader2, Bell, ShieldCheck, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface DashboardProps {
  onNavigateLogin?: () => void;
}

export function Dashboard({ onNavigateLogin }: DashboardProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'ocioso' | 'processando' | 'reproduzindo' | 'concluido' | 'erro'>('ocioso');
  const [totalCabecas, setTotalCabecas] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [notificado, setNotificado] = useState(false);
  const [enviandoNotificacao, setEnviandoNotificacao] = useState(false);

  useEffect(() => {
    if (status === 'reproduzindo' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay prevenido pelo navegador:", err);
      });
    }
  }, [status]);

  const handleNotificarConsumidores = async () => {
  if (!totalCabecas) return;
  
    setEnviandoNotificacao(true);
    try {
      await api.post('/api/lotes/publicar', {
        quantidadeCabecas: totalCabecas,
        videoProcessadoUrl: videoUrl,
      });
      setNotificado(true);
    } catch (error) {
      console.error('Erro ao notificar:', error);
      alert('Erro ao disponibilizar lote para o mercado.');
    } finally {
      setEnviandoNotificacao(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;

    const urlPreview = URL.createObjectURL(file);
    setVideoUrl(urlPreview);
    setStatus('processando');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/videos/processar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.sucesso) {
        setTotalCabecas(response.data.totalCabecas);

        // TROCA O VÍDEO CRU PELO VÍDEO ANOTADO COM CAIXAS PELA IA
        if (response.data.videoProcessadoUrl) {
          setVideoUrl(response.data.videoProcessadoUrl);
        }

        setStatus('reproduzindo');
      } else {
        throw new Error('Falha no processamento.');
      }
    } catch (error) {
      console.error(error);
      setStatus('erro');
    }
  };
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

  const handleVideoFim = () => {
    setStatus('concluido');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] p-6 md:p-12 font-sans flex flex-col items-center justify-center relative">
      
      {/* Botão de Voltar para a Tela de Login */}
      {onNavigateLogin && (
        <div className="w-full max-w-7xl mb-4 flex items-center justify-between">
          <button
            onClick={onNavigateLogin}
            className="bg-white/80 hover:bg-white text-slate-800 font-bold px-5 py-2.5 rounded-2xl text-sm transition-all shadow-md flex items-center gap-2 backdrop-blur-md cursor-pointer hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sair / Voltar ao Login</span>
          </button>
        </div>
      )}

      {/* Container Principal Glassmorphism */}
      <div className="w-full max-w-7xl bg-[#e8ece1]/85 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-6 flex flex-col xl:flex-row gap-6">
        
        {/* Área de Vídeo / Drag & Drop */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner min-h-[500px] flex items-center justify-center border transition-all duration-300 ${
            isDragging 
              ? 'border-emerald-400 bg-slate-800/80 ring-4 ring-emerald-400/20' 
              : 'border-slate-700/50'
          }`}
        >
          {status === 'ocioso' && (
            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition duration-300 p-6 text-center">
              <UploadCloud className={`w-20 h-20 text-white/40 mb-4 transition-transform ${isDragging ? 'scale-110 text-emerald-400' : ''}`} />
              <span className="text-white/70 font-medium text-lg bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm">
                {isDragging ? 'Solte o vídeo aqui' : 'Arraste ou clique para carregar o vídeo'}
              </span>
              <input type="file" accept="video/mp4" className="hidden" onChange={handleUpload} />
            </label>
          )}

          {status === 'processando' && (
            <div className="flex flex-col items-center justify-center text-white/90">
              <Loader2 className="w-12 h-12 animate-spin text-[#a3c965] mb-4" />
              <h3 className="text-lg font-medium">Analisando frames...</h3>
            </div>
          )}

          {(status === 'reproduzindo' || status === 'concluido') && videoUrl && (
            <div className="w-full h-full flex items-center justify-center p-2">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                muted
                playsInline
                onEnded={handleVideoFim}
                className="w-full max-h-[520px] aspect-video object-contain rounded-2xl"
              />
            </div>
          )}

          {(status === 'reproduzindo' || status === 'concluido') && (
            <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 z-10">
            </div>
          )}
        </div>

        {/* Coluna Direita: Cartões de Resultado */}
        <div className="w-full xl:w-[400px] flex flex-col gap-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold text-slate-800">Resultados</h2>
          </div>

          {/* Card 1: Contagem Oficial */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-slate-500 font-medium">Contagem Oficial</span>
              {status === 'concluido' && (
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Certificado
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              {status === 'concluido' && totalCabecas !== null ? (
                <>
                  <span className="text-7xl font-black text-slate-800 tracking-tight">{totalCabecas}</span>
                  <span className="text-slate-500 font-medium mt-2">Cabeças de Gado</span>
                </>
              ) : (
                <div className="flex flex-col items-center opacity-50">
                  <Loader2 className={`w-10 h-10 text-slate-400 ${status === 'reproduzindo' ? 'animate-spin' : ''}`} />
                  <span className="text-slate-400 font-medium mt-4">Aguardando dados...</span>
                </div>
              )}
            </div>
            
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className={`h-full bg-[#a3c965] transition-all duration-1000 ${status === 'concluido' ? 'w-full' : 'w-0'}`} 
              />
            </div>
          </div>

          {/* Card 2: Ação para Consumidores */}
          <div className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white flex flex-col transition-all duration-500 ${status !== 'concluido' ? 'opacity-60 grayscale' : 'opacity-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-800 font-semibold">Mercado</span>
              <Bell className={`w-5 h-5 ${status === 'concluido' ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Notifique frigoríficos e restaurantes sobre a disponibilidade e certificação deste lote.
            </p>

            <button 
            onClick={handleNotificarConsumidores}
            disabled={status !== 'concluido' || notificado || enviandoNotificacao}
            className={`w-full py-4 rounded-xl font-bold transition-all cursor-pointer ${
              notificado
                ? 'bg-emerald-600 text-white'
                : status === 'concluido' 
                  ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            >
            {enviandoNotificacao ? 'Publicando...' : notificado ? '✓ Lote Disponibilizado aos Parceiros!' : 'Notificar Consumidores'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}