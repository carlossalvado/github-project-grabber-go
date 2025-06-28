
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TrialData {
  id: string;
  user_id: string;
  trial_start: string;
  trial_end: string;
  trial_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTrialManager = () => {
  const { user } = useAuth();
  const [trialData, setTrialData] = useState<TrialData | null>(null);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do trial
  const fetchTrialData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_trials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar trial:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setTrialData(data);
        
        // Verificar se o trial ainda está ativo
        const now = new Date();
        const trialEnd = new Date(data.trial_end);
        const isActive = data.trial_active && trialEnd > now;
        
        setIsTrialActive(isActive);
        
        // Calcular horas restantes
        if (isActive) {
          const diffMs = trialEnd.getTime() - now.getTime();
          const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
          setHoursRemaining(diffHours);
        } else {
          setHoursRemaining(0);
        }

        // VERIFICAR SE USUÁRIO TEM PLANO ATIVO - SE SIM, NÃO SALVAR TRIAL NO CACHE
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan_active')
          .eq('id', user.id)
          .single();

        if (profileData?.plan_active) {
          console.log('🚫 Usuário tem plano ativo - não salvando trial no cache');
          // REMOVER TRIAL DO CACHE SE EXISTIR
          localStorage.removeItem('sweet-ai-trial-data');
          setIsTrialActive(false);
          setHoursRemaining(0);
        } else if (isActive) {
          // Salvar apenas se não tiver plano ativo
          localStorage.setItem('sweet-ai-trial-data', JSON.stringify({
            ...data,
            isActive,
            hoursRemaining: diffHours,
            cached_at: Date.now()
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do trial:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para iniciar um trial
  const startTrial = async () => {
    if (!user?.id) return false;

    try {
      // Chamar a função do Supabase para iniciar o trial
      const { data, error } = await supabase.rpc('start_trial', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Erro ao iniciar trial:', error);
        return false;
      }

      // Atualizar dados locais
      await fetchTrialData();
      return true;
    } catch (error) {
      console.error('Erro ao iniciar trial:', error);
      return false;
    }
  };

  // Função para desativar o trial
  const deactivateTrial = async () => {
    if (!user?.id || !trialData) return false;

    try {
      const { error } = await supabase
        .from('user_trials')
        .update({ trial_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao desativar trial:', error);
        return false;
      }

      setIsTrialActive(false);
      setHoursRemaining(0);
      
      // REMOVER COMPLETAMENTE DO CACHE
      localStorage.removeItem('sweet-ai-trial-data');
      console.log('🗑️ Trial desativado e removido do cache');

      return true;
    } catch (error) {
      console.error('Erro ao desativar trial:', error);
      return false;
    }
  };

  // Carregar dados do cache inicialmente
  useEffect(() => {
    const cachedData = localStorage.getItem('sweet-ai-trial-data');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Verificar se o cache não está muito antigo (máximo 5 minutos)
        const cacheAge = Date.now() - (parsed.cached_at || 0);
        if (cacheAge < 5 * 60 * 1000) { // 5 minutos
          setTrialData(parsed);
          setIsTrialActive(parsed.isActive || false);
          setHoursRemaining(parsed.hoursRemaining || 0);
        }
      } catch (error) {
        console.error('Erro ao carregar cache do trial:', error);
      }
    }
  }, []);

  // Buscar dados do Supabase quando usuário muda
  useEffect(() => {
    if (user?.id) {
      fetchTrialData();
    } else {
      setTrialData(null);
      setIsTrialActive(false);
      setHoursRemaining(0);
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar horas restantes a cada minuto
  useEffect(() => {
    if (!isTrialActive || !trialData) return;

    const interval = setInterval(() => {
      const now = new Date();
      const trialEnd = new Date(trialData.trial_end);
      
      if (trialEnd <= now) {
        setIsTrialActive(false);
        setHoursRemaining(0);
        deactivateTrial();
      } else {
        const diffMs = trialEnd.getTime() - now.getTime();
        const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
        setHoursRemaining(diffHours);
      }
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [isTrialActive, trialData]);

  return {
    trialData,
    isTrialActive,
    hoursRemaining,
    loading,
    startTrial,
    deactivateTrial,
    fetchTrialData
  };
};
