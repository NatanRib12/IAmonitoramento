import React from 'react';
import { ShieldCheck, Cpu, BarChart3, Users, CheckCircle2 } from 'lucide-react';

const HERO_IMAGE_PATH = '/src/assets/gados.jpeg';
const SOLUCOES_IMAGE_PATH = '/src/assets/gadoaereo.webp';  
const CONSUMIDORES_IMAGE_PATH = '/src/assets/gadoboxes.png';

interface LandingPageProps {
  onNavigateLogin?: () => void;
}

export function LandingPage({ onNavigateLogin }: LandingPageProps) {

  // Função para rolagem suave ao clicar nos links
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* NAVBAR FIXA */}
      <header className="fixed top-6 left-0 right-0 z-50 max-w-7xl mx-auto px-6">
        <nav className="w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-full px-8 py-3.5 flex items-center justify-between shadow-2xl">
          
          {/* Logo AgroIntelli */}
          <a 
            href="#home" 
            onClick={(e) => handleScroll(e, 'home')} 
            className="flex items-center gap-2.5 group"
          >
            <span className="text-2xl font-black text-white tracking-tight">
              AgroIntelli
            </span>
          </a>

          {/* Links de Âncora com Rolagem Suave */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a 
              href="#home" 
              onClick={(e) => handleScroll(e, 'home')} 
              className="hover:text-white transition-colors duration-200"
            >
              Início
            </a>
            <a 
              href="#sobre" 
              onClick={(e) => handleScroll(e, 'sobre')} 
              className="hover:text-white transition-colors duration-200"
            >
              Sobre
            </a>
            <a 
              href="#solucoes" 
              onClick={(e) => handleScroll(e, 'solucoes')} 
              className="hover:text-white transition-colors duration-200"
            >
              Soluções
            </a>
            <a 
              href="#consumidores" 
              onClick={(e) => handleScroll(e, 'consumidores')} 
              className="hover:text-white transition-colors duration-200"
            >
              Consumidores
            </a>
          </div>

          {/* Botão de Login */}
          <button
            onClick={onNavigateLogin}
            className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-7 py-2.5 rounded-full text-sm transition-all duration-200 shadow-md hover:shadow-xl active:scale-95 cursor-pointer"
          >
            Entrar
          </button>
        </nav>
      </header>

      {/* INÍCIO */}
      <section id="home" className="relative w-full h-screen min-h-[700px] flex items-center overflow-hidden">
        <img
          src={HERO_IMAGE_PATH}
          alt="AgroIntelli Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent w-full h-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
              Pecuária Com Inteligente e Precisão em Cada Contagem
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Sua fazenda conectada ao futuro da pecuária. Contagem de rebanho com inteligência artificial para aumento de eficiência e praticidade com consumidores.
            </p>
          </div>
        </div>
      </section>

      {/* TRANSIÇÃO EM DEGRADÊ */}
      <div className="w-full  bg-gradient-to-b from-slate-950 via-slate-900/40 to-[#f4f7f0]" />

      {/* SOBRE */}
      <section id="sobre" className="w-full bg-[#f4f7f0] text-slate-900 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              Sobre a AgroIntelli
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Transformando a Pecuária com <span className="italic font-serif font-normal text-emerald-700">Inteligência</span>
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Nossa plataforma combina visão computacional com filmagens aéreas para automatizar a contagem de rebanhos. Evitando erros manuais reduzindo o estresse do animal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-center text-center space-y-4 hover:shadow-md transition">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Visão computacional</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Modelos treinados para identificar bovinos.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-center text-center space-y-4 hover:shadow-md transition">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Segurança</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Contagens automatizadas evitando erros manuais e perda de tempo
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-center text-center space-y-4 hover:shadow-md transition">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Eficiência</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Conexão com consumidores anunciando a disponibilidade de novos lotes.
              </p>
            </div>
          </div>

        </div>
      </section>

    {/* SOLUÇÕES */}
    <section id="solucoes" className="w-full bg-white text-slate-900 py-24 px-6 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="w-full h-[400px] sm:h-[480px] lg:h-[500px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-[18px_18px_35px_rgba(0,0,0,0.14)]">
              <img
                src={SOLUCOES_IMAGE_PATH}
                alt="Soluções AgroIntelli"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-end text-right space-y-8">
            <div className="max-w-xl space-y-4">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                SOLUÇÕES
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Tecnologia Completa <br className="hidden sm:inline" />para o <span className="italic font-serif font-normal text-emerald-700">Produtor Rural</span>
              </h2>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Desenvolvido para se integrar à rotina da fazenda. Basta subir o vídeo gravado pelo drone e nossa plataforma faz o resto.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="bg-[#f8faf6] p-7 sm:p-8 rounded-2xl border border-slate-200/80 flex flex-col items-end text-right space-y-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">Fácil de usar</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Basta apenas subir o arquivo de vídeo no plataforma para iniciar a contagem.
                </p>
              </div>

              <div className="bg-[#f8faf6] p-7 sm:p-8 rounded-2xl border border-slate-200/80 flex flex-col items-end text-right space-y-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">IDs Únicos</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Algoritmo inteligente que impede a contagem duplicada do mesmo animal.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CONSUMIDORES */}
      <section id="consumidores" className="w-full bg-slate-900 text-white py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Conteúdo e Cards Ampliados (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-8">
            <div className="max-w-xl space-y-4">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-500/30">
                CONSUMIDORES
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                Transparência Total
              </h2>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Acesse informações sobre os lotes disponíveis para compra. Notificações automáticas conectam produtores a compradores.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              <div className="bg-slate-800/60 p-7 sm:p-8 rounded-2xl border border-slate-700/60 flex flex-col items-start text-left space-y-3 shadow-sm">
                <Users className="w-8 h-8 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Conexão Direta com a Fazenda</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Receba alertas assim que um novo lote for disponibilizado pelo produtor.
                </p>
              </div>

              <div className="bg-slate-800/60 p-7 sm:p-8 rounded-2xl border border-slate-700/60 flex flex-col items-start text-left space-y-3 shadow-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Garantia do Volume Contratado</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Elimine divergências na entrega com contagem automatizada por IA.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="w-full h-[400px] sm:h-[480px] lg:h-[500px] rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-[-18px_18px_35px_rgba(0,0,0,0.45)]">
              <img
                src={CONSUMIDORES_IMAGE_PATH}
                alt="Consumidores e Frigoríficos"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="w-full bg-slate-950 text-slate-500 text-xs py-8 px-6 text-center border-t border-slate-800">
        <p>© 2026 AgroIntelli. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}