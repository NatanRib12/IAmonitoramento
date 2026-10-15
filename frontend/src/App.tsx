import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';

// Contextos
import { VideoProcessingProvider } from './context/VideoProcessing';
import { FarmProvider, useFarm } from './context/FarmContext';

// Telas Autenticadas do Produtor
import { AnalyticsDashboard } from './pages/producer/AnalyticsDashboard';
import { MarketLotsProducer } from './pages/producer/MarketLotsProducer';
import { ProducerDashboard } from './pages/producer/IAtool';
import { UnprocessedVideo } from './pages/producer/UnprocessedVideo';
import { ProcessedVideo } from './pages/producer/ProcessedVideo';
import { FarmManagement } from './pages/producer/FarmManagement';
import { SupportCenter } from './pages/producer/SupportCenter';

// Layouts
import { SideMenuProducer } from './components/SideMenuProducer';
import { SideMenuConsumer } from './components/SideMenuConsumer';

// Telas Autenticadas do Comprador
import { ConsumidorDashboard } from './pages/Consumer/ConsumidorDashboard';
import { AlertsConsumer } from './pages/Consumer/AlertsConsumer';
import { PreviousPurchases } from './pages/Consumer/PreviousPurchases';
import { ReservedLots } from './pages/Consumer/ReservedLots';
import { SupportCenterConsumer } from './pages/Consumer/SupportCenterConsumer';

// Telas de Autenticação Universais
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';

function AppContent() {
  const { userSession, logout } = useFarm();

  const [telaAtual, setTelaAtual] = useState<
    'landing' | 'login' | 'register' | 'producer_area' | 'consumer_area'
  >(() => {
    const savedType = localStorage.getItem('@AgroIntelli:userType');
    if (savedType === 'produtor') return 'producer_area';
    if (savedType === 'comprador') return 'consumer_area';
    return 'landing';
  });

  const [subSectionProducer, setSubSectionProducer] = useState<string>('grafico-analise');
  const [subSectionConsumer, setSubSectionConsumer] = useState<string>('lotes-disponiveis');

  const handleLogout = () => {
    logout();
    setTelaAtual('login');
  };

  return (
    <>
      {telaAtual === 'landing' && (
        <LandingPage onNavigateLogin={() => setTelaAtual('login')} />
      )}

      {/* LOGIN UNIVERSAL */}
      {telaAtual === 'login' && (
        <Login
          onLoginProducerSuccess={() => {
            setSubSectionProducer('grafico-analise');
            setTelaAtual('producer_area');
          }}
          onLoginBuyerSuccess={() => {
            setSubSectionConsumer('lotes-disponiveis');
            setTelaAtual('consumer_area');
          }}
          onNavigateLanding={() => setTelaAtual('landing')}
          onNavigateRegister={() => setTelaAtual('register')}
        />
      )}

      {/* REGISTRO UNIVERSAL */}
      {telaAtual === 'register' && (
        <Register
          onRegisterSuccess={(tipoPerfil) => {
            if (tipoPerfil === 'produtor') {
              setSubSectionProducer('grafico-analise');
              setTelaAtual('producer_area');
            } else {
              setSubSectionConsumer('lotes-disponiveis');
              setTelaAtual('consumer_area');
            }
          }}
          onNavigateLogin={() => setTelaAtual('login')}
        />
      )}

      {/* ÁREA DO PRODUTOR */}
      {telaAtual === 'producer_area' && (
        <VideoProcessingProvider>
          <SideMenuProducer
            activeSubSection={subSectionProducer}
            onNavigate={(subSection) => setSubSectionProducer(subSection)}
            onLogout={handleLogout}
          >
            {subSectionProducer === 'grafico-analise' && <AnalyticsDashboard />}
            {subSectionProducer === 'lotes-mercado' && <MarketLotsProducer />}
            {subSectionProducer === 'analisar-video' && <ProducerDashboard />}
            {subSectionProducer === 'videos-anteriores' && <UnprocessedVideo />}
            {subSectionProducer === 'videos-com-analise' && <ProcessedVideo />}
            {subSectionProducer === 'mudar-fazenda' && <FarmManagement />}
            {subSectionProducer === 'central-suporte' && <SupportCenter />}
          </SideMenuProducer>
        </VideoProcessingProvider>
      )}

      {/* ÁREA DO COMPRADOR */}
      {telaAtual === 'consumer_area' && (
        <SideMenuConsumer
          activeSubSection={subSectionConsumer}
          onNavigate={(subSection) => setSubSectionConsumer(subSection)}
          userName={userSession?.nome || 'Comprador'}
          companyName={userSession?.empresa || 'Frigorífico Parceiro'}
          onLogout={handleLogout}
        >
          {subSectionConsumer === 'lotes-disponiveis' && <ConsumidorDashboard />}
          {subSectionConsumer === 'radar-alertas' && <AlertsConsumer />}
          {subSectionConsumer === 'compras-anteriores' && <PreviousPurchases />}
          {subSectionConsumer === 'reservas-lotes' && <ReservedLots />}
          {subSectionConsumer === 'central-suporte' && <SupportCenterConsumer/>}
        </SideMenuConsumer>
      )}
    </>
  );
}

export function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}

export default App;