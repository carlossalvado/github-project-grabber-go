
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePollyAudioReturn {
  isProcessing: boolean;
  generateSpeech: (text: string) => Promise<string | null>;
}

export const usePollyAudio = (): UsePollyAudioReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const generateSpeech = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim()) return null;
    
    try {
      setIsProcessing(true);
      console.log('🗣️ [POLLY] Gerando áudio para:', text);

      const { data, error } = await supabase.functions.invoke('polly-synthesize', {
        body: { text: text.trim() }
      });

      if (error) {
        console.error('❌ [POLLY] Erro da função:', error);
        // Fallback: retornar null sem quebrar o fluxo
        console.log('⚠️ [POLLY] Usando fallback - mensagem sem áudio');
        return null;
      }

      if (data?.error) {
        console.error('❌ [POLLY] Erro no response:', data.error);
        console.log('⚠️ [POLLY] Usando fallback - mensagem sem áudio');
        return null;
      }

      if (data?.audioData) {
        console.log('✅ [POLLY] Áudio gerado com sucesso');
        return data.audioData;
      }

      console.log('⚠️ [POLLY] Nenhum audioData retornado');
      return null;
    } catch (error: any) {
      console.error('❌ [POLLY] Erro na geração:', error);
      console.log('⚠️ [POLLY] Usando fallback - mensagem sem áudio');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    generateSpeech
  };
};
