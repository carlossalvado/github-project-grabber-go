
import { useState } from 'react';
import { toast } from 'sonner';

interface N8nAudioResponse {
  message?: string;
  text?: string;
  response?: string;
  output?: string;
  audioUrl?: string;
  error?: string;
  // Para lidar com a resposta do ElevenLabs
  binary?: {
    data: any;
    mimeType?: string;
  };
  data?: any;
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
      
      // A resposta do n8n agora vem como um Blob (áudio MP3)
      const contentType = response.headers.get('content-type');
      console.log('Content-Type da resposta:', contentType);
      
      let responseText = '';
      let audioUrl: string | undefined;
      
      if (contentType && contentType.includes('audio/mpeg')) {
        // A resposta é diretamente o áudio MP3 do ElevenLabs
        console.log('Resposta é áudio MP3 direto do ElevenLabs');
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        responseText = 'Resposta processada com áudio';
      } else {
        // Tentar processar como JSON
        try {
          const responseData = await response.json();
          console.log('Resposta JSON completa do n8n (áudio):', JSON.stringify(responseData, null, 2));
          
          // Verificar se a resposta é um array (saída do n8n)
          if (Array.isArray(responseData) && responseData.length > 0) {
            const firstItem = responseData[0];
            
            // Verificar se tem dados binários do ElevenLabs (MP3)
            if (firstItem.binary && firstItem.binary.data) {
              console.log('Resposta contém áudio MP3 do ElevenLabs em JSON');
              
              // Converter dados binários para URL de áudio
              const audioData = firstItem.binary.data;
              const audioBlob = new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' });
              audioUrl = URL.createObjectURL(audioBlob);
              
              // O texto vem do output do AI Agent
              responseText = firstItem.output || firstItem.text || 'Resposta processada com áudio';
            } else if (firstItem.hasOwnProperty('content-type') || firstItem.hasOwnProperty('server')) {
              console.warn('Resposta parece ser headers HTTP, não conteúdo processado');
              responseText = 'Áudio recebido, mas houve um problema no processamento. Tente novamente.';
            } else {
              // Processar resposta normal sem áudio
              responseText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || 'Áudio processado com sucesso';
              
              // Verificar se tem URL de áudio diretamente
              if (firstItem.audioUrl) {
                audioUrl = firstItem.audioUrl;
              }
            }
          } else if (responseData && typeof responseData === 'object') {
            // Verificar se são headers HTTP
            if (responseData.hasOwnProperty('content-type') || responseData.hasOwnProperty('server')) {
              console.warn('Resposta parece ser headers HTTP, não conteúdo processado');
              responseText = 'Áudio recebido, mas houve um problema no processamento. Tente novamente.';
            } else {
              responseText = responseData.output || responseData.message || responseData.text || responseData.response || 'Áudio processado com sucesso';
              
              // Verificar se tem dados binários
              if (responseData.binary && responseData.binary.data) {
                const audioData = responseData.binary.data;
                const audioBlob = new Blob([new Uint8Array(audioData)], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
              } else if (responseData.audioUrl) {
                audioUrl = responseData.audioUrl;
              }
            }
          } else if (typeof responseData === 'string') {
            responseText = responseData;
          } else {
            responseText = 'Áudio processado com sucesso';
          }
        } catch (jsonError) {
          console.log('Resposta não é JSON, tentando como texto');
          const textResponse = await response.text();
          responseText = textResponse || 'Áudio processado com sucesso';
        }
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
