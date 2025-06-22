
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
      console.log('=== ENVIANDO ÁUDIO PARA N8N (BINARY RESPONSE) ===');
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
      
      console.log('Fazendo requisição para o webhook configurado como Binary File...');
      
      // Requisição simples, esperando resposta binária (MP3)
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
      
      // N8N configurado como Binary File deve retornar diretamente o MP3
      const contentType = response.headers.get('content-type') || '';
      console.log('Content-Type:', contentType);
      
      // Tratar como áudio MP3 binário
      const audioResponseBlob = await response.blob();
      console.log('Blob recebido - tamanho:', audioResponseBlob.size, 'bytes, tipo:', audioResponseBlob.type);
      
      if (audioResponseBlob.size === 0) {
        console.error('❌ Resposta vazia do N8N');
        throw new Error('Resposta vazia do servidor');
      }
      
      // Verificar se é realmente áudio
      if (audioResponseBlob.size < 100) {
        console.error('❌ Arquivo muito pequeno, provavelmente não é áudio válido');
        throw new Error('Resposta muito pequena para ser áudio válido');
      }
      
      // Criar URL para o áudio
      const audioUrl = URL.createObjectURL(audioResponseBlob);
      console.log('✅ URL de áudio criada:', audioUrl);
      
      // Testar se o áudio é válido
      return new Promise((resolve, reject) => {
        const testAudio = new Audio();
        
        testAudio.onloadedmetadata = () => {
          console.log('✅ Áudio válido confirmado! Duração:', testAudio.duration, 'segundos');
          resolve({
            text: 'Resposta da Isa',
            audioUrl: audioUrl
          });
        };
        
        testAudio.onerror = (error) => {
          console.error('❌ Áudio inválido:', error);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Arquivo de áudio corrompido ou inválido'));
        };
        
        // Timeout de segurança
        setTimeout(() => {
          console.error('⏰ Timeout na validação do áudio');
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Timeout na validação do áudio'));
        }, 5000);
        
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
