
import { useConversation } from '@11labs/react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useElevenLabsConversation = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('🎙️ Conectado ao ElevenLabs');
      toast.success('Chamada de voz conectada!');
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log('📞 Desconectado do ElevenLabs');
      toast.info('Chamada de voz encerrada');
      setConversationId(null);
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('❌ Erro na chamada:', error);
      toast.error('Erro na chamada de voz: ' + error);
      setIsConnecting(false);
      setConversationId(null);
    },
    onMessage: (message) => {
      console.log('📨 Mensagem recebida:', message);
    }
  });

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Solicitar permissão do microfone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Obter signed URL do backend
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation', {
        body: { action: 'get-signed-url' }
      });

      if (error) throw error;

      // Iniciar conversação
      const id = await conversation.startSession({ 
        signedUrl: data.signed_url 
      });
      
      setConversationId(id);
      console.log('🆔 Conversação iniciada:', id);
      
    } catch (error: any) {
      console.error('Erro ao iniciar chamada:', error);
      toast.error('Erro ao iniciar chamada: ' + error.message);
      setIsConnecting(false);
    }
  }, [conversation]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
      setConversationId(null);
    } catch (error: any) {
      console.error('Erro ao encerrar chamada:', error);
      toast.error('Erro ao encerrar chamada: ' + error.message);
    }
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    try {
      await conversation.setVolume({ volume });
    } catch (error: any) {
      console.error('Erro ao ajustar volume:', error);
    }
  }, [conversation]);

  return {
    isConnecting,
    isConnected: conversation.status === 'connected',
    isSpeaking: conversation.isSpeaking,
    conversationId,
    startCall,
    endCall,
    setVolume
  };
};
