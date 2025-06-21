
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
        responseText = 'Áudio da Isa';
      } else {
        // Processar como JSON
        const responseData = await response.json();
        console.log('Resposta JSON completa:', responseData);
        
        // Se é array do n8n (como mostrado no log)
        if (Array.isArray(responseData) && responseData.length > 0) {
          const firstItem = responseData[0];
          console.log('Primeiro item do array:', firstItem);
          
          // O n8n está retornando headers HTTP como se fosse dados
          // Vamos tentar fazer uma nova requisição para obter o áudio real
          if (firstItem['content-type'] === 'audio/mpeg') {
            console.log('Detectado content-type audio/mpeg, fazendo nova requisição...');
            
            try {
              // Fazer uma nova requisição esperando áudio direto
              const audioResponse = await fetch(audioWebhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'audio/mpeg'
                },
                body: JSON.stringify(payload)
              });
              
              if (audioResponse.ok && audioResponse.headers.get('content-type')?.includes('audio')) {
                const audioBlob = await audioResponse.blob();
                audioUrl = URL.createObjectURL(audioBlob);
                responseText = 'Áudio da Isa';
                console.log('Áudio obtido com sucesso na segunda requisição');
              } else {
                responseText = 'Resposta de áudio recebida';
              }
            } catch (audioError) {
              console.error('Erro ao obter áudio na segunda tentativa:', audioError);
              responseText = 'Resposta de áudio (erro no carregamento)';
            }
          } else {
            // Tentar extrair texto da resposta
            responseText = firstItem.output || firstItem.text || firstItem.message || 'Resposta da Isa';
          }
        } else if (responseData && typeof responseData === 'object') {
          responseText = responseData.output || responseData.message || responseData.text || 'Resposta da Isa';
        } else {
          responseText = 'Resposta da Isa';
        }
      }
      
      console.log('Texto final:', responseText);
      console.log('URL de áudio:', audioUrl ? 'Criada com sucesso' : 'Não criada');
      
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
