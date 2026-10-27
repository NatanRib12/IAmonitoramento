import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Layers, 
  Loader2, 
  ArrowRight,
  Sparkles,
  PieChart as PieIcon,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';

declare const echarts: any;

interface FazendaBusca {
  id: string;
  nome: string;
  localizacao: string;
}

interface LoteHistorico {
  id: string;
  quantidadeCabecas: number;
  quantidadeVendida: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export const FarmAnalysisConsumer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FazendaBusca[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FazendaBusca | null>(null);
  const [lotes, setLotes] = useState<LoteHistorico[]>([]);
  const [isLoadingFarmData, setIsLoadingFarmData] = useState(false);

  const [echartsLoaded, setEchartsLoaded] = useState(false);
  
  // Ref para o Gráfico 1 (Linhas Empilhadas)
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Ref para o Gráfico 2 (Rosca / Donut)
  const pieChartRef = useRef<HTMLDivElement>(null);
  const pieChartInstanceRef = useRef<any>(null);

  // Carrega a biblioteca ECharts dinamicamente
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
  }, []);

  // Autocomplete de fazendas
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      api.get(`/api/fazendas/buscar-publico?q=${searchTerm}`)
        .then((res) => {
          if (res.data?.sucesso) {
            setSearchResults(res.data.fazendas || []);
          }
        })
        .catch((err) => console.error('Erro na busca:', err))
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Carrega análise da fazenda selecionada
  const handleSelectFarm = (fazenda: FazendaBusca) => {
    setSelectedFarm(fazenda);
    setSearchTerm('');
    setSearchResults([]);
    setIsLoadingFarmData(true);

    api.get(`/api/fazendas/${fazenda.id}/analise-fornecedor`)
      .then((res) => {
        if (res.data?.sucesso) {
          setLotes(res.data.lotes || []);
        }
      })
      .catch((err) => console.error('Erro ao carregar dados da fazenda:', err))
      .finally(() => setIsLoadingFarmData(false));
  };

  // Cálculos de Volumetria
  const totalAnunciado = useMemo(() => lotes.reduce((sum, l) => sum + l.quantidadeCabecas, 0), [lotes]);
  const totalVendido = useMemo(() => lotes.reduce((sum, l) => sum + (l.status === 'VENDIDO' ? l.quantidadeCabecas : l.quantidadeVendida), 0), [lotes]);
  const totalSobras = useMemo(() => Math.max(0, totalAnunciado - totalVendido), [totalAnunciado, totalVendido]);
  
  const taxaLiquidacao = useMemo(() => {
    if (!totalAnunciado) return 0;
    return Math.round((totalVendido / totalAnunciado) * 100);
  }, [totalAnunciado, totalVendido]);

  // Tempo Médio de Giro de Vendas
  const tempoMedioGiroDias = useMemo(() => {
    const lotesFechados = lotes.filter(l => l.status === 'VENDIDO' || l.quantidadeVendida > 0);
    if (!lotesFechados.length) return 'N/A';

    const somaDias = lotesFechados.reduce((acc, l) => {
      const inicio = new Date(l.createdAt).getTime();
      const fim = l.updatedAt ? new Date(l.updatedAt).getTime() : inicio;
      const diffDias = Math.max(0.5, (fim - inicio) / (1000 * 60 * 60 * 24));
      return acc + diffDias;
    }, 0);

    const media = somaDias / lotesFechados.length;
    return media < 1 ? '< 1 dia' : `${media.toFixed(1)} dias`;
  }, [lotes]);

  // 1. Renderização do Gráfico Stacked Line / Area (Composição do Fluxo)
  useEffect(() => {
    if (!echartsLoaded || !chartRef.current || !selectedFarm || !lotes.length) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const ultimosLotes = [...lotes].slice(0, 10).reverse();
    const categorias = ultimosLotes.map((l) => 
      new Date(l.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' })
    );

    const serieVendidos = ultimosLotes.map((l) => 
      l.status === 'VENDIDO' ? l.quantidadeCabecas : l.quantidadeVendida
    );

    const serieSobras = ultimosLotes.map((l) => 
      Math.max(0, l.quantidadeCabecas - (l.status === 'VENDIDO' ? l.quantidadeCabecas : l.quantidadeVendida))
    );

    const option = {
      color: ['#10b981', '#f59e0b'],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#10b981',
        textStyle: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
        axisPointer: { type: 'cross', label: { backgroundColor: '#0f172a' } }
      },
      legend: {
        data: ['Gado Comercializado', 'Sobra Remanescente no Pasto'],
        top: 0,
        textStyle: { color: '#475569', fontWeight: 'bold', fontSize: 12 }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          boundaryGap: false,
          data: categorias,
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontWeight: '600' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Cabeças',
          nameTextStyle: { color: '#94a3b8', fontWeight: 'bold' },
          splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
          axisLabel: { color: '#64748b', fontWeight: '600' }
        }
      ],
      series: [
        {
          name: 'Gado Comercializado',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 3, color: '#10b981' },
          showSymbol: true,
          symbolSize: 6,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.45)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
            ])
          },
          emphasis: { focus: 'series' },
          data: serieVendidos
        },
        {
          name: 'Sobra Remanescente no Pasto',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 3, color: '#f59e0b' },
          showSymbol: true,
          symbolSize: 6,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.45)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' }
            ])
          },
          emphasis: { focus: 'series' },
          data: serieSobras
        }
      ]
    };

    chartInstanceRef.current.setOption(option, true);
  }, [echartsLoaded, selectedFarm, lotes]);

  // 2. Renderização do Gráfico de Rosca (Taxa de Comercialização)
  useEffect(() => {
    if (!echartsLoaded || !pieChartRef.current || !selectedFarm) return;

    if (!pieChartInstanceRef.current) {
      pieChartInstanceRef.current = echarts.init(pieChartRef.current);
    }

    const option = {
      tooltip: { 
        trigger: 'item', 
        formatter: '{b}: <strong>{c} cabeças</strong> ({d}%)' 
      },
      legend: { 
        orient: 'horizontal', 
        bottom: '0%', 
        left: 'center', 
        icon: 'circle', 
        textStyle: { color: '#475569', fontWeight: '700', fontSize: 11 } 
      },
      series: [
        {
          name: 'Taxa de Comercialização',
          type: 'pie',
          radius: ['62%', '82%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#ffffff', borderWidth: 3 },
          label: {
            show: true,
            position: 'center',
            formatter: () => `{val|${taxaLiquidacao}%}\n{lbl|Comercializado}`,
            rich: {
              val: { fontSize: 32, fontWeight: '900', color: '#0f172a', lineHeight: 38 },
              lbl: { fontSize: 12, fontWeight: '700', color: '#64748b' }
            }
          },
          data: [
            { value: totalVendido, name: 'Saída (Vendidos)', itemStyle: { color: '#059669' } },
            { value: totalSobras, name: 'Gados Restantes no Pasto', itemStyle: { color: '#e2e8f0' } }
          ]
        }
      ]
    };

    pieChartInstanceRef.current.setOption(option, true);
  }, [echartsLoaded, selectedFarm, totalVendido, totalSobras, taxaLiquidacao]);

  // Redimensionamento Responsivo das instâncias
  useEffect(() => {
    const handleResize = () => {
      chartInstanceRef.current?.resize();
      pieChartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Análise do Fornecedor & Oportunidades de Lotes
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Busque a propriedade para avaliar a velocidade de vendas, histórico de entregas e taxa de comercialização do rebanho.
        </p>
      </div>

      {/* BARRA DE PESQUISA INTELIGENTE */}
      <div className="relative max-w-2xl">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Digite o nome da fazenda (ex: Sol Grande)..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs"
          />
          {isSearching && <Loader2 className="w-5 h-5 text-emerald-600 animate-spin absolute right-4 top-3.5" />}
        </div>

        {/* Dropdown Autocomplete */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
            {searchResults.map((fazenda) => (
              <div
                key={fazenda.id}
                onClick={() => handleSelectFarm(fazenda)}
                className="p-4 hover:bg-emerald-50/60 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{fazenda.nome}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {fazenda.localizacao}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTEÚDO DA FAZENDA */}
      {isLoadingFarmData ? (
        <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          Carregando inteligência de mercado da propriedade...
        </div>
      ) : selectedFarm ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
          
          {/* Header da Fazenda Selecionada */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Fazenda Selecionada
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{selectedFarm.nome}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedFarm.localizacao}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700/80 text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Turmas Registradas</span>
                <span className="text-base font-black text-white">{lotes.length} lotes</span>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-right">
                <span className="text-[11px] text-emerald-300 block font-semibold">Volume Ofertado</span>
                <span className="text-base font-black text-emerald-400">{totalAnunciado} cab.</span>
              </div>
            </div>
          </div>

          {/* INDICADORES RÁPIDOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  TEMPO MÉDIO DE GIRO
                </span>
                <p className="text-2xl font-black text-slate-900">{tempoMedioGiroDias}</p>
                <p className="text-[11px] text-slate-500 font-medium">Média para comercializar um lote</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  CABEÇAS VENDIDAS
                </span>
                <p className="text-2xl font-black text-emerald-600">{totalVendido} cabeças</p>
                <p className="text-[11px] text-slate-500 font-medium">Total com saída concluída</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  SOBRAS REMANESCENTES
                </span>
                <p className="text-2xl font-black text-amber-600">{totalSobras} cabeças</p>
                <p className="text-[11px] text-slate-500 font-medium">Disponível no pasto para negociação</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* GRÁFICO 1: LINHAS EMPILHADAS (COMPOSIÇÃO DO FLUXO) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Composição do Fluxo de Rebanho (Comercializado vs Sobra)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Área empilhada = Total ofertado</span>
            </div>

            <div className="w-full h-[320px] relative pt-2">
              <div ref={chartRef} className="w-full h-full" />
            </div>
          </div>

          {/* GRÁFICO 2: ROSCA / DONUT (TAXA DE COMERCIALIZAÇÃO DO REBANHO) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
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
                {taxaLiquidacao}% Concluído
              </span>
            </div>

            <div className="py-2 flex items-center justify-center relative">
              <div ref={pieChartRef} className="w-full h-[260px]" />
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ENTRADAS TOTAL</span>
                <span className="text-lg font-black text-slate-800">{totalAnunciado} cabeças</span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider">VENDIDOS (SAÍDA)</span>
                <span className="text-lg font-black text-emerald-700">{totalVendido} cabeças</span>
              </div>
            </div>
          </div>

          {/* TABELA DE LOTES E OPORTUNIDADES */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Histórico de Lotes Comercializados
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{lotes.length} registros</span>
            </div>

            {lotes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum lote registrado para esta fazenda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-400 uppercase border-b border-slate-200/60">
                      <th className="py-3 px-4">Data do Anúncio</th>
                      <th className="py-3 px-4 text-right">Ofertado</th>
                      <th className="py-3 px-4 text-right">Comercializado</th>
                      <th className="py-3 px-4 text-right">Sobra no Pasto</th>
                      <th className="py-3 px-4 text-center">Ação Recomendada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lotes.map((lote) => {
                      const vendido = lote.status === 'VENDIDO' ? lote.quantidadeCabecas : lote.quantidadeVendida;
                      const sobra = Math.max(0, lote.quantidadeCabecas - vendido);

                      return (
                        <tr key={lote.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {new Date(lote.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                            {lote.quantidadeCabecas} cab.
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                            {vendido} cab.
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold">
                            <span className={`px-2.5 py-1 rounded-lg inline-block ${
                              sobra > 0 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/80' 
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {sobra} cab.
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {sobra > 0 ? (
                              <button 
                                onClick={() => alert(`Solicitação enviada com sucesso! Você registrou interesse para negociar as ${sobra} cabeças remanescentes deste lote.`)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                              >
                                Solicitar Remanescente
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium">Lote Totalmente Vendido</span>
                            )}
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
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Nenhuma propriedade selecionada</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Busque o nome da fazenda acima para analisar a taxa de comercialização do fornecedor e as sobras remanescentes.
          </p>
        </div>
      )}

    </div>
  );
};

export default FarmAnalysisConsumer;