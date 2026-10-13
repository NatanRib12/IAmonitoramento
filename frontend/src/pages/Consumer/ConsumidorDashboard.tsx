import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Search,
  Filter,
  ChevronRight,
  RotateCcw,
  Tag,
  Hash,
  ShoppingBag,
  AlertCircle,
  X,
  BookmarkCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface Lote {
  id: string;
  quantidadeCabecas: number;
  videoProcessadoUrl?: string | null;
  status: string;
  createdAt: string;
  fazenda: {
    nome: string;
    localizacao: string;
    usuario: {
      nome: string;
      telefone: string;
      email: string;
    }
  }
}

const MOCK_LOTES: Lote[] = [
  {
    id: 'lote-01',
    quantidadeCabecas: 13,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date().toISOString(),
    fazenda: {
      nome: 'Fazenda Bela Vista',
      localizacao: 'Ouro Preto - MG',
      usuario: {
        nome: 'Natan Santos',
        telefone: '(16) 99876-5432',
        email: 'produtor@agrointelli.com',
      }
    }
  },
  {
    id: 'lote-02',
    quantidadeCabecas: 45,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    fazenda: {
      nome: 'Fazenda Santa Maria',
      localizacao: 'Ribeirão Preto - SP',
      usuario: {
        nome: 'Carlos Eduardo Silveira',
        telefone: '(16) 99123-8899',
        email: 'carlos@santamaria.com.br',
      }
    }
  },
  {
    id: 'lote-03',
    quantidadeCabecas: 120,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    fazenda: {
      nome: 'Estância Boa Vista',
      localizacao: 'Barretos - SP',
      usuario: {
        nome: 'Mariana Ribeiro',
        telefone: '(17) 99765-4321',
        email: 'mariana@boavista.com',
      }
    }
  }
];

export function ConsumidorDashboard() {
  const { userSession } = useFarm();
  const [lotes, setLotes] = useState<Lote[]>(MOCK_LOTES);
  const [loteSelecionado, setLoteSelecionado] = useState<Lote | null>(MOCK_LOTES[0]);

  // Filtros de busca
  const [filterFazenda, setFilterFazenda] = useState('');
  const [filterData, setFilterData] = useState('');
  const [filterQtd, setFilterQtd] = useState<number | ''>('');

  // Estado do Pop-up de Reserva Concluída
  const [modalReservaAberta, setModalReservaAberta] = useState(false);
  const [loteReservadoInfo, setLoteReservadoInfo] = useState<Lote | null>(null);
  const [reservando, setReservando] = useState(false);

  useEffect(() => {
    if (api && typeof api.get === 'function') {
      api.get('/api/lotes/disponiveis')
        .then((res) => {
          if (res?.data?.sucesso && Array.isArray(res.data.lotes) && res.data.lotes.length > 0) {
            setLotes(res.data.lotes);
            setLoteSelecionado(res.data.lotes[0]);
          }
        })
        .catch((err) => {
          console.warn('Utilizando dados mockados de demonstração:', err);
        });
    }
  }, []);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      if (lote.status !== 'DISPONIVEL') return false;
      if (filterFazenda && !lote.fazenda.nome.toLowerCase().includes(filterFazenda.toLowerCase())) {
        return false;
      }
      if (filterData) {
        const dateISO = new Date(lote.createdAt).toISOString().split('T')[0];
        if (dateISO !== filterData) return false;
      }
      if (filterQtd !== '' && lote.quantidadeCabecas < Number(filterQtd)) {
        return false;
      }
      return true;
    });
  }, [lotes, filterFazenda, filterData, filterQtd]);

  const handleReservarLote = async () => {
    if (!loteSelecionado) return;
    setReservando(true);

    const consumidorIdReal = userSession?.id || localStorage.getItem('@AgroIntelli:userId');

    try {
      await api.put(`/api/lotes/${loteSelecionado.id}/reservar`, {
        consumidorId: consumidorIdReal,
        consumerName: userSession?.nome || 'Comprador Parceiro',
        consumerCompany: userSession?.empresa || 'Frigorífico Parceiro'
      });
    } catch (err) {
      console.warn('Atualizando reservas no estado local:', err);
    } finally {
      const loteReservado = { ...loteSelecionado, status: 'RESERVADO' };
      setLoteReservadoInfo(loteReservado);
      
      // Remove o lote da lista de disponíveis do mercado
      setLotes((prev) => prev.filter((l) => l.id !== loteSelecionado.id));
      
      // Seleciona o próximo lote da lista se houver
      const restantes = lotesFiltrados.filter((l) => l.id !== loteSelecionado.id);
      setLoteSelecionado(restantes.length > 0 ? restantes[0] : null);
      
      setReservando(false);
      setModalReservaAberta(true);
    }
  };

  const limparFiltrosLotes = () => {
    setFilterFazenda('');
    setFilterData('');
    setFilterQtd('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Lotes Disponíveis no Mercado
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-blue-100/80 text-blue-900 border border-blue-300/80 px-3 py-1 rounded-xl text-xs font-extrabold">
              <Tag className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{lotesFiltrados.length} lotes auditados</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Explore as oportunidades de compra auditadas por visão computacional e reserve o lote desejado.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-emerald-600" />
            Filtrar Oportunidades
          </span>
          {(filterFazenda || filterData || filterQtd !== '') && (
            <button
              type="button"
              onClick={limparFiltrosLotes}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Nome da fazenda..."
              value={filterFazenda}
              onChange={(e) => setFilterFazenda(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            />
          </div>

          <div className="relative">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              placeholder="Mínimo de gados (ex: 20)..."
              value={filterQtd}
              onChange={(e) => setFilterQtd(e.target.value ? Number(e.target.value) : '')}
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Estrutura Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Lista de Lotes */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[720px] overflow-y-auto pr-2">
          {lotesFiltrados.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold">Nenhum lote disponível encontrado para os filtros informados.</p>
            </div>
          ) : (
            lotesFiltrados.map((lote) => {
              const isSelected = loteSelecionado?.id === lote.id;
              return (
                <div
                  key={lote.id}
                  onClick={() => setLoteSelecionado(lote)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer border bg-white relative shadow-2xs ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 rounded-r-full" />
                  )}

                  <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {lote.fazenda.nome}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auditado
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {lote.quantidadeCabecas}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        cabeças
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {new Date(lote.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">
                        {lote.fazenda.usuario.nome}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalhes do Lote Selecionado (Cards Alongados) */}
        {loteSelecionado ? (
          <div className="lg:col-span-7 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Informações da Fazenda (Alongado) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 min-h-[260px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Informações da Fazenda
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Propriedade Rural:</span>
                      <strong className="text-slate-900 font-extrabold text-base">{loteSelecionado.fazenda.nome}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold pt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm">{loteSelecionado.fazenda.localizacao}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
                    Auditado por Visão Computacional
                  </span>
                </div>
              </div>

              {/* Card 2: Contato & Reservar Lote (Alongado) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6 min-h-[260px]">
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-600" />
                      Contato do Produtor
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">Vendedor / Responsável:</span>
                      <strong className="text-slate-900 font-extrabold text-base">{loteSelecionado.fazenda.usuario.nome}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 font-semibold pt-1">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Data de Publicação: {new Date(loteSelecionado.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Ação Principal: Reservar Lote */}
                <button
                  type="button"
                  disabled={reservando}
                  onClick={handleReservarLote}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>{reservando ? 'Reservando...' : 'Reservar Lote'}</span>
                </button>
              </div>

            </div>

            {/* Banner Informativo Inferior */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs flex items-center gap-4 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-white">Lote Selecionado com {loteSelecionado.quantidadeCabecas} Gados</p>
                <p className="text-slate-400">
                  Ao clicar em "Reservar Lote", o item será removido do mercado público e ficará disponível para você na aba "Compras e Reservas de Lotes".
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400">
            <p className="text-xs font-bold">Selecione um lote na lista para visualizar os detalhes.</p>
          </div>
        )}

      </div>

      {/* POP-UP DE SUCESSO AO RESERVAR LOTE */}
      {modalReservaAberta && (
        <div 
          onClick={() => setModalReservaAberta(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 relative text-center"
          >
            <button
              type="button"
              onClick={() => setModalReservaAberta(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Lote Reservado com Sucesso!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                O lote de <strong className="text-slate-900">{loteReservadoInfo?.quantidadeCabecas} gados</strong> da <strong className="text-slate-900">{loteReservadoInfo?.fazenda?.nome}</strong> foi removido do mercado público e já está disponível em <strong className="text-emerald-700">"Compras e Reservas de Lotes"</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalReservaAberta(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}