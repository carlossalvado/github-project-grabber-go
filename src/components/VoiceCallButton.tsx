
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { cn } from '@/lib/utils';
import VoiceCallModal from './VoiceCallModal';

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

  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (isConnected) {
      await endCall();
      setShowModal(false);
    } else {
      setShowModal(true);
      await startCall();
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setShowModal(false);
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
