import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Chaves do cache
const USER_PROFILE_CACHE_KEY = 'sweet-ai-user-profile';
const USER_AGENT_CACHE_KEY = 'sweet-ai-user-agent';
const USER_PLAN_CACHE_KEY = 'sweet-ai-user-plan';

// Tipos
type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agent, setAgent] = useState<UserAgent | null>(null);
  const [plan, setPlan] = useState<UserPlan | null>(null);

  // Carregar dados do cache ao inicializar
  useEffect(() => {
    loadFromCache();
  }, []);

  // Sincronizar com Supabase quando o usuário está logado
  useEffect(() => {
    if (user) {
      syncWithSupabase();
    }
  }, [user]);

  // Função para sincronizar com Supabase
  const syncWithSupabase = async () => {
    if (!user) return;

    try {
      console.log('useUserCache - Sincronizando com Supabase...');
      
      // Buscar perfil atualizado
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('useUserCache - Erro ao buscar perfil:', profileError);
      } else if (profileData) {
        console.log('useUserCache - Perfil encontrado no Supabase:', profileData);
        
        const updatedProfile: UserProfile = {
          id: profileData.id,
          full_name: profileData.full_name,
          email: user.email || '',
          avatar_url: profileData.avatar_url,
          plan_name: profileData.plan_name,
          plan_active: profileData.plan_active,
          cached_at: Date.now()
        };
        
        saveProfile(updatedProfile);
        
        // Atualizar cache do plano se disponível
        if (profileData.plan_name) {
          savePlan({
            plan_name: profileData.plan_name,
            plan_active: profileData.plan_active || false
          });
        }
      }

      // Buscar agente selecionado
      const { data: agentData, error: agentError } = await supabase
        .from('user_selected_agent')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (agentError) {
        console.log('useUserCache - Nenhum agente selecionado encontrado');
      } else if (agentData) {
        console.log('useUserCache - Agente encontrado no Supabase:', agentData);
        saveAgent({
          agent_id: agentData.agent_id,
          nickname: agentData.nickname
        });
      }

    } catch (error) {
      console.error('useUserCache - Erro na sincronização:', error);
    }
  };

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
  const saveProfile = (profileData: Omit<UserProfile, 'cached_at'> | UserProfile) => {
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
    
    // Forçar sincronização com Supabase
    if (user) {
      syncWithSupabase();
    }
    
    // Forçar atualização do estado para re-renderizar componentes
    window.dispatchEvent(new CustomEvent('planUpdated', { 
      detail: { planName, planActive } 
    }));
    
    return planData;
  };

  // Função para atualizar avatar
  const updateAvatar = (avatarUrl: string) => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        avatar_url: avatarUrl,
        cached_at: Date.now()
      };
      localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('✅ Avatar atualizado no cache:', avatarUrl);
    }
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

  // Obter avatar URL
  const getAvatarUrl = () => {
    return profile?.avatar_url || null;
  };

  // Obter nome completo
  const getFullName = () => {
    return profile?.full_name || null;
  };

  return {
    profile,
    agent,
    plan,
    saveProfile,
    saveAgent,
    savePlan,
    updatePlanAfterPayment,
    updateAvatar,
    clearCache,
    loadFromCache,
    syncWithSupabase,
    hasPlanActive,
    getPlanName,
    getAvatarUrl,
    getFullName
  };
};
