import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Smile, Gift, Play, Pause } from 'lucide-react'; // Added Play/Pause icons
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { elevenLabsService } from '@/services/elevenLabsService'; // Assuming this service exists and works
import { supabase } from '@/integrations/supabase/client'; // Assuming Supabase client is configured

// Define message structure
interface ModernMessage {
  id: string;
  content: string; // Keep content for potential future use or accessibility
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'audio';
  audioUrl?: string;
  audioDuration?: string; // Optional: Store duration if available
  isPlaying?: boolean; // Optional: Track playback state
  isLoadingAudio?: boolean; // Optional: Track if audio is loading
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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
        URL.revokeObjectURL(audio.src); // Clean up blob URLs
      });
      audioRefs.current.clear();
    };
  }, []);

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsLoading(true);
        try {
          // 1. Transcribe audio
          console.log("Transcrevendo áudio...");
          const transcribedText = await elevenLabsService.transcribeAudio(audioBlob);
          console.log("Texto transcrito:", transcribedText);

          if (!transcribedText) {
            throw new Error("Transcrição falhou ou retornou vazia.");
          }

          // Add user's transcribed message
          const userMessage: ModernMessage = {
            id: Date.now().toString(),
            content: transcribedText,
            sender: 'user',
            timestamp: new Date(),
            type: 'text', // User message is text after transcription
          };
          setMessages(prev => [...prev, userMessage]);

          // 2. Send transcribed text to backend/AI for response
          console.log("Enviando texto para obter resposta da IA...");
          // Replace with your actual API call to get AI response
          const response = await fetch('/api/chat', { // EXAMPLE API endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: transcribedText, userId: user?.id })
          });

          if (!response.ok) {
            throw new Error(`Erro na API de chat: ${response.statusText}`);
          }

          const responseData = await response.json();
          const responseText = responseData.message || responseData.text || responseData.response || "Desculpe, não consegui processar isso.";
          console.log("Resposta da IA:", responseText);

          // 3. Generate speech for the AI response using ElevenLabs
          console.log("Gerando áudio da resposta com ElevenLabs...");
          const audioContentBase64 = await elevenLabsService.generateSpeech(responseText);
          console.log("Conteúdo do áudio (base64) recebido.");

          if (!audioContentBase64) {
            throw new Error("Geração de áudio falhou ou retornou vazia.");
          }

          // 4. Convert base64 to audio URL and add contact message
          console.log("Convertendo base64 para URL de áudio...");
          const audioUrl = elevenLabsService.base64ToAudioUrl(audioContentBase64);
          console.log("URL do áudio gerada:", audioUrl);

          const contactMessage: ModernMessage = {
            id: (Date.now() + 1).toString(),
            content: responseText, // Store text content internally
            sender: 'contact',
            timestamp: new Date(),
            type: 'audio',
            audioUrl: audioUrl,
            isLoadingAudio: false,
          };
          setMessages(prev => [...prev, contactMessage]);

        } catch (error: any) {
          console.error('Erro no processamento da mensagem de áudio:', error);
          toast.error(`Erro: ${error.message || 'Falha ao processar áudio.'}`);
          // Add error message to chat
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            content: `Erro ao processar áudio: ${error.message}`,
            sender: 'contact',
            timestamp: new Date(),
            type: 'text'
          }]);
        } finally {
          setIsLoading(false);
        }
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
      // Stop timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      // Stop media stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // --- Message Sending Logic ---
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isRecording) return;

    const newMessage: ModernMessage = {
      id: Date.now().toString(),
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
      // 1. Send text message to backend/AI
      console.log("Enviando texto para obter resposta da IA...");
      // Replace with your actual API call
      const response = await fetch('/api/chat', { // EXAMPLE API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, userId: user?.id })
      });

      if (!response.ok) {
        throw new Error(`Erro na API de chat: ${response.statusText}`);
      }

      const responseData = await response.json();
      const responseText = responseData.message || responseData.text || responseData.response || "Desculpe, não consegui processar isso.";
      console.log("Resposta da IA:", responseText);

      // 2. Generate speech for the AI response using ElevenLabs
      console.log("Gerando áudio da resposta com ElevenLabs...");
      const audioContentBase64 = await elevenLabsService.generateSpeech(responseText);
      console.log("Conteúdo do áudio (base64) recebido.");

      if (!audioContentBase64) {
        throw new Error("Geração de áudio falhou ou retornou vazia.");
      }

      // 3. Convert base64 to audio URL and add contact message
      console.log("Convertendo base64 para URL de áudio...");
      const audioUrl = elevenLabsService.base64ToAudioUrl(audioContentBase64);
      console.log("URL do áudio gerada:", audioUrl);

      const contactMessage: ModernMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText, // Store text content internally
        sender: 'contact',
        timestamp: new Date(),
        type: 'audio',
        audioUrl: audioUrl,
        isLoadingAudio: false,
      };
      setMessages(prev => [...prev, contactMessage]);

    } catch (error: any) {
      console.error('Erro ao enviar mensagem ou gerar áudio:', error);
      toast.error(`Erro: ${error.message || 'Falha ao processar mensagem.'}`);
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
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
    // Pause any currently playing audio
    audioRefs.current.forEach((audio, id) => {
      if (id !== messageId) {
        audio.pause();
        // No need to update state here, onpause handles it
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
      audio = new Audio(audioUrl);
      audioRefs.current.set(messageId, audio);

      audio.onplay = () => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }));
      };
      audio.onpause = () => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
      };
      audio.onended = () => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
        audioRefs.current.delete(messageId); // Clean up ref when ended
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
      };
      audio.onerror = (e) => {
        console.error("Erro no elemento de áudio:", e);
        toast.error("Erro ao carregar o áudio.");
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false, audioUrl: undefined } : msg)); // Mark as error
        audioRefs.current.delete(messageId);
        URL.revokeObjectURL(audioUrl);
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
      timeZone: 'America/Sao_Paulo' // Adjust timezone if needed
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // --- Render Logic ---
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
        {/* Add other header icons/buttons if needed */}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Envie uma mensagem para começar.</p>
            </div>
          ) : (
            <>
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
                    <div className={`px-4 py-3 rounded-2xl shadow-md ${
                      message.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}>
                      {/* Render Audio Player if type is audio and URL exists */}
                      {message.type === 'audio' && message.audioUrl && (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => playAudio(message.id, message.audioUrl!)}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={`p-1 h-8 w-8 text-current hover:bg-white/10 rounded-full ${
                              message.isPlaying ? 'bg-white/20' : ''
                            }`}
                          >
                            {/* Use Play/Pause icons based on state */}
                            {message.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </Button>
                          {/* Basic progress bar simulation */}
                          <div className="flex-1 h-1 bg-gray-500 rounded-full overflow-hidden">
                             <div className={`h-full bg-purple-400 ${message.isPlaying ? 'animate-pulse' : ''}`} style={{ width: message.isPlaying ? '100%' : '0%' }}></div>
                          </div>
                        </div>
                      )}
                      {/* Render Text Content ONLY if type is text */}
                      {message.type === 'text' && (
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      )}
                      {/* Timestamp - always visible */}
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                      {/* Replace with user avatar if available */}
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
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12 rounded-full h-10"
              disabled={isLoading || isRecording}
            />
          </div>

          {/* Placeholder buttons - enable/implement if needed */}
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

          {/* Mic/Stop Button */}
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className={`flex-shrink-0 rounded-full w-10 h-10 ${isRecording ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
            onClick={handleAudioMessage}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </Button>

          {/* Send Button */}
          <Button
            size="icon"
            onClick={handleSendMessage}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-10 h-10 flex-shrink-0"
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

