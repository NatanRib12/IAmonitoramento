import { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ConsumerLogin } from './pages/ConsumidorLogin';
import { ConsumerRegister } from './pages/ConsumidorRegister';
import { ConsumerDashboard } from './pages/ConsumidorDashboard';

export function App() {
  const [telaAtual, setTelaAtual] = useState<
    'landing' | 'login' | 'registro' | 'dashboard' | 'consumer_login' | 'consumer_register' | 'consumer_dashboard'
  >('landing');

  return (
    <>
      {telaAtual === 'landing' && (
        <LandingPage onNavigateLogin={() => setTelaAtual('login')} />
      )}

      {telaAtual === 'login' && (
        <Login 
          onLogin={() => setTelaAtual('dashboard')} 
          onNavigateLanding={() => setTelaAtual('landing')}
          onNavigateRegister={() => setTelaAtual('registro')}
          onNavigateConsumerLogin={() => setTelaAtual('consumer_login')}
        />
      )}

      {telaAtual === 'registro' && (
        <Register 
          onRegisterSuccess={() => setTelaAtual('login')}
          onNavigateLogin={() => setTelaAtual('login')}
        />
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

      {telaAtual === 'dashboard' && (
        <Dashboard onNavigateLogin={() => setTelaAtual('login')} />
      )}

      {telaAtual === 'consumer_dashboard' && (
        <ConsumerDashboard onNavigateLogin={() => setTelaAtual('consumer_login')} />
      )}
    </>
  );
}

export default App;