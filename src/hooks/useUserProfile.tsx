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

  const saveToCache = useCallback(/* ... seu código de cache ... */);

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

  const loadFromCache = useCallback(/* ... seu código de cache ... */);
  const clearCache = useCallback(/* ... seu código de cache ... */);

  useEffect(() => {
    if (user?.id) {
      loadFromCache();
      fetchUserData(true);
    } else {
      clearCache();
    }
  }, [user?.id, fetchUserData, loadFromCache, clearCache]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    // ... seu código de updateProfile ...
  }, [user?.id, fetchUserData]);

  const updateAvatar = useCallback(async (avatarUrl: string) => {
    // ... seu código de updateAvatar ...
  }, [updateProfile]);

  // Helper para o plano PAGO (prioridade máxima)
  const hasActiveSubscription = useCallback(() => {
    return plan?.plan_active || false;
  }, [plan]);

  // Helper para o plano TRIAL (prioridade secundária)
  const isTrialActive = useCallback(() => {
    return trial?.isActive || false;
  }, [trial]);

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

    // Helpers para a lógica de acesso e UI
    getFullName: () => profile?.full_name || 'Usuário',
    getAvatarUrl: () => profile?.avatar_url || null,
    getPlanName: () => plan?.plan_name || 'Nenhum plano',
    getTrialHoursRemaining: () => trial?.hoursRemaining || 0,
    hasActiveSubscription: hasActiveSubscription,
    isTrialActive: isTrialActive,
  };
};