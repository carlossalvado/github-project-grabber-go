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
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_audio_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar créditos (pode ser normal se for a 1ª vez):', error.message);
        // Se o erro for "PGRST116", significa que o usuário não tem um registro de créditos.
        if (error.code === 'PGRST116') {
          console.log('Nenhum registro encontrado. Criando créditos iniciais para o usuário.');
          const { data: newRecord, error: insertError } = await supabase
            .from('user_audio_credits')
            .insert({ user_id: user.id, credits: 10 }) // Dando 10 créditos iniciais como exemplo
            .select('credits')
            .single();

          if (insertError) {
            console.error('Erro ao criar créditos iniciais:', insertError);
            setCredits(0);
          } else {
            setCredits(newRecord.credits);
          }
        } else {
          // Para outros erros, zera os créditos por segurança.
          setCredits(0);
        }
      } else {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Erro crítico ao buscar créditos:', error);
      setCredits(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Consumir crédito
  const consumeCredit = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Chama a função RPC no Supabase para consumir o crédito de forma atômica
      const { data, error } = await supabase.rpc('consume_audio_credit', {
        user_uuid: user.id
      });

      if (error) {
        console.error('Erro na RPC ao consumir crédito:', error);
        toast.error('Não foi possível usar seu crédito. Tente novamente.');
        return false;
      }

      // A RPC deve retornar 'true' em caso de sucesso e 'false' em caso de falha (ex: créditos insuficientes)
      if (data) {
        console.log('Crédito consumido com sucesso. Atualizando estado local.');
        // Atualização otimista do estado para refletir a mudança na UI imediatamente
        setCredits(prev => Math.max(0, prev - 1));
        return true;
      } else {
        toast.error('Créditos insuficientes para enviar áudio');
        // Força a atualização para garantir que a UI mostre o valor correto (0)
        await fetchCredits();
        return false;
      }
    } catch (error) {
      console.error('Erro crítico ao consumir crédito:', error);
      toast.error('Ocorreu um erro inesperado ao usar seu crédito.');
      return false;
    }
  };

  // Variável derivada do estado 'credits'. Sempre será recalculada quando 'credits' mudar.
  const hasCredits = credits > 0;

  // Efeito para buscar os créditos quando o usuário for identificado
  useEffect(() => {
    fetchCredits();
  }, [user?.id]);

  // --- PONTO DE DIAGNÓSTICO ---
  // Este log mostrará os valores do hook toda vez que o componente que o utiliza for renderizado.
  console.log('[useAudioCredits Hook] Estado atual:', { credits, hasCredits, isLoading });

  return {
    credits,
    isLoading,
    hasCredits,
    consumeCredit,
    refreshCredits: fetchCredits
  };
};