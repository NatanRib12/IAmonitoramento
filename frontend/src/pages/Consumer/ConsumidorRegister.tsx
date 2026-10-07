import React, { useState } from 'react';
import { Building2, Eye, EyeOff, Lock, Mail, User, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface ConsumerRegisterProps {
  onRegisterSuccess: () => void;
  onNavigateConsumerLogin: () => void;
}

export function ConsumerRegister({
  onRegisterSuccess,
  onNavigateConsumerLogin,
}: ConsumerRegisterProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      await api.post('/api/consumidores/registrar', {
        nome,
        email,
        empresa,
        senha,
      });

      onRegisterSuccess();
    } catch (err: any) {
      console.error(err);
      setErro(err.response?.data?.erro || 'Erro ao registrar parceiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#1e293b_0%,#0f172a_50%,#040711_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/80 relative text-white">
        
        <button
          type="button"
          onClick={onNavigateConsumerLogin}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Login</span>
        </button>

        <div className="flex flex-col items-center mb-6 text-center pt-2">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Cadastro de Parceiro</h1>
          <p className="text-xs text-slate-400 mt-1">Conecte sua empresa aos lotes certificados por IA</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-300 text-xs rounded-xl text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Responsável</label>
            <div className="relative">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Carlos Eduardo"
                required
                className="w-full px-3.5 py-2.5 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nome da Empresa</label>
            <div className="relative">
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ex.: Frigorífico Santa Fé"
                required
                className="w-full px-3.5 py-2.5 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail Corporativo</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="compras@empresa.com"
                required
                className="w-full px-3.5 py-2.5 pl-10 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500/50"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <span>Concluir Cadastro</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 font-medium">
          Já é cadastrado?{' '}
          <button
            type="button"
            onClick={onNavigateConsumerLogin}
            className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
          >
            Entrar
          </button>
        </div>

      </div>
    </div>
  );
}