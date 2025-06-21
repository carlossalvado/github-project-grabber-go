
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
      console.log('Tamanho do blob de áudio:', audioBlob.size, 'bytes');
      console.log('Tipo do blob:', audioBlob.type);
      
      // Converter blob para base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64data = result.split(',')[1];
          console.log('Base64 convertido, tamanho:', base64data.length, 'caracteres');
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
      
      console.log('Fazendo requisição para o webhook...');
      
      // Tentar primeiro com expectativa de receber o áudio diretamente
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg, application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type da resposta:', contentType);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro na resposta: ${response.status}`);
      }
      
      // Se recebemos áudio diretamente
      if (contentType && contentType.includes('audio/mpeg')) {
        console.log('✅ Resposta é áudio MP3 direto');
        const audioBlob = await response.blob();
        console.log('Blob de áudio criado, tamanho:', audioBlob.size, 'bytes');
        
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('URL de áudio criada:', audioUrl);
          
          return {
            text: 'Áudio da Isa',
            audioUrl
          };
        }
      }
      
      // Se recebemos JSON, processar os headers
      console.log('Resposta não é áudio, processando como JSON...');
      const responseData = await response.json();
      console.log('Resposta JSON completa:', responseData);
      
      // O N8N está retornando headers HTTP, vamos tentar extrair informações úteis
      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        console.log('Primeiro item da resposta:', firstItem);
        
        // Verificar se temos um request-id para tentar obter o áudio
        const requestId = firstItem['request-id'];
        const historyItemId = firstItem['history-item-id'];
        
        if (requestId || historyItemId) {
          console.log('Tentando usar request-id/history-item-id para obter áudio...');
          
          // Tentar diferentes URLs possíveis para obter o áudio
          const possibleUrls = [
            `${audioWebhookUrl}/${requestId}`,
            `${audioWebhookUrl}?request-id=${requestId}`,
            `${audioWebhookUrl}?history-item-id=${historyItemId}`,
            audioWebhookUrl // Tentar novamente o URL original
          ].filter(Boolean);
          
          for (const url of possibleUrls) {
            try {
              console.log('Tentando URL:', url);
              const audioResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'Accept': 'audio/mpeg, audio/*, */*'
                }
              });
              
              console.log('Resposta da tentativa - Status:', audioResponse.status);
              console.log('Resposta da tentativa - Content-Type:', audioResponse.headers.get('content-type'));
              
              if (audioResponse.ok && audioResponse.headers.get('content-type')?.includes('audio/')) {
                const audioBlob = await audioResponse.blob();
                console.log('✅ Áudio obtido, tamanho:', audioBlob.size, 'bytes');
                
                if (audioBlob.size > 0) {
                  const audioUrl = URL.createObjectURL(audioBlob);
                  console.log('URL de áudio criada:', audioUrl);
                  
                  return {
                    text: 'Áudio da Isa',
                    audioUrl
                  };
                }
              }
            } catch (error) {
              console.log('Erro ao tentar URL:', url, error);
              continue;
            }
          }
        }
        
        // Se temos informações sobre caracteres processados, assumir que houve processamento
        const characterCost = firstItem['character-cost'];
        if (characterCost && parseInt(characterCost) > 0) {
          console.log('Processamento detectado (character-cost:', characterCost, '), mas sem áudio disponível');
          return {
            text: 'Áudio processado com sucesso, mas não foi possível obter o arquivo de áudio.',
            audioUrl: undefined
          };
        }
      }
      
      console.log('❌ Não foi possível obter áudio válido de nenhuma forma');
      return {
        text: 'Resposta processada (formato de webhook não suportado para áudio)',
        audioUrl: undefined
      };
      
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO DE ÁUDIO ===');
      console.error('Erro:', error);
      console.error('=====================================');
      
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
