import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  ShoppingBag, 
  User, 
  Calendar, 
  Loader2, 
  RotateCw,
  Filter,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

export interface CompraAnterior {
  id: string;
  quantidadeCabecas: number;
  valorTotal: number;
  dataCompra: string;
  mesChave: string; // Ex: "01", "02", ..., "12"
  fazendaNome: string;
  localizacao: string;
  produtorNome: string;
  produtorTelefone: string;
}

// Lista fixa com todos os meses do ano
const LISTA_MESES = [
  { valor: 'TODOS', rotulo: 'Todos os Meses' },
  { valor: '01', rotulo: 'Janeiro' },
  { valor: '02', rotulo: 'Fevereiro' },
  { valor: '03', rotulo: 'Março' },
  { valor: '04', rotulo: 'Abril' },
  { valor: '05', rotulo: 'Maio' },
  { valor: '06', rotulo: 'Junho' },
  { valor: '07', rotulo: 'Julho' },
  { valor: '08', rotulo: 'Agosto' },
  { valor: '09', rotulo: 'Setembro' },
  { valor: '10', rotulo: 'Outubro' },
  { valor: '11', rotulo: 'Novembro' },
  { valor: '12', rotulo: 'Dezembro' },
];

export const PreviousPurchases: React.FC = () => {
  const { userSession } = useFarm();
  const [compras, setCompras] = useState<CompraAnterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string>('TODOS');

  const consumidorId = userSession?.id || localStorage.getItem('@AgroIntelli:userId');

  const carregarComprasAnteriores = async () => {
    if (!consumidorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/api/lotes/compras/consumidor/${consumidorId}`);
      const comprasRecebidas = res.data?.compras || (Array.isArray(res.data) ? res.data : []);

      if (Array.isArray(comprasRecebidas)) {
        const mapeados: CompraAnterior[] = comprasRecebidas.map((lote: any) => {
          const dataObj = new Date(lote.updatedAt || lote.createdAt);
          const mes = String(dataObj.getMonth() + 1).padStart(2, '0');

          return {
            id: lote.id,
            quantidadeCabecas: Number(lote.quantidadeCabecas) || 0,
            valorTotal: Number(lote.valorTotal || lote.valor || lote.valor_total) || 0,
            dataCompra: dataObj.toLocaleDateString('pt-BR'),
            mesChave: mes,
            fazendaNome: lote.fazenda?.nome || 'Fazenda',
            localizacao: lote.fazenda?.localizacao || 'Não informada',
            produtorNome: lote.fazenda?.usuario?.nome || 'Produtor',
            produtorTelefone: lote.fazenda?.usuario?.telefone || ''
          };
        });

        setCompras(mapeados);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de compras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarComprasAnteriores();
  }, [consumidorId]);

  // Filtra as compras pelo mês selecionado
  const comprasFiltradas = mesSelecionado === 'TODOS' 
    ? compras 
    : compras.filter((c) => c.mesChave === mesSelecionado);

  // Totais calculados do mês selecionado
  const totalGasto = comprasFiltradas.reduce((acc, c) => acc + c.valorTotal, 0);
  const totalCabecasCompradas = comprasFiltradas.reduce((acc, c) => acc + c.quantidadeCabecas, 0);

  const getWhatsAppLink = (telefone: string, quantidade: number, fazenda: string) => {
    if (!telefone) return '#';
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Gostaria de alinhar os detalhes da entrega referente à compra do lote de ${quantidade} gados da ${fazenda}.`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* CABEÇALHO DA TELA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Compras Anteriores
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro oficial e histórico consolidado de todos os lotes adquiridos por você.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={carregarComprasAnteriores}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Atualizando...' : 'Atualizar Histórico'}</span>
        </button>
      </div>

      {/* PAINEL DE FILTRO POR MÊS E TOTALIZADOR */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Seletor com Todos os Meses */}
        <div className="space-y-1.5 flex-1 max-w-xs">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filtrar por Mês:</span>
          </label>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            {LISTA_MESES.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </select>
        </div>

        {/* Quadro Consolidado de Gastos */}
        <div className="flex items-center gap-6 divide-x divide-slate-100 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
          <div className="pr-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">
              Lotes Adquiridos
            </span>
            <span className="text-xl font-black text-slate-900">
              {comprasFiltradas.length} <span className="text-xs font-bold text-slate-500">({totalCabecasCompradas} gados)</span>
            </span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">
              Total Investido no Mês
            </span>
            <span className="text-xl font-black text-emerald-700">
              {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

      </div>

      {/* RENDERIZAÇÃO DOS LOTES COMPRADOS */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-xs font-bold">Carregando seu histórico de compras...</span>
        </div>
      ) : comprasFiltradas.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-2 shadow-xs">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Nenhuma compra registrada para este mês.</p>
          <p className="text-xs text-slate-400">
            {mesSelecionado !== 'TODOS' ? 'Selecione outro mês no filtro para visualizar compras passadas.' : 'Aceite propostas na aba Reservas para registrar novas compras.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comprasFiltradas.map((compra) => (
            <div 
              key={compra.id} 
              className="bg-white p-6 rounded-2xl border border-emerald-300/80 ring-2 ring-emerald-500/10 shadow-xs space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Compra Concluída
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Concluído em: {compra.dataCompra}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">{compra.fazendaNome}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {compra.localizacao}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl flex items-baseline justify-between border border-slate-100">
                <div>
                  <span className="text-3xl font-black text-slate-900">{compra.quantidadeCabecas}</span>
                  <span className="text-xs font-bold text-slate-500 ml-1.5">cabeças de gado</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                    Valor Pago
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {compra.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold">Vendedor responsável:</span>
                <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  {compra.produtorNome}
                </p>
              </div>

              <a
                href={getWhatsAppLink(compra.produtorTelefone, compra.quantidadeCabecas, compra.fazendaNome)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Contato via WhatsApp</span>
              </a>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default PreviousPurchases;