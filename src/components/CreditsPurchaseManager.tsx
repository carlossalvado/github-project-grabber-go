
import React from 'react';
import AudioCreditsPurchaseModal from './AudioCreditsPurchaseModal';
import VoiceCreditsPurchaseModal from './VoiceCreditsPurchaseModal';
import { useModalManager, ModalType } from '@/hooks/useModalManager';

interface CreditsPurchaseManagerProps {
  activeModal: ModalType;
  onClose: () => void;
}

const CreditsPurchaseManager: React.FC<CreditsPurchaseManagerProps> = ({
  activeModal,
  onClose
}) => {
  return (
    <>
      <AudioCreditsPurchaseModal
        isOpen={activeModal === 'audioCredits'}
        onClose={onClose}
      />
      
      <VoiceCreditsPurchaseModal
        isOpen={activeModal === 'voiceCredits'}
        onClose={onClose}
      />
    </>
  );
};

export default CreditsPurchaseManager;
