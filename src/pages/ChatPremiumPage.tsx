
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ChatContainer from '@/components/ChatContainer';
import { useUserCache } from '@/hooks/useUserCache';
import { useSubscription } from '@/contexts/SubscriptionContext';

const ChatPremiumPage = () => {
  const navigate = useNavigate();
  const { agent } = useUserCache();
  const { userSubscription } = useSubscription();

  const handleBackToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={handleBackToProfile}
            variant="outline"
            className="flex items-center gap-2 text-white border-pink-500 hover:bg-pink-500 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Perfil
          </Button>
          <h1 className="text-2xl font-bold text-pink-500">Chat Premium</h1>
          <div className="w-32"></div> {/* Spacer for center alignment */}
        </div>
        <ChatContainer 
          agentId={agent?.agent_id || 'default'}
          nickname={agent?.nickname || 'Assistente'}
          agentAvatar={agent?.avatar_url}
          subscription={userSubscription}
          hasPremiumFeatures={true}
          hasAudioFeature={true}
        />
      </div>
    </div>
  );
};

export default ChatPremiumPage;
