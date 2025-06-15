import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Send, Loader2, Gift, Star, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import { cn } from '@/lib/utils';

const ChatPremiumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, clearMessages } = useLocalCache('premium-chat');
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  
  const [input, setInput] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [agentData, setAgentData] = useState({
    name: 'Isa Premium',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Buscar dados do agente selecionado pelo usuário
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.id) return;

      try {
        // Buscar o agente selecionado pelo usuário
        const { data: selectedAgent, error: selectedError } = await supabase
          .from('user_selected_agent')
          .select('agent_id')
          .eq('user_id', user.id)
          .single();

        if (selectedError) {
          console.error('Erro ao buscar agente selecionado:', selectedError);
          return;
        }

        if (selectedAgent) {
          // Buscar dados completos do agente
          const { data: agent, error: agentError } = await supabase
            .from('ai_agents')
            .select('name, avatar_url')
            .eq('id', selectedAgent.agent_id)
            .single();

          if (agentError) {
            console.error('Erro ao buscar dados do agente:', agentError);
            return;
          }

          if (agent) {
            setAgentData({
              name: agent.name,
              avatar_url: agent.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do agente:', error);
      }
    };

    fetchAgentData();
  }, [user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current && currentlyPlaying === messageId) {
        audioRef.current.pause();
        setCurrentlyPlaying(null);
    } else {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        audioRef.current = new Audio(audioUrl);
        audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        setCurrentlyPlaying(messageId);
        audioRef.current.onended = () => {
            setCurrentlyPlaying(null);
        };
        audioRef.current.onerror = () => {
            setCurrentlyPlaying(null);
            toast.error("Erro ao reproduzir o áudio.");
        }
    }
  };

  const handleSendMessage = async () => {
    const isLoading = n8nLoading || isGeneratingAudio;
    if (!input.trim() || isLoading || !user) return;

    const messageText = input.trim();
    setInput('');

    addMessage({
      type: 'user',
      transcription: messageText,
      timestamp: new Date().toISOString()
    });

    try {
      const responseText = await sendToN8n(messageText, user.email);
      
      setIsGeneratingAudio(true);
      let audioUrl: string | undefined;
      try {
        const { data, error } = await supabase.functions.invoke('elevenlabs-text-to-speech', {
            body: { text: responseText, voiceId: 'XB0fDUnXU5powFXDhCwa' }
        });
        if (error) throw error;
        if (data.audioContent) {
            audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        }
      } catch (e) {
        console.error("Failed to generate audio:", e);
        toast.error("Erro ao gerar a voz da resposta.");
      } finally {
        setIsGeneratingAudio(false);
      }
      
      const assistantMessageId = addMessage({
        type: 'assistant',
        transcription: responseText,
        timestamp: new Date().toISOString(),
        audioUrl: audioUrl
      });

      if (audioUrl) {
        handlePlayAudio(assistantMessageId, audioUrl);
      }

    } catch (error: any) {
      console.error('Error generating response:', error);
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar sua mensagem.`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAudioMessage = async () => {
    toast.info("A gravação de áudio por aqui está sendo aprimorada! Use a caixa de texto por enquanto.");
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAvatarClick = () => {
    setIsProfileModalOpen(true);
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat premium.</p>
      </div>
    );
  }

  const isLoading = n8nLoading || isGeneratingAudio;

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800/80 backdrop-blur-sm border-b border-purple-500/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar className="border-2 border-purple-500 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-purple-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{agentData.name}</span>
              <Badge variant="secondary" className="text-xs bg-purple-600 text-white">
                <Star size={12} className="mr-1" />
                Premium
              </Badge>
            </div>
            <span className="text-xs text-gray-400">
              {isLoading ? 'Pensando...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300"
            onClick={clearMessages}
          >
            Limpar Chat
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-purple-400 hover:text-purple-300"
            onClick={() => toast.success('Presente enviado! ❤️')}
          >
            <Gift size={20} />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isUserMessage = message.type === 'user';
              
              return (
                <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                  {!isUserMessage && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0 border border-purple-500/50 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
                      <AvatarFallback className="bg-purple-600 text-white">
                        {agentData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                      isUserMessage 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none' 
                        : 'bg-gray-800/80 text-white rounded-bl-none border border-purple-500/30'
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.transcription}</p>
                      {!isUserMessage && message.audioUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-8 h-8 mt-2 text-white hover:bg-white/20"
                          onClick={() => handlePlayAudio(message.id!, message.audioUrl!)}
                        >
                          {currentlyPlaying === message.id ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                      )}
                    </div>
                    <div className={`text-xs text-gray-400 mt-1 ${isUserMessage ? 'text-right' : 'text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {isUserMessage && (
                    <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
          
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>
      
      {/* Input Area */}
      <div className="p-4 bg-gray-800/80 backdrop-blur-sm border-t border-purple-500/30 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-purple-400"
          onClick={handleAudioMessage}
          disabled={isLoading}
        >
          <Mic size={20} />
        </Button>
        <Input
          ref={inputRef}
          className="bg-gray-700/80 border-purple-500/30 text-white placeholder:text-gray-400 focus-visible:ring-purple-500 backdrop-blur-sm"
          placeholder="Digite uma mensagem premium..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-purple-400"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </Button>
      </div>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        imageUrl={agentData.avatar_url}
        agentName={agentData.name}
      />
    </div>
  );
};

export default ChatPremiumPage;
