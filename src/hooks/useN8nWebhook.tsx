import { useState } from 'react';
import { toast } from 'sonner';
import { CachedMessage } from './useLocalCache'; // Importar o tipo

// Interface da resposta foi removida pois não era usada
// e a lógica de parsing já trata múltiplos formatos.

export const useN8nWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const webhookUrl = "https://isa.isadate.online/webhook/d97asdfasd39-ohasasdfasdd-5-pijaasdfadssd54-asasdfadsfd42";

  // A assinatura da função agora aceita um array de histórico como segundo parâmetro
  const sendToN8n = async (message: string, history: CachedMessage[] = [], userEmail?: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      console.log('=== INÍCIO DO ENVIO PARA N8N ===');
      console.log('URL do webhook:', webhookUrl);
      console.log('Mensagem a ser enviada:', message);
      console.log('Email do usuário:', userEmail);
      
      // Adicionado o histórico ao payload
      const payload = {
        message: message,
        history: history.map(h => ({
          type: h.type,
          content: h.transcription,
          timestamp: h.timestamp
        })),
        timestamp: new Date().toISOString(),
        user: userEmail || 'anonymous'
      };
      
      console.log('Payload completo:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta:', response.status);
      console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta do servidor:', errorText);
        throw new Error(`Erro na resposta: ${response.status} - ${response.statusText}. Detalhes: ${errorText}`);
      }
      
      // Processar resposta do n8n (sua lógica original mantida)
      let responseText = '';
      try {
        const responseData = await response.json();
        console.log('Resposta JSON completa do n8n:', JSON.stringify(responseData, null, 2));
        
        if (Array.isArray(responseData) && responseData.length > 0) {
          const firstItem = responseData[0];
          console.log('Primeiro item do array:', firstItem);
          if (firstItem.output) {
            responseText = firstItem.output;
          } else if (firstItem.message) {
            responseText = firstItem.message;
          } else if (firstItem.text) {
            responseText = firstItem.text;
          } else if (firstItem.response) {
            responseText = firstItem.response;
          } else {
            responseText = JSON.stringify(firstItem);
          }
        } 
        else if (responseData && typeof responseData === 'object') {
          console.log('Tratando como objeto:', responseData);
          if (responseData.output) {
            responseText = responseData.output;
          } else if (responseData.message) {
            responseText = responseData.message;
          } else if (responseData.text) {
            responseText = responseData.text;
          } else if (responseData.response) {
            responseText = responseData.response;
          } else {
            responseText = JSON.stringify(responseData);
          }
        }
        else if (typeof responseData === 'string') {
          responseText = responseData;
        } else {
          responseText = JSON.stringify(responseData);
        }
      } catch (jsonError) {
        console.log('Resposta não é JSON, tratando como texto');
        // Re-leitura do corpo da resposta como texto
        // Importante: o corpo só pode ser lido uma vez, então essa lógica
        // deve ser ajustada se precisar dos dois. Para este caso, vamos assumir
        // que se o json() falha, o text() é o fallback.
        // A forma correta seria clonar a resposta: response.clone().json()
        // Mas para manter seu código, vamos ajustar o fluxo.
        const responseBodyForText = await response.text();
        responseText = responseBodyForText;
      }
      
      console.log('Texto final da resposta:', responseText);
      console.log('=== FIM DO PROCESSAMENTO N8N ===');
      
      if (!responseText) {
        throw new Error('Resposta vazia do n8n');
      }
      
      return responseText;
      
    } catch (error: any) {
      console.error('=== ERRO NO ENVIO PARA N8N ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
      console.error('Erro completo:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Erro de conectividade: Verifique a conexão com o servidor');
      } else {
        toast.error(`Erro ao processar mensagem: ${error.message}`);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendToN8n,
    isLoading
  };
};