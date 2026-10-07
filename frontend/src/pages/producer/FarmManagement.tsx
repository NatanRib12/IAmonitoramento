import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  MapPin, 
  Maximize2, 
  CheckCircle2, 
  Plus, 
  Check, 
  X, 
  Sparkles,
  Tractor
} from 'lucide-react';
import { useFarm, type AreaUnit, type Farm } from '../../context/FarmContext';

export function FarmManagement() {
  const { activeFarm, userFarms, setActiveFarmById, updateActiveFarm, addNewFarm, formatAreaText } = useFarm();

  // Estado local do formulário para edição da Fazenda Ativa
  const [name, setName] = useState(activeFarm.name);
  const [owner, setOwner] = useState(activeFarm.owner);
  const [location, setLocation] = useState(activeFarm.location);
  const [areaValue, setAreaValue] = useState<number | string>(activeFarm.areaValue);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(activeFarm.areaUnit);
  const [cattleCapacity, setCattleCapacity] = useState<number | string>(activeFarm.cattleCapacity);

  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const [modalNovaFazenda, setModalNovaFazenda] = useState(false);

  // Estados do formulário de criação de nova fazenda
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState(activeFarm.owner);
  const [newLocation, setNewLocation] = useState('');
  const [newAreaValue, setNewAreaValue] = useState<number | string>('');
  const [newAreaUnit, setNewAreaUnit] = useState<AreaUnit>('ha');
  const [newCattleCapacity, setNewCattleCapacity] = useState<number | string>('');

  // Atualiza os campos do formulário caso o usuário troque de fazenda ativa
  useEffect(() => {
    setName(activeFarm.name);
    setOwner(activeFarm.owner);
    setLocation(activeFarm.location);
    setAreaValue(activeFarm.areaValue);
    setAreaUnit(activeFarm.areaUnit);
    setCattleCapacity(activeFarm.cattleCapacity);
  }, [activeFarm]);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveFarm({
      name,
      owner,
      location,
      areaValue: Number(areaValue) || 0,
      areaUnit,
      cattleCapacity: Number(cattleCapacity) || 0
    });

    setSalvoComSucesso(true);
    setTimeout(() => setSalvoComSucesso(false), 3000);
  };

  const handleCreateNewFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newLocation) return;

    addNewFarm({
      name: newName,
      owner: newOwner || 'Seu Tião',
      location: newLocation,
      areaValue: Number(newAreaValue) || 0,
      areaUnit: newAreaUnit,
      cattleCapacity: Number(newCattleCapacity) || 0
    });

    setModalNovaFazenda(false);
    setNewName('');
    setNewLocation('');
    setNewAreaValue('');
    setNewCattleCapacity('');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Gestão da Propriedade
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Atualize as informações técnicas da fazenda ativa ou altere a propriedade em trabalho.
          </p>
        </div>

        {salvoComSucesso && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Dados da propriedade atualizados com sucesso!
          </div>
        )}
      </div>

      {/* SEÇÃO SUPERIOR: FORMULÁRIO DE EDIÇÃO + PREVIEW DA FAZENDA (LAYOUT CLAUDE/BRANDING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LADO ESQUERDO: FORMULÁRIO DE DADOS */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Editar Informações da Propriedade</h2>
                <p className="text-xs text-slate-400">Dados da fazenda selecionada no momento</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              Ativa no Sistema
            </span>
          </div>

          <form onSubmit={handleSaveForm} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome da Fazenda */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Nome da Fazenda
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  required
                />
              </div>

              {/* Proprietário */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Proprietário / Titular
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Localização */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Localização (Cidade / Estado)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  placeholder="Ex: Itu - SP"
                  required
                />
              </div>

              {/* Capacidade de Gado */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Capacidade Total de Gado
                </label>
                <input
                  type="number"
                  min="0"
                  value={cattleCapacity}
                  onChange={(e) => setCattleCapacity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  required
                />
              </div>
            </div>

            {/* ÁREA DA FAZENDA COM FORMATADOR INTELIGENTE DE UNIDADE */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Área Total da Propriedade
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="Informe o número da área"
                  />
                </div>

                {/* Seletor da Unidade de Medida */}
                <div className="sm:col-span-4">
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ha">Hectares (ha)</option>
                    <option value="m²">Metros Quadrados (m²)</option>
                    <option value="alq">Alqueires (alq)</option>
                  </select>
                </div>
              </div>

              {/* AUXÍLIO AUTOMÁTICO DE CONVERSÃO/LEITURA DE ÁREA */}
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200/60 flex items-center justify-between">
                <span>Leitura formatada da área:</span>
                <span className="font-extrabold text-slate-900">
                  {formatAreaText(Number(areaValue) || 0, areaUnit)}
                </span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setName(activeFarm.name);
                  setOwner(activeFarm.owner);
                  setLocation(activeFarm.location);
                  setAreaValue(activeFarm.areaValue);
                  setAreaUnit(activeFarm.areaUnit);
                  setCattleCapacity(activeFarm.cattleCapacity);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>

          </form>
        </div>

        {/* LADO DIREITO: CARD PREVIEW EXECUTIVO (ESTILO YOUR BRAND DO LAYOUT) */}
        <div className="lg:col-span-4 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Resumo da Propriedade Ativa
          </p>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 relative overflow-hidden">
            <div className="w-full h-32 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]" />
              <div className="text-center z-10">
                <Tractor className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <span className="text-white font-black text-lg tracking-tight block truncate">
                  {name || 'Nome da Fazenda'}
                </span>
                <span className="text-slate-400 text-xs font-semibold">{location || 'Localização'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-400 uppercase">Titular</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">{owner}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
                <span className="font-bold text-slate-400 uppercase">Área Total</span>
                <span className="font-extrabold text-emerald-700 text-right">
                  {formatAreaText(Number(areaValue) || 0, areaUnit)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 text-xs">
                <span className="font-bold text-slate-400 uppercase">Capacidade</span>
                <span className="font-bold text-slate-900">{cattleCapacity} cabeças</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-[11px] font-semibold text-slate-500">
              Todos os relatórios, gráficos e contagens da IA estão vinculados a esta fazenda.
            </div>
          </div>
        </div>

      </div>

      {/* SEÇÃO INFERIOR: TROCAR DE FAZENDA (SOMENTE FAZENDAS VINCULADAS AO USUÁRIO) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Minhas Fazendas Vinculadas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione com qual propriedade deseja trabalhar. As informações do sistema serão alternadas com isolamento total.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovaFazenda(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Cadastrar Nova Fazenda
          </button>
        </div>

        {/* GRADE DE PROPRIEDADES PERTENCENTES UNICAMENTE AO PRODUTOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {userFarms.map((farm) => {
            const isSelected = farm.isActive;

            return (
              <div
                key={farm.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'bg-emerald-50/40 border-emerald-500/80 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-base">{farm.name}</h3>
                    {isSelected && (
                      <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full tracking-wider uppercase">
                        Ativa
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 font-medium">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {farm.location}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                      {formatAreaText(farm.areaValue, farm.areaUnit)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Capacidade: {farm.cattleCapacity} cabeças
                    </p>
                  </div>
                </div>

                {/* AÇÃO DE TROCA DE FAZENDA */}
                <div>
                  {isSelected ? (
                    <div className="w-full py-2 bg-emerald-100/60 text-emerald-800 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Propriedade Selecionada
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveFarmById(farm.id)}
                      className="w-full py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Mudar para esta Fazenda
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL POP-UP PARA CADASTRAR NOVA FAZENDA */}
      {modalNovaFazenda && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Cadastrar Nova Fazenda</h3>
              </div>
              <button onClick={() => setModalNovaFazenda(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewFarm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Propriedade</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Fazenda Campo Aberto"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Localização</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Botucatu - SP"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Capacidade de Gado</label>
                  <input
                    type="number"
                    value={newCattleCapacity}
                    onChange={(e) => setNewCattleCapacity(e.target.value)}
                    placeholder="Ex: 200"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Área Total</label>
                  <input
                    type="number"
                    value={newAreaValue}
                    onChange={(e) => setNewAreaValue(e.target.value)}
                    placeholder="Valor"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidade</label>
                  <select
                    value={newAreaUnit}
                    onChange={(e) => setNewAreaUnit(e.target.value as AreaUnit)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ha">Hectares</option>
                    <option value="m²">m²</option>
                    <option value="alq">Alqueires</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNovaFazenda(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cadastrar Fazenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}