import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  Search, 
  CheckCircle2, 
  Loader2, 
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  RotateCw,
  Info,
  FileText
} from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { api } from '../../services/api';

export interface SoldLotItem {
  id: string;
  quantidadeCabecas: number;
  valorTotal: number;
  dataVenda: string;
  rawDate: Date;
  compradorNome: string;
  compradorEmpresa: string;
  compradorTelefone: string;
}

// Cache em memória para evitar re-fetches ao trocar de abas
let cacheHistorySession: { farmId: string; lotes: SoldLotItem[] } | null = null;

// Máscara utilitária para data DD/MM/AAAA
const aplicarMascaraData = (valor: string): string => {
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 8);
  if (apenasNumeros.length <= 2) return apenasNumeros;
  if (apenasNumeros.length <= 4) return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
  return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
};

export const HistoryProducer: React.FC = () => {
  const { activeFarm } = useFarm();

  // Inicialização síncrona via cache de sessão
  const [lotesVendidos, setLotesVendidos] = useState<SoldLotItem[]>(() => {
    if (cacheHistorySession && cacheHistorySession.farmId === activeFarm?.id) {
      return cacheHistorySession.lotes;
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(
    !cacheHistorySession || cacheHistorySession.farmId !== activeFarm?.id
  );

  // Filtros de Busca
  const [filterData, setFilterData] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Detalhes
  const [loteSelecionado, setLoteSelecionado] = useState<SoldLotItem | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const carregarHistoricoVendidos = async (forcarAtualizacao = false) => {
    if (!activeFarm?.id) return;

    if (forcarAtualizacao || !cacheHistorySession || cacheHistorySession.farmId !== activeFarm.id) {
      setLoading(true);
    }

    try {
      const res = await api.get(`/api/videos/minha-fazenda?fazendaId=${activeFarm.id}`);
      if (res.data?.lotes) {
        const lotesMapeados: SoldLotItem[] = res.data.lotes
          .filter((l: any) => l.status === 'VENDIDO')
          .map((l: any) => {
            const dtAtualizacao = l.updatedAt ? new Date(l.updatedAt) : new Date(l.createdAt || Date.now());

            return {
              id: l.id,
              quantidadeCabecas: Number(l.quantidadeCabecas) || 0,
              valorTotal: Number(l.closedValue || l.valorTotal || l.valor || l.valorLote) || 0,
              dataVenda: dtAtualizacao.toLocaleDateString('pt-BR'),
              rawDate: dtAtualizacao,
              compradorNome: l.consumerName || 'Comprador Parceiro',
              compradorEmpresa: l.consumerCompany || 'Frigorífico / Empresa',
              compradorTelefone: l.consumerPhone || ''
            };
          });

        cacheHistorySession = { farmId: activeFarm.id, lotes: lotesMapeados };
        setLotesVendidos(lotesMapeados);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de lotes vendidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeFarm?.id) return;

    if (cacheHistorySession && cacheHistorySession.farmId === activeFarm.id) {
      setLotesVendidos(cacheHistorySession.lotes);
      setLoading(false);
      return;
    }

    carregarHistoricoVendidos();
  }, [activeFarm?.id]);

  // Aplicação dos Filtros
  const lotesFiltrados = useMemo(() => {
    return lotesVendidos
      .filter((l) => {
        if (!filterData) return true;
        return l.dataVenda.includes(filterData);
      })
      .filter((l) => {
        if (!searchTerm.trim()) return true;
        const termo = searchTerm.toLowerCase();
        return (
          l.compradorNome.toLowerCase().includes(termo) ||
          l.compradorEmpresa.toLowerCase().includes(termo) ||
          `lote de ${l.quantidadeCabecas} cabeças`.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
  }, [lotesVendidos, filterData, searchTerm]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(lotesFiltrados.length / ITEMS_PER_PAGE));
  const paginatedVendidos = lotesFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Histórico de Vendas Concluídas
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/80 px-3 py-1 rounded-xl text-xs font-extrabold">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{activeFarm?.name || 'Sua Fazenda'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Registro sequencial de todas as transações passadas finalizadas no mercado.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => carregarHistoricoVendidos(true)}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shrink-0 self-start sm:self-auto"
        >
          <RotateCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Atualizando...' : 'Atualizar Registros'}</span>
        </button>
      </div>

      {/* Tabela de Registro do Histórico */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-6">
        
        {/* Barra de Busca e Filtros de Pesquisa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            
            {/* Input de Busca por Texto */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar comprador ou empresa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Input de Data (DD/MM/AAAA) */}
            <div className="relative w-full sm:w-56">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                maxLength={10}
                placeholder="Filtrar data (DD/MM/AAAA)..."
                value={filterData}
                onChange={(e) => {
                  setFilterData(aplicarMascaraData(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {filterData && (
                <button
                  type="button"
                  onClick={() => setFilterData('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full shrink-0 self-start sm:self-auto">
            {lotesFiltrados.length} transações
          </span>
        </div>

        {/* Tabela do Histórico */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold">Carregando histórico de transações...</p>
          </div>
        ) : paginatedVendidos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold">Nenhuma transação passada encontrada para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="py-3 px-4">Data da Venda</th>
                  <th className="py-3 px-4">Lote / Descrição</th>
                  <th className="py-3 px-4">Comprador</th>
                  <th className="py-3 px-4 text-right">Quantidade</th>
                  <th className="py-3 px-4 text-right">Valor Fechado</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {paginatedVendidos.map((lote) => (
                  <tr key={lote.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-600">
                      {lote.dataVenda}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Lote de {lote.quantidadeCabecas} Cabeças
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">{lote.compradorNome}</span>
                      <span className="text-[11px] text-slate-400">{lote.compradorEmpresa}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 font-extrabold rounded-lg">
                        - {lote.quantidadeCabecas} cabeças
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700">
                      {lote.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluído
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setLoteSelecionado(lote)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Ver detalhes do registro"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!loading && paginatedVendidos.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Página <strong className="text-slate-800">{currentPage}</strong> de <strong className="text-slate-800">{totalPages}</strong>
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
                      ? 'bg-emerald-600 text-white shadow-2xs'
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
        )}

      </div>

      {/* Pop-up Detalhes do Registro da Transação */}
      {loteSelecionado && (
        <div 
          onClick={() => setLoteSelecionado(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => setLoteSelecionado(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Registro de Transação</h3>
                <p className="text-xs text-slate-500">Venda finalizada em {loteSelecionado.dataVenda}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Comprador</span>
                <p className="font-bold text-slate-900 text-sm">{loteSelecionado.compradorNome}</p>
                <p className="text-slate-500">{loteSelecionado.compradorEmpresa}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Quantidade</span>
                  <p className="font-extrabold text-slate-900 text-sm">{loteSelecionado.quantidadeCabecas} gados</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-0.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Valor Fechado</span>
                  <p className="font-extrabold text-emerald-700 text-sm">
                    {loteSelecionado.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLoteSelecionado(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryProducer;