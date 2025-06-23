
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

  console.log('PlanBasedRoute - Dados:', {
    requiredPlan,
    user: !!user,
    authLoading,
    trialLoading,
    isTrialActive,
    userPlanName: getPlanName(),
    isUserPlanActive: hasPlanActive()
  });

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
    console.log('PlanBasedRoute - Usuário não logado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Para chat-trial: verificar se o trial está ativo
  if (requiredPlan === 'trial') {
    console.log('PlanBasedRoute - Verificando acesso ao trial:', { isTrialActive });
    if (isTrialActive) {
      console.log('PlanBasedRoute - Trial ativo, permitindo acesso');
      return <>{children}</>;
    } else {
      console.log('PlanBasedRoute - Trial inativo, redirecionando para profile');
      return <Navigate to="/profile" replace />;
    }
  }

  // Para outros chats: verificar plano ativo
  const userPlanName = getPlanName();
  const isUserPlanActive = hasPlanActive();

  console.log('PlanBasedRoute - Verificando plano:', { userPlanName, isUserPlanActive });

  if (!isUserPlanActive || !userPlanName) {
    console.log('PlanBasedRoute - Plano inativo ou inexistente, redirecionando para profile');
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
  
  console.log('PlanBasedRoute - Mapeamento:', { 
    userPlanName, 
    userChatType, 
    requiredPlan,
    hasAccess: userChatType === requiredPlan
  });
  
  // Se o usuário tem o plano correto para esta página, permitir acesso
  if (userChatType === requiredPlan) {
    console.log('PlanBasedRoute - Acesso permitido!');
    return <>{children}</>;
  }

  // Se não tem o plano correto, redirecionar para profile
  console.log('PlanBasedRoute - Plano incompatível, redirecionando para profile');
  return <Navigate to="/profile" replace />;
};

export default PlanBasedRoute;
