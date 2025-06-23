
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialManager } from '@/hooks/useTrialManager';
import { useTrialExpiredModal } from '@/hooks/useTrialExpiredModal';
import { Loader2 } from 'lucide-react';
import TrialExpiredModal from './TrialExpiredModal';

interface ProtectedTrialRouteProps {
  children: React.ReactNode;
}

const ProtectedTrialRoute: React.FC<ProtectedTrialRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isTrialActive, loading: trialLoading } = useTrialManager();
  const { showTrialExpiredModal, closeTrialExpiredModal } = useTrialExpiredModal();

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
      <>
        <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Trial Expirado</h2>
            <p className="text-gray-300 mb-6">
              Seu trial de 72 horas expirou. Escolha um plano para continuar!
            </p>
          </div>
        </div>
        
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={closeTrialExpiredModal}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <TrialExpiredModal
        isOpen={showTrialExpiredModal}
        onClose={closeTrialExpiredModal}
      />
    </>
  );
};

export default ProtectedTrialRoute;
