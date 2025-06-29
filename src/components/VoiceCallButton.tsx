
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { useVoiceCredits } from '@/hooks/useVoiceCredits';
import { cn } from '@/lib/utils';
import VoiceCallModal from './VoiceCallModal';
import VoiceCreditsModal from './VoiceCreditsModal';

interface VoiceCallButtonProps {
  agentName?: string;
  agentAvatar?: string;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({
  agentName = 'Isa',
  agentAvatar = '/lovable-uploads/05b895be-b990-44e8-970d-590610ca6e4d.png'
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

  const handleClick = async () => {
    if (isConnected) {
      await endCall();
      setShowModal(false);
    } else {
      console.log('Tentando iniciar chamada de voz', { hasCredits, credits });
      
      // Verificar se tem créditos disponíveis ANTES de tentar iniciar a chamada
      if (!hasCredits) {
        console.log('Sem créditos de voz, abrindo modal de compra');
        setShowCreditsModal(true);
        return;
      }
      
      // Consumir crédito ANTES de iniciar a chamada
      const creditConsumed = await consumeCredit();
      if (!creditConsumed) {
        console.log('Falha ao consumir crédito de voz, abrindo modal de compra');
        setShowCreditsModal(true);
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
    // Atualizar créditos quando o modal fechar
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
      <div className="flex flex-col items-center gap-1">
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
