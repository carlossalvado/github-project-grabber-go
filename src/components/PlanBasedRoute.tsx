
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useTrialManager } from '@/hooks/useTrialManager';
import { Loader2 } from 'lucide-react';

interface PlanBasedRouteProps {
  children: React.ReactNode;
  requiredPlan: string;
}

const PlanBasedRoute: React.FC<PlanBasedRouteProps> = ({ children, requiredPlan }) => {
  const { user, loading: authLoading } = useAuth();
  const { getPlanName, hasPlanActive } = useUserCache();
  const { isTrialActive, loading: trialLoading } = useTrialManager();

  if (authLoading || trialLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Para chat-trial: verificar se o trial está ativo
  if (requiredPlan === 'trial') {
    if (isTrialActive) {
      return <>{children}</>;
    } else {
      return <Navigate to="/profile" replace />;
    }
  }

  // Para outros chats: verificar plano ativo
  const userPlanName = getPlanName();
  const isUserPlanActive = hasPlanActive();

  if (!isUserPlanActive || !userPlanName) {
    return <Navigate to="/profile" replace />;
  }

  // Mapear planos para suas páginas de chat correspondentes
  const planToChatMap: { [key: string]: string } = {
    'Text & Audio': 'text-audio',
    'Text Only': 'text-only',
    'Premium': 'premium',
    'Ultimate': 'ultimate'
  };

  const userChatType = planToChatMap[userPlanName];
  
  // Se o usuário tem o plano correto para esta página, permitir acesso
  if (userChatType === requiredPlan) {
    return <>{children}</>;
  }

  // Se não tem o plano correto, redirecionar para profile
  return <Navigate to="/profile" replace />;
};

export default PlanBasedRoute;
