import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, Send, Loader2, Play, Pause, MicOff, Smile, Gift, ShieldAlert, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useN8nAudioWebhook } from '@/hooks/useN8nAudioWebhook';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import AgentProfileModal from '@/components/AgentProfileModal';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
import AudioMessage from '@/components/AudioMessage';
import VoiceCallButton from '@/components/VoiceCallButton';
import ProfileImageModal from '@/components/ProfileImageModal';
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal'; // IMPORTANDO O NOVO MODAL

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { isTrialActive, loading: profileLoading, hasPlanActive, getPlanName } = useUserProfile();
  const { user } = useAuth();
  const { messages, addMessage, clearMessages, loadMessages } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  const { credits, consumeCredits, initializeCredits, refreshCredits, isLoading: creditsLoading } = useCredits();
      
  const [input, setInput] = useState('');
  const [isAgentProfileModalOpen, setIsAgentProfileModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [showCreditsPurchaseModal, setShowCreditsPurchaseModal] = useState(false); // NOVO ESTADO
  
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
    if (user?.id) {
      initializeCredits(user.id);
      loadMessages(user.id);
    }
  }, [user?.id, initializeCredits, loadMessages]);
  
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);
  
  useEffect(() => {
    if (!user?.id) return;
    const fetchUserAvatar = async () => {
      try {
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (profile?.avatar_url) setUserAvatarUrl(profile.avatar_url);
      } catch (error) { console.error('Erro ao carregar avatar do usuário:', error); }
    };
    fetchUserAvatar();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchAgentData = async () => {
      try {
        const { data: selectedAgent } = await supabase.from('user_selected_agent').select('agent_id').eq('user_id', user.id).single();
        if (selectedAgent) {
          const { data: agent } = await supabase.from('ai_agents').select('id, name, avatar_url').eq('id', selectedAgent.agent_id).single();
          if (agent) setAgentData(agent);
        }
      } catch (error) { console.error('Erro ao carregar dados do agente:', error); }
    };
    fetchAgentData();
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('credit_purchase_success') === 'true') {
        toast.success('Créditos adicionados com sucesso!');
        refreshCredits();
        navigate('/chat/text-audio', { replace: true });
    }
  }, [refreshCredits, navigate]);

  const getAssistantResponse = async (messageText: string) => {
    const userMessage: CachedMessage = { id: Date.now().toString(), type: 'user', transcription: messageText, timestamp: new Date().toISOString() };
    addMessage(userMessage);

    const response = await sendToN8n(messageText);
    if (response) {
      const assistantMessage: CachedMessage = { id: Date.now().toString() + 'a', type: 'assistant', transcription: response, timestamp: new Date().toISOString() };
      addMessage(assistantMessage);
    }
  };

  const getAssistantAudioResponse = async (audioBlob: Blob, url: string) => {
    const userMessage: CachedMessage = { id: Date.now().toString(), type: 'user', audioUrl: url, timestamp: new Date().toISOString() };
    addMessage(userMessage);

    const response = await sendAudioToN8n(audioBlob);
    if (response && response.audioUrl) {
      const assistantMessage: CachedMessage = { id: Date.now().toString() + 'a', type: 'assistant', audioUrl: response.audioUrl, timestamp: new Date().toISOString() };
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

  const handleSendTextMessage = async () => {
    if (input.trim() === '') return;
    getAssistantResponse(input.trim());
    setInput('');
  };
  
  const handleEmoticonClick = () => { setShowEmoticonSelector(!showEmoticonSelector); setShowGiftSelection(false); };
  const handleGiftClick = () => { setShowGiftSelection(!showGiftSelection); setShowEmoticonSelector(false); };
  const handleEmoticonSelect = (emoticon: string) => { setInput(prev => prev + emoticon); setShowEmoticonSelector(false); if (inputRef.current) { inputRef.current.focus(); } };
  
  useEffect(() => { 
    if (audioBlob && audioUrl) { 
      getAssistantAudioResponse(audioBlob, audioUrl);
      resetAudio();
    } 
  }, [audioBlob, audioUrl, resetAudio]);
  
  const handleAudioToggle = async () => {
    const AUDIO_MESSAGE_COST = 1;
    if (isRecording) { 
      stopRecording(); 
    } else {
      if (n8nLoading || audioN8nLoading) return;
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

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendTextMessage(); } };
  const handleAvatarClick = (imageUrl: string, name: string) => { setSelectedImageUrl(imageUrl); setSelectedImageName(name); setIsProfileImageModalOpen(true); };
  const renderMessage = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    return (<AudioMessage key={message.id} id={message.id} content={message.transcription} audioUrl={message.audioUrl} isUser={isUserMessage} timestamp={message.timestamp} isPlaying={currentlyPlaying === message.id} onPlayAudio={() => handlePlayAudio(message.id, message.audioUrl)} onAvatarClick={handleAvatarClick} agentData={agentData} userEmail={user?.email} userAvatarUrl={userAvatarUrl} />);
  };

  if (profileLoading) {
    return (
      <div className="h-screen bg-[#1a1d29] text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
        <p className="ml-4">Verificando seu perfil...</p>
      </div>
    );
  }

  if (!isTrialActive && !hasPlanActive()) {
    return <Navigate to="/plans" />;
  }

  const planName = getPlanName();
  if (planName === 'free' || planName === 'text only') {
      return <Navigate to="/chat/text-only" />;
  }

  const isLoading = n8nLoading || audioN8nLoading || isRecording;

  return (
    <div className="h-screen bg-[#1a1d29] text-white flex flex-col w-full relative overflow-hidden mobile-fullscreen">
      <audio ref={audioRef} />
      <div className="flex items-center justify-between p-4 bg-[#1a1d29] border-b border-blue-800/30 flex-shrink-0 sticky top-0 z-20 pt-safe">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-blue-200 hover:text-white" onClick={() => navigate('/profile')}><ArrowLeft size={20} /></Button>
          <Avatar className="cursor-pointer" onClick={() => handleAvatarClick(agentData.avatar_url, agentData.name)}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-blue-800 text-white">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <span className="font-medium text-white">{agentData.name}</span>
            <span className="text-xs text-blue-300 block">{isLoading ? 'Pensando...' : 'Online'}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setShowCreditsPurchaseModal(true)} variant="ghost" className="text-orange-400 font-bold hover:bg-blue-900/50 hover:text-orange-300 px-3">
            {creditsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${credits} Créditos`}
            <PlusCircle className="ml-2 h-4 w-4"/>
          </Button>
          <VoiceCallButton 
            agentName={agentData.name} 
            agentAvatar={agentData.avatar_url} 
            onRequestVoiceCredits={() => setShowCreditsPurchaseModal(true)} 
          />
          <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hidden sm:flex" onClick={clearMessages}>Limpar Chat</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide touch-pan-y p-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {showEmoticonSelector && (<EmoticonSelector onSelect={handleEmoticonSelect} onClose={() => setShowEmoticonSelector(false)} />)}
      {showGiftSelection && (<GiftSelection recipientId={agentData.id} onClose={() => setShowGiftSelection(false)} />)}
      
      <CreditsPurchaseModal 
        isOpen={showCreditsPurchaseModal}
        onClose={() => setShowCreditsPurchaseModal(false)}
      />
      
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
                className={`flex-shrink-0 w-8 h-8 ${showEmoticonSelector ? 'text-blue-400 bg-blue-900/50' : 'text-blue-200 hover:text-white'}`} 
                disabled={isLoading} 
              >
                <Smile size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGiftClick} 
                className={`flex-shrink-0 w-8 h-8 ${showGiftSelection ? 'text-blue-400 bg-blue-900/50' : 'text-blue-200 hover:text-white'}`} 
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
              className={cn("w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0", isRecording && "bg-red-600 hover:bg-red-700 animate-pulse")}
              onClick={handleAudioToggle}
              disabled={n8nLoading || audioN8nLoading}
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
              <span className="absolute -bottom-1 text-xs text-orange-400 font-medium bg-[#1a1d29] px-1 rounded">
                {credits}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTextAudioPage;