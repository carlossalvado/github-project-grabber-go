
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mic, MicOff, Send, Loader2, Wifi, WifiOff, Play, Pause } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useGeminiLiveAudio } from '@/hooks/useGeminiLiveAudio';

const GeminiLiveChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isRecording,
    isConnected,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    playMessageAudio,
    clearMessages,
    connect,
    disconnect
  } = useGeminiLiveAudio();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
            <AvatarImage src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="ISA" />
            <AvatarFallback className="bg-purple-600">ISA</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">ISA - Gemini Live</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi size={12} className="text-green-500" />
              ) : (
                <WifiOff size={12} className="text-red-500" />
              )}
              <span className="text-xs text-gray-400">
                {isConnected ? 'Conectada' : 'Desconectada'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => clearMessages()}
          >
            Limpar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={isConnected ? disconnect : connect}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-2xl">💕</span>
              </div>
              <p className="text-lg font-medium mb-2">
                {isConnected ? 'Pronta para conversar!' : 'Conectando...'}
              </p>
              <p className="text-sm">
                {isConnected 
                  ? 'A ISA está esperando sua mensagem de áudio...' 
                  : 'Aguarde a conexão com o Gemini Live'
                }
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                  {message.type === 'assistant' && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                      <AvatarImage src="/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png" alt="ISA" />
                      <AvatarFallback className="bg-purple-600 text-white">ISA</AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-md ${
                      message.type === 'user' 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-gray-700 text-white rounded-bl-none'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="whitespace-pre-wrap break-words text-sm flex-1">{message.content}</p>
                        {message.audioData && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 h-6 w-6 text-white/70 hover:text-white"
                            onClick={() => playMessageAudio(message.id)}
                          >
                            {message.isPlaying ? (
                              <Pause size={14} />
                            ) : (
                              <Play size={14} />
                            )}
                          </Button>
                        )}
                      </div>
                      {message.duration && (
                        <div className="text-xs text-white/60 mt-1">
                          {formatRecordingTime(message.duration)}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </ScrollArea>
      </div>

      {/* Recording Indicator */}
      {(isRecording || isProcessing) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-90 p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-500/50 min-w-80">
          <div className={cn(
            "mb-3",
            isRecording ? "animate-pulse" : ""
          )}>
            <Mic size={48} className={isRecording ? "text-red-500" : "text-blue-500"} />
          </div>
          
          <div className="text-white font-medium mb-2">
            {isRecording ? formatRecordingTime(recordingTime) : 'Processando...'}
          </div>
          
          <div className="text-xs text-gray-300">
            {isRecording ? 'Gravando com Gemini Live' : 'Aguardando resposta'}
          </div>

          {isRecording && (
            <Button
              onClick={stopRecording}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Parar Gravação
            </Button>
          )}
        </div>
      )}

      {/* Recording Controls */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-center">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className={`px-8 py-4 text-lg ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !isConnected}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : isRecording ? (
            <MicOff className="mr-2" size={20} />
          ) : (
            <Mic className="mr-2" size={20} />
          )}
          {isProcessing ? 'Processando...' : isRecording ? 'Parar' : 'Falar com ISA'}
        </Button>
      </div>
    </div>
  );
};

export default GeminiLiveChatPage;
