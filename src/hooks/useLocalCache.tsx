
import { useState, useEffect } from 'react';

export interface CachedMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
  audioBase64?: string; // Adicionar cache em base64
  transcription?: string;
  timestamp: string;
}

export interface CachedConversation {
  id: string;
  messages: CachedMessage[];
  lastUpdated: string;
}

export const useLocalCache = (conversationId: string = 'default') => {
  const [messages, setMessages] = useState<CachedMessage[]>([]);

  const STORAGE_KEY = `elevenlabs_conversation_${conversationId}`;

  // Load messages from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const conversation: CachedConversation = JSON.parse(cached);
        
        // Recriar URLs de áudio a partir do base64 cache
        const messagesWithAudio = conversation.messages.map(msg => {
          if (msg.audioBase64 && !msg.audioUrl) {
            try {
              // Converter base64 para blob e criar URL
              const binaryString = atob(msg.audioBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/mpeg' });
              const audioUrl = URL.createObjectURL(blob);
              
              return { ...msg, audioBlob: blob, audioUrl };
            } catch (error) {
              console.error('Erro ao recriar áudio do cache:', error);
              return msg;
            }
          }
          return msg;
        });
        
        setMessages(messagesWithAudio);
        console.log('✅ Mensagens carregadas do cache com áudio:', messagesWithAudio.length);
      } catch (error) {
        console.error('Error loading cached conversation:', error);
      }
    }
  }, [STORAGE_KEY]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Preparar mensagens para cache (converter blobs para base64)
      const messagesToCache = messages.map(msg => {
        const cachedMsg: any = { ...msg };
        
        // Remover audioUrl (será recriada na carga) e audioBlob (não é serializável)
        delete cachedMsg.audioUrl;
        delete cachedMsg.audioBlob;
        
        return cachedMsg;
      });

      const conversation: CachedConversation = {
        id: conversationId,
        messages: messagesToCache,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
      console.log('💾 Mensagens salvas no cache:', messagesToCache.length);
    }
  }, [messages, conversationId, STORAGE_KEY]);

  const addMessage = (message: Omit<CachedMessage, 'id'>) => {
    const newMessage: CachedMessage = {
      ...message,
      id: crypto.randomUUID(),
    };
    
    // Se há audioBlob, converter para base64 para cache
    if (newMessage.audioBlob) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, audioBase64: base64 }
            : msg
        ));
      };
      reader.readAsDataURL(newMessage.audioBlob);
    }
    
    setMessages(prev => [...prev, newMessage]);
    console.log('➕ Nova mensagem adicionada:', newMessage.id, newMessage.type);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<CachedMessage>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        const updatedMsg = { ...msg, ...updates };
        
        // Se há audioBlob no update, converter para base64
        if (updates.audioBlob) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            setMessages(current => current.map(currentMsg => 
              currentMsg.id === id 
                ? { ...currentMsg, audioBase64: base64 }
                : currentMsg
            ));
          };
          reader.readAsDataURL(updates.audioBlob);
        }
        
        return updatedMsg;
      }
      return msg;
    }));
  };

  const clearMessages = () => {
    // Limpar URLs dos objetos para liberar memória
    messages.forEach(message => {
      if (message.audioUrl) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
    
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cache de mensagens limpo');
  };

  return {
    messages,
    addMessage,
    updateMessage,
    clearMessages
  };
};
