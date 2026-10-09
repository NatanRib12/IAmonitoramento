import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../services/api';

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
  userId: string | null;
  setUserSession: (user: any) => void;
  setActiveFarmById: (id: string) => void;
  updateActiveFarm: (updatedData: Partial<Farm>) => Promise<void>;
  addNewFarm: (newFarmData: OmittedFarmInput) => Promise<void>;
  formatAreaText: (value: number, unit: AreaUnit) => string;
}

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
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('@AgroIntelli:userName') || 'Produtor';
  });

  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('@AgroIntelli:userId') || null;
  });

  const [userFarms, setUserFarms] = useState<Farm[]>(() => {
    const savedFarms = localStorage.getItem('@AgroIntelli:userFarms');
    if (savedFarms) {
      try {
        return JSON.parse(savedFarms);
      } catch (e) {
        console.error('Erro ao restaurar fazendas salvas:', e);
      }
    }
    return [defaultFarm];
  });

  const activeFarm = userFarms.find((f) => f.isActive) || userFarms[0] || defaultFarm;

  // Busca e sincroniza automaticamente todas as fazendas do banco de dados na inicialização/F5
  useEffect(() => {
    const currentUserId = userId || localStorage.getItem('@AgroIntelli:userId');

    if (currentUserId) {
      api.get(`/api/fazendas/usuario/${currentUserId}`)
        .then((res) => {
          if (res.data?.sucesso && Array.isArray(res.data.fazendas) && res.data.fazendas.length > 0) {
            setUserFarms((prevFarms) => {
              const activeId = prevFarms.find((f) => f.isActive)?.id;

              const fazendasAtualizadas: Farm[] = res.data.fazendas.map((f: any, idx: number) => ({
                id: f.id,
                name: f.nome || 'Fazenda Sem Nome',
                owner: userName,
                location: f.localizacao || 'Localização não informada',
                areaValue: Number(f.areaValue || 0),
                areaUnit: (f.areaUnit as AreaUnit) || 'ha',
                cattleCapacity: Number(f.cattleCapacity || 0),
                isActive: activeId ? f.id === activeId : idx === 0
              }));

              localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(fazendasAtualizadas));
              return fazendasAtualizadas;
            });
          }
        })
        .catch((err) => console.error('Erro ao reidratar fazendas do banco:', err));
    }
  }, [userId, userName]);

  // Sincroniza alterações no localStorage
  useEffect(() => {
    if (userFarms.length > 0 && userFarms[0].id !== 'default-farm') {
      localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(userFarms));
    }
  }, [userFarms]);

  // Extrai o ID do usuário de forma flexível de qualquer estrutura de objeto enviada pelo login ou registro
  const setUserSession = (userData: any) => {
    const extractedId = userData?.id || userData?.usuarioId || userData?.usuario?.id;
    const extractedName = userData?.nome || userData?.name || userData?.usuario?.nome || 'Produtor';

    setUserName(extractedName);
    localStorage.setItem('@AgroIntelli:userName', extractedName);

    if (extractedId) {
      setUserId(extractedId);
      localStorage.setItem('@AgroIntelli:userId', extractedId);
    }

    const fazendasBrutas = userData?.fazendas || userData?.usuario?.fazendas || (userData?.fazenda ? [userData.fazenda] : []);

    if (fazendasBrutas.length > 0) {
      const fazendasMapeadas: Farm[] = fazendasBrutas.map((f: any, index: number) => ({
        id: f.id,
        name: f.nome || f.name || 'Fazenda Sem Nome',
        owner: extractedName,
        location: f.localizacao || f.location || 'Localização não informada',
        areaValue: Number(f.areaValue || 0),
        areaUnit: (f.areaUnit as AreaUnit) || 'ha',
        cattleCapacity: Number(f.cattleCapacity || 0),
        isActive: index === 0
      }));

      setUserFarms(fazendasMapeadas);
      localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(fazendasMapeadas));
    } else {
      setUserFarms([{
        ...defaultFarm,
        owner: extractedName
      }]);
    }
  };

  const setActiveFarmById = (id: string) => {
    setUserFarms((prev) => {
      const atualizadas = prev.map((f) => ({
        ...f,
        isActive: f.id === id
      }));
      localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(atualizadas));
      return atualizadas;
    });
  };

  const updateActiveFarm = async (updatedData: Partial<Farm>) => {
    setUserFarms((prev) => {
      const atualizadas = prev.map((f) => (f.isActive ? { ...f, ...updatedData } : f));
      localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(atualizadas));
      return atualizadas;
    });

    if (activeFarm.id && activeFarm.id !== 'default-farm' && !activeFarm.id.startsWith('farm-')) {
      try {
        await api.put(`/api/fazendas/${activeFarm.id}`, {
          areaValue: updatedData.areaValue,
          areaUnit: updatedData.areaUnit,
          cattleCapacity: updatedData.cattleCapacity,
          name: updatedData.name,
          location: updatedData.location
        });
      } catch (error) {
        console.error('Erro ao atualizar fazenda no banco de dados:', error);
      }
    }
  };

  const addNewFarm = async (newFarmData: OmittedFarmInput) => {
    const currentUserId = userId || localStorage.getItem('@AgroIntelli:userId');

    if (!currentUserId) {
      console.error('ID do usuário não encontrado para vincular a nova fazenda.');
      alert('Sessão do usuário não identificada. Por favor, faça login novamente para revalidar seu acesso.');
      return;
    }

    try {
      const res = await api.post('/api/fazendas', {
        usuarioId: currentUserId,
        name: newFarmData.name,
        location: newFarmData.location,
        areaValue: newFarmData.areaValue,
        areaUnit: newFarmData.areaUnit,
        cattleCapacity: newFarmData.cattleCapacity
      });

      if (res.data?.fazenda?.id) {
        const realDbFarm = res.data.fazenda;

        const newFarm: Farm = {
          id: realDbFarm.id,
          name: realDbFarm.nome || newFarmData.name,
          owner: userName,
          location: realDbFarm.localizacao || newFarmData.location,
          areaValue: Number(realDbFarm.areaValue || newFarmData.areaValue || 0),
          areaUnit: (realDbFarm.areaUnit as AreaUnit) || newFarmData.areaUnit || 'ha',
          cattleCapacity: Number(realDbFarm.cattleCapacity || newFarmData.cattleCapacity || 0),
          isActive: false
        };

        setUserFarms((prev) => {
          const listaAtualizada = [...prev, newFarm];
          localStorage.setItem('@AgroIntelli:userFarms', JSON.stringify(listaAtualizada));
          return listaAtualizada;
        });
      } else {
        throw new Error('Resposta do servidor não incluiu o ID da fazenda.');
      }
    } catch (error) {
      console.error('Erro ao criar nova fazenda no banco de dados:', error);
      alert('Falha ao registrar a nova fazenda no banco de dados.');
    }
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
        userId,
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