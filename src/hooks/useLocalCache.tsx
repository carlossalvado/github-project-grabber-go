import { useState, useCallback } from 'react';

// Define a estrutura de dados de uma mensagem no cache
export interface CachedMessage {
  id: string;
  type: 'user' | 'assistant';
  timestamp: string;
  transcription: string;
  audioUrl?: string;
  imageUrl?: string; // Propriedade adicionada para suportar imagens
}

export const useLocalCache = () => {
  const [messages, setMessages] = useState<CachedMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Função para carregar as mensagens do cache
  const loadMessages = useCallback((userId: string) => {
    if (!userId) {
      setMessages([]);
      return;
    }
    setCurrentUserId(userId);
    try {
      const cachedData = localStorage.getItem(`chatMessages_${userId}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Garante que o estado seja sempre um array, evitando o erro .filter
        const loadedMessages = Array.isArray(parsedData) ? parsedData : [];
        setMessages(loadedMessages);
      } else {
        setMessages([]); // Garante que o estado seja um array vazio se não houver cache
      }
    } catch (error) {
      console.error('Falha ao carregar mensagens do cache:', error);
      setMessages([]); // Garante que o estado seja um array vazio em caso de erro
    }
  }, []);

  // Função para adicionar uma nova mensagem
  const addMessage = useCallback((message: CachedMessage) => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, message];
      if (currentUserId) {
        try {
          localStorage.setItem(`chatMessages_${currentUserId}`, JSON.stringify(updatedMessages));
        } catch (error) {
          console.error('Falha ao salvar mensagem no cache:', error);
        }
      }
      return updatedMessages;
    });
  }, [currentUserId]);
  
  // Função para limpar as mensagens
  const clearMessages = useCallback(() => {
    if (currentUserId) {
      try {
        localStorage.removeItem(`chatMessages_${currentUserId}`);
        setMessages([]);
      } catch (error)      {
        console.error('Falha ao limpar mensagens do cache:', error);
      }
    }
  }, [currentUserId]);

  return { messages, addMessage, clearMessages, loadMessages };
};