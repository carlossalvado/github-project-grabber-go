import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CachedMessage } from './useLocalCache';

interface AudioResponse {
  audioUrl: string;
  text: string;
}

export const useN8nAudioWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // ######################################################################
  // URL CORRETA INSERIDA AQUI, CONFORME VOCÊ ENVIOU.
  // ######################################################################
  const webhookUrl = "https://isa.isadate.online/webhook/d97asdfasd43245639-ohasasdfasdd-5-pijaasdJHGFDfadssd54-asasdfadsfd42-fghjklç456";

  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  const sendAudioToN8n = async (audioBlob: Blob, history: CachedMessage[] = []): Promise<AudioResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    if (!webhookUrl) {
      const errorMessage = 'ERRO CRÍTICO: A URL do webhook de áudio não foi configurada.';
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }

    try {
      const base64Audio = await toBase64(audioBlob);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          userEmail: user?.email,
          audioData: base64Audio,
          history: history.map(h => ({
            type: h.type,
            content: h.transcription,
            timestamp: h.timestamp
          }))
        }),
      });

      if (!response.ok) { 
        const errorText = await response.text();
        throw new Error(`Erro na resposta do Webhook: ${response.status} - ${response.statusText}. Corpo: ${errorText}`);
      }

      const audioResponseBlob = await response.blob();
      const transcription = response.headers.get("X-Transcription") || "";
      const audioUrl = URL.createObjectURL(audioResponseBlob);
      
      return { audioUrl, text: transcription };
    } catch (err: any) {
      console.error("Erro ao enviar áudio para o n8n:", err);
      setError(err.message || 'Um erro desconhecido ocorreu.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendAudioToN8n, isLoading, error };
};