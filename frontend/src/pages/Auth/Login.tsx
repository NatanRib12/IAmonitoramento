import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useFarm } from '../../context/FarmContext';

interface LoginProps {
  onLoginProducerSuccess: () => void;
  onLoginBuyerSuccess: () => void;
  onNavigateLanding?: () => void;
  onNavigateRegister: () => void;
}

export function Login({
  onLoginProducerSuccess,
  onLoginBuyerSuccess,
  onNavigateLanding,
  onNavigateRegister,
}: LoginProps) {
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
      // 1. Tenta autenticação como Produtor / Fazendeiro
      try {
        const resProducer = await api.post('/api/usuarios/login', {
          email,
          senha: password,
        });

        if (resProducer.data?.sucesso || resProducer.data?.usuario) {
          const user = resProducer.data.usuario || resProducer.data;
          setUserSession({
            id: user.id,
            nome: user.nome,
            tipo: 'produtor',
            fazenda: user.fazenda,
            fazendas: user.fazendas,
          });
          localStorage.setItem('@AgroIntelli:userType', 'produtor');
          localStorage.setItem('@AgroIntelli:userId', user.id);
          onLoginProducerSuccess();
          return;
        }
      } catch (prodErr) {
        // Tenta como Comprador
      }

      // 2. Tenta autenticação como Comprador / Frigorífico
      const resBuyer = await api.post('/api/consumidores/login', {
        email,
        senha: password,
      });

      if (resBuyer.data?.sucesso || resBuyer.data?.consumidor) {
        const buyer = resBuyer.data.consumidor || resBuyer.data;
        setUserSession({
          id: buyer.id,
          nome: buyer.nome,
          empresa: buyer.empresa,
          tipo: 'comprador',
        });
        localStorage.setItem('@AgroIntelli:userType', 'comprador');
        localStorage.setItem('@AgroIntelli:userId', buyer.id);
        onLoginBuyerSuccess();
        return;
      }

      throw new Error('Credenciais não encontradas.');
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setErro(
        err.response?.data?.erro ||
        'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative text-slate-800">
        
        {onNavigateLanding && (
          <button
            type="button"
            onClick={onNavigateLanding}
            className="absolute top-6 left-6 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Voltar para a página inicial"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Início</span>
          </button>
        )}

        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-6 text-center pt-2">
          <span className="text-xl font-black text-emerald-700 tracking-tight mb-1">
            AgroIntelli
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Acesse sua Conta</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Acesso único para Produtores e Compradores
          </p>
        </div>

        {erro && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">E-mail Cadastrado</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full px-4 py-3 pl-11 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium text-xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar na Plataforma</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          Ainda não tem uma conta?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline transition cursor-pointer"
          >
            Criar conta
          </button>
        </div>

      </div>
    </div>
  );
}