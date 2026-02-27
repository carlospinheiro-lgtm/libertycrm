import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AgentFilterContextType {
  selectedAgentId: string; // 'all' or a specific user id
  setSelectedAgentId: (id: string) => void;
  isAgentLocked: boolean; // true if user is an agent (can't change filter)
}

const AgentFilterContext = createContext<AgentFilterContextType | undefined>(undefined);

const MANAGER_ROLES = [
  'diretor_geral',
  'diretor_comercial',
  'diretor_agencia',
  'lider_equipa',
  'diretor_rh',
  'diretor_financeiro',
  'coordenadora_loja',
  'assistente_direcao',
];

export function AgentFilterProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  const isManager = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.roles.some(r => MANAGER_ROLES.includes(r));
  }, [currentUser]);

  const isAgentLocked = !isManager;

  const [managerSelection, setManagerSelection] = useState<string>('all');

  const selectedAgentId = isAgentLocked
    ? (currentUser?.id || 'all')
    : managerSelection;

  const setSelectedAgentId = (id: string) => {
    if (!isAgentLocked) {
      setManagerSelection(id);
    }
  };

  return (
    <AgentFilterContext.Provider value={{ selectedAgentId, setSelectedAgentId, isAgentLocked }}>
      {children}
    </AgentFilterContext.Provider>
  );
}

export function useAgentFilter() {
  const context = useContext(AgentFilterContext);
  if (!context) {
    throw new Error('useAgentFilter must be used within AgentFilterProvider');
  }
  return context;
}
