
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic, Plus } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { useVoiceCredits } from '@/hooks/useVoiceCredits';
import { cn } from '@/lib/utils';
import VoiceCallModal from './VoiceCallModal';
import VoiceCreditsModal from './VoiceCreditsModal';

interface VoiceCallButtonProps {
  agentName?: string;
  agentAvatar?: string;
  onRequestVoiceCredits?: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({
  agentName = 'Isa',
  agentAvatar = '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png',
  onRequestVoiceCredits
}) => {
  const { 
    isConnecting, 
    isConnected, 
    isSpeaking, 
    startCall, 
    endCall 
  } = useElevenLabsConversation();

  const { credits, hasCredits, consumeCredit, refreshCredits, isLoading: creditsLoading } = useVoiceCredits();

  const [showModal, setShowModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // ******************************************************
  // ** CÓDIGO DE TESTE ADICIONADO AQUI **
  // ******************************************************
  useEffect(() => {
    console.log('%c--- VoiceCallButton FOI MONTADO (CRIADO) ---', 'color: green; font-weight: bold;');
    return () => {
      console.log('%c--- VoiceCallButton FOI DESMONTADO (DESTRUÍDO) ---', 'color: red; font-weight: bold;');
    };
  }, []); // O array vazio [] é MUITO importante!
  // ******************************************************

  const handleVoiceCreditsRequest = () => {
    console.log('Solicitando créditos de voz via callback');
    if (onRequestVoiceCredits) {
      onRequestVoiceCredits();
    }
  };

  const handleClick = async () => {
    if (isConnected) {
      await endCall();
      setShowModal(false);
    } else {
      console.log('Tentando iniciar chamada de voz', { hasCredits, credits });
      
      if (credits <= 0) {
        console.log('Sem créditos de voz, solicitando abertura de modal');
        handleVoiceCreditsRequest();
        return;
      }
      
      const creditConsumed = await consumeCredit();
      if (!creditConsumed) {
        console.log('Falha ao consumir crédito de voz, solicitando abertura de modal');
        handleVoiceCreditsRequest();
        return;
      }
      
      console.log('Crédito consumido com sucesso, iniciando chamada');
      setShowModal(true);
      await startCall();
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setShowModal(false);
  };

  const handleCreditsModalClose = () => {
    setShowCreditsModal(false);
    refreshCredits();
  };

  const getButtonText = () => {
    if (isConnecting) return 'Conectando...';
    if (isConnected) return 'Encerrar Chamada';
    return 'Chamada de Voz';
  };

  const getIcon = () => {
    if (isConnecting) return <Loader2 size={16} className="animate-spin" />;
    if (isConnected && isSpeaking) return <Mic size={16} className="animate-pulse" />;
    if (isConnected) return <PhoneOff size={16} />;
    return <Phone size={16} />;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-1 relative">
        <Button
          variant={isConnected ? "destructive" : "default"}
          size="sm"
          onClick={handleClick}
          disabled={isConnecting}
          className={cn(
            "flex items-center gap-2 transition-all",
            isConnected && isSpeaking && "bg-green-600 hover:bg-green-700",
            isConnected && !isSpeaking && "bg-red-600 hover:bg-red-700"
          )}
        >
          {getIcon()}
          {getButtonText()}
        </Button>
        
        {credits <= 0 && !isConnected && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-30 rounded cursor-pointer flex items-center justify-center z-10"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Máscara de voz clicada - solicitando abertura de modal');
              handleVoiceCreditsRequest();
            }}
          >
            <Plus size={12} className="text-white" />
          </div>
        )}
        
        {!creditsLoading && (
          <span className="text-xs text-purple-400 font-medium">
            {credits}
          </span>
        )}
      </div>

      <VoiceCallModal
        isOpen={showModal}
        onEndCall={handleEndCall}
        agentName={agentName}
        agentAvatar={agentAvatar}
        isConnected={isConnected}
        isSpeaking={isSpeaking}
        isConnecting={isConnecting}
      />

      <VoiceCreditsModal
        isOpen={showCreditsModal}
        onClose={handleCreditsModalClose}
        currentCredits={credits}
      />
    </>
  );
};

export default VoiceCallButton;
