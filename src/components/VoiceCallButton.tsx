
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2, Mic } from 'lucide-react';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { cn } from '@/lib/utils';

const VoiceCallButton: React.FC = () => {
  const { 
    isConnecting, 
    isConnected, 
    isSpeaking, 
    startCall, 
    endCall 
  } = useElevenLabsConversation();

  const handleClick = () => {
    if (isConnected) {
      endCall();
    } else {
      startCall();
    }
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
  );
};

export default VoiceCallButton;
