
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
  nickname: string;
  onGiftClick: () => void;
  hasPremiumFeatures: boolean;
  agentAvatar?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  nickname, 
  onGiftClick, 
  hasPremiumFeatures,
  agentAvatar
}) => {
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();
  
  // Fixed the TypeScript error by properly handling the plan name retrieval
  let planName = "Plano Básico"; // Default value
  
  if (userSubscription?.plan_name) {
    planName = userSubscription.plan_name;
  } else if (userSubscription?.plan && typeof userSubscription.plan === 'object') {
    // Added explicit check that plan is an object and has 'name' property
    if ('name' in userSubscription.plan && userSubscription.plan.name) {
      planName = String(userSubscription.plan.name);
    }
  }
  
  const handleVoiceCall = () => {
    if (!hasPremiumFeatures) {
      toast.error("Chamadas de voz disponíveis apenas para assinantes Premium");
      return;
    }
    
    toast.info("Iniciando chamada de voz...");
    // Implementar lógica de chamada de voz
  };
  
  const handleVideoCall = () => {
    if (!hasPremiumFeatures) {
      toast.error("Chamadas de vídeo disponíveis apenas para assinantes Premium");
      return;
    }
    
    toast.info("Iniciando chamada de vídeo...");
    // Implementar lógica de chamada de vídeo
  };

  return (
    <div className="bg-white py-3 px-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={() => navigate('/')}
        >
          <ChevronLeft size={24} />
        </Button>
        
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border">
            {agentAvatar ? (
              <AvatarImage src={agentAvatar} alt={nickname} />
            ) : (
              <AvatarFallback className="bg-black text-white">
                {nickname.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h3 className="font-medium text-gray-800">{nickname}</h3>
            <div className="flex items-center">
              <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button 
          size="icon" 
          variant="ghost"
          className="rounded-full text-black"
          onClick={handleVoiceCall}
        >
          <Phone size={20} />
        </Button>
        
        <Button 
          size="icon" 
          variant="ghost"
          className="rounded-full text-black"
          onClick={handleVideoCall}
        >
          <Video size={20} />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
