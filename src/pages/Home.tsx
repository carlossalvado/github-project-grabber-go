
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { userSubscription, plans, loading: subscriptionLoading } = useSubscription();
  
  // Loading page
  return (
    <div className="min-h-screen bg-sweetheart-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold bg-gradient-sweet bg-clip-text text-transparent mb-6">
          Isa date
        </h1>
        
        <div className="my-8 text-center">
          <p className="text-xl mb-4">Bem-vindo ao Isa date</p>
          <div className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <p className="text-lg">Olá, {user.email}!</p>
                {userSubscription && (
                  <div className="p-4 bg-white rounded-lg shadow-md">
                    <p className="font-medium">Plano atual: {userSubscription.plan_name}</p>
                    <p className="text-sm text-gray-600">Status: {userSubscription.status}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-lg">Faça login para acessar sua conta</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
