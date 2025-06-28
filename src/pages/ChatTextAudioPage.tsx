import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, Send, Loader2, Play, Pause, MicOff, Smile, Gift, ShieldAlert, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
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
  
  // -> 1. MODIFICAÇÃO: Desestruturando as funções corretas do hook.
  const { hasActiveSubscription, isTrialActive, loading: profileLoading } = useUserProfile();
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
    if (!user?.id) return;

    const fetchUserAvatar = async () => {
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
        }
      } catch (error) {
        console.error('Erro ao carregar avatar do usuário:', error);
      }
    };

    fetchUserAvatar();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchAgentData = async () => {
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

  // Handler para os parâmetros da URL está mantido
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
  }, [refreshCredits, refreshVoiceCredits]); // Adicionei a dependência que faltava aqui para a função 'handleGiftPaymentSuccess'

  const getAssistantResponse = async (messageText: string) => { /* ... sua lógica original ... */ };
  const getAssistantAudioResponse = async (audioBlob: Blob, audioUrl: string) => { /* ... sua lógica original ... */ };
  const handlePlayAudio = (messageId: string, audioUrl: string) => { /* ... sua lógica original ... */ };
  const handleSendTextMessage = async () => { /* ... sua lógica original ... */ };
  const handleEmoticonClick = () => { setShowEmoticonSelector(!showEmoticonSelector); setShowGiftSelection(false); };
  const handleGiftClick = () => { setShowGiftSelection(!showGiftSelection); setShowEmoticonSelector(false); };
  const handleEmoticonSelect = (emoticon: string) => { setInput(prev => prev + emoticon); setShowEmoticonSelector(false); if (inputRef.current) { inputRef.current.focus(); } };
  const handleGiftSelect = async (giftId: string, giftName: string, giftPrice: number) => { /* ... sua lógica original ... */ };
  const handleGiftPaymentSuccess = (giftId: string, giftName: string) => { /* ... sua lógica original ... */ };
  useEffect(() => { if (audioBlob && audioUrl) { processAudioMessage(audioBlob, audioUrl); } }, [audioBlob, audioUrl]);
  const processAudioMessage = async (blob: Blob, url: string) => { /* ... sua lógica original ... */ };
  const handleAudioToggle = async () => { /* ... sua lógica original ... */ };
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendTextMessage(); } };
  const handleAvatarClick = (imageUrl: string, name: string) => { setSelectedImageUrl(imageUrl); setSelectedImageName(name); setIsProfileImageModalOpen(true); };
  const renderMessage = (message: CachedMessage) => { /* ... sua lógica original ... */ };

  // -> 2. MODIFICAÇÃO: Bloco de lógica de acesso com a ordem de prioridade correta.
  if (profileLoading) {
    return (
      <div className="h-screen bg-[#1a1d29] text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
        <p className="ml-4">Verificando seu perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#1a1d29] text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
        <Button onClick={() => navigate('/login')} className="ml-4">Login</Button>
      </div>
    );
  }

  // Lógica de prioridade: Plano Pago > Trial
  if (hasActiveSubscription()) {
    // Acesso permitido, o código continua e renderiza o JSX abaixo.
  } else if (isTrialActive()) {
    // Não tem plano pago, mas tem trial -> redireciona.
    return <Navigate to="/chat-trial" replace />;
  } else {
    // Não tem plano pago e não tem trial -> redireciona (fallback).
    return <Navigate to="/chat-trial" replace />;
  }
  
  const isProcessing = n8nLoading || audioN8nLoading;
  const isLoading = isProcessing || isRecording;

  return (
    <div className="h-screen bg-[#1a1d29] text-white flex flex-col w-full relative overflow-hidden mobile-fullscreen">
      <style>{`
        /* ... seus estilos ... */
      `}</style>
      
      {/* Todo o seu JSX original é mantido abaixo */}
      <div className="flex items-center justify-between p-4 bg-[#1a1d29] border-b border-blue-800/30 flex-shrink-0 sticky top-0 z-20 pt-safe">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-200 hover:text-white hover:bg-blue-900/50"
            onClick={() => navigate('/profile')}
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
            className="text-blue-200 hover:text-white hover:bg-blue-900/50 hidden sm:flex"
            onClick={clearMessages}
          >
            Limpar Chat
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide touch-pan-y p-4" style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showEmoticonSelector && (<EmoticonSelector onSelect={handleEmoticonSelect} onClose={() => setShowEmoticonSelector(false)} />)}
      {showGiftSelection && (<GiftSelection onClose={() => setShowGiftSelection(false)} onSelectGift={handleGiftSelect} />)}
      <AudioCreditsModal isOpen={showCreditsModal} onClose={() => setShowCreditsModal(false)} currentCredits={credits} />
      <AgentProfileModal isOpen={isAgentProfileModalOpen} onClose={() => setIsAgentProfileModalOpen(false)} agentId={agentData.id} />
      <ProfileImageModal isOpen={isProfileImageModalOpen} onClose={() => setIsProfileImageModalOpen(false)} imageUrl={selectedImageUrl} agentName={selectedImageName} />
      
      <div className="p-4 bg-[#1a1d29] border-t border-blue-800/30 flex-shrink-0 sticky bottom-0 z-20 pb-safe">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-[#2F3349] rounded-full px-4 py-2 flex items-center space-x-2">
            <Input 
              ref={inputRef} 
              className="bg-transparent border-0 text-white placeholder:text-blue-300 focus-visible:ring-0 focus-visible:ring-offset-0 px-0" 
              placeholder="Digite uma mensagem..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleKeyPress} 
              disabled={isLoading} 
            />
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleEmoticonClick} 
                className={`flex-shrink-0 w-8 h-8 ${ 
                  showEmoticonSelector ? 'text-blue-400 bg-blue-900/50' : 'text-blue-200 hover:text-white hover:bg-blue-900/50' 
                }`} 
                disabled={isLoading} 
              >
                <Smile size={16} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGiftClick} 
                className={`flex-shrink-0 w-8 h-8 ${ 
                  showGiftSelection ? 'text-blue-400 bg-blue-900/50' : 'text-blue-200 hover:text-white hover:bg-blue-900/50' 
                }`} 
                disabled={isLoading} 
              >
                <Gift size={16} />
              </Button>
            </div>
          </div>
          
          <div className="relative flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0",
                isRecording && "bg-red-600 hover:bg-red-700 animate-pulse",
                !hasCredits && "opacity-50"
              )}
              onClick={handleAudioToggle}
              disabled={isProcessing}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>
            {!creditsLoading && (
              <span className="absolute -bottom-1 text-xs text-orange-400 font-medium bg-[#1a1d29] px-1 rounded">
                {credits}
              </span>
            )}
            
          </div>
        </div>
      </div>
      <br></br>
    </div>
  );
};

export default ChatTextAudioPage;