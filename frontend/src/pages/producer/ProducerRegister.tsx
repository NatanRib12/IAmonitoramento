import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Calendar, 
  Building2, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  Maximize2, 
  Hash, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../services/api';
import { useFarm, type AreaUnit } from '../../context/FarmContext';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onNavigateLogin: () => void;
}

export function ProducerRegister({ onRegisterSuccess, onNavigateLogin }: RegisterProps) {
  const { setUserSession } = useFarm();

  // 1. Dados Pessoais do Usuário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idade, setIdade] = useState<number | ''>('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2. Dados da Fazenda do Produtor
  const [nomeFazenda, setNomeFazenda] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [capacidadeGado, setCapacidadeGado] = useState<number | ''>('');
  const [areaValue, setAreaValue] = useState<number | ''>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('ha');

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const payload = {
        nome,
        email,
        idade: Number(idade),
        senha,
        nomeFazenda,
        localizacao,
        capacidadeGado: Number(capacidadeGado) || 0,
        areaValue: Number(areaValue) || 0,
        areaUnit
      };

      // Envia requisição real ao backend
      const response = await api.post('/api/usuarios/registrar', payload);

      // Atualiza a sessão global da plataforma com as informações reais cadastradas
      setUserSession({
        nome,
        fazenda: {
          id: response.data?.fazendaId || `farm-${Date.now()}`,
          nome: nomeFazenda,
          localizacao,
          capacidadeGado: Number(capacidadeGado) || 0,
          areaValue: Number(areaValue) || 0,
          areaUnit
        }
      });

      onRegisterSuccess();
    } catch (err: any) {
      console.error('Erro de cadastro:', err);
      setErro(err.response?.data?.erro || err.response?.data?.mensagem || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(225deg,#b8c7dd_0%,#cdd0ca_50%,#e7d8b6_100%)] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/60 relative my-8">
        
        {/* Botão de Voltar */}
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Criar Conta de Produtor</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Cadastre seus dados e registre sua propriedade rural</p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* SEÇÃO 1: DADOS DO USUÁRIO */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              1. Informações Pessoais
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Sebastião Ribeiro"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Idade</label>
                <div className="relative">
                  <input
                    type="number"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex.: 45"
                    min="18"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@fazenda.com.br"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

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

          {/* SEÇÃO 2: DADOS DA FAZENDA */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block">
              2. Cadastro da Propriedade Rural
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
                    placeholder="Ex.: Itu - SP"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Capacidade de Gado */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capacidade de Gado</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={capacidadeGado}
                    onChange={(e) => setCapacidadeGado(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex.: 250"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Área da Fazenda */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Área da Propriedade</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex.: 150"
                    required
                    className="w-full px-3.5 py-2.5 pl-10 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <Maximize2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Unidade de Medida */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
                <select
                  value={areaUnit}
                  onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                  className="w-full px-2 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ha">ha</option>
                  <option value="m²">m²</option>
                  <option value="alq">alq</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botão de Finalizar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all duration-200 mt-4 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Cadastrando Usuário e Fazenda...</span>
              </>
            ) : (
              <span>Finalizar Cadastro e Acessar Plataforma</span>
            )}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-5 text-center text-xs text-slate-500 font-medium">
          Já possui uma conta?{' '}
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