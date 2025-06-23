import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, Send, Loader2, Play, Pause, MicOff, Smile, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useN8nAudioWebhook } from '@/hooks/useN8nAudioWebhook';
import { useAudioCredits } from '@/hooks/useAudioCredits';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
import AudioMessage from '@/components/AudioMessage';
import AudioCreditsModal from '@/components/AudioCreditsModal';
import VoiceCallButton from '@/components/VoiceCallButton';

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, updateMessage, clearMessages } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  const { credits, hasCredits, consumeCredit, refreshCredits, isLoading: creditsLoading } = useAudioCredits();
    
  const [input, setInput] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [agentData, setAgentData] = useState({
    name: 'Isa',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.id) return;

      try {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const creditsSuccess = urlParams.get('credits_success');
    const creditsAmount = urlParams.get('credits');
    const creditsCanceled = urlParams.get('credits_canceled');
    
    if (creditsSuccess === 'true' && creditsAmount) {
      toast.success(`${creditsAmount} créditos adicionados com sucesso!`);
      refreshCredits();
      window.history.replaceState({}, document.title, '/chat-text-audio');
    }
    
    if (creditsCanceled === 'true') {
      toast.error('Compra de créditos cancelada');
      window.history.replaceState({}, document.title, '/chat-text-audio');
    }

    const giftSuccess = urlParams.get('gift_success');
    const giftId = urlParams.get('gift_id');
    const giftName = urlParams.get('gift_name');
    const giftCanceled = urlParams.get('gift_canceled');
    
    if (giftSuccess === 'true' && giftId && giftName) {
      handleGiftPaymentSuccess(giftId, decodeURIComponent(giftName));
      window.history.replaceState({}, document.title, '/chat-text-audio');
    }
    
    if (giftCanceled === 'true') {
      toast.error('Compra de presente cancelada');
      window.history.replaceState({}, document.title, '/chat-text-audio');
    }
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
      audioRef.current.play().catch(e => console.error("Erro ao reproduzir áudio:", e));
      setCurrentlyPlaying(messageId);
      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
      };
      audioRef.current.onerror = () => {
        setCurrentlyPlaying(null);
        toast.error("Erro ao reproduzir o áudio.");
      };
    }
  };

  const getAssistantResponse = async (messageText: string) => {
    if (!user) return;
    try {
      const responseText = await sendToN8n(messageText, user.email!);
      
      const assistantMessageId = addMessage({
        type: 'assistant',
        transcription: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Erro ao gerar resposta:', error);
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar sua mensagem.`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getAssistantAudioResponse = async (audioBlob: Blob, audioUrl: string) => {
    if (!user) return;
    
    console.log('=== PROCESSAMENTO DE ÁUDIO COM WEBHOOK N8N ===');
    console.log('Usando webhook N8N para áudio completo');
    
    try {
      const result = await sendAudioToN8n(audioBlob, user.email!);
      
      const userMessageId = addMessage({
        type: 'user',
        timestamp: new Date().toISOString(),
        audioUrl: audioUrl,
        transcription: result.text || 'Áudio enviado'
      });
      
      const assistantMessageId = addMessage({
        type: 'assistant',
        transcription: result.text,
        timestamp: new Date().toISOString(),
        audioUrl: result.audioUrl
      });

      if (result.audioUrl) {
        setTimeout(() => {
          handlePlayAudio(assistantMessageId, result.audioUrl!);
        }, 500);
      }

    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO DE ÁUDIO ===');
      console.error('Erro:', error);
      
      addMessage({
        type: 'user',
        timestamp: new Date().toISOString(),
        audioUrl: audioUrl,
        transcription: 'Áudio enviado (erro no processamento)'
      });
      
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar seu áudio: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      toast.error('Erro ao processar áudio: ' + error.message);
    }
  };

  const handleSendTextMessage = async () => {
    const isLoading = n8nLoading || audioN8nLoading || isRecording;
    if (!input.trim() || isLoading || !user) return;

    const messageText = input.trim();
    setInput('');

    addMessage({
      type: 'user',
      transcription: messageText,
      timestamp: new Date().toISOString()
    });

    await getAssistantResponse(messageText);
  };

  const handleEmoticonClick = () => {
    setShowEmoticonSelector(!showEmoticonSelector);
    setShowGiftSelection(false);
  };

  const handleGiftClick = () => {
    setShowGiftSelection(!showGiftSelection);
    setShowEmoticonSelector(false);
  };

  const handleEmoticonSelect = (emoticon: string) => {
    setInput(prev => prev + emoticon);
    setShowEmoticonSelector(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGiftSelect = async (giftId: string, giftName: string, giftPrice: number) => {
    try {
      console.log("Selecionando presente:", { giftId, giftName, giftPrice });
      
      const { data, error } = await supabase.functions.invoke('create-gift-checkout', {
        body: {
          giftId
        }
      });

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      console.log("Checkout session criada:", data);

      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
      
      setShowGiftSelection(false);
    } catch (error: any) {
      console.error('Error processing gift:', error);
      toast.error('Erro ao processar presente: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleGiftPaymentSuccess = (giftId: string, giftName: string) => {
    const giftEmojis: { [key: string]: string } = {
      "00000000-0000-0000-0000-000000000001": "🌹",
      "00000000-0000-0000-0000-000000000002": "🍫", 
      "00000000-0000-0000-0000-000000000003": "🧸",
      "00000000-0000-0000-0000-000000000004": "💐"
    };

    addMessage({
      type: 'user',
      transcription: `Enviou um presente: ${giftName} ${giftEmojis[giftId] || '🎁'}`,
      timestamp: new Date().toISOString()
    });
    
    toast.success(`Presente ${giftName} enviado com sucesso!`);

    setTimeout(() => {
      addMessage({
        type: 'assistant',
        transcription: `Que presente lindo! Muito obrigada pelo ${giftName}! ${giftEmojis[giftId] || '🎁'} ❤️`,
        timestamp: new Date().toISOString()
      });
    }, 1500);
  };

  useEffect(() => {
    if (audioBlob && audioUrl) {
      processAudioMessage(audioBlob, audioUrl);
    }
  }, [audioBlob, audioUrl]);

  const processAudioMessage = async (blob: Blob, url: string) => {
    if (!user) return;

    console.log('=== PROCESSANDO MENSAGEM DE ÁUDIO ===');
    console.log('Blob:', blob.size, 'bytes, tipo:', blob.type);
    console.log('URL:', url);

    // REMOVIDO: toast.info("Processando seu áudio...");

    try {
      await getAssistantAudioResponse(blob, url);
      resetAudio();
      console.log('Áudio processado com sucesso');
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar o áudio.');
      resetAudio();
    }
  };

  const handleAudioToggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (n8nLoading || audioN8nLoading) return;
      
      // Verificar créditos antes de iniciar gravação
      if (!hasCredits) {
        setShowCreditsModal(true);
        return;
      }
      
      // Consumir crédito IMEDIATAMENTE ao iniciar a gravação
      const creditConsumed = await consumeCredit();
      if (!creditConsumed) {
        setShowCreditsModal(true);
        return;
      }
      
      startRecording();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
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

  const renderMessage = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    
    return (
      <AudioMessage
        key={message.id}
        id={message.id!}
        content={message.transcription}
        audioUrl={message.audioUrl}
        isUser={isUserMessage}
        timestamp={message.timestamp}
        isPlaying={currentlyPlaying === message.id}
        onPlayAudio={handlePlayAudio}
        agentData={agentData}
        userEmail={user?.email}
      />
    );
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  const isProcessing = n8nLoading || audioN8nLoading;
  const isLoading = isProcessing || isRecording;

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
            <span className="text-xs text-gray-400">
              {isLoading ? 'Pensando...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <VoiceCallButton 
            agentName={agentData.name}
            agentAvatar={agentData.avatar_url}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={clearMessages}
          >
            Limpar Chat
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Emoticon Selector */}
      {showEmoticonSelector && (
        <EmoticonSelector
          onSelect={handleEmoticonSelect}
          onClose={() => setShowEmoticonSelector(false)}
        />
      )}

      {/* Gift Selection Modal */}
      {showGiftSelection && (
        <GiftSelection
          onClose={() => setShowGiftSelection(false)}
          onSelectGift={handleGiftSelect}
        />
      )}

      {/* Audio Credits Modal */}
      <AudioCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        currentCredits={credits}
      />

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "flex-shrink-0 text-gray-400 hover:text-white",
                isRecording && "text-red-500 hover:text-red-600 animate-pulse",
                !hasCredits && "opacity-50"
              )}
              onClick={handleAudioToggle}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>
            {!creditsLoading && (
              <span className="text-xs text-purple-400 font-medium">
                {credits}
              </span>
            )}
          </div>
          <Input
            ref={inputRef}
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
            placeholder="Digite uma mensagem ou use o áudio..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEmoticonClick}
            className={`flex-shrink-0 ${
              showEmoticonSelector 
                ? 'text-purple-400 bg-gray-700' 
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            <Smile size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGiftClick}
            className={`flex-shrink-0 ${
              showGiftSelection 
                ? 'text-purple-400 bg-gray-700' 
                : 'text-gray-400 hover:text-white'
            }`}
            disabled={isLoading}
          >
            <Gift size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 hover:text-white"
            onClick={handleSendTextMessage}
            disabled={!input.trim() || isLoading}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </Button>
        </div>
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
