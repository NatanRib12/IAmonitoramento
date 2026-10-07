import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  X, 
  Trash2, 
  Pencil, 
  Check, 
  Play, 
  Bell, 
  Radio, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';
import { useVideoProcessing, type AnalyzedVideoItem } from '../../context/VideoProcessing';

export function ProcessedVideo() {
  const { 
    savedAnalyzedVideos, 
    deletarAnalyzedVideo, 
    editarAnalyzedVideo,
    notificarItemGaleria,
    modalContagemAberta,
    tempoRestante,
    cancelarContagemRegressiva
  } = useVideoProcessing();

  // Estados dos filtros
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroDataExata, setFiltroDataExata] = useState<string>('');
  const [faixaGadoSelect, setFaixaGadoSelect] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados de modais da galeria
  const [editingVideo, setEditingVideo] = useState<AnalyzedVideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRawDate, setEditRawDate] = useState('');
  const [editCattleCount, setEditCattleCount] = useState<number>(0);

  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  // Pop-up de confirmação do Ponto 3
  const [videoParaNotificar, setVideoParaNotificar] = useState<AnalyzedVideoItem | null>(null);

  // Lógica da faixa de gado
  let faixaMin = 0;
  let faixaMax = Infinity;
  if (faixaGadoSelect === '1-50') { faixaMin = 1; faixaMax = 50; }
  else if (faixaGadoSelect === '51-100') { faixaMin = 51; faixaMax = 100; }
  else if (faixaGadoSelect === '101-200') { faixaMin = 101; faixaMax = 200; }
  else if (faixaGadoSelect === '201+') { faixaMin = 201; faixaMax = Infinity; }

  const videosFiltrados = savedAnalyzedVideos.filter((video: AnalyzedVideoItem) => {
    if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filtroDataExata && video.rawDate !== filtroDataExata) return false;
    if (filtroMes !== 'todos' && !video.rawDate.startsWith(filtroMes)) return false;

    if (faixaGadoSelect !== 'todos') {
      if (video.cattleCount < faixaMin || video.cattleCount > faixaMax) return false;
    }

    return true;
  });

  const handleOpenEdit = (video: AnalyzedVideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditRawDate(video.rawDate);
    setEditCattleCount(video.cattleCount);
  };

  const handleSaveEdit = () => {
    if (editingVideo) {
      editarAnalyzedVideo(editingVideo.id, editTitle, editRawDate, editCattleCount);
      setEditingVideo(null);
    }
  };

  const handleConfirmarNotificacao = () => {
    if (videoParaNotificar) {
      notificarItemGaleria(videoParaNotificar.id);
      setVideoParaNotificar(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Vídeos com Análise
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Biblioteca de vídeos auditados pela IA. Notifique os parceiros para disponibilizar o lote no mercado.
        </p>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título do vídeo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos os Meses</option>
              <option value="2026-10">Outubro 2026</option>
              <option value="2026-09">Setembro 2026</option>
              <option value="2026-08">Agosto 2026</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={faixaGadoSelect}
              onChange={(e) => setFaixaGadoSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todas as Contagens</option>
              <option value="1-50">1 a 50 cabeças</option>
              <option value="51-100">51 a 100 cabeças</option>
              <option value="101-200">101 a 200 cabeças</option>
              <option value="201+">Mais de 200 cabeças</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={filtroDataExata}
              onChange={(e) => setFiltroDataExata(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* GRADE DE VÍDEOS COM ANÁLISE */}
      {videosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-3">
          <p className="text-sm font-bold">Nenhum vídeo com análise encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videosFiltrados.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-slate-900 group">
                <video src={video.videoUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPlayingVideoUrl(video.videoUrl)}
                    className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                  </button>
                </div>

                {/* Badge da Contagem de IA */}
                <div className="absolute top-3 left-3 bg-slate-900/90 text-white px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {video.cattleCount} cabeças
                </div>

                {/* PONTO 3: ÍCONES DE AÇÃO AO PASSAR O MOUSE (SININHO, LÁPIS E LIXEIRA) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  
                  {/* ÍCONE DE SININHO: Apresentado apenas para vídeos ainda NÃO lançados */}
                  {!video.isNotified ? (
                    <button
                      onClick={() => setVideoParaNotificar(video)}
                      title="Lançar notificação do lote para parceiros"
                      className="p-2 bg-white/90 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl shadow-md transition cursor-pointer"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  ) : (
                    <span 
                      title="Lote já notificado no mercado"
                      className="p-2 bg-emerald-500 text-white rounded-xl shadow-md flex items-center gap-1 text-[10px] font-extrabold"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                    </span>
                  )}

                  {/* LÁPIS DE EDIÇÃO */}
                  <button
                    onClick={() => handleOpenEdit(video)}
                    title="Editar informações"
                    className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* LIXEIRA DE EXCLUSÃO */}
                  <button
                    onClick={() => deletarAnalyzedVideo(video.id)}
                    title="Excluir vídeo"
                    className="p-2 bg-white/90 hover:bg-rose-600 hover:text-white text-slate-700 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>

              {/* Informações do Vídeo */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{video.title}</h3>
                  <span className="text-xs font-semibold text-slate-400">{video.date}</span>
                </div>

                {video.isNotified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" /> Lote Notificado no Mercado
                  </span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* PONTO 3: POP-UP DE CONFIRMAÇÃO DE NOTIFICAÇÃO DO LOTE */}
      {videoParaNotificar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <Bell className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Disponibilizar Lote para Mercado?
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Deseja notificar os compradores parceiros sobre o lote <strong className="text-slate-900">{videoParaNotificar.title}</strong> com contagem auditada de <strong className="text-slate-900">{videoParaNotificar.cattleCount} cabeças</strong>?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setVideoParaNotificar(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarNotificacao}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Sim, Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP DA CONTAGEM REGRESSIVA DE 5 SEGUNDOS (GLOBAL DA APLICAÇÃO) */}
      {modalContagemAberta && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-black text-2xl border border-emerald-200">
              {tempoRestante}s
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Lançando Notificação de Lote
            </h3>

            <p className="text-xs text-slate-500">
              O lote será publicado para todos os compradores parceiros em {tempoRestante} segundos.
            </p>

            <button
              onClick={cancelarContagemRegressiva}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 cursor-pointer"
            >
              Cancelar Lançamento
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingVideo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Editar Vídeo Analisado</h3>
              <button onClick={() => setEditingVideo(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Data</label>
                  <input
                    type="date"
                    value={editRawDate}
                    onChange={(e) => setEditRawDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contagem de Gado</label>
                  <input
                    type="number"
                    value={editCattleCount}
                    onChange={(e) => setEditCattleCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingVideo(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPRODUTOR DE VÍDEO */}
      {playingVideoUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-4 space-y-3 border border-slate-700">
            <div className="flex justify-end">
              <button onClick={() => setPlayingVideoUrl(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video src={playingVideoUrl} controls autoPlay className="w-full rounded-xl max-h-[70vh] object-contain" />
          </div>
        </div>
      )}

    </div>
  );
}