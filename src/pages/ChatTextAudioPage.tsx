import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Loader2, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { useWebAudioRecorder } from '@/hooks/useWebAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const ChatTextAudioPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  
  // Gravação de áudio para N8N
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  } = useWebAudioRecorder();
  
  // Reprodução de áudio
  const { isPlaying, playAudio, stopAudio } = useAudioPlayer();
  
  const [input, setInput] = useState('');
  const [audioMessages, setAudioMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    audioData?: string;
  }>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const n8nAudioWebhookUrl = "https://fghj789hjk.app.n8n.cloud/webhook/aud6345345io-chggsdfat-gemi465ni-gdgfg456";

  // Agent data
  const agentData = {
    name: 'Isa',
    avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, audioMessages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || n8nLoading || isRecording || !user) return;

    const messageText = input.trim();
    setInput('');

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

  const handleAudioMessage = async () => {
    if (!user) {
      toast.error('Faça login primeiro');
      return;
    }
    
    if (isRecording) {
      console.log('🛑 [AUDIO] Parando gravação...');
      const audioData = await stopRecording();
      if (audioData) {
        console.log('🎤 [CHAT] Enviando áudio para N8N...');
        await sendAudioToN8n(audioData);
      }
    } else {
      console.log('🎤 [AUDIO] Iniciando gravação...');
      await startRecording();
    }
  };

  const sendAudioToN8n = async (audioData: ArrayBuffer) => {
    try {
      // Adicionar mensagem de áudio do usuário
      const userAudioMessage = {
        id: crypto.randomUUID(),
        type: 'user' as const,
        content: '[Mensagem de áudio]',
        timestamp: new Date()
      };
      setAudioMessages(prev => [...prev, userAudioMessage]);
      
      // Converter ArrayBuffer para base64
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));
      
      const response = await fetch(n8nAudioWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'audio',
          audioData: base64Audio,
          timestamp: new Date().toISOString(),
          user: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar áudio para N8N: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔊 [AUDIO] Resposta de áudio do N8N:', data);
      
      // Adicionar resposta da assistente COM ÁUDIO
      const assistantMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: data.response || data.message || 'Resposta de áudio processada',
        timestamp: new Date(),
        audioData: data.audioData || data.audioResponse
      };
      
      console.log('🎵 [AUDIO] Adicionando resposta de áudio da assistente:', assistantMessage);
      setAudioMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('❌ [AUDIO] Erro ao enviar áudio:', error);
      toast.error(`Erro ao processar áudio: ${error.message}`);
    }
  };

  const handlePlayAudio = async (audioData?: string) => {
    if (!audioData) {
      console.log('❌ [AUDIO] Nenhum dado de áudio disponível');
      return;
    }
    
    console.log('🔊 [AUDIO] Reproduzindo áudio...');
    if (isPlaying) {
      stopAudio();
    } else {
      await playAudio(audioData);
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

  const renderTextMessage = (message: CachedMessage) => {
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
            <p className="whitespace-pre-wrap break-words text-sm">{message.transcription}</p>
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
  };

  const renderAudioMessage = (message: {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    audioData?: string;
  }) => {
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
            <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            
            {/* Controle de áudio para respostas da assistente */}
            {!isUserMessage && message.audioData && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-gray-600"
                  onClick={() => handlePlayAudio(message.audioData)}
                >
                  <Volume2 size={14} />
                </Button>
                <span className="text-xs opacity-70">Áudio gerado via N8N</span>
              </div>
            )}
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUserMessage ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp.toISOString())}
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
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
          onClick={() => setAudioMessages([])}
        >
          Limpar Áudios
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {/* Text Messages */}
          {messages.map(renderTextMessage)}
          
          {/* Audio Messages */}
          {audioMessages.map(renderAudioMessage)}
          
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 p-6 rounded-2xl flex flex-col items-center justify-center">
          <div className="animate-pulse mb-3">
            <Mic size={48} className="text-red-500" />
          </div>
          <div className="text-white font-medium mb-2">
            {formatRecordingTime(recordingTime)}
          </div>
          <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          <div className="text-xs text-gray-300 mt-2">
            Enviando para N8N: {Math.round(audioLevel)}%
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
          disabled={n8nLoading}
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
          disabled={n8nLoading || isRecording}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-white"
          onClick={handleSendMessage}
          disabled={!input.trim() || n8nLoading || isRecording}
        >
          {n8nLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatTextAudioPage;
