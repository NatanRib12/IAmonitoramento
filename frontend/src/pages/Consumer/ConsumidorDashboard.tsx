import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Award, 
  User, 
  Search,
  Filter,
  Radar,
  ChevronRight,
  RotateCcw,
  Tag,
  Hash,
  Send,
  DollarSign,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { SideMenuConsumer } from '../../components/SideMenuConsumer';
import { SupportCenter } from '../producer/SupportCenter';

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

interface ConsumerDashboardProps {
  onNavigateLogin?: () => void;
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

export function ConsumerDashboard({ onNavigateLogin }: ConsumerDashboardProps) {
  const [activeSubSection, setActiveSubSection] = useState('lotes-disponiveis');
  
  const [lotes, setLotes] = useState<Lote[]>(MOCK_LOTES);
  const [loteSelecionado, setLoteSelecionado] = useState<Lote>(MOCK_LOTES[0]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Filtros de busca
  const [filterFazenda, setFilterFazenda] = useState('');
  const [filterData, setFilterData] = useState('');
  const [filterQtd, setFilterQtd] = useState<number | ''>('');

  // Formulário de Proposta
  const [valorProposta, setValorProposta] = useState('');
  const [condicaoPagamento, setCondicaoPagamento] = useState('À vista');
  const [observacaoProposta, setObservacaoProposta] = useState('');
  const [propostaEnviada, setPropostaEnviada] = useState(false);

  useEffect(() => {
    setLoadingLotes(true);
    api.get('/api/lotes/disponiveis')
      .then((res) => {
        if (res.data?.sucesso && Array.isArray(res.data.lotes) && res.data.lotes.length > 0) {
          setLotes(res.data.lotes);
          setLoteSelecionado(res.data.lotes[0]);
        }
      })
      .catch((err) => console.warn('Utilizando dados mockados de demonstração:', err))
      .finally(() => setLoadingLotes(false));
  }, []);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
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

  const getWhatsAppLink = (telefone: string, quantidade: number, fazenda: string) => {
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Tenho interesse no lote auditado de ${quantidade} gados da ${fazenda} na plataforma AgroIntelli e gostaria de negociar.`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  const handleEnviarProposta = (e: React.FormEvent) => {
    e.preventDefault();
    setPropostaEnviada(true);
    setTimeout(() => {
      setPropostaEnviada(false);
      setValorProposta('');
      setObservacaoProposta('');
    }, 4000);
  };

  const limparFiltrosLotes = () => {
    setFilterFazenda('');
    setFilterData('');
    setFilterQtd('');
  };

  return (
    <SideMenuConsumer
      activeSubSection={activeSubSection}
      onNavigate={(sec) => setActiveSubSection(sec)}
      userName="Frigorífico Parceiro"
      companyName="Unidade Comercial SP"
      onLogout={onNavigateLogin}
    >
      {/* LOTES DISPONÍVEIS */}
      {activeSubSection === 'lotes-disponiveis' && (
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
                Explore as oportunidades de compra auditadas por visão computacional e envie propostas diretas ao vendedor.
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
            
            {/* Lista de Lotes Ajustada */}
            <div className="lg:col-span-5 space-y-3.5 max-h-[750px] overflow-y-auto pr-2">
              {lotesFiltrados.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold">Nenhum lote encontrado para os filtros informados.</p>
                </div>
              ) : (
                lotesFiltrados.map((lote) => {
                  const isSelected = loteSelecionado?.id === lote.id;
                  return (
                    <div
                      key={lote.id}
                      onClick={() => {
                        setLoteSelecionado(lote);
                        setPropostaEnviada(false);
                      }}
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

            {/* Detalhes do Lote */}
            {loteSelecionado && (
              <div className="lg:col-span-7 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Card 1: Informações da Fazenda */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          Informações da Fazenda
                        </h3>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" /> Selo Gold
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium block text-[11px]">Propriedade Rural:</span>
                          <strong className="text-slate-900 font-extrabold text-sm">{loteSelecionado.fazenda.nome}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{loteSelecionado.fazenda.localizacao}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Status Sanitário: <strong>100% Vacinado e Regularizado</strong></span>
                    </div>
                  </div>

                  {/* Card 2: Contato do Produtor */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="border-b border-slate-100 pb-2.5">
                        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4 text-emerald-600" />
                          Contato do Produtor
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium block text-[11px]">Vendedor / Responsável:</span>
                          <strong className="text-slate-900 font-extrabold text-sm">{loteSelecionado.fazenda.usuario.nome}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold pt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Auditoria realizada em: {new Date(loteSelecionado.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppLink(loteSelecionado.fazenda.usuario.telefone, loteSelecionado.quantidadeCabecas, loteSelecionado.fazenda.nome)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Falar com Vendedor no WhatsApp</span>
                    </a>
                  </div>

                </div>

                {/* Card Retangular Inferior: Métricas + Proposta */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-7 shadow-xs space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          Métricas do Lote
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          Código Laudo #{loteSelecionado.id.slice(0, 8)}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        {loteSelecionado.quantidadeCabecas} <span className="text-lg font-bold text-slate-500">Cabeças de Gado</span>
                      </h3>
                    </div>

                    <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-emerald-900 space-y-1 sm:text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 sm:justify-end">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        <span>Inventário Auditado por IA</span>
                      </div>
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Zero duplicações • Laudo com carimbo digital
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Lançar Proposta de Compra ao Produtor
                      </h4>
                      <p className="text-xs text-slate-500">
                        Informe o valor comercial e condições para enviar uma notificação direta ao proprietário.
                      </p>
                    </div>

                    {propostaEnviada ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-3 animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Sua proposta de compra foi enviada com sucesso ao produtor {loteSelecionado.fazenda.usuario.nome}!</span>
                      </div>
                    ) : (
                      <form onSubmit={handleEnviarProposta} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                              Valor da Proposta (por cabeça R$)
                            </label>
                            <input
                              type="number"
                              placeholder="Ex: 3500"
                              value={valorProposta}
                              onChange={(e) => setValorProposta(e.target.value)}
                              required
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                              Condição de Pagamento
                            </label>
                            <select
                              value={condicaoPagamento}
                              onChange={(e) => setCondicaoPagamento(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                            >
                              <option value="À vista">À vista (PIX/Transferência)</option>
                              <option value="30 dias">A prazo (30 dias)</option>
                              <option value="30/60 dias">A prazo (30/60 dias)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Observações do Pedido / Logística <span className="text-[11px] font-normal text-slate-400">(opcional)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Informe data estimada para embarque, local de retirada do gado, etc."
                            value={observacaoProposta}
                            onChange={(e) => setObservacaoProposta(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4 text-emerald-400" />
                          <span>Enviar Proposta ao Produtor</span>
                        </button>
                      </form>
                    )}
                  </div>

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* DEMAIS SUBSEÇÕES */}
      {activeSubSection === 'radar-alertas' && (
        <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Radar de Alertas de Mercado
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold">
                <Radar className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Monitoramento Ativo</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Cadastre preferências de compra e receba avisos quando novos lotes auditados surgirem.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Configurar Novo Alerta de Compra
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Região / Estado</label>
                <input
                  type="text"
                  placeholder="Ex: Ribeirão Preto - SP"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Quantidade Mínima de Gado</label>
                <input
                  type="number"
                  placeholder="Ex: 30"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => alert('Alerta do radar ativado com sucesso!')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Radar className="w-4 h-4" />
                  <span>Ativar Alerta do Radar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubSection === 'compras-anteriores' && (
        <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Registros de Compras Anteriores
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Histórico de negociações concluídas com comprovante de laudo.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Data da Compra</th>
                  <th className="p-4">Fazenda</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4 text-right">Volume Adquirido</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-semibold text-slate-600">07/10/2026</td>
                  <td className="p-4 font-bold text-slate-900">Fazenda Bela Vista</td>
                  <td className="p-4 text-slate-500">Ouro Preto - MG</td>
                  <td className="p-4 text-right font-extrabold text-emerald-700">13 gados</td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                      Concluído
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubSection === 'analisar-fazenda' && (
        <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Análise de Vendas da Fazenda
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Consulte a frequência de auditagem e tempo de mercado do produtor.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Buscar Desempenho do Produtor
            </h2>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Digite o nome da fazenda (ex: Fazenda Bela Vista)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Analisar Fazenda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubSection === 'central-suporte' && (
        <SupportCenter />
      )}
    </SideMenuConsumer>
  );
}