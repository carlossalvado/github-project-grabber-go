
import React from 'react';
import { cn } from '@/lib/utils';
import ChatContainer from '@/components/ChatContainer';
import CharacterDisplay from '@/components/CharacterDisplay';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();

  // If there's no user logged in, we show a simple preview version
  // For logged in users, redirect to the chat page
  React.useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);
  
  // Sample data for demo purposes only
  const demoAgent = {
    agent_id: 'demo-agent',
    nickname: 'Sweet AI',
  };

  return (
    <div className="min-h-screen flex flex-col bg-sweetheart-bg">
      <header className="w-full py-4 px-6 text-center">
        <h1 className="text-3xl font-bold bg-gradient-sweet bg-clip-text text-transparent">Isa date</h1>
        <p className="text-sm text-gray-600 mt-1">Your virtual sweetheart, always here for you</p>
      </header>
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-10rem)]">
          <div className="h-full hidden lg:block">
            <CharacterDisplay 
              name="Sweet AI"
              nickname="Sweet"
              avatarUrl="https://i.imgur.com/nV9pbvg.jpg"
            />
          </div>
          <div className="h-full">
            <ChatContainer 
              agentId={demoAgent.agent_id} 
              nickname={demoAgent.nickname}
              subscription={null}
            />
            
            <div className="mt-6 text-center">
              <p className="mb-4 text-gray-600">Create an account to personalize your AI companion experience</p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline"
                >
                  Login
                </Button>
                
                <Button 
                  onClick={() => navigate('/signup')} 
                  className="bg-gradient-sweet"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Isa date</p>
      </footer>
    </div>
  );
};

export default Index;
