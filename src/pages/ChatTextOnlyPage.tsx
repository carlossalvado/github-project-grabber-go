import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { useUserCache } from '@/hooks/useUserCache';
import { ArrowLeft, Phone, Video, Mic, MicOff, Send, Smile, Gift, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModernMessage {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'image' | 'audio' | 'gift';
  images?: string[];
  audioDuration?: string;
  audioUrl?: string;
  giftId?: string;
  giftName?: string;
  giftEmoji?: string;
}

const ChatTextOnlyPage = () => {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const { plan } = useUserCache();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const contactName = "Charlotte";
  const contactAvatar = "https://i.imgur.com/placeholder-woman.jpg";
  const [messages, setMessages] = useState<ModernMessage[]>([]);
  const planName = "Text Only";
  const webhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d9739-ohasd-5-pijasd54-asd42";

  // Verificar acesso ao plano usando Supabase
  useEffect(() => {
    const checkPlanAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        console.log('🔍 Verificando acesso ao plano Text Only no Supabase...');
        
        // Verificar plano no Supabase
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('plan_name, plan_active')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Erro ao consultar perfil:', error);
          // Fallback para dados do cache
          const userPlanName = plan?.plan_name || userSubscription?.plan_name;
          const hasCorrectPlan = userPlanName?.toLowerCase().includes('text only');
          
          if (!hasCorrectPlan) {
            toast.error('Acesso negado. Você precisa do plano Text Only para acessar esta página.');
            navigate('/profile');
            return;
          }
        } else {
          // Usar dados do Supabase
          const userPlanName = profileData?.plan_name;
          const userPlanActive = profileData?.plan_active;
          const hasCorrectPlan = userPlanActive && userPlanName?.toLowerCase().includes('text only');
          
          if (!hasCorrectPlan) {
            console.log('❌ Acesso negado. Plano atual:', userPlanName, 'Ativo:', userPlanActive);
            toast.error('Acesso negado. Você precisa do plano Text Only para acessar esta página.');
            navigate('/profile');
            return;
          }
          
          console.log('✅ Acesso liberado para plano Text Only');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar acesso:', error);
        toast.error('Erro ao verificar acesso. Redirecionando para o perfil.');
        navigate('/profile');
      }
    };

    checkPlanAccess();
  }, [user, plan, userSubscription, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio references on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Use webm format with opus codec for better compatibility
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };
      
      // Fallback if webm is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        handleAudioProcessing();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Gravação iniciada');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcessing = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    toast.info('Processando áudio...');
    
    try {
      // Create audio blob from recorded chunks with WEBM_OPUS format
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });
      
      console.log('📤 Enviando áudio para processamento:', {
        size: audioBlob.size,
        type: audioBlob.type,
        format: 'WEBM_OPUS'
      });
      
      // Convert audio blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get only the base64 content
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      // Prepare JSON payload in the required format
      const payload = {
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 16000,
          languageCode: "pt-BR"
        },
        audio: {
          content: base64Audio
        }
      };
      
      console.log('📦 Payload preparado:', {
        encoding: payload.config.encoding,
        sampleRate: payload.config.sampleRateHertz,
        language: payload.config.languageCode,
        audioContentLength: payload.audio.content.length
      });
      
      // Send to n8n webhook with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erro na resposta do servidor: ${response.status} - ${response.statusText}`);
        }
        
        console.log('📥 Resposta recebida do webhook:', {
          status: response.status,
          contentType: response.headers.get('content-type')
        });
        
        // Check if response contains audio data
        const responseData = await response.json();
        
        if (responseData.audio && responseData.audio.content) {
          // Convert base64 response back to audio blob
          const responseAudioData = responseData.audio.content;
          const binaryString = atob(responseAudioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const responseAudioBlob = new Blob([bytes], { 
            type: 'audio/webm;codecs=opus' 
          });
          
          console.log('🎵 Blob de áudio recebido:', {
            size: responseAudioBlob.size,
            type: responseAudioBlob.type
          });
          
          if (responseAudioBlob.size === 0) {
            throw new Error('Arquivo de áudio vazio recebido');
          }
          
          // Create object URLs for both user and contact messages
          const userAudioUrl = URL.createObjectURL(audioBlob);
          const contactAudioUrl = URL.createObjectURL(responseAudioBlob);
          
          // Add user message
          const userMessage: ModernMessage = {
            id: Date.now().toString(),
            content: 'Mensagem de voz enviada',
            sender: 'user',
            timestamp: new Date(),
            type: 'audio',
            audioUrl: userAudioUrl
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Add contact response message
          const contactMessage: ModernMessage = {
            id: (Date.now() + 1).toString(),
            content: 'Resposta de voz recebida',
            sender: 'contact',
            timestamp: new Date(),
            type: 'audio',
            audioUrl: contactAudioUrl
          };
          
          setMessages(prev => [...prev, contactMessage]);
          
          // Auto-play the response after a short delay
          setTimeout(() => {
            playAudio(contactMessage.id, contactAudioUrl);
          }, 500);
          
          toast.success('Mensagem de voz processada com sucesso');
          
        } else {
          // Handle text response if no audio is returned
          const textResponse = responseData.text || 'Resposta recebida sem áudio';
          
          // Add user audio message
          const userAudioUrl = URL.createObjectURL(audioBlob);
          const userMessage: ModernMessage = {
            id: Date.now().toString(),
            content: 'Mensagem de voz enviada',
            sender: 'user',
            timestamp: new Date(),
            type: 'audio',
            audioUrl: userAudioUrl
          };
          
          setMessages(prev => [...prev, userMessage]);
          
          // Add text response message
          const contactMessage: ModernMessage = {
            id: (Date.now() + 1).toString(),
            content: textResponse,
            sender: 'contact',
            timestamp: new Date(),
            type: 'text'
          };
          
          setMessages(prev => [...prev, contactMessage]);
          
          toast.success('Mensagem processada com sucesso');
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
      
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      
      let errorMessage = 'Erro ao processar mensagem de voz';
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: O servidor demorou muito para responder';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão: Verifique sua internet ou tente novamente';
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
      
      // Add a simple text message indicating the error
      const errorMessage2: ModernMessage = {
        id: Date.now().toString(),
        content: 'Erro ao processar áudio. Tente novamente.',
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage2]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (messageId: string, audioUrl: string) => {
    try {
      // Stop any currently playing audio
      if (playingAudioId) {
        const currentAudio = audioRefs.current.get(playingAudioId);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      
      // Get or create audio element for this message
      let audio = audioRefs.current.get(messageId);
      if (!audio) {
        audio = new Audio();
        audioRefs.current.set(messageId, audio);
      }
      
      // Set audio source and configure events
      audio.src = audioUrl;
      setPlayingAudioId(messageId);
      
      audio.onended = () => {
        setPlayingAudioId(null);
      };
      
      audio.onerror = (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        setPlayingAudioId(null);
        toast.error('Erro ao reproduzir áudio');
      };
      
      audio.onloadeddata = () => {
        console.log('🎵 Áudio carregado com sucesso');
      };
      
      // Play the audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Erro ao reproduzir áudio:', error);
          setPlayingAudioId(null);
          toast.error('Erro ao reproduzir áudio');
        });
      }
      
    } catch (error) {
      console.error('Erro ao configurar reprodução de áudio:', error);
      setPlayingAudioId(null);
      toast.error('Erro ao reproduzir áudio');
    }
  };

  const stopAudio = (messageId: string) => {
    const audio = audioRefs.current.get(messageId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setPlayingAudioId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: ModernMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (isMobile && inputRef.current) {
      inputRef.current.blur();
    }

    setTimeout(() => {
      const contactMessage: ModernMessage = {
        id: (Date.now() + 1).toString(),
        content: `Olá! Recebi sua mensagem: "${userMessage.content}"`,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, contactMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
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
      setIsLoading(true);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile loading component
  const MobileLoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%] space-y-1">
        <div className="bg-gray-700 text-white rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-300">digitando...</span>
          </div>
        </div>
      </div>
    </div>
  );

  const AudioMessage = ({ message }: { message: ModernMessage }) => {
    const isPlaying = playingAudioId === message.id;
    
    return (
      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        {message.sender === 'contact' && (
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
            <AvatarImage src={contactAvatar} alt={contactName} />
            <AvatarFallback className="bg-purple-600 text-white">
              {contactName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl max-w-[70%] ${
          message.sender === 'user' 
            ? 'bg-purple-600 text-white rounded-br-md' 
            : 'bg-gray-700 text-white rounded-bl-md'
        }`}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-current hover:bg-white/20"
            onClick={() => {
              if (isPlaying) {
                stopAudio(message.id);
              } else if (message.audioUrl) {
                playAudio(message.id, message.audioUrl);
              }
            }}
            disabled={!message.audioUrl}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <div className="flex-1">
            <div className="text-sm">{message.content}</div>
            <div className="text-xs opacity-70 mt-1">
              {formatTime(message.timestamp)}
            </div>
          </div>
          
          {isPlaying && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
        
        {message.sender === 'user' && (
          <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
            <AvatarFallback className="bg-gray-300 text-gray-600">
              EU
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="text-white hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={contactAvatar} alt={contactName} />
            <AvatarFallback className="bg-purple-600 text-white">
              {contactName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-lg">{contactName}</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-600 px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-white">{planName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 cursor-not-allowed"
              disabled
            >
              <Phone size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 cursor-not-allowed"
              disabled
            >
              <Video size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Comece uma conversa!</p>
                  <p className="text-sm">Digite uma mensagem ou grave um áudio para {contactName}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    Hoje
                  </span>
                </div>
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'audio' ? (
                      <AudioMessage message={message} />
                    ) : (
                      <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                        {message.sender === 'contact' && (
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                            <AvatarImage src={contactAvatar} alt={contactName} />
                            <AvatarFallback className="bg-purple-600 text-white">
                              {contactName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={`max-w-[70%] space-y-1`}>
                          <div className={`px-4 py-3 rounded-2xl ${
                            message.sender === 'user' 
                              ? 'bg-purple-600 text-white rounded-br-md' 
                              : 'bg-gray-700 text-white rounded-bl-md'
                          }`}>
                            <div className="text-sm">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        {message.sender === 'user' && (
                          <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                            <AvatarFallback className="bg-gray-300 text-gray-600">
                              EU
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && <MobileLoadingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="px-4 py-2 bg-yellow-600 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processando áudio...</span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12 rounded-full"
              disabled={isLoading || isRecording || isProcessing}
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEmoticonClick}
            className="flex-shrink-0 text-gray-400 hover:text-white hover:bg-gray-700"
            disabled={isRecording || isProcessing}
          >
            <Smile size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGiftClick}
            className="flex-shrink-0 text-gray-400 hover:text-white hover:bg-gray-700"
            disabled={isRecording || isProcessing}
          >
            <Gift size={20} />
          </Button>
          
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-shrink-0 ${isRecording ? 'animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          
          <Button
            size="icon"
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full flex-shrink-0"
            disabled={!input.trim() || isLoading || isRecording || isProcessing}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>

      {/* Emoticon Selector */}
      {showEmoticonSelector && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <EmoticonSelector 
            onSelect={handleEmoticonSelect}
            onClose={() => setShowEmoticonSelector(false)}
          />
        </div>
      )}

      {/* Gift Selection */}
      {showGiftSelection && (
        <div className="absolute inset-0 z-10">
          <GiftSelection 
            onClose={() => setShowGiftSelection(false)}
            onSelectGift={handleGiftSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ChatTextOnlyPage;
