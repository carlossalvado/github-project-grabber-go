
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Mic, MicOff, Send, Smile, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { elevenLabsService } from '@/services/elevenLabsService';
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

const ChatTextAudioPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const isMobile = useIsMobile();
  
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  } = useAudioRecording();
  
  const contactName = "Charlotte";
  const contactAvatar = "https://i.imgur.com/placeholder-woman.jpg";
  const [messages, setMessages] = useState<ModernMessage[]>([]);
  const planName = "Text & Audio";
  const textWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook/d973werwer9-ohasd-5-pijaswerwerd54-asd4245645";

  // Verificar acesso ao plano via Supabase
  useEffect(() => {
    const checkPlanAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Verificar subscription ativa
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('plan_name, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (subError && subError.code !== 'PGRST116') {
          console.error('Erro ao consultar subscription:', subError);
          throw subError;
        }

        let hasAccess = false;
        let userPlanName = subscription?.plan_name;

        // Se encontrou subscription ativa, verificar se é o plano correto
        if (userPlanName) {
          hasAccess = userPlanName === 'Text & Audio' || 
                     userPlanName.toLowerCase().includes('text') && userPlanName.toLowerCase().includes('audio');
        } else {
          // Se não encontrou subscription, verificar no profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('plan_name, plan_active')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Erro ao consultar profile:', profileError);
            throw profileError;
          }

          if (profile?.plan_active && profile?.plan_name) {
            userPlanName = profile.plan_name;
            hasAccess = profile.plan_name === 'Text & Audio' ||
                       (profile.plan_name.toLowerCase().includes('text') && profile.plan_name.toLowerCase().includes('audio'));
          }
        }

        if (!hasAccess) {
          toast.error('Acesso negado. Você precisa do plano Text & Audio para acessar esta página.');
          navigate('/profile');
          return;
        }

        console.log('Acesso liberado para o plano:', userPlanName);
      } catch (error) {
        console.error('Erro ao verificar acesso ao plano:', error);
        toast.error('Erro ao verificar permissões. Redirecionando para o perfil.');
        navigate('/profile');
      }
    };

    checkPlanAccess();
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    const messageContent = input;
    setInput('');
    setIsLoading(true);

    if (isMobile && inputRef.current) {
      inputRef.current.blur();
    }

    try {
      console.log('Enviando mensagem de texto para n8n:', messageContent);
      
      const response = await fetch(textWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          timestamp: new Date().toISOString(),
          user: user?.email || 'anonymous'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status} - ${response.statusText}`);
      }
      
      console.log('Resposta recebida do n8n');
      
      let responseText = '';
      try {
        const responseData = await response.json();
        console.log('Resposta JSON do n8n:', responseData);
        
        if (responseData.message) {
          responseText = responseData.message;
        } else if (responseData.text) {
          responseText = responseData.text;
        } else if (responseData.response) {
          responseText = responseData.response;
        } else if (typeof responseData === 'string') {
          responseText = responseData;
        } else {
          responseText = JSON.stringify(responseData);
        }
      } catch (jsonError) {
        console.log('Resposta não é JSON, tratando como texto');
        responseText = await response.text();
      }
      
      if (responseText) {
        const contactMessage: ModernMessage = {
          id: (Date.now() + 1).toString(),
          content: responseText,
          sender: 'contact',
          timestamp: new Date(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, contactMessage]);
      } else {
        throw new Error('Resposta vazia do n8n');
      }
      
    } catch (error) {
      console.error('Erro ao enviar mensagem para n8n:', error);
      toast.error(`Erro ao processar mensagem: ${error.message}`);
      
      const contactMessage: ModernMessage = {
        id: (Date.now() + 1).toString(),
        content: `Desculpe, ocorreu um erro ao processar sua mensagem. Mensagem recebida: "${messageContent}"`,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, contactMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioMessage = async () => {
    if (isRecording) {
      // Stop recording and process
      setIsLoading(true);
      try {
        const audioBlob = await stopRecording();
        if (!audioBlob) {
          throw new Error('Falha na gravação');
        }

        // Transcribe audio with ElevenLabs
        const transcribedText = await elevenLabsService.transcribeAudio(audioBlob);
        
        if (!transcribedText.trim()) {
          throw new Error('Não foi possível transcrever o áudio');
        }

        // Add user message
        const userMessage: ModernMessage = {
          id: Date.now().toString(),
          content: transcribedText,
          sender: 'user',
          timestamp: new Date(),
          type: 'audio',
          audioDuration: formatRecordingTime(recordingTime),
          audioUrl: URL.createObjectURL(audioBlob)
        };
        
        setMessages(prev => [...prev, userMessage]);

        // Send to n8n webhook for processing
        const response = await fetch(textWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: transcribedText,
            timestamp: new Date().toISOString(),
            user: user?.email || 'anonymous'
          })
        });

        if (!response.ok) {
          throw new Error(`Erro na resposta do n8n: ${response.status}`);
        }

        let responseText = '';
        try {
          const responseData = await response.json();
          if (responseData.message) {
            responseText = responseData.message;
          } else if (responseData.text) {
            responseText = responseData.text;
          } else if (responseData.response) {
            responseText = responseData.response;
          } else if (typeof responseData === 'string') {
            responseText = responseData;
          } else {
            responseText = JSON.stringify(responseData);
          }
        } catch (jsonError) {
          responseText = await response.text();
        }

        if (responseText) {
          // Generate audio response with ElevenLabs
          const audioContent = await elevenLabsService.generateSpeech(responseText);
          const audioUrl = elevenLabsService.base64ToAudioUrl(audioContent);

          const contactMessage: ModernMessage = {
            id: (Date.now() + 2).toString(),
            content: responseText,
            sender: 'contact',
            timestamp: new Date(),
            type: 'audio',
            audioUrl: audioUrl
          };
          
          setMessages(prev => [...prev, contactMessage]);

          // Auto-play the response
          setTimeout(() => {
            const audio = new Audio(audioUrl);
            audio.play().catch(console.error);
          }, 500);
        }

      } catch (error) {
        console.error('Erro ao processar áudio:', error);
        toast.error(`Erro ao processar áudio: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Start recording
      await startRecording();
    }
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

  const playAudio = (messageId: string, audioUrl: string) => {
    const existingAudio = audioRefs.current.get(messageId);
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audioRefs.current.set(messageId, audio);
    audio.play().catch(console.error);
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
            <span className="text-sm text-gray-300">processando...</span>
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="bg-blue-600 px-3 py-1 rounded-full">
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
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
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
                        {message.type === 'audio' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => message.audioUrl && playAudio(message.id, message.audioUrl)}
                              className="p-1 h-auto text-current hover:bg-white/10"
                            >
                              <Mic size={16} />
                            </Button>
                            {message.audioDuration && (
                              <span className="text-xs opacity-70">{message.audioDuration}</span>
                            )}
                          </div>
                        )}
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
                ))}
                {isLoading && <MobileLoadingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Gravando... {formatRecordingTime(recordingTime)}</span>
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
              disabled={isLoading || isRecording}
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <Smile size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <Gift size={20} />
          </Button>
          
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className={`flex-shrink-0 ${isRecording ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
            onClick={handleAudioMessage}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
          
          <Button
            size="icon"
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full flex-shrink-0"
            disabled={!input.trim() || isLoading || isRecording}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
