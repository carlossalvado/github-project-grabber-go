import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useCredits } from '@/hooks/useCredits';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import VoiceCallModal from '@/components/VoiceCallModal';

interface VoiceCallButtonProps {
  agentName: string;
  agentAvatar: string;
  onRequestVoiceCredits: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ agentName, agentAvatar, onRequestVoiceCredits }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { credits, consumeCredits, isLoading: creditsLoading } = useCredits();
  const { isConnecting, isConnected, isSpeaking, startCall, endCall } = useElevenLabsConversation();

  const VOICE_CALL_COST = 50;

  const handleCallClick = async () => {
    if (credits < VOICE_CALL_COST) {
      toast.error("Créditos insuficientes para iniciar uma chamada.");
      onRequestVoiceCredits();
      return;
    }

    const success = await consumeCredits(VOICE_CALL_COST);
    if (!success) {
      toast.error("Não foi possível debitar os créditos. Tente novamente.");
      return;
    }

    setIsModalOpen(true);
    await startCall();
  };

  const handleEndCall = async () => {
    await endCall();
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
          onClick={handleCallClick}
          disabled={isConnecting || isConnected}
        >
          {(isConnecting || isConnected) ? <Loader2 className="animate-spin" /> : <Phone />}
        </Button>
        
        {credits < VOICE_CALL_COST && !isConnecting && !isConnected && (
          <div
            className="absolute inset-0 bg-black bg-opacity-30 rounded-full cursor-pointer flex items-center justify-center"
            onClick={onRequestVoiceCredits}
          >
            <ShieldAlert size={16} className="text-white" />
          </div>
        )}

        {!creditsLoading && (
          <span className="absolute -bottom-1 text-xs text-green-400 font-medium bg-[#1a1d29] px-1 rounded">
            {credits}
          </span>
        )}
      </div>

      <VoiceCallModal
        isOpen={isModalOpen}
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