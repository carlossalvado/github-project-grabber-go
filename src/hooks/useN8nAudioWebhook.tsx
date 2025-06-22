
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
      console.log('=== ENVIANDO ÁUDIO PARA N8N (RESPOSTA BINÁRIA MP3) ===');
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
      
      console.log('Fazendo requisição para webhook configurado para retornar Binary File (MP3)...');
      
      // Requisição simples, webhook retorna diretamente o MP3
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
        throw new Error(`Erro na resposta: ${response.status} - ${errorText}`);
      }
      
      // Como o webhook está configurado como Binary File, esperamos um MP3 diretamente
      const contentType = response.headers.get('content-type') || '';
      console.log('Content-Type recebido:', contentType);
      
      // Processar resposta binária (MP3)
      const audioResponseBlob = await response.blob();
      console.log('Blob MP3 recebido - tamanho:', audioResponseBlob.size, 'bytes, tipo:', audioResponseBlob.type);
      
      if (audioResponseBlob.size === 0) {
        console.error('❌ Resposta vazia do N8N');
        throw new Error('Resposta vazia do servidor');
      }
      
      // Verificar se é um arquivo válido (mínimo 1KB para MP3)
      if (audioResponseBlob.size < 1024) {
        console.error('❌ Arquivo muito pequeno, provavelmente não é MP3 válido');
        console.log('Tentando ler como texto para debug...');
        const debugText = await audioResponseBlob.text();
        console.log('Conteúdo recebido:', debugText);
        throw new Error('Resposta muito pequena para ser áudio válido');
      }
      
      // Criar URL para o áudio MP3
      const audioUrl = URL.createObjectURL(audioResponseBlob);
      console.log('✅ URL de áudio MP3 criada:', audioUrl);
      
      // Testar se o áudio MP3 é válido
      return new Promise((resolve, reject) => {
        const testAudio = new Audio();
        
        testAudio.onloadedmetadata = () => {
          console.log('✅ Áudio MP3 válido confirmado! Duração:', testAudio.duration, 'segundos');
          resolve({
            text: 'Resposta da Isa',
            audioUrl: audioUrl
          });
        };
        
        testAudio.onerror = (error) => {
          console.error('❌ Erro ao carregar áudio MP3:', error);
          console.error('testAudio.error:', testAudio.error);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Arquivo MP3 corrompido ou formato inválido'));
        };
        
        // Timeout de segurança para validação
        const timeoutId = setTimeout(() => {
          console.error('⏰ Timeout na validação do áudio MP3');
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Timeout na validação do áudio'));
        }, 10000);
        
        testAudio.onloadedmetadata = () => {
          clearTimeout(timeoutId);
          console.log('✅ Áudio MP3 válido confirmado! Duração:', testAudio.duration, 'segundos');
          resolve({
            text: 'Resposta da Isa',
            audioUrl: audioUrl
          });
        };
        
        testAudio.src = audioUrl;
      });
      
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO DE ÁUDIO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
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
