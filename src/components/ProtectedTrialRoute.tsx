
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialManager } from '@/hooks/useTrialManager';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedTrialRouteProps {
  children: React.ReactNode;
}

const ProtectedTrialRoute: React.FC<ProtectedTrialRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isTrialActive, loading: trialLoading, hoursRemaining } = useTrialManager();

  if (authLoading || trialLoading) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          <p>Verificando acesso ao trial...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isTrialActive) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Trial Expirado</h2>
          <p className="text-gray-300 mb-6">
            Seu trial de 72 horas expirou. Escolha um plano para continuar!
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Escolher Plano
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedTrialRoute;
