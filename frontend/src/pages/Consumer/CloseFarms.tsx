// src/components/CloseFarms.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Tractor, 
  Phone, 
  ArrowRight, 
  Store, 
  RefreshCw, 
  PanelLeftClose, 
  PanelLeftOpen,
  Loader2,
  Building2,
  X
} from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const consumerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const farmIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface FazendaReal {
  id: string;
  nome: string;
  localizacao: string;
  capacidadeGado: number;
  totalGadoDisponivel: number;
  geojson?: string | null;
  proprietario: {
    nome: string;
    telefone: string;
    email: string;
  };
  lat: number;
  lng: number;
  distanciaCalculada?: number;
}

function calcularDistanciaKM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

function getGeoJsonCenter(geoJsonInput: any): [number, number] | null {
  try {
    const geo = typeof geoJsonInput === 'string' ? JSON.parse(geoJsonInput) : geoJsonInput;
    if (!geo) return null;

    let coords: [number, number][] = [];

    const extractCoords = (geometry: any) => {
      if (!geometry) return;
      if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
        coords.push([geometry.coordinates[1], geometry.coordinates[0]]);
      } else if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
        geometry.coordinates[0].forEach((c: number[]) => coords.push([c[1], c[0]]));
      } else if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
        geometry.coordinates.forEach((poly: any) => {
          if (Array.isArray(poly) && Array.isArray(poly[0])) {
            poly[0].forEach((c: number[]) => coords.push([c[1], c[0]]));
          }
        });
      }
    };

    if (geo.type === 'FeatureCollection' && Array.isArray(geo.features)) {
      geo.features.forEach((f: any) => extractCoords(f.geometry));
    } else if (geo.type === 'Feature') {
      extractCoords(geo.geometry);
    } else if (geo.type) {
      extractCoords(geo);
    }

    if (coords.length === 0) return null;

    const sumLat = coords.reduce((acc, c) => acc + c[0], 0);
    const sumLng = coords.reduce((acc, c) => acc + c[1], 0);
    return [sumLat / coords.length, sumLng / coords.length];
  } catch (e) {
    return null;
  }
}

// Geocodificação resiliente com fallback (Endereço Completo -> Cidade/UF)
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address || address.trim() === '' || address === 'Não informada') return null;
  
  const searchTerms: string[] = [address];

  if (address.includes(',')) {
    const partes = address.split(',');
    const cidadeUF = partes[partes.length - 1].trim();
    if (cidadeUF && !searchTerms.includes(cidadeUF)) {
      searchTerms.push(cidadeUF);
    }
  }

  for (const term of searchTerms) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.error('Erro ao geocodificar termo:', term, e);
    }
  }

  return null;
}

function MapResizeHandler({ isSidebarOpen }: { isSidebarOpen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
      setTimeout(() => {
        map.invalidateSize();
      }, 350);
    };

    map.on('zoomend', handleResize);
    map.on('resize', handleResize);
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      map.off('zoomend', handleResize);
      map.off('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [map, isSidebarOpen]);

  return null;
}

function MapFocus({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function CloseFarms() {
  const { 
    userSession, 
    filtroCidade, 
    setFiltroCidade, 
    filtroDistancia, 
    setFiltroDistancia,
    comandoMapa,
    setComandoMapa 
  } = useFarm();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fazendas, setFazendas] = useState<FazendaReal[]>([]);
  const [loading, setLoading] = useState(true);

  const [consumidorLocation, setConsumidorLocation] = useState<[number, number]>([-21.1704, -47.8103]);
  const [consumidorEndereco, setConsumidorEndereco] = useState<string>('Buscando localização...');

  const [fazendaSelecionada, setFazendaSelecionada] = useState<FazendaReal | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [duracaoMinutos, setDuracaoMinutos] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-21.1704, -47.8103]);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);

      let localConsumidor = userSession?.localizacao;

      // Se a localização não estiver no userSession, busca via API
      if ((!localConsumidor || localConsumidor === 'Não informada') && userSession?.id && userSession?.tipo === 'comprador') {
        try {
          const resCons = await api.get(`/api/consumidores/${userSession.id}`);
          if (resCons.data?.localizacao) {
            localConsumidor = resCons.data.localizacao;
          }
        } catch (e) {
          console.error('Erro ao buscar dados do consumidor:', e);
        }
      }

      const enderecoExibicao = localConsumidor || 'Não informada';
      setConsumidorEndereco(enderecoExibicao);

      if (localConsumidor) {
        const coordsConsumidor = await geocodeAddress(localConsumidor);
        if (coordsConsumidor) {
          setConsumidorLocation(coordsConsumidor);
          setMapCenter(coordsConsumidor);
        }
      }

      try {
        const res = await api.get('/api/fazendas/mapa');
        if (res.data?.sucesso && Array.isArray(res.data.fazendas)) {
          
          const fazendasProcessadas = await Promise.all(
            res.data.fazendas.map(async (f: any) => {
              let coords = getGeoJsonCenter(f.geojson);

              if (!coords && f.localizacao) {
                coords = await geocodeAddress(f.localizacao);
              }

              const latFinal = coords ? coords[0] : -21.1500 + (Math.random() - 0.5) * 0.2;
              const lngFinal = coords ? coords[1] : -47.8000 + (Math.random() - 0.5) * 0.2;

              return {
                id: f.id,
                nome: f.nome,
                localizacao: f.localizacao || 'Não informada',
                capacidadeGado: f.capacidadeGado || 0,
                totalGadoDisponivel: f.totalGadoDisponivel || 0,
                geojson: f.geojson,
                proprietario: {
                  nome: f.proprietario?.nome || 'Produtor Rural',
                  telefone: f.proprietario?.telefone || '(16) 99876-5432',
                  email: f.proprietario?.email || ''
                },
                lat: latFinal,
                lng: lngFinal
              };
            })
          );

          setFazendas(fazendasProcessadas);
        }
      } catch (err) {
        console.error('Erro ao carregar fazendas no mapa:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, [userSession]);

  const fazendasFiltradas = useMemo(() => {
    return fazendas
      .map((f) => {
        const dist = (f.lat && f.lng && consumidorLocation)
          ? calcularDistanciaKM(consumidorLocation[0], consumidorLocation[1], f.lat, f.lng)
          : 0;
        return { ...f, distanciaCalculada: dist };
      })
      .filter((f) => {
        if (filtroCidade && !f.localizacao.toLowerCase().includes(filtroCidade.toLowerCase())) {
          return false;
        }
        if (filtroDistancia && f.distanciaCalculada > Number(filtroDistancia)) {
          return false;
        }
        return true;
      });
  }, [fazendas, filtroCidade, filtroDistancia, consumidorLocation]);

  const handleSelectFazenda = async (fazenda: FazendaReal) => {
    setFazendaSelecionada(fazenda);
    setMapCenter([fazenda.lat, fazenda.lng]);
    setLoadingRoute(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${consumidorLocation[1]},${consumidorLocation[0]};${fazenda.lng},${fazenda.lat}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        const parsedCoords: [number, number][] = route.geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );

        setRouteCoords(parsedCoords);
        setDistanciaKm(Number((route.distance / 1000).toFixed(1)));
        setDuracaoMinutos(Math.round(route.duration / 60));
      }
    } catch (error) {
      console.error('Erro ao buscar rota no OSRM:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (!comandoMapa || fazendasFiltradas.length === 0) return;

    if (comandoMapa.tipo === 'ROTA_MAIS_PROXIMA') {
      const fazendaMaisProxima = [...fazendasFiltradas].sort(
        (a, b) => (a.distanciaCalculada || 0) - (b.distanciaCalculada || 0)
      )[0];

      if (fazendaMaisProxima) {
        handleSelectFazenda(fazendaMaisProxima);
      }
      setComandoMapa(null);
    } else if (comandoMapa.tipo === 'SELECIONAR_FAZENDA' && comandoMapa.fazendaNome) {
      const termo = comandoMapa.fazendaNome.toLowerCase();
      const encontrada = fazendasFiltradas.find((f) => f.nome.toLowerCase().includes(termo));
      if (encontrada) {
        handleSelectFazenda(encontrada);
      }
      setComandoMapa(null);
    }
  }, [comandoMapa, fazendasFiltradas]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 overflow-hidden text-slate-800 relative">

      <aside
        className={`${
          isSidebarOpen ? 'w-full lg:w-96' : 'w-0 hidden lg:hidden'
        } bg-white border-r border-slate-200/80 flex flex-col z-10 shadow-sm shrink-0 transition-all duration-300 relative`}
      >
        <header className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-0.5">
              <Store className="w-5 h-5" />
              <h1 className="text-lg font-bold tracking-tight text-slate-900">Fazendas Próximas</h1>
            </div>
            <p className="text-xs text-slate-500">
              {fazendasFiltradas.length} de {fazendas.length} propriedades filtradas
            </p>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Retrair painel lateral"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 m-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Sua Unidade / Comprador
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {userSession?.empresa || userSession?.nome || 'Comprador'}
            </span>
            <span className="text-[11px] text-slate-500 truncate block">
              {consumidorEndereco}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Carregando fazendas reais...</span>
            </div>
          ) : fazendasFiltradas.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium space-y-1">
              <p className="font-bold text-slate-600">Nenhuma fazenda encontrada com os filtros atuais.</p>
              <p className="text-[11px]">Tente alterar a cidade ou expandir a distância em km.</p>
            </div>
          ) : (
            fazendasFiltradas.map((fazenda) => {
              const isSelected = fazendaSelecionada?.id === fazenda.id;
              return (
                <div
                  key={fazenda.id}
                  onClick={() => handleSelectFazenda(fazenda)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/60 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Tractor className="w-4 h-4 text-emerald-600 shrink-0" />
                      {fazenda.nome}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {fazenda.distanciaCalculada} km
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                          Selecionada
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    Produtor: <span className="text-slate-700 font-medium">{fazenda.proprietario.nome}</span>
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                      Capacidade: {fazenda.capacidadeGado} cab.
                    </span>
                    {fazenda.totalGadoDisponivel > 0 && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                        {fazenda.totalGadoDisponivel} à venda
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <button className="text-emerald-600 font-bold flex items-center gap-1 hover:underline">
                      Traçar Rota <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {fazendaSelecionada && (
          <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Distância de Transporte
              </span>
              {loadingRoute ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Calculando rota...
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-emerald-400">
                    {distanciaKm} km
                  </span>
                  {duracaoMinutos && (
                    <span className="text-xs text-slate-300">
                      (~{duracaoMinutos} min)
                    </span>
                  )}
                </div>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${consumidorLocation[0]},${consumidorLocation[1]}&destination=${fazendaSelecionada.lat},${fazendaSelecionada.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" />
              GPS
            </a>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 relative h-full w-full bg-slate-100">
        
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white border border-slate-200/90 text-slate-800 p-2.5 rounded-xl shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs cursor-pointer shrink-0"
            title={isSidebarOpen ? "Retrair painel" : "Expandir painel"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-emerald-600" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Fazendas ({fazendasFiltradas.length})</span>
          </button>

          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 w-40 sm:w-52">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              type="text"
              placeholder="Cidade..."
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {filtroCidade && (
              <button onClick={() => setFiltroCidade('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 w-36 sm:w-44">
            <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              type="number"
              min="0"
              placeholder="Distância (km)..."
              value={filtroDistancia}
              onChange={(e) => setFiltroDistancia(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
            {filtroDistancia && (
              <button onClick={() => setFiltroDistancia('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <MapContainer
          center={mapCenter}
          zoom={9}
          className="h-full w-full z-0"
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <MapResizeHandler isSidebarOpen={isSidebarOpen} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFocus center={mapCenter} />

          <Marker position={consumidorLocation} icon={consumerIcon}>
            <Popup>
              <div className="p-1 font-sans">
                <strong className="block text-slate-900 font-bold">{userSession?.empresa || 'Sua Empresa'}</strong>
                <span className="text-xs text-slate-600 block">{consumidorEndereco}</span>
              </div>
            </Popup>
          </Marker>

          {fazendasFiltradas.map((fazenda) => (
            <Marker
              key={fazenda.id}
              position={[fazenda.lat, fazenda.lng]}
              icon={farmIcon}
              eventHandlers={{
                click: () => handleSelectFazenda(fazenda),
              }}
            >
              <Popup>
                <div className="p-1 font-sans">
                  <strong className="block text-slate-900 font-bold">{fazenda.nome}</strong>
                  <span className="text-xs text-slate-600 block my-0.5">Produtor: {fazenda.proprietario.nome}</span>
                  <span className="text-xs text-slate-500 block mb-1">Local: {fazenda.localizacao}</span>
                  <span className="text-xs font-extrabold text-emerald-700 block mb-1">Distância: {fazenda.distanciaCalculada} km</span>
                  <button
                    onClick={() => handleSelectFazenda(fazenda)}
                    className="mt-1 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Calcular rota de transporte
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: '#059669',
                weight: 5,
                opacity: 0.85,
              }}
            />
          )}
        </MapContainer>
      </main>
    </div>
  );
}