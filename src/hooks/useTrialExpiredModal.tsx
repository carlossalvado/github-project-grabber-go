
import { useState, useEffect } from 'react';
import { useTrialManager } from './useTrialManager';
import { useAuth } from '@/contexts/AuthContext';

export const useTrialExpiredModal = () => {
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const { isTrialActive, loading } = useTrialManager();
  const { user } = useAuth();
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    // Verificar se o trial expirou e ainda não mostrou o modal
    if (!loading && user && !isTrialActive && !hasShownModal) {
      // Verificar se o usuário já teve um trial (para não mostrar para novos usuários)
      const checkTrialHistory = async () => {
        // Se chegou aqui, significa que o trial existiu mas não está mais ativo
        setShowTrialExpiredModal(true);
        setHasShownModal(true);
      };
      
      checkTrialHistory();
    }
  }, [isTrialActive, loading, user, hasShownModal]);

  const closeTrialExpiredModal = () => {
    setShowTrialExpiredModal(false);
  };

  return {
    showTrialExpiredModal,
    closeTrialExpiredModal
  };
};
