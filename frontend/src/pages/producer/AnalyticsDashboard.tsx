import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  PlusCircle, 
  MinusCircle, 
  Box, 
  DollarSign, 
  Loader2,
  Filter,
  BarChart2,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  PieChart as PieIcon,
  BarChart3,
  MapPin,
  Users,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

declare const echarts: any;

export interface LotItem {
  id: string;
  pastoId?: string;
  pastoSelecionadoId?: string;
  quantidadeOriginal: number;
  quantidadeCabecas: number;
  quantidadeVendida: number;
  valorTotal: number;
  valorVendido: number;
  status: 'DISPONIVEL' | 'VENDIDO' | 'PARCIAL' | 'RESERVADO' | 'ANALISE_CLIENTE' | 'RESERVA';
  createdAt: string;
  updatedAt?: string;
}

export interface Pasto {
  id: string;
  nome: string;
  geojson?: any;
}

export interface ProcessEvent {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA';
  nomeProcesso: string;
  detalhe: string;
  data: string;
  hora: string;
  timestamp: number;
  quantidade: number;
  valor: number;
  statusLabel: string;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const customDensityLabelStyle = `
  .pasto-density-tooltip {
    background-color: rgba(15, 23, 42, 0.95) !important;
    border: 1px solid #10b981 !important;
    color: #ffffff !important;
    font-weight: 800 !important;
    font-size: 11px !important;
    border-radius: 10px !important;
    padding: 6px 12px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4) !important;
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
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.error('Erro ao ajustar mapa:', e);
      }
    }
  }, [geojson, map]);

  return null;
}

const getCorDensidade = (quantidade: number) => {
  if (quantidade === 0) return { fill: '#cbd5e1', stroke: '#94a3b8' };
  if (quantidade <= 20) return { fill: '#86efac', stroke: '#16a34a' };
  if (quantidade <= 50) return { fill: '#fde047', stroke: '#ca8a04' };
  if (quantidade <= 100) return { fill: '#fb923c', stroke: '#ea580c' };
  return { fill: '#f87171', stroke: '#dc2626' };
};

let cacheLotesSession: { farmId: string; lotes: LotItem[] } | null = null;

export const AnalyticsDashboard: React.FC = () => {
  const { activeFarm } = useFarm();
  
  const selectedYear = 2026;
  const [selectedMonth, setSelectedMonth] = useState<number | 'TODOS'>('TODOS');
  const [filterProcessType, setFilterProcessType] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');

  const [lotes, setLotes] = useState<LotItem[]>(() => {
    if (cacheLotesSession && cacheLotesSession.farmId === activeFarm?.id) {
      return cacheLotesSession.lotes;
    }
    return [];
  });

  const [pastos, setPastos] = useState<Pasto[]>([]);
  const [loading, setLoading] = useState<boolean>(
    !cacheLotesSession || cacheLotesSession.farmId !== activeFarm?.id
  );
  
  const [echartsLoaded, setEchartsLoaded] = useState<boolean>(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const pieChartRef = useRef<HTMLDivElement>(null);
  const pieChartInstanceRef = useRef<any>(null);

  const barChartRef = useRef<HTMLDivElement>(null);
  const barChartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof echarts !== 'undefined') {
      setEchartsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    script.async = true;
    script.onload = () => setEchartsLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Carrega lotes e pastos da fazenda ativa
  useEffect(() => {
    if (!activeFarm?.id) return;

    if (!cacheLotesSession || cacheLotesSession.farmId !== activeFarm.id) {
      setLoading(true);
    }

    // 1. Carregar Pastos
    api.get(`/api/fazendas/${activeFarm.id}/pastos`)
      .then((res) => {
        if (res.data?.sucesso && Array.isArray(res.data.pastos)) {
          setPastos(res.data.pastos);
        }
      })
      .catch((err) => console.error('Erro ao buscar pastos:', err));

    // 2. Carregar Lotes do Mercado
    api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`)
      .then((res) => {
        const lotesBD: any[] = res.data?.lotes || [];
        
        const lotesFormatados: LotItem[] = lotesBD.map((l) => {
          let propQtd = 0;
          let propVal = 0;
          let pastoIdMetadados = l.pastoId || l.pastoSelecionadoId || '';

          if (l.consumerPhone && typeof l.consumerPhone === 'string' && l.consumerPhone.startsWith('{')) {
            try {
              const parsed = JSON.parse(l.consumerPhone);
              propQtd = Number(parsed.propostaQtd || 0);
              propVal = Number(parsed.propostaValor || 0);
              if (parsed.pastoId) pastoIdMetadados = parsed.pastoId;
            } catch (e) {
              console.error('Erro ao ler metadados:', e);
            }
          }

          const quantOriginal = Number(l.quantidadeCabecas || 0);
          const quantVendida = propQtd > 0 
            ? propQtd 
            : Number(l.quantidadeVendida || l.closedQuantity || (l.status === 'VENDIDO' ? quantOriginal : 0));

          const valOriginal = Number(l.valorTotal || l.valor || l.valorLote || 0);
          const valVendido = propVal > 0 
            ? propVal 
            : Number(l.closedValue || l.valorVendido || (l.status === 'VENDIDO' ? valOriginal : 0));

          return {
            id: l.id,
            pastoId: pastoIdMetadados,
            quantidadeOriginal: quantOriginal,
            quantidadeCabecas: quantOriginal,
            quantidadeVendida: quantVendida,
            valorTotal: valOriginal,
            valorVendido: valVendido,
            status: l.status || 'DISPONIVEL',
            createdAt: l.createdAt || new Date().toISOString(),
            updatedAt: l.updatedAt || l.createdAt || new Date().toISOString()
          };
        });

        cacheLotesSession = { farmId: activeFarm.id, lotes: lotesFormatados };
        setLotes(lotesFormatados);
      })
      .catch((err) => console.error('Erro ao carregar lotes do backend:', err))
      .finally(() => setLoading(false));
  }, [activeFarm?.id]);

  const terrenoGeoJson = useMemo(() => {
    if (!activeFarm?.geojson) return null;
    try {
      return typeof activeFarm.geojson === 'string' ? JSON.parse(activeFarm.geojson) : activeFarm.geojson;
    } catch (e) {
      return null;
    }
  }, [activeFarm?.geojson]);

  const lotesFiltradosPeriodo = lotes.filter((l) => {
    const dataCriacao = new Date(l.createdAt);
    if (dataCriacao.getFullYear() !== selectedYear) return false;

    if (selectedMonth !== 'TODOS') {
      return dataCriacao.getMonth() === selectedMonth;
    }
    return true;
  });

  // 1. Entrada de Gados
  const entradaGadosCard = lotesFiltradosPeriodo.reduce((sum, l) => sum + (l.quantidadeOriginal || l.quantidadeCabecas), 0);

  // 2. Saída de Gados
  const saidaGadosCard = lotesFiltradosPeriodo.reduce((sum, l) => sum + l.quantidadeVendida, 0);

  // 3. Gados Restantes
  const gadosRestantesCard = Math.max(0, entradaGadosCard - saidaGadosCard);

  // 4. Entrada Financeira
  const entradaFinanceiraCard = lotesFiltradosPeriodo.reduce((sum, l) => sum + (l.valorVendido > 0 ? l.valorVendido : 0), 0);

  // Porcentagem de saída de gados
  const porcentagemSaida = useMemo(() => {
    if (!entradaGadosCard) return 0;
    return Math.round((saidaGadosCard / entradaGadosCard) * 100);
  }, [entradaGadosCard, saidaGadosCard]);

  // CÁLCULO DENSIDADE DOS PASTOS (Entrada - Saída = Sobra no Pasto)
  const pastosComDensidade = useMemo(() => {
    return pastos.map((pasto) => {
      const lotesDoPasto = lotesFiltradosPeriodo.filter((l) => l.pastoId === pasto.id || l.pastoSelecionadoId === pasto.id);
      const entradaPasto = lotesDoPasto.reduce((sum, l) => sum + (l.quantidadeOriginal || l.quantidadeCabecas), 0);
      const saidaPasto = lotesDoPasto.reduce((sum, l) => sum + l.quantidadeVendida, 0);
      const quantidadeGadoAtual = Math.max(0, entradaPasto - saidaPasto);

      return {
        ...pasto,
        quantidadeGadoAtual
      };
    });
  }, [pastos, lotesFiltradosPeriodo]);

  const totalGadoNoMapa = useMemo(() => {
    return pastosComDensidade.reduce((sum, p) => sum + p.quantidadeGadoAtual, 0);
  }, [pastosComDensidade]);

  // HISTÓRICO DE PROCESSOS
  const historicoProcessos: ProcessEvent[] = [];

  lotesFiltradosPeriodo.forEach((l) => {
    const dtCriacao = new Date(l.createdAt);
    const qtdEntrada = l.quantidadeOriginal || l.quantidadeCabecas;

    historicoProcessos.push({
      id: `ent-${l.id}`,
      tipo: 'ENTRADA',
      nomeProcesso: 'Entrada de gado',
      detalhe: `Lote de ${qtdEntrada} cabeças anunciado`,
      data: dtCriacao.toLocaleDateString('pt-BR'),
      hora: dtCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: dtCriacao.getTime(),
      quantidade: qtdEntrada,
      valor: l.valorTotal,
      statusLabel: 'No Mercado'
    });

    if (l.quantidadeVendida > 0 || l.status === 'VENDIDO' || l.status === 'ANALISE_CLIENTE') {
      const dtVenda = new Date(l.updatedAt || l.createdAt);
      historicoProcessos.push({
        id: `sai-${l.id}`,
        tipo: 'SAIDA',
        nomeProcesso: 'Saída de gado',
        detalhe: `Proposta aceita e lote transferido`,
        data: dtVenda.toLocaleDateString('pt-BR'),
        hora: dtVenda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: dtVenda.getTime() + 1,
        quantidade: l.quantidadeVendida,
        valor: l.valorVendido > 0 ? l.valorVendido : l.valorTotal,
        statusLabel: 'Concluído'
      });
    }
  });

  historicoProcessos.sort((a, b) => b.timestamp - a.timestamp);

  const historicoFiltrado = historicoProcessos.filter((proc) => {
    if (filterProcessType === 'ENTRADA') return proc.tipo === 'ENTRADA';
    if (filterProcessType === 'SAIDA') return proc.tipo === 'SAIDA';
    return true;
  });

  // Top 5 Meses com Maior Saída de Gado
  const top5MesesSaida = useMemo(() => {
    const totaisPorMes = MESES.map((nomeMes, index) => {
      const totalSaidaMes = lotes.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === index;
      }).reduce((sum, l) => sum + l.quantidadeVendida, 0);

      return {
        nome: nomeMes.substring(0, 3),
        nomeCompleto: nomeMes,
        valor: totalSaidaMes
      };
    });

    return totaisPorMes
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [lotes, selectedYear]);

  // 1. ECHARTS: LINHA DE PROGRESSÃO
  useEffect(() => {
    if (!echartsLoaded || !chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    let xAxisCategories: string[] = [];
    let serieEntrada: number[] = [];
    let serieSaida: number[] = [];
    let serieRestante: number[] = [];

    if (selectedMonth === 'TODOS') {
      xAxisCategories = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      serieEntrada = new Array(12).fill(0);
      serieSaida = new Array(12).fill(0);
      serieRestante = new Array(12).fill(0);

      MESES.forEach((_, monthIndex) => {
        const lotesMes = lotes.filter((l) => {
          const d = new Date(l.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === monthIndex;
        });

        const ent = lotesMes.reduce((s, l) => s + (l.quantidadeOriginal || l.quantidadeCabecas), 0);
        const sai = lotesMes.reduce((s, l) => s + l.quantidadeVendida, 0);
        const res = Math.max(0, ent - sai);

        serieEntrada[monthIndex] = ent;
        serieSaida[monthIndex] = sai;
        serieRestante[monthIndex] = res;
      });

    } else {
      xAxisCategories = ['Dias 1-5', 'Dias 6-10', 'Dias 11-15', 'Dias 16-20', 'Dias 21-25', 'Dias 26-31'];
      serieEntrada = new Array(6).fill(0);
      serieSaida = new Array(6).fill(0);
      serieRestante = new Array(6).fill(0);

      const lotesDoMes = lotes.filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });

      lotesDoMes.forEach((l) => {
        const dia = new Date(l.createdAt).getDate();
        let binIdx = 0;
        if (dia >= 1 && dia <= 5) binIdx = 0;
        else if (dia >= 6 && dia <= 10) binIdx = 1;
        else if (dia >= 11 && dia <= 15) binIdx = 2;
        else if (dia >= 16 && dia <= 20) binIdx = 3;
        else if (dia >= 21 && dia <= 25) binIdx = 4;
        else binIdx = 5;

        serieEntrada[binIdx] += (l.quantidadeOriginal || l.quantidadeCabecas);
        serieSaida[binIdx] += l.quantidadeVendida;
      });

      for (let i = 0; i < 6; i++) {
        serieRestante[i] = Math.max(0, serieEntrada[i] - serieSaida[i]);
      }
    }

    const option = {
      color: ['#10b981', '#f59e0b', '#3b82f6'],
      title: {
        text: selectedMonth === 'TODOS' 
          ? `Fluxo do Rebanho - Ano ${selectedYear}` 
          : `Fluxo Detalhado de ${MESES[selectedMonth]} / ${selectedYear}`,
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a', fontWeight: 'bold' }
      },
      legend: { data: ['Entrada', 'Saída', 'Restante'], top: 25, right: 10 },
      grid: { left: '2%', right: '3%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisCategories,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontWeight: '600' }
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: [
        { name: 'Entrada', type: 'line', smooth: true, itemStyle: { color: '#10b981' }, lineStyle: { width: 3, color: '#10b981' }, showSymbol: false, data: serieEntrada },
        { name: 'Saída', type: 'line', smooth: true, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 3, color: '#f59e0b' }, showSymbol: false, data: serieSaida },
        { name: 'Restante', type: 'line', smooth: true, itemStyle: { color: '#3b82f6' }, lineStyle: { width: 3, color: '#3b82f6' }, showSymbol: false, data: serieRestante }
      ]
    };

    chartInstanceRef.current.setOption(option, true);
  }, [echartsLoaded, lotes, selectedYear, selectedMonth]);

  // 2. ECHARTS: ROSCA TAXA DE COMERCIALIZAÇÃO
  useEffect(() => {
    if (!echartsLoaded || !pieChartRef.current) return;

    if (!pieChartInstanceRef.current) {
      pieChartInstanceRef.current = echarts.init(pieChartRef.current);
    }

    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: <strong>{c} cabeças</strong> ({d}%)' },
      legend: { orient: 'horizontal', bottom: '0%', left: 'center', icon: 'circle', textStyle: { color: '#475569', fontWeight: '600', fontSize: 11 } },
      series: [
        {
          name: 'Fluxo do Rebanho',
          type: 'pie',
          radius: ['62%', '82%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 3 },
          label: {
            show: true,
            position: 'center',
            formatter: () => `{val|${porcentagemSaida}%}\n{lbl|Comercializado}`,
            rich: {
              val: { fontSize: 32, fontWeight: '900', color: '#0f172a', lineHeight: 38 },
              lbl: { fontSize: 12, fontWeight: '700', color: '#64748b' }
            }
          },
          data: [
            { value: saidaGadosCard, name: 'Saída (Vendidos)', itemStyle: { color: '#059669' } },
            { value: gadosRestantesCard, name: 'Gados Restantes no Pasto', itemStyle: { color: '#e2e8f0' } }
          ]
        }
      ]
    };

    pieChartInstanceRef.current.setOption(option, true);
  }, [echartsLoaded, saidaGadosCard, gadosRestantesCard, porcentagemSaida]);

  // 3. ECHARTS: BARRAS - TOP 5 MESES DE SAÍDA
  useEffect(() => {
    if (!echartsLoaded || !barChartRef.current) return;

    if (!barChartInstanceRef.current) {
      barChartInstanceRef.current = echarts.init(barChartRef.current);
    }

    const categoriasX = top5MesesSaida.map(m => m.nome);
    const dadosValores = top5MesesSaida.map(m => m.valor);

    const option = {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' }, 
        formatter: (params: any[]) => {
          const item = params[0];
          const mesObj = top5MesesSaida[item.dataIndex];
          return `${mesObj?.nomeCompleto || item.name}: <strong>${item.value} cabeças vendidas</strong>`;
        }
      },
      grid: { top: '12%', left: '3%', right: '3%', bottom: '8%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: categoriasX, 
        axisLine: { show: false }, 
        axisTick: { show: false }, 
        axisLabel: { color: '#64748b', fontWeight: '700', fontSize: 11 } 
      },
      yAxis: { 
        type: 'value', 
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, 
        axisLabel: { color: '#64748b', fontWeight: '600' } 
      },
      series: [
        {
          name: 'Saídas no Mês',
          type: 'bar',
          barWidth: '38%',
          data: dadosValores,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' }
            ])
          }
        }
      ]
    };

    barChartInstanceRef.current.setOption(option, true);
  }, [echartsLoaded, top5MesesSaida]);

  // Redimensionamento Responsivo
  useEffect(() => {
    const handleResize = () => {
      chartInstanceRef.current?.resize();
      pieChartInstanceRef.current?.resize();
      barChartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading && !lotes.length) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 font-sans text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-bold">Carregando dados do dashboard de análise...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      <style>{customDensityLabelStyle}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard de Análise
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Fazenda: {activeFarm?.name || 'Não selecionada'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhe a movimentação de entrada, saída, estoque restante e densidade do rebanho por pasto.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl shadow-2xs flex-wrap">
          <div className="flex items-center gap-2 px-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase">PERÍODO:</span>
          </div>

          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="TODOS">Visão Anual (Todos os Meses)</option>
            {MESES.map((nomeMes, index) => (
              <option key={index} value={index}>
                {nomeMes}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select value={2026} disabled className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none">
              <option value={2026}>2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 CARDS DE INDICADORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">ENTRADA DE GADOS</p>
            <p className="text-3xl font-black text-emerald-600">{entradaGadosCard} <span className="text-xs font-medium text-slate-500">cabeças</span></p>
            <p className="text-[11px] text-slate-400 font-medium">Lançados no mercado</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-amber-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SAÍDA DE GADOS</p>
            <p className="text-3xl font-black text-amber-600">{saidaGadosCard} <span className="text-xs font-medium text-slate-500">cabeças</span></p>
            <p className="text-[11px] text-slate-400 font-medium">Comercializados no mês</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <MinusCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">GADOS RESTANTES</p>
            <p className="text-3xl font-black text-blue-600">{gadosRestantesCard} <span className="text-xs font-medium text-slate-500">disponíveis</span></p>
            <p className="text-[11px] text-slate-400 font-medium">Restante no pasto</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Box className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">ENTRADA FINANCEIRA</p>
            <p className="text-2xl font-black text-white tracking-tight">{entradaFinanceiraCard.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-[11px] text-slate-400 font-medium">Faturamento no período</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* GRÁFICO PRINCIPAL DE PROGRESSÃO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-4 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Progressão do Rebanho (Entrada vs Saída vs Restante)
              </h2>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {selectedMonth === 'TODOS' ? 'Visão Mensal (12 Meses)' : 'Intervalos de 5 dias'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium pl-7">
            O gráfico consolida e registra as informações do rebanho assim que cada determinado período se encerra.
          </p>
        </div>

        <div className="w-full h-[360px] relative">
          {!echartsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
              Carregando biblioteca de gráficos...
            </div>
          )}
          <div ref={chartRef} className="w-full h-full" />
        </div>
      </div>

      {/* SEÇÃO INFERIOR: GRÁFICOS LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Taxa de Comercialização do Rebanho
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proporção de cabeças vendidas em relação ao total de entradas registradas.
              </p>
            </div>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              {porcentagemSaida}% Concluído
            </span>
          </div>

          <div className="py-2 flex items-center justify-center relative">
            <div ref={pieChartRef} className="w-full h-[260px]" />
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Entradas Total</span>
              <span className="text-base font-black text-slate-800">{entradaGadosCard} cabeças</span>
            </div>
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-800 block uppercase">Vendidos (Saída)</span>
              <span className="text-base font-black text-emerald-700">{saidaGadosCard} cabeças</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Top 5 Meses de Saída
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Meses com maior volume de comercialização.
              </p>
            </div>
            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Top 5
            </span>
          </div>

          <div className="py-2 relative">
            <div ref={barChartRef} className="w-full h-[260px]" />
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] font-semibold text-slate-500">
              Total comercializado no período: <strong className="text-slate-900">{saidaGadosCard} cabeças</strong>
            </span>
          </div>
        </div>
      </div>

      {/* NOVO INTEGRADO: GRÁFICO GEOGRÁFICO DE DENSIDADE DOS PASTOS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Densidade Populacional nos Pastos do Terreno
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Povoamento em tempo real por área demarcada (com abates/vendas descontados e sobras mantidas).
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black text-emerald-800 shrink-0 self-start sm:self-auto">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Mapeados no Terreno: {totalGadoNoMapa} cabeças</span>
          </div>
        </div>

        <div className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-900">
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

              <GeoJSON
                key={JSON.stringify(terrenoGeoJson)}
                data={terrenoGeoJson}
                style={{
                  color: '#64748b',
                  weight: 1.5,
                  fillColor: '#0f172a',
                  fillOpacity: 0.35
                }}
              />

              {pastosComDensidade.map((pasto) => {
                if (!pasto.geojson) return null;
                try {
                  const geoData = typeof pasto.geojson === 'string' ? JSON.parse(pasto.geojson) : pasto.geojson;
                  const cor = getCorDensidade(pasto.quantidadeGadoAtual);

                  return (
                    <GeoJSON
                      key={`${pasto.id}-${pasto.quantidadeGadoAtual}`}
                      data={geoData}
                      style={{
                        color: cor.stroke,
                        weight: 3,
                        fillColor: cor.fill,
                        fillOpacity: 0.65
                      }}
                      onEachFeature={(_, layer) => {
                        const conteudoTooltip = `
                          <div style="text-align: center;">
                            <strong style="color: #6ee7b7; text-transform: uppercase;">${pasto.nome}</strong><br/>
                            <span style="font-size: 14px; font-weight: 900;">${pasto.quantidadeGadoAtual} cabeças</span><br/>
                            <span style="font-size: 10px; opacity: 0.8;">Status: ${pasto.quantidadeGadoAtual === 0 ? 'Sem gado' : 'Povoado'}</span>
                          </div>
                        `;
                        layer.bindTooltip(conteudoTooltip, {
                          permanent: true,
                          direction: 'center',
                          className: 'pasto-density-tooltip'
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
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <Info className="w-10 h-10 text-slate-500 mb-1" />
              <p className="text-sm font-bold text-white">Nenhum KML importado para esta fazenda</p>
              <p className="text-xs text-slate-400">Importe a planta do terreno na tela de Gestão da Propriedade para ativar a visualização em mapa.</p>
            </div>
          )}
        </div>

        {/* Legenda de Gradiente de Densidade */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-600">
          <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold">Densidade da Lotação:</span>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-300 border border-slate-400" />
              <span>0 (Vazio)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-300 border border-emerald-600" />
              <span>1 - 20 cabeças</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-yellow-300 border border-yellow-600" />
              <span>21 - 50 cabeças</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-orange-400 border border-orange-600" />
              <span>51 - 100 cabeças</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-700" />
              <span>+100 (Alta densidade)</span>
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRO DE PROCESSOS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registro de Processos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Histórico sequencial das movimentações de entrada e saída do rebanho no período.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterProcessType}
              onChange={(e) => setFilterProcessType(e.target.value as 'TODOS' | 'ENTRADA' | 'SAIDA')}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="TODOS">Todos os Processos</option>
              <option value="ENTRADA">Somente Entradas</option>
              <option value="SAIDA">Somente Saídas</option>
            </select>

            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full shrink-0">
              {historicoFiltrado.length} registros
            </span>
          </div>
        </div>

        {historicoFiltrado.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            Nenhuma movimentação de gado registrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-4">Processo</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4 text-right">Quantidade</th>
                  <th className="py-3 px-4 text-right">Valor do Lote</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {historicoFiltrado.map((proc) => {
                  const isEntrada = proc.tipo === 'ENTRADA';
                  return (
                    <tr key={proc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isEntrada 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                              : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                          }`}>
                            {isEntrada ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {proc.nomeProcesso}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {proc.detalhe}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {proc.data}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-semibold">
                        {proc.hora}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-extrabold px-2.5 py-1 rounded-lg inline-block ${
                          isEntrada 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isEntrada ? `+ ${proc.quantidade}` : `- ${proc.quantidade}`} cabeças
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {proc.valor > 0 
                          ? proc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'R$ 0,00'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          isEntrada 
                            ? 'bg-blue-50 text-blue-700 border-blue-200/60' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        }`}>
                          {proc.statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsDashboard;