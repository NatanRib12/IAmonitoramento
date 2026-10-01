import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, Calendar, Building2, MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onNavigateLogin: () => void;
}

export function Register({ onRegisterSuccess, onNavigateLogin }: RegisterProps) {
  // Campos do Usuario
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idade, setIdade] = useState<number | ''>('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campos da Fazenda (Relação no Prisma)
  const [nomeFazenda, setNomeFazenda] = useState('');
  const [localizacao, setLocalizacao] = useState('');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      // Envia requisição alinhada com os campos do modelo Prisma
      await api.post('/api/usuarios/registrar', {
        nome,
        email,
        idade: Number(idade),
        senha,
        nomeFazenda,
        localizacao,
      });

      // Sucesso: Redireciona para o login ou diretamente para o Dashboard
      onRegisterSuccess();
    } catch (err: any) {
      console.error(err);
      setErro(err.response?.data?.erro || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative">
        
        {/* Botão de Voltar para o Login */}
        <button
          type="button"
          onClick={onNavigateLogin}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition duration-200 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Login</span>
        </button>

        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-6 text-center pt-4">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Criar Nova Conta</h1>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-xl text-center font-medium">
            {erro}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              1. Dados do Usuário
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Carlos Alberto"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Idade */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Idade</label>
                <div className="relative">
                  <input
                    type="number"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex.: 28"
                    min="18"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: DADOS DA FAZENDA */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              2. Dados da Propriedade (Fazenda)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nome da Fazenda */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Fazenda</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nomeFazenda}
                    onChange={(e) => setNomeFazenda(e.target.value)}
                    placeholder="Ex.: Fazenda Santa Maria"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Localização (Cidade - UF)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Ex.: Ribeirão Preto - SP"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all duration-200 mt-4 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <span>Finalizar Cadastro</span>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-5 text-center text-xs text-slate-500 font-medium">
          Já possui conta?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
          >
            Fazer Login
          </button>
        </div>

      </div>
    </div>
  );
}