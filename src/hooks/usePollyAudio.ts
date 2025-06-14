
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
        console.error('❌ [POLLY] Erro:', error);
        toast.error('Erro ao gerar áudio');
        return null;
      }

      if (data?.audioData) {
        console.log('✅ [POLLY] Áudio gerado com sucesso');
        return data.audioData;
      }

      return null;
    } catch (error: any) {
      console.error('❌ [POLLY] Erro na geração:', error);
      toast.error('Erro ao processar síntese de voz');
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
