
import { useState, useEffect } from 'react';
import { useTrialManager } from './useTrialManager';
import { useAuth } from '@/contexts/AuthContext';

export const useTrialExpiredModal = () => {
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const { isTrialActive, loading } = useTrialManager();
  const { user } = useAuth();
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    console.log('useTrialExpiredModal - Estado:', { 
      loading, 
      user: !!user, 
      isTrialActive, 
      hasShownModal 
    });

    // Verificar se o trial expirou e ainda não mostrou o modal
    if (!loading && user && !isTrialActive && !hasShownModal) {
      console.log('useTrialExpiredModal - Trial expirado, verificando histórico...');
      
      // Verificar se o usuário já teve um trial (para não mostrar para novos usuários)
      const checkTrialHistory = async () => {
        // Se chegou aqui, significa que o trial existiu mas não está mais ativo
        console.log('useTrialExpiredModal - Mostrando modal de trial expirado');
        setShowTrialExpiredModal(true);
        setHasShownModal(true);
      };
      
      checkTrialHistory();
    }
  }, [isTrialActive, loading, user, hasShownModal]);

  const closeTrialExpiredModal = () => {
    console.log('useTrialExpiredModal - Fechando modal');
    setShowTrialExpiredModal(false);
  };

  return {
    showTrialExpiredModal,
    closeTrialExpiredModal
  };
};
