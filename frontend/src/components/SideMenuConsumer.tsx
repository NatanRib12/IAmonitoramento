import React from 'react';
import { 
  Search, 
  Radar, 
  ShoppingBag, 
  BarChart3, 
  HelpCircle, 
  User, 
  LogOut 
} from 'lucide-react';

interface SideMenuConsumerProps {
  children: React.ReactNode;
  activeSubSection: string;
  onNavigate: (subSectionId: string) => void;
  userName?: string;
  companyName?: string;
  onLogout?: () => void;
}

export const SideMenuConsumer: React.FC<SideMenuConsumerProps> = ({
  children,
  activeSubSection,
  onNavigate,
  userName = 'Comprador',
  companyName = 'Parceiro Comercial',
  onLogout
}) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Menu Lateral Estático (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none h-full">
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Logo com Identificação de Comprador */}
          <div className="p-6 border-b border-slate-100/80 shrink-0 flex items-center justify-between">
            <span 
              onClick={() => onNavigate('lotes-disponiveis')}
              className="text-xl font-extrabold tracking-tight text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors"
            >
              AgroIntelli
            </span>
          </div>

          {/* Navegação */}
          <nav className="p-4 space-y-6 flex-1">
            
            {/* BUSCAR */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Buscar
              </p>
              <button
                onClick={() => onNavigate('lotes-disponiveis')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'lotes-disponiveis'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Search className={`w-4 h-4 ${activeSubSection === 'lotes-disponiveis' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Lotes Disponíveis
              </button>
            </div>

            {/* OPORTUNIDADES */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Oportunidades
              </p>
              <button
                onClick={() => onNavigate('radar-alertas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'radar-alertas'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Radar className={`w-4 h-4 ${activeSubSection === 'radar-alertas' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Radar de Alertas
              </button>
            </div>

            {/* COMPRAS ANTERIORES */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Compras Anteriores
              </p>
              <button
                onClick={() => onNavigate('compras-anteriores')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'compras-anteriores'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 ${activeSubSection === 'compras-anteriores' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Registros
              </button>
            </div>

            {/* ANALISAR FAZENDA */}
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Analisar Fazenda
              </p>
              <button
                onClick={() => onNavigate('analisar-fazenda')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeSubSection === 'analisar-fazenda'
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 rounded-l-none'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BarChart3 className={`w-4 h-4 ${activeSubSection === 'analisar-fazenda' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Dados de Venda
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

          {/* Rodapé do Perfil do Consumidor */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
                <p className="text-xs text-blue-600 font-semibold truncate">{companyName}</p>
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

      {/* Área Principal das Telas do Consumidor */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>

    </div>
  );
};
