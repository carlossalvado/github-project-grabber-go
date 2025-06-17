
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Mic, Send, Smile, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import EmoticonSelector from '@/components/EmoticonSelector';
import GiftSelection from '@/components/GiftSelection';
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
  giftId?: string;
  giftName?: string;
  giftEmoji?: string;
}

const ModernChatPage = () => {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmoticonSelector, setShowEmoticonSelector] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const isMobile = useIsMobile();
  
  // Contact info (this would come from props or context)
  const contactName = "Charlotte";
  const contactAvatar = "https://i.imgur.com/placeholder-woman.jpg";
  
  // Zerando o histórico - mensagens vazias inicialmente
  const [messages, setMessages] = useState<ModernMessage[]>([]);

  // Get user plan name
  const planName = userSubscription?.plan_name || userSubscription?.plan?.name || "Plano Básico";

  useEffect(() => {
    // Check for gift success/cancel parameters
    const urlParams = new URLSearchParams(window.location.search);
    const giftSuccess = urlParams.get('gift_success');
    const giftId = urlParams.get('gift_id');
    const giftName = urlParams.get('gift_name');
    const giftCanceled = urlParams.get('gift_canceled');
    
    if (giftSuccess === 'true' && giftId && giftName) {
      handleGiftPaymentSuccess(giftId, decodeURIComponent(giftName));
      // Clean URL
      window.history.replaceState({}, document.title, '/modern-chat');
    }
    
    if (giftCanceled === 'true') {
      toast.error('Compra de presente cancelada');
      // Clean URL
      window.history.replaceState({}, document.title, '/modern-chat');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setInput('');
    setIsLoading(true);

    // Blur input to hide keyboard on mobile
    if (isMobile && inputRef.current) {
      inputRef.current.blur();
    }

    // Simulate typing delay for contact response
    setTimeout(() => {
      const contactMessage: ModernMessage = {
        id: (Date.now() + 1).toString(),
        content: `Olá! Recebi sua mensagem: "${userMessage.content}"`,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, contactMessage]);
      setIsLoading(false);
    }, 2000);
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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleEmoticonClick = () => {
    setShowEmoticonSelector(!showEmoticonSelector);
    setShowGiftSelection(false);
  };

  const handleGiftClick = () => {
    setShowGiftSelection(!showGiftSelection);
    setShowEmoticonSelector(false);
  };

  const handleEmoticonSelect = (emoticon: string) => {
    setInput(prev => prev + emoticon);
    setShowEmoticonSelector(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGiftSelect = async (giftId: string, giftName: string, giftPrice: number) => {
    try {
      setIsLoading(true);
      
      console.log("Selecionando presente:", { giftId, giftName, giftPrice });
      
      const { data, error } = await supabase.functions.invoke('create-gift-checkout', {
        body: {
          giftId
        }
      });

      if (error) {
        console.error("Erro na function invoke:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Erro retornado pela função:", data.error);
        throw new Error(data.error);
      }

      console.log("Checkout session criada:", data);

      if (data?.url) {
        console.log("Redirecionando para:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
      
      setShowGiftSelection(false);
    } catch (error: any) {
      console.error('Error processing gift:', error);
      toast.error('Erro ao processar presente: ' + (error.message || 'Tente novamente'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiftPaymentSuccess = (giftId: string, giftName: string) => {
    // Get gift emoji mapping
    const giftEmojis: { [key: string]: string } = {
      "00000000-0000-0000-0000-000000000001": "🌹",
      "00000000-0000-0000-0000-000000000002": "🍫", 
      "00000000-0000-0000-0000-000000000003": "🧸",
      "00000000-0000-0000-0000-000000000004": "💐"
    };

    const giftMessage: ModernMessage = {
      id: Date.now().toString(),
      content: `Enviou um presente: ${giftName}`,
      sender: 'user',
      timestamp: new Date(),
      type: 'gift',
      giftId,
      giftName,
      giftEmoji: giftEmojis[giftId] || '🎁'
    };
    
    setMessages(prev => [...prev, giftMessage]);
    toast.success(`Presente ${giftName} enviado com sucesso!`);

    // Simulate contact response
    setTimeout(() => {
      const responseMessage: ModernMessage = {
        id: (Date.now() + 1).toString(),
        content: `Que presente lindo! Muito obrigada pelo ${giftName}! ${giftEmojis[giftId] || '🎁'} ❤️`,
        sender: 'contact',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1500);
  };

  // Mobile loading component
  const MobileLoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%] space-y-1">
        <div className="bg-gray-700 text-white rounded-6xl rounded-bl-md px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-300">digitando...</span>
          </div>
        </div>
      </div>
    </div>
  );

  const AnimatedGiftMessage = ({ message }: { message: ModernMessage }) => (
    <div className="flex justify-center my-6">
      <div className="relative">
        <div className="text-8xl animate-bounce drop-shadow-2xl">
          {message.giftEmoji || '🎁'}
        </div>
        
        <div className="absolute -top-2 -left-2 text-2xl animate-pulse text-yellow-400">✨</div>
        <div className="absolute -top-1 -right-2 text-xl animate-pulse text-pink-400" style={{ animationDelay: '0.5s' }}>💫</div>
        <div className="absolute -bottom-1 -left-1 text-lg animate-pulse text-purple-400" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute -bottom-2 -right-1 text-2xl animate-pulse text-blue-400" style={{ animationDelay: '1.5s' }}>✨</div>
        
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-ping text-red-400">❤️</div>
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
          {/* Plan info box */}
          <div className="bg-purple-600 px-3 py-1 rounded-full">
            <span className="text-xs font-medium text-white">{planName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700"
            >
              <Phone size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700"
            >
              <Video size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4" style={{ paddingBottom: showEmoticonSelector ? '70vh' : '1rem' }}>
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center text-gray-400">
                  <p className="text-lg mb-2">Comece uma conversa!</p>
                  <p className="text-sm">Digite uma mensagem para {contactName}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Today label */}
                <div className="flex justify-center">
                  <span className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    Hoje
                  </span>
                </div>

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[70%] space-y-1">
                      {message.type === 'text' && (
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-purple-600 text-white rounded-br-md'
                              : 'bg-gray-700 text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      )}

                      {message.type === 'gift' && (
                        <AnimatedGiftMessage message={message} />
                      )}
                      
                      {message.type === 'image' && message.images && (
                        <div className="grid grid-cols-2 gap-2">
                          {message.images.map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`Shared image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                      
                      {message.type === 'audio' && (
                        <div className="bg-purple-600 px-4 py-3 rounded-2xl rounded-br-md flex items-center gap-3">
                          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                          </div>
                          <div className="flex-1">
                            <div className="w-full h-1 bg-white bg-opacity-30 rounded-full">
                              <div className="w-1/3 h-full bg-white rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-xs text-white opacity-90">{message.audioDuration}</span>
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-1 text-xs text-gray-400 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {message.sender === 'user' && (
                          <div className="flex">
                            <span className="text-blue-400">✓✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator for mobile */}
                {isLoading && isMobile && <MobileLoadingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Emoticon Selector */}
      {showEmoticonSelector && (
        <EmoticonSelector
          onSelect={handleEmoticonSelect}
          onClose={() => setShowEmoticonSelector(false)}
        />
      )}

      {/* Gift Selection Modal */}
      {showGiftSelection && (
        <GiftSelection
          onClose={() => setShowGiftSelection(false)}
          onSelectGift={handleGiftSelect}
        />
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
              placeholder="Send message ..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12 rounded-full"
              disabled={isLoading}
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEmoticonClick}
            className={`flex-shrink-0 ${
              showEmoticonSelector 
                ? 'text-purple-400 bg-gray-700' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            disabled={isLoading}
          >
            <Smile size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGiftClick}
            className={`flex-shrink-0 ${
              showGiftSelection 
                ? 'text-purple-400 bg-gray-700' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            disabled={isLoading}
          >
            <Gift size={20} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`flex-shrink-0 ${
              isRecording 
                ? 'text-red-400 hover:bg-red-900' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
            disabled={isLoading}
          >
            <Mic size={20} />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full flex-shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernChatPage;
