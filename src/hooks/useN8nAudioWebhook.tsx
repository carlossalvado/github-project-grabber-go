
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
      
      // Requisição simples sem headers problemáticos
      const response = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Status da resposta:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type da resposta:', contentType);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro na resposta: ${response.status} - ${errorText}`);
      }
      
      // Verificar se é áudio (Binary File configurado no N8N)
      if (contentType && contentType.includes('audio/')) {
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
      
      // Se ainda recebemos JSON ou outro formato
      console.log('Resposta não é áudio, verificando outros formatos...');
      
      // Tentar como blob primeiro (caso seja áudio sem content-type correto)
      const blob = await response.blob();
      console.log('Blob recebido, tamanho:', blob.size, 'bytes, tipo:', blob.type);
      
      // Se o blob tem tamanho significativo e pode ser áudio
      if (blob.size > 1000) {
        console.log('Tentando tratar blob como áudio...');
        const audioUrl = URL.createObjectURL(blob);
        
        // Criar um elemento audio temporário para testar se é válido
        const testAudio = new Audio(audioUrl);
        
        return new Promise((resolve) => {
          testAudio.onloadedmetadata = () => {
            console.log('✅ Blob é áudio válido!');
            resolve({
              text: 'Áudio da Isa',
              audioUrl
            });
          };
          
          testAudio.onerror = () => {
            console.log('❌ Blob não é áudio válido');
            URL.revokeObjectURL(audioUrl);
            resolve({
              text: 'Resposta processada, mas formato de áudio não reconhecido',
              audioUrl: undefined
            });
          };
          
          // Timeout de 2 segundos para evitar travamento
          setTimeout(() => {
            console.log('⏰ Timeout na verificação de áudio');
            URL.revokeObjectURL(audioUrl);
            resolve({
              text: 'Resposta processada, mas não foi possível verificar o áudio',
              audioUrl: undefined
            });
          }, 2000);
        });
      }
      
      console.log('❌ Resposta não contém áudio válido');
      return {
        text: 'Resposta processada, mas sem áudio disponível',
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
