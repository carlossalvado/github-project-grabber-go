import { useState, useCallback } from 'react';

export interface CachedMessage {
  id: string;
  type: 'user' | 'assistant';
  transcription: string;
  audioUrl?: string;
  timestamp: string;
}

const CACHE_VERSION = '1.0'; 
const getCacheKey = (userId: string) => `chatMessages_${userId}_v${CACHE_VERSION}`;

export const useLocalCache = () => {
  const [messages, setMessages] = useState<CachedMessage[]>([]);

  const loadMessages = useCallback((userId: string) => {
    try {
      const cachedMessages = localStorage.getItem(getCacheKey(userId));
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens do cache:", error);
      setMessages([]);
    }
  }, []);

  const addMessage = useCallback((message: CachedMessage, userId?: string) => {
    if (!userId) {
      const authUser = JSON.parse(localStorage.getItem('sb-auth-token') || '{}');
      userId = authUser?.user?.id;
    }

    if (!userId) {
      console.error("Não foi possível salvar a mensagem: ID do usuário não encontrado.");
      setMessages(prevMessages => [...prevMessages, message]);
      return;
    }

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, message];
      try {
        localStorage.setItem(getCacheKey(userId!), JSON.stringify(updatedMessages));
      } catch (error) {
        console.error("Erro ao salvar mensagens no cache:", error);
      }
      return updatedMessages;
    });
  }, []);

  const getRecentMessages = useCallback((): CachedMessage[] => {
    const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
    return messages.filter(message => {
      const messageTimestamp = new Date(message.timestamp).getTime();
      return messageTimestamp > twentyFourHoursAgo;
    });
  }, [messages]);

  return { messages, addMessage, loadMessages, getRecentMessages };
};