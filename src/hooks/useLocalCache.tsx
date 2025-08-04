import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DbMessage = Database['public']['Tables']['chat_messages']['Row'];

export interface CachedMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  transcription?: string;
  audioUrl?: string;
  timestamp: string;
}

interface LocalCacheState {
  messages: CachedMessage[];
  addMessage: (message: CachedMessage) => void;
  clearMessages: () => void;
  loadMessages: (userId: string) => Promise<void>;
}

const useLocalCacheStore = create<LocalCacheState>((set) => ({
  messages: [],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  loadMessages: async (userId: string) => {
    try {
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (chatError || !chat) {
        set({ messages: [] });
        return;
      }
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      const formattedMessages: CachedMessage[] = messagesData.map((msg: DbMessage) => ({
        id: msg.id,
        type: msg.message_type as 'user' | 'assistant' | 'system',
        transcription: msg.text_content ?? undefined,
        // CORREÇÃO: Usando a coluna correta do banco de dados
        audioUrl: msg.response_audio_url ?? undefined, 
        timestamp: msg.created_at,
      }));

      set({ messages: formattedMessages });
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      set({ messages: [] });
    }
  },
}));

export const useLocalCache = useLocalCacheStore;