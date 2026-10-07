import React, { useState } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2 
} from 'lucide-react';

interface OpenLot {
  id: string;
  title: string;
  quantity: number;
  publishedAt: string;
  pricePerHead: number;
}

interface ClosedLot {
  id: string;
  buyerName: string;
  quantityPurchased: number;
  totalPrice: number;
  closedAt: string;
  lotTitle: string;
}

interface MonthlySalesData {
  month: string;
  year: number;
  totalHeads: number;
  totalRevenue: number;
  lotsSold: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const openLots: OpenLot[] = [
    {
      id: 'lot-101',
      title: 'Lote Nelore Machos - Pasto 04',
      quantity: 45,
      publishedAt: '04/10/2026',
      pricePerHead: 3200
    },
    {
      id: 'lot-102',
      title: 'Lote Garrotes Anelorados',
      quantity: 30,
      publishedAt: '02/10/2026',
      pricePerHead: 2950
    }
  ];

  const closedLots: ClosedLot[] = [
    {
      id: 'closed-01',
      buyerName: 'Frigorífico Bela Vida',
      quantityPurchased: 50,
      totalPrice: 160000,
      closedAt: '28/09/2026',
      lotTitle: 'Lote Nelore Terminação'
    },
    {
      id: 'closed-02',
      buyerName: 'Carnes & Cia Distribuidora',
      quantityPurchased: 20,
      totalPrice: 62000,
      closedAt: '15/09/2026',
      lotTitle: 'Lote Cruzamento Industrial'
    }
  ];

  const monthlyProgression: MonthlySalesData[] = [
    { month: 'Outubro', year: 2026, totalHeads: 75, totalRevenue: 242000, lotsSold: 2 },
    { month: 'Setembro', year: 2026, totalHeads: 110, totalRevenue: 352000, lotsSold: 3 },
    { month: 'Agosto', year: 2026, totalHeads: 90, totalRevenue: 288000, lotsSold: 2 },
    { month: 'Julho', year: 2026, totalHeads: 65, totalRevenue: 201500, lotsSold: 2 }
  ];

  const maxHeads = Math.max(...monthlyProgression.map(m => m.totalHeads));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Análise de Vendas de Lotes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral da comercialização de gado e balanço financeiro da propriedade.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-sm">
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

      {/* Cards Indicadores Pessoais do Seu Tião */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
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

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Vendas Concluídas
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {closedLots.length} <span className="text-sm font-normal text-slate-500">compradores</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Saída do Mês Atual
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {monthlyProgression[0].totalHeads} <span className="text-sm font-normal text-slate-500">reses</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Seção de Gráficos e Filtros Combinados */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Progressão das Vendas por Mês</h2>
          <p className="text-slate-500 text-sm">Quantidade de animais comercializados e faturamento mensal.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lado Esquerdo: Gráfico em Barras Limpas */}
          <div className="lg:col-span-7 space-y-4 lg:border-r lg:border-slate-100 lg:pr-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volume de Cabeças Vendidas</p>
            <div className="space-y-4 pt-1">
              {monthlyProgression.map((item, idx) => {
                const percentage = Math.round((item.totalHeads / maxHeads) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-700 font-semibold">{item.month}</span>
                      <span className="font-bold text-slate-900">{item.totalHeads} cabeças</span>
                    </div>
                    <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
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

          {/* Lado Direito: Dados Numéricos Pré-filtrados */}
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo Consolidado</p>
            
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
              {monthlyProgression.map((item, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-white transition-colors">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{item.month}</p>
                    <p className="text-xs text-slate-500">{item.lotsSold} lotes negociados</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">
                      {item.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs font-semibold text-emerald-600">
                      {item.totalHeads} reses saídas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Grade de Lotes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lotes em Aberto */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">Lotes em Aberto (Anunciados)</h2>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
              Disponíveis no Mercado
            </span>
          </div>

          <div className="space-y-3">
            {openLots.map((lot) => (
              <div key={lot.id} className="p-4 border border-slate-200/80 rounded-lg flex justify-between items-center bg-white hover:border-slate-300 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{lot.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Anunciado em: {lot.publishedAt}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-md">
                    {lot.quantity} cabeças
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {lot.pricePerHead.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / cab.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lotes Fechados */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <h2 className="text-base font-bold text-slate-900">Lotes Fechados (Vendas Concluídas)</h2>
            </div>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              Confirmados
            </span>
          </div>

          <div className="space-y-3">
            {closedLots.map((closed) => (
              <div key={closed.id} className="p-4 border border-slate-200/80 rounded-lg bg-slate-50/50 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <p className="font-bold text-slate-900 text-sm">{closed.buyerName}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Lote: {closed.lotTitle}</p>
                  <p className="text-xs text-slate-400">Data: {closed.closedAt}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700 text-sm">
                    + {closed.quantityPurchased} cabeças
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {closed.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};