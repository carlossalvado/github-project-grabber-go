
import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Phone, Video, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ChatHeaderProps {
  nickname: string;
  onGiftClick: () => void;
  hasPremiumFeatures: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ nickname, onGiftClick, hasPremiumFeatures }) => {
  const { userSubscription } = useSubscription();
  
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
    <div className="bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-sweet flex items-center justify-center text-white font-bold text-xl">
          {nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{nickname}</h3>
          <div className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center">
        <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs mr-3">
          {planName}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onGiftClick}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
          >
            <Gift size={20} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={handleVoiceCall}
          >
            <Phone size={20} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={handleVideoCall}
          >
            <Video size={20} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost"
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
