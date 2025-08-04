
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import MessageBubble, { Message } from './MessageBubble';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import { useToast } from '@/hooks/use-toast';
import { Subscription } from '@/contexts/SubscriptionContext';
import GiftSelection from './GiftSelection';
import EmoticonSelector from './EmoticonSelector';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ChatContainerProps {
  className?: string;
  agentId: string;
  nickname: string;
  agentAvatar?: string;
  subscription: Subscription | null;
  hasPremiumFeatures?: boolean;
  hasAudioFeature?: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  className, 
  agentId, 
  nickname,
  agentAvatar,
  subscription,
  hasPremiumFeatures = false,
  hasAudioFeature = false
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Olá! Sou ${nickname}, seu companheiro virtual. Como está se sentindo hoje?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const webhookUrl = "https://carlos0409.app.n8n.cloud/webhook/d9739-ohasd-5-pijasd54-asd42";

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate AI typing...
    setIsTyping(true);
    
    try {
      // Send message to n8n webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          userId: "user-" + Date.now(),
          timestamp: new Date().toISOString(),
          agentId: agentId,
          nickname: nickname,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received n8n response:", data);
      
      // Extract AI response from n8n
      let aiContent = "";
      
      // Handle different response formats
      if (data.output) {
        // Format 1: { output: "message" }
        aiContent = data.output;
      } else if (Array.isArray(data) && data[0] && data[0].output) {
        // Format 2: [{ output: "message" }]
        aiContent = data[0].output;
      } else if (data.response) {
        // Format 3: { response: "message" }
        aiContent = data.response;
      } else {
        // Fallback if no expected format is found
        aiContent = "Desculpe, não consegui processar essa mensagem.";
      }
      
      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with n8n:", error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao serviço de IA. Tente novamente mais tarde.",
        variant: "destructive",
      });
      
      // Show fallback message if there's an error
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, estou com problemas para me conectar agora. Tente novamente mais tarde.",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendGift = async (giftId: string, giftName: string, giftPrice: number) => {
    // Fechamos a seleção de presentes
    setShowGiftSelection(false);
    
    try {
      console.log("Iniciando envio de presente:", { giftId, giftName, giftPrice });
      
      // Get current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase.functions.invoke('create-paypal-gift-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
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
        return;
      }
      
      // Se chegou até aqui, vamos processar localmente como fallback
      // Fetch the gift emoji from the database
      const { data: giftData, error: giftError } = await supabase
        .from('gifts')
        .select('image_url')
        .eq('id', giftId)
        .single();
      
      if (giftError) throw giftError;
      
      const giftEmoji = giftData?.image_url || '🎁';
      
      // Adicionamos uma mensagem de sistema sobre o presente
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `Você enviou um presente: ${giftName}`,
        sender: 'system',
        timestamp: new Date(),
        isGift: true,
        giftId: giftId,
        giftEmoji: giftEmoji
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Simulamos uma resposta do agente agradecendo pelo presente
      setIsTyping(true);
      
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Uau! Muito obrigado pelo ${giftName}! Você é incrível! ❤️`,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao processar presente:', error);
      toast({
        title: "Erro ao processar presente",
        description: error.message || 'Tente novamente mais tarde.',
        variant: "destructive",
      });
    }
  };

  const addEmoticon = (emoticon: string) => {
    setInput(prev => prev + emoticon);
    setShowEmoticons(false);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      <ChatHeader 
        nickname={nickname} 
        onGiftClick={() => setShowGiftSelection(true)}
        hasPremiumFeatures={hasPremiumFeatures}
        agentAvatar={agentAvatar}
      />
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-2">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              agentAvatar={agentAvatar}
              agentName={nickname}
            />
          ))}
          
          {isTyping && (
            <div className="flex items-center mt-4">
              <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                {agentAvatar ? (
                  <AvatarImage src={agentAvatar} alt={nickname} />
                ) : (
                  <AvatarFallback className="bg-black text-white">
                    {nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="bg-gray-100 py-3 px-4 rounded-3xl rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {showEmoticons && (
        <div className="relative">
          <EmoticonSelector 
            onSelect={addEmoticon} 
            onClose={() => setShowEmoticons(false)}
          />
        </div>
      )}
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isTyping} 
        hasAudioFeature={hasAudioFeature} 
        onEmoticonClick={() => setShowEmoticons(!showEmoticons)}
        onGiftClick={() => setShowGiftSelection(true)}
        value={input}
        onChange={(value) => setInput(value)}
      />

      {showGiftSelection && (
        <GiftSelection 
          onGiftSend={() => {}}
          onClose={() => setShowGiftSelection(false)} 
        />
      )}
    </div>
  );
};

export default ChatContainer;
