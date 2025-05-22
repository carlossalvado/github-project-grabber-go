
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ChatContainer from '@/components/ChatContainer';

// Chave consistente para armazenar dados do plano no localStorage
const USER_PLAN_CACHE_KEY = 'user-plan-cache';

// Define the plan type to fix TypeScript errors
type CachedPlan = {
  id: number | null;
  name: string;
  features: {
    text: boolean;
    audio: boolean;
    premium?: boolean;
  };
  status: string;
  cachedAt: string;
} | null;

// Define a default plan object to avoid type errors
const DEFAULT_PLAN = {
  id: null,
  name: 'Basic Plan',
  features: {
    text: true,
    audio: false,
    premium: false
  },
  status: 'active'
};

const ChatPage = () => {
  const { user } = useAuth();
  const [cachedUserPlan] = useLocalStorage<CachedPlan>(USER_PLAN_CACHE_KEY, null);
  
  // Create a temporary agentId for demo purposes
  const agentId = "ai-agent-1"; 
  const agentName = "Sweet AI";
  const agentAvatar = "https://i.imgur.com/nV9pbvg.jpg";
  
  // Use a simpler state to determine features directly from cache
  const userPlan = cachedUserPlan || DEFAULT_PLAN;
  
  // Determine if user has premium features based on cache
  const hasPremiumFeatures = userPlan && 
    typeof userPlan === 'object' && 
    'features' in userPlan ? 
    Boolean(userPlan.features?.premium) : 
    false;
    
  const hasAudioFeature = userPlan && 
    typeof userPlan === 'object' && 
    'features' in userPlan ? 
    Boolean(userPlan.features?.audio) : 
    false;

  return (
    <div className="min-h-screen bg-sweetheart-light/20 flex flex-col">
      <div className="flex-1 flex flex-col h-screen">
        <ChatContainer 
          agentId={agentId}
          nickname={agentName}
          agentAvatar={agentAvatar}
          subscription={cachedUserPlan ? {
            id: "temp-subscription-id",
            user_id: user?.id || "anonymous",
            plan_id: cachedUserPlan.id || 0,
            plan_name: cachedUserPlan.name,
            status: cachedUserPlan.status || 'active',
            start_date: new Date().toISOString(),
            end_date: null,
            plan: {
              id: cachedUserPlan.id || 0,
              name: cachedUserPlan.name,
              description: "User cached plan",
              price: 0,
              trial_days: 0,
              features: cachedUserPlan.features
            }
          } : null}
          hasPremiumFeatures={hasPremiumFeatures}
          hasAudioFeature={hasAudioFeature}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default ChatPage;
