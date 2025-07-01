
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic, Plus } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { useVoiceCredits } from '@/hooks/useVoiceCredits';
import { cn } from '@/lib/utils';
import VoiceCallModal from './VoiceCallModal';

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

  useEffect(() => {
    console.log('%c--- VoiceCallButton FOI MONTADO (CRIADO) ---', 'color: green; font-weight: bold;');
    return () => {
      console.log('%c--- VoiceCallButton FOI DESTRUÍDO ---', 'color: red; font-weight: bold;');
    };
  }, []);

  const handleVoiceCreditsRequest = () => {
    console.log('VoiceCallButton: Solicitando créditos de voz via callback direto');
    if (onRequestVoiceCredits) {
      onRequestVoiceCredits();
    }
  };

  const handleClick = async () => {
    if (isConnected) {
      await endCall();
      setShowModal(false);
    } else {
      console.log('VoiceCallButton: Tentando iniciar chamada de voz', { hasCredits, credits });
      
      if (credits <= 0) {
        console.log('VoiceCallButton: Sem créditos de voz, chamando callback direto');
        handleVoiceCreditsRequest();
        return;
      }
      
      const creditConsumed = await consumeCredit();
      if (!creditConsumed) {
        console.log('VoiceCallButton: Falha ao consumir crédito de voz, chamando callback direto');
        handleVoiceCreditsRequest();
        return;
      }
      
      console.log('VoiceCallButton: Crédito consumido com sucesso, iniciando chamada');
      setShowModal(true);
      await startCall();
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setShowModal(false);
  };

  const getIcon = () => {
    if (isConnecting) return <Loader2 size={20} className="animate-spin" />;
    if (isConnected && isSpeaking) return <Mic size={20} className="animate-pulse" />;
    if (isConnected) return <PhoneOff size={20} />;
    return <Phone size={20} />;
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0",
            isConnected && isSpeaking && "bg-green-600 hover:bg-green-700 animate-pulse",
            isConnected && !isSpeaking && "bg-red-600 hover:bg-red-700"
          )}
          onClick={handleClick}
          disabled={isConnecting}
        >
          {getIcon()}
        </Button>
        
        {credits <= 0 && !isConnected && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-30 rounded-full cursor-pointer flex items-center justify-center z-10"
            onClick={(e) => {
              e.stopPropagation();
              console.log('VoiceCallButton: Máscara de voz clicada - chamando callback direto');
              handleVoiceCreditsRequest();
            }}
          >
            <Plus size={16} className="text-white" />
          </div>
        )}
        
        {!creditsLoading && (
          <span className="absolute -bottom-1 text-xs text-purple-400 font-medium bg-[#1a1d29] px-1 rounded">
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
    </>
  );
};

export default VoiceCallButton;
