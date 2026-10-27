import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  Maximize2, 
  CheckCircle2, 
  Plus, 
  Check, 
  X, 
  Tractor,
  Edit2,
  Layers,
  Loader2,
  FileText,
  Trash2,
  Map as MapIcon,
  MousePointerClick,
  RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFarm, type AreaUnit } from '../../context/FarmContext';
import { api } from '../../services/api';

interface Pasto {
  id: string;
  nome: string;
  geojson?: string;
  createdAt?: string;
}

const customLabelStyle = `
  .pasto-tooltip-label {
    background-color: rgba(15, 23, 42, 0.9) !important;
    border: 1px solid #f59e0b !important;
    color: #fef08a !important;
    font-weight: 800 !important;
    font-size: 11px !important;
    border-radius: 8px !important;
    padding: 3px 8px !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
  }
`;

function MapController({ geojson }: { geojson: any }) {
  const map = useMap();

  useEffect(() => {
    if (geojson) {
      try {
        const layer = L.geoJSON(geojson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (e) {
        console.error('Erro ao ajustar limites do mapa:', e);
      }
    }
  }, [geojson, map]);

  return null;
}

export function FarmManagement() {
  const { activeFarm, userFarms, setActiveFarmById, updateActiveFarm, addNewFarm, formatAreaText } = useFarm();

  const [name, setName] = useState(activeFarm.name);
  const [owner, setOwner] = useState(activeFarm.owner);
  const [location, setLocation] = useState(activeFarm.location);
  const [areaValue, setAreaValue] = useState<number | string>(activeFarm.areaValue);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(activeFarm.areaUnit);
  const [cattleCapacity, setCattleCapacity] = useState<number | string>(activeFarm.cattleCapacity);

  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const [modalNovaFazenda, setModalNovaFazenda] = useState(false);

  // Estados do Mapa e Geometrias
  const [terrenoGeoJson, setTerrenoGeoJson] = useState<any | null>(null);
  const [pastos, setPastos] = useState<Pasto[]>([]);
  const [carregandoKml, setCarregandoKml] = useState(false);
  const [kmlSucesso, setKmlSucesso] = useState<string | null>(null);
  const [kmlErro, setKmlErro] = useState<string | null>(null);

  // Estado da Porção Selecionada no Mapa pelo Usuário
  const [porcaoSelecionada, setPorcaoSelecionada] = useState<any | null>(null);
  const [novoPastoNome, setNovoPastoNome] = useState('');
  const [criandoPasto, setCriandoPasto] = useState(false);
  const [pastoEditandoId, setPastoEditandoId] = useState<string | null>(null);
  const [novoNomePasto, setNovoNomePasto] = useState('');

  // Estados Modal Nova Fazenda
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState(activeFarm.owner);
  const [newLocation, setNewLocation] = useState('');
  const [newAreaValue, setNewAreaValue] = useState<number | string>('');
  const [newAreaUnit, setNewAreaUnit] = useState<AreaUnit>('ha');
  const [newCattleCapacity, setNewCattleCapacity] = useState<number | string>('');

  useEffect(() => {
    setName(activeFarm.name);
    setOwner(activeFarm.owner);
    setLocation(activeFarm.location);
    setAreaValue(activeFarm.areaValue);
    setAreaUnit(activeFarm.areaUnit);
    setCattleCapacity(activeFarm.cattleCapacity);

    if (activeFarm.geojson) {
      try {
        const parsed = typeof activeFarm.geojson === 'string' ? JSON.parse(activeFarm.geojson) : activeFarm.geojson;
        setTerrenoGeoJson(parsed);
      } catch (e) {
        console.error('Erro ao ler GeoJSON da fazenda:', e);
      }
    } else {
      setTerrenoGeoJson(null);
    }

    if (activeFarm.id && activeFarm.id !== 'default-farm' && !activeFarm.id.startsWith('farm-')) {
      carregarPastos(activeFarm.id);
    } else {
      setPastos([]);
    }
  }, [activeFarm]);

  const carregarPastos = async (fazendaId: string) => {
    try {
      const res = await api.get(`/api/fazendas/${fazendaId}/pastos`);
      if (res.data?.sucesso && Array.isArray(res.data.pastos)) {
        setPastos(res.data.pastos);
      }
    } catch (err) {
      console.error('Erro ao carregar pastos:', err);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateActiveFarm({
      name,
      owner,
      location,
      areaValue: Number(areaValue) || 0,
      areaUnit,
      cattleCapacity: Number(cattleCapacity) || 0
    });

    setSalvoComSucesso(true);
    setTimeout(() => setSalvoComSucesso(false), 3000);
  };

  const handleKmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFarm.id || activeFarm.id === 'default-farm') return;

    setCarregandoKml(true);
    setKmlSucesso(null);
    setKmlErro(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/api/fazendas/${activeFarm.id}/kml`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.sucesso) {
        setKmlSucesso('Terreno digitalizado com sucesso!');
        setTerrenoGeoJson(res.data.geojson);
        await updateActiveFarm({ geojson: JSON.stringify(res.data.geojson) });
      }
    } catch (err: any) {
      console.error('Erro no upload de KML:', err);
      setKmlErro(err.response?.data?.erro || 'Erro ao processar o arquivo KML.');
    } finally {
      setCarregandoKml(false);
      e.target.value = '';
    }
  };

  // Salva apenas a porção individual clicada
  const handleSalvarPorcaoComoPasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPastoNome.trim() || !activeFarm.id) return;

    setCriandoPasto(true);
    try {
      const res = await api.post(`/api/fazendas/${activeFarm.id}/pastos`, {
        nome: novoPastoNome.trim(),
        geojson: porcaoSelecionada
      });

      if (res.data?.sucesso && res.data.pasto) {
        setPastos((prev) => [...prev, res.data.pasto]);
        setNovoPastoNome('');
        setPorcaoSelecionada(null);
      }
    } catch (err) {
      alert('Erro ao cadastrar pasto.');
    } finally {
      setCriandoPasto(false);
    }
  };

  const handleSalvarNomePasto = async (pastoId: string) => {
    if (!novoNomePasto.trim()) return;

    try {
      await api.put(`/api/pastos/${pastoId}`, { nome: novoNomePasto.trim() });
      setPastos((prev) =>
        prev.map((p) => (p.id === pastoId ? { ...p, nome: novoNomePasto.trim() } : p))
      );
      setPastoEditandoId(null);
      setNovoNomePasto('');
    } catch (err) {
      alert('Falha ao renomear pasto.');
    }
  };

  const handleDeletarPasto = async (pastoId: string) => {
    try {
      await api.delete(`/api/pastos/${pastoId}`);
      setPastos((prev) => prev.filter((p) => p.id !== pastoId));
    } catch (err) {
      alert('Erro ao excluir pasto.');
    }
  };

  // Botão para deletar de uma vez os pastos acumulados no banco de dados
  const handleLimparTodosPastos = async () => {
    if (!activeFarm.id || !window.confirm('Deseja realmente limpar todos os pastos acumulados nesta fazenda?')) return;

    try {
      await api.delete(`/api/fazendas/${activeFarm.id}/pastos`);
      setPastos([]);
    } catch (err) {
      alert('Erro ao limpar pastos.');
    }
  };

  const handleCreateNewFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLocation) return;

    const criada = await addNewFarm({
      name: newName,
      owner: newOwner || 'Seu Tião',
      location: newLocation,
      areaValue: Number(newAreaValue) || 0,
      areaUnit: newAreaUnit,
      cattleCapacity: Number(newCattleCapacity) || 0
    });

    setModalNovaFazenda(false);
    setNewName('');
    setNewLocation('');
    setNewAreaValue('');
    setNewCattleCapacity('');

    if (criada) {
      setKmlSucesso('Nova fazenda cadastrada e selecionada!');
    }
  };

  const isFazendaValida = activeFarm.id && activeFarm.id !== 'default-farm' && !activeFarm.id.startsWith('farm-');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      <style>{customLabelStyle}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestão da Propriedade
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Clique em qualquer porção no mapa para demarcar e nomear seus pastos no terreno.
          </p>
        </div>

        {salvoComSucesso && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dados da propriedade atualizados com sucesso!
          </div>
        )}
      </div>

      {/* SEÇÃO DO MAPA DIGITALIZADO DO TERRENO */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mapa do Terreno</h2>
              <p className="text-xs text-slate-400">Clique em uma demarcação do terreno para nomeá-la como um Pasto</p>
            </div>
          </div>

          <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0">
            {carregandoKml ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <FileText className="w-4 h-4 text-emerald-400" />}
            <span>{carregandoKml ? 'Processando KML...' : 'Importar KML da Fazenda'}</span>
            <input
              type="file"
              accept=".kml"
              onChange={handleKmlUpload}
              disabled={carregandoKml || !isFazendaValida}
              className="hidden"
            />
          </label>
        </div>

        {kmlSucesso && <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{kmlSucesso}</p>}
        {kmlErro && <p className="text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{kmlErro}</p>}

        {/* CONTAINER DO MAPA LEAFLET */}
        <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
          {terrenoGeoJson ? (
            <MapContainer
              center={[-15.7801, -47.9292]}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri"
              />

              {/* 1. Terreno completo digitalizado (Verde) */}
              <GeoJSON
                key={JSON.stringify(terrenoGeoJson)}
                data={terrenoGeoJson}
                style={(feature) => ({
                  color: '#10b981',
                  weight: 2,
                  fillColor: '#059669',
                  fillOpacity: porcaoSelecionada === feature ? 0.6 : 0.2
                })}
                onEachFeature={(feature, layer) => {
                  layer.on({
                    click: () => {
                      setPorcaoSelecionada(feature);
                      // Define sugestão de nome limpa para evitar nomes gigantes do CAR
                      setNovoPastoNome(`Pasto ${pastos.length + 1}`);
                    }
                  });
                }}
              />

              {/* 2. Desenho exclusivo dos pastos salvos (Dourado/Amarelo com Tooltip) */}
              {pastos.map((p) => {
                if (!p.geojson) return null;
                try {
                  const geoData = typeof p.geojson === 'string' ? JSON.parse(p.geojson) : p.geojson;
                  return (
                    <GeoJSON
                      key={`${p.id}-${p.nome}`}
                      data={geoData}
                      style={{
                        color: '#f59e0b',
                        weight: 3,
                        fillColor: '#fbbf24',
                        fillOpacity: 0.55
                      }}
                      onEachFeature={(_, layer) => {
                        layer.bindTooltip(p.nome, {
                          permanent: true,
                          direction: 'center',
                          className: 'pasto-tooltip-label'
                        });
                      }}
                    />
                  );
                } catch (e) {
                  return null;
                }
              })}

              <MapController geojson={terrenoGeoJson} />
            </MapContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900 text-white relative">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
              <MapIcon className="w-12 h-12 text-emerald-400 z-10" />
              <div className="max-w-md z-10">
                <p className="text-sm font-bold">Nenhum mapa digitalizado importado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Importe o arquivo KML para visualizar e selecionar as porções do seu terreno diretamente no mapa.
                </p>
              </div>
            </div>
          )}

          {/* PAINEL FLUTUANTE DE SALVAMENTO DE PORÇÃO SELECIONADA */}
          {porcaoSelecionada && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-700/80 shadow-2xl z-[1000] flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 block">Porção do Terreno Selecionada!</span>
                  <span className="text-[11px] text-slate-300">Digite o nome para criar este pasto individual:</span>
                </div>
              </div>

              <form onSubmit={handleSalvarPorcaoComoPasto} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={novoPastoNome}
                  onChange={(e) => setNovoPastoNome(e.target.value)}
                  placeholder="Nome do pasto"
                  className="px-3.5 py-2 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 w-full md:w-60"
                  required
                />
                <button
                  type="submit"
                  disabled={criandoPasto}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all shrink-0 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Pasto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPorcaoSelecionada(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: FORMULÁRIO DE DADOS + CARD DE RESUMO E PASTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO ESQUERDO: FORMULÁRIO DE EDIÇÃO */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Editar Informações Técnicas</h2>
                <p className="text-xs text-slate-400">Dados cadastrais da propriedade selecionada</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              Ativa no Sistema
            </span>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nome da Fazenda</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Proprietário / Titular</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Localização (Cidade / Estado)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  placeholder="Ex: Itu - SP"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Capacidade Total de Gado</label>
                <input
                  type="number"
                  min="0"
                  value={cattleCapacity}
                  onChange={(e) => setCattleCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Área Total da Propriedade</label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ha">Hectares (ha)</option>
                    <option value="m²">Metros Quadrados (m²)</option>
                    <option value="alq">Alqueires (alq)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/60 flex items-center justify-between">
                <span>Leitura formatada da área:</span>
                <span className="font-extrabold text-slate-900">
                  {formatAreaText(Number(areaValue) || 0, areaUnit)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* LADO DIREITO: RESUMO + DEMARCAÇÕES DE PASTOS */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 relative overflow-hidden">
            <div className="w-full h-28 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="text-center z-10">
                <Tractor className="w-7 h-7 text-emerald-400 mx-auto mb-1" />
                <span className="text-white font-black text-base tracking-tight block truncate">
                  {name || 'Nome da Fazenda'}
                </span>
                <span className="text-slate-400 text-xs font-semibold">{location || 'Localização'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-400 uppercase">Titular</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{owner}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-400 uppercase">Área Total</span>
                <span className="font-extrabold text-emerald-700">
                  {formatAreaText(Number(areaValue) || 0, areaUnit)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 text-xs">
                <span className="font-bold text-slate-400 uppercase">Capacidade</span>
                <span className="font-bold text-slate-900">{cattleCapacity} cabeças</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Pastos & Piquetes</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {pastos.length} pastos
                </span>
                {pastos.length > 0 && (
                  <button
                    onClick={handleLimparTodosPastos}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                    title="Limpar todos os pastos da fazenda"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Limpar Tudo
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {pastos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhum pasto demarcado. Clique em uma porção no mapa para registrar seu primeiro pasto.
                </p>
              ) : (
                pastos.map((pasto) => (
                  <div key={pasto.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    {pastoEditandoId === pasto.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={novoNomePasto}
                          onChange={(e) => setNovoNomePasto(e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                        />
                        <button
                          onClick={() => handleSalvarNomePasto(pasto.id)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPastoEditandoId(null)}
                          className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 shrink-0" />
                          <span className="font-bold text-slate-800 truncate max-w-[180px]">{pasto.nome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setPastoEditandoId(pasto.id);
                              setNovoNomePasto(pasto.nome);
                            }}
                            className="text-slate-400 hover:text-emerald-600 transition-colors p-1 cursor-pointer"
                            title="Renomear pasto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletarPasto(pasto.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Excluir pasto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* SEÇÃO INFERIOR: MINHAS FAZENDAS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Minhas Fazendas Vinculadas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione com qual propriedade deseja trabalhar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovaFazenda(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Cadastrar Nova Fazenda
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {userFarms.map((farm) => {
            const isSelected = farm.isActive;

            return (
              <div
                key={farm.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-emerald-50/40 border-emerald-500/80 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-base">{farm.name}</h3>
                    {isSelected && (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full tracking-wider uppercase">
                        Ativa
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 font-medium">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {farm.location}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      {formatAreaText(farm.areaValue, farm.areaUnit)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Capacidade: {farm.cattleCapacity} cabeças
                    </p>
                  </div>
                </div>

                <div>
                  {isSelected ? (
                    <div className="w-full py-2 bg-emerald-100/60 text-emerald-800 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Propriedade Selecionada
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveFarmById(farm.id)}
                      className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Mudar para esta Fazenda
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CADASTRAR FAZENDA */}
      {modalNovaFazenda && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Fazenda</h3>
              </div>
              <button onClick={() => setModalNovaFazenda(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFarm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Propriedade</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Fazenda Campo Aberto"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Localização</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Botucatu - SP"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Capacidade de Gado</label>
                  <input
                    type="number"
                    value={newCattleCapacity}
                    onChange={(e) => setNewCattleCapacity(e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Área Total</label>
                  <input
                    type="number"
                    value={newAreaValue}
                    onChange={(e) => setNewAreaValue(e.target.value)}
                    placeholder="Valor"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidade</label>
                  <select
                    value={newAreaUnit}
                    onChange={(e) => setNewAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ha">Hectares</option>
                    <option value="m²">m²</option>
                    <option value="alq">Alqueires</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovaFazenda(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cadastrar Fazenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}