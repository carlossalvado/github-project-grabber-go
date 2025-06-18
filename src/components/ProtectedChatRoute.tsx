
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
  const normalizedRequiredPlan = requiredPlan.toLowerCase();

  // Verificar se o usuário tem acesso ao chat específico
  const hasAccess = userPlanName.includes(normalizedRequiredPlan) || 
                   (normalizedRequiredPlan === 'trial' && userPlanName.includes('ultimate'));

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
            Este chat requer o plano: <span className="text-purple-400">{requiredPlan}</span>
          </p>
          <Button
            onClick={() => window.location.href = '/profile'}
            className="bg-red-600 hover:bg-red-700"
          >
            Voltar ao Perfil
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedChatRoute;
