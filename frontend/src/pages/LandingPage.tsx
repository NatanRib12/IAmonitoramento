import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Users, 
  CheckCircle2, 
  Handshake, 
  Sparkles, 
  TrendingUp,
  Award,
  Clock,
  Zap,
  FileCheck2,
  Radar,
  Building2,
  Filter,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const HERO_IMAGE_PATH = '/src/assets/gados.jpeg';
const SOLUCOES_IMAGE_PATH = '/src/assets/gadoaereo.webp';  
const CONSUMIDORES_IMAGE_PATH = '/src/assets/gadoboxes.png';

interface LandingPageProps {
  onNavigateLogin?: () => void;
}

export function LandingPage({ onNavigateLogin }: LandingPageProps) {
  // Estado para controlar a animação da Splash Screen (Capa)
  const [splashText, setSplashText] = useState('');
  const [isSlidingUp, setIsSlidingUp] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Animação de Digitação (Typing Effect Sequence)
  useEffect(() => {
    const sequence = [
      { text: "AgroIntelli", pauseAfter: 1000 }
    ];

    let isCancelled = false;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runTypingSequence = async () => {
      for (let i = 0; i < sequence.length; i++) {
        if (isCancelled) return;

        const currentPhrase = sequence[i].text;
        const isLastPhrase = i === sequence.length - 1;

        // Digitar caractere por caractere
        for (let j = 0; j <= currentPhrase.length; j++) {
          if (isCancelled) return;
          setSplashText(currentPhrase.substring(0, j));
          await sleep(70);
        }

        // Pausa ao terminar de escrever a frase
        await sleep(sequence[i].pauseAfter);

        // Se não for a última frase, apagar caractere por caractere
        if (!isLastPhrase) {
          for (let j = currentPhrase.length; j >= 0; j--) {
            if (isCancelled) return;
            setSplashText(currentPhrase.substring(0, j));
            await sleep(35);
          }
          await sleep(200);
        }
      }

      if (!isCancelled) {
        // Disparar animação da tela subindo (Slide Up)
        setIsSlidingUp(true);
        setTimeout(() => {
          setShowSplash(false);
        }, 900); // Duração da transição CSS
      }
    };

    runTypingSequence();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Função para rolagem suave ao clicar nos links da navbar
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
    <div className="w-full min-h-screen bg-slate-950 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* 🎬 SPLASH SCREEN */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6 transition-transform duration-1000 ease-in-out ${
            isSlidingUp ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          {/* Luzes decorativas ao fundo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Texto sendo Digitado */}
          <div className="relative z-10 text-center max-w-4xl">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight flex items-center justify-center gap-1">
              <span>{splashText}</span>
              <span className="w-1.5 h-10 sm:h-16 md:h-20 bg-emerald-500 inline-block animate-pulse ml-1 rounded-full" />
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm uppercase tracking-[0.3em] font-medium mt-6">
              A revolução digital na pecuária
            </p>
          </div>
        </div>
      )}

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
              href="#produtores" 
              onClick={(e) => handleScroll(e, 'produtores')} 
              className="hover:text-white transition-colors duration-200"
            >
              Fazendeiros & Produtores
            </a>
            <a 
              href="#compradores" 
              onClick={(e) => handleScroll(e, 'compradores')} 
              className="hover:text-white transition-colors duration-200"
            >
              Frigoríficos & Compradores
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

      {/* SEÇÃO 1: INÍCIO (HERO) */}
      <section id="home" className="relative w-full h-screen min-h-[700px] flex items-center overflow-hidden">
        <img
          src={HERO_IMAGE_PATH}
          alt="AgroIntelli Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradiente de contraste para leitura do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent w-full h-full" />

        {/* Gradiente de fusão suave para a seção seguinte (#f4f7f0) */}

        <div className="relative z-20 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
              Pecuária Inteligente e Precisão em Cada Contagem
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Sua fazenda conectada ao futuro da pecuária. Contagem de rebanho com inteligência artificial para aumento de eficiência e praticidade com consumidores.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: SOBRE A AGROINTELLI */}
      <section id="sobre" className="w-full bg-[#f4f7f0] text-slate-900 py-24 px-6 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Cabeçalho da Seção */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300/60 text-emerald-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sobre a AgroIntelli</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Mais que Contagem por IA: A Ponte Digital entre a <span className="italic font-serif font-normal text-emerald-700">Fazenda e o Mercado</span>
            </h2>
            
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed pt-2">
              A AgroIntelli nasceu para eliminar o erro humano e a perda de tempo na pecuária. Unimos Inteligência Artificial à conexão direta com frigoríficos, açougues e restaurantes que buscam por lotes disponíveis, dentro da plataforma.
            </p>
          </div>

          {/* Destaque Principal: Ecossistema Ponta a Ponta */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4 z-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Transformamos gravações em negociações transparentes
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Nossa IA processa imagens aéreas em alta definição, identifica individualmente cada animal e processa cada informação. Com esse laudo em mãos, o produtor divulga o lote e os compradores fecham negócio com total segurança jurídica e operacional.
              </p>
            </div>

            <div className="lg:col-span-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 z-10">
              <div className="flex items-center gap-3 text-emerald-400 font-semibold text-sm">
                <Handshake className="w-5 h-5" />
                <span>Conexão Comercial B2B</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Eliminamos intermediários desnecessários. O comprador encontra a exata quantidade estipulada e o produtor fecha a venda via propostas diretas.
              </p>
            </div>

            {/* Elemento decorativo de fundo */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Grid de Diferenciais de Mercado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-start space-y-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Precisão Absoluta por IA</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nossos algoritmos de visão computacional rastreiam o rebanho em movimento, impedindo contagens duplicadas sem necessitar de manejo estressante no curral.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-start space-y-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Processamento</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Com o vídeo lançado em nossa plataforma, nossa ferramenta de Inteligência Arficial é capaz de contabilizar o gado visível. Gerando um lote que pode ser disponibilizado no mercado.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col items-start space-y-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Liquidez e Agilidade</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aproximamos quem produz de quem consome em larga escala (frigoríficos e restaurantes), reduzindo o tempo de negociação e aumentando a rentabilidade.
              </p>
            </div>

          </div>

          {/* Barra de Métricas/Impacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-emerald-900 text-white p-8 rounded-3xl shadow-inner text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</p>
              <p className="text-xs text-emerald-100 font-medium">Automatizado por IA</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">0%</p>
              <p className="text-xs text-emerald-100 font-medium">Erro Humano de Contagem</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Zero</p>
              <p className="text-xs text-emerald-100 font-medium">Estresse Animal no Curral</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">Direto</p>
              <p className="text-xs text-emerald-100 font-medium">Contato Produtor-Comprador</p>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 3: FAZENDEIROS E PRODUTORES RURAIS */}
      <section id="produtores" className="w-full bg-white text-slate-900 py-24 px-6 border-t border-slate-200/60 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Grid Principal: Imagem + Texto Persuasivo */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Imagem em Destaque com Card Flutuante */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative group">
                <div className="w-full h-[420px] sm:h-[500px] lg:h-[540px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                  <img
                    src={SOLUCOES_IMAGE_PATH}
                    alt="Drone monitorando gado no pasto"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

                {/* Floating Card de Validação na Imagem */}
                <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-white shadow-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status da Contagem</p>
                      <p className="text-sm font-bold text-white">Analise concluida</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-full">
                    100% Preciso
                  </span>
                </div>
              </div>
            </div>

            {/* Conteúdo Persuasivo */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
              <div className="space-y-4">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-200">
                  Para Produtores & Pecuaristas
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Sua Fazenda com Contagem <span className="italic font-serif font-normal text-emerald-700">Rápida, Sem Curral e Sem Erro</span>
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  Esqueça a dor de cabeça de juntar o rebanho na poeira, estressar os animais e perder dias de trabalho. Com a AgroIntelli, você conta milhares de cabeças em minutos diretamente do pasto.
                </p>
              </div>

              {/* Benefícios Core para o Produtor */}
              <div className="space-y-4">
                
                {/* Benefício 1 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8faf6] border border-slate-200/80 hover:border-emerald-300 transition-colors">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-1 shadow-md">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Economia de Tempo e Mão de Obra</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                      O que antes levava dias de manejo exaustivo agora é feito em minutos com um único vídeo.
                    </p>
                  </div>
                </div>

                {/* Benefício 2 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8faf6] border border-slate-200/80 hover:border-emerald-300 transition-colors">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-1 shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Zero Erro Humano e Contagem Duplicada</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                      Nossa Inteligência Artificial atribui identificadores únicos para cada bovino em movimento, eliminando dúvidas e divergências de lote.
                    </p>
                  </div>
                </div>

                {/* Benefício 3 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#f8faf6] border border-slate-200/80 hover:border-emerald-300 transition-colors">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 mt-1 shadow-md">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Maior Poder de Barganha na Venda</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                      Após a análise da IA, você publica seu lote na plataforma e recebe propostas diretas pelo WhatsApp de compradores verificados.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Passo a Passo Simples para o Fazendeiro */}
          <div className="bg-[#f4f7f0] p-8 sm:p-12 rounded-3xl border border-slate-200/80 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Como Funciona na Prática para Você:
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Apenas 3 passos simples para transformar o manejo do seu rebanho.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Passo 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="w-10 h-10 bg-emerald-600 text-white font-extrabold text-lg rounded-xl flex items-center justify-center shadow-md">
                  1
                </div>
                <h4 className="text-lg font-bold text-slate-900">Grave o Voo do Drone</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Utilize qualquer drone comercial para fazer um voo panorâmico gravando o rebanho no pasto.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="w-10 h-10 bg-emerald-600 text-white font-extrabold text-lg rounded-xl flex items-center justify-center shadow-md">
                  2
                </div>
                <h4 className="text-lg font-bold text-slate-900">Suba o Vídeo no Sistema</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Envie o arquivo de vídeo para a nossa plataforma. O motor de IA processa e contabiliza o lote automaticamente.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="w-10 h-10 bg-emerald-600 text-white font-extrabold text-lg rounded-xl flex items-center justify-center shadow-md">
                  3
                </div>
                <h4 className="text-lg font-bold text-slate-900">Receba o Laudo & Negocie</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Baixe o laudo auditado, disponibilize seu lote na vitrine e receba propostas diretas no WhatsApp de compradores.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 4: FRIGORÍFICOS, RESTAURANTES & COMPRADORES PARCEIROS */}
      <section id="compradores" className="w-full bg-slate-900 text-white py-24 px-6 relative overflow-hidden border-t border-slate-800">
        
        {/* Glow de fundo */}
        <div className="absolute top-1/2 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          
          {/* Banner de Apresentação e Valor Comercial */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Texto Persuasivo para Compradores */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-4">
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Para Frigoríficos, Restaurantes & Açougues</span>
                </span>
                
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Previsibilidade de Estoque com <span className="italic font-serif font-normal text-emerald-400">Lotes Auditados por IA</span>
                </h2>
                
                <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                  Elimine surpresas e divergências na balança. A AgroIntelli conecta compradores corporativos diretamente a pecuaristas com rebanho contabilizado por análise computacional.
                </p>
              </div>

              {/* Cards de Recursos Chave do Comprador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Card 1: Radar de Alertas */}
                <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-3 shadow-lg hover:border-emerald-500/50 transition-colors">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
                    <Radar className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Radar de Alertas</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Receba notificações quando uma lote de seu interesse estiver disponível.
                  </p>
                </div>

              </div>

            </div>

            {/* Imagem do Produto/Caixas de Detecção por IA */}
            <div className="lg:col-span-6">
              <div className="relative group">
                <div className="w-full h-[400px] sm:h-[480px] lg:h-[500px] rounded-3xl overflow-hidden bg-slate-800 border border-slate-700/80 shadow-[-18px_18px_35px_rgba(0,0,0,0.45)]">
                  <img
                    src={CONSUMIDORES_IMAGE_PATH}
                    alt="Processamento de visão computacional detectando gado em boxes"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                {/* Card sobreposto de Negociação */}
                <div className="absolute bottom-6 left-6 right-6 bg-slate-950/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 text-white shadow-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4" />
                      <span>Negociação Direta</span>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                      Via WhatsApp / Plataforma
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">
                    Envie propostas de reserva direto para o produtor sem intermediários
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Destaque das Funcionalidades do Radar de Alertas */}
          <div className="bg-slate-800/50 rounded-3xl p-8 sm:p-10 border border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <Filter className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Busca Personalizada</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Filtre por quantidade de gados no lote ou pelo nome da fazenda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Segurança</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Apenas pecuaristas com contagens validadas por IA disponibilizam lotes na vitrine.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Negociação</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assim que um lote for disponibilizado, é possível negociar com o produtor o seu preço final. Permitindo flexibilidade para ambos os lados.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* BANNER CTA FINAL */}
      <section className="w-full bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white py-20 px-6 relative overflow-hidden border-t border-emerald-800/40">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Pronto para Transformar a Gestão e Comercialização do seu Rebanho?
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Junte-se à revolução da pecuária digital. Conecte sua fazenda ou frigorífico à tecnologia de IA mais precisa do mercado.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={onNavigateLogin}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-full text-base transition-all duration-200 shadow-xl shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              Acessar Plataforma AgroIntelli
            </button>
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