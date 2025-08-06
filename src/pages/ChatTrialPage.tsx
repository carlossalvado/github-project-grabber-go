import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Send, Loader2, Play, Pause, MicOff, Smile, Gift, ShieldAlert, PlusCircle, Clock, AlertTriangle, Camera, Bot, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useN8nAudioWebhook } from '@/hooks/useN8nAudioWebhook';
import { useCredits } from '@/hooks/useCredits';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection, { Gift as GiftType } from '@/components/GiftSelection';
import AudioMessage from '@/components/AudioMessage';
import VoiceCallButton from '@/components/VoiceCallButton';
import ProfileImageModal from '@/components/ProfileImageModal';
import CreditsPurchaseModal from '@/components/CreditsPurchaseModal';
import AgentProfileModal from '@/components/AgentProfileModal';
import { useTrialManager } from '@/hooks/useTrialManager';
import TrialTimer from '@/components/TrialTimer';
import { useSubscription } from '@/contexts/SubscriptionContext';
import PhotoSelectionModal, { AgentPhoto } from '@/components/PhotoSelectionModal';

const ChatTrialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, clearMessages, loadMessages } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  const { credits, consumeCredits, initializeCredits, refreshCredits, isLoading: creditsLoading } = useCredits();
  const { isTrialActive, hoursRemaining, loading: trialLoading } = useTrialManager();
  const { selectTextAudioPlan } = useSubscription();

  const [input, setInput] = useState('');
  const [isAgentProfileModalOpen, setIsAgentProfileModalOpen] = useState(false);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showCreditsPurchaseModal, setShowCreditsPurchaseModal] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');
  const [agentData, setAgentData] = useState({
    id: '',
    name: 'Isa',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  // --- ADIÇÕES PARA FOTOS ---
  const [showPhotoSelectionModal, setShowPhotoSelectionModal] = useState(false);
  const [isSendingPhoto, setIsSendingPhoto] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxTrialMessages = 10;

  useEffect(() => {
    if (user?.id) {
      initializeCredits(user.id);
      loadMessages(user.id);
    }
  }, [user?.id, initializeCredits, loadMessages]);

  useEffect(() => {
    setMessageCount(messages.filter(m => m.type === 'user').length);
  }, [messages]);
  
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
        navigate('/chat-trial', { replace: true });
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
    const userMessage: CachedMessage = { id: Date.now().toString(), type: 'user', transcription: '', audioUrl: url, timestamp: new Date().toISOString() };
    addMessage(userMessage);
    const response = await sendAudioToN8n(audioBlob);
    if (response && response.audioUrl) {
      const assistantMessage: CachedMessage = { id: Date.now().toString() + 'a', type: 'assistant', audioUrl: response.audioUrl, transcription: response.text || '', timestamp: new Date().toISOString() };
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
  
  const handleSendMessage = async () => {
    if (!input.trim() || n8nLoading || !user || !isTrialActive) return;
    if (messageCount >= maxTrialMessages) {
      toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
      return;
    }
    await getAssistantResponse(input.trim());
    setInput('');
  };

  const handleGiftSend = async (gift: GiftType) => {
    setShowGiftSelection(false);
    if (messageCount >= maxTrialMessages) {
      toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
      return;
    }
    const creditsConsumed = await consumeCredits(gift.credit_cost);
    if (!creditsConsumed) {
      toast.error("Créditos insuficientes. Por favor, recarregue.");
      setShowCreditsPurchaseModal(true);
      return;
    }
    const giftMessageText = `🎁 Presente enviado: ${gift.name} ${gift.image_url}`;
    await getAssistantResponse(giftMessageText);
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

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const handleAvatarClick = (imageUrl: string, name: string) => { setSelectedImageUrl(imageUrl); setSelectedImageName(name); setIsProfileImageModalOpen(true); };
  const handleGoBack = () => navigate('/profile');
  const handleUpgrade = async () => await selectTextAudioPlan();
  
  const handlePhotoSend = async (photo: AgentPhoto) => {
    if (messageCount >= maxTrialMessages) {
      toast.error('Limite de interações do trial atingido! Faça upgrade para continuar.');
      return;
    }
    setIsSendingPhoto(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-agent-photo', { body: { photo_id: photo.id } });
      if (error) {
        let errorMsg = "Erro ao desbloquear a foto.";
        try { const errorBody = JSON.parse(error.context.text); errorMsg = errorBody.error || errorMsg; } catch(e) {}
        throw new Error(errorMsg);
      }
      const photoTextMessage = `PHOTO::${data.photo_url}`;
      const photoMessage: CachedMessage = { id: Date.now().toString(), type: 'assistant', transcription: photoTextMessage, timestamp: new Date().toISOString() };
      addMessage(photoMessage);
      await refreshCredits();
      toast.success('Foto desbloqueada com sucesso!');
      const followUpMessage = "isa você enviou uma foto, pergunta se o usuario gostou";
      const response = await sendToN8n(followUpMessage);
      if (response) {
        const assistantMessage: CachedMessage = { id: Date.now().toString() + 'a', type: 'assistant', transcription: response, timestamp: new Date().toISOString() };
        addMessage(assistantMessage);
      }
    } catch (error: any) {
      console.error("Erro ao solicitar foto:", error);
      toast.error(error.message === 'Créditos insuficientes.' ? 'Créditos insuficientes!' : error.message);
    } finally {
      setIsSendingPhoto(false);
    }
  };
  
  const renderMessage = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    const isPhotoMessage = message.transcription.startsWith('PHOTO::');
    if (isPhotoMessage) {
      const imageUrl = message.transcription.split('::')[1];
      const messageContainerClasses = "flex items-end gap-2";
      const bubbleClasses = "flex w-fit max-w-[80%] flex-col gap-2 rounded-lg p-2 text-sm bg-gray-700";
      return (
        <div key={message.id} className={messageContainerClasses}>
          <Avatar className="h-8 w-8 cursor-pointer self-end" onClick={() => handleAvatarClick(agentData.avatar_url, agentData.name)}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-orange-600"><Bot size={16} /></AvatarFallback>
          </Avatar>
          <div className={bubbleClasses}><div className="rounded-lg overflow-hidden"><img src={imageUrl} alt="Foto exclusiva" className="max-w-full h-auto cursor-pointer" onClick={() => handleAvatarClick(imageUrl, 'Foto Exclusiva')} /></div></div>
        </div>
      );
    }
    return (<AudioMessage key={message.id} id={message.id} content={message.transcription} audioUrl={message.audioUrl} isUser={isUserMessage} timestamp={message.timestamp} isPlaying={currentlyPlaying === message.id} onPlayAudio={() => handlePlayAudio(message.id, message.audioUrl)} onAvatarClick={handleAvatarClick} agentData={agentData} userEmail={user?.email} userAvatarUrl={userAvatarUrl} />);
  };

  const remainingMessages = maxTrialMessages - messageCount;
  
  if (trialLoading) {
    return (<div className="h-screen bg-[#1a1d29] text-white flex items-center justify-center"><Loader2 className="animate-spin" size={32} /><p className="ml-4">Verificando seu trial...</p></div>);
  }

  if (!isTrialActive) {
    return (<div className="h-screen bg-gray-900 text-white flex items-center justify-center p-4"><div className="text-center"><AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Trial Expirado</h2><p className="text-gray-300 mb-6">Seu trial de 72 horas expirou. Faça upgrade para continuar!</p><div className="mt-8 flex flex-col items-center gap-4 w-full px-4"><Button onClick={handleUpgrade} className="w-full max-w-xs bg-orange-600 hover:bg-orange-700 font-semibold">Fazer Upgrade</Button><Button onClick={handleGoBack} variant="outline" className="w-full max-w-xs border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white">Voltar para o Perfil</Button></div></div></div>);
  }

  const isProcessing = n8nLoading || audioN8nLoading || isSendingPhoto;
  const isLoading = isProcessing || isRecording;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative overflow-hidden mobile-fullscreen" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <audio ref={audioRef} />
      <TrialTimer />
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0 sticky top-0 z-20 pt-safe">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleGoBack}><ArrowLeft size={20} /></Button>
          <Avatar className="cursor-pointer" onClick={() => handleAvatarClick(agentData.avatar_url, agentData.name)}>
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-orange-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium" onClick={() => setIsAgentProfileModalOpen(true)}>{agentData.name}</span>
            <Badge variant="secondary" className="text-xs bg-orange-600 text-white"><Clock size={12} className="mr-1" />Trial - {hoursRemaining}h restantes</Badge>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => setShowPhotoSelectionModal(true)} variant="ghost" className="text-blue-200 font-bold hover:bg-gray-700 hover:text-white px-3" disabled={isLoading || remainingMessages <= 0}>
            {isSendingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4"/>}
            <span className="ml-2 hidden sm:inline">Solicitar Foto</span>
          </Button>
          <Button onClick={() => setShowCreditsPurchaseModal(true)} variant="ghost" className="text-orange-400 font-bold hover:bg-gray-700 hover:text-orange-300 px-3">
            {creditsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${credits} Créditos`}
            <PlusCircle className="ml-2 h-4 w-4"/>
          </Button>
          <VoiceCallButton agentName={agentData.name} agentAvatar={agentData.avatar_url} onRequestVoiceCredits={() => setShowCreditsPurchaseModal(true)} />
        </div>
      </div>
      <div className="w-full flex justify-center items-center py-2 px-4 bg-gray-800 border-b border-gray-700">
        <Button onClick={handleUpgrade} className="bg-orange-600 hover:bg-orange-700 text-white w-full max-w-sm font-semibold" size="sm">Fazer Upgrade Agora</Button>
      </div>
      {(hoursRemaining <= 12 || remainingMessages <= 3) && remainingMessages > 0 && (
        <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center flex-shrink-0">
          <p className="text-orange-300 text-sm">⚠️ {remainingMessages <= 3 ? `${remainingMessages} mensagens restantes` : `${hoursRemaining} horas restantes no seu trial`}. <Button variant="link" className="text-orange-400 underline p-0 ml-1 h-auto" onClick={handleUpgrade}>Faça upgrade agora!</Button></p>
        </div>
      )}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide touch-pan-y p-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <CreditsPurchaseModal isOpen={showCreditsPurchaseModal} onClose={() => setShowCreditsPurchaseModal(false)} />
      {showEmoticonSelector && (<EmoticonSelector onSelect={handleEmoticonSelect} onClose={() => setShowEmoticonSelector(false)} />)}
      {showGiftSelection && (<GiftSelection onGiftSend={handleGiftSend} onClose={() => setShowGiftSelection(false)} />)}
      <PhotoSelectionModal isOpen={showPhotoSelectionModal} onClose={() => setShowPhotoSelectionModal(false)} onPhotoSend={handlePhotoSend} agentId={agentData.id} />
      <AgentProfileModal isOpen={isAgentProfileModalOpen} onClose={() => setIsAgentProfileModalOpen(false)} agentId={agentData.id} />
      <ProfileImageModal isOpen={isProfileImageModalOpen} onClose={() => setIsProfileImageModalOpen(false)} imageUrl={selectedImageUrl} agentName={selectedImageName} />
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0 sticky bottom-0 z-20 pb-safe">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-700 rounded-full px-4 py-2 flex items-center space-x-2">
            <Input 
              ref={inputRef} 
              className="bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0" 
              placeholder={remainingMessages > 0 ? "Digite uma mensagem..." : "Trial expirado - Faça upgrade para continuar"}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={handleKeyPress} 
              disabled={isLoading || remainingMessages <= 0} 
            />
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" onClick={handleEmoticonClick} className={`flex-shrink-0 w-8 h-8 ${showEmoticonSelector ? 'text-orange-400 bg-gray-600' : 'text-gray-400 hover:text-orange-400'}`} disabled={isLoading || remainingMessages <= 0}><Smile size={16} /></Button>
              <Button type="button" variant="ghost" size="icon" onClick={handleGiftClick} className={`flex-shrink-0 w-8 h-8 ${showGiftSelection ? 'text-orange-400 bg-gray-600' : 'text-gray-400 hover:text-orange-400'}`} disabled={isLoading || remainingMessages <= 0}><Gift size={16} /></Button>
            </div>
          </div>
          
          <div className="relative flex flex-col items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0", isRecording && "bg-red-600 hover:bg-red-700 animate-pulse")}
              onClick={handleAudioToggle}
              disabled={isProcessing || remainingMessages <= 0}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>
            {credits <= 0 && !isRecording && (
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full cursor-pointer flex items-center justify-center" onClick={() => setShowCreditsPurchaseModal(true)}>
                <ShieldAlert size={16} className="text-white" />
              </div>
            )}
            {!creditsLoading && (
              <span className="absolute -bottom-1 text-xs text-orange-400 font-medium bg-gray-800 px-1 rounded">{credits}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTrialPage;