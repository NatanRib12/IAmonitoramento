import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  Radar, 
  Hash, 
  Bell, 
  Trash2, 
  Info, 
  Sliders, 
  Sparkles,
  AlertCircle,
  Loader2,
  Target
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface Lote {
  id: string;
  quantidadeCabecas: number;
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

      if (resLotes.data?.sucesso && Array.isArray(resLotes.data.lotes)) {
        setLotes(resLotes.data.lotes);
      }

      if (resAlertas.data?.sucesso && Array.isArray(resAlertas.data.alertas)) {
        setAlertas(resAlertas.data.alertas);
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

  // Lógica refatorada: pega do valor exato informado até +10 gados
  const lotesCapturadosPeloRadar = useMemo(() => {
    if (alertas.length === 0 || lotes.length === 0) return [];
    
    return lotes.filter((lote) => {
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

  const getWhatsAppLink = (telefone?: string, quantidade?: number, fazenda?: string) => {
    if (!telefone) return '#';
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Vi o seu lote auditado de ${quantidade ?? 0} gados da ${fazenda ?? ''} na plataforma AgroIntelli e gostaria de negociar.`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
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

      if (res.data?.sucesso && res.data?.alerta) {
        setAlertas((prev) => [res.data.alerta, ...prev]);
      } else {
        await carregarDadosDoUsuario();
      }

      setNovaRegiao('');
      setNovaQtd('');
      setAlertaCriadoSucesso(true);
      setTimeout(() => setAlertaCriadoSucesso(false), 4000);
    } catch (err) {
      console.error('Erro ao registrar alerta no banco:', err);
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
            Seus alertas ficam permanentemente registrados na sua conta e monitoram lotes compatíveis em tempo real.
          </p>
        </div>
      </div>

      {/* Explicativo do Algoritmo & Switch */}
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

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          {isModoInteligente ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Modo Inteligente Ativo:</strong> Se você cadastrar um alerta para <strong>23 gados</strong>, o Radar buscará e notificará lotes lançados entre <strong>23 e 33 gados</strong>.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg text-blue-300 flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Modo Exato Ativo:</strong> O Radar capturará apenas lotes com a quantidade <strong>EXATA</strong> informada.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600" />
          Cadastrar Novo Alerta de Interesse
        </h2>

        {alertaCriadoSucesso && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Alerta ativado e salvo na sua conta com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleCriarAlerta} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Região ou Cidade <span className="text-[11px] font-normal text-slate-400">(opcional)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: Barretos - SP, Ribeirão Preto..."
                value={novaRegiao}
                onChange={(e) => setNovaRegiao(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Quantidade Mínima Desejada *
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                placeholder="Ex: 23"
                value={novaQtd}
                onChange={(e) => setNovaQtd(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Radar className="w-4 h-4" />
                  <span>Salvar Alerta</span>
                </>
              )}
            </button>
          </div>
        </form>

        {novaQtd && Number(novaQtd) > 0 && (
          <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {isModoInteligente 
                ? `Alcance do radar: exibirá lotes de ${Number(novaQtd)} até ${Number(novaQtd) + 10} gados.`
                : `Busca exata: exibirá apenas lotes com exatamente ${novaQtd} gados.`}
            </span>
          </p>
        )}
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
            <p className="text-xs font-bold">Nenhum lote atualmente atende ao intervalo dos seus alertas.</p>
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
                  <div className="p-3 bg-slate-50 rounded-xl flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      {lote.quantidadeCabecas} <span className="text-xs font-bold text-slate-500">gados</span>
                    </span>
                  </div>
                </div>

                <a
                  href={getWhatsAppLink(lote.fazenda?.usuario?.telefone, lote.quantidadeCabecas, lote.fazenda?.nome)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default AlertsConsumer;