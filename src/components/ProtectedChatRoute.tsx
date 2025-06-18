
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedChatRouteProps {
  children: React.ReactNode;
  requiredPlan: string;
  chatType: string;
}

const ProtectedChatRoute: React.FC<ProtectedChatRouteProps> = ({ 
  children, 
  requiredPlan, 
  chatType 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { plan, hasPlanActive, getPlanName } = useUserCache();

  if (authLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <p>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se tem plano ativo
  if (!hasPlanActive()) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhum Plano Ativo</h2>
          <p className="text-gray-300 mb-6">
            Você precisa de um plano ativo para acessar o chat.
          </p>
          <Button
            onClick={() => window.location.href = '/profile'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Ir para Perfil
          </Button>
        </div>
      </div>
    );
  }

  const userPlanName = getPlanName()?.toLowerCase() || '';

  // Mapear planos para suas páginas de chat correspondentes
  const planToRoute: { [key: string]: string } = {
    'trial': '/chat-trial',
    'text only': '/chat-text-only',
    'text & audio': '/chat-text-audio',
    'premium': '/chat-premium'
  };

  // Encontrar a rota correta para o plano do usuário
  let correctRoute = '';
  for (const [planKey, route] of Object.entries(planToRoute)) {
    if (userPlanName.includes(planKey)) {
      correctRoute = route;
      break;
    }
  }

  // Se não encontrou rota correspondente, redirecionar para perfil
  if (!correctRoute) {
    return <Navigate to="/profile" replace />;
  }

  // Se o usuário está tentando acessar uma página que não corresponde ao seu plano
  const currentPath = window.location.pathname;
  if (currentPath !== correctRoute) {
    return <Navigate to={correctRoute} replace />;
  }

  // Verificar se o usuário tem acesso ao chat específico
  const normalizedRequiredPlan = requiredPlan.toLowerCase();
  const hasAccess = userPlanName.includes(normalizedRequiredPlan);

  if (!hasAccess) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-300 mb-2">
            Seu plano atual: <span className="text-purple-400">{getPlanName()}</span>
          </p>
          <p className="text-gray-300 mb-6">
            Redirecionando para o chat do seu plano...
          </p>
          <Button
            onClick={() => window.location.href = correctRoute}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Ir para Meu Chat
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedChatRoute;
