
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

  const sendAudioToN8n = async (audioBlob: Blob, userEmail?: string): Promise<{ text: string; audioUrl?: string; audioBlob?: Blob }> => {
    setIsLoading(true);
    
    try {
      console.log('=== ENVIANDO ÁUDIO PARA N8N (WEBHOOK BINARY) ===');
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
      
      console.log('Enviando para webhook N8N que retorna binary file...');
      
      const response = await fetch(audioWebhookUrl, {
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
        console.error('Erro HTTP:', response.status, errorText);
        throw new Error(`Erro no webhook N8N: ${response.status} - ${errorText}`);
      }
      
      // Processar resposta como blob (arquivo binário)
      const audioResponseBlob = await response.blob();
      console.log('Arquivo binário recebido - tamanho:', audioResponseBlob.size, 'bytes');
      console.log('Tipo MIME do blob:', audioResponseBlob.type);
      
      if (audioResponseBlob.size === 0) {
        console.error('❌ Resposta vazia do N8N');
        throw new Error('Nenhum arquivo de áudio foi retornado pelo servidor');
      }
      
      // Verificar se é um áudio válido e converter se necessário
      let finalAudioBlob = audioResponseBlob;
      
      // Se o tipo MIME não for de áudio, tentar forçar como audio/mpeg
      if (!audioResponseBlob.type.startsWith('audio/')) {
        console.log('🔧 Convertendo blob para audio/mpeg...');
        finalAudioBlob = new Blob([audioResponseBlob], { type: 'audio/mpeg' });
      }
      
      // Criar URL do objeto para o áudio
      const audioUrl = URL.createObjectURL(finalAudioBlob);
      console.log('✅ URL do áudio criada:', audioUrl);
      
      // Testar se o áudio é válido criando um elemento de áudio temporário
      const testAudio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        testAudio.oncanplaythrough = () => {
          console.log('✅ Áudio validado com sucesso');
          resolve({
            text: '',
            audioUrl: audioUrl,
            audioBlob: finalAudioBlob
          });
        };
        
        testAudio.onerror = (error) => {
          console.error('❌ Erro na validação do áudio:', error);
          // Mesmo com erro, retornar o áudio (pode ser formato não suportado pelo teste)
          resolve({
            text: '',
            audioUrl: audioUrl,
            audioBlob: finalAudioBlob
          });
        };
        
        // Timeout para validação
        setTimeout(() => {
          console.log('⏱️ Timeout na validação, retornando áudio mesmo assim');
          resolve({
            text: '',
            audioUrl: audioUrl,
            audioBlob: finalAudioBlob
          });
        }, 3000);
        
        // Tentar carregar o áudio
        testAudio.load();
      });
      
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO DE ÁUDIO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('==========================================');
      
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
