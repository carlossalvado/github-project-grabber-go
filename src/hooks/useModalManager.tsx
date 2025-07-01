
import { useState } from 'react';

export type ModalType = 'audioCredits' | 'voiceCredits' | 'none';

export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');

  const openAudioCreditsModal = () => {
    console.log('Abrindo modal de créditos de áudio');
    setActiveModal('audioCredits');
  };

  const openVoiceCreditsModal = () => {
    console.log('Abrindo modal de créditos de voz');
    setActiveModal('voiceCredits');
  };

  const closeModal = () => {
    console.log('Fechando modal');
    setActiveModal('none');
  };

  return {
    activeModal,
    openAudioCreditsModal,
    openVoiceCreditsModal,
    closeModal,
    isAudioCreditsOpen: activeModal === 'audioCredits',
    isVoiceCreditsOpen: activeModal === 'voiceCredits'
  };
};
