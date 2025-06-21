
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
      console.log('=== ENVIANDO ÁUDIO PARA N8N ===');
      console.log('URL do webhook:', audioWebhookUrl);
      
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
      
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status}`);
      }
      
      let responseText = '';
      let audioUrl: string | undefined;
      
      // Verificar se a resposta é áudio MP3 direto
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('audio/mpeg')) {
        console.log('Resposta é áudio MP3 direto');
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        responseText = 'Resposta em áudio da ISA';
      } else {
        // Tentar processar como JSON
        try {
          const responseData = await response.json();
          console.log('Resposta JSON:', responseData);
          
          // Se é array do n8n
          if (Array.isArray(responseData) && responseData.length > 0) {
            const firstItem = responseData[0];
            
            // Verificar se tem dados binários de áudio
            if (firstItem.binary && firstItem.binary.data) {
              console.log('Áudio MP3 encontrado nos dados binários');
              const binaryData = firstItem.binary.data;
              
              // Se é string base64, converter para Blob
              if (typeof binaryData === 'string') {
                const byteCharacters = atob(binaryData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
              } else if (binaryData instanceof ArrayBuffer || Array.isArray(binaryData)) {
                const uint8Array = new Uint8Array(binaryData);
                const audioBlob = new Blob([uint8Array], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
              }
              
              responseText = firstItem.output || firstItem.text || 'Resposta em áudio da ISA';
            } else {
              responseText = firstItem.output || firstItem.message || firstItem.text || 'Resposta processada';
            }
          } else if (responseData && typeof responseData === 'object') {
            responseText = responseData.output || responseData.message || responseData.text || 'Resposta processada';
            
            if (responseData.binary && responseData.binary.data) {
              const binaryData = responseData.binary.data;
              if (typeof binaryData === 'string') {
                const byteCharacters = atob(binaryData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
              }
            }
          }
        } catch (jsonError) {
          console.log('Não é JSON, tratando como texto');
          responseText = await response.text();
        }
      }
      
      console.log('Texto final:', responseText);
      console.log('URL de áudio:', audioUrl ? 'Criada' : 'Não criada');
      
      return {
        text: responseText,
        audioUrl
      };
      
    } catch (error: any) {
      console.error('Erro no envio de áudio:', error);
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
