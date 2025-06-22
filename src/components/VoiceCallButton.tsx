
import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import { useElevenLabsWidget } from '@/hooks/useElevenLabsWidget';

const VoiceCallButton: React.FC = () => {
  const { isWidgetActive, isLoading, initializeWidget, endCall } = useElevenLabsWidget();

  const handleClick = () => {
    if (isWidgetActive) {
      endCall();
    } else {
      initializeWidget();
    }
  };

  return (
    <Button
      variant={isWidgetActive ? "destructive" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isWidgetActive ? (
        <PhoneOff size={16} />
      ) : (
        <Phone size={16} />
      )}
      {isLoading ? 'Conectando...' : isWidgetActive ? 'Encerrar Chamada' : 'Chamada de Voz'}
    </Button>
  );
};

export default VoiceCallButton;
