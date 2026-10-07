import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type AreaUnit = 'ha' | 'm²' | 'alq';

export interface Farm {
  id: string;
  name: string;
  owner: string;
  location: string;
  areaValue: number;
  areaUnit: AreaUnit;
  cattleCapacity: number;
  isActive: boolean;
}

export type OmittedFarmInput = Omit<Farm, 'id' | 'isActive'>;

interface FarmContextType {
  activeFarm: Farm;
  userFarms: Farm[];
  userName: string;
  setUserSession: (user: { nome: string; fazenda?: any; fazendas?: any[] }) => void;
  setActiveFarmById: (id: string) => void;
  updateActiveFarm: (updatedData: Partial<Farm>) => void;
  addNewFarm: (newFarmData: OmittedFarmInput) => void;
  formatAreaText: (value: number, unit: AreaUnit) => string;
}

// Fazenda padrão inicial zerada até a autenticação do usuário
const defaultFarm: Farm = {
  id: 'default-farm',
  name: 'Sua Fazenda',
  owner: 'Produtor',
  location: 'Não informada',
  areaValue: 0,
  areaUnit: 'ha',
  cattleCapacity: 0,
  isActive: true
};

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState<string>('Produtor');
  const [userFarms, setUserFarms] = useState<Farm[]>([defaultFarm]);

  const activeFarm = userFarms.find((f) => f.isActive) || userFarms[0] || defaultFarm;

  // Função chamada após Login ou Registro bem-sucedido na API
  const setUserSession = (userData: { nome: string; fazenda?: any; fazendas?: any[] }) => {
    setUserName(userData.nome);

    const fazendasBrutas = userData.fazendas || (userData.fazenda ? [userData.fazenda] : []);

    if (fazendasBrutas.length > 0) {
      const fazendasMapeadas: Farm[] = fazendasBrutas.map((f: any, index: number) => ({
        id: f.id || `farm-${Date.now()}-${index}`,
        name: f.nome || f.name || 'Fazenda Sem Nome',
        owner: userData.nome,
        location: f.localizacao || f.location || 'Localização não informada',
        areaValue: Number(f.areaValue || f.area || 0),
        areaUnit: (f.areaUnit as AreaUnit) || 'ha',
        cattleCapacity: Number(f.cattleCapacity || f.capacidadeGado || 0),
        isActive: index === 0
      }));

      setUserFarms(fazendasMapeadas);
    } else {
      setUserFarms([{
        ...defaultFarm,
        owner: userData.nome
      }]);
    }
  };

  const setActiveFarmById = (id: string) => {
    setUserFarms((prev) =>
      prev.map((f) => ({
        ...f,
        isActive: f.id === id
      }))
    );
  };

  const updateActiveFarm = (updatedData: Partial<Farm>) => {
    setUserFarms((prev) =>
      prev.map((f) => (f.isActive ? { ...f, ...updatedData } : f))
    );
  };

  const addNewFarm = (newFarmData: OmittedFarmInput) => {
    const newFarm: Farm = {
      ...newFarmData,
      id: `farm-${Date.now()}`,
      isActive: false
    };
    setUserFarms((prev) => [...prev, newFarm]);
  };

  const formatAreaText = (value: number, unit: AreaUnit): string => {
    if (!value || value <= 0) return '0 ha';

    if (unit === 'ha') {
      const emM2 = (value * 10000).toLocaleString('pt-BR');
      return `${value.toLocaleString('pt-BR')} ha (${emM2} m²)`;
    }

    if (unit === 'm²') {
      const emHa = (value / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
      return `${value.toLocaleString('pt-BR')} m² (${emHa} ha)`;
    }

    if (unit === 'alq') {
      const emHa = (value * 2.42).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      return `${value.toLocaleString('pt-BR')} alqueires (~${emHa} ha)`;
    }

    return `${value} ${unit}`;
  };

  return (
    <FarmContext.Provider
      value={{
        activeFarm,
        userFarms,
        userName,
        setUserSession,
        setActiveFarmById,
        updateActiveFarm,
        addNewFarm,
        formatAreaText
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm deve ser usado dentro de FarmProvider');
  }
  return context;
};