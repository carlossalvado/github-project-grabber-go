
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userSubscription } = useSubscription();
  
  const handlePlanSelection = () => {
    navigate('/plans');
  };
  
  return (
    <div className="min-h-screen bg-sweetheart-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-6">
          Isa date
        </h1>
        
        <div className="my-8 text-center">
          <p className="text-xl mb-4">Thank you for using Isa date</p>
          <div className="space-y-4">
            {!user ? (
              <div className="flex flex-col space-y-4 items-center">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                >
                  Login to your account
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  Create an account
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  View my profile
                </button>
                
                {userSubscription && userSubscription.status === 'active' ? (
                  <button 
                    onClick={() => navigate('/chat')}
                    className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Go to chat
                  </button>
                ) : (
                  <button 
                    onClick={handlePlanSelection}
                    className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                  >
                    Choose a subscription plan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
