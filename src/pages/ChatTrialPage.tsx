import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Clock, AlertTriangle, Smile, Gift, Mic, MicOff, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useN8nAudioWebhook } from '@/hooks/useN8nAudioWebhook';
import { useTrialManager } from '@/hooks/useTrialManager';
import { supabase } from '@/integrations/supabase/client';
import ProfileImageModal from '@/components/ProfileImageModal';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { cn } from '@/lib/utils';
import TrialTimer from '@/components/TrialTimer';

const ChatTrialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, updateMessage } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  const { sendAudioToN8n, isLoading: audioN8nLoading } = useN8nAudioWebhook();
  const { isTrialActive, hoursRemaining, loading: trialLoading } = useTrialManager();
  const { isRecording, startRecording, stopRecording, audioBlob, resetAudio, audioUrl } = useAudioRecording();
  
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [agentData, setAgentData] = useState({
    name: 'Isa',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxTrialMessages = 10;

  // Verificar se o trial expirou
  useEffect(() => {
    if (!trialLoading && !isTrialActive && user) {
      toast.error('Seu trial de 72 horas expirou! Faça upgrade para continuar conversando.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [isTrialActive, trialLoading, user, navigate]);

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

  // Check for gift success/cancel parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const giftSuccess = urlParams.get('gift_success');
    const giftId = urlParams.get('gift_id');
    const giftName = urlParams.get('gift_name');
    const giftCanceled = urlParams.get('gift_canceled');
    
    if (giftSuccess === 'true' && giftId && giftName) {
      handleGiftPaymentSuccess(giftId, decodeURIComponent(giftName));
      // Clean URL
      window.history.replaceState({}, document.title, '/chat-trial');
    }
    
    if (giftCanceled === 'true') {
      toast.error('Compra de presente cancelada');
      // Clean URL
      window.history.replaceState({}, document.title, '/chat-trial');
    }
  }, []);

  const handleAvatarClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleGoBack = () => {
    navigate('/profile');
  };

  const handleUpgrade = async () => {
    try {
      // Buscar o plano "Text & Audio" na base de dados
      const { data: plans, error } = await supabase
        .from('plans')
        .select('id, name')
        .ilike('name', '%text%audio%')
        .single();

      if (error || !plans) {
        console.error('Erro ao buscar plano Text & Audio:', error);
        // Fallback: usar ID 2 se não encontrar
        navigate('/plan/2');
        return;
      }

      // Redirecionar para a página do plano Text & Audio
      navigate(`/plan/${plans.id}`);
    } catch (error) {
      console.error('Erro ao processar upgrade:', error);
      // Fallback: usar ID 2 se houver erro
      navigate('/plan/2');
    }
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
    // Get gift emoji mapping
    const giftEmojis: { [key: string]: string } = {
      "00000000-0000-0000-0000-000000000001": "🌹",
      "00000000-0000-0000-0000-000000000002": "🍫", 
      "00000000-0000-0000-0000-000000000003": "🧸",
      "00000000-0000-0000-0000-000000000004": "💐"
    };

    // Add gift message to chat
    addMessage({
      type: 'user',
      transcription: `Enviou um presente: ${giftName} ${giftEmojis[giftId] || '🎁'}`,
      timestamp: new Date().toISOString()
    });
    
    toast.success(`Presente ${giftName} enviado com sucesso!`);

    // Simulate assistant response
    setTimeout(() => {
      addMessage({
        type: 'assistant',
        transcription: `Que presente lindo! Muito obrigada pelo ${giftName}! ${giftEmojis[giftId] || '🎁'} ❤️`,
        timestamp: new Date().toISOString()
      });
    }, 1500);
  };

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

  const getAssistantAudioResponse = async (audioBlob: Blob, audioUrl: string) => {
    if (!user) return;
    try {
      const result = await sendAudioToN8n(audioBlob, user.email!);
      
      const assistantMessageId = addMessage({
        type: 'assistant',
        transcription: result.text,
        timestamp: new Date().toISOString(),
        audioUrl: result.audioUrl
      });

      if (result.audioUrl) {
        handlePlayAudio(assistantMessageId, result.audioUrl);
      }

    } catch (error: any) {
      console.error('Error generating audio response:', error);
      addMessage({
        type: 'assistant',
        transcription: `Desculpe, ocorreu um erro ao processar seu áudio.`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleAudioToggle = async () => {
    if (isRecording) {
        stopRecording();
    } else {
        if (n8nLoading || audioN8nLoading) return;
        if (messageCount >= maxTrialMessages) {
          toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
          return;
        }
        startRecording();
    }
  };

  useEffect(() => {
    if (audioBlob && audioUrl) {
      processAudioMessage(audioBlob, audioUrl);
    }
  }, [audioBlob, audioUrl]);

  const processAudioMessage = async (blob: Blob, url: string) => {
    if (!user) return;

    setMessageCount(prev => prev + 1);
    toast.info("Processando seu áudio...");

    const userMessageId = addMessage({
        type: 'user',
        timestamp: new Date().toISOString(),
        audioUrl: url,
        transcription: 'Processando áudio...'
    });

    try {
      await getAssistantAudioResponse(blob, url);
      updateMessage(userMessageId, { transcription: 'Áudio enviado' });
      resetAudio();
    } catch (error) {
      console.error('Audio processing error:', error);
      toast.error('Erro ao processar o áudio.');
      updateMessage(userMessageId, { transcription: '(Erro no processamento do áudio)' });
      resetAudio();
    }
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

  if (!isTrialActive) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Trial Expirado</h2>
          <p className="text-gray-300 mb-6">Seu trial de 72 horas expirou. Faça upgrade para continuar!</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Escolher Plano
          </Button>
        </div>
      </div>
    );
  }

  const isProcessing = n8nLoading || audioN8nLoading;
  const isLoading = isProcessing || isRecording;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative">
      {/* Trial Timer - Apenas para usuários trial */}
      <TrialTimer />

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={handleGoBack}
          >
            <ArrowLeft size={20} />
          </Button>
          <Avatar className="cursor-pointer" onClick={handleAvatarClick}>
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
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-400 hover:text-orange-300"
          onClick={handleUpgrade}
        >
          Fazer Upgrade
        </Button>
      </div>

      {/* Trial Warning */}
      {(hoursRemaining <= 12 || remainingMessages <= 3) && (
        <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center">
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
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isUserMessage = message.type === 'user';
              
              return (
                <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                  {!isUserMessage && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
                      <AvatarFallback className="bg-orange-600 text-white">
                        {agentData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-md ${
                      isUserMessage 
                        ? 'bg-orange-600 text-white rounded-br-none' 
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap break-words text-sm">{message.transcription}</p>
                      {message.audioUrl && (
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
            })}
          </div>
          
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

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "flex-shrink-0 text-gray-400 hover:text-orange-400",
            isRecording && "text-red-500 hover:text-red-600 animate-pulse"
          )}
          onClick={handleAudioToggle}
          disabled={isProcessing || !isTrialActive || remainingMessages <= 0}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Input
          ref={inputRef}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-orange-500"
          placeholder={
            isTrialActive && remainingMessages > 0 
              ? "Digite uma mensagem ou use o áudio..." 
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEmoticonClick}
          className={`flex-shrink-0 ${
            showEmoticonSelector 
              ? 'text-orange-400 bg-gray-700' 
              : 'text-gray-400 hover:text-orange-400'
          }`}
          disabled={n8nLoading || !isTrialActive || remainingMessages <= 0}
        >
          <Smile size={20} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGiftClick}
          className={`flex-shrink-0 ${
            showGiftSelection 
              ? 'text-orange-400 bg-gray-700' 
              : 'text-gray-400 hover:text-orange-400'
          }`}
          disabled={n8nLoading || !isTrialActive || remainingMessages <= 0}
        >
          <Gift size={20} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-orange-400"
          onClick={handleSendMessage}
          disabled={!input.trim() || n8nLoading || !isTrialActive || remainingMessages <= 0}
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

export default ChatTrialPage;
