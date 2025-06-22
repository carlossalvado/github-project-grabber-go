
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAudioCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar créditos do usuário
  const fetchCredits = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_audio_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar créditos:', error);
        // Se não encontrar, criar registro inicial
        if (error.code === 'PGRST116') {
          const { data: newRecord, error: insertError } = await supabase
            .from('user_audio_credits')
            .insert({ user_id: user.id, credits: 10 })
            .select('credits')
            .single();
          
          if (insertError) {
            console.error('Erro ao criar créditos iniciais:', insertError);
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
      console.error('Erro ao buscar créditos:', error);
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Consumir crédito
  const consumeCredit = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('consume_audio_credit', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Erro ao consumir crédito:', error);
        toast.error('Erro ao consumir crédito');
        return false;
      }

      if (data) {
        setCredits(prev => Math.max(0, prev - 1));
        return true;
      } else {
        toast.error('Créditos insuficientes para enviar áudio');
        return false;
      }
    } catch (error) {
      console.error('Erro ao consumir crédito:', error);
      toast.error('Erro ao consumir crédito');
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
