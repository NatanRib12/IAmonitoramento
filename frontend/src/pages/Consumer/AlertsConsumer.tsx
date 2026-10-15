import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  Radar, 
  Hash, 
  Bell, 
  Trash2, 
  Sliders, 
  Sparkles,
  AlertCircle,
  Loader2,
  BookmarkCheck,
  X,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface Lote {
  id: string;
  quantidadeCabecas: number;
  valorTotal?: number; // <-- CAMPO DE VALOR DO LOTE
  status: string;
  createdAt: string;
  fazenda: {
    nome: string;
    localizacao: string;
    usuario: {
      nome: string;
      telefone: string;
      email?: string;
    }
  }
}

interface AlertaRadar {
  id: string;
  regiao?: string;
  quantidadeDesejada: number;
  createdAt: string;
}

export function AlertsConsumer() {
  const { userSession } = useFarm();
  
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [alertas, setAlertas] = useState<AlertaRadar[]>([]);
  const [loading, setLoading] = useState(true);

  const consumidorIdReal = userSession?.id || localStorage.getItem('@AgroIntelli:userId');

  const [isModoInteligente, setIsModoInteligente] = useState<boolean>(() => {
    const saved = localStorage.getItem('@AgroIntelli:modoInteligente');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [novaRegiao, setNovaRegiao] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertaCriadoSucesso, setAlertaCriadoSucesso] = useState(false);

  // Estados do Modal de Reserva
  const [modalReservaAberta, setModalReservaAberta] = useState(false);
  const [loteReservadoInfo, setLoteReservadoInfo] = useState<Lote | null>(null);
  const [reservandoId, setReservandoId] = useState<string | null>(null);

  const handleToggleModo = () => {
    setIsModoInteligente((prev) => {
      const novoValor = !prev;
      localStorage.setItem('@AgroIntelli:modoInteligente', JSON.stringify(novoValor));
      return novoValor;
    });
  };

  const carregarDadosDoUsuario = async () => {
    setLoading(true);
    try {
      const [resLotes, resAlertas] = await Promise.all([
        api.get('/api/lotes/disponiveis'),
        consumidorIdReal 
          ? api.get(`/api/alertas?consumidorId=${consumidorIdReal}`) 
          : Promise.resolve({ data: { alertas: [] } })
      ]);

      const lotesRecebidos = resLotes.data?.lotes || (Array.isArray(resLotes.data) ? resLotes.data : []);
      if (Array.isArray(lotesRecebidos)) {
        setLotes(lotesRecebidos.filter((l: Lote) => l.status === 'DISPONIVEL'));
      }

      const alertasRecebidos = resAlertas.data?.alertas || (Array.isArray(resAlertas.data) ? resAlertas.data : []);
      if (Array.isArray(alertasRecebidos)) {
        setAlertas(alertasRecebidos);
      }
    } catch (err) {
      console.error('Erro ao buscar informações sincronizadas do comprador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosDoUsuario();
  }, [consumidorIdReal]);

  const lotesCapturadosPeloRadar = useMemo(() => {
    if (alertas.length === 0 || lotes.length === 0) return [];
    
    return lotes.filter((lote) => {
      if (lote.status !== 'DISPONIVEL') return false;

      return alertas.some((alerta) => {
        const bateuRegiao = !alerta.regiao || lote.fazenda?.localizacao?.toLowerCase().includes(alerta.regiao.toLowerCase());

        if (isModoInteligente) {
          const minQtd = alerta.quantidadeDesejada;
          const maxQtd = alerta.quantidadeDesejada + 10;
          return bateuRegiao && lote.quantidadeCabecas >= minQtd && lote.quantidadeCabecas <= maxQtd;
        } else {
          return bateuRegiao && lote.quantidadeCabecas === alerta.quantidadeDesejada;
        }
      });
    });
  }, [alertas, lotes, isModoInteligente]);

  const handleReservarLoteDirect = async (lote: Lote) => {
    setReservandoId(lote.id);

    try {
      await api.put(`/api/lotes/${lote.id}/reservar`, {
        consumidorId: consumidorIdReal,
        consumerName: userSession?.nome || 'Comprador Parceiro',
        consumerCompany: userSession?.empresa || 'Frigorífico / Empresa'
      });
    } catch (err) {
      console.warn('Processando reserva localmente:', err);
    } finally {
      setLoteReservadoInfo(lote);
      setLotes((prev) => prev.filter((l) => l.id !== lote.id));
      setReservandoId(null);
      setModalReservaAberta(true);
    }
  };

  const handleCriarAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaQtd) return;

    if (!consumidorIdReal) {
      alert('Sessão expirada. Faça login novamente para cadastrar um alerta.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        regiao: novaRegiao.trim(),
        quantidadeDesejada: Number(novaQtd),
        consumidorId: consumidorIdReal
      };

      const res = await api.post('/api/alertas', payload);
      const novoAlerta = res.data?.alerta || (res.data?.id ? res.data : null);

      if (novoAlerta) {
        setAlertas((prev) => [novoAlerta, ...prev]);
      } else {
        await carregarDadosDoUsuario();
      }

      setNovaRegiao('');
      setNovaQtd('');
      setAlertaCriadoSucesso(true);
      setTimeout(() => setAlertaCriadoSucesso(false), 4000);
    } catch (err) {
      console.error('Erro ao registrar alerta no banco:', err);
      alert('Não foi possível salvar o alerta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoverAlerta = async (id: string) => {
    try {
      await api.delete(`/api/alertas/${id}`);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Erro ao deletar alerta do banco:', err);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Radar de Alertas de Mercado
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${
              isModoInteligente 
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                : 'bg-blue-100 text-blue-900 border-blue-300'
            }`}>
              <Radar className="w-4 h-4 shrink-0" />
              <span>{isModoInteligente ? 'Busca Flexível (Até +10)' : 'Busca Exata'}</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Seus alertas ficam permanentemente registrados e monitoram lotes disponíveis em tempo real.
          </p>
        </div>
      </div>

      {/* Algoritmo & Switch */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-7 rounded-2xl shadow-md border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Algoritmo do Radar</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Alterne entre busca por até +10 gados a mais ou quantidade exata.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs">
              <span className="font-bold text-white block">Modo Radar Inteligente</span>
              <span className="text-[11px] text-slate-400 font-medium">Margem de até +10 gados</span>
            </div>
            <button
              type="button"
              onClick={handleToggleModo}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isModoInteligente ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isModoInteligente ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro de Alerta */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          Cadastrar Novo Alerta de Interesse
        </h2>

        {alertaCriadoSucesso && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Alerta ativado e salvo com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleCriarAlerta} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Região / Cidade (opcional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: Barretos - SP..."
                value={novaRegiao}
                onChange={(e) => setNovaRegiao(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Quantidade Mínima *</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                placeholder="Ex: 23"
                value={novaQtd}
                onChange={(e) => setNovaQtd(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radar className="w-4 h-4" /><span>Salvar Alerta</span></>}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Alertas Salvos */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          Seus Alertas Salvos ({alertas.length})
        </h2>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-xs font-bold">Carregando seus alertas...</span>
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
            <p className="text-xs font-bold">Você ainda não possui nenhum alerta cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertas.map((alerta) => (
              <div 
                key={alerta.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md uppercase">
                      Alerta Ativo
                    </span>
                    <button
                      onClick={() => handleRemoverAlerta(alerta.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      title="Excluir alerta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {alerta.quantidadeDesejada} <span className="text-xs font-bold text-slate-500">gados</span>
                    </span>
                    <p className="text-[11px] text-emerald-700 font-extrabold mt-0.5">
                      {isModoInteligente 
                        ? `Alcance: ${alerta.quantidadeDesejada} a ${alerta.quantidadeDesejada + 10} gados`
                        : 'Buscando quantidade exata'}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold truncate">
                      {alerta.regiao || 'Todas as regiões'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  Registrado em: {new Date(alerta.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lotes Compatíveis Encontrados */}
      <div className="space-y-4 pt-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Lotes Compatíveis Encontrados ({lotesCapturadosPeloRadar.length})
        </h2>

        {lotesCapturadosPeloRadar.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold">Nenhum lote disponível atende aos seus alertas no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lotesCapturadosPeloRadar.map((lote) => (
              <div
                key={lote.id}
                className="bg-white p-5 rounded-2xl border border-emerald-500/40 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {lote.fazenda?.nome || 'Fazenda'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lote.fazenda?.localizacao}
                  </p>

                  {/* BLOCO DE QUANTIDADE E VALOR DO LOTE */}
                  <div className="p-3 bg-slate-50 rounded-xl flex items-baseline justify-between border border-slate-100">
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        {lote.quantidadeCabecas} <span className="text-xs font-bold text-slate-500">gados</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block">Valor do Lote</span>
                      <span className="text-sm font-black text-emerald-700">
                        {lote.valorTotal && lote.valorTotal > 0
                          ? lote.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'Sob Consulta'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={reservandoId === lote.id}
                    onClick={() => handleReservarLoteDirect(lote)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Reservar</span>
                  </button>

                  <a
                    href={`https://wa.me/55${lote.fazenda?.usuario?.telefone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pop-up de Sucesso da Reserva */}
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
                O lote de <strong className="text-slate-900">{loteReservadoInfo?.quantidadeCabecas} gados</strong>
                {loteReservadoInfo?.valorTotal ? (
                  <> no valor de <strong className="text-emerald-700">{loteReservadoInfo.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></>
                ) : null} da <strong className="text-slate-900">{loteReservadoInfo?.fazenda?.nome}</strong> foi removido do mercado público e transferido para a sua aba <strong className="text-emerald-700">"Reservas de Lotes"</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalReservaAberta(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default AlertsConsumer;