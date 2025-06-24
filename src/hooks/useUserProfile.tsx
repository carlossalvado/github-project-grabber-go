import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
  plan_name?: string | null;
  plan_active?: boolean;
}

interface UserAgent {
  agent_id: string;
  nickname: string;
}

interface UserPlan {
  plan_name: string;
  plan_active: boolean;
}

interface TrialData {
  id: string;
  user_id: string;
  trial_start: string;
  trial_end: string;
  trial_active: boolean;
  isActive?: boolean;
  hoursRemaining?: number;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agent, setAgent] = useState<UserAgent | null>(null);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [trial, setTrial] = useState<TrialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados completos do usuário do Supabase
  const fetchUserData = async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Buscando dados do usuário do Supabase...', { userId: user.id, forceRefresh });

      // 1. Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      }

      // 2. Buscar agente selecionado
      const { data: agentData, error: agentError } = await supabase
        .from('user_selected_agent')
        .select('agent_id, nickname')
        .eq('user_id', user.id)
        .single();

      if (agentError && agentError.code !== 'PGRST116') {
        console.error('Erro ao buscar agente:', agentError);
      }

      // 3. Buscar dados do trial
      const { data: trialData, error: trialError } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (trialError && trialError.code !== 'PGRST116') {
        console.error('Erro ao buscar trial:', trialError);
      }

      // Processar dados do perfil
      const userProfile: UserProfile = {
        id: user.id,
        full_name: profileData?.full_name || null,
        email: user.email || '',
        avatar_url: profileData?.avatar_url || null,
        plan_name: profileData?.plan_name || null,
        plan_active: profileData?.plan_active || false
      };

      // Processar dados do agente
      const userAgent: UserAgent | null = agentData ? {
        agent_id: agentData.agent_id,
        nickname: agentData.nickname
      } : null;

      // Processar dados do plano
      const userPlan: UserPlan = {
        plan_name: profileData?.plan_name || 'Nenhum plano',
        plan_active: profileData?.plan_active || false
      };

      // Processar dados do trial
      let userTrial: TrialData | null = null;
      if (trialData) {
        const now = new Date();
        const trialEnd = new Date(trialData.trial_end);
        const isActive = trialData.trial_active && trialEnd > now;
        const hoursRemaining = isActive ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;

        userTrial = {
          ...trialData,
          isActive,
          hoursRemaining
        };
      }

      // Atualizar estados
      setProfile(userProfile);
      setAgent(userAgent);
      setPlan(userPlan);
      setTrial(userTrial);

      // Salvar no cache do navegador
      saveToCache('profile', userProfile);
      if (userAgent) saveToCache('agent', userAgent);
      saveToCache('plan', userPlan);
      if (userTrial) saveToCache('trial', userTrial);

      console.log('✅ Dados do usuário atualizados com sucesso:', {
        profile: userProfile,
        agent: userAgent,
        plan: userPlan,
        trial: userTrial
      });

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      setError(error.message);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  // Função para salvar no cache
  const saveToCache = (type: 'profile' | 'agent' | 'plan' | 'trial', data: any) => {
    try {
      const cacheKey = `sweet-ai-user-${type}`;
      const dataWithTimestamp = {
        ...data,
        cached_at: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(dataWithTimestamp));
      console.log(`💾 ${type} salvo no cache:`, dataWithTimestamp);
    } catch (error) {
      console.error(`Erro ao salvar ${type} no cache:`, error);
    }
  };

  // Função para carregar do cache (apenas como fallback)
  const loadFromCache = () => {
    try {
      // Carregar perfil
      const cachedProfile = localStorage.getItem('sweet-ai-user-profile');
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        setProfile(profileData);
      }

      // Carregar agente
      const cachedAgent = localStorage.getItem('sweet-ai-user-agent');
      if (cachedAgent) {
        const agentData = JSON.parse(cachedAgent);
        setAgent(agentData);
      }

      // Carregar plano
      const cachedPlan = localStorage.getItem('sweet-ai-user-plan');
      if (cachedPlan) {
        const planData = JSON.parse(cachedPlan);
        setPlan(planData);
      }

      // Carregar trial
      const cachedTrial = localStorage.getItem('sweet-ai-user-trial');
      if (cachedTrial) {
        const trialData = JSON.parse(cachedTrial);
        setTrial(trialData);
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
  };

  // Função para atualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        toast.error('Erro ao atualizar perfil');
        return false;
      }

      // Recarregar dados após atualização
      await fetchUserData(true);
      toast.success('Perfil atualizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
      return false;
    }
  };

  // Função para atualizar avatar
  const updateAvatar = async (avatarUrl: string) => {
    return await updateProfile({ avatar_url: avatarUrl });
  };

  // Função para limpar cache
  const clearCache = () => {
    localStorage.removeItem('sweet-ai-user-profile');
    localStorage.removeItem('sweet-ai-user-agent');
    localStorage.removeItem('sweet-ai-user-plan');
    localStorage.removeItem('sweet-ai-user-trial');
    setProfile(null);
    setAgent(null);
    setPlan(null);
    setTrial(null);
    console.log('🗑️ Cache do usuário limpo');
  };

  // Carregar dados quando o usuário muda
  useEffect(() => {
    if (user?.id) {
      // Primeiro carrega do cache para exibição imediata
      loadFromCache();
      // Depois busca dados atualizados do Supabase
      fetchUserData(true);
    } else {
      clearCache();
    }
  }, [user?.id]);

  return {
    // Estados
    profile,
    agent,
    plan,
    trial,
    loading,
    error,

    // Funções
    fetchUserData,
    updateProfile,
    updateAvatar,
    clearCache,

    // Helpers
    getFullName: () => profile?.full_name || 'Usuário',
    getAvatarUrl: () => profile?.avatar_url || null,
    getPlanName: () => plan?.plan_name || 'Nenhum plano',
    hasPlanActive: () => plan?.plan_active || false,
    isTrialActive: () => trial?.isActive || false,
    getTrialHoursRemaining: () => trial?.hoursRemaining || 0
  };
};