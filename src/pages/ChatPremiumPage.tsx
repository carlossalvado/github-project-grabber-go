import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, MicOff, Send, Loader2, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useWhatsAppAudio } from '@/hooks/useWhatsAppAudio';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import WhatsAppAudioBubble from '@/components/WhatsAppAudioBubble';
import WhatsAppRecordingIndicator from '@/components/WhatsAppRecordingIndicator';

const ChatPremiumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages: textMessages, addMessage } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  
  // Hook WhatsApp para mensagens de áudio premium
  const {
    messages: audioMessages,
    isRecording,
    isListening,
    isProcessingResponse,
    recordingTime,
    audioLevel,
    transcript,
    startAudioMessage,
    finishAudioMessage,
    playMessageAudio,
    clearMessages: clearAudioMessages
  } = useWhatsAppAudio();
  
  const [input, setInput] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [agentData, setAgentData] = useState({
    name: 'Isa Premium',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
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
  }, [textMessages, audioMessages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || n8nLoading || isRecording || !user) return;

    const messageText = input.trim();
    setInput('');

    // Add user text message
    addMessage({
      type: 'user',
      transcription: messageText,
      timestamp: new Date().toISOString()
    });

    try {
      // Send to n8n webhook and get response
      const responseText = await sendToN8n(messageText, user.email);
      
      // Add AI response
      addMessage({
        type: 'assistant',
        transcription: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error generating response:', error);
      // Fallback response in case of error
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar sua mensagem: "${messageText}"`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAudioMessage = async () => {
    if (!user) {
      toast.error('Faça login primeiro');
      return;
    }
    
    if (isRecording) {
      await finishAudioMessage();
    } else {
      await startAudioMessage();
    }
  };

  const handleSendGift = () => {
    toast.success('Presente enviado! ❤️');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
            <span className="font-medium">{agentData.name}</span>
            <Badge variant="secondary" className="text-xs bg-purple-600 text-white">
              <Star size={12} className="mr-1" />
              Premium
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-400 hover:text-purple-300"
            onClick={clearAudioMessages}
          >
            Limpar Áudios
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
            {/* Text Messages */}
            {textMessages.map((message) => {
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

            {/* Premium Audio Messages (WhatsApp Style) */}
            {audioMessages.map(message => (
              <WhatsAppAudioBubble
                key={message.id}
                message={message}
                onPlayAudio={playMessageAudio}
                agentAvatar={agentData.avatar_url}
                agentName={agentData.name}
                userEmail={user.email}
              />
            ))}
          </div>
          
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Premium WhatsApp Recording Indicator */}
      <WhatsAppRecordingIndicator
        isRecording={isRecording}
        isListening={isListening}
        isProcessing={isProcessingResponse}
        recordingTime={recordingTime}
        audioLevel={audioLevel}
        transcript={transcript}
      />

      {/* Input Area */}
      <div className="p-4 bg-gray-800/80 backdrop-blur-sm border-t border-purple-500/30 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 ${isRecording ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'}`}
          onClick={handleAudioMessage}
          disabled={n8nLoading || isProcessingResponse}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
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
          disabled={n8nLoading || isRecording || isProcessingResponse}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-purple-400"
          onClick={handleSendMessage}
          disabled={!input.trim() || n8nLoading || isRecording || isProcessingResponse}
        >
          {n8nLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
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
