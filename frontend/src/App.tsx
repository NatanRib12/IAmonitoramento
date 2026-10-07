import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';

// Contextos Globais
import { VideoProcessingProvider } from './context/VideoProcessing';
import { FarmProvider } from './context/FarmContext';

// Páginas do Produtor
import { ProducerLogin } from './pages/producer/ProducerLogin';
import { ProducerRegister } from './pages/producer/ProducerRegister';
import { AnalyticsDashboard } from './pages/producer/AnalyticsDashboard';
import { ProducerDashboard } from './pages/producer/IAtool';
import { UnprocessedVideo } from './pages/producer/UnprocessedVideo';
import { ProcessedVideo } from './pages/producer/ProcessedVideo';
import { FarmManagement } from './pages/producer/FarmManagement';
import { SupportCenter } from './pages/producer/SupportCenter';

// Layout do Produtor
import { SideMenuProducer } from './components/SideMenuProducer';

// Páginas do Consumidor
import { ConsumerLogin } from './pages/Consumer/ConsumidorLogin';
import { ConsumerRegister } from './pages/Consumer/ConsumidorRegister';
import { ConsumerDashboard } from './pages/Consumer/ConsumidorDashboard';

export function App() {
  const [telaAtual, setTelaAtual] = useState<
    'landing' | 'login' | 'registro' | 'producer_area' | 'consumer_login' | 'consumer_register' | 'consumer_dashboard'
  >('landing');

  const [subSectionAtiva, setSubSectionAtiva] = useState<string>('grafico-analise');

  return (
    <FarmProvider>
      {telaAtual === 'landing' && (
        <LandingPage onNavigateLogin={() => setTelaAtual('login')} />
      )}

      {telaAtual === 'login' && (
        <ProducerLogin 
          onLogin={() => {
            setSubSectionAtiva('grafico-analise');
            setTelaAtual('producer_area');
          }} 
          onNavigateLanding={() => setTelaAtual('landing')}
          onNavigateRegister={() => setTelaAtual('registro')}
          onNavigateConsumerLogin={() => setTelaAtual('consumer_login')}
        />
      )}

      {telaAtual === 'registro' && (
        <ProducerRegister 
          onRegisterSuccess={() => setTelaAtual('login')}
          onNavigateLogin={() => setTelaAtual('login')}
        />
      )}

      {telaAtual === 'producer_area' && (
        <VideoProcessingProvider>
          <SideMenuProducer 
            activeSubSection={subSectionAtiva} 
            onNavigate={(subSection) => setSubSectionAtiva(subSection)}
            onLogout={() => setTelaAtual('login')}
          >
            {subSectionAtiva === 'grafico-analise' && <AnalyticsDashboard />}
            {subSectionAtiva === 'analisar-video' && <ProducerDashboard />}
            {subSectionAtiva === 'videos-anteriores' && <UnprocessedVideo />}
            {subSectionAtiva === 'videos-com-analise' && <ProcessedVideo />}
            {subSectionAtiva === 'mudar-fazenda' && <FarmManagement />}
            {subSectionAtiva === 'central-suporte' && <SupportCenter />}
          </SideMenuProducer>
        </VideoProcessingProvider>
      )}

      {telaAtual === 'consumer_login' && (
        <ConsumerLogin
          onLoginSuccess={() => setTelaAtual('consumer_dashboard')}
          onNavigateLogin={() => setTelaAtual('login')}
          onNavigateConsumerRegister={() => setTelaAtual('consumer_register')}
        />
      )}

      {telaAtual === 'consumer_register' && (
        <ConsumerRegister
          onRegisterSuccess={() => setTelaAtual('consumer_login')}
          onNavigateConsumerLogin={() => setTelaAtual('consumer_login')}
        />
      )}

      {telaAtual === 'consumer_dashboard' && (
        <ConsumerDashboard onNavigateLogin={() => setTelaAtual('consumer_login')} />
      )}
    </FarmProvider>
  );
}

export default App;