
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
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro na resposta: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type detectado:', contentType);
      
      let responseText = '';
      let audioUrl: string | undefined;
      
      // Verificar se a resposta é áudio MP3 direto
      if (contentType && contentType.includes('audio/mpeg')) {
        console.log('✅ Resposta é áudio MP3 direto');
        const audioBlob = await response.blob();
        console.log('Blob de áudio criado, tamanho:', audioBlob.size, 'bytes');
        audioUrl = URL.createObjectURL(audioBlob);
        console.log('URL de áudio criada:', audioUrl);
        responseText = 'Áudio da Isa';
      } else {
        // Processar como JSON
        console.log('Processando como JSON...');
        const responseData = await response.json();
        console.log('Resposta JSON completa:', responseData);
        
        // Verificar se é array do n8n
        if (Array.isArray(responseData) && responseData.length > 0) {
          const firstItem = responseData[0];
          console.log('Primeiro item do array:', firstItem);
          
          // Verificar se contém dados de áudio
          if (firstItem['content-type'] === 'audio/mpeg' || firstItem.audioData) {
            console.log('Detectado conteúdo de áudio no JSON');
            
            // Se tem audioData como base64
            if (firstItem.audioData) {
              console.log('Convertendo audioData base64 para blob...');
              try {
                const audioData = firstItem.audioData;
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
                console.log('✅ Áudio convertido de base64, URL criada:', audioUrl);
                responseText = 'Áudio da Isa';
              } catch (error) {
                console.error('Erro ao converter base64 para áudio:', error);
                responseText = 'Erro ao processar áudio';
              }
            } else {
              // Tentar fazer nova requisição para obter áudio
              console.log('Fazendo segunda requisição para obter áudio...');
              try {
                const audioResponse = await fetch(audioWebhookUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                  },
                  body: JSON.stringify(payload)
                });
                
                console.log('Segunda requisição - Status:', audioResponse.status);
                console.log('Segunda requisição - Content-Type:', audioResponse.headers.get('content-type'));
                
                if (audioResponse.ok) {
                  const responseContentType = audioResponse.headers.get('content-type');
                  if (responseContentType && responseContentType.includes('audio')) {
                    const audioBlob = await audioResponse.blob();
                    console.log('✅ Áudio obtido na segunda requisição, tamanho:', audioBlob.size);
                    audioUrl = URL.createObjectURL(audioBlob);
                    responseText = 'Áudio da Isa';
                  } else {
                    console.log('Segunda requisição não retornou áudio');
                    responseText = 'Resposta processada (sem áudio)';
                  }
                }
              } catch (audioError) {
                console.error('Erro na segunda requisição:', audioError);
                responseText = 'Resposta processada (erro no áudio)';
              }
            }
          } else {
            // Extrair texto da resposta
            responseText = firstItem.output || firstItem.text || firstItem.message || 'Resposta da Isa';
            console.log('Texto extraído:', responseText);
          }
        } else if (responseData && typeof responseData === 'object') {
          console.log('Tratando resposta como objeto...');
          responseText = responseData.output || responseData.message || responseData.text || 'Resposta da Isa';
          
          // Verificar se o objeto contém dados de áudio
          if (responseData.audioData) {
            console.log('Encontrado audioData no objeto de resposta');
            try {
              const audioData = responseData.audioData;
              const binaryString = atob(audioData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
              audioUrl = URL.createObjectURL(audioBlob);
              console.log('✅ Áudio convertido do objeto, URL criada:', audioUrl);
            } catch (error) {
              console.error('Erro ao converter audioData do objeto:', error);
            }
          }
        } else {
          responseText = 'Resposta da Isa';
        }
      }
      
      console.log('=== RESULTADO FINAL ===');
      console.log('Texto final:', responseText);
      console.log('URL de áudio:', audioUrl ? 'Criada com sucesso' : 'Não disponível');
      console.log('=======================');
      
      return {
        text: responseText,
        audioUrl
      };
      
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO DE ÁUDIO ===');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
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
