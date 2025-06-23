
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCache } from '@/hooks/useUserCache';
import { useTrialManager } from '@/hooks/useTrialManager';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { plan } = useUserCache();
  const { isTrialActive, loading: trialLoading } = useTrialManager();
  const location = useLocation();
  
  // Show loading state while checking auth
  if (loading || trialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login/landing
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Get current path
  const currentPath = location.pathname;

  // Mapeamento de planos para rotas permitidas
  const getAllowedRoutes = () => {
    // Se tem trial ativo, permitir acesso às rotas de trial
    if (isTrialActive) {
      return ['/chat-trial', '/profile', '/plan', '/basic-plan', '/premium-plan', '/ultimate-plan'];
    }

    // Se tem plano ativo, verificar qual plano
    if (plan && plan.plan_active) {
      const planName = plan.plan_name?.toLowerCase();
      
      if (planName?.includes('text') && planName?.includes('audio')) {
        return ['/chat-text-audio', '/profile', '/plan'];
      }
      
      // Para outros planos ativos, permitir pelo menos profile e plan
      return ['/profile', '/plan'];
    }

    // Se não tem plano ativo, permitir apenas páginas de seleção de plano e perfil
    return ['/profile', '/plan', '/selected-plan', '/free-plan', '/basic-plan', '/premium-plan', '/ultimate-plan'];
  };

  // Mapeamento de planos para rota principal (fallback)
  const getFallbackRoute = () => {
    if (isTrialActive) {
      return '/chat-trial';
    }

    if (plan && plan.plan_active) {
      const planName = plan.plan_name?.toLowerCase();
      
      if (planName?.includes('text') && planName?.includes('audio')) {
        return '/chat-text-audio';
      }
    }

    return '/profile';
  };

  const allowedRoutes = getAllowedRoutes();
  const fallbackRoute = getFallbackRoute();

  console.log('ProtectedRoute - Current path:', currentPath);
  console.log('ProtectedRoute - Allowed routes:', allowedRoutes);
  console.log('ProtectedRoute - Trial active:', isTrialActive);
  console.log('ProtectedRoute - Plan data:', plan);

  // Se a rota atual é permitida, renderizar o conteúdo
  if (allowedRoutes.includes(currentPath)) {
    return <>{children}</>;
  }

  // Se a rota não é permitida, redirecionar para a rota principal do plano
  console.log('ProtectedRoute - Redirecting to fallback:', fallbackRoute);
  return <Navigate to={fallbackRoute} replace />;
};

export default ProtectedRoute;
