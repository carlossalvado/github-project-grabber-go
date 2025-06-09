import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Loader2, 
  Phone,
  PhoneOff,
  Camera,
  Monitor,
  VideoOff,
  Volume2,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGeminiWebSocket } from '@/hooks/useGeminiWebSocket';
import { useWebAudioRecorder } from '@/hooks/useWebAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import N8nWebhookConfig from '@/components/N8nWebhookConfig';

const ChatTextAudioPageNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // WebSocket e sessão
  const {
    session,
    isConnected,
    messages,
    startSession,
    stopSession,
    sendTextMessage,
    sendAudioData,
    sendVideoFrame,
    setVideoMode
  } = useGeminiWebSocket();
  
  // Gravação de áudio
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    audioLevel
  } = useWebAudioRecorder();
  
  // Reprodução de áudio
  const { isPlaying, playAudio, stopAudio } = useAudioPlayer();
  
  // Estados locais
  const [input, setInput] = useState('');
  const [videoMode, setVideoModeState] = useState<'camera' | 'screen' | 'none'>('none');
  const [showN8nConfig, setShowN8nConfig] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Agent data
  const agentData = {
    name: 'Isa',
    avatar_url: 'https://i.imgur.com/nV9pbvg.jpg'
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    console.log('📱 [CHAT] Mensagens atualizadas:', messages.length);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Iniciar/parar captura de vídeo
  const handleVideoMode = async (mode: 'camera' | 'screen' | 'none') => {
    console.log('📹 [VIDEO] Mudando modo para:', mode);
    
    // Parar captura anterior
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setVideoModeState(mode);
    setVideoMode(mode);
    
    if (mode === 'none') return;
    
    try {
      let stream: MediaStream;
      
      if (mode === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 }
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { width: 640, height: 480 }
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Enviar frames a cada 2 segundos
        videoIntervalRef.current = setInterval(() => {
          captureVideoFrame();
        }, 2000);
      }
      
      console.log('✅ [VIDEO] Captura iniciada:', mode);
      
    } catch (error) {
      console.error('❌ [VIDEO] Erro ao iniciar captura:', error);
      toast.error(`Erro ao acessar ${mode === 'camera' ? 'câmera' : 'tela'}`);
    }
  };

  const captureVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || !isConnected) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    sendVideoFrame(frameData);
    
    console.log('📸 [VIDEO] Frame enviado');
  };

  const handleStartSession = async () => {
    await startSession();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !isConnected) return;
    
    console.log('📤 [CHAT] Enviando mensagem:', input);
    const messageText = input.trim();
    setInput('');
    sendTextMessage(messageText);
  };

  const handleAudioMessage = async () => {
    if (!isConnected) {
      toast.error('Conecte-se primeiro');
      return;
    }
    
    if (isRecording) {
      console.log('🛑 [AUDIO] Parando gravação...');
      const audioData = await stopRecording();
      if (audioData) {
        console.log('🎤 [CHAT] Enviando áudio para N8N...');
        sendAudioData(audioData);
      }
    } else {
      console.log('🎤 [AUDIO] Iniciando gravação...');
      await startRecording();
    }
  };

  const handlePlayMessage = async (audioData?: string) => {
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

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o chat.</p>
      </div>
    );
  }

  if (showN8nConfig) {
    return (
      <div className="h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setShowN8nConfig(false)}
            className="mb-4 text-white"
          >
            <ArrowLeft size={20} />
            Voltar ao Chat
          </Button>
          <N8nWebhookConfig />
        </div>
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
          <div className="flex flex-col">
            <span className="font-medium">{agentData.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                {isConnected ? 'Conectada via N8N' : 'Desconectada'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => setShowN8nConfig(true)}
          >
            <Settings size={20} />
          </Button>
          
          <Button
            variant={isConnected ? "destructive" : "default"}
            size="sm"
            onClick={isConnected ? stopSession : handleStartSession}
          >
            {isConnected ? <PhoneOff size={16} /> : <Phone size={16} />}
            {isConnected ? 'Desconectar' : 'Conectar N8N'}
          </Button>
        </div>
      </div>

      {/* Video preview (hidden) */}
      <video ref={videoRef} className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isUserMessage = message.type === 'user';
              
              console.log('🎨 [CHAT] Renderizando mensagem:', message);
              
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
                            onClick={() => handlePlayMessage(message.audioData)}
                          >
                            <Volume2 size={14} />
                          </Button>
                          <span className="text-xs opacity-70">Áudio gerado via N8N</span>
                        </div>
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
          disabled={!isConnected}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        
        <Input
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-purple-500"
          placeholder={isConnected ? "Digite uma mensagem..." : "Configure N8N primeiro..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={!isConnected}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-white"
          onClick={handleSendMessage}
          disabled={!input.trim() || !isConnected}
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  );
};

export default ChatTextAudioPageNew;
