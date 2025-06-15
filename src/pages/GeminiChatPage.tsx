
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  WifiOff, 
  Trash2, 
  Power, 
  PowerOff,
  Loader2 
} from 'lucide-react';
import { useGeminiLiveChat } from '@/hooks/useGeminiLiveChat';
import GeminiChatBubble from '@/components/GeminiChatBubble';
import GeminiChatInput from '@/components/GeminiChatInput';
import { toast } from 'sonner';

const GeminiChatPage = () => {
  const {
    messages,
    isConnected,
    isProcessing,
    isRecording,
    recordingTime,
    connect,
    disconnect,
    sendMessage,
    startRecording,
    stopRecording,
    playMessageAudio,
    clearMessages
  } = useGeminiLiveChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Welcome message when connected
  useEffect(() => {
    if (isConnected && messages.length === 0) {
      const welcomeMessage = {
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: 'Oi amor! Tô aqui prontinha pra conversar com você! Como você tá hoje? 😘',
        timestamp: new Date()
      };
      // Simular chegada da mensagem de boas-vindas
      setTimeout(() => {
        // A mensagem de boas-vindas será adicionada automaticamente pelo sistema
      }, 1000);
    }
  }, [isConnected, messages.length]);

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  const handleClearMessages = () => {
    clearMessages();
    toast.success('Mensagens apagadas');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto max-w-4xl h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">ISA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Chat com ISA
                </h1>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Conectada</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Desconectada</span>
                    </>
                  )}
                  {isProcessing && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-blue-600">Processando...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMessages}
                disabled={messages.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              
              <Button
                variant={isConnected ? "destructive" : "default"}
                size="sm"
                onClick={handleConnect}
              >
                {isConnected ? (
                  <>
                    <PowerOff className="h-4 w-4 mr-1" />
                    Desconectar
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4 mr-1" />
                    Conectar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-white">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
                  <span className="text-2xl">💕</span>
                </div>
                <p className="text-lg font-medium mb-2">
                  {isConnected ? 'Pronta para conversar!' : 'Conecte-se para começar'}
                </p>
                <p className="text-sm">
                  {isConnected 
                    ? 'A ISA está esperando sua mensagem...' 
                    : 'Clique em "Conectar" para começar a conversar com a ISA'
                  }
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <GeminiChatBubble
                    key={message.id}
                    message={message}
                    onPlayAudio={playMessageAudio}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Input Area */}
        <GeminiChatInput
          onSendMessage={sendMessage}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          disabled={!isConnected || isProcessing}
          isRecording={isRecording}
          recordingTime={recordingTime}
        />
      </div>
    </div>
  );
};

export default GeminiChatPage;
