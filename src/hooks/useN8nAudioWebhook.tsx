
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
      
      // Verificar o content-type da resposta
      const contentType = response.headers.get('content-type');
      console.log('Content-Type da resposta:', contentType);
      
      let responseText = '';
      let audioUrl: string | undefined;
      
      // Se a resposta é áudio MP3 direto do ElevenLabs
      if (contentType && contentType.includes('audio/mpeg')) {
        console.log('Resposta é áudio MP3 direto do ElevenLabs');
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        responseText = 'Resposta em áudio da ISA';
      } else {
        // Tentar processar como JSON primeiro
        try {
          const responseData = await response.json();
          console.log('Resposta JSON completa do n8n (áudio):', JSON.stringify(responseData, null, 2));
          
          // Verificar se é um array (formato típico do n8n)
          if (Array.isArray(responseData) && responseData.length > 0) {
            const firstItem = responseData[0];
            
            // Verificar se contém dados de áudio MP3
            if (firstItem.binary && firstItem.binary.data) {
              console.log('Áudio MP3 encontrado nos dados binários');
              
              // Converter dados binários para Blob e criar URL
              const audioData = firstItem.binary.data;
              const uint8Array = new Uint8Array(audioData);
              const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
              audioUrl = URL.createObjectURL(audioBlob);
              
              // Extrair texto da resposta do AI Agent
              responseText = firstItem.output || firstItem.text || 'Resposta em áudio da ISA';
            } else {
              // Processar resposta sem áudio
              responseText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || 'Resposta processada';
              
              if (firstItem.audioUrl) {
                audioUrl = firstItem.audioUrl;
              }
            }
          } else if (responseData && typeof responseData === 'object') {
            responseText = responseData.output || responseData.message || responseData.text || responseData.response || 'Resposta processada';
            
            if (responseData.binary && responseData.binary.data) {
              const audioData = responseData.binary.data;
              const uint8Array = new Uint8Array(audioData);
              const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
              audioUrl = URL.createObjectURL(audioBlob);
            } else if (responseData.audioUrl) {
              audioUrl = responseData.audioUrl;
            }
          } else if (typeof responseData === 'string') {
            responseText = responseData;
          }
        } catch (jsonError) {
          console.log('Resposta não é JSON, tentando como texto');
          const textResponse = await response.text();
          responseText = textResponse || 'Áudio processado com sucesso';
        }
      }
      
      console.log('Texto final da resposta de áudio:', responseText);
      console.log('URL de áudio criada:', audioUrl ? 'Sim' : 'Não');
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
