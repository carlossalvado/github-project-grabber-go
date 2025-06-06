
import { useState } from 'react';
import { toast } from 'sonner';

interface N8nResponse {
  message?: string;
  text?: string;
  response?: string;
  error?: string;
}

export const useN8nWebhook = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const webhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook/d97asdfasd39-ohasasdfasdd-5-pijaasdfadssd54-asasdfadsfd42";

  const sendToN8n = async (message: string, userEmail?: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      console.log('Enviando mensagem para n8n:', message);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          user: userEmail || 'anonymous'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status} - ${response.statusText}`);
      }
      
      // Processar resposta do n8n
      let responseText = '';
      try {
        const responseData: N8nResponse = await response.json();
        console.log('Resposta JSON do n8n:', responseData);
        
        if (responseData.message) {
          responseText = responseData.message;
        } else if (responseData.text) {
          responseText = responseData.text;
        } else if (responseData.response) {
          responseText = responseData.response;
        } else if (typeof responseData === 'string') {
          responseText = responseData as string;
        } else {
          responseText = JSON.stringify(responseData);
        }
      } catch (jsonError) {
        console.log('Resposta não é JSON, tratando como texto');
        responseText = await response.text();
      }
      
      if (!responseText) {
        throw new Error('Resposta vazia do n8n');
      }
      
      return responseText;
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem para n8n:', error);
      toast.error(`Erro ao processar mensagem: ${error.message}`);
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
