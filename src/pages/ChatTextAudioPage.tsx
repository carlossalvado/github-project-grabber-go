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
import { useVoiceCredits } from '@/hooks/useVoiceCredits';
import { useUserCache } from '@/hooks/useUserCache';
import { supabase } from '@/integrations/supabase/client';
import AgentProfileModal from '@/components/AgentProfileModal';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
import AudioMessage from '@/components/AudioMessage';
import AudioCreditsModal from '@/components/AudioCreditsModal';
import VoiceCallButton from '@/components/VoiceCallButton';
import ProfileImageModal from '@/components/ProfileImageModal';

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, updateMessage, clearMessages } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  const { credits, hasCredits, consumeCredit, refreshCredits, isLoading: creditsLoading } = useAudioCredits();
  const { refreshCredits: refreshVoiceCredits } = useVoiceCredits();
  const { getAvatarUrl } = useUserCache();
    
  const [input, setInput] = useState('');
  const [isAgentProfileModalOpen, setIsAgentProfileModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [agentData, setAgentData] = useState({
    id: '',
    name: 'Isa',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Carregar avatar do usuário do Supabase
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar avatar do usuário:', error);
          return;
        }

        if (profile?.avatar_url) {
          setUserAvatarUrl(profile.avatar_url);
          console.log('Avatar do usuário carregado:', profile.avatar_url);
        }
      } catch (error) {
        console.error('Erro ao carregar avatar do usuário:', error);
      }
    };

    fetchUserAvatar();
  }, [user?.id]);

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
            .select('id, name, avatar_url')
            .eq('id', selectedAgent.agent_id)
            .single();

          if (agentError) {
            console.error('Erro ao buscar dados do agente:', agentError);
            return;
          }

          if (agent) {
            setAgentData({
              id: agent.id,
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

    // Adicionar tratamento para créditos de voz
    const voiceCreditsSuccess = urlParams.get('voice_credits_success');
    const voiceCreditsAmount = urlParams.get('credits');
    const voiceCreditsCanceled = urlParams.get('voice_credits_canceled');
    
    if (voiceCreditsSuccess === 'true' && voiceCreditsAmount) {
      toast.success(`${voiceCreditsAmount} créditos de chamada de voz adicionados com sucesso!`);
      refreshVoiceCredits();
      window.history.replaceState({}, document.title, '/chat-text-audio');
    }
    
    if (voiceCreditsCanceled === 'true') {
      toast.error('Compra de créditos de chamada de voz cancelada');
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

  const getAssistantResponse = async (messageText: string) => {
    if (!user) return;
    
    try {
      const responseText = await sendToN8n(messageText, user.email!);
      
      addMessage({
        type: 'assistant',
        transcription: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error generating response:', error);
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar sua mensagem.`,
        timestamp: new Date().toISOString()
      });
      toast.error('Erro ao processar mensagem');
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
        audioBlob: audioBlob, // Salvar blob no cache
        transcription: ''
      });
      
      const assistantMessageId = addMessage({
        type: 'assistant',
        transcription: '',
        timestamp: new Date().toISOString(),
        audioUrl: result.audioUrl,
        audioBlob: result.audioBlob // Salvar blob da resposta no cache
      });

      if (result.audioUrl) {
        console.log('🎵 Reproduzindo áudio automaticamente...');
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
        audioBlob: audioBlob,
        transcription: ''
      });
      
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar seu áudio.`,
        timestamp: new Date().toISOString()
      });
      
      toast.error('Erro ao processar áudio');
    }
  };

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    console.log('🎵 Tentando reproduzir áudio:', messageId, audioUrl);
    
    if (audioRef.current && currentlyPlaying === messageId) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      console.log('🎵 Criando novo elemento de áudio...');
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onloadstart = () => {
        console.log('🎵 Carregamento do áudio iniciado');
      };
      
      audioRef.current.oncanplay = () => {
        console.log('✅ Áudio pode ser reproduzido');
      };
      
      audioRef.current.onplay = () => {
        console.log('▶️ Reprodução iniciada');
        setCurrentlyPlaying(messageId);
      };
      
      audioRef.current.onended = () => {
        console.log('⏹️ Reprodução finalizada');
        setCurrentlyPlaying(null);
      };
      
      audioRef.current.onerror = (e) => {
        console.error("❌ Erro ao reproduzir áudio:", e);
        if (audioRef.current?.error) {
          console.error('Código do erro:', audioRef.current.error.code);
          console.error('Mensagem do erro:', audioRef.current.error.message);
        }
        setCurrentlyPlaying(null);
        toast.error("Erro ao reproduzir o áudio. Tente novamente.");
      };
      
      // Tentar reproduzir
      audioRef.current.play().catch(e => {
        console.error("❌ Erro no play():", e);
        toast.error("Não foi possível reproduzir o áudio");
        setCurrentlyPlaying(null);
      });
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

  const handleAvatarClick = (imageUrl: string, name: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageName(name);
    setIsProfileImageModalOpen(true);
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
        onAvatarClick={handleAvatarClick}
        agentData={agentData}
        userEmail={user?.email}
        userAvatarUrl={userAvatarUrl}
      />
    );
  };

  const handleBackClick = () => {
    navigate('/profile');
  };

  if (!user) {
    return (
      <div className="h-screen bg-[#1a1d29] text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  const isProcessing = n8nLoading || audioN8nLoading;
  const isLoading = isProcessing || isRecording;

  return (
    <div className="h-screen bg-[#1a1d29] text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#1a1d29] border-b border-blue-800/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-200 hover:text-white hover:bg-blue-900/50"
            onClick={handleBackClick}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar 
            className="cursor-pointer" 
            onClick={() => handleAvatarClick(agentData.avatar_url, agentData.name)}
          >
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-blue-800 text-white">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-white">{agentData.name}</span>
            <span className="text-xs text-blue-300">
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
            className="text-blue-200 hover:text-white hover:bg-blue-900/50"
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

      {/* Agent Profile Modal */}
      <AgentProfileModal
        isOpen={isAgentProfileModalOpen}
        onClose={() => setIsAgentProfileModalOpen(false)}
        agentId={agentData.id}
      />

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={isProfileImageModalOpen}
        onClose={() => setIsProfileImageModalOpen(false)}
        imageUrl={selectedImageUrl}
        agentName={selectedImageName}
      />

      {/* Input Area */}
      <div className="p-4 bg-[#1a1d29] border-t border-blue-800/30">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "flex-shrink-0 text-blue-200 hover:text-white hover:bg-blue-900/50",
                isRecording && "text-red-400 hover:text-red-300 animate-pulse",
                !hasCredits && "opacity-50"
              )}
              onClick={handleAudioToggle}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>
            {!creditsLoading && (
              <span className="text-xs text-blue-400 font-medium">
                {credits}
              </span>
            )}
          </div>
          <Input
            ref={inputRef}
            className="bg-[#2F3349] border-[#4A5568] text-white placeholder:text-blue-300 focus-visible:ring-blue-500 focus-visible:border-blue-500"
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
                ? 'text-blue-400 bg-blue-900/50' 
                : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
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
                ? 'text-blue-400 bg-blue-900/50' 
                : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
            }`}
            disabled={isLoading}
          >
            <Gift size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-blue-200 hover:text-white hover:bg-blue-900/50"
            onClick={handleSendTextMessage}
            disabled={!input.trim() || isLoading}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
