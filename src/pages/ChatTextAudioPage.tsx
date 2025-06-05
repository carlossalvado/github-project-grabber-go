
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Play, Pause, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { elevenLabsService } from '@/services/elevenLabsService';

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage, updateMessage } = useLocalCache();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Agent data
  const agentData = {
    name: 'Isa',
    avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      });
      audioElementsRef.current.clear();
    };
  }, []);

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
      toast.error("Não foi possível acessar o microfone.");
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

  const processAudioMessage = async (audioBlob: Blob) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const audioUrl = elevenLabsService.createAudioUrl(audioBlob);
    
    // Add user message immediately
    const messageId = addMessage({
      type: 'user',
      audioBlob,
      audioUrl,
      timestamp: new Date().toISOString()
    });

    try {
      setIsLoading(true);

      // Transcribe audio
      const transcription = await elevenLabsService.transcribeAudio(audioBlob);
      
      // Update message with transcription
      updateMessage(messageId, { transcription });

      // Generate AI response
      const responseText = `Recebi seu áudio: "${transcription}". Esta é uma resposta de exemplo.`;
      const responseAudioBlob = await elevenLabsService.generateSpeech(responseText);
      const responseAudioUrl = elevenLabsService.createAudioUrl(responseAudioBlob);

      // Add AI response
      addMessage({
        type: 'assistant',
        audioBlob: responseAudioBlob,
        audioUrl: responseAudioUrl,
        transcription: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isRecording || !user) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user text message
    addMessage({
      type: 'user',
      transcription: messageText,
      timestamp: new Date().toISOString()
    });

    try {
      // Generate AI response
      const responseText = `Você disse: "${messageText}". Esta é uma resposta de exemplo.`;
      const responseAudioBlob = await elevenLabsService.generateSpeech(responseText);
      const responseAudioUrl = elevenLabsService.createAudioUrl(responseAudioBlob);

      // Add AI response
      addMessage({
        type: 'assistant',
        audioBlob: responseAudioBlob,
        audioUrl: responseAudioUrl,
        transcription: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error generating response:', error);
      toast.error(`Erro ao gerar resposta: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (message: CachedMessage) => {
    if (!message.audioUrl) return;

    try {
      let audio = audioElementsRef.current.get(message.id);

      // Stop any currently playing audio
      audioElementsRef.current.forEach((existingAudio, id) => {
        if (id !== message.id && !existingAudio.paused) {
          existingAudio.pause();
          setPlayingMessageId(null);
        }
      });

      if (audio) {
        if (audio.paused) {
          await audio.play();
          setPlayingMessageId(message.id);
        } else {
          audio.pause();
          setPlayingMessageId(null);
        }
      } else {
        audio = new Audio(message.audioUrl);
        audioElementsRef.current.set(message.id, audio);

        audio.onended = () => {
          setPlayingMessageId(null);
        };

        audio.onerror = () => {
          toast.error("Erro ao carregar o áudio.");
          setPlayingMessageId(null);
        };

        await audio.play();
        setPlayingMessageId(message.id);
      }
    } catch (error) {
      console.error("Erro ao tocar áudio:", error);
      toast.error("Não foi possível tocar o áudio.");
      setPlayingMessageId(null);
    }
  };

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

  const renderMessageContent = (message: CachedMessage) => {
    const isUserMessage = message.type === 'user';
    
    return (
      <div className="space-y-2">
        {message.audioUrl && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isUserMessage ? 'text-white' : 'text-gray-900 dark:text-white'}`}
              onClick={() => playAudio(message)}
            >
              {playingMessageId === message.id ? <Pause size={18} /> : <Play size={18} />}
            </Button>
            <div className="text-xs text-gray-400">
              <span>Áudio</span>
            </div>
          </div>
        )}
        
        {message.transcription && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.transcription}</p>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

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
            <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
            <AvatarFallback className="bg-purple-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{agentData.name}</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.map((message) => {
            const isUserMessage = message.type === 'user';
            
            return (
              <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                {!isUserMessage && (
                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                    <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
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
