import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';

interface ConsumerLoginProps {
  onLoginSuccess: () => void;
  onNavigateLogin: () => void;
  onNavigateConsumerRegister: () => void;
}

export function ConsumerLogin({
  onLoginSuccess,
  onNavigateLogin,
  onNavigateConsumerRegister,
}: ConsumerLoginProps) {
  // Mockado para apresentação
  const [email, setEmail] = useState('compras@frigorificosantafe.com.br');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#1e293b_0%,#0f172a_50%,#040711_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/80 relative text-white">
        
        {/* Voltar para Login Geral */}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-8 text-center pt-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight pt-6">Portal do Parceiro</h1>
          <p className="text-xs text-slate-400 mt-1">Acesso exclusivo para compradores em lote</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">E-mail Corporativo</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 pl-11 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 pl-11 pr-11 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition duration-200 cursor-pointer"
          >
            Acessar Lotes Auditados
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 text-center text-sm text-slate-400 font-medium">
          Ainda não é parceiro?{' '}
          <button
            type="button"
            onClick={onNavigateConsumerRegister}
            className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
          >
            Cadastrar empresa
          </button>
        </div>

      </div>
    </div>
  );
}