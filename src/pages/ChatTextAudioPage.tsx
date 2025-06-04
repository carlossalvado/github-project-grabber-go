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

// Define message structure for local state
interface ChatMessage {
  id: string;
  created_at: string;
  user_id: string;
  chat_id?: string; // Keep optional for text messages
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

// Define separate type for database inserts with required chat_id
interface AudioMessageInsert {
  id: string;
  created_at: string;
  user_id: string;
  chat_id: string; // Required for database insert
  message_type: 'audio_input';
  audio_input_url: string;
  status: 'completed';
  updated_at: string;
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
  const [agentData, setAgentData] = useState<{
    name: string;
    avatar_url: string;
  } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Updated webhook URLs
  const textWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d97asdfasd39-ohasasdfasdd-5-pijaasdfadsfd54-asasdfadsfd42";
  const audioWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d9739-ohasd-5-pijasd54-asd42";

  // Load agent data
  useEffect(() => {
    const loadAgentData = async () => {
      if (!user) return;

      try {
        console.log('Loading agent data for user:', user.id);
        
        // Get user's selected agent
        const { data: selectedAgent, error: agentError } = await supabase
          .from('user_selected_agent')
          .select('agent_id, nickname')
          .eq('user_id', user.id)
          .single();

        if (agentError) {
          console.error('Error fetching selected agent:', agentError);
          // Use default agent data
          setAgentData({
            name: 'Isa',
            avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
          });
          return;
        }

        console.log('Selected agent found:', selectedAgent);

        // Get agent details
        const { data: agent, error: agentDetailsError } = await supabase
          .from('ai_agents')
          .select('name, avatar_url')
          .eq('id', selectedAgent.agent_id)
          .single();

        if (agentDetailsError) {
          console.error('Error fetching agent details:', agentDetailsError);
          // Use default agent data
          setAgentData({
            name: selectedAgent.nickname || 'Isa',
            avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
          });
          return;
        }

        console.log('Agent details found:', agent);
        console.log('Raw avatar URL from database:', agent.avatar_url);

        // Check if avatar_url is a Supabase storage path
        let finalAvatarUrl = agent.avatar_url;
        if (agent.avatar_url && !agent.avatar_url.startsWith('http')) {
          // If it's a storage path, get the public URL
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(agent.avatar_url);
          
          finalAvatarUrl = publicUrlData.publicUrl;
          console.log('Generated public URL:', finalAvatarUrl);
        }

        setAgentData({
          name: selectedAgent.nickname || agent.name,
          avatar_url: finalAvatarUrl || 'https://i.imgur.com/nV9pbvg.jpg'
        });

        console.log('Final agent data set:', {
          name: selectedAgent.nickname || agent.name,
          avatar_url: finalAvatarUrl || 'https://i.imgur.com/nV9pbvg.jpg'
        });

      } catch (error) {
        console.error('Error loading agent data:', error);
        // Use default agent data as fallback
        setAgentData({
          name: 'Isa',
          avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
        });
      }
    };

    loadAgentData();
  }, [user]);

  // Initialize chat - only needed for audio messages
  useEffect(() => {
    if (user) {
      initializeChat();
    }
  }, [user]);

  // Set up realtime subscription - only for audio messages
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
      // Create or get existing chat for audio messages
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

      // Load existing messages - only audio messages from database
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

  // --- Audio Processing with Supabase Storage and n8n webhook ---
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

      // 3. Create message record in database with proper typing
      const audioMessageInsert: AudioMessageInsert = {
        id: messageId,
        created_at: new Date().toISOString(),
        user_id: user.id,
        chat_id: currentChatId,
        message_type: 'audio_input',
        audio_input_url: audioPath,
        status: 'completed',
        updated_at: new Date().toISOString()
      };

      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert(audioMessageInsert)
        .select()
        .single();

      if (messageError) throw messageError;

      // Add message to local state immediately
      setMessages(prev => [...prev, messageData]);

      console.log('Message record created, preparing to send audio to n8n webhook...');

      // 4. Download the audio blob from storage to send directly to n8n
      const { data: audioData, error: downloadError } = await supabase.storage
        .from('chat_audio')
        .download(audioPath);

      if (downloadError) {
        throw new Error(`Erro ao baixar áudio para envio ao n8n: ${downloadError.message}`);
      }

      // 5. Create FormData with the audio file for n8n
      const formData = new FormData();
      formData.append('file', audioData, 'audio.webm');
      formData.append('messageId', messageId);
      formData.append('chatId', currentChatId);
      formData.append('userId', user.id);
      formData.append('audioPath', audioPath);
      formData.append('timestamp', new Date().toISOString());

      console.log('Sending audio directly to n8n webhook...');

      // 6. Send audio directly to n8n webhook as FormData
      const webhookResponse = await fetch(audioWebhookUrl, {
        method: 'POST',
        body: formData
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook failed (${webhookResponse.status}): ${errorText}`);
      }

      console.log('n8n webhook triggered successfully with audio file');

    } catch (error: any) {
      console.error('Error processing audio message:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    }
  };

  // --- Text Message Logic - Direct n8n integration without Supabase ---
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isRecording || !user) return;

    const messageText = input.trim();
    const messageId = crypto.randomUUID();
    setInput('');
    setIsLoading(true);

    // Add user message to local state immediately
    const userMessage: ChatMessage = {
      id: messageId,
      created_at: new Date().toISOString(),
      user_id: user.id,
      message_type: 'text_input',
      text_content: messageText,
      status: 'completed',
      updated_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Enviando mensagem para o webhook:', textWebhookUrl);
      
      // Send directly to n8n webhook
      const response = await fetch(textWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
          user: user.email || 'anonymous',
          messageId: messageId
        })
      });

      console.log('Resposta do webhook recebida:', response.status);

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} - ${response.statusText}`);
      }

      // Try to get response as text first, then parse if possible
      const responseText = await response.text();
      console.log('Conteúdo da resposta:', responseText);
      
      let aiResponseText = '';
      
      if (responseText) {
        try {
          // Try to parse as JSON first
          const responseData = JSON.parse(responseText);
          
          // Handle array format from n8n (like [{"output":"message"}])
          if (Array.isArray(responseData) && responseData.length > 0) {
            const firstItem = responseData[0];
            aiResponseText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || firstItem.reply || responseText;
          } else {
            // Handle single object format
            aiResponseText = responseData.output || responseData.message || responseData.text || responseData.response || responseData.reply || responseText;
          }
        } catch {
          // If not JSON, use the text directly
          aiResponseText = responseText;
        }
      } else {
        aiResponseText = 'Resposta recebida com sucesso';
      }

      console.log('Resposta processada da IA:', aiResponseText);

      // Add AI response to local state
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        message_type: 'text_output',
        text_content: aiResponseText,
        status: 'completed',
        updated_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error: any) {
      console.error('Erro detalhado ao enviar mensagem:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        message_type: 'text_output',
        text_content: `Erro na comunicação: ${error.message}. Verifique se o webhook está funcionando corretamente.`,
        status: 'error',
        error_message: error.message,
        updated_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
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
              >
                {message.isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>
              <div className="text-xs text-gray-400">
                <span>Áudio</span>
              </div>
            </div>
          )}
          
          {/* Mostrar conteúdo de texto apenas para mensagens de áudio de entrada (transcrição) */}
          {message.message_type === 'audio_input' && showContent && (
            <p className="whitespace-pre-wrap break-words text-sm mt-2">{showContent}</p>
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

  // Show loading if agent data is not loaded yet
  if (!agentData) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  console.log('Rendering ChatTextAudioPage with agent data:', agentData);

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
            <AvatarImage 
              src={agentData.avatar_url} 
              alt={agentData.name}
              onLoad={() => console.log('Avatar image loaded successfully:', agentData.avatar_url)}
              onError={(e) => {
                console.error('Error loading avatar image:', agentData.avatar_url);
                console.error('Image error event:', e);
                e.currentTarget.src = 'https://i.imgur.com/nV9pbvg.jpg';
              }}
            />
            <AvatarFallback className="bg-purple-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{agentData.name}</span>
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
                    <AvatarImage 
                      src={agentData.avatar_url} 
                      alt={agentData.name}
                      onLoad={() => console.log('Message avatar image loaded successfully')}
                      onError={(e) => {
                        console.error('Error loading message avatar image:', agentData.avatar_url);
                        e.currentTarget.src = 'https://i.imgur.com/nV9pbvg.jpg';
                      }}
                    />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {agentData.name.charAt(0)}
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

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-70 p-6 rounded-full flex flex-col items-center justify-center">
          <div className="animate-pulse mb-2">
            <Mic size={48} className="text-red-500" />
          </div>
          <div className="text-white font-medium">
            {formatRecordingTime(recordingTime)}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={`flex-shrink-0 ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
          onClick={handleAudioMessage}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Input
          ref={inputRef}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
          placeholder="Digite uma mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading || isRecording}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-white"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading || isRecording}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
