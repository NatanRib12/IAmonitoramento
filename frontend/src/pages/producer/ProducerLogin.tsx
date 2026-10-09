import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface LoginProps {
  onLogin: () => void;
  onNavigateLanding?: () => void;
  onNavigateRegister?: () => void;
  onNavigateConsumerLogin?: () => void;
}

export function ProducerLogin({ onLogin, onNavigateLanding, onNavigateRegister, onNavigateConsumerLogin }: LoginProps) {
  const { setUserSession } = useFarm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const response = await api.post('/api/usuarios/login', {
        email,
        senha: password
      });

      if (response.data?.sucesso || response.data?.usuario) {
        const usuarioBD = response.data.usuario || response.data;
        
        // Passa explicitamente o ID do usuário para o Contexto e LocalStorage
        setUserSession({
          id: usuarioBD.id,
          nome: usuarioBD.nome,
          fazenda: usuarioBD.fazenda,
          fazendas: usuarioBD.fazendas
        });

        onLogin();
      } else {
        throw new Error('Resposta de autenticação inválida.');
      }
    } catch (err: any) {
      console.error('Erro de login:', err);
      setErro(
        err.response?.data?.erro || 
        err.response?.data?.mensagem || 
        'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative">
        
        {onNavigateLanding && (
          <button
            type="button"
            onClick={onNavigateLanding}
            className="absolute top-6 left-6 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-6 text-center pt-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login do Produtor</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Acesse sua conta para gerenciar suas fazendas</p>
        </div>

        {erro && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail Cadastrado
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@fazenda.com.br"
                required
                className="w-full px-4 py-3 pl-11 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="w-full px-4 py-3 pl-11 pr-11 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-xs"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.99] mt-2 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium space-y-3">
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
          {onNavigateConsumerLogin && (
            <button
              type="button"
              onClick={onNavigateConsumerLogin}
              className="mt-1 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span>Sou comprador / frigorífico</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}