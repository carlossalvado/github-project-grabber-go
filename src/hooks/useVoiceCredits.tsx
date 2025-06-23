
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVoiceCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar créditos do usuário
  const fetchCredits = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_voice_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar créditos de voz:', error);
        // Se não encontrar, criar registro inicial
        if (error.code === 'PGRST116') {
          const { data: newRecord, error: insertError } = await supabase
            .from('user_voice_credits')
            .insert({ user_id: user.id, credits: 0 })
            .select('credits')
            .single();
          
          if (insertError) {
            console.error('Erro ao criar créditos de voz iniciais:', insertError);
            setCredits(0);
          } else {
            setCredits(newRecord.credits);
          }
        } else {
          setCredits(0);
        }
      } else {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos de voz:', error);
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Consumir crédito
  const consumeCredit = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('consume_voice_credit', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Erro ao consumir crédito de voz:', error);
        toast.error('Erro ao consumir crédito de voz');
        return false;
      }

      if (data) {
        setCredits(prev => Math.max(0, prev - 1));
        return true;
      } else {
        toast.error('Créditos insuficientes para chamada de voz');
        return false;
      }
    } catch (error) {
      console.error('Erro ao consumir crédito de voz:', error);
      toast.error('Erro ao consumir crédito de voz');
      return false;
    }
  };

  // Verificar se tem créditos
  const hasCredits = credits > 0;

  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  return {
    credits,
    isLoading,
    hasCredits,
    consumeCredit,
    refreshCredits: fetchCredits
  };
};
