import React, { useState, useEffect } from 'react';
import { 
  Sprout, Building2, Phone, MapPin, Calendar, ShieldCheck, 
  CheckCircle2, LogOut, Bell, FileText, MessageSquare, 
  ChevronRight, Award, User, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

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

// Dados de demonstração (fallback instantâneo para apresentações)
const MOCK_LOTES: Lote[] = [
  {
    id: 'lote-01',
    quantidadeCabecas: 45,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date().toISOString(),
    fazenda: {
      nome: 'Fazenda Santa Maria',
      localizacao: 'Ribeirão Preto - SP',
      usuario: {
        nome: 'Natan Santos',
        telefone: '(16) 99876-5432',
        email: 'produtor@agrointelli.com',
      }
    }
  },
  {
    id: 'lote-02',
    quantidadeCabecas: 120,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    fazenda: {
      nome: 'Estância Boa Vista',
      localizacao: 'Barretos - SP',
      usuario: {
        nome: 'Carlos Eduardo Silveira',
        telefone: '(17) 99123-8899',
        email: 'carlos@boavista.com.br',
      }
    }
  },
  {
    id: 'lote-03',
    quantidadeCabecas: 85,
    videoProcessadoUrl: null,
    status: 'DISPONIVEL',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    fazenda: {
      nome: 'Fazenda Vale do Sol',
      localizacao: 'Uberaba - MG',
      usuario: {
        nome: 'Mariana Ribeiro',
        telefone: '(34) 99765-4321',
        email: 'mariana@valedosol.com',
      }
    }
  }
];

export function ConsumerDashboard({ onNavigateLogin }: ConsumerDashboardProps) {
  const [lotes, setLotes] = useState<Lote[]>(MOCK_LOTES);
  const [loteSelecionado, setLoteSelecionado] = useState<Lote>(MOCK_LOTES[0]);
  const [loading, setLoading] = useState(false);

  // Busca os lotes em tempo real do backend
  const carregarLotes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/lotes/disponiveis');
      if (response.data.sucesso && response.data.lotes.length > 0) {
        setLotes(response.data.lotes);
        setLoteSelecionado(response.data.lotes[0]);
      }
    } catch (error) {
      console.warn("Utilizando dados mockados de demonstração:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLotes();
  }, []);

  // Formata número de telefone para link direto do WhatsApp
  const getWhatsAppLink = (telefone: string, quantidade: number, fazenda: string) => {
    const numLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá! Vi o seu lote auditado de ${quantidade} cabeças de gado da ${fazenda} na plataforma AgroIntelli e gostaria de negociar.`
    );
    return `https://wa.me/55${numLimpo}?text=${mensagem}`;
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      {/* ==================== BARRA LATERAL FIXA (LEFT SIDEBAR) ==================== */}
      <aside className="w-80 sm:w-96 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shadow-2xl flex-shrink-0">
        
        {/* Topo do Menu Lateral */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight leading-none">AgroIntelli</h1>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Portal do Comprador</span>
            </div>
          </div>

          <button 
            onClick={carregarLotes} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Atualizar lotes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Subcabeçalho de Notificações */}
        <div className="px-6 py-4 bg-slate-950/60 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Lotes Notificados</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
            {lotes.length} ativos
          </span>
        </div>

        {/* FEED DE NOTIFICAÇÕES DOS LOTES (SCROLLÁVEL) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {lotes.map((lote) => {
            const isSelected = loteSelecionado.id === lote.id;
            return (
              <div
                key={lote.id}
                onClick={() => setLoteSelecionado(lote)}
                className={`p-4 rounded-2xl transition-all cursor-pointer border relative ${
                  isSelected 
                    ? 'bg-slate-800/90 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20' 
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-emerald-500 rounded-r-full" />
                )}

                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate max-w-[180px]">
                    {lote.fazenda.nome}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-semibold border border-emerald-500/20">
                    Auditado
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white tracking-tight">{lote.quantidadeCabecas}</span>
                    <span className="text-xs text-slate-400 font-medium">cabeças</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(lote.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate font-medium">{lote.fazenda.usuario.nome}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isSelected ? 'translate-x-1 text-emerald-400' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-sm">
              F
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white truncate max-w-[140px]">Frigorífico Parceiro</span>
              <span className="text-[10px] text-slate-400">compras@frigorifico.com</span>
            </div>
          </div>

          <button
            onClick={onNavigateLogin}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Sair do Portal"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </aside>

      {/* ==================== ÁREA PRINCIPAL (CENTRO / DIREITA) ==================== */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-50/80 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* TOPO DA PÁGINA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Lote Selecionado
                </span>
                <span className="text-xs text-slate-400">• Código Auditado #{loteSelecionado.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {loteSelecionado.fazenda.nome}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={getWhatsAppLink(loteSelecionado.fazenda.usuario.telefone, loteSelecionado.quantidadeCabecas, loteSelecionado.fazenda.nome)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition shadow-md hover:shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Negociar via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* GRID DE INFORMAÇÕES E DESCRIÇÃO DA FAZENDA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA (8 COLUNAS): VÍDEO DA AUDITORIA & METRICAS */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* VÍDEO DA AUDITORIA POR IA */}
              <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 relative">
                <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Comprovação de Auditoria por Visão Computacional</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-md font-bold border border-emerald-500/30">
                    IA AgroIntelli v2.0
                  </span>
                </div>

                <div className="aspect-video w-full bg-slate-950 flex items-center justify-center relative">
                  {loteSelecionado.videoProcessadoUrl ? (
                    <video
                      src={loteSelecionado.videoProcessadoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-3">
                      <div className="p-4 bg-slate-800/80 rounded-full text-emerald-400">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>
                      <h4 className="text-white font-bold text-lg">Lote 100% Auditado por IA</h4>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        Vídeo analisado e certificado pelo modelo YOLOv8 com rastreamento único de IDs. Nenhuma contagem duplicada.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD DE DESCRIÇÃO DA FAZENDA E PROCEDÊNCIA */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Sobre a Propriedade Rural</span>
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed">
                  A <strong>{loteSelecionado.fazenda.nome}</strong> é referência em gestão de pastagem e pecuária sustentável. Localizada na região estratégica de <strong>{loteSelecionado.fazenda.localizacao}</strong>, a propriedade utiliza auditoria aérea periódica com drones para garantir transparência total no inventário e pesagem dos lotes comercializados.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Total Auditado</span>
                    <span className="text-xl font-extrabold text-slate-900">{loteSelecionado.quantidadeCabecas} Cabeças</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Status Sanitário</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
                      100% Vacinado
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Certificação</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Award className="w-4 h-4 text-amber-500" /> AgroIntelli Gold
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA (4 COLUNAS): DADOS DE CONTATO E LAUDO */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* CARD DE CONTATO DO PRODUTOR */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Contato do Produtor
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Responsável</span>
                      <span className="text-sm font-bold text-slate-800">{loteSelecionado.fazenda.usuario.nome}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Telefone / WhatsApp</span>
                      <span className="text-sm font-bold text-slate-800">{loteSelecionado.fazenda.usuario.telefone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Localização</span>
                      <span className="text-sm font-bold text-slate-800">{loteSelecionado.fazenda.localizacao}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Data da Auditoria</span>
                      <span className="text-sm font-bold text-slate-800">
                        {new Date(loteSelecionado.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${loteSelecionado.fazenda.usuario.telefone.replace(/\D/g, '')}`}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Ligar para o Fazendeiro</span>
                </a>
              </div>

              {/* CARD DE EMISSÃO DE LAUDO */}
              <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-4 relative overflow-hidden">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit border border-emerald-500/30">
                  <FileText className="w-6 h-6" />
                </div>

                <h4 className="text-lg font-bold text-white">Laudo de Auditoria em PDF</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Documento digital com selo de integridade com carimbo de data/hora e contagem verificada por IA.
                </p>

                <button
                  onClick={() => alert('Download do Laudo de Auditoria PDF iniciado!')}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-xs cursor-pointer"
                >
                  Baixar Laudo Oficial (.PDF)
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}