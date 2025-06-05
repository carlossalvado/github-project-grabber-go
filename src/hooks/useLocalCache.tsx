
import { useState, useEffect } from 'react';

export interface CachedMessage {
  id: string;
  type: 'user' | 'assistant';
  audioBlob?: Blob;
  audioUrl?: string;
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
        setMessages(conversation.messages);
      } catch (error) {
        console.error('Error loading cached conversation:', error);
      }
    }
  }, [STORAGE_KEY]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const conversation: CachedConversation = {
        id: conversationId,
        messages,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
    }
  }, [messages, conversationId, STORAGE_KEY]);

  const addMessage = (message: Omit<CachedMessage, 'id'>) => {
    const newMessage: CachedMessage = {
      ...message,
      id: crypto.randomUUID(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<CachedMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    addMessage,
    updateMessage,
    clearConversation
  };
};
