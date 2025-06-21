
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
      
      // Fazer requisição diretamente esperando áudio MP3
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
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
      
      // Verificar se a resposta é áudio MP3 direto
      if (contentType && contentType.includes('audio/mpeg')) {
        console.log('✅ Resposta é áudio MP3 direto');
        const audioBlob = await response.blob();
        console.log('Blob de áudio criado, tamanho:', audioBlob.size, 'bytes');
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('URL de áudio criada:', audioUrl);
        
        return {
          text: 'Áudio da Isa',
          audioUrl
        };
      } else {
        // Se não é áudio, tentar processar como JSON e depois fazer nova requisição para áudio
        console.log('Resposta não é áudio, processando como JSON...');
        const responseData = await response.json();
        console.log('Resposta JSON:', responseData);
        
        // Fazer uma segunda requisição sem Accept header para ver se obtemos áudio
        console.log('Fazendo segunda requisição sem Accept header...');
        const audioResponse = await fetch(audioWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        console.log('Segunda requisição - Status:', audioResponse.status);
        console.log('Segunda requisição - Content-Type:', audioResponse.headers.get('content-type'));
        
        const secondContentType = audioResponse.headers.get('content-type');
        
        if (secondContentType && secondContentType.includes('audio/mpeg')) {
          console.log('✅ Segunda requisição retornou áudio MP3');
          const audioBlob = await audioResponse.blob();
          console.log('Blob de áudio da segunda requisição, tamanho:', audioBlob.size, 'bytes');
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log('URL de áudio da segunda requisição:', audioUrl);
          
          return {
            text: 'Áudio da Isa',
            audioUrl
          };
        } else {
          console.log('Segunda requisição também não retornou áudio');
          
          // Tentar uma terceira abordagem - requisição simples sem headers extras
          console.log('Fazendo terceira requisição simples...');
          const simpleResponse = await fetch(audioWebhookUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          
          console.log('Terceira requisição - Status:', simpleResponse.status);
          console.log('Terceira requisição - Content-Type:', simpleResponse.headers.get('content-type'));
          
          const thirdContentType = simpleResponse.headers.get('content-type');
          
          if (thirdContentType && thirdContentType.includes('audio')) {
            console.log('✅ Terceira requisição retornou áudio');
            const audioBlob = await simpleResponse.blob();
            console.log('Blob de áudio da terceira requisição, tamanho:', audioBlob.size, 'bytes');
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('URL de áudio da terceira requisição:', audioUrl);
            
            return {
              text: 'Áudio da Isa',
              audioUrl
            };
          } else {
            console.log('❌ Nenhuma das requisições retornou áudio válido');
            return {
              text: 'Resposta processada (sem áudio disponível)',
              audioUrl: undefined
            };
          }
        }
      }
      
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
