import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Clock, AlertTriangle, Smile, Gift, Mic, MicOff, Play, Pause, Plus, PlusCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useN8nAudioWebhook } from '@/hooks/useN8nAudioWebhook';
import { useTrialManager } from '@/hooks/useTrialManager';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection, { Gift as GiftType } from '@/components/GiftSelection';
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal';
import VoiceCallButton from '@/components/VoiceCallButton';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import TrialTimer from '@/components/TrialTimer';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AudioMessage from '@/components/AudioMessage';

const ChatTrialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectTextAudioPlan } = useSubscription();
  const { messages, addMessage, clearMessages, loadMessages } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isTrialActive, hoursRemaining, loading: trialLoading } = useTrialManager();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  const { credits, consumeCredits, initializeCredits, refreshCredits, isLoading: creditsLoading } = useCredits();
  
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showCreditsPurchaseModal, setShowCreditsPurchaseModal] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [agentData, setAgentData] = useState({
    id: '',
    name: 'Isa',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxTrialMessages = 10;

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, height=device-height');
    }

    const handleScroll = () => {
      if (window.innerHeight < window.outerHeight) {
        window.scrollTo(0, 1);
      }
    };

    setTimeout(handleScroll, 100);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1');
      }
    };
  }, []);

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


  // ====================================================================
  // ============== INÍCIO DA SEÇÃO MODIFICADA (useEffect) ==============
  // ====================================================================
  useEffect(() => {
    if (!trialLoading && !isTrialActive && user) {
      toast.error('Seu trial de 72 horas expirou! Faça upgrade para continuar conversando.');
      // O REDIRECIONAMENTO AUTOMÁTICO FOI REMOVIDO DAQUI
      // para permitir que o usuário escolha uma das opções na tela.
    }
  }, [isTrialActive, trialLoading, user, navigate]);
  // ====================================================================
  // ================ FIM DA SEÇÃO MODIFICADA (useEffect) ===============
  // ====================================================================


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
    if (user?.id) {
      initializeCredits(user.id);
      loadMessages(user.id);
    }
  }, [user?.id, initializeCredits, loadMessages]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('credit_purchase_success') === 'true') {
      toast.success('Créditos adicionados com sucesso!');
      refreshCredits();
      navigate('/chat-trial', { replace: true });
    }
  }, [refreshCredits, navigate]);

  const handleAvatarClickSingle = () => {
    setIsProfileModalOpen(true);
  };

  const handleGoBack = () => {
    navigate('/profile');
  };

  const handleUpgrade = async () => {
    await selectTextAudioPlan();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || n8nLoading || !user || !isTrialActive) return;

    if (messageCount >= maxTrialMessages) {
      toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
      return;
    }

    const messageText = input.trim();
    setInput('');
    setMessageCount(prev => prev + 1);

    const userMessage: CachedMessage = { 
      id: Date.now().toString(), 
      type: 'user', 
      transcription: messageText, 
      timestamp: new Date().toISOString() 
    };
    addMessage(userMessage);

    const response = await sendToN8n(messageText);
    if (response) {
      const assistantMessage: CachedMessage = { 
        id: Date.now().toString() + 'a', 
        type: 'assistant', 
        transcription: response, 
        timestamp: new Date().toISOString() 
      };
      addMessage(assistantMessage);
    }
  };

  // ... (demais funções handle... permanecem iguais)
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

  const handleGiftSend = async (gift: GiftType) => {
    setShowGiftSelection(false);

    const creditsConsumed = await consumeCredits(gift.credit_cost);
    if (!creditsConsumed) {
      toast.error("Créditos insuficientes ou erro ao processar pagamento.");
      return;
    }

    const giftMessageText = `🎁 Presente enviado: ${gift.name} ${gift.image_url}`;
    
    const messageText = giftMessageText;
    const userMessage: CachedMessage = { 
      id: Date.now().toString(), 
      type: 'user', 
      transcription: messageText, 
      timestamp: new Date().toISOString() 
    };
    addMessage(userMessage);

    const response = await sendToN8n(messageText);
    if (response) {
      const assistantMessage: CachedMessage = { 
        id: Date.now().toString() + 'a', 
        type: 'assistant', 
        transcription: response, 
        timestamp: new Date().toISOString() 
      };
      addMessage(assistantMessage);
    }
  };


  const handlePlayAudio = (messageId: string, url: string | undefined) => {
    if (!url) return;
    if (currentlyPlaying === messageId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
        setCurrentlyPlaying(messageId);
        audioRef.current.onended = () => setCurrentlyPlaying(null);
      }
    }
  };

  const getAssistantAudioResponse = async (audioBlob: Blob, url: string) => {
    const userMessage: CachedMessage = { id: Date.now().toString(), type: 'user', transcription: '', audioUrl: url, timestamp: new Date().toISOString() };
    addMessage(userMessage);

    const response = await sendAudioToN8n(audioBlob);
    if (response && response.audioUrl) {
      const assistantMessage: CachedMessage = { id: Date.now().toString() + 'a', type: 'assistant', audioUrl: response.audioUrl, transcription: response.text || '', timestamp: new Date().toISOString() };
      addMessage(assistantMessage);
    }
  };

  const handleAudioToggle = async () => {
    const AUDIO_MESSAGE_COST = 1;
    if (isRecording) { 
      stopRecording(); 
    } else {
      if (n8nLoading || audioN8nLoading) return;
      if (messageCount >= maxTrialMessages) {
        toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
        return;
      }
      if (credits < AUDIO_MESSAGE_COST) { 
        toast.error("Créditos insuficientes para enviar uma mensagem de áudio.");
        setShowCreditsPurchaseModal(true);
        return; 
      }
      const success = await consumeCredits(AUDIO_MESSAGE_COST);
      if (success) { 
        startRecording();
      } else {
        setShowCreditsPurchaseModal(true);
      }
    }
  };

  useEffect(() => { 
    if (audioBlob && audioUrl) { 
      getAssistantAudioResponse(audioBlob, audioUrl);
      resetAudio();
    } 
  }, [audioBlob, audioUrl, resetAudio]);

  const handleAvatarClick = (imageUrl: string, name: string) => { 
    setIsProfileModalOpen(true); 
  };

  const renderMessage = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    return (
      <AudioMessage 
        key={message.id} 
        id={message.id} 
        content={message.transcription} 
        audioUrl={message.audioUrl} 
        isUser={isUserMessage} 
        timestamp={message.timestamp} 
        isPlaying={currentlyPlaying === message.id} 
        onPlayAudio={() => handlePlayAudio(message.id, message.audioUrl)} 
        onAvatarClick={handleAvatarClick} 
        agentData={agentData} 
        userEmail={user?.email} 
        userAvatarUrl={userAvatarUrl} 
      />
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const remainingMessages = maxTrialMessages - messageCount;

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o trial.</p>
      </div>
    );
  }

  if (trialLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <p>Verificando status do trial...</p>
        </div>
      </div>
    );
  }

  // ====================================================================
  // ===== INÍCIO DA SEÇÃO MODIFICADA (Tela de Trial Expirado) ==========
  // ====================================================================
  if (!isTrialActive) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Trial Expirado</h2>
          <p className="text-gray-300 mb-6">Seu trial de 72 horas expirou. Faça upgrade para continuar!</p>
          
          {/* Container para os botões */}
          <div className="mt-8 flex flex-col items-center gap-4 w-full px-4">
            {/* Botão de Upgrade (Ação Primária) */}
            <Button
              onClick={handleUpgrade}
              className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 font-semibold"
            >
              Fazer Upgrade
            </Button>
            {/* Botão de Voltar para o Perfil (Ação Secundária) */}
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="w-full max-w-xs border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Voltar para o Perfil
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // ====================================================================
  // ====== FIM DA SEÇÃO MODIFICADA (Tela de Trial Expirado) ============
  // ====================================================================


  const isProcessing = n8nLoading || audioN8nLoading;
  const isLoading = isProcessing || isRecording;

  // O restante do código (a renderização do chat quando o trial está ativo) permanece o mesmo.
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative overflow-hidden mobile-fullscreen">
      
      <style>{`
        /* ... estilos permanecem os mesmos ... */
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .mobile-fullscreen {
          height: 100vh;
          height: 100dvh;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .pt-safe {
          padding-top: env(safe-area-inset-top);
        }
        @media (max-width: 768px) {
          body {
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
          }
          html {
            overflow: hidden;
            height: 100%;
          }
        }
      `}</style>
      <br></br>
      <TrialTimer />
      
      {/* Cabeçalho Principal */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0 sticky top-0 z-20 pt-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={handleGoBack}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar className="cursor-pointer" onClick={handleAvatarClickSingle}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-orange-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{agentData.name}</span>
            <Badge variant="secondary" className="text-xs bg-orange-600 text-white">
              <Clock size={12} className="mr-1" />
              Trial - {hoursRemaining}h restantes
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setShowCreditsPurchaseModal(true)} variant="ghost" className="text-orange-400 font-bold hover:bg-gray-700 hover:text-orange-300 px-3">
            {creditsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${credits} Créditos`}
            <PlusCircle className="ml-2 h-4 w-4"/>
          </Button>
          <VoiceCallButton 
            agentName={agentData.name}
            agentAvatar={agentData.avatar_url}
            onRequestVoiceCredits={() => setShowCreditsPurchaseModal(true)}
          />
        </div>
      </div>

      {/* Seção para o Botão de Upgrade - SEMPRE VISÍVEL */}
      <div className="w-full flex justify-center items-center py-2 px-4 bg-gray-800 border-b border-gray-700">
        <Button
          onClick={handleUpgrade}
          className="bg-orange-600 hover:bg-orange-700 text-white w-full max-w-sm font-semibold"
          size="sm"
        >
          Fazer Upgrade Agora
        </Button>
      </div>

      {(hoursRemaining <= 12 || remainingMessages <= 3) && (
        <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center flex-shrink-0">
          <p className="text-orange-300 text-sm">
            ⚠️ {hoursRemaining <= 12 ? `${hoursRemaining} horas restantes no seu trial` : `${remainingMessages} mensagens restantes`}. 
            <Button 
              variant="link" 
              className="text-orange-400 underline p-0 ml-1"
              onClick={handleUpgrade}
            >
              Faça upgrade agora!
            </Button>
          </p>
          <br></br>
        </div>
      )}

      {/* ... o restante do JSX do chat permanece o mesmo ... */}
       <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide touch-pan-y p-4" style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="space-y-4">
            {messages.map(renderMessage)}
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <CreditsPurchaseModal 
        isOpen={showCreditsPurchaseModal}
        onClose={() => setShowCreditsPurchaseModal(false)}
      />

      {showEmoticonSelector && (
        <EmoticonSelector 
          onSelect={handleEmoticonSelect} 
          onClose={() => setShowEmoticonSelector(false)} 
        />
      )}
      {showGiftSelection && (
        <GiftSelection 
          onGiftSend={handleGiftSend}
          onClose={() => setShowGiftSelection(false)} 
        />
      )}

      <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 sticky bottom-0 z-20 pb-safe">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 flex items-center space-x-2">
            <Input
              ref={inputRef}
              className="bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              placeholder={
                isTrialActive && remainingMessages > 0 
                  ? "Digite uma mensagem..." 
                  : "Trial expirado - Faça upgrade para continuar"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading || !isTrialActive || remainingMessages <= 0}
            />
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEmoticonClick}
                className={`flex-shrink-0 w-8 h-8 ${
                  showEmoticonSelector 
                    ? 'text-orange-400 bg-gray-600' 
                    : 'text-gray-400 hover:text-orange-400'
                }`}
                disabled={n8nLoading || !isTrialActive || remainingMessages <= 0}
              >
                <Smile size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGiftClick}
                className={`flex-shrink-0 w-8 h-8 ${
                  showGiftSelection 
                    ? 'text-orange-400 bg-gray-600' 
                    : 'text-gray-400 hover:text-orange-400'
                }`}
                disabled={n8nLoading || !isTrialActive || remainingMessages <= 0}
              >
                <Gift size={16} />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="relative flex flex-col items-center">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0",
                  isRecording && "bg-red-600 hover:bg-red-700 animate-pulse"
                )}
                onClick={handleAudioToggle}
                disabled={isProcessing || !isTrialActive || remainingMessages <= 0}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
              
              {credits <= 0 && !isRecording && (
                <div 
                  className="absolute inset-0 bg-black bg-opacity-30 rounded-full cursor-pointer flex items-center justify-center"
                  onClick={() => setShowCreditsPurchaseModal(true)}
                >
                  <ShieldAlert size={16} className="text-white" />
                </div>
              )}
              
              {!creditsLoading && (
                <span className="absolute -bottom-1 text-xs text-orange-400 font-medium bg-gray-800 px-1 rounded">
                  {credits}
                </span>
              )}
            </div>
            
          </div>
        </div>
        <br></br>
      </div>
       
      <ProfileImageModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        imageUrl={agentData.avatar_url}
        agentName={agentData.name}
      />
    </div>
  );
};

export default ChatTrialPage;