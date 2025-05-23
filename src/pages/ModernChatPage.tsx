
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Video, Plus, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModernMessage {
  id: string;
  content: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  type: 'text' | 'image' | 'audio';
  images?: string[];
  audioDuration?: string;
}

const ModernChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Contact info (this would come from props or context)
  const contactName = "Charlotte";
  const contactAvatar = "https://i.imgur.com/placeholder-woman.jpg";
  
  const [messages, setMessages] = useState<ModernMessage[]>([
    {
      id: '1',
      content: 'Hi, good morning Charlotte... 😊😊',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '2',
      content: 'It seems we have a lot in common & have a lot of interest in each other 😊',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '3',
      content: 'Hello, good morning too Andrew 👋',
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '4',
      content: 'Haha, yes I\'ve seen your profile and I\'m a perfect match 😁😁',
      sender: 'contact',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '5',
      content: 'I want to invite you to dinner tomorrow night at 7 at Starbelly Restaurant 😊',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '6',
      content: '',
      sender: 'user',
      timestamp: new Date(),
      type: 'image',
      images: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=150&fit=crop',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&h=150&fit=crop'
      ]
    },
    {
      id: '7',
      content: 'What do you think?',
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    },
    {
      id: '8',
      content: '',
      sender: 'user',
      timestamp: new Date(),
      type: 'audio',
      audioDuration: '09:41'
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: ModernMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Today label */}
          <div className="flex justify-center">
            <span className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
              Today
            </span>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%] space-y-1">
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
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-gray-700 flex-shrink-0"
          >
            <Plus size={20} />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send message ..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12 rounded-full"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`flex-shrink-0 ${
              isRecording 
                ? 'text-red-400 hover:bg-red-900' 
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Mic size={20} />
          </Button>
          
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full flex-shrink-0"
            disabled={!input.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModernChatPage;
