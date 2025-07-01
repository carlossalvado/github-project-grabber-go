
import { useState } from 'react';

export type ModalType = 'audioCredits' | 'voiceCredits' | 'none';

export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');

  const openAudioCreditsModal = () => {
    console.log('useModalManager: Abrindo modal de créditos de áudio');
    setActiveModal('audioCredits');
  };

  const openVoiceCreditsModal = () => {
    console.log('useModalManager: Abrindo modal de créditos de voz');
    setActiveModal('voiceCredits');
  };

  const closeModal = () => {
    console.log('useModalManager: Fechando modal');
    setActiveModal('none');
  };

  // Log do estado atual para debug
  console.log('useModalManager: Estado atual do modal:', activeModal);

  return {
    activeModal,
    openAudioCreditsModal,
    openVoiceCreditsModal,
    closeModal,
    isAudioCreditsOpen: activeModal === 'audioCredits',
    isVoiceCreditsOpen: activeModal === 'voiceCredits'
  };
};
