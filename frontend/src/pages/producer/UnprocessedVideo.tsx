import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Pencil, 
  Play, 
  X, 
  Film,
  Tractor 
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useVideoProcessing, type RawVideoItem } from '../../context/VideoProcessing';

export function UnprocessedVideo() {
  const { activeFarm } = useFarm();

  const { 
    savedRawVideos, 
    deletarRawVideo, 
    editarRawVideo 
  } = useVideoProcessing();

  // Estados dos Filtros (Idênticos ao ProcessedVideo.tsx)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroOpcao, setFiltroOpcao] = useState<string>('todos');
  const [filtroDataExata, setFiltroDataExata] = useState<string>('');

  // Modais de Edição e Reprodução
  const [editingVideo, setEditingVideo] = useState<RawVideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRawDate, setEditRawDate] = useState('');

  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const videosFiltrados = savedRawVideos.filter((video: RawVideoItem) => {
    if (searchQuery && !video.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filtroDataExata && video.rawDate !== filtroDataExata) return false;
    if (filtroMes !== 'todos' && !video.rawDate.startsWith(filtroMes)) return false;

    return true;
  });

  const handleOpenEdit = (video: RawVideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditRawDate(video.rawDate);
  };

  const handleSaveEdit = () => {
    if (editingVideo) {
      editarRawVideo(editingVideo.id, editTitle, editRawDate);
      setEditingVideo(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Vídeos Anteriores
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
            <Tractor className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Fazenda: {activeFarm?.name}</span>
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Biblioteca de gravações originais enviadas pelos drones antes do processamento pela IA.
        </p>
      </div>

      {/* BARRA DE FILTROS (DESIGN EXATAMENTE IDÊNTICO À TELA DE VÍDEOS PROCESSADOS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Input 1: Busca por título */}
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

          {/* Input 2: Seletor de Mês */}
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

          {/* Input 3: Seletor Geral */}
          <div className="md:col-span-3">
            <select
              value={filtroOpcao}
              onChange={(e) => setFiltroOpcao(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos os Vídeos Brutos</option>
              <option value="recentes">Mais Recentes</option>
            </select>
          </div>

          {/* Input 4: Seletor de Data Exata */}
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

      {/* GRADE DE VÍDEOS BRUTOS */}
      {videosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-3">
          <Film className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold">Nenhum vídeo bruto encontrado.</p>
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
                
                {/* Overlay com Botão de Play */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPlayingVideoUrl(video.videoUrl)}
                    className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                  </button>
                </div>

                {/* ÍCONES DE AÇÃO DA GALERIA (LÁPIS E LIXEIRA) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(video)}
                    title="Editar informações"
                    className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deletarRawVideo(video.id)}
                    title="Excluir vídeo"
                    className="p-2 bg-white/90 hover:bg-rose-600 hover:text-white text-slate-700 rounded-xl shadow-md transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Informações do Vídeo */}
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{video.title}</h3>
                  <span className="text-xs font-semibold text-slate-400">{video.date}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingVideo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Editar Vídeo Bruto</h3>
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

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Data</label>
                <input
                  type="date"
                  value={editRawDate}
                  onChange={(e) => setEditRawDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingVideo(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
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
              <button onClick={() => setPlayingVideoUrl(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
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