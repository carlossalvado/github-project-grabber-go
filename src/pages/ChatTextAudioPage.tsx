import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define message structure based on chat_messages table
interface ChatMessage {
  id: string;
  created_at: string;
  chat_id: string;
  user_id: string;
  message_type: 'text_input' | 'audio_input' | 'text_output' | 'audio_output';
  text_content?: string;
  audio_input_url?: string;
  transcription?: string;
  status: 'processing' | 'transcribed' | 'generating_response' | 'completed' | 'error';
  error_message?: string;
  llm_response_text?: string;
  response_audio_url?: string;
  updated_at: string;
  isPlaying?: boolean; // Client-side state
}

// Mock contact info
const contactName = "Isa";
const contactAvatar = "/placeholder.svg";

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Webhook URLs atualizadas
  const textWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d97asdfasd39-ohasasdfasdd-5-pijaasdfadssd54-asasdfadsfd42";
  const audioWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d9739-ohasd-5-pijasd54-asd42";

  // Initialize chat
  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!currentChatId) return;

    console.log('Setting up realtime subscription for chat:', currentChatId);

    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${currentChatId}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ChatMessage;
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? { ...updatedMessage, isPlaying: msg.isPlaying } : msg
            ));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentChatId]);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      });
      audioRefs.current.clear();
    };
  }, []);

  const initializeChat = async () => {
    if (!user) return;

    try {
      // Create or get existing chat
      const { data: existingChats, error: fetchError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      let chatId: string;

      if (existingChats && existingChats.length > 0) {
        chatId = existingChats[0].id;
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            title: `Chat com ${contactName}`,
          })
          .select()
          .single();

        if (createError) throw createError;
        chatId = newChat.id;
      }

      setCurrentChatId(chatId);

      // Load existing messages
      const { data: existingMessages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      setMessages(existingMessages || []);

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Erro ao inicializar chat');
    }
  };

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          console.warn("Nenhum dado de áudio gravado.");
          toast.warning("Nenhum áudio foi gravado.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudioMessage(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // --- Audio Processing with New Architecture ---
  const processAudioMessage = async (audioBlob: Blob) => {
    if (!user || !currentChatId) {
      toast.error('Usuário não autenticado ou chat não inicializado');
      return;
    }

    try {
      console.log('Processing audio message...');

      // 1. Get signed upload URL
      const { data: urlData, error: urlError } = await supabase.functions.invoke('get-signed-upload-url', {
        body: {
          chatId: currentChatId,
          fileType: 'audio/webm'
        }
      });

      if (urlError) throw urlError;

      const { signedUrl, path: audioPath, messageId } = urlData;

      console.log('Got signed URL, uploading audio...');

      // 2. Upload audio directly to storage
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: audioBlob,
        headers: {
          'Content-Type': 'audio/webm'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio');
      }

      console.log('Audio uploaded successfully');

      // 3. Create message record in database
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          chat_id: currentChatId,
          user_id: user.id,
          message_type: 'audio_input',
          audio_input_url: audioPath,
          status: 'processing'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Add message to local state immediately
      setMessages(prev => [...prev, messageData]);

      console.log('Message record created, triggering n8n webhook...');

      // 4. Trigger n8n webhook with message ID
      const webhookResponse = await fetch(audioWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: messageId,
          chatId: currentChatId,
          userId: user.id,
          audioPath: audioPath,
          timestamp: new Date().toISOString()
        })
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook failed: ${webhookResponse.status}`);
      }

      console.log('n8n webhook triggered successfully');
      toast.success('Áudio enviado para processamento');

    } catch (error: any) {
      console.error('Error processing audio message:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    }
  };

  // --- Text Message Logic ---
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isRecording || !user || !currentChatId) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Create text message in database
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: currentChatId,
          user_id: user.id,
          message_type: 'text_input',
          text_content: messageText,
          status: 'completed'
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Add to local state
      setMessages(prev => [...prev, messageData]);

      // Send to n8n text webhook
      const response = await fetch(textWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
          user: user.email || 'anonymous',
          chatId: currentChatId,
          messageId: messageData.id
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      // Process response
      let responseText = '';
      try {
        const responseData = await response.json();
        responseText = responseData.message || responseData.text || responseData.response || 'Resposta não disponível';
      } catch {
        responseText = await response.text() || 'Resposta não disponível';
      }

      // Create response message
      const { error: responseError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: currentChatId,
          user_id: user.id,
          message_type: 'text_output',
          text_content: responseText,
          status: 'completed'
        });

      if (responseError) throw responseError;

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Audio Playback Logic ---
  const playAudio = async (messageId: string, audioPath: string) => {
    if (!audioPath) {
      toast.error("Áudio indisponível.");
      return;
    }

    try {
      // Pause any currently playing audio
      audioRefs.current.forEach((audio, id) => {
        if (id !== messageId && !audio.paused) {
          audio.pause();
          setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isPlaying: false } : msg));
        }
      });

      let audio = audioRefs.current.get(messageId);

      if (audio) {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } else {
        // Get public URL for audio
        const { data } = supabase.storage.from('chat_audio').getPublicUrl(audioPath);
        
        audio = new Audio(data.publicUrl);
        audioRefs.current.set(messageId, audio);

        audio.onplay = () => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
          ));
        };
        
        audio.onpause = () => {
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
        };
        
        audio.onended = () => {
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
        };
        
        audio.onerror = (e) => {
          console.error("Erro no elemento de áudio:", e);
          toast.error("Erro ao carregar o áudio.");
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
          audioRefs.current.delete(messageId);
        };

        await audio.play();
      }
    } catch (error) {
      console.error("Erro ao tocar áudio:", error);
      toast.error("Não foi possível tocar o áudio.");
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
    }
  };

  // --- Helper Functions ---
  const handleAudioMessage = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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

  // --- Render Logic ---
  const renderMessageContent = (message: ChatMessage) => {
    if (message.message_type === 'audio_input' || message.message_type === 'audio_output') {
      const audioPath = message.message_type === 'audio_input' ? message.audio_input_url : message.response_audio_url;
      const showContent = message.message_type === 'audio_input' ? message.transcription : message.llm_response_text;
      
      return (
        <div className="space-y-2">
          {audioPath && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${message.message_type === 'audio_input' ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                onClick={() => playAudio(message.id, audioPath)}
                disabled={message.status === 'processing'}
              >
                {message.isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>
              <div className="text-xs text-gray-400">
                <span>Áudio</span>
              </div>
              <div className="ml-auto pl-2 flex items-center">
                {message.status === 'processing' && (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                )}
                {message.status === 'error' && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle size={16} className="text-red-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-black text-white text-xs max-w-xs break-words">
                        <p>Erro: {message.error_message}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )}
          
          {showContent && (
            <p className="whitespace-pre-wrap break-words text-sm mt-2">{showContent}</p>
          )}
          
          {message.status === 'processing' && (
            <p className="text-xs text-gray-500 italic">Processando...</p>
          )}
        </div>
      );
    } else {
      return <p className="whitespace-pre-wrap break-words">{message.text_content}</p>;
    }
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  // --- JSX ---
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
          <Avatar>
            <AvatarImage src={contactAvatar} alt={contactName} />
            <AvatarFallback className="bg-purple-600">{contactName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{contactName}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.map((message) => {
            const isUserMessage = message.message_type === 'text_input' || message.message_type === 'audio_input';
            
            return (
              <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                {!isUserMessage && (
                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                    <AvatarImage src={contactAvatar} alt={contactName} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {contactName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className="max-w-[70%] space-y-1">
                  <div className={`px-4 py-3 rounded-2xl shadow-md ${
                    isUserMessage 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-700 text-white rounded-bl-none'
                  }`}>
                    {renderMessageContent(message)}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.created_at)}
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
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2 flex-shrink-0">
        <Input
          ref={inputRef}
          type="text"
          placeholder={isRecording ? `Gravando... ${formatRecordingTime(recordingTime)}` : "Digite sua mensagem..."}
          className="flex-1 bg-gray-700 border-gray-600 placeholder-gray-400 text-white rounded-full px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isRecording || isLoading}
        />
        {input.trim() ? (
          <Button
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 rounded-full text-white"
            onClick={handleSendMessage}
            disabled={isLoading || isRecording}
          >
            <Send size={20} />
          </Button>
        ) : (
          <Button
            size="icon"
            className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} rounded-full text-white`}
            onClick={handleAudioMessage}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
