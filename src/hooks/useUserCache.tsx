
import { useState, useEffect } from 'react';

// Chaves do cache
const USER_PROFILE_CACHE_KEY = 'sweet-ai-user-profile';
const USER_AGENT_CACHE_KEY = 'sweet-ai-user-agent';
const USER_PLAN_CACHE_KEY = 'sweet-ai-user-plan';

// Tipos
type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  plan_name?: string | null;
  plan_active?: boolean;
  cached_at: number;
};

type UserAgent = {
  agent_id: string;
  nickname: string;
  cached_at: number;
};

type UserPlan = {
  plan_name: string;
  plan_active: boolean;
  cached_at: number;
};

export const useUserCache = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agent, setAgent] = useState<UserAgent | null>(null);
  const [plan, setPlan] = useState<UserPlan | null>(null);

  // Carregar dados do cache ao inicializar
  useEffect(() => {
    loadFromCache();
  }, []);

  // Função para carregar todos os dados do cache
  const loadFromCache = () => {
    try {
      // Carregar perfil
      const cachedProfile = localStorage.getItem(USER_PROFILE_CACHE_KEY);
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        setProfile(profileData);
        console.log('✅ Perfil carregado do cache:', profileData);
      }

      // Carregar agente
      const cachedAgent = localStorage.getItem(USER_AGENT_CACHE_KEY);
      if (cachedAgent) {
        const agentData = JSON.parse(cachedAgent);
        setAgent(agentData);
        console.log('✅ Agente carregado do cache:', agentData);
      }

      // Carregar plano
      const cachedPlan = localStorage.getItem(USER_PLAN_CACHE_KEY);
      if (cachedPlan) {
        const planData = JSON.parse(cachedPlan);
        setPlan(planData);
        console.log('✅ Plano carregado do cache:', planData);
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
  };

  // Salvar perfil no cache
  const saveProfile = (profileData: Omit<UserProfile, 'cached_at'>) => {
    const dataWithTimestamp = {
      ...profileData,
      cached_at: Date.now()
    };
    localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(dataWithTimestamp));
    setProfile(dataWithTimestamp);
    console.log('✅ Perfil salvo no cache:', dataWithTimestamp);
  };

  // Salvar agente no cache
  const saveAgent = (agentData: Omit<UserAgent, 'cached_at'>) => {
    const dataWithTimestamp = {
      ...agentData,
      cached_at: Date.now()
    };
    localStorage.setItem(USER_AGENT_CACHE_KEY, JSON.stringify(dataWithTimestamp));
    setAgent(dataWithTimestamp);
    console.log('✅ Agente salvo no cache:', dataWithTimestamp);
  };

  // Salvar plano no cache
  const savePlan = (planData: Omit<UserPlan, 'cached_at'>) => {
    const dataWithTimestamp = {
      ...planData,
      cached_at: Date.now()
    };
    localStorage.setItem(USER_PLAN_CACHE_KEY, JSON.stringify(dataWithTimestamp));
    setPlan(dataWithTimestamp);
    console.log('✅ Plano salvo no cache:', dataWithTimestamp);
    
    // Também atualizar o perfil com os dados do plano
    if (profile) {
      const updatedProfile = {
        ...profile,
        plan_name: planData.plan_name,
        plan_active: planData.plan_active,
        cached_at: Date.now()
      };
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('✅ Perfil atualizado com plano no cache:', updatedProfile);
    }
  };

  // Função específica para atualizar dados do plano após pagamento
  const updatePlanAfterPayment = (planName: string, planActive: boolean) => {
    console.log('🎉 Atualizando plano após pagamento confirmado:', { planName, planActive });
    
    const planData = {
      plan_name: planName,
      plan_active: planActive
    };
    
    savePlan(planData);
    
    // Forçar atualização do estado para re-renderizar componentes
    window.dispatchEvent(new CustomEvent('planUpdated', { 
      detail: { planName, planActive } 
    }));
    
    return planData;
  };

  // Limpar todo o cache
  const clearCache = () => {
    localStorage.removeItem(USER_PROFILE_CACHE_KEY);
    localStorage.removeItem(USER_AGENT_CACHE_KEY);
    localStorage.removeItem(USER_PLAN_CACHE_KEY);
    setProfile(null);
    setAgent(null);
    setPlan(null);
    console.log('🗑️ Cache limpo');
  };

  // Verificar se o plano está ativo
  const hasPlanActive = () => {
    return plan?.plan_active === true;
  };

  // Obter nome do plano
  const getPlanName = () => {
    return plan?.plan_name || null;
  };

  return {
    profile,
    agent,
    plan,
    saveProfile,
    saveAgent,
    savePlan,
    updatePlanAfterPayment,
    clearCache,
    loadFromCache,
    hasPlanActive,
    getPlanName
  };
};
