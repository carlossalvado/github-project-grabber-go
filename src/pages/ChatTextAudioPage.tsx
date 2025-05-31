import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Smile, Gift, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { elevenLabsService } from '@/services/elevenLabsService';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define message structure with new fields for audio processing state
interface ModernMessage {
  id: string;
  content: string; // Holds transcription for user audio, or text for text messages
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'audio';
  audioUrl?: string;
  audioDuration?: string; // Optional: Store duration if available
  isPlaying?: boolean; // Optional: Track playback state
  // User audio specific states
  isTranscribing?: boolean; // Track transcription status for user audio
  transcriptionError?: string | null; // Store transcription error message
}

// Mock contact info (replace with actual data)
const contactName = "Isa";
const contactAvatar = "/placeholder.svg"; // Replace with actual avatar URL

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const [messages, setMessages] = useState<ModernMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // General loading for AI response generation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Webhook URLs
  const textWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook/d973werwer9-ohasd-5-pijaswerwerd54-asd4245645";
  const audioWebhookUrl = "https://dfghjkl9hj4567890.app.n8n.cloud/webhook-test/d973werwer9-ohasd-5-pijaswerwerd54-asd4245645";

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
          URL.revokeObjectURL(audio.src); // Clean up blob URLs only
        }
      });
      audioRefs.current.clear();
    };
  }, []);

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' }); // Specify mimeType if possible
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
        const audioUrl = URL.createObjectURL(audioBlob);
        const userMessageId = `user_audio_${Date.now()}`;

        // 1. Add user audio message to chat IMMEDIATELY
        const userAudioMessage: ModernMessage = {
          id: userMessageId,
          content: '', // Transcription will be added later
          sender: 'user',
          timestamp: new Date(),
          type: 'audio',
          audioUrl: audioUrl,
          isTranscribing: true, // Mark as transcribing
          transcriptionError: null,
        };
        setMessages(prev => [...prev, userAudioMessage]);

        // 2. Start asynchronous processing (transcription -> n8n -> speech)
        processAudioMessage(audioBlob, userMessageId);
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

  // --- Asynchronous Audio Processing ---
  const processAudioMessage = async (audioBlob: Blob, userMessageId: string) => {
    try {
      // 1. Transcribe audio
      console.log("Transcrevendo áudio...");
      const transcribedText = await elevenLabsService.transcribeAudio(audioBlob);
      console.log("Texto transcrito:", transcribedText);

      if (!transcribedText && transcribedText !== "") { // Allow empty transcription if valid
        throw new Error("Transcrição falhou ou retornou inválida.");
      }

      // Update user message state: transcription successful
      setMessages(prev => prev.map(msg =>
        msg.id === userMessageId
          ? { ...msg, content: transcribedText, isTranscribing: false, transcriptionError: null }
          : msg
      ));

      // If transcription is empty, maybe don't proceed to n8n?
      if (!transcribedText.trim()) {
          console.log("Transcrição vazia, não enviando para n8n.");
          return;
      }

      // 2. Send transcribed text to n8n AUDIO webhook
      console.log("Enviando texto transcrito para n8n (webhook de áudio)...");
      setIsLoading(true);
      
      const responseText = await sendToN8nWebhook(transcribedText, audioWebhookUrl);

      // 3. Generate speech for the AI response using ElevenLabs
      console.log("Gerando áudio da resposta com ElevenLabs...");
      const audioContentBase64 = await elevenLabsService.generateSpeech(responseText);
      console.log("Conteúdo do áudio (base64) recebido.");

      if (!audioContentBase64) {
        throw new Error("Geração de áudio falhou ou retornou vazia.");
      }

      // 4. Convert base64 to audio URL and add contact message
      console.log("Convertendo base64 para URL de áudio...");
      const contactAudioUrl = elevenLabsService.base64ToAudioUrl(audioContentBase64);
      console.log("URL do áudio gerada:", contactAudioUrl);

      const contactMessage: ModernMessage = {
        id: `contact_audio_${Date.now()}`,
        content: responseText, // Store text content internally
        sender: 'contact',
        timestamp: new Date(),
        type: 'audio',
        audioUrl: contactAudioUrl,
      };
      setMessages(prev => [...prev, contactMessage]);

    } catch (error: any) {
      console.error('Erro no processamento assíncrono do áudio:', error);
      toast.error(`Erro: ${error.message || 'Falha ao processar áudio.'}`);

      // Update user message state: transcription or subsequent step failed
      setMessages(prev => prev.map(msg =>
        msg.id === userMessageId
          ? { ...msg, isTranscribing: false, transcriptionError: error.message || 'Falha no processamento' }
          : msg
      ));

    } finally {
      setIsLoading(false); // Stop general loading indicator
    }
  };

  // --- N8N Webhook Communication ---
  const sendToN8nWebhook = async (messageText: string, webhookUrl: string = textWebhookUrl): Promise<string> => {
    try {
      console.log('Enviando mensagem para n8n:', messageText, 'URL:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          timestamp: new Date().toISOString(),
          user: user?.email || 'anonymous'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na resposta do webhook: ${response.status} - ${response.statusText}`);
      }
      
      // Try to parse as JSON first
      let responseText = '';
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log('Resposta JSON do n8n:', responseData);
          
          // Extract text from various possible response formats
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
        } else {
          // If not JSON, treat as plain text
          responseText = await response.text();
          console.log('Resposta em texto do n8n:', responseText);
          
          // Check if response is HTML (common error case)
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
            throw new Error('O webhook retornou HTML ao invés de texto. Verifique a configuração do n8n.');
          }
        }
      } catch (parseError) {
        console.error('Erro ao processar resposta:', parseError);
        // Fallback to plain text
        responseText = await response.text();
        
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
          throw new Error('O webhook retornou HTML ao invés de texto. Verifique a configuração do n8n.');
        }
      }
      
      if (!responseText || responseText.trim() === '') {
        responseText = "Desculpe, não consegui processar sua mensagem.";
      }
      
      return responseText;
      
    } catch (error: any) {
      console.error('Erro ao comunicar com n8n:', error);
      throw new Error(`Falha na comunicação com n8n: ${error.message}`);
    }
  };

  // --- Message Sending Logic (Text) ---
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isRecording) return;

    const newMessage: ModernMessage = {
      id: `user_text_${Date.now()}`,
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // 1. Send text message to n8n text webhook
      console.log("Enviando texto para n8n (webhook de texto)...");
      const responseText = await sendToN8nWebhook(currentInput, textWebhookUrl);

      // 2. Add text response from n8n
      const contactMessage: ModernMessage = {
        id: `contact_text_${Date.now()}`,
        content: responseText,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, contactMessage]);

    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(`Erro: ${error.message || 'Falha ao processar mensagem.'}`);
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        content: `Erro ao processar resposta: ${error.message}`,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Audio Playback Logic ---
  const playAudio = (messageId: string, audioUrl: string) => {
    if (!audioUrl) {
        toast.error("Áudio indisponível.");
        return;
    }

    // Pause any currently playing audio
    audioRefs.current.forEach((audio, id) => {
      if (id !== messageId && !audio.paused) {
        audio.pause();
        // Update state for the paused audio
        setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, isPlaying: false } : msg));
      }
    });

    let audio = audioRefs.current.get(messageId);

    if (audio) {
      if (audio.paused) {
        audio.play().catch(err => {
          console.error("Erro ao tocar áudio:", err);
          toast.error("Não foi possível tocar o áudio.");
          setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
        });
      } else {
        audio.pause();
      }
    } else {
      // Create new audio element if it doesn't exist
      console.log(`Criando novo elemento de áudio para: ${messageId} com URL: ${audioUrl}`);
      audio = new Audio(audioUrl);
      audioRefs.current.set(messageId, audio);

      audio.onplay = () => {
        console.log(`Áudio onplay: ${messageId}`);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }));
      };
      audio.onpause = () => {
        console.log(`Áudio onpause: ${messageId}`);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
      };
      audio.onended = () => {
        console.log(`Áudio onended: ${messageId}`);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
      };
      audio.onerror = (e) => {
        console.error("Erro no elemento de áudio:", e);
        toast.error("Erro ao carregar o áudio.");
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false, audioUrl: undefined, transcriptionError: msg.transcriptionError || "Erro ao carregar" } : msg));
        audioRefs.current.delete(messageId);
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
      };

      audio.play().catch(err => {
        console.error("Erro ao tocar áudio (catch inicial):", err);
        toast.error("Não foi possível iniciar o áudio.");
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
      });
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
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
  const renderMessageContent = (message: ModernMessage) => {
    if (message.type === 'audio' && message.audioUrl) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${message.sender === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}`}
            onClick={() => playAudio(message.id, message.audioUrl!)}
            disabled={message.isTranscribing} // Disable play while transcribing
          >
            {message.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          <div className="text-xs text-gray-400">
            <span>Áudio</span>
            {message.audioDuration && <span> ({message.audioDuration})</span>}
          </div>
          {/* Indicators for user audio */}
          {message.sender === 'user' && (
            <div className="ml-auto pl-2 flex items-center">
              {message.isTranscribing && (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              )}
              {message.transcriptionError && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle size={16} className="text-red-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white text-xs max-w-xs break-words">
                      <p>Erro: {message.transcriptionError}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      );
    } else if (message.type === 'text') {
      return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    } else {
        // Fallback for user audio message before URL is ready or if error occurs early
        if (message.sender === 'user' && message.type === 'audio') {
            return (
                <div className="flex items-center gap-2 text-gray-400">
                    <Mic size={16} />
                    <span>Áudio gravado</span>
                    {message.isTranscribing && <Loader2 size={16} className="animate-spin" />}
                    {message.transcriptionError && <AlertCircle size={16} className="text-red-500" />}
                </div>
            );
        }
        return <p className="text-gray-500 italic">Conteúdo indisponível</p>;
    }
  };

  const MobileLoadingIndicator = () => (
    <div className="flex justify-start mb-4">
       <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={contactAvatar} alt={contactName} />
          <AvatarFallback className="bg-purple-600 text-white">
              {contactName.charAt(0)}
          </AvatarFallback>
       </Avatar>
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
            onClick={() => navigate(-1)} // Go back
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
                <div className={`px-4 py-3 rounded-2xl shadow-md ${message.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}>
                  {renderMessageContent(message)}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>

              {message.sender === 'user' && (
                  <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                  </Avatar>
              )}
            </div>
          ))}
          {/* Show general loading indicator only when AI is processing text response */} 
          {isLoading && <MobileLoadingIndicator />}
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
            disabled={isLoading} // Disable mic button while AI is processing previous message
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
