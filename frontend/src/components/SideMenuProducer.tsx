import React from 'react';
import { 
  BarChart3, 
  Video, 
  Film, 
  CheckSquare, 
  Tractor, 
  HelpCircle,
  User,
  LogOut
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

interface SideMenuProducerProps {
  children: React.ReactNode;
  activeSubSection: string;
  onNavigate: (subSectionId: string) => void;
  onLogout?: () => void;
}

export const SideMenuProducer: React.FC<SideMenuProducerProps> = ({
  children,
  activeSubSection,
  onNavigate,
  onLogout
}) => {
  const { activeFarm } = useFarm();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Menu Lateral Estático (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none h-full">
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Logo Limpo */}
          <div className="p-6 border-b border-slate-100/80 shrink-0">
            <span 
              onClick={() => onNavigate('grafico-analise')}
              className="text-xl font-extrabold tracking-tight text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors"
            >
              AgroIntelli
            </span>
          </div>

          {/* Navegação */}
          <nav className="p-4 space-y-6 flex-1">
            
            {/* ANÁLISE DE VENDAS DE LOTES */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Análise de Vendas de Lotes
              </p>
              <button
                onClick={() => onNavigate('grafico-analise')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'grafico-analise'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeSubSection === 'grafico-analise' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Gráfico de Análise
              </button>
            </div>

            {/* ANÁLISE */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Análise
              </p>
              <button
                onClick={() => onNavigate('analisar-video')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'analisar-video'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Video className={`w-4 h-4 ${activeSubSection === 'analisar-video' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Analisar Vídeo
              </button>
            </div>

            {/* BIBLIOTECA */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Biblioteca
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => onNavigate('videos-anteriores')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeSubSection === 'videos-anteriores'
                      ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Film className={`w-4 h-4 ${activeSubSection === 'videos-anteriores' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Vídeos Anteriores
                </button>

                <button
                  onClick={() => onNavigate('videos-com-analise')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    activeSubSection === 'videos-com-analise'
                      ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 ${activeSubSection === 'videos-com-analise' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  Vídeos com Análise
                </button>
              </div>
            </div>

            {/* FAZENDAS */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Fazendas
              </p>
              <button
                onClick={() => onNavigate('mudar-fazenda')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'mudar-fazenda'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Tractor className={`w-4 h-4 ${activeSubSection === 'mudar-fazenda' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Mudar de Fazenda
              </button>
            </div>

            {/* SUPORTE */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Suporte
              </p>
              <button
                onClick={() => onNavigate('central-suporte')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'central-suporte'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <HelpCircle className={`w-4 h-4 ${activeSubSection === 'central-suporte' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Central de Suporte
              </button>
            </div>

          </nav>

          {/* Rodapé do Perfil com Fazenda Ativa em Tempo Real */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{activeFarm.owner}</p>
                <p className="text-xs text-emerald-600 font-semibold truncate">{activeFarm.name}</p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>

    </div>
  );
};