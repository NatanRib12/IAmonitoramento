import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onNavigateLanding?: () => void;
  onNavigateRegister?: () => void;
  onNavigateConsumerLogin?: () => void;
}

export function Login({ onLogin, onNavigateLanding, onNavigateRegister, onNavigateConsumerLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@agrointelli.com');
  const [password, setPassword] = useState('12345678');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative">
        
        {/* Botão de Voltar para a Landing Page */}
        {onNavigateLanding && (
          <button
            type="button"
            onClick={onNavigateLanding}
            className="absolute top-6 left-6 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition duration-200 flex items-center gap-1.5 text-xs font-bold"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}

        {/* Cabeçalho do Card */}
        <div className="flex flex-col items-center mb-8 text-center pt-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login</h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex.: admin@agrointelli.com"
                required
                className="w-full px-4 py-3.5 pl-11 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-sm"
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="w-full px-4 py-3.5 pl-11 pr-11 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-sm"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Botão Login */}
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] mt-2 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-8 text-center text-sm text-slate-500 font-medium space-y-2">
          <div>
            Ainda não tem uma conta?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition cursor-pointer"
            >
              Criar conta
            </button>
          </div>
          <button
            type="button"
            onClick={onNavigateConsumerLogin}
            className="mt-1 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <span>Sou parceiro</span>
          </button>
        </div>

      </div>
    </div>
  );
}