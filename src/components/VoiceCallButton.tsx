import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { useVoiceCredits } from '@/hooks/useVoiceCredits';
import { cn } from '@/lib/utils';
import VoiceCallModal from './VoiceCallModal';
import VoiceCreditsModal from './VoiceCreditsModal';
import { toast } from 'sonner'; // Importar o toast para dar feedback

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

  // MODIFICADO: A lógica de verificação de crédito foi removida daqui
  // pois a máscara cuidará disso.
  const handleClick = async () => {
    if (isConnected) {
      await endCall();
      setShowModal(false);
      return;
    }
    
    // Se chegamos aqui, a máscara não estava ativa, então tentamos consumir o crédito.
    const creditConsumed = await consumeCredit();
    if (!creditConsumed) {
      console.log('Falha ao consumir crédito de voz, abrindo modal de compra como fallback.');
      toast.error("Ocorreu uma falha ao usar seu crédito.");
      setShowCreditsModal(true); // Abre o modal como um plano B
      return;
    }
    
    console.log('Crédito de voz consumido, iniciando chamada.');
    setShowModal(true);
    await startCall();
  };

  const handleEndCall = async () => {
    await endCall();
    setShowModal(false);
  };
  
  // ADICIONADO: Handler para o clique na máscara
  const handleMaskClick = () => {
    console.log('Máscara clicada, abrindo modal de compra de créditos de voz.');
    setShowCreditsModal(true);
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
      {/* 1. Adicionamos 'relative' para posicionar a máscara sobre este container */}
      <div className="relative flex flex-col items-center gap-1">
      
        {/* 2. A MÁSCARA: Este é o novo elemento. */}
        {/* Ele só aparece se 'hasCredits' for falso. */}
        {!hasCredits && !creditsLoading && (
          <div
            className="absolute inset-0 z-10 cursor-pointer rounded-md"
            onClick={handleMaskClick}
            title="Comprar créditos de voz"
          />
        )}
        
        <Button
          variant={isConnected ? "destructive" : "default"}
          size="sm"
          onClick={handleClick}
          disabled={isConnecting}
          className={cn(
            "flex items-center gap-2 transition-all",
            isConnected && isSpeaking && "bg-green-600 hover:bg-green-700",
            isConnected && !isSpeaking && "bg-red-600 hover:bg-red-700",
            // 3. Adicionamos um feedback visual de opacidade se não houver créditos
            !hasCredits && !creditsLoading && "opacity-50"
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

      {/* Este é o modal que será aberto pela máscara */}
      <VoiceCreditsModal
        isOpen={showCreditsModal}
        onClose={handleCreditsModalClose}
        currentCredits={credits}
      />
    </>
  );
};

export default VoiceCallButton;