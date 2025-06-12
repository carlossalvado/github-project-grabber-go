import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalCache, CachedMessage } from '@/hooks/useLocalCache';
import { useN8nWebhook } from '@/hooks/useN8nWebhook';
import { supabase } from '@/integrations/supabase/client';

const ChatTrialPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, addMessage } = useLocalCache();
  const { sendToN8n, isLoading: n8nLoading } = useN8nWebhook();
  
  const [input, setInput] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [agentData, setAgentData] = useState({
    name: 'Isa Trial',
    avatar_url: '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const maxTrialMessages = 10;

  // Buscar dados do agente selecionado pelo usuário
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.id) return;

      try {
        // Buscar o agente selecionado pelo usuário
        const { data: selectedAgent, error: selectedError } = await supabase
          .from('user_selected_agent')
          .select('agent_id, nickname')
          .eq('user_id', user.id)
          .single();

        if (selectedError) {
          console.error('Erro ao buscar agente selecionado:', selectedError);
          return;
        }

        if (selectedAgent) {
          // Buscar dados completos do agente
          const { data: agent, error: agentError } = await supabase
            .from('ai_agents')
            .select('name, avatar_url')
            .eq('id', selectedAgent.agent_id)
            .single();

          if (agentError) {
            console.error('Erro ao buscar dados do agente:', agentError);
            return;
          }

          if (agent) {
            setAgentData({
              name: `${selectedAgent.nickname || agent.name} Trial`,
              avatar_url: agent.avatar_url
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do agente:', error);
      }
    };

    fetchAgentData();
  }, [user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || n8nLoading || !user) return;

    if (messageCount >= maxTrialMessages) {
      toast.error('Limite de mensagens do trial atingido! Faça upgrade para continuar.');
      return;
    }

    const messageText = input.trim();
    setInput('');
    setMessageCount(prev => prev + 1);

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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const remainingMessages = maxTrialMessages - messageCount;

  if (!user) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Por favor, faça login para acessar o trial.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col w-full">
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
            <AvatarFallback className="bg-orange-600">{agentData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{agentData.name}</span>
            <Badge variant="secondary" className="text-xs bg-orange-600 text-white">
              <Clock size={12} className="mr-1" />
              Trial - {remainingMessages} mensagens restantes
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-orange-400 hover:text-orange-300"
          onClick={() => navigate('/plans')}
        >
          Fazer Upgrade
        </Button>
      </div>

      {/* Trial Warning */}
      {remainingMessages <= 3 && (
        <div className="bg-orange-600/20 border-b border-orange-500/30 p-3 text-center">
          <p className="text-orange-300 text-sm">
            ⚠️ Você tem {remainingMessages} mensagens restantes no seu trial. 
            <Button 
              variant="link" 
              className="text-orange-400 underline p-0 ml-1"
              onClick={() => navigate('/plans')}
            >
              Faça upgrade agora!
            </Button>
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isUserMessage = message.type === 'user';
              
              return (
                <div key={message.id} className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}>
                  {!isUserMessage && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                      <AvatarImage src={agentData.avatar_url} alt={agentData.name} />
                      <AvatarFallback className="bg-orange-600 text-white">
                        {agentData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%] space-y-1">
                    <div className={`px-4 py-3 rounded-2xl shadow-md ${
                      isUserMessage 
                        ? 'bg-orange-600 text-white rounded-br-none' 
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
            })}
          </div>
          
          <div ref={messagesEndRef} />
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2">
        <Input
          ref={inputRef}
          className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus-visible:ring-orange-500"
          placeholder={
            remainingMessages > 0 
              ? "Digite uma mensagem..." 
              : "Trial expirado - Faça upgrade para continuar"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={n8nLoading || remainingMessages <= 0}
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-gray-400 hover:text-orange-400"
          onClick={handleSendMessage}
          disabled={!input.trim() || n8nLoading || remainingMessages <= 0}
        >
          {n8nLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatTrialPage;
