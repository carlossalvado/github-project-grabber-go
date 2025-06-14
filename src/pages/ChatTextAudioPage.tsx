
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Loader2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useGeminiLiveAudio } from '@/hooks/useGeminiLiveAudio';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import GeminiAudioBubble from '@/components/GeminiAudioBubble';

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages: textMessages, addMessage } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  
  // Hook Gemini Live Audio
  const {
    messages: audioMessages,
    isRecording,
    isConnected,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    playMessageAudio,
    clearMessages: clearAudioMessages,
    connect,
    disconnect
  } = useGeminiLiveAudio();
  
  const [input, setInput] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [agentData, setAgentData] = useState({
    name: 'Isa',
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

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

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

  const handleAudioToggle = async () => {
    if (!user) {
      toast.error('Faça login primeiro');
      return;
    }
    
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const renderTextMessage = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUserMessage && (
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-purple-600 text-white">
              {agentData.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="max-w-[70%] space-y-1">
          <div className={`px-4 py-3 rounded-2xl shadow-md ${
            isUserMessage 
              ? 'bg-purple-600 text-white rounded-br-none' 
              : 'bg-gray-700 text-white rounded-bl-none'
          }`}>
            <p className="whitespace-pre-wrap break-words text-sm">{message.transcription}</p>
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>

        {isUserMessage && (
          <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
            <AvatarFallback className="bg-blue-600 text-white">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar className="cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-purple-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{agentData.name}</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi size={12} className="text-green-500" />
              ) : (
                <WifiOff size={12} className="text-red-500" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Gemini Live' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={clearAudioMessages}
        >
          Limpar Áudios
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {/* Text Messages */}
          {textMessages.map(renderTextMessage)}
          
          {/* Gemini Audio Messages */}
          {audioMessages.map(message => (
            <GeminiAudioBubble
              key={message.id}
              message={message}
              onPlayAudio={playMessageAudio}
              agentAvatar={agentData.avatar_url}
              agentName={agentData.name}
              userEmail={user.email}
            />
          ))}
          
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Recording Indicator */}
      {(isRecording || isProcessing) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-500/50 min-w-80">
          <div className={cn(
            "mb-3",
            isRecording ? "animate-pulse" : ""
          )}>
            <Mic size={48} className={isRecording ? "text-red-500" : "text-blue-500"} />
          </div>
          
          <div className="text-white font-medium mb-2">
            {isRecording ? formatRecordingTime(recordingTime) : 'Processando...'}
          </div>
          
          <div className="text-xs text-gray-300">
            {isRecording ? 'Gravando com Gemini Live' : 'Aguardando resposta'}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
          onClick={handleAudioToggle}
          disabled={n8nLoading || isProcessing || !isConnected}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Input
          ref={inputRef}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={n8nLoading || isRecording || isProcessing}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-white"
          onClick={handleSendMessage}
          disabled={!input.trim() || n8nLoading || isRecording || isProcessing}
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

export default ChatTextAudioPage;
