import { useState } from 'react';
import { toast } from 'sonner';

interface N8nAudioResponse {
  message?: string;
  text?: string;
  response?: string;
  output?: string;
  audioUrl?: string;
  error?: string;
}

export const useN8nAudioWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const audioWebhookUrl = "https://isa.isadate.online/webhook/d97asdfasd43245639-ohasasdfasdd-5-pijaasdJHGFDfadssd54-asasdfadsfd42-fghjklç456";

  const sendAudioToN8n = async (audioBlob: Blob, userEmail?: string): Promise<{ text: string; audioUrl?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('=== INÍCIO DO ENVIO DE ÁUDIO PARA N8N ===');
      console.log('URL do webhook de áudio:', audioWebhookUrl);
      console.log('Email do usuário:', userEmail);
      
      // Converter blob para base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64data = result.split(',')[1];
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      const payload = {
        audioData: base64Audio,
        timestamp: new Date().toISOString(),
        user: userEmail || 'anonymous'
      };
      
      console.log('Payload de áudio preparado');
      
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta de áudio:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor de áudio:', errorText);
        throw new Error(`Erro na resposta de áudio: ${response.status} - ${response.statusText}`);
      }
      
      // Processar resposta do n8n
      let responseData: any;
      try {
        responseData = await response.json();
        console.log('Resposta JSON completa do n8n (áudio):', JSON.stringify(responseData, null, 2));
      } catch (jsonError) {
        const textResponse = await response.text();
        console.log('Resposta de áudio não é JSON:', textResponse);
        return { text: textResponse };
      }
      
      let responseText = '';
      let audioUrl: string | undefined;
      
      // Extrair texto da resposta
      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        responseText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || JSON.stringify(firstItem);
        audioUrl = firstItem.audioUrl;
      } else if (responseData && typeof responseData === 'object') {
        responseText = responseData.output || responseData.message || responseData.text || responseData.response || JSON.stringify(responseData);
        audioUrl = responseData.audioUrl;
      } else if (typeof responseData === 'string') {
        responseText = responseData;
      } else {
        responseText = JSON.stringify(responseData);
      }
      
      console.log('Texto final da resposta de áudio:', responseText);
      console.log('URL de áudio da resposta:', audioUrl);
      console.log('=== FIM DO PROCESSAMENTO N8N ÁUDIO ===');
      
      return {
        text: responseText || 'Resposta de áudio processada',
        audioUrl
      };
      
    } catch (error: any) {
      console.error('=== ERRO NO ENVIO DE ÁUDIO PARA N8N ===');
      console.error('Erro completo:', error);
      
      toast.error(`Erro ao processar áudio: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendAudioToN8n,
    isLoading
  };
};
