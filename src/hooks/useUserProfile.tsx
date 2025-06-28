import { useState, useEffect, useCallback } from 'react';

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



  const saveToCache = useCallback((type: 'profile' | 'agent' | 'plan' | 'trial', data: any) => {

    try {

      const cacheKey = `sweet-ai-user-${type}`;

      const dataWithTimestamp = {

        ...data,

        cached_at: Date.now()

      };

      localStorage.setItem(cacheKey, JSON.stringify(dataWithTimestamp));

    } catch (error) {

      console.error(`Erro ao salvar ${type} no cache:`, error);

    }

  }, []);



  const fetchUserData = useCallback(async (forceRefresh = false) => {

    if (!user?.id) {

      setLoading(false);

      return;

    }



    try {

      setLoading(true);

      setError(null);



      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (profileError && profileError.code !== 'PGRST116') throw new Error(`Erro ao buscar perfil: ${profileError.message}`);



      const { data: agentData, error: agentError } = await supabase.from('user_selected_agent').select('agent_id, nickname').eq('user_id', user.id).single();

      if (agentError && agentError.code !== 'PGRST116') console.error('Erro ao buscar agente:', agentError);



      const { data: trialData, error: trialError } = await supabase.from('user_trials').select('*').eq('user_id', user.id).single();

      if (trialError && trialError.code !== 'PGRST116') console.error('Erro ao buscar trial:', trialError);



      const userProfile: UserProfile = { id: user.id, full_name: profileData?.full_name || null, email: user.email || '', avatar_url: profileData?.avatar_url || null, plan_name: profileData?.plan_name || null, plan_active: profileData?.plan_active || false };

      const userAgent: UserAgent | null = agentData ? { agent_id: agentData.agent_id, nickname: agentData.nickname } : null;

      const userPlan: UserPlan = { plan_name: profileData?.plan_name || 'Nenhum plano', plan_active: profileData?.plan_active || false };

      

      let userTrial: TrialData | null = null;

      if (trialData) {

        const now = new Date();

        const trialEnd = new Date(trialData.trial_end);

        const isActive = trialData.trial_active && trialEnd > now;

        const hoursRemaining = isActive ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0;

        userTrial = { ...trialData, isActive, hoursRemaining };

      }



      setProfile(userProfile);

      setAgent(userAgent);

      setPlan(userPlan);

      setTrial(userTrial);



      saveToCache('profile', userProfile);

      if (userAgent) saveToCache('agent', userAgent);

      saveToCache('plan', userPlan);

      if (userTrial) saveToCache('trial', userTrial);



    } catch (error: any) {

      console.error('Erro ao buscar dados do usuário:', error);

      setError(error.message);

      toast.error('Erro ao carregar dados do perfil');

    } finally {

      setLoading(false);

    }

  }, [user?.id, saveToCache]);



  const loadFromCache = useCallback(() => {

    try {

      const cachedProfile = localStorage.getItem('sweet-ai-user-profile');

      if (cachedProfile) setProfile(JSON.parse(cachedProfile));

      const cachedAgent = localStorage.getItem('sweet-ai-user-agent');

      if (cachedAgent) setAgent(JSON.parse(cachedAgent));

      const cachedPlan = localStorage.getItem('sweet-ai-user-plan');

      if (cachedPlan) setPlan(JSON.parse(cachedPlan));

      const cachedTrial = localStorage.getItem('sweet-ai-user-trial');

      if (cachedTrial) setTrial(JSON.parse(cachedTrial));

    } catch (error) {

      console.error('Erro ao carregar cache:', error);

    }

  }, []);



  const clearCache = useCallback(() => {

    localStorage.removeItem('sweet-ai-user-profile');

    localStorage.removeItem('sweet-ai-user-agent');

    localStorage.removeItem('sweet-ai-user-plan');

    localStorage.removeItem('sweet-ai-user-trial');

    setProfile(null);

    setAgent(null);

    setPlan(null);

    setTrial(null);

  }, []);



  useEffect(() => {

    if (user?.id) {

      loadFromCache();

      fetchUserData(true);

    } else {

      clearCache();

    }

  }, [user?.id, fetchUserData, loadFromCache, clearCache]);



  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {

    if (!user?.id) return false;

    try {

      const { error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id);

      if (error) throw error;

      

      await fetchUserData(true);

      toast.success('Perfil atualizado com sucesso!');

      return true;

    } catch (error: any) {

      console.error('Erro ao atualizar perfil:', error);

      toast.error('Erro ao atualizar perfil');

      return false;

    }

  }, [user?.id, fetchUserData]);



  const updateAvatar = useCallback(async (avatarUrl: string) => {

    return await updateProfile({ avatar_url: avatarUrl });

  }, [updateProfile]);



  const hasPlanActive = useCallback(() => plan?.plan_active || false, [plan]);

  const isTrialCurrentlyActive = useCallback(() => trial?.isActive || false, [trial]);



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

    hasPlanActive: hasPlanActive,

    

    isTrialActive: isTrialCurrentlyActive,

    

    getTrialHoursRemaining: () => trial?.hoursRemaining || 0

  };

};