import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  plan_name: string | null;
  start_date: string;
  end_date: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionManager = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados da subscription
  const fetchSubscriptionData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Buscar subscription ativa do usuário para o plano "Text & Audio"
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_name', 'Text & Audio')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = sem linhas retornadas
        console.error('Erro ao buscar subscription:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setSubscriptionData({
          ...data,
          trial_ends_at: null
        } as SubscriptionData);
        
        // Verificar se a subscription ainda está ativa
        const now = new Date();
        const endDate = new Date(data.end_date || data.start_date);
        // Adicionar 30 dias à data de início se não houver end_date
        if (!data.end_date) {
          endDate.setDate(endDate.getDate() + 30);
        }
        
        const isActive = endDate > now;
        setIsSubscriptionActive(isActive);
        
        // Calcular tempo restante em dias, horas, minutos e segundos
        if (isActive) {
          const diffMs = endDate.getTime() - now.getTime();
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          
          setDaysRemaining(Math.max(0, days));
          setHoursRemaining(Math.max(0, hours));
          setMinutesRemaining(Math.max(0, minutes));
          setSecondsRemaining(Math.max(0, seconds));
        } else {
          setDaysRemaining(0);
          setHoursRemaining(0);
          setMinutesRemaining(0);
          setSecondsRemaining(0);
        }
      } else {
        // Não há subscription ativa
        setIsSubscriptionActive(false);
        setDaysRemaining(0);
        setHoursRemaining(0);
        setMinutesRemaining(0);
        setSecondsRemaining(0);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar uma nova subscription
  const createSubscription = async () => {
    if (!user?.id) return false;

    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias a partir de agora

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_id: '2',
          status: 'active',
          plan_name: 'Text & Audio',
          start_date: now.toISOString(),
          end_date: endDate.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar subscription:', error);
        return false;
      }

      // Atualizar dados locais
      await fetchSubscriptionData();
      return true;
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      return false;
    }
  };

  // Função para desativar a subscription
  const deactivateSubscription = async () => {
    if (!user?.id || !subscriptionData) return false;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscriptionData.id);

      if (error) {
        console.error('Erro ao desativar subscription:', error);
        return false;
      }

      setIsSubscriptionActive(false);
      setDaysRemaining(0);
      setHoursRemaining(0);
      setMinutesRemaining(0);
      setSecondsRemaining(0);

      console.log('🗑️ Subscription desativada');
      return true;
    } catch (error) {
      console.error('Erro ao desativar subscription:', error);
      return false;
    }
  };
  
  // Buscar dados do Supabase quando o usuário muda
  useEffect(() => {
    if (user?.id) {
      fetchSubscriptionData();
    } else {
      setSubscriptionData(null);
      setIsSubscriptionActive(false);
      setDaysRemaining(0);
      setHoursRemaining(0);
      setMinutesRemaining(0);
      setSecondsRemaining(0);
      setLoading(false);
    }
  }, [user?.id]);

  // Atualizar tempo restante a cada segundo
  useEffect(() => {
    if (!isSubscriptionActive || !subscriptionData) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endDate = new Date(subscriptionData.end_date || subscriptionData.start_date);
      if (!subscriptionData.end_date) {
        endDate.setDate(endDate.getDate() + 30);
      }
      
      if (endDate <= now) {
        setIsSubscriptionActive(false);
        setDaysRemaining(0);
        setHoursRemaining(0);
        setMinutesRemaining(0);
        setSecondsRemaining(0);
        deactivateSubscription();
      } else {
        const diffMs = endDate.getTime() - now.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        setDaysRemaining(Math.max(0, days));
        setHoursRemaining(Math.max(0, hours));
        setMinutesRemaining(Math.max(0, minutes));
        setSecondsRemaining(Math.max(0, seconds));
      }
    }, 1000); // Atualizar a cada segundo

    return () => clearInterval(interval);
  }, [isSubscriptionActive, subscriptionData]);

  return {
    subscriptionData,
    isSubscriptionActive,
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    loading,
    createSubscription,
    deactivateSubscription,
    fetchSubscriptionData
  };
};