import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

export interface OpenLot {
  id: string;
  title: string;
  quantity: number;
  publishedAt: string;
  valorTotal?: number;
}

export interface ClosedSaleDetail {
  id: string;
  data: string;
  comprador: string;
  valorNegociado: number;
  quantidadeGado: number;
  monthIndex: number;
  year: number;
}

export interface MonthlySalesSummary {
  month: string;
  monthIndex: number;
  totalGados: number;
  totalRevenue: number;
  lotsSold: number;
}

const TODOS_OS_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função utilitária para aplicar a máscara de data DD/MM/AAAA automaticamente
const aplicarMascaraData = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 8);

  if (apenasNumeros.length <= 2) {
    return apenasNumeros;
  }
  if (apenasNumeros.length <= 4) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
  }
  return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
};

let cacheLotesSession: { farmId: string; lotes: any[] } | null = null;

export const AnalyticsDashboard: React.FC = () => {
  const { activeFarm } = useFarm();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const hasCache = cacheLotesSession && cacheLotesSession.farmId === activeFarm?.id;

  // Estado dos Lotes em Aberto (Disponíveis) - APENAS DADOS REAIS
  const [openLots, setOpenLots] = useState<OpenLot[]>(() => {
    if (!hasCache) return [];
    return cacheLotesSession!.lotes
      .filter((l: any) => l.status === 'DISPONIVEL')
      .map((l: any) => ({
        id: l.id,
        title: `Lote ${l.quantidadeCabecas} Gados`,
        quantity: l.quantidadeCabecas || 0,
        publishedAt: new Date(l.createdAt).toLocaleDateString('pt-BR'),
        valorTotal: Number(l.valorTotal || l.valor || l.valor_total || l.valorLote) || 0
      }));
  });

  // Estado das Vendas Fechadas (VENDIDO) - 100% REAIS (SEM MOCKS)
  const [closedSales, setClosedSales] = useState<ClosedSaleDetail[]>(() => {
    if (!hasCache) return [];
    return cacheLotesSession!.lotes
      .filter((l: any) => l.status === 'VENDIDO')
      .map((l: any) => {
        const dataObj = new Date(l.updatedAt || l.createdAt);
        return {
          id: l.id,
          data: dataObj.toLocaleDateString('pt-BR'),
          comprador: l.consumerName || 'Comprador Parceiro',
          valorNegociado: Number(l.closedValue || l.valorTotal || l.valor || l.valor_total) || 0,
          quantidadeGado: Number(l.quantidadeCabecas) || 0,
          monthIndex: dataObj.getMonth(),
          year: dataObj.getFullYear()
        };
      });
  });

  const [monthlyProgression, setMonthlyProgression] = useState<MonthlySalesSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(!hasCache);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeMonthIndexModal, setActiveMonthIndexModal] = useState<number>(new Date().getMonth());
  
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);
  const [filterComprador, setFilterComprador] = useState<string>('');
  const [filterData, setFilterData] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const mesAtualIndex = new Date().getMonth();

  // Busca dados atualizados da fazenda ativa diretamente na API
  useEffect(() => {
    if (!activeFarm?.id) return;

    if (!cacheLotesSession || cacheLotesSession.farmId !== activeFarm.id) {
      setLoading(true);
    }

    api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`)
      .then((res) => {
        const lotesBD = res.data?.lotes || [];

        cacheLotesSession = {
          farmId: activeFarm.id,
          lotes: lotesBD
        };

        const abertosReais: OpenLot[] = lotesBD
          .filter((l: any) => l.status === 'DISPONIVEL')
          .map((l: any) => ({
            id: l.id,
            title: `Lote ${l.quantidadeCabecas} Gados`,
            quantity: l.quantidadeCabecas || 0,
            publishedAt: new Date(l.createdAt).toLocaleDateString('pt-BR'),
            valorTotal: Number(l.valorTotal || l.valor || l.valor_total || l.valorLote) || 0
          }));

        const fechadosReais: ClosedSaleDetail[] = lotesBD
          .filter((l: any) => l.status === 'VENDIDO')
          .map((l: any) => {
            const dataObj = new Date(l.updatedAt || l.createdAt);
            return {
              id: l.id,
              data: dataObj.toLocaleDateString('pt-BR'),
              comprador: l.consumerName || 'Comprador Parceiro',
              valorNegociado: Number(l.closedValue || l.valorTotal || l.valor || l.valor_total) || 0,
              quantidadeGado: Number(l.quantidadeCabecas) || 0,
              monthIndex: dataObj.getMonth(),
              year: dataObj.getFullYear()
            };
          });

        setOpenLots(abertosReais);
        setClosedSales(fechadosReais);
      })
      .catch((err) => console.error('Erro ao buscar dados reais do banco:', err))
      .finally(() => setLoading(false));
  }, [activeFarm?.id]);

  // Recalcula o progresso dos 12 meses baseado apenas em vendas reais
  useEffect(() => {
    const dozeMeses: MonthlySalesSummary[] = TODOS_OS_MESES.map((nomeMes, index) => {
      const vendasDoMes = closedSales.filter(
        (v) => v.monthIndex === index && v.year === selectedYear
      );

      const totalGados = vendasDoMes.reduce((sum, item) => sum + item.quantidadeGado, 0);
      const totalRevenue = vendasDoMes.reduce((sum, item) => sum + item.valorNegociado, 0);

      return {
        month: nomeMes,
        monthIndex: index,
        totalGados,
        totalRevenue,
        lotsSold: vendasDoMes.length
      };
    });

    setMonthlyProgression(dozeMeses);
  }, [closedSales, selectedYear]);

  const handleOpenModal = (monthIndex: number) => {
    setActiveMonthIndexModal(monthIndex);
    setCurrentPage(1);
    setFilterComprador('');
    setFilterData('');
    setIsModalOpen(true);
  };

  const handlePrevMonth = () => {
    setActiveMonthIndexModal((prev) => (prev > 0 ? prev - 1 : 11));
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    setActiveMonthIndexModal((prev) => (prev < 11 ? prev + 1 : 0));
    setCurrentPage(1);
  };

  const vendasDoMesAtivo = closedSales.filter((v) => {
    if (v.monthIndex !== activeMonthIndexModal || v.year !== selectedYear) return false;
    if (filterComprador && !v.comprador.toLowerCase().includes(filterComprador.toLowerCase())) return false;
    if (filterData && !v.data.includes(filterData)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(vendasDoMesAtivo.length / ITEMS_PER_PAGE));
  const paginatedVendas = vendasDoMesAtivo.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const saidaMesAtual = monthlyProgression[mesAtualIndex]?.totalGados || 0;
  const maxGados = Math.max(...monthlyProgression.map((m) => m.totalGados), 1);

  if (loading && !openLots.length) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 font-sans text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-bold">Carregando informações reais do dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Análise de Vendas de Lotes
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold shadow-2xs">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Fazenda: {activeFarm?.name || 'Não selecionada'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral da comercialização de gado e balanço financeiro real da propriedade.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase">Ano:</span>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none cursor-pointer"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lotes em Aberto
            </p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {openLots.length} <span className="text-sm font-normal text-slate-500">anunciados</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vendas Concluídas
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {closedSales.length} <span className="text-sm font-normal text-slate-500">compradores</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saída do Mês Atual
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {saidaMesAtual} <span className="text-sm font-normal text-slate-500">gados</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Gráfico de Progressão Mensal */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Progressão das Vendas do Mês</h2>
          <p className="text-slate-500 text-sm">Quantidade real de gados comercializados ao longo dos meses.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4 lg:border-r lg:border-slate-100 lg:pr-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Volume de Gados Vendidos
            </p>

            <div className="space-y-3 pt-1 max-h-[460px] overflow-y-auto pr-2">
              {monthlyProgression.map((item) => {
                const percentage = maxGados > 0 ? Math.round((item.totalGados / maxGados) * 100) : 0;
                return (
                  <div key={item.monthIndex} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 font-semibold">{item.month}</span>
                      <span className="font-bold text-slate-900">{item.totalGados} gados</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Informações Detalhadas
            </p>
            
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50 max-h-[460px] overflow-y-auto">
              {monthlyProgression.map((item) => (
                <div 
                  key={item.monthIndex} 
                  className="p-3.5 flex items-center justify-between hover:bg-white transition-colors"
                >
                  <span className="font-bold text-sm text-slate-800">
                    {item.month}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenModal(item.monthIndex)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    Mais informações
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo dos Lotes em Aberto e Fechados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lotes em Aberto */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">Lotes em Aberto (Anunciados)</h2>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
              Disponíveis
            </span>
          </div>

          <div className="space-y-3">
            {openLots.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-medium">
                Nenhum lote em aberto cadastrado para esta fazenda.
              </p>
            ) : (
              openLots.map((lot) => {
                const valorNum = Number(lot.valorTotal || 0);

                return (
                  <div key={lot.id} className="p-4 border border-slate-200/80 rounded-xl flex justify-between items-center bg-white hover:border-slate-300 transition-colors">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm">{lot.title}</h3>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Anunciado em: {lot.publishedAt}</span>
                        <span className="text-slate-300">•</span>
                        {valorNum > 0 ? (
                          <span className="font-extrabold text-emerald-700">
                            {valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-400 italic">Sob consulta</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-md">
                        {lot.quantity} gados
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lotes Fechados (Resumo) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <h2 className="text-base font-bold text-slate-900">Lotes Fechados (Resumo)</h2>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              Confirmados
            </span>
          </div>

          <div className="space-y-3">
            {closedSales.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-medium">
                Nenhuma venda de lote concluída até o momento.
              </p>
            ) : (
              closedSales.slice(0, 5).map((closed) => (
                <div key={closed.id} className="p-3.5 border border-slate-200/80 rounded-lg bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <p className="font-bold text-slate-900 text-xs">{closed.comprador}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Data: {closed.data}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-700 text-xs block">
                      {closed.valorNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {closed.quantidadeGado} gados
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Pop-up Modal de Vendas Detalhadas do Mês */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[88vh] shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden">
            
            <div className="p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    title="Mês anterior"
                    className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 text-xs font-bold text-slate-900 min-w-[130px] text-center select-none">
                    {TODOS_OS_MESES[activeMonthIndexModal]} / {selectedYear}
                  </span>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    title="Próximo mês"
                    className="p-1.5 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilterBar(!showFilterBar)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    showFilterBar || filterComprador || filterData
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Fechar janela</span>
                </button>
              </div>
            </div>

            {showFilterBar && (
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por Comprador..."
                    value={filterComprador}
                    onChange={(e) => {
                      setFilterComprador(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Filtro de Data com Máscara Automática (DD/MM/AAAA) */}
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="DD/MM/AAAA"
                    value={filterData}
                    onChange={(e) => {
                      const valorFormatado = aplicarMascaraData(e.target.value);
                      setFilterData(valorFormatado);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {paginatedVendas.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">Nenhuma venda realizada registrada para este mês.</p>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="p-4">Data</th>
                        <th className="p-4">Comprador</th>
                        <th className="p-4 text-right">Valor Negociado</th>
                        <th className="p-4 text-right">Quantidade de Gado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                      {paginatedVendas.map((venda, idx) => (
                        <tr key={venda.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-semibold text-slate-600">{venda.data}</td>
                          <td className="p-4 font-bold text-slate-900">{venda.comprador}</td>
                          <td className="p-4 text-right font-extrabold text-emerald-700">
                            {venda.valorNegociado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-4 text-right">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 font-bold text-slate-800 rounded-lg">
                              {venda.quantidadeGado} gados
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando <strong className="text-slate-800">{vendasDoMesAtivo.length}</strong> vendas no mês
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsDashboard;