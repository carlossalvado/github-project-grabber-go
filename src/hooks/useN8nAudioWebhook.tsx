
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
      let responseText = '';
      let audioUrl: string | undefined;
      
      try {
        responseData = await response.json();
        console.log('Resposta JSON completa do n8n (áudio):', JSON.stringify(responseData, null, 2));
        
        // Verificar se a resposta são headers HTTP (indicativo de erro no n8n)
        if (Array.isArray(responseData) && responseData.length > 0) {
          const firstItem = responseData[0];
          
          // Se o primeiro item tem propriedades de header HTTP, significa que algo deu errado
          if (firstItem.hasOwnProperty('content-type') || firstItem.hasOwnProperty('server')) {
            console.warn('Resposta parece ser headers HTTP, não conteúdo processado');
            responseText = 'Áudio recebido, mas houve um problema no processamento. Tente novamente.';
          } else {
            // Processar resposta normal
            responseText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || 'Áudio processado com sucesso';
            audioUrl = firstItem.audioUrl;
          }
        } else if (responseData && typeof responseData === 'object') {
          // Verificar se são headers HTTP
          if (responseData.hasOwnProperty('content-type') || responseData.hasOwnProperty('server')) {
            console.warn('Resposta parece ser headers HTTP, não conteúdo processado');
            responseText = 'Áudio recebido, mas houve um problema no processamento. Tente novamente.';
          } else {
            responseText = responseData.output || responseData.message || responseData.text || responseData.response || 'Áudio processado com sucesso';
            audioUrl = responseData.audioUrl;
          }
        } else if (typeof responseData === 'string') {
          responseText = responseData;
        } else {
          responseText = 'Áudio processado com sucesso';
        }
      } catch (jsonError) {
        console.log('Resposta não é JSON, tratando como texto');
        const textResponse = await response.text();
        responseText = textResponse || 'Áudio processado com sucesso';
      }
      
      console.log('Texto final da resposta de áudio:', responseText);
      console.log('URL de áudio da resposta:', audioUrl);
      console.log('=== FIM DO PROCESSAMENTO N8N ÁUDIO ===');
      
      return {
        text: responseText,
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
